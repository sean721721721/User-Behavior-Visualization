// @flow
import React from 'react';
import { render } from 'react-dom';
import middleware from './middlewares/sagamiddleware';
import rootSaga from './middlewares/sagaeffect';
import Route from './components/route';
import './styles.scss';

// create the saga middleware
const { sagaMiddleware } = middleware;
// then run the saga
sagaMiddleware.run(rootSaga);

render(<Route />, document.getElementById('app'));
