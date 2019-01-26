// @flow
import {
  ADD_CARD,
  UPDATE_CARD,
  EDIT_CARD,
  CLEAR_CARD,
  TOGGLE_CARD,
  EDIT_TIME,
  EDIT_TITLE,
  EDIT_ABOUT,
  EDIT_TAG,
  SET_VISIBILITY_FILTER,
  SHOW_ALL,
  SHOW_DELETED,
  SHOW_ACTIVE,
  CARD_FETCH_SUCCEEDED,
  CARD_FETCH_FAILED,
  CARD_FETCH_REQUESTED,
  CARD_FETCH_CANCEL,
} from '../constants/action-types';

export const fetchSucceeded = response => ({
  type: CARD_FETCH_SUCCEEDED,
  response,
});

export const fetchFailed = error => ({
  type: CARD_FETCH_FAILED,
  error,
});

export const fetchRequested = () => ({
  type: CARD_FETCH_REQUESTED,
});

export const fetchCancel = () => ({
  typr: CARD_FETCH_CANCEL,
});

let nextCardId = 0;
export const addCard = (props) => {
  nextCardId += 1;
  // console.log(props);
  return {
    type: ADD_CARD,
    id: nextCardId,
    // edit: props,
    time: props.time || '23 Oct 018',
    title: props.title || '柯P',
    description: props.description || '台北市長柯文哲在PTT上別稱',
    tags: props.tags || ['人物', '政治', '台北'],
  };
};

export const updateCard = card => ({
  type: UPDATE_CARD,
  id: card.id,
  time: card.time,
  title: card.title,
  description: card.description,
  tags: card.tags,
});
export const editCard = edit => ({
  type: EDIT_CARD,
  edit,
});

export const clearCard = () => ({
  type: CLEAR_CARD,
});

export const toggleCard = id => ({
  type: TOGGLE_CARD,
  id,
});

export const editTime = time => ({
  type: EDIT_TIME,
  time,
});

export const editTitle = title => ({
  type: EDIT_TITLE,
  title,
});

export const editAbout = about => ({
  type: EDIT_ABOUT,
  about,
});

export const editTag = tag => ({
  type: EDIT_TAG,
  tag,
});

export const setVisibilityFilter = filter => ({
  type: SET_VISIBILITY_FILTER,
  filter,
});

export const VisibilityFilters = {
  SHOW_ALL,
  SHOW_DELETED,
  SHOW_ACTIVE,
};
