// @flow
import React from 'react';
import PropTypes from 'prop-types';
import Card from './Card';
import Cards from './card';

const CardList = ({ cards, toggleCard }) => (
  <div>
    <ul>
      {cards.map(card => (
        <Card
          key={card.id}
          {...card}
          onClick={() => toggleCard(card.id)}
        />
      ))}
    </ul>
    {cards.map(card => (
      <Cards cardprops={card.cardprops} />
    ))}
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
