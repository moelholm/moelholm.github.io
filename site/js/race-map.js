(function () {
  "use strict";

  function raceType(race) {
    if (race.tags.includes("backyard-ultra")) return "backyard";
    if (race.tags.includes("ultrarunning") || Number(race.distance) >= 50) return "ultra";
    if (race.tags.includes("trailrunning")) return "trail";
    return "road";
  }

  function addOption(select, value) {
    var option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }

  function popupContent(race) {
    var container = document.createElement("div");
    var link = document.createElement("a");
    link.href = race.url;
    link.textContent = race.title;
    link.className = "race-map__popup-title";
    container.appendChild(link);

    var details = document.createElement("div");
    details.textContent = raceDetails(race);
    container.appendChild(details);
    appendRaceLinks(container, race);
    return container;
  }

  function raceDetails(race) {
    return [
      race.date,
      race.location,
      race.country,
      race.distance ? race.distance + " km" : "",
      race.elevation ? race.elevation + " m elevation" : "",
      race.duration
    ].filter(Boolean).join(" · ");
  }

  function appendRaceLinks(container, race) {
    [
      ["Race website", race.race_website],
      ["Official results", race.results_url]
    ].forEach(function (item) {
      if (!item[1]) return;
      var link = document.createElement("a");
      link.href = item[1];
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = item[0];
      link.className = "race-map__external-link";
      container.appendChild(document.createTextNode(" · "));
      container.appendChild(link);
    });
  }

  function tooltipContent(race) {
    var container = document.createElement("div");
    var title = document.createElement("strong");
    title.textContent = race.title;
    container.appendChild(title);

    var details = document.createElement("div");
    details.textContent = raceDetails(race);
    container.appendChild(details);
    return container;
  }

  function resultCard(race) {
    var article = document.createElement("article");
    article.className = "race-map__result";

    var link = document.createElement("a");
    link.href = race.url;
    link.textContent = race.title;
    link.className = "race-map__result-title";
    article.appendChild(link);

    var details = document.createElement("p");
    details.textContent = raceDetails(race);
    article.appendChild(details);

    var badge = document.createElement("span");
    badge.className = "race-map__type race-map__type--" + raceType(race);
    badge.textContent = raceType(race);
    article.appendChild(badge);
    appendRaceLinks(article, race);
    return article;
  }

  document.querySelectorAll("[data-race-map]").forEach(function (element) {
    var races = JSON.parse(element.querySelector("[data-race-map-data]").textContent);
    var canvas = element.querySelector("[data-map-canvas]");
    var summary = element.querySelector("[data-map-summary]");
    var results = element.querySelector("[data-map-results]");
    var filters = {};
    element.querySelectorAll("[data-filter]").forEach(function (input) {
      filters[input.dataset.filter] = input;
    });

    if (!races.length) {
      summary.textContent = "No race locations are available yet.";
      canvas.hidden = true;
      return;
    }
    if (typeof L === "undefined" || typeof L.markerClusterGroup !== "function") {
      summary.textContent = "The interactive map could not be loaded. Please check your connection and try again.";
      canvas.hidden = true;
      return;
    }

    Object.keys(filters).forEach(function (key) {
      if (key === "search") return;
      var values;
      if (key === "type") {
        values = Array.from(new Set(races.map(raceType))).sort();
      } else {
        values = Array.from(new Set(races.map(function (race) { return race[key]; }))).sort();
      }
      values.forEach(function (value) { addOption(filters[key], value); });
    });

    var map = L.map(canvas, { scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(map);
    var markers = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 35
    });
    map.addLayer(markers);

    function filteredRaces() {
      var query = filters.search ? filters.search.value.trim().toLowerCase() : "";
      return races.filter(function (race) {
        return (!filters.year || !filters.year.value || race.year === filters.year.value) &&
          (!filters.country || !filters.country.value || race.country === filters.country.value) &&
          (!filters.type || !filters.type.value || raceType(race) === filters.type.value) &&
          (!query || [race.title, race.location, race.country].join(" ").toLowerCase().includes(query));
      });
    }

    function render() {
      var visible = filteredRaces();
      markers.clearLayers();
      visible.forEach(function (race) {
        var type = raceType(race);
        var marker = L.marker([Number(race.latitude), Number(race.longitude)], {
          title: race.title,
          alt: race.title,
          icon: L.divIcon({
            className: "race-map__marker race-map__marker--" + type,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
            popupAnchor: [0, -9]
          })
        });
        marker.bindPopup(popupContent(race));
        marker.bindTooltip(tooltipContent(race), { direction: "top", offset: [0, -7], opacity: 0.95 });
        markers.addLayer(marker);
      });

      summary.textContent = visible.length + (visible.length === 1 ? " race" : " races") +
        " in " + new Set(visible.map(function (race) { return race.country; })).size +
        (visible.length === 1 ? " country" : " countries");

      if (results) {
        results.replaceChildren();
        visible.forEach(function (race) { results.appendChild(resultCard(race)); });
        if (!visible.length) {
          var empty = document.createElement("p");
          empty.textContent = "No races match these filters.";
          results.appendChild(empty);
        }
      }

      if (visible.length) {
        var bounds = L.latLngBounds(visible.map(function (race) {
          return [Number(race.latitude), Number(race.longitude)];
        }));
        map.fitBounds(bounds, { padding: [28, 28], maxZoom: 11 });
      } else {
        map.setView([30, 10], 2);
      }
    }

    Object.keys(filters).forEach(function (key) {
      filters[key].addEventListener(key === "search" ? "input" : "change", render);
    });
    render();
  });
}());
