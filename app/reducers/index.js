// @flow
import { combineReducers } from 'redux';
import cards from './cards';
import visibilityFilter from './visibilityFilter';

export default combineReducers({
  cards,
  visibilityFilter,
});
