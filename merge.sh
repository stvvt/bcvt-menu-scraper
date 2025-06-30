#!/bin/bash

set -e

# Check if any arguments were provided
if [ $# -eq 0 ]; then
  echo "Usage: $0 <json_file1> [json_file2] ..." >&2
  exit 1
fi

jq -s '
  [
    . as $files |
    (
      map(.meals[].name) | unique
    ) as $all_names |
    $all_names[] as $name |
    {
      "name": $name,
      "prices": (
        [
          $files[] |
          {
            "date": .date,
            "price": (.meals[] | select(.name == $name) | .price)
          } |
          select(.price != null)
        ] |
        reduce .[] as $item ([];
          if length == 0 or .[-1].price != $item.price
          then . + [$item]
          else .
          end
        )
      )
    } |
    select(.prices | length > 0)
  ]
' "$@"