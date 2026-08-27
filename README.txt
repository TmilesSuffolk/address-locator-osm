OSM Geocode Pin Drop Widget for JotForm
========================================

What this is:
- A Leaflet + OpenStreetMap map. The user clicks to drop a pin, the widget
  reverse-geocodes the point via Nominatim, and sends {lat, lng, address}
  back to JotForm as this field's value.

How it talks to JotForm (important):
- JotForm custom widgets communicate through JotForm's own SDK script,
  https://js.jotform.com/JotFormCustomWidget.min.js, which is loaded in
  index.html and exposes a global JFCustomWidget object.
- script.js subscribes to JFCustomWidget's "ready" and "submit" events and
  calls JFCustomWidget.sendData() / sendSubmit() to hand data back to the
  form. There is no separate "postMessage handshake" to build yourself —
  an earlier version of this file used made-up message types
  (JFWidgetInit, widget-ready, etc.) that JotForm does not send or listen
  for, which is why coordinates never reached the form.

Deployment (Netlify):
----------------------
1. Go to https://app.netlify.com and click "Add new site" → "Deploy manually".
2. Upload this folder (index.html, script.js, manifest.json).
3. Netlify gives you a URL like:
   https://yourprojectname.netlify.app/
4. Your widget URL for JotForm is:
   https://yourprojectname.netlify.app/index.html

JotForm setup:
--------------
1. Go to https://www.jotform.com/mywidgets
2. Create a new widget, paste in the Netlify URL above as the widget's URL.
3. Add the widget to your form and test it in Preview mode.
4. On submit, the field's stored value will be a JSON string like:
   {"lat":37.123,"lng":-76.456,"address":"123 Main St, ..."}
   Parse that string wherever you consume the submission data
   (email notification, integration, API pull, etc.).

Address search & basemaps:
---------------------------
- Search box (top left) does forward geocoding via Nominatim's /search
  endpoint as you type (debounced, 3+ characters), restricted to the City
  of Suffolk, VA bounding box. Click a suggestion or press Enter to jump
  to and pin the top result.
- Basemap dropdown (top right) switches between OpenStreetMap Standard and
  Esri Satellite imagery. Switching basemaps does not clear the selected pin.

Geographic restriction (City of Suffolk, VA):
-----------------------------------------------
- The map is limited to a bounding box around Suffolk, VA — you can't pan,
  click, or search outside it. Clicking outside the box shows a message
  instead of dropping a pin; search results outside the box are filtered out.
- This uses a rectangular bounding box (in script.js as SUFFOLK_BOUNDS), not
  the exact city-limit polygon, so a few points just outside the true city
  line but inside the rectangle could technically be selectable, and Suffolk
  is a large, irregularly shaped independent city so the margins aren't tight.
  If you need hard enforcement against the real boundary, that would require
  a point-in-polygon check against an actual Suffolk city-limits GeoJSON file
  rather than a simple bounding box.

Notes / things worth knowing:
------------------------------
- Nominatim's usage policy asks for reasonable request volume and a valid
  identifying User-Agent/Referer; for anything beyond light testing,
  consider self-hosting Nominatim or using a geocoder with an API key.
- If the field is marked "required" on the form, "valid" is only true
  once a pin has been dropped (see sendSubmit call in script.js).
