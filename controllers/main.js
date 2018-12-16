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

function urlhandle(req, res, next) {
  console.log('urlhandle ', req.query);
  var hasquery = false;
  //var postid = req.params.postid;
  if (req.query['postid']) {
    req.params.postid = req.query['postid'];
    hasquery = true;
  }
  if (req.query['page1']) {
    req.params.page1 = req.query['page1'];
    hasquery = true;
  }
  //var time1 = req.params.time1;
  if (req.query['time1']) {
    req.params.time1 = req.query['time1'];
    hasquery = true;
  }
  //var time2 = req.params.time2;
  if (req.query['time2']) {
    req.params.time2 = req.query['time2'];
    hasquery = true;
  }
  if (req.query['keyword1']) {
    req.params.keyword1 = req.query['keyword1'];
  }
  if (req.query['keyword3']) {
    req.params.keyword3 = req.query['keyword3'];
  }
  if (req.query['user1']) {
    req.params.user1 = req.query['user1'];
  }
  if (req.query['page2']) {
    req.params.page2 = req.query['page2'];
    hasquery = true;
  }
  //var time3 = req.params.time3;
  if (req.query['time3']) {
    req.params.time3 = req.query['time3'];
    hasquery = true;
  }
  //var time4 = req.params.time4;
  if (req.query['time4']) {
    req.params.time4 = req.query['time4'];
    hasquery = true;
  }
  if (req.query['user2']) {
    req.params.user2 = req.query['user2'];
  }
  if (req.query['keyword2']) {
    req.params.keyword2 = req.query['keyword2'];
  }
  if (req.query['keyword4']) {
    req.params.keyword4 = req.query['keyword4'];
  }
  if (req.query['posttype']) {
    req.params.posttype = req.query['posttype'];
    hasquery = true;
  }
  if (req.query['fromname']) {
    req.params.fromname = req.query['fromname'];
    hasquery = true;
  }
  if (req.query['minshare']) {
    req.params.minshare = req.query['minshare'];
    hasquery = true;
  }
  if (req.query['maxshare']) {
    req.params.maxshare = req.query['maxshare'];
    hasquery = true;
  }
  if (req.query['minlike']) {
    req.params.minlike = req.query['minlike'];
    hasquery = true;
  }
  if (req.query['maxlike']) {
    req.params.maxlike = req.query['maxlike'];
    hasquery = true;
  }
  if (req.query['mincomment']) {
    req.params.mincomment = req.query['mincomment'];
    hasquery = true;
  }
  if (req.query['maxcomment']) {
    req.params.maxcomment = req.query['maxcomment'];
    hasquery = true;
  }
  if (req.query['minpush']) {
    req.params.minpush = req.query['minpush'];
    hasquery = true;
  }
  if (req.query['maxpush']) {
    req.params.maxpush = req.query['maxpush'];
    hasquery = true;
  }
  if (req.query['minboo']) {
    req.params.minboo = req.query['minboo'];
    hasquery = true;
  }
  if (req.query['maxboo']) {
    req.params.maxboo = req.query['maxboo'];
    hasquery = true;
  }
  if (req.query['minneutral']) {
    req.params.minneutral = req.query['minneutral'];
    hasquery = true;
  }
  if (req.query['maxneutral']) {
    req.params.maxneutral = req.query['maxneutral'];
    hasquery = true;
  }
  if (req.query['co']) {
    req.params.co = req.query['co'];
    hasquery = true;
  }
  if (req.query['next']) {
    req.params.next = req.query['next'];
    hasquery = true;
  }
  req.query.hasquery = hasquery;
  //console.log(req.params);
  next();
}

function redirecturl(req, res) {
  var body = req.body;
  const query = querystring.stringify({
    minlike: body.minlike,
    maxlike: body.maxlike,
    mincomment: body.mincomment,
    maxcomment: body.maxcomment,
    posttype: body.posttype,
    page1: body.pagename1,
    time1: body.date1,
    time2: body.date2,
    user1: body.user1,
    keyword1: body.keyword1,
    keyword3: body.keyword3,
    page2: body.pagename2,
    time3: body.date3,
    time4: body.date4,
    user2: body.user2,
    keyword2: body.keyword2,
    keyword4: body.keyword4,
    co: body.co,
    next: body.next,
  });
  res.redirect('/query?' + query);
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

  app.get('/query', urlhandle, async function(req, res) {
    try {
      var result = await query.callback(req, res);
      //console.log(result);
      res.render('query', result);
    } catch (err) {
      console.log(err);
    }
  });

  app.get('/vis', urlhandle, async function(req, res) {
    try {
      var result = await query.callback(req, res);
      result.title = 'vis';
      //console.log(result);
      res.render('vis', result);
    } catch (err) {
      console.log(err);
    }
  });

  app.post('/query', urlencodedParser, redirecturl);

  app.post('/vis', urlencodedParser, redirecturl);

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
