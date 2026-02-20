#!/bin/bash

# ensure the file exists
test ! -f db/bcvt/categories.json && echo '{}' > db/bcvt/categories.json

jq -r --slurpfile existing db/bcvt/categories.json '
  map(select(.name | in($existing[0]) | not)) | .[].name
' db/bcvt/merged.json \
  | tr '\n' '\0' \
  | xargs -0 -I {} node categorize.mjs {} \
  | jq -s 'add' \
  | jq 'input + .' - db/bcvt/categories.json > db/bcvt/categories_new.json \
  && mv db/bcvt/categories_new.json db/bcvt/categories.json