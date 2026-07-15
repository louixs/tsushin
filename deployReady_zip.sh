#!/bin/bash

set -euo pipefail

folder=${1:?usage: ./deployReady_zip.sh <widget-folder>}
archive="${folder}.zip"

rm -f "${folder}/tsushin.db"
rm -rf "${folder}/log" "${folder}/assets/log"
rm -f "${archive}"

zip -r "${archive}" "${folder}"
