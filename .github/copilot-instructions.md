# Copilot instructions

- For running blog posts, store post images in `site/img_running/<blog-post-date>/` using the post `date` (not `race_date`) for the folder.
- For running blog post photo tables, make every image physically end up in the same landscape format (600x450 for race tables); do not rely on CSS alone to normalize portrait image heights.
- For running race photo tables, prefer `{% capture _photos %}` blocks with one filename per line and render them via `{% include blog_race_photo_table.html images=_photos %}`.
