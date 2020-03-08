#!/bin/bash

# https://damix911.github.io/deckglbuilds/next

TARGET_DIR=/home/dario/Programming/esri/damix911.github.io/deckglbuilds/next

# cd /home/dario/Programming/esri/uber/deck.gl
# yarn build
# mkdir -p $TARGET_DIR/deck.gl@next
# mv modules/main/dist.min.js $TARGET_DIR/deck.gl@next/dist.min.js

# cd /home/dario/Programming/esri/uber/deck.gl/modules/layers
# npm run build-bundle
# mkdir -p $TARGET_DIR/@deck.gl/layers@next
# mv dist.min.js $TARGET_DIR/@deck.gl/layers@next/dist.min.js

# cd /home/dario/Programming/esri/uber/deck.gl/modules/geo-layers
# npm run build-bundle
# mkdir -p $TARGET_DIR/@deck.gl/geo-layers@next
# mv dist.min.js $TARGET_DIR/@deck.gl/geo-layers@next/dist.min.js

# cd /home/dario/Programming/esri/uber/deck.gl/modules/arcgis
# npm run build-bundle
# mkdir -p $TARGET_DIR/@deck.gl/arcgis@next
# mv dist.min.js $TARGET_DIR/@deck.gl/arcgis@next/dist.min.js

cd $TARGET_DIR
git add .
git commit -m "Updated deck.gl@next"
git push origin HEAD

# cd /home/dario/Programming/esri/uber/deck.gl/modules/arcgis
# npm run build-bundle
# cd /home/dario/Programming/esri/damix911.github.io/deckglbuilds
# mv /home/dario/Programming/esri/uber/deck.gl/modules/arcgis/dist.min.js deck.gl.arcgis.js
# git add deck.gl.arcgis.js
# git commit -m "Updated deck.gl.arcgis.js"
# git push origin HEAD


