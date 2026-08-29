# Copilot instructions

- For running blog posts, store post images in `site/img_running/<blog-post-date>/` using the post `date` (not `race_date`) for the folder.
- For running blog post photo tables, make every image physically end up in the same landscape format (600x450 for race tables); do not rely on CSS alone to normalize portrait image heights.
- For running race photo tables, prefer `{% capture _photos %}` blocks with one filename per line and render them via `{% include blog_race_photo_table.html images=_photos %}`.
- For `nano-race-note` running posts, keep the structure compact: intro sentence, race summary include, `### Nano Summary ⚡️`, `### Impressions 📸`, and `### Recommended? 👏🏻`.
- In `nano-race-note` impressions sections, prefer short emoji-first lead-ins such as `🚌 Pre-race...`, `🚀 Race...`, and `🏅 Post-race...`, and split photo tables into even 2-image rows with multiple tables when that gives better breathing room.
- In `nano-race-note` recommended sections, keep the recommendation in fluent prose and end with a standalone star-rating line.
