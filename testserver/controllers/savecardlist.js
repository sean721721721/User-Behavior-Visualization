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
      filename: './logs/save-info.log',
      level: 'info',
    }),
    new winston.transports.File({
      name: 'error-file',
      filename: './logs/save-error.log',
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

function save(files) {
  // console.log('savecards', files);
  const savecard = Object.assign({}, files);
  // console.log(files.articles[j]);
  const query = {
    title: files.title,
  };
  // console.log(query);
  return new Promise((resolve, reject) => {
    cardlist.replaceOne(
      query,
      files,
      {
        upsert: true,
      },
      (err, savecard, numAffected) => {
        if (err) {
          logger.log('warn', `did not save post: ${files}`);
          reject(err);
        }
        resolve('true');
      },
    );
  }).catch((err) => {
    logger.log('error', err);
  });
}

async function sub(files) {
  // console.log(files);
  const fl = files.length;
  logger.log('info', `card length = ${fl}`);
  for (let j = 0; j < fl; j += 1) {
    await save(files[j]);
  }
}

const callback = req => new Promise((resolve, reject) => {
  const {
    body: {
      Data: { card },
    },
  } = req;
    // console.log('cards', card);
  resolve(sub(card));
})
  .then(() => ({ isSave: true, lastUpdate: new Date(Date.now()) }))
  .catch((err) => {
    logger.log('error', err);
  });

exports.callback = callback;
