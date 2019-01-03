// @flow
import React from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import CSV from './csv';

const buttonStyle = {
  margin: '1px 5px 1px 5px',
};

class List extends React.Component {
  constructor(props) {
    super(props);
    this.buttonSubmit = this.buttonSubmit.bind(this);
  }

  buttonSubmit(e, props) {
    const { onChange } = this.props;
    onChange(e, props);
  }

  render() {
    const { list, downloadprops } = this.props;
    // console.log(downloadprops);
    const posts = list.map((post, i) => {
      const {
        message_count: { count },
        url: href,
        article_title: title,
        author,
        board,
        date,
      } = post;
      const filename = `${board}_${author}_${date}.csv`;

      const postarr = [post];

      return (
        <div className="r-ent" key={i.toString()}>
          <div className="nrec">
            <span className="h1 f1">{count}</span>
          </div>
          <div className="title">
            <Button
              style={buttonStyle}
              classname="getpttpost"
              action={e => this.buttonSubmit(e, list[i])}
              title="Go"
              type="button"
            />
            <CSV filename={filename} post={postarr} config={downloadprops} />
            <a href={href} target="_blank" rel="noopener noreferrer">
              {title}
            </a>
          </div>
          <div className="meta">
            <div className="author pwe-menu">
              <div className="pwe-menu">{author}</div>
            </div>
            <div className="article-Menu" />
            <div className="data">{date}</div>
            <div className="mark">{i + 1}</div>
          </div>
        </div>
      );
    });
    return posts;
  }
}

List.defaultProps = {};
List.propTypes = {
  list: PropTypes.arrayOf(
    PropTypes.shape({
      article_id: PropTypes.string,
      article_title: PropTypes.string,
      author: PropTypes.string,
      board: PropTypes.string,
      content: PropTypes.string,
      date: PropTypes.string,
      ip: PropTypes.string,
      message_count: PropTypes.shape({
        all: PropTypes.number,
        boo: PropTypes.number,
        count: PropTypes.number,
        neutral: PropTypes.number,
        push: PropTypes.number,
        id_: PropTypes.string,
      }),
      messages: PropTypes.arrayOf(
        PropTypes.shape({
          push_content: PropTypes.string,
          push_ipdatetime: PropTypes.string,
          push_tag: PropTypes.string,
          push_userid: PropTypes.string,
          _id: PropTypes.string,
        }),
      ),
      url: PropTypes.string,
      __v: PropTypes.number,
      _id: PropTypes.string,
    }),
  ).isRequired,
  downloadprops: PropTypes.shape({
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

export default List;
