/* eslint-disable */
//var express = require('express');
//var router = express.Router();
var bodyParser = require('body-parser');
const path = require('path');
var query = require('./query.js');
const querystring = require('querystring');
var should = require('should');

// create application/json parser
var jsonParser = bodyParser.json();
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({
  extended: false,
});
//
var textParser = bodyParser.text();

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

function querytoParams(req, prop) {
  if (req.query[prop]) {
    req.params[prop] = req.query[prop];
  }
}

function urlhandle(req, res, next) {
  console.log('urlhandle ', req.query);
  var hasquery = false;
  //var postid = req.params.postid;
  let props = Object.keys(req.query);
  let l = props.length;
  if (l > 0) hasquery = true;
  for (let i = 0; i < l; i += 1) {
    querytoParams(req, props[i], hasquery);
  }
  if (req.query.previous && req.query.previous.length > 0) {
    req.params.sort = {
      date: -1,
      _id: -1,
    };
  } else {
    req.params.sort = {
      date: 1,
      _id: 1,
    };
  }
  if (req.query['postid']) {
    req.params.postid = req.query['postid'];
    hasquery = true;
  }
  req.query.hasquery = hasquery;
  //console.log(req.params);
  next();
}

module.exports = function(app) {
  /*
   * passort settings
   */
  app.use(
    require('express-session')({
      secret: 'keyboard cat',
      resave: true,
      saveUninitialized: true,
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());
  // passport config

  var Account = require('../models/account');
  passport.use(new LocalStrategy(Account.authenticate()));
  passport.serializeUser(Account.serializeUser());
  passport.deserializeUser(Account.deserializeUser());

  app.param('postid', function(req, res, next, postid) {
    req.postid = postid;
    //console.log(postid);
    next();
  });

  /*app.get('/', function(req, res) {
    if (req.session.passport && req.session.passport.user !== undefined) {
      res.send('index.html');
    } else {
      req.session.passport = {};
      res.render('home', {
        title: 'Home',
        boturl: '/login',
        botton: 'Login',
      });
      res.send({
        status: 200,
        message: 'success',
      });
    }
    console.log(' passport: ', req.session.passport);
  });*/

  // ajax getting data for the web
  app.get('/searching', urlencodedParser, urlhandle, async function(req, res) {
    try {
      //console.log(req.query);
      //if (req.session.passport.user == "villager") {
      //console.log(req);
      var result = await query.callback(req, res);
      result.title = 'search';
      //console.log(result);
      res.send(result);
      //}
    } catch (err) {
      console.log(err);
    }
  });

  // for passport
  app.get('/register', function(req, res) {
    res.render('register', {
      layout: 'auth',
      title: 'Register',
    });
  });

  app.post('/register', urlencodedParser, function(req, res, next) {
    console.log(req.body);
    Account.register(
      new Account({
        username: req.body.username,
      }),
      req.body.password,
      function(err, account) {
        if (err) {
          console.log(err.message);
          return res.render('error', {
            layout: 'auth',
            title: 'Register',
            error: err.message,
          });
        }

        passport.authenticate('local')(req, res, function() {
          req.session.save(function(err) {
            if (err) {
              return next(err);
            }
            console.log('register');
            res.redirect('/');
          });
        });
      },
    );
  });
  /*
  app.get('/login', function(req, res) {
    //console.log(res);
    res.render('login', {
      layout: 'auth',
      title: 'Login',
    });
  });
  */
  app.post(
    '/login',
    urlencodedParser,
    passport.authenticate('local', {
      failureRedirect: '/',
      failureFlash: true,
    }),
    (req, res, next) => {
      req.session.save(err => {
        if (err) {
          console.log(err);
          return next(err);
        }
        Account.findOne(
          {
            username: req.body.username,
          },
          (err, account) => {
            console.log(account);
            account.username.should.eql(req.body.username);
            console.log('   username: ', account.username);
            console.log('login');
            //res.redirect('/');
            const fakeAuth = {
              isAuthenticated: true,
              authenticate(cb) {
                this.isAuthenticated = true;
                setTimeout(cb, 100); // fake async
              },
              signout(cb) {
                this.isAuthenticated = false;
                setTimeout(cb, 100);
              },
            };
            res.send(fakeAuth);
          },
        );
      });
    },
  );

  app.get('/logout', (req, res, next) => {
    req.logout();
    req.session.save(err => {
      if (err) {
        return next(err);
      }
      console.log('logout');
      res.redirect('/');
    });
  });
};
