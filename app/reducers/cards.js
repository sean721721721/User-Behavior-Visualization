/* eslint-disable */
// @flow
const cards = (state = [], action) => {
  switch (action.type) {
    case 'ADD_CARD':
      return [
        ...state,
        {
          id: action.id,
          text: action.text,
          completed: false,
          cardprops: action.cardprops,
        },
      ];
    case 'TOGGLE_CARD':
      return state.map(card => (card.id === action.id ? { ...card, completed: !card.completed } : card));
    default:
      return state;
  }
};

export default cards;
