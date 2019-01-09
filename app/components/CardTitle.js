// @flow
import React from 'react';
import PropTypes from 'prop-types';

const CardTitle = ({ onClick, completed, cardprops }) => (
  <li
    onClick={onClick}
    style={{
      textDecoration: completed ? 'line-through' : 'none',
    }}
  >
    {cardprops.title}
  </li>
);

CardTitle.propTypes = {
  onClick: PropTypes.func.isRequired,
  completed: PropTypes.bool.isRequired,
  text: PropTypes.string.isRequired,
};

export default CardTitle;
