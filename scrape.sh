#!/bin/bash

# scrape the menu from the website using compiled JS
node dist/cli.js menu https://bcvt.eu/L/S/21254/m/Dirkhlbn --pretty > db/$(date +%Y-%m-%d).json

./merge.sh db/*.json > merged.json