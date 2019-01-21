// @flow
import React from 'react';
import PropTypes from 'prop-types';
import './style/loading.css';

type LoadingProps = {
  isLoading: PropTypes.bool,
};

const Loading = (props: LoadingProps) => {
  const { isLoading } = props;
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
