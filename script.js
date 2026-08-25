
var map = L.map('map').setView([37.0, -76.5], 8);
var selectedCoords = null;
var selectedAddress = null;
var marker = null;

console.log('Widget JS loaded');

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

function reverseGeocode(lat, lng, callback) {
  var url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  fetch(url, { headers: { 'User-Agent': 'JotformWidgetExample/1.0' }})
    .then(resp => resp.json())
    .then(data => callback(data))
    .catch(() => callback(null));
}

map.on('click', function(e) {
  if (marker) map.removeLayer(marker);
  marker = L.marker(e.latlng).addTo(map);

  selectedCoords = { lat: e.latlng.lat, lng: e.latlng.lng };

  reverseGeocode(e.latlng.lat, e.latlng.lng, function(result) {
    selectedAddress = result && result.display_name ? result.display_name : null;
    console.log('Address:', selectedAddress);
  });
});

// --- MODERN JOTFORM WIDGET SANDBOX HANDSHAKE --- //
window.parent.postMessage({ type: 'widget-ready' }, '*');

window.addEventListener('message', function(event) {
  if (!event.data) return;

  if (event.data.type === 'JFWidgetInit') {
    console.log('JFWidgetInit received');
    window.parent.postMessage({ type: 'JFWidgetSubscribe', eventName: 'submit' }, '*');
  }

  if (event.data.type === 'JFWidgetSubscribe' && event.data.eventName === 'submit') {
    console.log('Submit event received');
    sendWidgetData();
  }
});

function sendWidgetData() {
  var output = {
    lat: selectedCoords ? selectedCoords.lat : null,
    lng: selectedCoords ? selectedCoords.lng : null,
    address: selectedAddress || '',
    raw: selectedAddress || ''
  };

  console.log('Sending data:', output);

  // Universal compatibility modes
  window.parent.postMessage({ type: 'JFWidgetData', value: output }, '*');
  window.parent.postMessage({ action: 'submissionData', data: output }, '*');
  window.parent.postMessage({ type: 'widget-complete', data: output }, '*');
}
