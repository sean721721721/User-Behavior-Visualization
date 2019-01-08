// @flow
import { connect } from 'react-redux';
import { toggleCard, VisibilityFilters } from '../actions';
import CardList from '../components/CardList';

// reducer
const getVisibleCards = (cards, filter) => {
  console.log(cards);
  switch (filter) {
    case VisibilityFilters.SHOW_ALL:
      return cards;
    case VisibilityFilters.SHOW_COMPLETED:
      return cards.filter(t => t.completed);
    case VisibilityFilters.SHOW_ACTIVE:
      return cards.filter(t => !t.completed);
    default:
      throw new Error(`Unknown filter: ${filter}`);
  }
};

const mapStateToProps = state => ({
  cards: getVisibleCards(state.cards, state.visibilityFilter),
});

const mapDispatchToProps = dispatch => ({
  toggleCard: id => dispatch(toggleCard(id)),
});

const VisibleCardList = connect(
  mapStateToProps,
  mapDispatchToProps,
)(CardList);

export default VisibleCardList;
