#!/bin/bash

# scrape the menu from the website using compiled JS
node dist/cli.js menu https://bcvt.eu/L/S/21254/m/Dirkhlbn --pretty > db/bcvt/daily/$(date +%Y-%m-%d).json

./merge.sh db/bcvt/daily/*.json > db/bcvt/merged.json

./categorize.sh bcvt
./categorize_rich.sh bcvt
