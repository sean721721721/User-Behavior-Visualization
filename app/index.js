// @flow
import React from 'react';
import { render } from 'react-dom';
import middleware from './middlewares/sagamiddleware';
import rootSaga from './middlewares/sagaeffect';
import Route from './components/route';
import './styles.scss';
import 'bootstrap/dist/css/bootstrap.min.css';

// create the saga middleware
const { sagaMiddleware } = middleware;
// then run the saga
sagaMiddleware.run(rootSaga);
// console.log(PUBLIC_URL);
render(
  <div>
    {/* <Favicon url="https://notorious-2019.com/favicon.ico" /> */}
    <Route />
  </div>, document.getElementById('app'),
);
