#!/bin/bash

CATEGORIES_FILE_NAME="categories_rich"
CATEGORIZE_SCRIPT="categorize_rich.mjs"

# ensure the file exists
test ! -f db/bcvt/${CATEGORIES_FILE_NAME}.json && echo '{}' > db/bcvt/${CATEGORIES_FILE_NAME}.json

jq -r --slurpfile existing db/bcvt/${CATEGORIES_FILE_NAME}.json '
  map(select(.name | in($existing[0]) | not)) | .[].name
' db/bcvt/merged.json \
  | tr '\n' '\0' \
  | xargs -0 -I {} node ${CATEGORIZE_SCRIPT} {} \
  | jq -s 'add' \
  | jq 'input + .' - db/bcvt/${CATEGORIES_FILE_NAME}.json > db/bcvt/${CATEGORIES_FILE_NAME}_new.json \
  && mv db/bcvt/${CATEGORIES_FILE_NAME}_new.json db/bcvt/${CATEGORIES_FILE_NAME}.json