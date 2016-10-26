#!/usr/local/bin/bash
          
source $HOME/.bash_profile  &&
netstat -iw 1 | head -n3 | tail -n1 | awk '{print $3 " " $6}' > tsushin.db &
process=$!

#echo "process PID: "$process
#echo "obtained data. sleeping..."
sleep 1.5
#echo "killing last run PID: " $process
pkill -P $process          
#echo "netstat.db " 
#cat netstat.db

in=$(cat tsushin.db | awk '{print $1}')
out=$(cat tsushin.db | awk '{print $2}')
#echo "In : $in MB"
#echo "Out: $out MB"
echo $in $out
#echo "val1 val2"
