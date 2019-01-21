// @flow
import React from 'react';
import PropTypes from 'prop-types';
import Checkbox from './CheckBox';

const DownloadTab = ({
  show, onChange, handleDT, selectedOptions,
}) => {
  // const selectedOptions = this.selectedOptions();
  const options = [
    'article_id',
    'article_title',
    'author',
    'board',
    'content',
    'date',
    'ip',
    'all',
    'boo',
    'count',
    'neutral',
    'push',
    'push_content',
    'push_ipdatetime',
    'push_tag',
    'push_userid',
    'url',
  ];
  if (show) {
    return (
      <div id="Download" className="tabcontent">
        <span
          className="topright"
          role="button"
          tabIndex="0"
          onClick={onChange}
          onKeyDown={onChange}
        >
          x
        </span>
        <div id="csv">
          <Checkbox
            name="csv format"
            title="csv format"
            options={options}
            handleChange={handleDT}
            selectedOptions={selectedOptions}
            // checked={this.checked()}
          />
        </div>
      </div>
    );
  }
  return null;
};

DownloadTab.defaultProps = {};
DownloadTab.propTypes = {
  show: PropTypes.bool.isRequired,
  config: PropTypes.shape({
    article_id: PropTypes.bool,
    article_title: PropTypes.bool,
    author: PropTypes.bool,
    board: PropTypes.bool,
    content: PropTypes.bool,
    date: PropTypes.bool,
    ip: PropTypes.bool,
    message_count: PropTypes.shape({
      all: PropTypes.bool,
      boo: PropTypes.bool,
      count: PropTypes.bool,
      neutral: PropTypes.bool,
      push: PropTypes.bool,
    }),
    messages: PropTypes.shape({
      push_content: PropTypes.bool,
      push_ipdatetime: PropTypes.bool,
      push_tag: PropTypes.bool,
      push_userid: PropTypes.bool,
    }),
    url: PropTypes.bool,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  handleDT: PropTypes.func.isRequired,
  selectedOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default DownloadTab;
