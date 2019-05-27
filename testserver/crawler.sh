#!/bin/bash
# Program:
#       This program slipt pttwebcrawler job.
# History:
# 2015/07/16	VBird	First release
# usage: $bash ./crawler.sh
#PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin:~/bin:
# PATH="/home/villager/.nvm/versions/node/v10.12.0/bin/node:$PATH"
# export PATH
# export NODE_PATH=`which node`
read -p "Please input board name: " bn
read -p "Please input page per json: " n
read -p "Please input begin page index: " bi
read -p "Please input end page index: " ei
read -p "Please input pttdata directory path(ex: ../pttdata/boardname): " dirpath
mkdir "$dirpath"
loop=$(((($ei - $bi) / $n) + 1))
echo "dirpath: $dirpath"
echo "loop: $loop"
echo "begin index: $bi"
echo "end index: $ei"
args="$dirpath"
space=" "
declare -i to=15
echo "timeout: $to"
for((i=0;i<$loop;i++))
do
    ni=$((($bi + $n) - 1))
    if [ "$ni" -gt "$ei" ]
    then
        ni=$ei
    fi
    echo "current page index: $bi to $ni"
    folder=($dirpath/$i)
    #args=("$args$space$i")
    echo "folder: $folder"
    python ptt-web-crawler/PttWebCrawler/crawler.py -b "$bn" -i "$bi" "$ni" -dp "$folder" -to "$to"
    node "../testserver/lib/ptttomongo.js" "$dirpath" "$bn" "$i"
    bi=$(($ni + 1))
done
cd ..
#echo "$args"
#node ./server/ptttomongo.js "$args"
exit 0