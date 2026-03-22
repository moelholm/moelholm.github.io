---
layout: default
title: Race Calendar 2027 - moelholm.com
permalink: /race-calendar-2027/
stylesheets: ["/css/races.css", "/css/race_status.css"]
body_class: race-calendar-page
races:
  - date: "2027-03-13"
    title: "Grenaa Halvmarathon - 6 timers ULTRALØB"
    distance: "6h"
    tags: ["ultra"]
    url: "https://facebook.com/events/s/grenaa-halvmarathon-6-timers-u/1252953832972654/"
    status: "pending"
---

<h1>Race Calendar 2027</h1>

<p>Below are the races I plan to participate in during 2027.</p>

<div class="races-container">
  {% for race in page.races %}
    <div style="margin-bottom: 1rem;">
      {% include race_card.html date=race.date title=race.title distance=race.distance tags=race.tags url=race.url blog_url=race.blog_url status=race.status %}
    </div>
  {% endfor %}
</div>
