---
layout: default
title: moelholm.com
stylesheets:
  - /css/home.css
---

<header class="home-intro">
  <h1>Nicky Mølholm</h1>
  <p>Running. Race reports. Training notes.</p>
  <nav class="runner-links" aria-label="Running profiles">
    <a href="https://www.strava.com/athletes/89837533" target="_blank" rel="noopener">Strava</a>
    <a href="https://utmb.world/en/runner/4879951.nicky.bassmolholm" target="_blank" rel="noopener">UTMB</a>
    <a href="https://itra.run/api/RunnerSpace/GetRunnerSpace?memberString=mWeU4v%2B0oGPGf9LMOe6wgw%3D%3D" target="_blank" rel="noopener">ITRA</a>
    <a href="https://statistik.d-u-v.org/getresultperson.php?runner=2012387" target="_blank" rel="noopener">DUV</a>
  </nav>
</header>

<section class="home-section" aria-labelledby="recent-posts">
  <div class="home-section__heading">
    <h2 id="recent-posts">Recent posts</h2>
    <a href="/running/">All posts</a>
  </div>
  {% assign latest = site.running | sort: 'date' | reverse %}
  <ol class="post-index">
    {% for post in latest limit:6 %}
    <li class="blog-item">
      <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y-%m-%d" }}</time>
      <a class="post-title-link" href="{{ post.url }}">{{ post.title }}</a>
    </li>
    {% endfor %}
  </ol>
</section>

<div class="home-streams">
  {% assign activities = site.activities | where_exp: 'a', 'a.is_meta != true' | sort: 'date' | reverse %}
  {% include home/section_list.html title='Activities' items=activities limit=3 kind='activities' more_url='/activities/' %}
  {% assign race_calendar_page = site.pages | where: "name", "race_calendar_2026.md" | first %}
  {% if race_calendar_page and race_calendar_page.races %}
    {% assign upcoming_races = race_calendar_page.races | where: "status", "pending" | sort: "date" %}
    {% include home/section_list.html title='Upcoming races' items=upcoming_races limit=3 kind='upcoming_races' more_url='/race-calendar-2026/' %}
  {% endif %}
</div>

{% assign entries = site.toots | where_exp: 't', 't.is_meta != true' | sort: 'date' | reverse %}
{% include home/section_list.html title='Updates' items=entries limit=2 kind='toots' more_url='/toots/' %}
