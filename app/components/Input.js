// @flow
import React from 'react';

const Input = (props) => {
  const {
    title, name, inputtype, value, handleChange, placeholder,
  } = props;
  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {title}
      </label>
      <input
        className="form-control"
        id={name}
        name={name}
        type={inputtype}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
};
export default Input;
