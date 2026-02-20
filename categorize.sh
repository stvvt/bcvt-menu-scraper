#!/bin/bash

venue=${1:?Usage: $0 <venue>}

# ensure the file exists
test ! -f db/${venue}/categories.json && echo '{}' > db/${venue}/categories.json

jq -r --slurpfile existing db/${venue}/categories.json '
  map(select(.name | in($existing[0]) | not)) | .[].name
' db/${venue}/merged.json \
  | tr '\n' '\0' \
  | xargs -0 -I {} node categorize.mjs {} \
  | jq -s 'add' \
  | jq 'input + .' - db/${venue}/categories.json > db/${venue}/categories_new.json \
  && mv db/${venue}/categories_new.json db/${venue}/categories.json