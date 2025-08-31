---
layout: default
title: moelholm.com
---

<!-- Hero / intro -->
<section class="home-hero">
  {% include lightbox.html id="hero-img" full_url="/img_running/hero_frontpage.jpg" thumb_src="/img_running/hero_frontpage.jpg" alt="Frontpage hero" img_class="home-hero__img" title="View image" %}
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
    {% assign entries = site.toots | where_exp: 't', 't.is_meta != true' | sort: 'date' | reverse %}
    {% include home/section_list.html title='Updates' emoji='🐘' items=entries limit=2 kind='toots' more_url='/toots/' grid='home-samples--two' %}
  </div>

  <div class="home-grid__main">
    {% assign latest = site.running | sort: 'date' | reverse %}
    {% include home/section_list.html title='Posts' emoji='📖' items=latest limit=2 kind='running' more_url='/running/' %}

  {% assign race_posts = site.running | where_exp: 'p','p.tags contains "race"' | sort: 'date' | reverse %}
  {% include home/section_list.html title='Races' emoji='🏁' items=race_posts limit=2 kind='results' more_url='/races' grid='home-samples--two' %}

  <div class="card position-relative">
      <div class="card-body">
  <h5 class="mb-2 d-flex align-items-center gap-1">About <span class="emoji-badge ml-1">👤</span></h5>
  <p>I run a lot these days. In fact it may be borderline crazy to most folks; I am primarily a trail and ultra runner. Trail runs are just everything besides normal road running. Ultra running is...</p>
  <div class="text-right"><a class="btn btn-sm stretched-link" href="/about">More</a></div>
      </div>
    </div>
  </div>
</section>
