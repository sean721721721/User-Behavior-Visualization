/* eslint-disable */
var express = require("express");
var exphbs = require('express-handlebars');
var path = require('path');
// var ansyc = require('./server/ansyc.js');
var tableHandler = require('./server/tableHandler.js');

//var handle = require('./routes/handle.js');
// var helpers = require('./lib/helpers');

// mongoStore used for storing session in mongodb
// mongoStore = require("connect-mongo")(require("connect"));

module.exports = function (app, config) {

  var env = process.env.NODE_ENV || "development";

  /* 
   * Serve up files in the /public directory statically
   */
  app.use(express.static('public/'));

  /* 
   * View setup
   */
  // Create `ExpressHandlebars` instance with a default layout.
  var hbs = exphbs.create({
    defaultLayout: 'main',
    extname: ".hbs",
    //helpers: helpers, // old setups for server
    helpers: require("./public/lib/helpers").helpers,

    // Uses multiple partials dirs, templates in "shared/templates/" are shared
    // with the client-side of the app (see below).

    partialsDir: [
      'shared/templates/',
      'views/partials/'
    ],
    //partialsDir: 'views/partials/', // same as default, I just like to be explicit
    layoutsDir: "views/layouts/" // same as default, I just like to be explicit
  });

  hbs.getPartials(function (err, partials) {
    // attach partials to Handlebars instance, exposing them to helpers
    hbs.handlebars.partials = partials;
    require("./public/lib/helpers").register(hbs.handlebars);
  });

  app.engine('hbs', hbs.engine);
  app.set('view engine', 'hbs');

  //app.enable('view cache');

  // Middleware to expose the app's shared templates to the cliet-side of the app
  // for pages which need them.
  function exposeTemplates(req, res, next) {
    // Uses the `ExpressHandlebars` instance to get the get the **precompiled**
    // templates which will be shared with the client-side of the app.
    hbs.getTemplates('shared/templates/', {
        cache: app.enabled('view cache'),
        precompiled: true,
      }).then(function (templates) {
        // RegExp to remove the ".handlebars" extension from the template names.
        var extRegex = new RegExp(hbs.extname + '$');

        // Creates an array of templates which are exposed via
        // `res.locals.templates`.
        templates = Object.keys(templates).map(function (name) {
          return {
            name: name.replace(extRegex, ''),
            template: templates[name],
          };
        });

        // Exposes the templates during view rendering.
        if (templates.length) {
          res.locals.templates = templates;
        }

        setImmediate(next);
      })
      .catch(next);
  }

  //var conf = require("./config").facebook;

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
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    // handle error somehow
    res.render('error', {
      message: err.message,
      error: {}
    });
    res.end();
  });
};