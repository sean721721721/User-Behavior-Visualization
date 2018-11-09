/* eslint-disable */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// create an export function to encapsulate the model creation

(function () {
    // define schema
    // NOTE : This object must conform *precisely* to the geoJSON specification
    // you cannot embed a geoJSON doc inside a model or anything like that- IT
    // MUST BE VANILLA
    var fromSchema = new Schema({
        name: String,
        id: String,
    });

    var reactionlist = new Schema({
        id: String,
        name: String,
        type: String,
    });

    var subcomment = new Schema({
        created_time: Date,
        from: fromSchema,
        message: String,
        like_count: Number,
        id: String,
    });

    var contextSchema = new Schema({
        from: fromSchema,
        like_count: Number,
        message: String,
        comments: [subcomment],
        comment_count: Number,
        created_time: Date,
        id: String,
    });

    var reactionSchema = new Schema({
        like: Number,
        love: Number,
        haha: Number,
        wow: Number,
        angry: Number,
        sad: Number,
        list: [reactionlist],
    });

    var commentSchema = new Schema({
        context: [contextSchema],
        summary: Number,
    });

    var attachmentSchema = new Schema({
        description: String,
        url: String,
        title: String,
        type: String,
    });

    var subsharedposts = new Schema({
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

    var sharedpostSchema = new Schema({
        data: [subsharedposts],
    });

    var postSchema = new Schema({
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
    }, {
        autoIndex: false
    });

    var exports = module.exports = {}
    exports.postSchema = postSchema;
})();