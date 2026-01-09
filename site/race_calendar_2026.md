---
layout: default
title: Race Calendar 2026 - moelholm.com
permalink: /race-calendar-2026/
stylesheets: ["/css/races.css", "/css/race_status.css"]
body_class: race-calendar-page
races:
  - date: "2026-01-10"
    title: "LNBK Ringkøbing Fjord - Winter Edition"
    distance: "100 km"
    tags: ["ultra"]
    url: "https://my.raceresult.com/351761/info"
    status: "pending"
  
  - date: "2026-02-01"
    title: "Eventyrsport VinterTrail Mols Bjerge"
    distance: "46 km"
    tags: ["ultra", "trail"]
    url: "https://www.sportstiming.dk/event/17044"
    status: "pending"
  
  - date: "2026-03-14"
    title: "Grenaa Halvmarathon – 6 timers ultraløb 2026"
    distance: "6h"
    tags: ["ultra"]
    url: "https://ultralob.dk/grenaa-halvmarathon-6-timers-ultraloeb-2026/"
    status: "pending"
  
  - date: "2026-03-27"
    title: "Wayout Backyard Ultra"
    distance: "♾️"
    tags: ["ultra", "backyard", "trail"]
    url: "https://www.wayout.dk/wbu"
    status: "pending"
  
  - date: "2026-05-10"
    title: "Copenhagen Marathon"
    distance: "42 km"
    tags: ["marathon"]
    url: "https://copenhagenmarathon.dk"
    status: "pending"
  
  - date: "2026-05-30"
    title: "24 Timer ved Havet"
    distance: "24h"
    tags: ["ultra"]
    url: "https://www.sportstiming.dk/event/16658"
    status: "pending"
  
  - date: "2026-06-14"
    title: "Bestseller Aarhus City Half"
    distance: "21 km"
    tags: ["half"]
    url: "https://www.aarhusmotion.dk/event/293"
    status: "pending"
  
  - date: "2026-09-27"
    title: "HCA Marathon"
    distance: "42 km"
    tags: ["marathon"]
    url: "https://www.sportstiming.dk/event/16156"
    status: "pending"
  
  - date: "2026-10-30"
    title: "Kullamannen by UTMB"
    distance: "160 km"
    tags: ["ultra", "trail"]
    url: "https://kullamannen.utmb.world/races/ultra-100-miles"
    status: "pending"
---

<h1>Race Calendar 2026</h1>

<p>Below are the races I plan to participate in during 2026.</p>

<div class="races-container">
  {% for race in page.races %}
    <div style="margin-bottom: 1rem;">
      {% include race_card.html date=race.date title=race.title distance=race.distance tags=race.tags url=race.url status=race.status %}
    </div>
  {% endfor %}
</div>
