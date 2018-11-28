// @flow
import React from 'react';
import { render } from 'react-dom';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import rootReducer from './reducers';
import Grid from './components/grid';
import './styles.scss';

const store = createStore(rootReducer);

render(
  <Provider store={store}>
    <Grid />
  </Provider>,
  document.getElementById('app'),
);
