// @flow
import { combineReducers } from 'redux';
import cards from './cards';
import edit from './edit';
import visibilityFilter from './visibilityFilter';

export default combineReducers({
  cards,
  edit,
  visibilityFilter,
});
