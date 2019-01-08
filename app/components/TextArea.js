// @flow
import React from 'react';
import PropTypes from 'prop-types';

type TextAreaProps = {
  title: PropTypes.string,
  name: PropTypes.string,
  rows: PropTypes.num,
  cols: PropTypes.num,
  value: PropTypes.string,
  handleChange: PropTypes.func,
  placeholder: PropTypes.string,
};

const TextArea = (props: TextAreaProps) => {
  const {
    title, name, rows, cols, value, handleChange, placeholder,
  } = props;
  return (
    <div className="form-group">
      <label className="form-label">{title}</label>
      <textarea
        className="form-control"
        name={name}
        rows={rows}
        cols={cols}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </div>
  );
};

export default TextArea;
