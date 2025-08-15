#!/bin/bash

# ensure the file exists
test ! -f db/categories.json && echo '{}' > db/categories.json

jq -r --slurpfile existing db/categories.json '
  map(select(.name | in($existing[0]) | not)) | .[].name
' db/merged.json \
  | tr '\n' '\0' \
  | xargs -0 -I {} node categorize.js {} \
  | jq -s 'add' \
  | jq 'input + .' - db/categories.json > db/categories_new.json \
  && mv db/categories_new.json db/categories.json