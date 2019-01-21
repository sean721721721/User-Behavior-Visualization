// @flow
import React from 'react';

type CheckBoxProps = {
  name: PropTypes.string,
  title: PropTypes.string,
  options: PropTypes.array,
  handleChange: PropTypes.func,
  selectedOptions: PropTypes.array,
};
const CheckBox = (props: CheckBoxProps) => {
  const {
    name, title, options, handleChange, selectedOptions,
  } = props;
  return (
    <div className="form-group">
      {/* eslint-disable-next-line jsx-a11y/label-has-for */}
      <label htmlFor={name} className="form-label">
        {title}
      </label>
      <div className="checkbox">
        {options.map(option => (
          <label htmlFor={name} key={option} className="checkbox-inline">
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
