#!/bin/bash

# Ubersicht widget : tsushin
# By Ryuei Sasaki
# 2016
# https://github.com/louixs/tsushin

#### sourcing the paths of the necessary commands that are usually in different paths just to make sure they work 
whereAwk=$(which awk)
whereCat=$(which cat)
whereNetstat=$(which netstat)

foundPaths="${whereCat///cat}:${whereAwk///awk}:${whereNetstat///netstat}"
####
function getThroughput(){
  export PATH="$foundPaths" &&
  netstat -iw 1 | head -n3 | tail -n1 | awk '{print $3 " " $6}' > "$1/tsushin.db" &
  process=$!
  sleep 1.5  
  pkill -P $process
  
  in=$(cat "$1/tsushin.db" | awk '{print $1}')
  out=$(cat "$1/tsushin.db" | awk '{print $2}')

  echo $in $out
}
####

#### the code below handles cases where a user might have copied files of widget to a non-default widget folder
if [ ! -e "$PWD/tsushin.sh" ]; then
  getThroughput "$PWD/tsushin_small.widget"
else
  getThroughput "$PWD"
fi
