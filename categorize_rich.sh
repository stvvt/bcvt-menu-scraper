#!/bin/bash

venue=${1:?Usage: $0 <venue>}

CATEGORIES_FILE_NAME="categories_rich"
CATEGORIZE_SCRIPT="categorize_rich.mjs"

# ensure the file exists
test ! -f db/${venue}/${CATEGORIES_FILE_NAME}.json && echo '{}' > db/${venue}/${CATEGORIES_FILE_NAME}.json

jq -r --slurpfile existing db/${venue}/${CATEGORIES_FILE_NAME}.json '
  map(select(.name | in($existing[0]) | not)) | .[].name
' db/${venue}/merged.json \
  | tr '\n' '\0' \
  | xargs -0 -I {} node ${CATEGORIZE_SCRIPT} {} \
  | jq -s 'add' \
  | jq 'input + .' - db/${venue}/${CATEGORIES_FILE_NAME}.json > db/${venue}/${CATEGORIES_FILE_NAME}_new.json \
  && mv db/${venue}/${CATEGORIES_FILE_NAME}_new.json db/${venue}/${CATEGORIES_FILE_NAME}.json