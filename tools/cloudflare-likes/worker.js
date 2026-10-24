// Matches Jekyll post permalinks: /blog/<collection>/<YYYY>/<MM>/<DD>/<slug>
const POST_SLUG_PATTERN =
  /^\/blog\/(running|software_engineering)\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9_-]{2,90}$/;

const ALLOWED_ORIGINS = new Set([
  'https://moelholm.com',
  'https://www.moelholm.com',
]);

// PR previews (pr-123--...) and deploy URLs (<id>--...) of this site's own Netlify project only
const NETLIFY_PREVIEW_ORIGIN = /^https:\/\/([a-z0-9-]+--)?aesthetic-gumption-80abac\.netlify\.app$/;

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  if (NETLIFY_PREVIEW_ORIGIN.test(origin)) return true;
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
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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

const MAX_REQUESTS_PER_MINUTE = 10;

// D1 runs a batch as one transaction, so concurrent requests cannot both slip under the limit
async function isRateLimited(env, voterHash) {
  const currentWindow = Math.floor(Date.now() / 60000);
  const [, countResult] = await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO rate_limits (voter_hash, window_start, request_count) VALUES (?1, ?2, 1)
       ON CONFLICT(voter_hash) DO UPDATE SET
         request_count = CASE WHEN window_start = excluded.window_start THEN request_count + 1 ELSE 1 END,
         window_start = excluded.window_start`
    ).bind(voterHash, currentWindow),
    env.DB.prepare('SELECT request_count FROM rate_limits WHERE voter_hash = ?1').bind(voterHash),
  ]);

  return (countResult.results?.[0]?.request_count ?? 0) > MAX_REQUESTS_PER_MINUTE;
}

// Recompute the total from voter rows, so it can never drift from the actual votes
function recountStatements(env, slug) {
  return [
    env.DB.prepare(
      `INSERT INTO post_likes (slug, likes)
         VALUES (?1, (SELECT COUNT(*) FROM post_voters WHERE slug = ?1))
       ON CONFLICT(slug) DO UPDATE SET likes = excluded.likes`
    ).bind(slug),
    env.DB.prepare('SELECT likes FROM post_likes WHERE slug = ?1').bind(slug),
  ];
}

// POST sets and DELETE removes the vote. Both are idempotent, so duplicate or overlapping
// requests always end in the state the visitor asked for.
async function handleSetLike(request, env, slug, voterHash, shouldLike) {
  const origin = request.headers.get('Origin') || '';
  if (!isAllowedOrigin(origin)) {
    return jsonResponse({ error: 'Forbidden origin' }, 403, request);
  }

  if (await isRateLimited(env, voterHash)) {
    return jsonResponse({ error: 'Too many requests' }, 429, request);
  }

  // A post_likes row exists only for posts verified against moelholm.com on their first like
  const knownPost = await env.DB.prepare('SELECT 1 FROM post_likes WHERE slug = ?1')
    .bind(slug)
    .first();

  if (!knownPost) {
    if (!shouldLike) {
      // Nothing to unlike; must not write, or the row would mark an unverified slug as known
      return jsonResponse({ slug, likes: 0, liked: false }, 200, request);
    }
    if (!(await postExistsOnSite(slug))) {
      return jsonResponse({ error: 'Unknown post' }, 404, request);
    }
  }

  const voteStatement = shouldLike
    ? env.DB.prepare('INSERT OR IGNORE INTO post_voters (slug, voter_hash) VALUES (?1, ?2)')
    : env.DB.prepare('DELETE FROM post_voters WHERE slug = ?1 AND voter_hash = ?2');

  // One D1 transaction, so a vote change is never stored without its recount
  const results = await env.DB.batch([
    voteStatement.bind(slug, voterHash),
    ...recountStatements(env, slug),
  ]);

  const likes = results[2].results?.[0]?.likes ?? 0;

  return jsonResponse({ slug, likes, liked: shouldLike }, 200, request);
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

    if (request.method === 'POST' || request.method === 'DELETE') {
      return handleSetLike(request, env, slug, voterHash, request.method === 'POST');
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  },
};
