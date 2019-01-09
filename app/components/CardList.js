// @flow
import React from 'react';
import PropTypes from 'prop-types';
import CardTitle from './CardTitle';
import Card from './Card';

const CardList = ({ cards, toggleCard }) => (
  <div>
    <ul>
      {cards.map(card => (
        <div>
          <CardTitle key={card.id} {...card} onClick={() => toggleCard(card.id)} />
          <Card cardprops={card.cardprops} />
        </div>
      ))}
    </ul>
  </div>
);

CardList.propTypes = {
  cards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      completed: PropTypes.bool.isRequired,
      text: PropTypes.string.isRequired,
    }).isRequired,
  ).isRequired,
  toggleCard: PropTypes.func.isRequired,
};

export default CardList;
