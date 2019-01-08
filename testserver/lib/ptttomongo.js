/* @flow */
/*eslint-disable */
/*
usage command example:
node ptttomongo.js MC 1 2 3 4 5
 */
var fs = require('fs');
/*var MongoClient = require('mongodb').MongoClient,*/
var assert = require('assert');
var mongoose = require('mongoose');
const winston = require('winston');
var schema = require('../models/pttSchema.js');

(function(){
    var parse = JSON.parse;
    JSON = {
        stringify: JSON.stringify,
        validate: function(str){
            try{
                parse(str);
                return true;
            }catch(err){
                return err;
            }
        },

        parse: function(str){
            try{
                return parse(str);
            }catch(err){
                return undefined;
            }
        }
    }
})();
/*
console.log( JSON.validate('{"foo":"bar"}') ); //true
console.log( JSON.validate('{foo:"bar"}') ); //Error message: [SyntaxError: Unexpected token f]

console.log( JSON.parse('{"foo":"bar"}') ); // js object, { foo: 'bar' }
console.log( JSON.parse('{foo:"bar"}') ); //undefined
console.log( JSON.stringify({foo:"bar"}) ); //{"foo":"bar"}
*/
//assert.equal(query.exec().constructor, global.Promise);
/*
// Connection URL
var url = 'mongodb://localhost:27017/myproject';

// Use connect method to connect to the server
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected successfully to server");

  db.close();
});
*/
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    new winston.transports.Console(),
    new winston.transports.File({
      name: 'info-file',
      filename: '../logs/store-info.log',
      level: 'info',
    }),
    new winston.transports.File({
      name: 'warn-file',
      filename: '../logs/store-warn.log',
      level: 'warn',
    }),
    new winston.transports.File({
      name: 'error-file',
      filename: '../logs/store-error.log',
      level: 'error',
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: '../logs/exceptions.log',
    }),
  ],
  exitOnError: false,
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

// Use native promises
var options = {
  promiseLibrary: global.Promise,
  useNewUrlParser: true,
};

// Using `mongoose.connect`...
mongoose.connect(
  'mongodb://villager:4given4get@localhost:27017/ptt?authSource=admin',
  options,
);
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("we're connected!");
});

function promiseAllP(items, block) {
  var promises = [];
  items.forEach(function(item, index) {
    promises.push(
      (function(item, i) {
        return new Promise(function(resolve, reject) {
          return block.apply(this, [item, index, resolve, reject]);
        });
      })(item, index),
    );
  });
  return Promise.all(promises);
}

var saveFiles = function saveFiles(dirname, collection, schema) {
  mongoose.model(collection, schema);

  function save(files) {
    var pagepost = mongoose.model(collection);
    var savepost = Object.assign({}, files);
    //console.log(files.articles[j]);
    var query = {
      article_id: files['article_id'],
    };
    //console.log(query);
    return new Promise((resolve, reject) => {
      pagepost.replaceOne(
        query,
        files,
        {
          upsert: true,
        },
        function(err, savepost, numAffected) {
          //logger.log('info', 'update:'+ files['article_id']);
          /*if (post !== undefined) {
                        console.log(files['article_id']);
                    }*/
          if (err) {
            logger.log('warn', 'did not save post: ' + files['article_id']);
            reject(err);
          }
          resolve('true');
        },
      );
    }).catch(err => {
      logger.log('error', err);
    });
  }

  return new Promise((resolve, reject) => {
    fs.readdir(dirname, function(err, filenames) {
      if (err) return reject(err);
      resolve(split());
      async function split() {
        await promiseAllP(filenames, (filename, index, resolve, reject) => {
          if (err) {
            logger.log('warn', 'ReadFolder error, did not save: ' + filename);
            reject(err);
          }
          let p = new Promise((resolve, reject) => {
            fs.readFile(dirname + '/' + filename, 'utf-8', (err, data) => {
              if (err) {
                logger.log('warn', 'ReadFile error, did not save: ' + filename);
                reject(err);
              }
              resolve(sub());
              async function sub() {
                var files = JSON.parse(data);
                if(files===undefined) logger.log('warn', 'JSON parse error, did not save: ' + filename);
                var fl = files.articles.length;
                logger.log('info', filename + ' length = ' + fl);
                for (var j = 0; j < fl; j++) {
                  await save(files.articles[j]);
                }
              }
            });
          }).catch(err => {
            logger.log('error', err);
          });

          return resolve(p);
        }).catch(err => {
          logger.log('error', err);
        });
      }
    });
  }).catch(err => {
    logger.log('error', err);
  });
};

// argv [argv0, path, boardname, ...datafolder]
process.argv.shift();
process.argv.shift();
let path = process.argv.shift();
let board = process.argv.shift();
let root = '../pttdata/' + path;
let folders = process.argv;
logger.log('info', path + ' ' + board + ' ' + folders);
//var folders = ['30', '31', '32', '33', '34', '35', '36', '37', '38']; // 'Tech_Job', 'Gossiping', 'Soft_Job'];
//folders.forEach(folder => {
//var root = "../pttdata/Gossiping";
readfolder();
async function readfolder() {
  for (let i = 0; i < folders.length; i++) {
    folder = folders[i];
    await saveFiles(path + '/' + folder, board, schema.pttSchema)
      .then(function() {
        console.log('saved');
      })
      .catch(error => {
        logger.log('error', error);
      });
    //mongoose.model(folder, schema.postSchema)
    //mongoose.model(folder, schema.pttSchema)
    //var pagepost = mongoose.model(folder);
    //console.log(typeof(root + '/' + folder))
  }
  process.exit(-1);
}
/* problem posts list
Gossiping
// 2 M.1502704474.A.3CB
// 3  Unexpected end of JSON input
// 4 M.1503736380.A.DDD
// 7 M.1505686462.A.F75
// 12 Unexpected token ] in JSON
// 14 M.1511331265.A.E0F
// 15 M.1511585281.A.1DB
// 19 M.1514572172.A.1CB
// 22 M.1517447643.A.EB2
// 37 M.1529389499.A.8ED

MobileComm
// 201709_201808 M.1525203014.A.4DF
*/
/*readFiles.readFiles(root + '/' + folder)
    .then(function (files) {
        console.log("loaded ", files.length)
        //save post to db
        for (var i = 0; i < files.length; i++) {
            //console.log(files[i].contents);
            var fl = files[i].contents.articles.length;
            console.log("file length = " + fl);
            for (var j = 0; j < fl; j++) {
                var post = new pagepost();
                post = Object.assign(post, files[i].contents.articles[j]);
                //console.log(post);
                post.save(function (err, post, numAffected) {
                    //console.log(numAffected);
                    //console.log(post);
                    if (err) console.log(err);
                })
            }
        }
    })
    .catch(error => {
        console.log(error);
    });*/
//});

//var exports = module.exports = {};
//exports.readFiles = readFiles;
