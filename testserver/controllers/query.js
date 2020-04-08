/* eslint-disable */
let fs = require('fs');
/*var MongoClient = require('mongodb').MongoClient,*/
let assert = require('assert');
let mongoose = require('mongoose');
let dl = require('../models/datalist.js');
let winston = require('winston');
let db = require('../db');
let ns= require('../models/nodeSet.js')
// import bar from '../models/nodeSet.js'
// console.log(ns.setNodes());
// Use native promises
mongoose.Promise = global.Promise;
let options = {
  useMongoClient: true,
};
//var dir="/windows/D/Projects/PageVis";
let logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      name: 'info-file',
      filename: './logs/query-info.log',
      level: 'info',
    }),
    new winston.transports.File({
      name: 'error-file',
      filename: './logs/query-error.log',
      level: 'error',
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: './logs/exceptions.log',
    }),
  ],
  exitOnError: false,
});

let queryobj = function queryobj(req, res, time1, time2, authorid, userid, tkeyword, ckeyword) {
  let queryobj = {};
  if (req.params.posttype) {
    if (req.params.posttype === 'PTT') {
      if (time1 || time2) {
        console.log(time1, time2);
        if (time1) {
          if (!time2) {
            time2 = new Date(Date.now());
          }
          queryobj['date'] = {
            $gte: time1,
            $lt: time2,
          };
        } else {
          queryobj['date'] = {
            $lt: time2,
          };
        }
      }
    } else {
      queryobj['type'] = req.params.posttype;
    }
  } else {
    if (time1 || time2) {
      if (time1) {
        if (!time2) {
          time2 = new Date(Date.now());
        }
        queryobj['created_time'] = {
          $gte: time1,
          $lt: time2,
        };
      } else {
        queryobj['created_time'] = {
          $lt: time2,
        };
      }
    }
  }
  if (tkeyword !== undefined) {
    for(let i=0;i<tkeyword.length;i++)
      if(tkeyword[i] == '[' || tkeyword[i] == ']'){
        tkeyword = tkeyword.slice(0,i) + "\\" + tkeyword.slice(i,tkeyword.length)
        i=i+2
      }
    queryobj['article_title'] = {
      $regex: tkeyword,
    };
  }
  if (userid !== undefined) {
    queryobj['messages.push_userid'] = userid;
  }
  if (authorid !== undefined) {
    queryobj['author'] = authorid;
  }
  if (req.params.postid) {
    queryobj['id'] = req.params.postid;
  }
  if (req.params.fromname) {
    queryobj['from.name'] = req.params.fromname;
  }
  if (req.params.minshare || req.params.maxshare) {
    if (req.params.maxshare) {
      if (!req.params.minshare) {
        req.params.minshare = 0;
      }
      queryobj['shares'] = {
        $gte: Number(req.params.minshare),
        $lt: Number(req.params.maxshare),
      };
    } else {
      queryobj['shares'] = {
        $gte: Number(req.params.minshare),
      };
    }
  }
  if (req.params.minlike || req.params.maxlike) {
    if (req.params.maxlike) {
      if (!req.params.minlike) {
        req.params.minlike = 0;
      }
      queryobj['reactions.like'] = {
        $gte: Number(req.params.minlike),
        $lt: Number(req.params.maxlike),
      };
    } else {
      queryobj['reactions.like'] = {
        $gte: Number(req.params.minlike),
      };
    }
  }
  if (req.params.mincomment || req.params.mincomment) {
    if (req.params.maxcomment) {
      if (!req.params.mincomment) {
        req.params.mincomment = 0;
      }
      queryobj['message_count.all'] = {
        $gte: Number(req.params.mincomment),
        $lt: Number(req.params.maxcomment),
      };
    } else {
      queryobj['message_count.all'] = {
        $gte: Number(req.params.mincomment),
      };
    }
  }
  if (req.params.minpush || req.params.maxpush) {
    if (req.params.maxpush) {
      if (!req.params.minpush) {
        req.params.minpush = 0;
      }
      queryobj['message_count.push'] = {
        $gte: Number(req.params.minpush),
        $lt: Number(req.params.maxpush),
      };
    } else {
      queryobj['message_count.push'] = {
        $gte: Number(req.params.minpush),
      };
    }
  }
  if (req.params.minboo || req.params.maxboo) {
    if (req.params.maxboo) {
      if (!req.params.minboo) {
        req.params.minboo = 0;
      }
      queryobj['message_count.boo'] = {
        $gte: Number(req.params.minboo),
        $lt: Number(req.params.maxboo),
      };
    } else {
      queryobj['message_count.boo'] = {
        $gte: Number(req.params.minlike),
      };
    }
  }
  if (req.params.minneutral || req.params.maxneutral) {
    if (req.params.maxneutral) {
      if (!req.params.minneutral) {
        req.params.minneutral = 0;
      }
      queryobj['message_count.like'] = {
        $gte: Number(req.params.minneutral),
        $lt: Number(req.params.maxneutral),
      };
    } else {
      queryobj['message_count.like'] = {
        $gte: Number(req.params.minneutral),
      };
    }
  }
  if (req.params.previous) {
    const [previousdate, previousid] = req.params.previous.split('_');
    if (ckeyword !== undefined) {
      let keyobj = {};
      keyobj['$or'] = [
        {
          content: {
            $regex: ckeyword,
          },
        },
        {
          'messages.push_content': {
            $regex: ckeyword,
          },
        },
      ];
      let previousobj = {};
      previousobj['$or'] = [
        { date: { $lt: new Date(previousdate) } },
        { date: { $lt: new Date(previousdate) }, _id: { $lt: previousid } },
      ];
      queryobj['$and'] = [keyobj, previousobj];
      console.log(previousobj['$or'][0], previousobj['$or'][1]);
    }
  } else {
    if (req.params.next) {
      const [nextdate, nextid] = req.params.next.split('_');
      if (ckeyword !== undefined) {
        let keyobj = {};
        keyobj['$or'] = [
          {
            content: {
              $regex: ckeyword,
            },
          },
          {
            'messages.push_content': {
              $regex: ckeyword,
            },
          },
        ];
        let nextobj = {};
        nextobj['$or'] = [
          { date: { $gt: new Date(nextdate) } },
          { date: { $gt: new Date(nextdate) }, _id: { $gt: nextid } },
        ];
        queryobj['$and'] = [keyobj, nextobj];
        console.log(nextobj['$or'][0], nextobj['$or'][1]);
      }
    } else {
      if (ckeyword !== undefined) {
        queryobj['$or'] = [
          {
            content: {
              $regex: ckeyword,
            },
          },
          {
            'messages.push_content': {
              $regex: ckeyword,
            },
          },
        ];
      }
    }
  }
  // console.log('queryobj= ', queryobj);
  return queryobj;
};

