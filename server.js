const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
// const webpack = require('webpack');
// const webpackDevMiddleware = require('webpack-dev-middleware');

const os = require('os');
const path = require('path');

const app = express();
const config = require('./config')[app.settings.env];
// const wpconfig = require('./webpack.common.js');

// const compiler = webpack(wpconfig);

app.use(cors());
app.use(helmet());

const root = path.resolve(__dirname);
/*
let options = {
  timeout: 10000000,
  pool: {
    maxSockets: Infinity,
  },
  headers: {
    connection: 'keep-alive',
  },
};
*/
/*
 * Serve up files in the /dist directory statically
 */
app.use(express.static(`${__dirname}/dist`));
/*
 * Connect to database
 * remove if not needed
 */
require('./db').connect(config);
// eslint-disable-next-line no-console
console.log('db connected');
/*
 * Load all models and controllers
 * remove if not needed, and you can also remove fs variable declaration above
 */
// controller auto load Account model
/*
require("./models")(app);
console.log('model');
*/
require('./controllers')(app);
// eslint-disable-next-line no-console
console.log('controlers loaded');
/*
 * Set Express settings (middleware and etc)
 * see settings.js to add remove options
 */
require('./settings')(app, config);
// eslint-disable-next-line no-console
console.log('settings loaded');

// Tell express to use the webpack-dev-middleware and use the webpack.config.js
// configuration file as a base.
/* app.use(webpackDevMiddleware(compiler, {
  publicPath: wpconfig.output.publicPath,
}));
*/

/*
 * Serve the files on port xxxx.
 */
if (os.platform() === 'linux') {
  app.set('port', process.env.PORT || 3000);
} else {
  app.set('port', process.env.PORT || 8000);
}

// eslint-disable-next-line no-console
app.listen(app.get('port'), console.log('Express server listening on port %s', app.get('port')));
