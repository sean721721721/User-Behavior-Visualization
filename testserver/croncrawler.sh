#!/bin/bash
# Program
#       This program slipt pttwebcrawler job.
# usage: $bash ./crawler.sh
#PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin:~/bin:
# PATH="/home/villager/.nvm/versions/node/v10.12.0/bin/node:$PATH"
#PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin:/home/villager/.nvm/versions/node/v10.12.0/bin:
#"Please input board name: "
bn=NBA
#"Please input page per json: "
n=1
#"Please input begin page index: "
bi=6000
#"Please input end page index: "
ei=6002
#"Please input pttdata directory path(ex: ../pttdata/boardname): "
dirpath=/home/villager/test/pttdata/NBA
DATE=`date '+%d-%H-%M'`
loop=$(((($ei - $bi) / $n) + 1))
echo "dirpath: $dirpath"
echo "loop: $loop"
echo "begin index: $bi"
echo "end index: $ei"
dir=/home/villager/test/testserver/ptt-web-crawler
args="$bn-$DATE"
space=" "
declare -i to=15
cd "$dir"
for((i=0;i<$loop;i++))
do
    ni=$((($bi + $n) - 1))
    if [ "$ni" -gt "$ei" ]
    then
        ni=$ei
    fi
    echo "current page index: $bi to $ni"
    folder=(../pttdata/$bn-$DATE/$i)
    #args=("$args$space$i")
    echo "folder: $folder"
    echo "mongofolder:" "../pttdata/$args"
    python /home/villager/test/testserver/ptt-web-crawler/PttWebCrawler/crawler.py -b "$bn" -i "$bi" "$ni" -dp "$folder" -to "$to"
    node "/home/villager/test/testserver/lib/ptttomongo.js" "../pttdata/$args" "$bn" "$i"
    bi=$(($ni + 1))
done
cd ..
echo "$args"
