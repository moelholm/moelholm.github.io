---
layout: default
title: moelholm.com
stylesheets:
  - /css/home.css
  - /css/race_map.css
race_map: true
---

<!-- Hero / intro -->
<section class="home-hero">
  <img src="/img_running/frontpage.jpg" data-src="/img_running/frontpage.jpg" alt="Me and Casper at UTMB CCC 2024" class="spotlight home-hero__img" loading="lazy" />
  <div class="home-hero__text">
    <h1>Running++</h1>
    <p>I'm Nicky Bass Mølholm. I share my running experiences, race reports and training notes here.</p>
    <div class="external-race-links post-metadata mb-2">
      <a class="badge result-badge result-badge--strava mr-1" href="https://www.strava.com/athletes/89837533" target="_new" rel="noopener">
        <i class="fa-brands fa-strava"></i> Strava
      </a>
      <a class="badge result-badge result-badge--utmb mr-1" href="https://utmb.world/en/runner/4879951.nicky.bassmolholm" target="_new" rel="noopener">
        <i class="fa-solid fa-mountain"></i> UTMB
      </a>
      <a class="badge result-badge result-badge--itra mr-1" href="https://itra.run/api/RunnerSpace/GetRunnerSpace?memberString=mWeU4v%2B0oGPGf9LMOe6wgw%3D%3D" target="_new" rel="noopener">
        <i class="fa-solid fa-shield"></i> ITRA
      </a>
      <a class="badge result-badge result-badge--duv mr-1" href="https://statistik.d-u-v.org/getresultperson.php?runner=2012387" target="_new" rel="noopener">
        <i class="fa-solid fa-chart-line"></i> DUV
      </a>
    </div>
  </div>
  
  
</section>

<!-- Main: latest posts + sidebar -->
<section class="home-grid">
  <div class="home-grid__main">
  {% include race_map.html %}

  {% comment %}Get upcoming races by joining current + next year calendars and filtering future races{% endcomment %}
  {% assign current_year = site.time | date: "%Y" %}
  {% assign next_year = current_year | plus: 1 %}
  {% assign today = site.time | date: "%Y-%m-%d" %}
  {% assign empty_races = '' | split: '' %}
  {% assign current_calendar_name = 'race_calendar_' | append: current_year | append: '.md' %}
  {% assign next_calendar_name = 'race_calendar_' | append: next_year | append: '.md' %}
  {% assign current_calendar = site.pages | where: "name", current_calendar_name | first %}
  {% assign next_calendar = site.pages | where: "name", next_calendar_name | first %}
  {% assign current_races = current_calendar.races | default: empty_races %}
  {% assign next_races = next_calendar.races | default: empty_races %}
  {% assign merged_races = current_races | concat: next_races %}
  {% assign upcoming_races = merged_races | where: "status", "pending" | where_exp: "race", "race.date >= today" | sort: "date" %}
  {% assign upcoming_race_year = upcoming_races | map: "date" | first | date: "%Y" | default: current_year %}
  {% assign upcoming_more_url = '/race-calendar-' | append: upcoming_race_year | append: '/' %}
  {% include home/section_list.html title='Upcoming Races' emoji='🏁' items=upcoming_races limit=2 kind='upcoming_races' more_url=upcoming_more_url grid='home-samples--two' %}

  {% assign activities = site.activities | where_exp: 'a', 'a.is_meta != true' | sort: 'date' | reverse %}
  {% include home/section_list.html title='Activities' emoji='🏃' items=activities limit=2 kind='activities' more_url='/activities/' grid='home-samples--two' %}

  {% assign entries = site.toots | where_exp: 't', 't.is_meta != true' | sort: 'date' | reverse %}
  {% include home/section_list.html title='Updates' emoji='🐘' items=entries limit=2 kind='toots' more_url='/toots/' grid='home-samples--two' %}
  </div>

  <div class="home-grid__main">
    {% assign latest = site.running | sort: 'date' | reverse %}
    {% include home/section_list.html title='Posts' emoji='📖' items=latest limit=2 kind='running' more_url='/running/' %}

  {% assign race_posts = site.running | where_exp: 'p','p.tags contains "race"' | sort: 'date' | reverse %}
  {% include home/section_list.html title='Previous Races' emoji='🏁' items=race_posts limit=2 kind='previous_races' more_url='/races-2026/' grid='home-samples--two' %}

  <div class="card position-relative">
      <div class="card-body">
  <h5 class="mb-2 d-flex align-items-center gap-1">About <span class="emoji-badge ml-1">👤</span></h5>
  <p>I run a lot these days. In fact it may be borderline crazy to most folks; I am primarily a trail and ultra runner. Trail runs are just everything besides normal road running. Ultra running is...</p>
  <div class="text-right"><a class="btn btn-sm stretched-link" href="/about">More</a></div>
      </div>
    </div>
  </div>
</section>
