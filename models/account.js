/* eslint-disable */
var mongoose = require('mongoose');
var db = require("../db");
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

// create an export function to encapsulate the model creation

(function () {
    // define schema
    // NOTE : This object must conform *precisely* to the geoJSON specification
    // you cannot embed a geoJSON doc inside a model or anything like that- IT
    // MUST BE VANILLA

    var Account = new Schema({
        username: String,
        password: String
    }, {
        autoIndex: false
    });

    Account.plugin(passportLocalMongoose);

    var exports = module.exports = {}
    //exports.postSchema = postSchema;
    //console.log("Account Schema");
    module.exports = db.db1.model("Account", Account);
})();