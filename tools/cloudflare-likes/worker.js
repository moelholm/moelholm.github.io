// Matches Jekyll post permalinks: /blog/<collection>/<YYYY>/<MM>/<DD>/<slug>
const POST_SLUG_PATTERN =
  /^\/blog\/(running|software_engineering)\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9_-]{2,90}$/;

const ALLOWED_ORIGINS = new Set([
  'https://moelholm.com',
  'https://www.moelholm.com',
]);

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  return (
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:')
  );
}

function buildCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigin = isAllowedOrigin(origin) ? origin : 'https://moelholm.com';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function jsonResponse(body, status, request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...buildCorsHeaders(request),
    },
  });
}

function parsePostSlug(rawSlug) {
  if (!rawSlug || typeof rawSlug !== 'string') return null;
  const cleaned = rawSlug.trim().replace(/\.html$/i, '').replace(/\/+$/, '');
  return POST_SLUG_PATTERN.test(cleaned) ? cleaned : null;
}

// Hash only CF-Connecting-IP (set by Cloudflare's edge, cannot be spoofed by the client)
async function computeVoterHash(request, env) {
  const clientIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const secretSalt = env.LIKE_SALT || 'default-fallback-salt-override-in-secret';
  const bytes = new TextEncoder().encode(`${clientIp}:${secretSalt}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);

  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Verify that a brand-new slug actually exists on moelholm.com before creating its first database row
async function postExistsOnSite(slug) {
  try {
    const response = await fetch(`https://moelholm.com${slug}`, {
      method: 'HEAD',
      redirect: 'follow',
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function handleGetAllCounts(request, env) {
  const { results } = await env.DB.prepare(
    'SELECT slug, likes FROM post_likes WHERE likes > 0 LIMIT 500'
  ).all();

  const counts = {};
  for (const row of results || []) {
    counts[row.slug] = row.likes;
  }

  return jsonResponse({ counts }, 200, request);
}

async function handleGetSinglePost(request, env, slug, voterHash) {
  const [countResult, voteResult] = await env.DB.batch([
    env.DB.prepare('SELECT likes FROM post_likes WHERE slug = ?1').bind(slug),
    env.DB.prepare(
      'SELECT 1 AS liked FROM post_voters WHERE slug = ?1 AND voter_hash = ?2'
    ).bind(slug, voterHash),
  ]);

  const likes = countResult.results?.[0]?.likes ?? 0;
  const liked = Boolean(voteResult.results?.[0]?.liked);

  return jsonResponse({ slug, likes, liked }, 200, request);
}

async function handleToggleLike(request, env, slug, voterHash) {
  const origin = request.headers.get('Origin') || '';
  if (!isAllowedOrigin(origin)) {
    return jsonResponse({ error: 'Forbidden origin' }, 403, request);
  }

  // Throttle: max 10 likes/toggles per IP across the site within the last 60 seconds
  const recentVotes = await env.DB.prepare(
    "SELECT COUNT(*) AS cnt FROM post_voters WHERE voter_hash = ?1 AND created_at >= datetime('now', '-60 seconds')"
  )
    .bind(voterHash)
    .first();

  if ((recentVotes?.cnt ?? 0) >= 10) {
    return jsonResponse({ error: 'Too many requests' }, 429, request);
  }

  const existingVote = await env.DB.prepare(
    'SELECT 1 AS liked FROM post_voters WHERE slug = ?1 AND voter_hash = ?2'
  )
    .bind(slug, voterHash)
    .first();

  let liked;

  if (!existingVote) {
    // If this post has never been liked before, confirm the URL is a real published post on moelholm.com
    const knownPost = await env.DB.prepare(
      'SELECT 1 FROM post_likes WHERE slug = ?1'
    )
      .bind(slug)
      .first();

    if (!knownPost && !(await postExistsOnSite(slug))) {
      return jsonResponse({ error: 'Unknown post' }, 404, request);
    }

    await env.DB.batch([
      env.DB.prepare(
        'INSERT OR IGNORE INTO post_voters (slug, voter_hash) VALUES (?1, ?2)'
      ).bind(slug, voterHash),
      env.DB.prepare(
        'INSERT INTO post_likes (slug, likes) VALUES (?1, 1) ON CONFLICT(slug) DO UPDATE SET likes = likes + 1'
      ).bind(slug),
    ]);
    liked = true;
  } else {
    await env.DB.batch([
      env.DB.prepare(
        'DELETE FROM post_voters WHERE slug = ?1 AND voter_hash = ?2'
      ).bind(slug, voterHash),
      env.DB.prepare(
        'UPDATE post_likes SET likes = MAX(0, likes - 1) WHERE slug = ?1'
      ).bind(slug),
    ]);
    liked = false;
  }

  const updatedRow = await env.DB.prepare(
    'SELECT likes FROM post_likes WHERE slug = ?1'
  )
    .bind(slug)
    .first();

  return jsonResponse(
    { slug, likes: updatedRow?.likes ?? 0, liked },
    200,
    request
  );
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(request),
      });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/likes') {
      return jsonResponse({ error: 'Not found' }, 404, request);
    }

    const rawSlug = url.searchParams.get('slug');

    if (request.method === 'GET' && !rawSlug) {
      return handleGetAllCounts(request, env);
    }

    const slug = parsePostSlug(rawSlug);
    if (!slug) {
      return jsonResponse({ error: 'Invalid post slug' }, 400, request);
    }

    const voterHash = await computeVoterHash(request, env);

    if (request.method === 'GET') {
      return handleGetSinglePost(request, env, slug, voterHash);
    }

    if (request.method === 'POST') {
      return handleToggleLike(request, env, slug, voterHash);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  },
};
