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

  {% comment %}
  Define carousel card groups with their colors and content.
  Each group defines: id, title, icon, items, kind, more_url, color
  To add a new card, simply add a new entry here.
  {% endcomment %}
  {% capture carousel_cards_data %}
    {% if upcoming_races and upcoming_races.size > 0 %}
      previous-races|Previous Races|fa-solid fa-trophy|{{ race_posts | jsonify }}|previous_races|/races|#0f3166||
      upcoming-races|Upcoming Races|fa-solid fa-flag-checkered|{{ upcoming_races | jsonify }}|upcoming_races|/race-calendar-2026/|#7a5b00||
      activities|Activities|fa-solid fa-person-running|{{ activities | jsonify }}|activities|/activities/|#cc4b00||
      updates|Updates|fa-brands fa-mastodon|{{ entries | jsonify }}|toots|/toots/|#3d4db3||
      posts|Posts|fa-solid fa-book-open|{{ latest | jsonify }}|running|/running/|#1e7b58
    {% else %}
      previous-races|Previous Races|fa-solid fa-trophy|{{ race_posts | jsonify }}|previous_races|/races|#0f3166||
      activities|Activities|fa-solid fa-person-running|{{ activities | jsonify }}|activities|/activities/|#cc4b00||
      updates|Updates|fa-brands fa-mastodon|{{ entries | jsonify }}|toots|/toots/|#3d4db3||
      posts|Posts|fa-solid fa-book-open|{{ latest | jsonify }}|running|/running/|#1e7b58
    {% endif %}
  {% endcapture %}
  
  {% assign carousel_cards = carousel_cards_data | strip | split: '||' %}

  <!-- Carousel navigation cards -->
  <div class="carousel-nav-cards">
    {% for card_line in carousel_cards %}
      {% assign card_parts = card_line | strip | split: '|' %}
      {% if card_parts.size >= 7 %}
        {% assign card_id = card_parts[0] %}
        {% assign card_title = card_parts[1] %}
        {% assign card_icon = card_parts[2] %}
        {% assign card_color = card_parts[6] %}
        <a href="#homeCarousel" 
           data-slide-to="{{ forloop.index0 }}" 
           data-card-id="{{ card_id }}"
           data-color="{{ card_color }}"
           class="carousel-nav-card" 
           aria-label="Go to {{ card_title }} slide">
          <i class="{{ card_icon }}"></i> {{ card_title }}
        </a>
      {% endif %}
    {% endfor %}
  </div>

  <!-- Progress bar -->
  <div class="carousel-progress">
    <div class="carousel-progress__bar"></div>
  </div>
  
  <div id="homeCarousel" class="swiper">
    <!-- Swiper pagination (bullet dots) -->
    <div class="swiper-pagination"></div>
    
    <!-- Swiper slides -->
    <div class="swiper-wrapper">
      {% for card_line in carousel_cards %}
        {% assign card_parts = card_line | strip | split: '|' %}
        {% if card_parts.size >= 7 %}
          {% assign card_id = card_parts[0] %}
          {% assign card_title = card_parts[1] %}
          {% assign card_items_json = card_parts[3] %}
          {% assign card_kind = card_parts[4] %}
          {% assign card_more_url = card_parts[5] %}
          {% assign card_color = card_parts[6] %}
          {% assign card_items = card_items_json | strip %}
          
          <div class="swiper-slide" 
               data-slide-index="{{ forloop.index0 }}"
               data-card-id="{{ card_id }}"
               data-color="{{ card_color }}">
            <div class="home-grid__main">
              {% case card_kind %}
                {% when 'upcoming_races' %}
                  {% assign items_array = upcoming_races %}
                {% when 'activities' %}
                  {% assign items_array = activities %}
                {% when 'toots' %}
                  {% assign items_array = entries %}
                {% when 'running' %}
                  {% assign items_array = latest %}
                {% when 'previous_races' %}
                  {% assign items_array = race_posts %}
              {% endcase %}
              {% include home/section_list.html title=card_title items=items_array limit=2 kind=card_kind more_url=card_more_url grid='home-samples--two' hide_title=true %}
            </div>
          </div>
        {% endif %}
      {% endfor %}
    </div>
  </div>
</section>
