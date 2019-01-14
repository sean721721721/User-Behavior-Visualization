/* eslint-disable */
// @flow

/*
Using concat(), slice(), and …spread for arrays
Using Object.assign() and …spread for objects
*/
const cards = (state = [], action) => {
  switch (action.type) {
    case 'ADD_CARD': {
      console.log(state);
      console.log(action);
      return [
        ...state,
        {
          id: action.id,
          // edit: action.edit,
          deleted: false,
          time: action.time,
          title: action.title,
          description: action.description,
          tags: action.tags,
        },
      ];
    }
    case 'UPDATE_CARD': {
      // console.log(action);
      return state.map(card =>
        card.id === action.id
          ? {
              id: action.id,
              // edit: action.edit,
              deleted: false,
              time: action.time,
              title: action.title,
              description: action.description,
              tags: action.tags,
            }
          : card,
      );
    }
    case 'TOGGLE_CARD':
      return state.map(card =>
        card.id === action.id ? { ...card, deleted: !card.deleted } : card,
      );
    default:
      return state;
  }
};

export default cards;
