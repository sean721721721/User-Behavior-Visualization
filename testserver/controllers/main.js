/* eslint-env node */
/* eslint-disable no-console */
const bodyParser = require('body-parser');
// const path = require('path');
const querystring = require('querystring');
const should = require('should'); /* eslint-disable-line no-unused-vars, bugged */
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Account = require('../models/account');
const Card = require('../models/card');
const query = require('./query.js');
const getcardlist = require('./getcardlist');
const savecardlist = require('./savecardlist');

// create application/json parser
const jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({
  extended: false,
});
// const textParser = bodyParser.text();

function querytoParams(req, prop) {
  if (req.query[prop]) {
    req.params[prop] = req.query[prop];
  }
}

// querytoparams and set hasquery prop
function urlhandle(req, res, next) {
  console.log('urlhandle ', req.query);
  let hasquery = false;
  // var postid = req.params.postid;
  const props = Object.keys(req.query);
  const l = props.length;
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
  if (req.query.postid) {
    req.params.postid = req.query.postid;
    hasquery = true;
  }
  req.query.hasquery = hasquery;
  // console.log(req.params);
  next();
}

function redirecturl(req, res) {
  const { body } = req;
  const querystr = querystring.stringify({
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
  });
  res.redirect(`/query?${querystr}`);
}

function authurl(req, res, next) {
  console.log('authurl', req.query);
  req.body = {
    username: req.query.username,
    password: req.query.password,
  };
  next();
}

const main = function main(app) {
  /*
   * passort settings
   */
  app.use(
    /* eslint-disable-next-line global-require */
    require('express-session')({
      secret: 'keyboard cat',
      resave: true,
      saveUninitialized: true,
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // passport config
  passport.use(new LocalStrategy(Account.authenticate()));
  passport.serializeUser(Account.serializeUser());
  passport.deserializeUser(Account.deserializeUser());

  app.param('postid', (req, res, next, postid) => {
    req.postid = postid;
    // console.log(postid);
    next();
  });

  app.post('/query', urlencodedParser, redirecturl);

  app.post('/vis', urlencodedParser, redirecturl);

  /* app.get('/', function(req, res) {
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
  }); */

  // ajax getting data for the web
  app.get('/searching', urlencodedParser, urlhandle, async (req, res) => {
    try {
      // console.log(req.query);
      // if (req.session.passport.user == "villager") {
      // console.log(req);
      const result = await query.callback(req, res);
      result.title = 'search';
      // console.log(result);
      res.send(result);
      // }
    } catch (err) {
      res.send(err);
      console.log(err);
    }
  });

  // fetch getting card data
  app.get('/cardlist', urlencodedParser, async (req, res) => {
    try {
      console.log('get cardlist');
      const result = await getcardlist.callback(req, res);
      res.send(result);
    } catch (err) {
      console.log(err);
    }
  });

  app.post('/savecard', jsonParser, async (req, res) => {
    // console.log('savecard', req.body.cards);
    try {
      const result = await savecardlist.callback(req);
      console.log(result);
      res.send(result);
    } catch (err) {
      console.log(err);
    }
  });

  // for passport
  /*
  app.get('/register', function(req, res) {
    res.render('register', {
      layout: 'auth',
      title: 'Register',
    });
  });
  */
  // what dose the account variable do ?
  app.post('/register', urlencodedParser, (req, res, next) => {
    console.log(req.body);
    Account.register(
      new Account({
        username: req.body.username,
      }),
      req.body.password,
      (err, account) => {
        console.log(account);
        if (err) {
          console.log(err.message);
          return res.render('error', {
            layout: 'auth',
            title: 'Register',
            error: err.message,
          });
        }
        return passport.authenticate('local')(req, res, () => {
          req.session.save((err, account) => {
            console.log(account);
            if (err) {
              return next(err);
            }
            console.log('register');
            return res.redirect('/');
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
    authurl,
    passport.authenticate('local', {
      failureRedirect: '/',
      failureFlash: true,
    }),
    (req, res, next) => {
      console.log(req.body);
      req.session.save((err) => {
        if (err) {
          console.log(err);
          return next(err);
        }
        return Account.findOne({
          username: req.body.username,
        }).exec((error, account) => {
          console.log(account);
          account.username.should.be.eql(req.body.username);
          console.log('  user: ', account.username, 'login');
          // res.redirect('/');
          const Auth = {
            isAuthenticated: true,
          };
          res.send(Auth);
        });
      });
    },
  );

  app.get('/logout', (req, res, next) => {
    req.logout();
    req.session.save((err) => {
      if (err) {
        return next(err);
      }
      console.log('logout');
      return res.redirect('/');
    });
  });
};

module.exports = main;
