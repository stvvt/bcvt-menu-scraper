#!/bin/bash

set -e

if [ $# -eq 0 ]; then
  echo "Usage: $0 <json_file1> [json_file2] ..." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
node "$SCRIPT_DIR/dist/cli.js" merge "$@"
