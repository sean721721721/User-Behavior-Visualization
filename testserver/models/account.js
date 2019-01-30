/* eslint-env node */
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const db = require('../db');

const { Schema } = mongoose;

// create an export function to encapsulate the model creation

(function setAccountSchema() {
  // define schema
  // NOTE : This object must conform *precisely* to the geoJSON specification
  // you cannot embed a geoJSON doc inside a model or anything like that- IT
  // MUST BE VANILLA

  const Account = new Schema(
    {
      username: String,
      password: String,
    },
    {
      autoIndex: false,
    },
  );

  Account.plugin(passportLocalMongoose);

  // const exports = module.exports = {};
  // exports.postSchema = postSchema;
  // console.log("Account Schema");
  module.exports = db.db1.model('Account', Account);
}());
