var map = L.map('map').setView([37.0, -76.5], 8);
var selectedCoords = null;
var selectedAddress = null;
var marker = null;

var statusEl = document.getElementById('status');

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

function reverseGeocode(lat, lng, callback) {
  var url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + lat + '&lon=' + lng;
  fetch(url, { headers: { 'Accept': 'application/json' } })
    .then(function (resp) { return resp.json(); })
    .then(function (data) { callback(data); })
    .catch(function () { callback(null); });
}

// Build the string value JotForm will store for this field.
function buildValue() {
  return JSON.stringify({
    lat: selectedCoords ? selectedCoords.lat : null,
    lng: selectedCoords ? selectedCoords.lng : null,
    address: selectedAddress || ''
  });
}

// Push the current value to JotForm right away (keeps the field's stored
// value fresh even if the user submits before geocoding finishes, and lets
// JotForm's live preview / conditional logic react to it).
function pushValue() {
  if (window.JFCustomWidget) {
    JFCustomWidget.sendData({ value: buildValue() });
  }
}

map.on('click', function (e) {
  if (marker) map.removeLayer(marker);
  marker = L.marker(e.latlng).addTo(map);

  selectedCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
  selectedAddress = null;
  statusEl.textContent = 'Looking up address…';
  pushValue();

  reverseGeocode(e.latlng.lat, e.latlng.lng, function (result) {
    selectedAddress = result && result.display_name ? result.display_name : null;
    statusEl.textContent = selectedAddress || (selectedCoords.lat.toFixed(5) + ', ' + selectedCoords.lng.toFixed(5));
    pushValue();
  });
});

// --- Real JotForm widget lifecycle ---
// JotForm loads widgets in an iframe and communicates through the
// JFCustomWidget object provided by JotFormCustomWidget.min.js (loaded in
// index.html). There is no "JFWidgetInit" / "widget-ready" postMessage API —
// that was invented in the previous version of this file and JotForm never
// sends or listens for those messages, which is why no data made it back
// to the form.
JFCustomWidget.subscribe('ready', function () {
  // Optionally resize the widget iframe to fit; harmless if unsupported.
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
