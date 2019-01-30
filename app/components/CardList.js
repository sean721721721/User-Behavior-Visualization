// @flow
import React from 'react';
import PropTypes from 'prop-types';
import CardTitle from './CardTitle';
import Card from './Card';
// import { editCard } from '../actions';

const CardList = (props) => {
  console.log(props);
  const {
    fetch: { cards },
    editCard,
    toggleCard,
  } = props;
  return (
    <div>
      <ul>
        {cards.map(card => (
          <div>
            <CardTitle
              key={card.id}
              {...card}
              id={card.id}
              // deleted={card.deleted}
              onClick={() => toggleCard(card.id)}
              onEdit={() => editCard(card)}
            />
            <Card cardprops={card} />
          </div>
        ))}
      </ul>
    </div>
  );
};

CardList.propTypes = {
  fetch: PropTypes.shape({
    cards: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        // completed: PropTypes.bool.isRequired,
      }).isRequired,
    ).isRequired,
  }).isRequired,
  editCard: PropTypes.func.isRequired,
  toggleCard: PropTypes.func.isRequired,
};

export default CardList;
