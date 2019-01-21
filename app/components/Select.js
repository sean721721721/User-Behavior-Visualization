// @flow
import React from 'react';

type SelectProps = {
  title: PropTypes.string,
  name: PropTypes.string,
  options: PropTypes.array,
  value: PropTypes.string,
  handleChange: PropTypes.func,
  placeholder: PropTypes.string,
};

const Select = (props: SelectProps) => {
  const {
    name, title, value, handleChange, placeholder, options,
  } = props;
  return (
    <div className="form-group">
      {/* eslint-disable-next-line jsx-a11y/label-has-for */}
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
