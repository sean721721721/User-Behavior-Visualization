# crawler.sh
use ptt-web-crawler
input board name/ page per jsoinput / begin page index/ end page index/ pttdata directory path(ex: ../pttdata/boardname)
json save to the directory path and update json to mongodb ptttomongo.js

#ptttomongo.js
example: node server/ptttomongo.js dirpath boardname subfolder1 subfolder2 subfolder3 subfolder4 subfolder5 ...

#crontab
https://www.cyberciti.biz/faq/how-do-i-add-jobs-to-cron-under-linux-or-unix-oses/

create new crontab job
```
$ crontab -e
```

crontab job example
```
SHELL=/bin/bash
PATH=/sbin:/bin:/usr/sbin:/usr/bin
* * * * * /bin/bash /path to crawler.sh

```

execute crontab
```
$ crontab /path to crontab file
```