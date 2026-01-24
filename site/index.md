---
layout: default
title: moelholm.com
stylesheets:
  - /css/home.css
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

<!-- Main: latest posts + sidebar in carousel -->
<section class="home-carousel-section">
  {% comment %}Prepare all data for carousel slides{% endcomment %}
  {% assign race_calendar_page = site.pages | where: "name", "race_calendar_2026.md" | first %}
  {% if race_calendar_page and race_calendar_page.races %}
    {% assign upcoming_races = race_calendar_page.races | where: "status", "pending" | sort: "date" %}
  {% endif %}
  {% assign activities = site.activities | where_exp: 'a', 'a.is_meta != true' | sort: 'date' | reverse %}
  {% assign entries = site.toots | where_exp: 't', 't.is_meta != true' | sort: 'date' | reverse %}
  {% assign latest = site.running | sort: 'date' | reverse %}
  {% assign race_posts = site.running | where_exp: 'p','p.tags contains "race"' | sort: 'date' | reverse %}

  <!-- Carousel navigation cards -->
  <div class="carousel-nav-cards">
    {% if upcoming_races and upcoming_races.size > 0 %}
      <a href="#homeCarousel" data-slide-to="4" class="carousel-nav-card carousel-nav-card--races" aria-label="Go to Previous Races slide">
        <i class="fa-solid fa-trophy"></i> Previous Races
      </a>
      <a href="#homeCarousel" data-slide-to="0" class="carousel-nav-card carousel-nav-card--upcoming" aria-label="Go to Upcoming Races slide">
        <i class="fa-solid fa-flag-checkered"></i> Upcoming Races
      </a>
      <a href="#homeCarousel" data-slide-to="1" class="carousel-nav-card carousel-nav-card--activities" aria-label="Go to Activities slide">
        <i class="fa-solid fa-person-running"></i> Activities
      </a>
      <a href="#homeCarousel" data-slide-to="2" class="carousel-nav-card carousel-nav-card--updates" aria-label="Go to Updates slide">
        <i class="fa-brands fa-mastodon"></i> Updates
      </a>
      <a href="#homeCarousel" data-slide-to="3" class="carousel-nav-card carousel-nav-card--posts" aria-label="Go to Posts slide">
        <i class="fa-solid fa-book-open"></i> Posts
      </a>
    {% else %}
      <a href="#homeCarousel" data-slide-to="3" class="carousel-nav-card carousel-nav-card--races" aria-label="Go to Previous Races slide">
        <i class="fa-solid fa-trophy"></i> Previous Races
      </a>
      <a href="#homeCarousel" data-slide-to="0" class="carousel-nav-card carousel-nav-card--activities" aria-label="Go to Activities slide">
        <i class="fa-solid fa-person-running"></i> Activities
      </a>
      <a href="#homeCarousel" data-slide-to="1" class="carousel-nav-card carousel-nav-card--updates" aria-label="Go to Updates slide">
        <i class="fa-brands fa-mastodon"></i> Updates
      </a>
      <a href="#homeCarousel" data-slide-to="2" class="carousel-nav-card carousel-nav-card--posts" aria-label="Go to Posts slide">
        <i class="fa-solid fa-book-open"></i> Posts
      </a>
    {% endif %}
  </div>

  <!-- Progress bar - custom time-based progress indicator -->
  <div class="carousel-progress">
    <div class="carousel-progress__bar"></div>
  </div>
  
  <div id="homeCarousel" class="swiper">
    <!-- Swiper pagination (bullet dots) -->
    <div class="swiper-pagination"></div>
    
    <!-- Swiper slides -->
    <div class="swiper-wrapper">
      {% if upcoming_races and upcoming_races.size > 0 %}
        <!-- Slide 1: Upcoming Races -->
        <div class="swiper-slide" data-slide-index="0">
          <div class="home-grid__main">
            {% include home/section_list.html title='Upcoming Races' emoji='🏁' items=upcoming_races limit=2 kind='upcoming_races' more_url='/race-calendar-2026/' grid='home-samples--two' hide_title=true %}
          </div>
        </div>

        <!-- Slide 2: Activities -->
        <div class="swiper-slide" data-slide-index="1">
          <div class="home-grid__main">
            {% include home/section_list.html title='Activities' emoji='🏃' items=activities limit=2 kind='activities' more_url='/activities/' grid='home-samples--two' hide_title=true %}
          </div>
        </div>

        <!-- Slide 3: Updates -->
        <div class="swiper-slide" data-slide-index="2">
          <div class="home-grid__main">
            {% include home/section_list.html title='Updates' emoji='🐘' items=entries limit=2 kind='toots' more_url='/toots/' grid='home-samples--two' hide_title=true %}
          </div>
        </div>

        <!-- Slide 4: Posts -->
        <div class="swiper-slide" data-slide-index="3">
          <div class="home-grid__main">
            {% include home/section_list.html title='Posts' emoji='📖' items=latest limit=2 kind='running' more_url='/running/' grid='home-samples--two' hide_title=true %}
          </div>
        </div>

        <!-- Slide 5: Previous Races -->
        <div class="swiper-slide" data-slide-index="4">
          <div class="home-grid__main">
            {% include home/section_list.html title='Previous Races' emoji='🏁' items=race_posts limit=2 kind='previous_races' more_url='/races' grid='home-samples--two' hide_title=true %}
          </div>
        </div>
      {% else %}
        <!-- Slide 1: Activities (when no upcoming races) -->
        <div class="swiper-slide" data-slide-index="0">
          <div class="home-grid__main">
            {% include home/section_list.html title='Activities' emoji='🏃' items=activities limit=2 kind='activities' more_url='/activities/' grid='home-samples--two' hide_title=true %}
          </div>
        </div>

        <!-- Slide 2: Updates -->
        <div class="swiper-slide" data-slide-index="1">
          <div class="home-grid__main">
            {% include home/section_list.html title='Updates' emoji='🐘' items=entries limit=2 kind='toots' more_url='/toots/' grid='home-samples--two' hide_title=true %}
          </div>
        </div>

        <!-- Slide 3: Posts -->
        <div class="swiper-slide" data-slide-index="2">
          <div class="home-grid__main">
            {% include home/section_list.html title='Posts' emoji='📖' items=latest limit=2 kind='running' more_url='/running/' grid='home-samples--two' hide_title=true %}
          </div>
        </div>

        <!-- Slide 4: Previous Races -->
        <div class="swiper-slide" data-slide-index="3">
          <div class="home-grid__main">
            {% include home/section_list.html title='Previous Races' emoji='🏁' items=race_posts limit=2 kind='previous_races' more_url='/races' grid='home-samples--two' hide_title=true %}
          </div>
        </div>
      {% endif %}
    </div>
  </div>
</section>
