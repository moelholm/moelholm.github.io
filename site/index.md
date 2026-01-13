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

  <!-- Carousel section titles teaser -->
  <div class="carousel-teaser">
    {% if upcoming_races and upcoming_races.size > 0 %}
      <a href="#homeCarousel" data-slide-to="0" class="carousel-teaser__item" aria-label="Go to Upcoming Races slide">🏁 Upcoming Races</a>
      <span class="carousel-teaser__separator">•</span>
      <a href="#homeCarousel" data-slide-to="1" class="carousel-teaser__item" aria-label="Go to Activities slide">🏃 Activities</a>
      <span class="carousel-teaser__separator">•</span>
      <a href="#homeCarousel" data-slide-to="2" class="carousel-teaser__item" aria-label="Go to Updates slide">🐘 Updates</a>
      <span class="carousel-teaser__separator">•</span>
      <a href="#homeCarousel" data-slide-to="3" class="carousel-teaser__item" aria-label="Go to Posts slide">📖 Posts</a>
      <span class="carousel-teaser__separator">•</span>
      <a href="#homeCarousel" data-slide-to="4" class="carousel-teaser__item" aria-label="Go to Previous Races slide">🏁 Previous Races</a>
    {% else %}
      <a href="#homeCarousel" data-slide-to="0" class="carousel-teaser__item" aria-label="Go to Activities slide">🏃 Activities</a>
      <span class="carousel-teaser__separator">•</span>
      <a href="#homeCarousel" data-slide-to="1" class="carousel-teaser__item" aria-label="Go to Updates slide">🐘 Updates</a>
      <span class="carousel-teaser__separator">•</span>
      <a href="#homeCarousel" data-slide-to="2" class="carousel-teaser__item" aria-label="Go to Posts slide">📖 Posts</a>
      <span class="carousel-teaser__separator">•</span>
      <a href="#homeCarousel" data-slide-to="3" class="carousel-teaser__item" aria-label="Go to Previous Races slide">🏁 Previous Races</a>
    {% endif %}
  </div>

  <!-- Progress bar for carousel timing -->
  <div class="carousel-progress">
    <div class="carousel-progress__bar"></div>
  </div>

  <div id="homeCarousel" class="carousel slide" data-ride="carousel" data-interval="10000">
    <!-- Carousel indicators (dots) at top -->
    <ol class="carousel-indicators">
      {% if upcoming_races and upcoming_races.size > 0 %}
        <li data-target="#homeCarousel" data-slide-to="0" class="active"></li>
        <li data-target="#homeCarousel" data-slide-to="1"></li>
        <li data-target="#homeCarousel" data-slide-to="2"></li>
        <li data-target="#homeCarousel" data-slide-to="3"></li>
        <li data-target="#homeCarousel" data-slide-to="4"></li>
      {% else %}
        <li data-target="#homeCarousel" data-slide-to="0" class="active"></li>
        <li data-target="#homeCarousel" data-slide-to="1"></li>
        <li data-target="#homeCarousel" data-slide-to="2"></li>
        <li data-target="#homeCarousel" data-slide-to="3"></li>
      {% endif %}
    </ol>

    <!-- Carousel slides -->
    <div class="carousel-inner">
      {% if upcoming_races and upcoming_races.size > 0 %}
        <!-- Slide 1: Upcoming Races -->
        <div class="carousel-item active" data-slide-index="0">
          <div class="home-grid__main">
            {% include home/section_list.html title='Upcoming Races' emoji='🏁' items=upcoming_races limit=2 kind='upcoming_races' more_url='/race-calendar-2026/' grid='home-samples--two' hide_title=true %}
          </div>
        </div>

        <!-- Slide 2: Activities -->
        <div class="carousel-item" data-slide-index="1">
          <div class="home-grid__main">
            {% include home/section_list.html title='Activities' emoji='🏃' items=activities limit=2 kind='activities' more_url='/activities/' grid='home-samples--two' hide_title=true %}
          </div>
        </div>

        <!-- Slide 3: Updates -->
        <div class="carousel-item" data-slide-index="2">
          <div class="home-grid__main">
            {% include home/section_list.html title='Updates' emoji='🐘' items=entries limit=2 kind='toots' more_url='/toots/' grid='home-samples--two' hide_title=true %}
          </div>
        </div>

        <!-- Slide 4: Posts -->
        <div class="carousel-item" data-slide-index="3">
          <div class="home-grid__main">
            {% include home/section_list.html title='Posts' emoji='📖' items=latest limit=2 kind='running' more_url='/running/' grid='home-samples--two' hide_title=true %}
          </div>
        </div>

        <!-- Slide 5: Previous Races -->
        <div class="carousel-item" data-slide-index="4">
          <div class="home-grid__main">
            {% include home/section_list.html title='Previous Races' emoji='🏁' items=race_posts limit=2 kind='previous_races' more_url='/races' grid='home-samples--two' hide_title=true %}
          </div>
        </div>
      {% else %}
        <!-- Slide 1: Activities (when no upcoming races) -->
        <div class="carousel-item active" data-slide-index="0">
          <div class="home-grid__main">
            {% include home/section_list.html title='Activities' emoji='🏃' items=activities limit=2 kind='activities' more_url='/activities/' grid='home-samples--two' hide_title=true %}
          </div>
        </div>

        <!-- Slide 2: Updates -->
        <div class="carousel-item" data-slide-index="1">
          <div class="home-grid__main">
            {% include home/section_list.html title='Updates' emoji='🐘' items=entries limit=2 kind='toots' more_url='/toots/' grid='home-samples--two' hide_title=true %}
          </div>
        </div>

        <!-- Slide 3: Posts -->
        <div class="carousel-item" data-slide-index="2">
          <div class="home-grid__main">
            {% include home/section_list.html title='Posts' emoji='📖' items=latest limit=2 kind='running' more_url='/running/' grid='home-samples--two' hide_title=true %}
          </div>
        </div>

        <!-- Slide 4: Previous Races -->
        <div class="carousel-item" data-slide-index="3">
          <div class="home-grid__main">
            {% include home/section_list.html title='Previous Races' emoji='🏁' items=race_posts limit=2 kind='previous_races' more_url='/races' grid='home-samples--two' hide_title=true %}
          </div>
        </div>
      {% endif %}
    </div>
  </div>

  <!-- Script to sync active teaser link with carousel and animate progress bar -->
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      var carousel = document.getElementById('homeCarousel');
      if (!carousel) return;
      
      var progressBar = document.querySelector('.carousel-progress__bar');
      var teaserLinks = document.querySelectorAll('.carousel-teaser__item');
      var carouselDots = document.querySelectorAll('.carousel-indicators li');
      var CAROUSEL_INTERVAL = 10000;
      var CAROUSEL_INIT_DELAY = 100;
      var RESET_DELAY = 50;
      
      function updateActiveTeaserLink() {
        var activeSlide = carousel.querySelector('.carousel-item.active');
        if (!activeSlide) return;
        
        var slideIndex = activeSlide.getAttribute('data-slide-index');
        if (!slideIndex) return;
        
        // Remove 'active' class from ALL teaser links - use setAttribute to force removal
        for (var i = 0; i < teaserLinks.length; i++) {
          teaserLinks[i].classList.remove('active');
          teaserLinks[i].removeAttribute('data-active'); // Extra safeguard
        }
        
        // Add 'active' class ONLY to the first matching link
        for (var j = 0; j < teaserLinks.length; j++) {
          if (teaserLinks[j].getAttribute('data-slide-to') === slideIndex) {
            teaserLinks[j].classList.add('active');
            teaserLinks[j].setAttribute('data-active', 'true'); // Extra marker
            break; // IMMEDIATE EXIT
          }
        }
      }
      
      function resetProgressBar() {
        if (!progressBar) return;
        progressBar.classList.remove('animating');
        progressBar.style.width = '0%';
        void progressBar.offsetWidth; // Force reflow
        progressBar.classList.add('animating');
      }
      
      function handleSlideChange() {
        updateActiveTeaserLink();
        resetProgressBar();
      }
      
      // Attach carousel slide event listener
      if (typeof $ !== 'undefined' && $.fn.on) {
        $(carousel).on('slide.bs.carousel', handleSlideChange);
      } else {
        carousel.addEventListener('slide.bs.carousel', handleSlideChange);
      }
      
      // Reset progress bar on manual navigation
      teaserLinks.forEach(function(link) {
        link.addEventListener('click', function() {
          setTimeout(resetProgressBar, RESET_DELAY);
        });
      });
      
      carouselDots.forEach(function(dot) {
        dot.addEventListener('click', function() {
          setTimeout(resetProgressBar, RESET_DELAY);
        });
      });
      
      // Initialize
      setTimeout(function() {
        updateActiveTeaserLink();
        resetProgressBar();
      }, CAROUSEL_INIT_DELAY);
    });
  </script>
</section>
