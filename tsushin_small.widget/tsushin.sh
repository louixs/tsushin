#!/bin/bash

set -euo pipefail

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
  local script_dir
  local state_file
  local interface_name
  local snapshot
  local in_now
  local out_now
  local now_ts
  local prev_interface
  local prev_ts
  local in_prev
  local out_prev
  local elapsed
  local down_bytes
  local up_bytes
  local down_kb
  local up_kb

  script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
  state_file="${script_dir}/.tsushin-state"

  interface_name=$(detect_interface) || {
    printf '{"error":"Unable to detect an active network interface."}\n'
    exit 1
  }

  snapshot=$(read_counters "${interface_name}") || true
  if [ -z "${snapshot}" ]; then
    printf '{"error":"Unable to read network counters for %s."}\n' "${interface_name}"
    exit 1
  fi
  read -r in_now out_now <<<"${snapshot}"
  now_ts=$(perl -MTime::HiRes=time -e 'printf "%.6f", time')

  down_kb=0
  up_kb=0

  if [ -f "${state_file}" ]; then
    read -r prev_interface prev_ts in_prev out_prev <"${state_file}" || true

    if [ "${prev_interface}" = "${interface_name}" ] && [ -n "${prev_ts}" ]; then
      elapsed=$(awk -v now="${now_ts}" -v prev="${prev_ts}" 'BEGIN { printf "%.6f", now - prev }')

      if awk -v e="${elapsed}" 'BEGIN { exit !(e > 0) }'; then
        down_bytes=$((in_now - in_prev))
        up_bytes=$((out_now - out_prev))

        if [ "${down_bytes}" -lt 0 ]; then
          down_bytes=0
        fi

        if [ "${up_bytes}" -lt 0 ]; then
          up_bytes=0
        fi

        down_kb=$(awk -v bytes="${down_bytes}" -v seconds="${elapsed}" 'BEGIN { printf "%.2f", bytes / 1024 / seconds }')
        up_kb=$(awk -v bytes="${up_bytes}" -v seconds="${elapsed}" 'BEGIN { printf "%.2f", bytes / 1024 / seconds }')
      fi
    fi
  fi

  printf '%s %s %s %s\n' "${interface_name}" "${now_ts}" "${in_now}" "${out_now}" >"${state_file}"

  printf '{"interfaceName":"%s","down":%s,"up":%s}\n' "${interface_name}" "${down_kb}" "${up_kb}"
}

main "$@"
