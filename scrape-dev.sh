#!/bin/bash

# Development scraper script that builds if needed

# Check if build is needed
if [ ! -f "dist/cli.js" ] || [ "src/" -nt "dist/" ]; then
    echo "Building TypeScript..."
    yarn build
fi

# scrape the menu from the website using compiled JS
node dist/cli.js menu https://bcvt.eu/L/S/21254/m/Dirkhlbn --pretty > db/$(date +%Y-%m-%d).json

./merge.sh db/*.json > merged.json 