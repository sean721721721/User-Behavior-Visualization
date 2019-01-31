/* eslint-env node */
const mongoose = require('mongoose');
const db = require('../db');

const { Schema } = mongoose;

// create an export function to encapsulate the model creation

(function setCardSchema() {
  // define schema
  // NOTE : This object must conform *precisely* to the geoJSON specification
  // you cannot embed a geoJSON doc inside a model or anything like that- IT
  // MUST BE VANILLA

  const cardSchema = new Schema(
    {
      id: String,
      time: String,
      title: String,
      description: String,
      tags: [String],
      date: Date,
    },
    {
      autoIndex: false,
    },
  );

  const collection = 'Card';
  // const exports = module.exports = {};
  module.exports = db.db1.model(collection, cardSchema);
}());
