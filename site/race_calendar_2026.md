---
layout: default
title: Race Calendar 2026 - moelholm.com
permalink: /race-calendar-2026/
stylesheets: ["/css/races.css"]
races:
  - date: "2026-01-10"
    title: "LNBK Ringkøbing Fjord - Winter Edition"
    distance: "100 km"
    tags: ["ultra"]
    url: "https://my.raceresult.com/351761/info"
  
  - date: "2026-02-01"
    title: "Eventyrsport VinterTrail Mols Bjerge"
    distance: "46 km"
    tags: ["trail"]
    url: "https://www.sportstiming.dk/event/17044"
  
  - date: "2026-03-14"
    title: "Grenaa Halvmarathon – 6 timers ultraløb 2026"
    distance: "6h"
    tags: ["ultra"]
    url: "https://ultralob.dk/grenaa-halvmarathon-6-timers-ultraloeb-2026/"
  
  - date: "2026-03-27"
    title: "Wayout Backyard Ultra"
    distance: "♾️"
    tags: ["ultra", "backyard", "trail"]
    url: "https://www.wayout.dk/wbu"
  
  - date: "2026-05-10"
    title: "Copenhagen Marathon"
    distance: "42 km"
    tags: ["marathon"]
    url: "https://copenhagenmarathon.dk"
  
  - date: "2026-05-30"
    title: "24 Timer ved Havet"
    distance: "24h"
    tags: ["ultra"]
    url: "https://www.sportstiming.dk/event/16658"
  
  - date: "2026-06-14"
    title: "Bestseller Aarhus City Half"
    distance: "21 km"
    tags: ["half"]
    url: "https://www.aarhusmotion.dk/event/293"
  
  - date: "2026-09-27"
    title: "HCA Marathon"
    distance: "42 km"
    tags: ["marathon"]
    url: "https://www.sportstiming.dk/event/16156"
  
  - date: "2026-10-30"
    title: "Kullamannen by UTMB"
    distance: "160 km"
    tags: ["ultra", "trail"]
    url: "https://kullamannen.utmb.world/races/ultra-100-miles"
---

<h1>Race Calendar 2026</h1>

<p>Below are the races I plan to participate in during 2026.</p>

<br/>

<div class="races-container">
  <div class="table-responsive">
    <table class="table races-table races-table--nohead">
      <thead class="thead-light"><tr><th class="date-col"></th><th class="race-details-col"></th></tr></thead>
      <tbody>
        {% for race in page.races %}
          {% include race_card.html date=race.date title=race.title distance=race.distance tags=race.tags url=race.url %}
        {% endfor %}
      </tbody>
    </table>
  </div>
</div>
