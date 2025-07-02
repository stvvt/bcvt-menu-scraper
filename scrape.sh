#!/bin/bash

# scrape the menu from the website using compiled JS
node dist/cli.js menu https://bcvt.eu/L/S/21254/m/Dirkhlbn --pretty > db/daily/$(date +%Y-%m-%d).json

./merge.sh db/daily/*.json > db/merged.json

# categorize the meals

jq -r --slurpfile existing db/categories.json '
  map(select(.name | in($existing[0]) | not)) | .[].name
' db/merged.json \
  | xargs -I {} node categorize.js "{}" \
  | jq -s 'add' \
  | jq 'input + .' - db/categories.json > db/categories_new.json \
  && mv db/categories_new.json db/categories.json