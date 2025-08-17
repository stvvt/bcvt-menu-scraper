#!/bin/bash

set -e

# Check if any arguments were provided
if [ $# -eq 0 ]; then
  echo "Usage: $0 <json_file1> [json_file2] ..." >&2
  exit 1
fi

# Create a temporary array to hold file content with filenames
temp_json=$(mktemp)
echo "[" > "$temp_json"

first=true
for file in "$@"; do
  if [ "$first" = true ]; then
    first=false
  else
    echo "," >> "$temp_json"
  fi
  
  # Strip db/daily/ prefix and .json suffix from filename
  basename_file=$(basename "$file" .json)
  jq --arg filename "$basename_file" '. + {"filename": $filename}' "$file" >> "$temp_json"
done

echo "]" >> "$temp_json"

jq '
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
            "dateText": .date,
            "date": .filename,
            "price": (.meals[] | select(.name == $name) | .price),
            "currency": (.meals[] | select(.name == $name) | .currency // "лв")
          } +
          ((.meals[] | select(.name == $name) | .weight) as $weight | if $weight != null then {"weight": $weight} else {} end) +
          ((.meals[] | select(.name == $name) | .unit) as $unit | if $unit != null then {"unit": $unit} else {} end) |
          select(.price != null)
        ] |
        reduce .[] as $item ([];
          if length == 0 or .[-1].price != $item.price or .[-1].currency != $item.currency or .[-1].weight != $item.weight or .[-1].unit != $item.unit
          then . + [$item]
          else .
          end
        )
      ),
      "images": (
        [
          $files[] |
          {
            "date": .filename,
            "imageUrl": (.meals[] | select(.name == $name) | .imageUrl)
          } |
          select(.imageUrl != null)
        ] |
        reduce .[] as $item ([];
          if length == 0 or .[-1].imageUrl != $item.imageUrl
          then . + [$item]
          else .
          end
        )
      )
    } |
    select(.prices | length > 0)
  ]
' "$temp_json"

# Clean up
rm "$temp_json"