// @flow
import React from 'react';
import PropTypes from 'prop-types';

const CardTitle = ({
  id, onClick, onEdit, completed, title,
}) => (
  <div className="cardtitle">
    <p>{id}</p>
    <button
      type="button"
      onClick={onClick}
      style={{
        textDecoration: completed ? 'line-through' : 'none',
      }}
    >
      {title}
    </button>
    <button type="button" onClick={onEdit}>
      Edit
    </button>
  </div>
);

CardTitle.propTypes = {
  onClick: PropTypes.func.isRequired,
  completed: PropTypes.bool.isRequired,
  id: PropTypes.string.isRequired,
};

export default CardTitle;
