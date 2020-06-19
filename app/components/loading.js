// @flow
import React from 'react';
import PropTypes from 'prop-types';
import './style/loading.css';

type LoadingProps = {
  isLoading: PropTypes.bool,
  responseError: PropTypes.bool,
  errorType: PropTypes.string,
};

const Loading = (props: LoadingProps) => {
  const { isLoading, responseError, errorType } = props;
  // console.log(props);
  if (responseError) {
    return (
      <div className="wrapperresponding">
        <div className="responseerror">
          <span id="x">X</span>
        </div>
        <p className="text">{errorType.message}</p>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="wrapperloading">
        <div className="loading up" />
        <div className="loading down" />
      </div>
    );
  }
  return null;
};

export default Loading;
