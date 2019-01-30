// @flow
import { combineReducers } from 'redux';
import fetch from './fetch';
// import cards from './cards';
import edit from './edit';
import visibilityFilter from './visibilityFilter';

export default combineReducers({
  fetch,
  /* cards, */
  edit,
  visibilityFilter,
});
