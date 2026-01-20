---
layout: post
title: "Skjern Bank Løbet 2026"
description: "Race notes for Skjern Bank Løbet 2026"
date: 2026-04-12 08:00:00 +0200
race_date: 2026-04-12
comments: true
tags: race running halfmarathon
distance_km: 21
race_website: "https://www.sportstiming.dk/event/17237"
---

This is a half marathon in Skjern, Denmark 🇩🇰: Skjern Bank Løbet.

{% capture rows %}
Race|Skjern Bank Løbet 2026;
Date|{{ page.race_date }};
Www|[https://www.sportstiming.dk/event/17237](https://www.sportstiming.dk/event/17237);
Type|Road;
Distance|{{ page.distance_km }}k
{% endcapture %}
{% assign rows_array = rows | split: ";" %}

{% include blog_race_summary.html rows=rows_array %}

Race report coming soon...
