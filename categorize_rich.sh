#!/bin/bash

CATEGORIES_FILE_NAME="categories_rich"
CATEGORIZE_SCRIPT="categorize_rich.mjs"

# ensure the file exists
test ! -f db/${CATEGORIES_FILE_NAME}.json && echo '{}' > db/${CATEGORIES_FILE_NAME}.json

jq -r --slurpfile existing db/${CATEGORIES_FILE_NAME}.json '
  map(select(.name | in($existing[0]) | not)) | .[].name
' db/merged.json \
  | tr '\n' '\0' \
  | xargs -0 -I {} node ${CATEGORIZE_SCRIPT} {} \
  | jq -s 'add' \
  | jq 'input + .' - db/${CATEGORIES_FILE_NAME}.json > db/${CATEGORIES_FILE_NAME}_new.json \
  && mv db/${CATEGORIES_FILE_NAME}_new.json db/${CATEGORIES_FILE_NAME}.json