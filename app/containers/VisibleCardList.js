// @flow
import { connect } from 'react-redux';
import { editCard, toggleCard, VisibilityFilters } from '../actions';
import CardList from '../components/CardList';

// reducer
const getVisibleCards = (cards, filter) => {
  // console.log(cards);
  switch (filter) {
    case VisibilityFilters.SHOW_ALL:
      return cards;
    case VisibilityFilters.SHOW_DELETED:
      return cards.filter(t => t.deleted);
    case VisibilityFilters.SHOW_ACTIVE:
      return cards.filter(t => !t.deleted);
    default:
      throw new Error(`Unknown filter: ${filter}`);
  }
};

const mapStateToProps = (state) => {
  // console.log(state);
  return {
    cards: getVisibleCards(state.cards, state.visibilityFilter),
    edit: state.edit,
  };
};

const mapDispatchToProps = dispatch => ({
  editCard: edit => dispatch(editCard(edit)),
  toggleCard: id => dispatch(toggleCard(id)),
});

const VisibleCardList = connect(
  mapStateToProps,
  mapDispatchToProps,
)(CardList);

export default VisibleCardList;
