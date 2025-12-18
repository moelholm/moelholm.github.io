---
layout: default
title: Activities - moelholm.com
permalink: /activities/
stylesheets: ["/css/activities.css"]
---

# Activities · Strava
Below are my latest activities from Strava.

{% assign entries = site.activities | where_exp: 'a', 'a.is_meta != true' | sort: 'date' | reverse %}
{% if entries and entries.size > 0 %}
<div class="row list-cards">
	{% for act in entries %}
		{% assign anchor_id = 'activities-' | append: act.id %}
		{% assign external_href = act.remote_url | default: act.url %}
		{% assign date_text = act.date | date: "%Y-%m-%d %H:%M" | append: " UTC" %}
		{% assign date_iso = act.date | date_to_xmlschema %}
		{% capture day_ordinal %}{% include ordinal_day.html date=act.date %}{% endcapture %}
		{% assign month_part = act.date | date: "%B " %}
		{% assign time_part = act.date | date: "%a %H:%M" %}
		{%- comment -%}
		Original title was date based. We now want the actual activity name.
		Fallback to formatted date if name missing.
		{%- endcomment -%}
		{% assign activity_name = act.name | default: act.title | default: '' %}
		{% if activity_name == '' %}
		  {% assign activity_name = month_part | append: day_ordinal | append: " · " | append: time_part | append: " UTC" %}
		{% endif %}
		{% assign title_for_card = activity_name %}


		{%- comment -%}
		Map Strava sport_type to site tag: trailrunning, running, strengthtraining, elliptical, etc.
		Special cases:
		  TrailRun -> trailrunning
		  Run -> running
		  WeightTraining -> strengthtraining
		Else -> lowercase of sport_type
		{%- endcomment -%}
		{% assign raw_type = act.sport_type | default: '' %}
		{% assign type_tag = raw_type | downcase %}
		{% if raw_type == 'TrailRun' %}{% assign type_tag = 'trailrunning' %}{% endif %}
		{% if raw_type == 'Run' %}{% assign type_tag = 'running' %}{% endif %}
		{% if raw_type == 'WeightTraining' %}{% assign type_tag = 'strengthtraining' %}{% endif %}

		{%- comment -%}
		Kudos badge: show kudos count if > 0, similar to likes badge on toots page
		{%- endcomment -%}
		{% capture kudos_badge %}{% if act.kudos_count and act.kudos_count > 0 %}<span class="engagement-badge">👏 {{ act.kudos_count }}</span>{% endif %}{% endcapture %}

		{% capture body_html %}
		  {% assign desc = act.description | default: act.content %}
		  {% if desc contains '<' %}{{ desc }}{% else %}{{ desc | markdownify }}{% endif %}
		{% endcapture %}
		{% assign body_html = body_html | replace: '<a ', '<a target="_blank" rel="noopener" ' %}

		{% capture media_html %}
			{% if act.media and act.media.size > 0 %}
				<div class="toot-media-grid mt-2 spotlight-group">
					{% for m in act.media %}
						<img src="{{ m.thumb | default: m.url }}" data-src="{{ m.url }}" alt="{{ m.alt }}" class="spotlight toot-media-thumb" loading="lazy" />
					{% endfor %}
				</div>
			{% endif %}
		{% endcapture %}

		{% capture extra_block %}
		  {{ media_html }}
		  <div class="mt-1">
		    {% include tag_chip.html name=type_tag size='sm' href='/tags#' %}
		  </div>
		{% endcapture %}
		{% include card.html
			 id=anchor_id
			 title=title_for_card
			 href=external_href
			 badge_html=kudos_badge
			 body_html=body_html
			 date_text=date_text
			 date_iso=date_iso
			 cta_label="open"
			 cta_href=external_href
			 extra_html=extra_block
			 card_body_classes='py-2'
		%}
	{% endfor %}
	</div>
{% else %}
<div class="row list-cards"><div class="col-md-12"><p>No activities found.</p></div></div>
{% endif %}
