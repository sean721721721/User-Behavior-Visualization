// @flow
import React from 'react';
import PropTypes from 'prop-types';

type InputProps = {
  title: PropTypes.string,
  name: PropTypes.string,
  inputtype: PropTypes.string,
  value: PropTypes.string,
  handleChange: PropTypes.func,
  placeholder: PropTypes.string,
};

const Input = (props: InputProps) => {
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
