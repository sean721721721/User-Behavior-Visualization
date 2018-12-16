// @flow
import React from 'react';
import { render } from 'react-dom';
import Route from './components/route';
import './styles.scss';

render(
  <Route />, document.getElementById('app'),
);
