/* eslint-disable */
var express = require('express');
const path = require('path');

// mongoStore used for storing session in mongodb
// mongoStore = require("connect-mongo")(require("connect"));

module.exports = function(app, config) {
  var env = process.env.NODE_ENV || 'development';

  // handle every other route with index.html, which will contain
  // a script tag to your application's JavaScript file(s).
  app.get('*', function(request, response) {
    response.sendFile(path.join(__dirname+'/dist/index.html'));
  });

  /*
   * dev configuration
   */
  // if(env === "development"){
  //     app.use(require("morgan")("dev"));
  //     app.use(require("errorhandler")());
  //     // templates use minified and concatenated css and js by default
  //     // debug boolean used in templates to include unconcatenated and unminified css and js
  // 	app.locals.debug = true;

  // }
  // /*
  // * production configuration
  // */
  // else {
  // 	app.use(require("compression")({
  // 		threshold: 512 // only compress things that are at least 512 bytes in size
  // 	}));
  // }

  // parse request body (JSON, or otherwise)
  //app.use(require("body-parser"));

  /* Session management */
  // TODO, update this using new module
  /*
      // cookieParser
      app.use(express.cookieParser()); 
      // mongoStore
      app.use(express.session({
          secret: "someSecret",
          cookie: {maxAge: 1000*60*60*3},
          store: new mongoStore({
              url: config.db, 
              username: config.dbUser, 
              password: config.dbPwd, 
              stringify: false, 
              collection: "sessions"
          })
      }));
  */

  // global error handler
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    // handle error somehow
    res.send(err);
    res.end();
  });
};
