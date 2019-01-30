/* eslint-env node */

const controller = function controller(app) {
  const files = ['main'];
  /*
  app.use((req, res, next) => {
    res.locals.path = req.path;
    res.locals.navPages = [
      {
        url: '/',
        name: 'Home',
      },
      {
        url: '/foo',
        name: 'Foo',
      },
      {
        url: '/bar',
        name: 'Bar',
      },
      {
        url: '/snarf',
        name: 'Snarf',
      },
    ];
    next();
  }); */

  // app.use('/', handle);

  files.forEach((file) => {
    /* eslint-disable-next-line global-require, import/no-dynamic-require */
    require(`./${file}`)(app);
  });
};

module.exports = controller;
