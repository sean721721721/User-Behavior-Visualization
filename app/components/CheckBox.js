// @flow
import React from 'react';

const CheckBox = (props) => {
  const {
    name, title, options, handleChange, selectedOptions,
  } = props;
  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {title}
      </label>
      <div className="checkbox">
        {options.map(option => (
          <label key={option} className="checkbox-inline">
            <input
              id={name}
              name={name}
              onChange={handleChange}
              value={option}
              checked={selectedOptions.indexOf(option) > -1}
              type="checkbox"
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
};

export default CheckBox;
