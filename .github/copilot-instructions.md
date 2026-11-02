# Copilot instructions

- For running blog posts, store post images in `site/img_running/<blog-post-date>/` using the post `date` (not `race_date`) for the folder.
- For running blog post photo tables, make every image physically end up in the same landscape format (600x450 for race tables); do not rely on CSS alone to normalize portrait image heights. Cover-crop landscape photos; never crop portrait photos or screenshots — place the full image centered on a blurred cover-crop of itself.
- For running race photo tables, prefer `{% capture _photos %}` blocks with one filename per line and render them via `{% include blog_race_photo_table.html images=_photos %}`.
- For `nano-race-note` running posts, keep the structure compact: intro sentence, race summary include, `### Nano Summary ⚡️`, `### Impressions 📸`, and `### Recommended? 👏🏻`.
- In `nano-race-note` impressions sections, use exactly three emoji-first lead-ins — `🚌 Pre-race...`, `🚀 Race...`, and `🏅 Post-race...` — each optionally followed by a short 1–2 sentence preface instead of extra sub-sections. Include as many photos as possible (skip only near-duplicates, blurry and off-topic shots), and split photo tables into even 2-image rows with multiple tables when that gives better breathing room.
- In `nano-race-note` recommended sections, keep the recommendation in fluent prose and end with a standalone star-rating line.
- Write running posts in fluent, natural first-person prose; avoid all-caps emphasis, awkward note-like fragments, and referring to the author in the third person.
- When creating a running race blog post, proactively gather race metadata and author notes before asking the user:
  1. Check `site/race_calendar_<year>.md` for `race_date`, `distance`, and `url` (`race_website`), and update the entry to `status: "completed"` with `blog_url`.
  2. Check `site/blog_collections/_activities/` and `site/blog_collections/_toots/` around `race_date` for the Strava activity (elapsed time, distance, elevation, position, race description) and Mastodon toots.
  3. Because `_activities` and `_toots` only keep the latest 10 items and Codespaces clones are shallow (`grafted`), if the race is older than the current window, run `git fetch --shallow-since="<race_date_minus_1_day>" origin master` and inspect commits around `race_date` (`git log --since="<race_date>" --until="<race_date_plus_4_days>" --oneline -- site/blog_collections/_activities/ site/blog_collections/_toots/`) to recover the exact Strava activity and Mastodon toots from git history.
  4. Check `site/blog_collections/_running/` for previous editions of the same race to link back and compare times/experiences naturally.
