/* eslint-env node */
const mongoose = require('mongoose');
// let dl = require('../models/datalist.js');
const winston = require('winston');
const cardlist = require('../models/card.js');
// Use native promises
mongoose.Promise = global.Promise;
const options = {
  useMongoClient: true,
  useNewUrlParser: true,
};
// var dir="/windows/D/Projects/PageVis";
const logger = winston.createLogger({
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

const findcards = async function findcards(queryobj = {}, sort = {}) {
  // console.log(options)

  // return Query(queryobj, options, pagepost, page);
  // console.log(page, pagepost);
  const query = cardlist.find(queryobj).sort(sort);
  const doc = await query.exec();
  console.log('get cards, length=', doc.length);
  return new Promise((resolve, reject) => {
    resolve({
      result: doc,
    });
  });
};

const callback = (req, res) => new Promise((resolve, reject) => {
  console.log('getcards', req.query);
  const {
    params: { sort },
  } = req;
  const result = findcards({}, sort);
  resolve(result);
}).catch((err) => {
  logger.log('error', err);
});

exports.callback = callback;
