// @flow
import React from 'react';
import PropTypes from 'prop-types';
import CardTitle from './CardTitle';
import Card from './Card';
// import { editCard } from '../actions';

class CardList extends React.Component {
  constructor(props) {
    super(props);
  };
  /*
  componentDidMount() {
    const { dispatch, selectedSubreddit } = this.props;
    dispatch(fetchPostsIfNeeded(selectedSubreddit));
  }

  componentDidUpdate(prevProps) {
    if (this.props.selectedSubreddit !== prevProps.selectedSubreddit) {
      const { dispatch, selectedSubreddit } = this.props;
      dispatch(fetchPostsIfNeeded(selectedSubreddit));
    }
  }
  */
  render() {
    const { cards, editCard, toggleCard } = this.props;
    return (
      <div>
        <ul>
          {cards.map(card => (
            <div>
              <CardTitle
                key={card.id}
                {...card}
                id={card.id}
                deleted={card.deleted}
                onClick={() => toggleCard(card.id)}
                onEdit={() => editCard(card)}
              />
              <Card cardprops={card} />
            </div>
          ))}
        </ul>
      </div>
    );
  }
}

CardList.propTypes = {
  cards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      completed: PropTypes.bool.isRequired,
      edit: PropTypes.string.isRequired,
    }).isRequired,
  ).isRequired,
  editCard: PropTypes.func.isRequired,
  toggleCard: PropTypes.func.isRequired,
};

export default CardList;
