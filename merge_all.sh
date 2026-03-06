#!/bin/bash

set -e

venue=${1:?Usage: $0 <venue>}

./merge.sh db/${venue}/daily/*.json > db/${venue}/merged.json