/**
 db.getCollection('gossipings').find({ 
  article_title: { '$regex': '丁守中' },
  '$and': [
    {'$or': [ {date:{ '$gt': Date('2018-06-05 02:54:44.000Z')}}, {_id:{'$gt': ObjectId("5b3f1f6f6e37944c194de342")}} ],},
    {'$or': [ {content:{'$regex': '柯文哲' }}, {'messages.push_content': {'$regex':'柯文哲'}} ]}
    ]}).sort({
      date: 1,
      _id: 1,
    })
 */

let findquery = async function findquery(page, queryobj, ptt, limit, sort) {
  //console.log(options)
  let pagepost;
  if (ptt) {
    if (!page) {
      page = 'Gossiping';
    }
    let schema = require('../models/pttSchema.js');
    db.db2.model(page, schema.pttSchema);
    pagepost = db.db2.model(page);
  } else {
    if (!page) {
      page = '客台';
    }
    let schema = require('../models/postSchema.js');
    db.db1.model(page, schema.postSchema);
    pagepost = db.db1.model(page);
  }
  //return Query(queryobj, options, pagepost, page);
  // console.log(page, pagepost);
  let query;
  console.log(queryobj);
  if (limit < 0) {
    query = pagepost.find(queryobj).sort(sort);
  } else {
    query = pagepost
      .find(queryobj)
      .sort(sort)
      .limit(limit);
  }
  let doc = await query.exec();
  const first = doc[0];
  const previous = first ? `${first.date}_${first._id}` : ``;
  const last = doc[doc.length - 1];
  const next = last ? `${last.date}_${last._id}` : '';
  console.log(doc.length, next);
  return new Promise((resolve, reject) => {
    resolve({
      result: doc,
      previous: previous,
      next: next,
    });
  });
};

function isEmpty(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) return false;
  }
  return true;
}

