---
layout: default
title: moelholm.com
stylesheets:
  - /css/home.css
---

<section class="home-hero">
  <div class="home-hero__text">
   <p class="eyebrow">A running journal by Nicky Mølholm</p>
   <h1>A little further.<br><span>A little wilder.</span></h1>
   <p>I'm Nicky Bass Mølholm. I share my running experiences, race reports and training notes here.</p>
   <div class="home-hero__actions">
     <a class="journal-button" href="/running/">Explore the journal <span aria-hidden="true">↗</span></a>
     <a class="home-hero__about" href="/about">Meet the runner →</a>
   </div>
  </div>
  <figure class="home-hero__photo">
   <img src="/img_running/frontpage.jpg" data-src="/img_running/frontpage.jpg" alt="Nicky and Casper at UTMB CCC 2024" class="spotlight home-hero__img" fetchpriority="high" width="666" height="1000" />
   <figcaption><span class="eyebrow">Out where I belong</span>UTMB CCC · 2024</figcaption>
   <span class="home-hero__sticker" aria-hidden="true">More trails.<br>More stories. ↗</span>
  </figure>
</section>

<nav class="runner-links" aria-label="Running profiles">
  <span class="eyebrow">Follow the miles</span>
  <a href="https://www.strava.com/athletes/89837533" target="_blank" rel="noopener">Strava ↗</a>
  <a href="https://utmb.world/en/runner/4879951.nicky.bassmolholm" target="_blank" rel="noopener">UTMB ↗</a>
  <a href="https://itra.run/api/RunnerSpace/GetRunnerSpace?memberString=mWeU4v%2B0oGPGf9LMOe6wgw%3D%3D" target="_blank" rel="noopener">ITRA ↗</a>
  <a href="https://statistik.d-u-v.org/getresultperson.php?runner=2012387" target="_blank" rel="noopener">DUV ↗</a>
</nav>

<div class="home-grid">
  <div class="home-grid__journal">
   {% assign latest = site.running | sort: 'date' | reverse %}
   {% include home/section_list.html title='Stories from the trail' emoji='📖' items=latest limit=4 kind='running' more_url='/running/' %}
   {% assign activities = site.activities | where_exp: 'a', 'a.is_meta != true' | sort: 'date' | reverse %}
   {% include home/section_list.html title='Currently in motion' emoji='🏃' items=activities limit=2 kind='activities' more_url='/activities/' grid='home-samples--two' %}
   {% assign entries = site.toots | where_exp: 't', 't.is_meta != true' | sort: 'date' | reverse %}
   {% include home/section_list.html title='Along the way' emoji='🐘' items=entries limit=2 kind='toots' more_url='/toots/' grid='home-samples--two' %}
  </div>
  <aside class="home-grid__sidebar" aria-label="Race notebook">
   {% assign race_calendar_page = site.pages | where: "name", "race_calendar_2026.md" | first %}
   {% if race_calendar_page and race_calendar_page.races %}
     {% assign upcoming_races = race_calendar_page.races | where: "status", "pending" | sort: "date" %}
     {% include home/section_list.html title='On the horizon' emoji='↗' items=upcoming_races limit=2 kind='upcoming_races' more_url='/race-calendar-2026/' %}
   {% endif %}
   {% assign race_posts = site.running | where_exp: 'p','p.tags contains "race"' | sort: 'date' | reverse %}
   {% include home/section_list.html title='Finish-line notes' emoji='🏁' items=race_posts limit=2 kind='previous_races' more_url='/races-2026/' %}
   <section class="home-about">
     <span class="eyebrow">Beyond the finish line</span>
     <h2>Hi, I'm Nicky.</h2>
     <p>Mostly a trail and ultra runner. Always up for another adventure. This is my little corner of the internet to share it all.</p>
     <a href="/about">A little more about me <span aria-hidden="true">↗</span></a>
   </section>
  </aside>
</div>
