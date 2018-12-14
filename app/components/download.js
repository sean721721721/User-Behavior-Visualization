// @flow
import React from 'react';
import PropTypes from 'prop-types';
import Checkbox from './CheckBox';

class DownloadTab extends React.Component {
  constructor(props) {
    super(props);
    this.state = props.config;

    this.handleCheckBox = this.handleCheckBox.bind(this);
    this.selectedOptions = this.selectedOptions.bind(this);
    this.checked = this.checked.bind(this);
  }

  handleCheckBox(e) {
    const newSelection = e.target.value;
    const selectedOptions = this.selectedOptions();
    if (selectedOptions.indexOf(newSelection) > -1) {
      this.setState(prevState => ({
        ...prevState,
        // message_count: prevState.config.message_count,
        // messages: prevState.config.messages,
        [newSelection]: false,
      }));
    } else {
      this.setState(prevState => ({
        ...prevState.config,
        // message_count: prevState.config.message_count,
        // messages: prevState.config.messages,
        [newSelection]: true,
      }));
    }
    console.log(this.state);
  }

  selectedOptions() {
    const {
      article_id,
      article_title,
      author,
      board,
      content,
      date,
      ip,
      message_count: {
        all, boo, count, neutral, push,
      },
      messages: {
        push_content, push_ipdatatime, push_tag, push_userid,
      },
      url,
    } = this.state;
    console.log(this.state);
    const array = [];
    if (article_id) array.push('article_id');
    if (article_title) array.push('article_title');
    if (author) array.push('author');
    if (board) array.push('board');
    if (content) array.push('content');
    if (date) array.push('date');
    if (ip) array.push('ip');
    if (all) array.push('all');
    if (boo) array.push('boo');
    if (count) array.push('count');
    if (neutral) array.push('neutral');
    if (push) array.push('push');
    if (push_content) array.push('push_content');
    if (push_ipdatatime) array.push('push_ipdatatime');
    if (push_tag) array.push('push_tag');
    if (push_userid) array.push('push_userid');
    if (url) array.push('url');
    console.log(array);
    return array;
  }

  checked(option) {
    return selectedOptions.indexOf(option) > -1;
  }

  render() {
    //const { config } = this.state;
    const { show, onChange, config } = this.props;
    const selectedOptions = this.selectedOptions();
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
      'push_ipdatatime',
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
              handleChange={this.handleCheckBox}
              selectedOptions={selectedOptions}
              // checked={this.checked()}
            />
          </div>
        </div>
      );
    }
    return null;
  }
}

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
      push_ipdatatime: PropTypes.bool,
      push_tag: PropTypes.bool,
      push_userid: PropTypes.bool,
    }),
    url: PropTypes.bool,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default DownloadTab;
