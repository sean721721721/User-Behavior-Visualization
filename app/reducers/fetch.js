// @flow
const fetch = (
  state = {
    isFetching: false,
    didInvalidate: false,
    cards: [],
  },
  action,
) => {
  console.log(state, action);
  switch (action.type) {
    case 'CARD_FETCH_SUCCEEDED': {
      const cards = action.cards.map(card => ({ ...card, deleted: false }));
      return Object.assign({}, state, {
        isFetching: false,
        didInvalidate: true,
        cards,
        lastUpdate: action.receiveAt,
      });
    }
    case 'CARD_FETCH_FAILED': {
      return Object.assign({}, state, {
        isFetching: false,
        didInvalidate: false,
      });
    }
    case 'CARD_FETCH_REQUESTED': {
      const result = Object.assign({}, state, {
        isFetching: true,
        didInvalidate: false,
      });
      console.log(result);
      return result;
    }
    case 'CARD_SAVE': {
      const res = Object.assign({}, state, { isSave: true });
      console.log(res);
      return res;
    }
    case 'CARD_SAVE_SUCCEEDED': {
      const result = Object.assign({}, state, {
        lastUpdate: action.lastUpdate,
      });
      console.log(result);
      return result;
    }
    case 'CARD_SAVE_FAILED': {
      return Object.assign({}, state, {});
    }
    case 'ADD_CARD': {
      return {
        ...state,
        cards: [
          ...state.cards, // action,
          {
            id: action.id,
            // edit: action.edit,
            deleted: false,
            time: action.time,
            title: action.title,
            description: action.description,
            tags: action.tags,
          },
        ],
      };
    }
    case 'UPDATE_CARD': {
      const newcards = state.cards.map(card => (card.id === action.id
        ? {
          id: action.id,
          // edit: action.edit,
          deleted: false,
          time: action.time,
          title: action.title,
          description: action.description,
          tags: action.tags,
        }
        : card));
      return { ...state, cards: newcards };
    }
    case 'TOGGLE_CARD': {
      const newcards = state.cards.map(card => (card.id === action.id
        ? {
          ...card,
          deleted: !card.deleted,
        }
        : card));
      return { ...state, cards: newcards };
    }
    default:
      return state;
  }
};

/*
Using concat(), slice(), and …spread for arrays
Using Object.assign() and …spread for objects
*/

export default fetch;
