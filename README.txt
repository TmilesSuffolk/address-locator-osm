
Netlify-Ready OSM Geocode Pin Drop Widget
========================================

This widget is ready for direct deployment to Netlify.
It uses:
- Modern JotForm widget postMessage API
- Stable cross-origin embedding
- Original geocoding (lat/lng/address)
- No deprecated widgetLoader.js

Instructions for Netlify Deployment:
------------------------------------
1. Go to https://app.netlify.com and click "Add new site" → "Deploy manually".
2. Upload this entire folder (from the ZIP) directly.
3. Netlify will give you a URL like:
   https://yourprojectname.netlify.app/

4. Your widget URL for JotForm must be:
   https://yourprojectname.netlify.app/index.html

JotForm Setup:
--------------
1. Go to https://www.jotform.com/mywidgets
2. Create a NEW widget (do NOT edit the old one).
3. Paste the Netlify URL above into the "Custom URL" or "Iframe URL" field.
4. Save.
5. Remove the old widget from your form.
6. Add the new widget.
7. Test the form in Preview mode / Live form.

This version WILL transmit coordinates reliably.
Netlify hosting avoids GitHub Pages iframe CSP restrictions.
