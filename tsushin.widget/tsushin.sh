#!/bin/bash

# Ubersicht widget : tsushin
# By Ryuei Sasaki
# 2016
# https://github.com/louixs/tsushin

#################
#### READ ME ####
#################
# This script needs bash to work as opposed to default shell that ubersicht uses
# To avoid running into error, I have included .bash_profile in the same directory and this scirpt is using it
# This .bash_profile includes paths where most of the recent Mac OS X has bash by defualt
# If you already have your .bash_profile please comment out source .bash_profile  && and uncomment the #source path_to_your_bash_profile && line to specify the path to your own .bash_profile and please make sure that your .bash_profile actually includes a path to bash
# Happy coding
################

####
function getThroughput(){
  source $1 &&
  
  netstat -iw 1 | head -n3 | tail -n1 | awk '{print $3 " " $6}' > $2/tsushin.db &
  process=$!
  sleep 1.5
  pkill -P $process

  in=$(cat $2/tsushin.db | awk '{print $1}')
  out=$(cat $2/tsushin.db | awk '{print $2}')

  echo $in $out
}
####

####
# If you have your own .bash_profile,
# edit if condition below to please include your .bash_profile path instead 
####
if [ ! -e $PWD/.bash_profile ]; then
  getThroughput "$PWD/tsushin.widget/.bash_profile" "$PWD/tsushin.widget"
else
  getThroughput "$PWD/.bash_profile" "$PWD"
fi
