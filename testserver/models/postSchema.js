/* eslint-env node */
const mongoose = require('mongoose');

const { Schema } = mongoose;

// create an export function to encapsulate the model creation

(function loadpostSchema() {
  // define schema
  // NOTE : This object must conform *precisely* to the geoJSON specification
  // you cannot embed a geoJSON doc inside a model or anything like that- IT
  // MUST BE VANILLA
  const fromSchema = new Schema({
    name: String,
    id: String,
  });

  const reactionlist = new Schema({
    id: String,
    name: String,
    type: String,
  });

  const subcomment = new Schema({
    created_time: Date,
    from: fromSchema,
    message: String,
    like_count: Number,
    id: String,
  });

  const contextSchema = new Schema({
    from: fromSchema,
    like_count: Number,
    message: String,
    comments: [subcomment],
    comment_count: Number,
    created_time: Date,
    id: String,
  });

  const reactionSchema = new Schema({
    like: Number,
    love: Number,
    haha: Number,
    wow: Number,
    angry: Number,
    sad: Number,
    list: [reactionlist],
  });

  const commentSchema = new Schema({
    context: [contextSchema],
    summary: Number,
  });

  const attachmentSchema = new Schema({
    description: String,
    url: String,
    title: String,
    type: String,
  });

  const subsharedposts = new Schema({
    id: String,
    created_time: Date,
    type: String,
    message: String,
    from: fromSchema,
    shares: Number,
    likes: Number,
    reactions: reactionSchema,
    comments: commentSchema,
    attachments: attachmentSchema,
  });

  const sharedpostSchema = new Schema({
    data: [subsharedposts],
  });

  const postSchema = new Schema(
    {
      id: String,
      created_time: Date,
      type: String,
      message: String,
      from: fromSchema,
      shares: Number,
      likes: Number,
      reactions: reactionSchema,
      comments: commentSchema,
      attachments: attachmentSchema,
      sharedposts: sharedpostSchema,
    },
    {
      autoIndex: false,
    },
  );

  // const exports = module.exports = {};
  exports.postSchema = postSchema;
}());
