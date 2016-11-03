#!/bin/bash
source .bash_profile  &&

netstat -iw 1 | head -n3 | tail -n1 | awk '{print $3 " " $6}' > tsushin.db &

process=$!

sleep 1.5

pkill -P $process          

in=$(cat tsushin.db | awk '{print $1}')
out=$(cat tsushin.db | awk '{print $2}')
echo $in $out

