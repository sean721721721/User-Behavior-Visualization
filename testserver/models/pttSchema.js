/* eslint-env node */
const mongoose = require('mongoose');

const { Schema } = mongoose;

// create an export function to encapsulate the model creation

(function loadpttSchema() {
  // define schema
  // NOTE : This object must conform *precisely* to the geoJSON specification
  // you cannot embed a geoJSON doc inside a model or anything like that- IT
  // MUST BE VANILLA
  const countSchema = new Schema({
    all: Number,
    boo: Number,
    count: Number,
    neutral: Number,
    push: Number,
  });

  const messageSchema = new Schema({
    push_content: String,
    push_ipdatetime: String,
    push_tag: String,
    push_userid: String,
  });

  const postSchema = new Schema(
    {
      article_id: String,
      article_title: String,
      author: String,
      board: String,
      content: String,
      date: Date,
      ip: String,
      message_count: countSchema,
      messages: [messageSchema],
      url: String,
    },
    {
      autoIndex: false,
    },
  );

  // const exports = module.exports = {};
  exports.pttSchema = postSchema;
}());
