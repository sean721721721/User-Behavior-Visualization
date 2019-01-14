// @flow
import React from 'react';
import PropTypes from 'prop-types';
import CardTitle from './CardTitle';
import Card from './Card';
// import { editCard } from '../actions';

const CardList = ({
  cards, editCard, toggleCard,
}) => {
  // console.log(cards);
  // console.log(edit);
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
};

CardList.propTypes = {
  cards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      completed: PropTypes.bool.isRequired,
      edit: PropTypes.string.isRequired,
    }).isRequired,
  ).isRequired,
  toggleCard: PropTypes.func.isRequired,
};

export default CardList;
