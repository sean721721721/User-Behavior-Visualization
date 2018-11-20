// @flow
let nextCardId = 0;
export const setVisibilityFilter = filter => ({
  type: 'SET_VISIBILITY_FILTER',
  filter,
});

export const addCard = (props) => {
  nextCardId += 1;
  return {
    type: 'ADD_CARD',
    id: nextCardId,
    text: props.title,
    cardprops: {
      time: props.time || '23 Oct 018',
      title: props.title || '柯P',
      description: '台北市長柯文哲在PTT上別稱',
      tags: props.tags || ['人物', '政治', '台北'],
    },
  };
};

export const clearCard = () => ({
  type: 'CLEAR_CARD',
  id: nextCardId,
  text: '柯P',
  cardprops: {
    time: '23 Oct 018',
    title: '柯P',
    description: '台北市長柯文哲在PTT上別稱',
    tags: ['人物', '政治', '台北'],
  },
});

export const toggleCard = id => ({
  type: 'TOGGLE_CARD',
  id,
});

export const VisibilityFilters = {
  SHOW_ALL: 'SHOW_ALL',
  SHOW_COMPLETED: 'SHOW_COMPLETED',
  SHOW_ACTIVE: 'SHOW_ACTIVE',
};
