---
layout: default
title: Running - moelholm.com
permalink: /running/
---

<h1>Posts · Running</h1>
{% include atom_feed_link.html feed_url="/feed/running.xml" collection="Running" float=true %}
Below are my latest running posts (primarily race reports).

{% assign latest = site.running | sort: 'date' | reverse %}
<div class="row list-cards">
		{% for post in latest %}
			{% assign date_text = post.date | date: "%Y-%m-%d %H:%M" | append: " UTC" %}
			{% assign date_iso = post.date | date_to_xmlschema %}
			{% capture tags_html %}
				<span>{% for tag in post.tags %}{% include tag_chip.html name=tag href="/tags#" size="md" %}{% endfor %}</span>
			{% endcapture %}
			{% capture body_html %}{{ post.content | strip_html | truncate: 300 }}{% endcapture %}
			{% assign is_race = false %}
			{% if post.tags contains 'race' %}{% assign is_race = true %}{% endif %}
			{% assign badge = '🏃' %}{% if is_race %}{% assign badge = '🏁' %}{% endif %}
			{% assign class_mods = post.tags | join: ' ' %}
            {% include card.html
				 id=post.id
				 title=post.title
				 href=post.url
				 badge_html=badge
				 class_modifiers=class_mods
				 body_html=body_html
				date_text=date_text
				date_iso=date_iso
				 cta_label="open"
				 cta_href=post.url
				 extra_html=tags_html
				 card_body_classes='py-2'
			%}
		{% endfor %}
	</div>
