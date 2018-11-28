#!/bin/bash
# Program
#       This program slipt pttwebcrawler job.
# usage: $bash ./crawler.sh
#PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin:~/bin:
# PATH="/home/villager/.nvm/versions/node/v10.12.0/bin/node:$PATH"
#PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

export PATH=/home/villager/miniconda3/bin:/usr/local/cuda-8.0/bin:/home/villager/miniconda3/bin:/home/villager/.nvm/versions/node/v10.12.0/bin:/usr/local/cuda-8.0/bin:/home/villager/.cargo/bin:/home/villager/bin:/var/lib/mongodb-mms-automation/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin
#"Please input board name: "
bn=Gossiping
#"Please input page per json: "
n=1
#"Please input begin page index: "
bi=39000
#"Please input end page index: "
ei=39010
#"Please input pttdata directory path(ex: ../pttdata/boardname): "
dirpath=/home/villager/test/pttdata/Gossiping
DATE=`date '+%d-%H:%M'`
mkdir "$dirpath-$DATE"
loop=$(((($ei - $bi) / $n) + 1))
echo "dirpath: $dirpath"
echo "loop: $loop"
echo "begin index: $bi"
echo "end index: $ei"
dir=/home/villager/test/ptt-web-crawler
args="Gossiping"
space=" "
cd "$dir"
for((i=0;i<$loop;i++))
do
    ni=$((($bi + $n) - 1))
    if [ "$ni" -gt "$ei" ]
    then
        ni=$ei
    fi
    echo "current page index: $bi to $ni"
    folder=($dirpath-$DATE/$i)
    #args=("$args$space$i")
    echo "folder: $folder"
    python /home/villager/test/ptt-web-crawler/PttWebCrawler/crawler.py -b "$bn" -i "$bi" "$ni" -dp "$folder"
    bi=$(($ni + 1))
done
cd ..
echo "$args"
#node ./server/ptttomongo.js "$args"