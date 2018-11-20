// @flow
import React from 'react';

const Select = (props) => {
  const {
    name, title, value, handleChange, placeholder, options,
  } = props;
  return (
    <div className="form-group">
      <label htmlFor={name}>
        {' '}
        {title}
        {' '}
      </label>
      <select id={name} name={name} value={value} onChange={handleChange} className="form-control">
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map(option => (
          <option key={option} value={option} label={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
