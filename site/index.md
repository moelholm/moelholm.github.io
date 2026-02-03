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
  {% comment %}
  ==================================================================================
  CAROUSEL CONFIGURATION - Complete Single Source of Truth
  ==================================================================================
  
  To add a new carousel category, follow these THREE simple steps:
  
  STEP 1: Define your collection variable (if it doesn't exist)
  STEP 2: Add your card line in the card_definitions section  
  STEP 3: Add your variable to the lookup section below
  
  All three steps are clearly marked and located near each other for easy maintenance.
  Everything else (colors, styling, JavaScript) is completely automatic.
  {% endcomment %}
  
  {% comment %}=== STEP 1: Define collection variables ==={% endcomment %}
  {% if site.running %}
    {% assign race_posts = site.running | where: "layout", "post" | where_exp: "item", "item.race_date != nil" | sort: "race_date" | reverse %}
  {% else %}
    {% assign race_posts = "" | split: "" %}
  {% endif %}
  
  {% assign race_calendar_page = site.pages | where: "name", "race_calendar_2026.md" | first %}
  {% if race_calendar_page and race_calendar_page.races %}
    {% assign upcoming_races = race_calendar_page.races | where: "status", "pending" | sort: "date" %}
  {% else %}
    {% assign upcoming_races = "" | split: "" %}
  {% endif %}
  
  {% if site.activities %}
    {% assign activities = site.activities | where_exp: 'a', 'a.is_meta != true' | sort: 'date' | reverse %}
  {% else %}
    {% assign activities = "" | split: "" %}
  {% endif %}
  
  {% if site.toots %}
    {% assign entries = site.toots | where_exp: 't', 't.is_meta != true' | sort: 'date' | reverse %}
  {% else %}
    {% assign entries = "" | split: "" %}
  {% endif %}
  
  {% if site.running %}
    {% assign latest = site.running | where: "layout", "post" | sort: "date" | reverse %}
  {% else %}
    {% assign latest = "" | split: "" %}
  {% endif %}
  
  {% comment %}=== STEP 2: Card definitions (id|title|icon|var_name|kind|url|base_color||) ==={% endcomment %}
  {% capture card_definitions %}previous-races|Previous Races|fa-solid fa-trophy|race_posts|previous_races|/races|#0f3166||
upcoming-races|Upcoming Races|fa-solid fa-flag-checkered|upcoming_races|upcoming_races|/race-calendar-2026/|#d4a300||
activities|Activities|fa-solid fa-person-running|activities|activities|/activities/|#ff6600||
updates|Updates|fa-brands fa-mastodon|entries|toots|/toots/|#5d6dcc||
posts|Posts|fa-solid fa-book-open|latest|running|/running/|#28a975||{% endcapture %}
  
  {% comment %}=== Filter cards based on content availability ==={% endcomment %}
  {% assign carousel_cards_temp = "" | split: "" %}
  {% assign card_lines = card_definitions | strip | split: "
" %}
  {% for line in card_lines %}
    {% assign trimmed_line = line | strip %}
    {% if trimmed_line != "" %}
      {% if trimmed_line contains "upcoming-races" %}
        {% if upcoming_races.size > 0 %}
          {% assign single_card = trimmed_line | split: '|||' %}
          {% assign carousel_cards_temp = carousel_cards_temp | concat: single_card %}
        {% endif %}
      {% else %}
        {% assign single_card = trimmed_line | split: '|||' %}
        {% assign carousel_cards_temp = carousel_cards_temp | concat: single_card %}
      {% endif %}
    {% endif %}
  {% endfor %}
  {% assign carousel_cards = carousel_cards_temp %}

  <!-- Carousel navigation cards -->
  <div class="carousel-nav-cards">
    {% for card_line in carousel_cards %}
      {% assign card_parts = card_line | strip | split: '|' %}
      {% assign card_id = card_parts[0] %}
      {% assign card_title = card_parts[1] %}
      {% assign card_icon = card_parts[2] %}
      {% assign base_color = card_parts[6] %}
      
      <a href="#homeCarousel" 
         data-slide-to="{{ forloop.index0 }}" 
         data-card-id="{{ card_id }}"
         data-color="{{ base_color }}"
         class="carousel-nav-card" 
         aria-label="Go to {{ card_title }} slide">
        <i class="{{ card_icon }}"></i> {{ card_title }}
      </a>
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
        {% assign card_id = card_parts[0] %}
        {% assign card_title = card_parts[1] %}
        {% assign items_var_name = card_parts[3] %}
        {% assign card_kind = card_parts[4] %}
        {% assign card_more_url = card_parts[5] %}
        {% assign base_color = card_parts[6] %}
        
        {% comment %}=== Step 3: Variable lookup (Liquid limitation - must map string to variable) ==={% endcomment %}
        {% if items_var_name == 'race_posts' %}
          {% assign items_array = race_posts %}
        {% elsif items_var_name == 'upcoming_races' %}
          {% assign items_array = upcoming_races %}
        {% elsif items_var_name == 'activities' %}
          {% assign items_array = activities %}
        {% elsif items_var_name == 'entries' %}
          {% assign items_array = entries %}
        {% elsif items_var_name == 'latest' %}
          {% assign items_array = latest %}
        {% endif %}
        
        <div class="swiper-slide" 
             data-slide-index="{{ forloop.index0 }}"
             data-card-id="{{ card_id }}"
             data-color="{{ base_color }}">
          <div class="home-grid__main">
            {% include home/section_list.html title=card_title items=items_array limit=2 kind=card_kind more_url=card_more_url grid='home-samples--two' hide_title=true %}
          </div>
        </div>
      {% endfor %}
    </div>
  </div>
</section>
