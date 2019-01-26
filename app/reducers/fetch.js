// @flow
const fetch = (
  state = {
    isFetching: false,
    cards: [],
  },
  action,
) => {
  switch (action.type) {
    case 'CARD_FETCH_SUCCEEDED': {
      return Object.assign({}, state, {
        isFetching: true,
        cards: action.response,
        lastUpdate: action.receiveAt,
      });
    }
    case 'CARD_FETCH_FAILED': {
      return Object.assign({}, state, {
        isFetching: true,
      });
    }
    case 'CARD_FETCH_REQUESTED': {
      return Object.assign({}, state, {
        isFetching: true,
      });
    }
    default:
      return state;
  }
};

export default fetch;
