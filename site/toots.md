---
layout: default
title: Updates - moelholm.com
permalink: /toots/
stylesheets: ["/css/toots.css"]
---

# Updates · Running
Below are my latest updates from Mastodon (similar to X, Bluesky, Threads, etc).

{% assign entries = site.toots | where_exp: 't', 't.is_meta != true' | sort: 'date' | reverse %}
{% if entries and entries.size > 0 %}
<div class="row list-cards">
	{% for toot in entries %}
		{% assign src = toot.remote_url | default: toot.url %}
		{% assign parts = src | split: '/' %}
		{% assign rev = parts | reverse %}
		{% assign toot_anchor = '' %}
		{% for p in rev %}{% if p != '' and toot_anchor == '' %}{% assign toot_anchor = p %}{% endif %}{% endfor %}
		{% assign id_val = 'toot-' | append: toot_anchor %}
		{% assign external_href = toot.remote_url | default: toot.url %}
		{% assign date_text = toot.date | date: "%Y-%m-%d %H:%M" | append: " UTC" %}

	{% assign original_html = toot.content %}
	{% assign has_html = false %}
	{% if original_html contains '<' %}{% assign has_html = true %}{% endif %}
	{% capture day_ordinal %}{% include ordinal_day.html date=toot.date %}{% endcapture %}
	{% assign month_part = toot.date | date: "%B " %}
	{% assign time_part = toot.date | date: "%a %H:%M" %}
	{% assign title_for_card = month_part | append: day_ordinal | append: " · " | append: time_part | append: " UTC" %}
	{% capture emoji_suffix %}{% include toot_title_emojis.html hashtags=toot.hashtags %}{% endcapture %}
	{% assign title_for_card = title_for_card | append: emoji_suffix %}

				{% capture body_html %}
					{% if has_html %}{{ original_html }}{% else %}{{ original_html | markdownify }}{% endif %}
				{% endcapture %}
		{% if toot.instance_base and toot.hashtags and toot.hashtags.size > 0 %}
			{% assign base = toot.instance_base %}
			{% for h in toot.hashtags %}
				{% capture tag_pat %}#{{ h }}{% endcapture %}
				{% capture original_anchor %}<a href="{{ base }}/tags/{{ h }}">{{ tag_pat }}</a>{% endcapture %}
				{% assign tag_href_prefix = base | append: '/tags/' %}
				{% capture tag_link %}{% include tag_chip.html name=h size='md' href=tag_href_prefix %}{% endcapture %}
				{% if body_html contains original_anchor %}
					{% assign body_html = body_html | replace: original_anchor, tag_link %}
				{% else %}
					{% assign body_html = body_html | replace: tag_pat, tag_link %}
				{% endif %}
			{% endfor %}
		{% endif %}

		{% assign body_html = body_html | replace: '<a ', '<a target="_blank" rel="noopener" ' %}

		{% capture media_html %}
			{% if toot.media and toot.media.size > 0 %}
				<div class="toot-media-grid mt-2">
					{% for m in toot.media %}
						{% assign lb_id = "lb-" | append: toot.id | append: "-" | append: forloop.index0 %}
						{% include lightbox.html id=lb_id full_url=m.url thumb_src=m.thumb alt=m.alt label_class='toot-media-thumb' title='View image' %}
					{% endfor %}
				</div>
			{% endif %}
		{% endcapture %}

		{% include card.html
			 id=id_val
			 title=title_for_card
			 href=external_href
			 badge_html="🐘"
			 body_html=body_html
			 date_text=date_text
			 cta_label="open"
			 cta_href=external_href
			 extra_html=media_html
		%}
	{% endfor %}
	</div>
{% else %}
<div class="row list-cards"><div class="col-md-12"><p>No updates found.</p></div></div>
{% endif %}
