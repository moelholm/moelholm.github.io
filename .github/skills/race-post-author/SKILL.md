---
name: race-post-author
description: "Create and edit running race blog posts (full race reports and nano-race-note posts) for moelholm.github.io, including gathering race data from Strava/Mastodon/calendar, updating race_calendar, and resizing/cropping race photos. Use when: writing a new race blog post, creating a nano/mini race note, processing race photos, or updating race results."
argument-hint: "Specify the race name and whether it should be a nano-race-note or full post"
---

# Running Race Post Author (`moelholm.github.io`)

Create engaging, enthusiastic running race blog posts (either compact `nano-race-note` posts or full race reports) in `site/blog_collections/_running/`.

## When to Use

- The user asks to create a new running race blog post, mini post, or nano post (`nano-race-note`)
- The user uploads race photos to be converted, cropped, and placed into a race post
- The user wants to update race metadata or mark a race as completed in `site/race_calendar_YYYY.md`

## Step-by-Step Procedure

### 0. Start the Dev Server First

Always make sure the Jekyll dev server is running at the start of a race-post session, without being asked:
- Check `lsof -i :4000 -sTCP:LISTEN -t`; if nothing is listening, start `./tools/dev-server.sh` in async mode.
- Give the user the preview path (`/blog/running/YYYY/MM/DD/race_name`) as soon as the draft exists.

### 1. Proactively Gather Race Data (Before Asking the User)

Automatically extract the race details from the repository before asking the user for missing information:

1. **Race Calendar**: Check `site/race_calendar_YYYY.md` for `date` (`race_date`), `distance`, and `url` (`race_website`).
2. **Strava & Mastodon Collections**: Check `site/blog_collections/_activities/` and `site/blog_collections/_toots/` around `race_date` for:
   - Strava activity (`id`, `distance_m`, `elevation_gain_m`, `elapsed_time_s`, and personal race notes in `description` such as official time, position, weather, bonks, aid station shoutouts).
   - Mastodon toots from race day and the day after.
3. **Git History for Older Races (Crucial in Codespaces)**:
   - `_activities` and `_toots` only keep the 10 most recent items, and Codespaces clones are shallow (`grafted`).
   - If `race_date` is older than the current 10-item window, fetch git history back to the race date and inspect commits from race week:
     ```bash
     git fetch --shallow-since="<race_date_minus_1_day>" origin master
     git log --since="<race_date>" --until="<race_date_plus_4_days>" --oneline -- site/blog_collections/_activities/ site/blog_collections/_toots/
     ```
   - Read the exact activity and toot files from those commits using `git show <commit>:site/blog_collections/_activities/...` and `git show <commit>:site/blog_collections/_toots/...`.
4. **Previous Editions**: Search `site/blog_collections/_running/` for previous editions of the same race to link back and compare times/experiences naturally.

### 2. Update the Race Calendar

In `site/race_calendar_YYYY.md`, update the race entry:
- Set `blog_url: "/blog/running/YYYY/MM/DD/race_name"` (matching the blog post `date`, not `race_date`)
- Set `status: "completed"`

### 3. Create the Blog Post File

- **File path**: `site/blog_collections/_running/<blog-post-date>-race_name.md` (e.g. `2026-10-24-race_mors_100_miles.md`)
- Use the blog post publication `date` in the filename (which determines the permalink `/blog/running/YYYY/MM/DD/race_name`).
- The `date` time must already be in the past (convert to UTC) when the PR is merged. Jekyll skips future-dated posts, but the calendar's `blog_url` still links to them, which gives a 404 on the live site.

#### Front Matter Structure

```yaml
---
layout: post
title: "Race Name Year"
description: "Race notes for Race Name Year"
date: YYYY-MM-DD HH:MM:SS +0200
race_date: YYYY-MM-DD
comments: true
tags: race running ultrarunning nano-race-note  # omit nano-race-note for full posts; use halfmarathon/marathon/trailrunning as appropriate
distance_km: 160  # integer km
elevation_gain_m: 1423  # optional if negligible
duration_formatted: '17h47m18s'  # official / elapsed time, NEVER moving time
race_results_official: "URL"
race_results_strava: "https://www.strava.com/activities/<strava_id>/overview"
race_website: "URL"
---
```

#### Race Summary Table Include

Place immediately after the intro paragraph:

```liquid
{% capture rows %}
Race|Race Name Year;
Date|{{ page.race_date }};
Www|[{{ page.race_website }}]({{ page.race_website }});
Type|Road;
Position|X of Y finishers;
Duration|{{ page.duration_formatted }};
Distance|{{ page.distance_km }}k;
{% endcapture %}
{% assign rows_array = rows | split: ";" %}
{% include blog_race_summary.html rows=rows_array %}
```

- Do NOT include DNF/DNS counts in `Position`.
- Do NOT use `(no trails)` clarifications in `Type`.

---

### 4. Choose Post Structure: `nano-race-note` vs Full Report

#### Option A: `nano-race-note` Structure (Compact Mini Post)

