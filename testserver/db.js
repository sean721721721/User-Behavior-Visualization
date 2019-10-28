/* eslint-disable */
var mongoose = require("mongoose");
//var config = require("./config");
var pttschema = require('./models/pttSchema.js');
var fbschema = require('./models/postSchema.js');

// Use native promises
mongoose.Promise = global.Promise;
var options = {
    // useMongoClient: true
};

let db1, db2;

// db2.model(page, schema.pttSchema)
let connect = function (config) {
    // Using `mongoose.createConnection`...
    let url1 = "mongodb://" + config.dbUser + ":" + config.dbPwd + "@" + config.db[0];
    let db1 = mongoose.createConnection(url1, options).on("error", function () {
        console.log("There was an error connecting to the database (db1)");
    }).once("open", function () {
        console.log("connected to " + config.db[0] + " successfully!");
    });
    exports.db1 = db1;
    // db1.model(page, schema.postSchema)
    let url2 = "mongodb://" + config.dbUser + ":" + config.dbPwd + "@" + config.db[1];
    db2 = mongoose.createConnection(url2, options).on("error", function () {
        console.log(url2);
        console.log("There was an error connecting to the database (db2)");
    }).once("open", function () {
        console.log("connected to " + config.db[1] + " successfully!");
    });
    exports.db2 = db2;
};

var exports = module.exports = {};
exports.connect = connect;