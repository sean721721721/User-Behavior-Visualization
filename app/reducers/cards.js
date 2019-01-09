/* eslint-disable */
// @flow

/*
Using concat(), slice(), and …spread for arrays
Using Object.assign() and …spread for objects
*/
const cards = (state = [], action) => {
  switch (action.type) {
    case 'ADD_CARD':{
  console.log(state);
  console.log(action);
      return [
        ...state,
        {
          id: action.id,
          text: action.text,
          completed: false,
          cardprops: action.cardprops,
        },
      ];}
    case 'EDIT_CARD':
      return state.map(card =>
        card.id === action.id ? { ...card, cardprops: action.cardprops } : card,
      );
    case 'TOGGLE_CARD':
      return state.map(card =>
        card.id === action.id ? { ...card, completed: !card.completed } : card,
      );
    default:
      return state;
  }
};

export default cards;
