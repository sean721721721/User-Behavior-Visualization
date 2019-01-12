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
} from '../constants/action-types';

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

export const updateCard = (card) => {
  // console.log(card);
  return {
    type: UPDATE_CARD,
    id: card.id,
    time: card.time,
    title: card.title,
    description: card.description,
    tags: card.tags,
  };
};

export const editCard = (edit) => {
  // console.log(edit);
  return {
    type: EDIT_CARD,
    edit,
  };
};

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
  type: 'SET_VISIBILITY_FILTER',
  filter,
});

export const VisibilityFilters = {
  SHOW_ALL: 'SHOW_ALL',
  SHOW_COMPLETED: 'SHOW_COMPLETED',
  SHOW_ACTIVE: 'SHOW_ACTIVE',
};
