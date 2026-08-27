// --- Basemaps ---
var basemaps = {
  osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }),
  humanitarian: L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors, Tiles style by HOT'
  }),
  positron: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors © CARTO'
  }),
  dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors © CARTO'
  }),
  satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics'
  })
};

var map = L.map('map', { layers: [basemaps.osm], zoomControl: false }).setView([37.0, -76.5], 8);
// Zoom control moved to bottom-left so it doesn't sit under the search bar / basemap picker up top.
L.control.zoom({ position: 'bottomleft' }).addTo(map);
var currentBasemapKey = 'osm';

var selectedCoords = null;
var selectedAddress = null;
var marker = null;

var statusEl = document.getElementById('status');
var searchInput = document.getElementById('search');
var suggestionsEl = document.getElementById('suggestions');
var basemapSelect = document.getElementById('basemap');

// --- Basemap switching ---
basemapSelect.addEventListener('change', function () {
  var key = basemapSelect.value;
  if (!basemaps[key] || key === currentBasemapKey) return;
  map.removeLayer(basemaps[currentBasemapKey]);
  basemaps[key].addTo(map);
  currentBasemapKey = key;
});

// --- Shared helpers ---
function buildValue() {
  return JSON.stringify({
    lat: selectedCoords ? selectedCoords.lat : null,
    lng: selectedCoords ? selectedCoords.lng : null,
    address: selectedAddress || ''
  });
}

function pushValue() {
  if (window.JFCustomWidget) {
    JFCustomWidget.sendData({ value: buildValue() });
  }
}

function setPin(lat, lng, address, zoom) {
  var latlng = L.latLng(lat, lng);
  if (marker) map.removeLayer(marker);
  marker = L.marker(latlng).addTo(map);
  if (zoom) {
    map.setView(latlng, zoom);
  } else {
    map.panTo(latlng);
  }
  selectedCoords = { lat: lat, lng: lng };
  selectedAddress = address || null;
  statusEl.textContent = selectedAddress || (lat.toFixed(5) + ', ' + lng.toFixed(5));
  pushValue();
}

function reverseGeocode(lat, lng, callback) {
  var url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + lat + '&lon=' + lng;
  fetch(url, { headers: { 'Accept': 'application/json' } })
    .then(function (resp) { return resp.json(); })
    .then(function (data) { callback(data); })
    .catch(function () { callback(null); });
}

// --- Click-to-drop-pin ---
map.on('click', function (e) {
  setPin(e.latlng.lat, e.latlng.lng, null);
  statusEl.textContent = 'Looking up address…';
  reverseGeocode(e.latlng.lat, e.latlng.lng, function (result) {
    selectedAddress = result && result.display_name ? result.display_name : null;
    statusEl.textContent = selectedAddress || (e.latlng.lat.toFixed(5) + ', ' + e.latlng.lng.toFixed(5));
    pushValue();
  });
});

// --- Address search (Nominatim forward geocoding) ---
var searchDebounce = null;

function clearSuggestions() {
  suggestionsEl.innerHTML = '';
  suggestionsEl.style.display = 'none';
}

function renderSuggestions(results) {
  suggestionsEl.innerHTML = '';
  if (!results || !results.length) {
    clearSuggestions();
    return;
  }
  results.forEach(function (r) {
    var item = document.createElement('div');
    item.textContent = r.display_name;
    item.addEventListener('click', function () {
      var lat = parseFloat(r.lat);
      var lng = parseFloat(r.lon);
      setPin(lat, lng, r.display_name, 16);
      searchInput.value = r.display_name;
      clearSuggestions();
    });
    suggestionsEl.appendChild(item);
  });
  suggestionsEl.style.display = 'block';
}

function searchAddress(query) {
  var url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=' + encodeURIComponent(query);
  fetch(url, { headers: { 'Accept': 'application/json' } })
    .then(function (resp) { return resp.json(); })
    .then(renderSuggestions)
    .catch(function () { clearSuggestions(); });
}

searchInput.addEventListener('input', function () {
  var query = searchInput.value.trim();
  if (searchDebounce) clearTimeout(searchDebounce);
  if (query.length < 3) {
    clearSuggestions();
    return;
  }
  searchDebounce = setTimeout(function () {
    searchAddress(query);
  }, 400);
});

// Pressing Enter jumps to the top result instead of requiring a click.
searchInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    var first = suggestionsEl.querySelector('div');
    if (first) first.click();
  }
});

// Hide suggestions when clicking elsewhere on the widget.
document.addEventListener('click', function (e) {
  if (e.target !== searchInput && !suggestionsEl.contains(e.target)) {
    clearSuggestions();
  }
});

// --- Real JotForm widget lifecycle ---
// JotForm loads widgets in an iframe and communicates through the
// JFCustomWidget object provided by JotFormCustomWidget.min.js (loaded in
// index.html). There is no "JFWidgetInit" / "widget-ready" postMessage API.
JFCustomWidget.subscribe('ready', function () {
  if (JFCustomWidget.requestFrameResize) {
    JFCustomWidget.requestFrameResize({ height: 420 });
  }

  JFCustomWidget.subscribe('submit', function () {
    JFCustomWidget.sendSubmit({
      valid: !!selectedCoords,
      value: buildValue()
    });
  });
});
