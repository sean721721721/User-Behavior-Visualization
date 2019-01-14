// @flow
import React from 'react';
import PropTypes from 'prop-types';
// import './switch.css';

const CardTitle = ({
  id, onClick, onEdit, deleted, title,
}) => (
  <div className="cardtitle">
    <button type="button" onClick={onEdit}>
      {id}
      {' '}
      {title}
    </button>
    <button
      type="button"
      onClick={onClick}
      style={{
        textDecoration: deleted ? 'line-through' : 'none',
      }}
    >
      Delete
    </button>
    {/* <label className="switch" id="active">
      {deleted ? <input type="checkbox" checkd /> : <input type="checkbox"/>}
      <span className="slider round" />
    </label> */}
  </div>
);

CardTitle.propTypes = {
  onClick: PropTypes.func.isRequired,
  deleted: PropTypes.bool.isRequired,
  id: PropTypes.number.isRequired,
};

export default CardTitle;
