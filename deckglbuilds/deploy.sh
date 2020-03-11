#!/bin/bash
cd /home/dario/Programming/esri/uber/deck.gl/modules/arcgis
npm run build-bundle
cd /home/dario/Programming/esri/damix911.github.io/deckglbuilds
mv /home/dario/Programming/esri/uber/deck.gl/modules/arcgis/dist.min.js deck.gl.arcgis.js
git add deck.gl.arcgis.js
git commit -m "Updated deck.gl.arcgis.js"
git push origin HEAD