Keep the structure tight and punchy:
1. **Intro sentence**: 1–2 sentences introducing the race and linking to previous year(s) if applicable.
2. **Race summary include**: `{% include blog_race_summary.html rows=rows_array %}`
3. **`### Nano Summary ⚡️`**: 1–2 short paragraphs covering the official time/PB comparison, weather/bonks, volunteer appreciation, and friend/family surprises.
4. **`### Impressions 📸`**: Short bold emoji-first lead-ins with photo tables split into even 2-image rows:
   ```liquid
   ### Impressions 📸

   <strong>🚌 Pre-race...</strong>

   {% capture _photos %}
   2026-09-12_001_small.jpg
   2026-09-12_002_small.jpg
   {% endcapture %}
   {% include blog_race_photo_table.html images=_photos %}

   <strong>🚀 Race...</strong>

   {% capture _photos %}
   2026-09-12_003_small.jpg
   2026-09-12_004_small.jpg
   {% endcapture %}
   {% include blog_race_photo_table.html images=_photos %}

   <strong>🏅 Post-race...</strong>

   {% capture _photos %}
   2026-09-12_005_small.jpg
   2026-09-12_006_small.jpg
   {% endcapture %}
   {% include blog_race_photo_table.html images=_photos %}
   ```
5. **`### Recommended? 👏🏻`**: Enthusiastic recommendation in fluent prose ending with a standalone star-rating line (e.g., `This one gets my top rating: ⭐️⭐️⭐️⭐️⭐️`).

#### Option B: Full Race Report Structure

1. **Introduction & Race Summary Table**
2. **Pre-race / Race Narrative**: Chronological first-person storytelling with year-over-year comparisons woven naturally into the text, plus photo tables (`{% include blog_race_photo_table.html images=_photos %}`) placed chronologically.
3. **Volunteer Appreciation & Finish / Recovery**
4. **`### Recommended? 👏🏻`**: Fluent recommendation ending with star rating.

---

### 5. Photo Processing Workflow

1. **Image Folder**: Store images in `site/img_running/<blog-post-date>/` using the post `date` (NOT `race_date`), because `site/_includes/blog_race_photo_table.html` resolves `/img_running/{{ page.date | date: "%Y-%m-%d" }}/`.
2. **Convert everything to exactly 600×450** (HEIC/PNG/JPG; do NOT rely on CSS to equalize heights):
   - **Landscape photos** (`w >= h`): cover-crop (scale to fill, center-crop).
   - **Portrait photos and screenshots** (any orientation): never crop — keep the whole image (contain-fit) centered on a blurred cover-crop of itself. Cropping portraits cuts off heads and screenshot content. Screenshots are detected as PNGs or images without an EXIF camera `Make`.
   ```python
   import os, re
   from PIL import Image, ImageOps, ImageFilter
   import pillow_heif
   pillow_heif.register_heif_opener()

   src_dir = '<upload_folder>'
   out_dir = 'site/img_running/<blog-post-date>/'
   race_date = '<race_date>'
   tw, th = 600, 450
   os.makedirs(out_dir, exist_ok=True)
   written = set()
   for f in sorted(os.listdir(src_dir)):
       if f.startswith('.'):
           continue
       src = Image.open(os.path.join(src_dir, f))
       is_screenshot = f.lower().endswith('.png') or not src.getexif().get(271)
       im = ImageOps.exif_transpose(src).convert('RGB')
       w, h = im.size
       s = max(tw / w, th / h)
       cover = im.resize((round(w * s), round(h * s)), Image.Resampling.LANCZOS)
       l, t = (cover.width - tw) // 2, (cover.height - th) // 2
       out = cover.crop((l, t, l + tw, t + th))
       if h > w or is_screenshot:
           out = out.filter(ImageFilter.GaussianBlur(18))
           fg = im.copy()
           fg.thumbnail((tw, th), Image.Resampling.LANCZOS)
           out.paste(fg, ((tw - fg.width) // 2, (th - fg.height) // 2))
       stem = re.sub(r'^img_?', '', os.path.splitext(f)[0].lower())
       stem = re.sub(r'[^a-z0-9_-]+', '_', stem)
       name = f'{race_date}_{stem}_small.jpg'
       if name in written or os.path.exists(os.path.join(out_dir, name)):
           raise SystemExit(f'Refusing to overwrite {name} (from {f})')
       written.add(name)
       out.save(os.path.join(out_dir, name), 'JPEG', quality=95, optimize=True, progressive=True)
   ```
3. **Flag questionable photos — ask, don't decide silently**: Before placing photos, review EXIF date/GPS and a contact sheet, then present a short list of photos that may not belong and let the user answer yes/no per photo. Flag:
   - Photos taken outside the race trip (e.g. at home, the day before departure) by EXIF timestamp/GPS
   - Near-duplicates of the same motif (suggest which one to keep)
   - Off-topic or low-value shots (blurry, accidental, unrelated)
   - Portraits where a person may end up awkwardly framed
   Only include/exclude flagged photos after the user confirms.
   Split photos into Pre-race / Race / Post-race by EXIF time against the Strava activity start (`date`) and finish (start + `elapsed_time_s`), not by guessing from the motif.
4. **Even grids**: Every `_photos` block must contain an even number of images so no table ends with a lonely single-image row. Rebalance across blocks after adding/removing photos.
5. **Clean Up**: Delete original source files from the workspace root/upload folder once converted.
6. **Inspecting Images (10-Image Model Limit)**:
   - Never call `view_image` on more than **10 images** in a single turn/conversation (the model supports a maximum of 10 images per request and will fail with `Too many images in request`).
   - Instead, inspect EXIF metadata via a Python script and, if visual inspection is needed, generate 1–2 composite contact sheets (thumbnails with filename labels in `/tmp/`) and view only those contact sheets.

### 6. Writing Style & Validation

- Casual, happy, enthusiastic first-person tone with liberal emoji use (🤩👏🏻🥳🚀🌧️🥶☕️🙏🏻🤠😅).
- Verify the site builds cleanly (`cd site && bundle exec jekyll build --config _config.yml,_config_dev.yml`) or verify via the running dev server (`./tools/dev-server.sh`).
