#!/bin/bash

# scrape the menu from the website using compiled JS
node dist/cli.js menu https://bcvt.eu/L/S/21254/m/Dirkhlbn --pretty > db/daily/$(date +%Y-%m-%d).json

./merge.sh db/daily/*.json > db/merged.json

./categorize.sh
./categorize_rich.sh
