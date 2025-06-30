#!/bin/bash

# scrape the menu from the website
yarn -s dev menu https://bcvt.eu/L/S/21254/m/Dirkhlbn --pretty > db/$(date +%Y-%m-%d).json

./merge.sh db/*.json > merged.json