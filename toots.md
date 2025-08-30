---
layout: default
title: Toots - moelholm.com
permalink: /toots/
---

# Toots

{% assign toot_meta = site.toots | where: 'is_meta', true | first %}

Below are my latest running toots (chat messages) from Mastodon.
<div class="toots-title-row">
	{% if toot_meta and toot_meta.updated_at %}
		<span class="result-badge result-badge--updated" title="This reflects the last successful fetch from Mastodon">
			{{ toot_meta.updated_at | date: "%Y-%m-%d %H:%M %Z" }}{% if toot_meta.items %}<span class="sep">•</span> {{ toot_meta.items }} toots{% endif %}
		</span>
	{% endif %}
</div>

<div class="row toots-list">
	{% assign entries = site.toots | where_exp: 't', 't.is_meta != true' | sort: 'date' | reverse %}
	{% if entries and entries.size > 0 %}
		{% for toot in entries %}
			<div class="col-md-12">
				<div class="blog-item">
											<div class="card">
												<div class="card-body py-1">
													<div class="d-flex justify-content-between align-items-center mb-0">
								<small class="text-muted">{{ toot.date | date: "%Y-%m-%d %H:%M" }} UTC</small>
								{% if toot.remote_url %}
									<a class="btn btn-sm" href="{{ toot.remote_url }}" target="_blank" rel="noopener" title="Open on Mastodon">open</a>
								{% endif %}
							</div>
							  <div class="toot-content mb-0 toot-hashtags">
								{% assign rendered = toot.content | markdownify %}
								{% if toot.instance_base and toot.hashtags and toot.hashtags.size > 0 %}
									{% assign base = toot.instance_base %}
									{% for h in toot.hashtags %}
										{% capture tag_pat %}#{{ h }}{% endcapture %}
										{% capture original_anchor %}<a href="{{ base }}/tags/{{ h }}">{{ tag_pat }}</a>{% endcapture %}
										{% capture tag_link %}<a class="tag" href="{{ base }}/tags/{{ h }}"><nobr>{{ tag_pat }}</nobr></a>{% endcapture %}
										{% if rendered contains original_anchor %}
											{% assign rendered = rendered | replace: original_anchor, tag_link %}
										{% else %}
											{% assign rendered = rendered | replace: tag_pat, tag_link %}
										{% endif %}
									{% endfor %}
								{% endif %}
								{% assign rendered = rendered | replace: '<a ', '<a target="_blank" rel="noopener" ' %}
										{{ rendered }}
																														{% if toot.media and toot.media.size > 0 %}
																															<div class="toot-media-grid mt-2">
																															{% for m in toot.media %}
																																{% assign lb_id = "lb-" | append: toot.id | append: "-" | append: forloop.index0 %}
																																<label class="toot-media-thumb" for="{{ lb_id }}" title="View image">
																																	<img src="{{ m.thumb }}" alt="{{ m.alt }}" loading="lazy" />
																																</label>
																															{% endfor %}
																															</div>
																															{%- comment -%} CSS-only lightboxes for each media item using checkbox/label (no history changes) {%- endcomment -%}
																															{% for m in toot.media %}
																																{% assign lb_id = "lb-" | append: toot.id | append: "-" | append: forloop.index0 %}
																																<input id="{{ lb_id }}" class="toot-lightbox-toggle" type="checkbox" hidden />
																																<div class="toot-lightbox" role="dialog" aria-label="Image viewer" aria-modal="true">
																																	<label class="toot-lightbox__backdrop" for="{{ lb_id }}" aria-hidden="true"></label>
																																	<img src="{{ m.url }}" alt="{{ m.alt }}" />
																																	<label class="toot-lightbox__close" for="{{ lb_id }}" aria-label="Close">&times;</label>
																																</div>
																															{% endfor %}
																														{% endif %}
							</div>
						</div>
					</div>
				</div>
			</div>
		{% endfor %}
	{% else %}
		<div class="col-md-12"><p>No toots found.</p></div>
	{% endif %}
</div>
