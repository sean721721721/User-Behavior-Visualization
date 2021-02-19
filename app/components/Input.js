// @flow
import React from 'react';
import PropTypes from 'prop-types';

type InputProps = {
  title: string,
  name: Number,
  inputtype: string,
  value: string,
  onChange: Function,
  placeholder: string,
};

const Input = (props: InputProps) => {
  const {
    title, name, inputtype, value, placeholder, onChange,
  } = props;
  console.log(props);
  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {title}
        <input
          className="form-control"
          id={name}
          name={name}
          type={inputtype}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          {...props}
        />
      </label>
    </div>
  );
};

export default Input;
