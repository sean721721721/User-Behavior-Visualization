/* eslint-disable */
/*
var mongoose = require("mongoose"),
UserSchema = new mongoose.Schema({
    email: {type: String, trim: true, required: true, unique: true},
    first_name: {type: String, trim: true, required: true},
    last_name: {type: String, trim: true},
    date_created: {type: Date, default: Date.now}
});

// export out the model for use elsewhere
module.exports = mongoose.model("User", UserSchema);
*/
var mongoose = require('mongoose');

var postSchema = require('./postSchema.js');

// create an export function to encapsulate the model creation

//(function () {
// define schema
// NOTE : This object must conform *precisely* to the geoJSON specification
// you cannot embed a geoJSON doc inside a model or anything like that- IT
// MUST BE VANILLA

var exports = module.exports = {}
//exports.postSchema = postSchema;
console.log("Post Schema");
module.exports = mongoose.model("Post", postSchema);
//})();