let callback = function callback(req, res) {
  let limit = 4;
  let sort = req.params.sort;
  if (req.query.hasquery === false) {
    console.log('no query!');
    let queryresult = {
      title: 'query',
      query: '沒有選取資料範圍',
      summary: '',
      data: [,],
    };
    return queryresult;
  } else {
    console.log('go db');
    let page1 = req.params.page1;
    let user1 = req.params.user1;
    let author1 = req.params.author1;
    let keyword1 = req.params.keyword1;
    let keyword3 = req.params.keyword3;
    let page2 = req.params.page2;
    let user2 = req.params.user2;
    let keyword2 = req.params.keyword2;
    let keyword4 = req.params.keyword4;
    let time1 = req.params.time1;
    let time2 = req.params.time2;
    let time3 = req.params.time3;
    let time4 = req.params.time4;
    let activity = req.params.activity;
    let queryobj1 = queryobj(req, res, time1, time2, author1, user1, keyword1, keyword3);
    let queryobj2 = queryobj(req, res, time3, time4, user2, keyword2, keyword4);
    let samequery =
      page1 === page2 &&
      time1 === time3 &&
      time2 === time4 &&
      keyword1 === keyword2 &&
      keyword3 === keyword4 &&
      user1 === user2;
    let onequery = isEmpty(queryobj1) || isEmpty(queryobj2);
    console.log('checkquery ', isEmpty(queryobj1), isEmpty(queryobj2), onequery);
    let ptt = false;
    if (req.params.posttype === 'PTT') {
      ptt = true;
    }
    //if (samequery || onequery) {
    if (true) {
      return new Promise((resolve, reject) => {
        if (!isEmpty(queryobj1)) {
          limit = -1;
          resolve(
            findquery(page1, queryobj1, ptt, limit, sort).then(res => {
              console.log('q1 lenght: ' + res.result.length);
              const queryArticleFilter = 50;
              // console.log('res.result', res.result);
              res.result = res.result.filter(post => post.message_count.all > queryArticleFilter);
              // Remove article content
              res.result.forEach(function(result){
                result.content = ' ';
                // result.messages.forEach(function(message){
                // message.push_content = '';
                // })
              })
              
              let datalist = dl.bindpostlist(res.result, ptt);
              // let postlist = datalist[0];
              let wordlist = datalist[1];
              let titleWordList = datalist[2];
              let titleCuttedWords = datalist[3];
              console.log('datalist.js done!');
              

              // console.log(titleWordList[0]);
              if (activity) return datalist;
              let [set,initLinks] = ns.setNodes(titleWordList[0], queryobj1.date, titleCuttedWords, res.result);
              // res.result.forEach(a=>{
              //   console.log(a.article_title);
              // })
              // console.log(titleCuttedWords.length, res.result.length);
              console.log('setNodes is done!');
              return { list: [queryobj1.date, [set, initLinks], titleCuttedWords], previous: [res.previous], next: [res.next] };
              // return { list: [res.result, wordlist, titleWordList, queryobj1.date,titleCuttedWords, set], previous: [res.previous], next: [res.next] };
            }),
          );
        } else if (!isEmpty(queryobj2)) {
          resolve(
            findquery(page2, queryobj2, ptt, limit, sort).then(res => {
              return { list: [[], res.result], previous: [res.previous], next: [res.next] };
            }),
          );
        } else {
          console.log('--else--');
          let queryresult = {
            title: 'query',
            query: '沒有選取資料範圍',
            summary: [,],
            data: [, ,],
          };
          reject(queryresult);
        }
      }).catch(err => {
        logger.log('error', err);
      });
    } else {
      return Promise.all([
        findquery(page1, queryobj1, ptt, limit, sort),
        findquery(page2, queryobj2, ptt, limit, sort),
      ])
        .then(res => {
          console.log('q1 lenght: ' + res[0].result.length);
          console.log('q2 lenght: ' + res[1].result.length);
          return {
            list: [res[0].result, res[1].result],
            previous: [res[0].previous, res[1].previous],
            next: [res[0].next, res[1].next],
          };
        })
        .catch(err => {
          logger.log('error', err);
        });
    }
    /*mapreduce
        mapreduce(queryobj1);
        */
    //res.send(files);
    //console.log(files.length);
  }
};

let mapreduce = function mapreduce(queryobj) {
  let o = {};
  self = this;

  o.mapFunction = function() {
    //var key = this.reactions;
    let key = this.likes;
    let value = {
      likes: this.likes,
      /*like: this.like,
            love: this.love,
            haha: this.haha,
            wow: this.wow,
            angry: this.angry,
            sad: this.sad*/
    };
    emit(key, value);
  };
  /*
    var emit = function(key, value) {
        console.log("emit");
        console.log("key: " + key + "  value: " + value);
    }
    */
  o.reduceFunction = function(key, values) {
    let reducedObject = {
      likes: 0,
      /*like: 0,
            love: 0,
            haha: 0,
            wow: 0,
            angry: 0,
            sad: 0*/
    };

    values.forEach(function(value) {
      reducedObject.likes += value.likes;
    });
    return reducedObject;
  };

  o.query = queryobj;

  o.out = {
    reduce: 'session_stat',
  };

  let result = pagepost.mapReduce(o, function(err, res) {
    if (err) console.log(err);
    console.log(res);
    return res;
  });
};

var exports = (module.exports = {});
exports.callback = callback;
