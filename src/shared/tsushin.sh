#!/bin/bash

set -euo pipefail

sample_seconds=1

detect_interface() {
  local interface_name

  interface_name=$(route -n get default 2>/dev/null | awk '/interface: / {print $2; exit}')
  if [ -n "${interface_name}" ]; then
    printf '%s\n' "${interface_name}"
    return 0
  fi

  interface_name=$(netstat -rn -f inet 2>/dev/null | awk '$1 == "default" {print $NF; exit}')
  if [ -n "${interface_name}" ]; then
    printf '%s\n' "${interface_name}"
    return 0
  fi

  interface_name=$(ifconfig 2>/dev/null | awk '
    /^[a-z0-9]+: flags=/ {
      name = $1
      sub(/:$/, "", name)
      active = 0
      has_inet = 0
    }
    /^[[:space:]]*status: active$/ {
      active = 1
    }
    /^[[:space:]]*inet / {
      has_inet = 1
    }
    active && has_inet && name !~ /^lo/ {
      print name
      exit
    }
  ')
  if [ -n "${interface_name}" ]; then
    printf '%s\n' "${interface_name}"
    return 0
  fi

  return 1
}

read_counters() {
  local interface_name="$1"

  netstat -b -n -I "${interface_name}" 2>/dev/null | awk -v iface="${interface_name}" '
    {
      if (!ibytes_col || !obytes_col) {
        for (i = 1; i <= NF; i++) {
          if ($i == "Ibytes") {
            ibytes_col = i
          } else if ($i == "Obytes") {
            obytes_col = i
          }
        }
      }
      if ($1 == iface && ibytes_col && obytes_col) {
        print $ibytes_col, $obytes_col
        exit
      }
    }
  '
}

main() {
  local interface_name
  local first_snapshot
  local second_snapshot
  local in_start
  local out_start
  local in_end
  local out_end
  local down_bytes
  local up_bytes
  local down_kb
  local up_kb

  interface_name=$(detect_interface) || {
    printf '{"error":"Unable to detect an active network interface."}\n'
    exit 1
  }

  first_snapshot=$(read_counters "${interface_name}") || true
  sleep "${sample_seconds}"
  second_snapshot=$(read_counters "${interface_name}") || true

  if [ -z "${first_snapshot}" ] || [ -z "${second_snapshot}" ]; then
    printf '{"error":"Unable to read network counters for %s."}\n' "${interface_name}"
    exit 1
  fi

  read -r in_start out_start <<<"${first_snapshot}"
  read -r in_end out_end <<<"${second_snapshot}"

  down_bytes=$((in_end - in_start))
  up_bytes=$((out_end - out_start))

  if [ "${down_bytes}" -lt 0 ]; then
    down_bytes=0
  fi

  if [ "${up_bytes}" -lt 0 ]; then
    up_bytes=0
  fi

  down_kb=$(awk -v bytes="${down_bytes}" -v seconds="${sample_seconds}" 'BEGIN { printf "%.2f", bytes / 1024 / seconds }')
  up_kb=$(awk -v bytes="${up_bytes}" -v seconds="${sample_seconds}" 'BEGIN { printf "%.2f", bytes / 1024 / seconds }')

  printf '{"interfaceName":"%s","down":%s,"up":%s}\n' "${interface_name}" "${down_kb}" "${up_kb}"
}

main "$@"
