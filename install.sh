#!/bin/bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

usage() {
  cat <<'EOF'
Usage: ./install.sh [regular|small|both] [widgets-dir]

Installs generated Übersicht widget folders from this repo into your local widgets directory.

Examples:
  ./install.sh
  ./install.sh small
  ./install.sh both
  ./install.sh regular "$HOME/Library/Application Support/Uebersicht/widgets"

Environment:
  WIDGETS_DIR   Override the destination widgets directory.
EOF
}

convert_js_config_to_json() {
  local source_file="$1"
  local output_file="$2"

  awk '
    BEGIN {
      print "{"
      first = 1
    }
    /^[[:space:]]*[A-Za-z0-9_]+[[:space:]]*:/ {
      line = $0
      sub(/^[[:space:]]*/, "", line)
      split(line, parts, ":")
      key = parts[1]
      value = substr(line, index(line, ":") + 1)
      sub(/^[[:space:]]*/, "", value)
      sub(/[[:space:]]*,?[[:space:]]*$/, "", value)

      if (!first) {
        print ","
      }

      printf "  \"%s\": %s", key, value
      first = 0
    }
    END {
      if (!first) {
        print ""
      }
      print "}"
    }
  ' "${source_file}" > "${output_file}"
}

detect_widgets_dir() {
  local candidates=(
    "${WIDGETS_DIR:-}"
    "$HOME/Library/Application Support/Übersicht/widgets"
    "$HOME/Library/Application Support/Uebersicht/widgets"
  )
  local candidate

  for candidate in "${candidates[@]}"; do
    if [ -n "${candidate}" ] && [ -d "${candidate}" ]; then
      printf '%s\n' "${candidate}"
      return 0
    fi
  done

  if [ -n "${WIDGETS_DIR:-}" ]; then
    printf '%s\n' "${WIDGETS_DIR}"
    return 0
  fi

  return 1
}

install_widget() {
  local source_dir="$1"
  local destination_root="$2"
  local widget_name
  local destination_dir
  local preserved_config
  local preserved_state

  widget_name=$(basename "${source_dir}")
  destination_dir="${destination_root}/${widget_name}"
  preserved_config=""
  preserved_state=""

  if [ ! -d "${source_dir}" ]; then
    printf 'Missing widget directory: %s\n' "${source_dir}" >&2
    exit 1
  fi

  if [ -f "${destination_dir}/config.json" ]; then
    preserved_config=$(mktemp)
    cp "${destination_dir}/config.json" "${preserved_config}"
  elif [ -f "${destination_dir}/config.js" ]; then
    preserved_config=$(mktemp)
    convert_js_config_to_json "${destination_dir}/config.js" "${preserved_config}"
  fi

  if [ -f "${destination_dir}/.tsushin-state" ]; then
    preserved_state=$(mktemp)
    cp "${destination_dir}/.tsushin-state" "${preserved_state}"
  fi

  rm -rf "${destination_dir}"
  cp -R "${source_dir}" "${destination_dir}"

  if [ -n "${preserved_config}" ]; then
    cp "${preserved_config}" "${destination_dir}/config.json"
    rm -f "${preserved_config}"
  fi

  rm -f "${destination_dir}/.tsushin-state"
  if [ -n "${preserved_state}" ]; then
    cp "${preserved_state}" "${destination_dir}/.tsushin-state"
    rm -f "${preserved_state}"
  fi

  printf 'Installed %s -> %s\n' "${widget_name}" "${destination_dir}"
}

target="${1:-regular}"

if [ "${target}" = "--help" ] || [ "${target}" = "-h" ]; then
  usage
  exit 0
fi

widgets_dir="${2:-$(detect_widgets_dir || true)}"

if [ -z "${widgets_dir}" ]; then
  printf 'Could not find your Übersicht widgets directory.\n' >&2
  printf 'Pass it explicitly, for example:\n' >&2
  printf '  ./install.sh regular "$HOME/Library/Application Support/Übersicht/widgets"\n' >&2
  exit 1
fi

mkdir -p "${widgets_dir}"

case "${target}" in
  regular)
    install_widget "${SCRIPT_DIR}/tsushin.widget" "${widgets_dir}"
    ;;
  small)
    install_widget "${SCRIPT_DIR}/tsushin_small.widget" "${widgets_dir}"
    ;;
  both)
    install_widget "${SCRIPT_DIR}/tsushin.widget" "${widgets_dir}"
    install_widget "${SCRIPT_DIR}/tsushin_small.widget" "${widgets_dir}"
    ;;
  *)
    usage >&2
    exit 1
    ;;
esac

printf 'Reload Übersicht to pick up the updated widget files.\n'
