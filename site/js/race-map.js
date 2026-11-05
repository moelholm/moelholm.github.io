(function () {
  "use strict";

  function raceTypes(race) {
    var types = [];
    var isTrail = race.tags.includes("trailrunning");
    if (race.tags.includes("backyard-ultra")) types.push("backyard");
    if (isTrail) types.push("trail");
    if (race.tags.includes("ultrarunning") || Number(race.distance) >= 50) types.push("ultra");
    if (race.tags.includes("halfmarathon")) types.push("halfmarathon");
    if (race.tags.includes("marathon")) types.push("marathon");
    if (!isTrail) types.push("road");
    return types;
  }

  function markerTypes(race) {
    var types = raceTypes(race).filter(function (type) { return type !== "road"; });
    return types.length ? types : ["road"];
  }

  function addOption(select, value) {
    var option = document.createElement("option");
    option.value = value;
    option.textContent = {
      backyard: "Backyard",
      halfmarathon: "Half marathon",
      marathon: "Marathon",
      road: "Road",
      trail: "Trail",
      ultra: "Ultra"
    }[value] || value;
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

  document.querySelectorAll("[data-race-map]").forEach(function (element) {
    var races = JSON.parse(element.querySelector("[data-race-map-data]").textContent);
    var canvas = element.querySelector("[data-map-canvas]");
    var summary = element.querySelector("[data-map-summary]");
    var timeline = element.querySelector("[data-timeline]");
    var timelineDate = element.querySelector("[data-timeline-date]");
    var legendFilters = Array.from(element.querySelectorAll("[data-legend-filter]"));
    var raceRows = Array.from(document.querySelectorAll("[data-race-map-row]"));
    var emptyMessage = document.querySelector("[data-map-empty]");
    var filters = {};
    var selectedType = "";
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

    var chronologicalRaces = races.slice().sort(function (a, b) {
      return a.date.localeCompare(b.date) || a.title.localeCompare(b.title);
    });
    if (timeline) {
      timeline.max = String(chronologicalRaces.length);
      timeline.value = String(chronologicalRaces.length);
    }

    Object.keys(filters).forEach(function (key) {
      if (key === "search") return;
      var values;
      if (key === "type") {
        values = Array.from(new Set(races.reduce(function (allTypes, race) {
          return allTypes.concat(raceTypes(race));
        }, []))).sort();
      } else {
        values = Array.from(new Set(races.map(function (race) { return race[key]; }))).sort();
      }
      values.forEach(function (value) { addOption(filters[key], value); });
    });

    function syncTypeFilters() {
      if (filters.type) filters.type.value = selectedType;
      legendFilters.forEach(function (button) {
        button.setAttribute("aria-pressed", String(button.dataset.legendFilter === selectedType));
      });
    }

    var map = L.map(canvas, { scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(map);
    var markers = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: function (zoom) { return zoom < 10 ? 60 : 2; }
    });
    map.addLayer(markers);
    var popupIsOpen = false;
    map.on("popupopen", function () {
      popupIsOpen = true;
      markers.eachLayer(function (marker) { marker.closeTooltip(); });
    });
    map.on("popupclose", function () { popupIsOpen = false; });
    var markerEntries = [];

    function updateMarkerSpread() {
      var spread = map.getZoom() >= 10;
      markerEntries.forEach(function (entry) {
        var position = entry.base;
        if (spread && entry.offset) {
          var point = map.latLngToLayerPoint(entry.base).add([entry.offset.x, entry.offset.y]);
          position = map.layerPointToLatLng(point);
        }
        entry.marker.setLatLng(position);
      });
    }

    map.on("zoomend", updateMarkerSpread);

    function filteredRaces() {
      var query = filters.search ? filters.search.value.trim().toLowerCase() : "";
      var throughDate = timeline
        ? chronologicalRaces[Number(timeline.value) - 1].date
        : "";
      return races.filter(function (race) {
        return (!filters.year || !filters.year.value || race.year === filters.year.value) &&
          (!filters.country || !filters.country.value || race.country === filters.country.value) &&
          (!selectedType || raceTypes(race).includes(selectedType)) &&
          (!timeline || race.date <= throughDate) &&
          (!query || [race.title, race.location, race.country].join(" ").toLowerCase().includes(query));
      });
    }

    function render() {
      var visible = filteredRaces();
      if (timeline) {
        var selectedIndex = Number(timeline.value);
        var selectedDate = chronologicalRaces[selectedIndex - 1].date;
        var timelineLabel = selectedIndex === chronologicalRaces.length
          ? "All races · " + selectedDate
          : (selectedIndex === 1 ? "First race · " : "Through ") + selectedDate;
        timelineDate.textContent = timelineLabel;
        timeline.setAttribute("aria-valuetext", timelineLabel);
      }
      markers.clearLayers();
      markerEntries = [];
      var places = new Map();
      visible.forEach(function (race) {
        var key = [race.country, race.latitude, race.longitude].join("|");
        if (!places.has(key)) places.set(key, []);
        places.get(key).push(race);
      });
      var offsets = new Map();
      places.forEach(function (placeRaces) {
        if (placeRaces.length < 2) return;
        placeRaces.forEach(function (race, index) {
          var angle = 2 * Math.PI * index / placeRaces.length;
          offsets.set(race.url, { x: Math.cos(angle) * 20, y: Math.sin(angle) * 20 });
        });
      });

      visible.forEach(function (race) {
        var typeClass = markerTypes(race).join("-");
        var base = L.latLng(Number(race.latitude), Number(race.longitude));
        var marker = L.marker(base, {
          title: race.title,
          alt: race.title,
          icon: L.divIcon({
            className: "race-map__marker race-map__marker--" + typeClass,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
            popupAnchor: [0, -9]
          })
        });
        marker.bindPopup(popupContent(race));
        marker.bindTooltip(tooltipContent(race), { direction: "top", offset: [0, -7], opacity: 0.95 });
        marker.on("tooltipopen", function () {
          if (popupIsOpen) marker.closeTooltip();
        });
        markers.addLayer(marker);
        markerEntries.push({ marker: marker, base: base, offset: offsets.get(race.url) });
      });
      updateMarkerSpread();

      var countryCount = new Set(visible.map(function (race) { return race.country; })).size;
      summary.textContent = visible.length + (visible.length === 1 ? " race" : " races") +
        " in " + countryCount + (countryCount === 1 ? " country" : " countries");

      var visibleUrls = new Set(visible.map(function (race) { return race.url; }));
      raceRows.forEach(function (row) { row.hidden = !visibleUrls.has(row.dataset.raceUrl); });
      if (emptyMessage) emptyMessage.hidden = visible.length > 0;

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
      filters[key].addEventListener(key === "search" ? "input" : "change", function () {
        if (key === "type") {
          selectedType = filters.type.value;
          syncTypeFilters();
        }
        render();
      });
    });
    legendFilters.forEach(function (button) {
      button.addEventListener("click", function () {
        selectedType = selectedType === button.dataset.legendFilter ? "" : button.dataset.legendFilter;
        syncTypeFilters();
        render();
      });
    });
    if (timeline) timeline.addEventListener("input", render);
    render();
  });
}());
