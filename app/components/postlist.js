// @flow
import React from 'react';
import PropTypes from 'prop-types';
import './bbs.css';

type ListProps = {
  props: PropTypes.array,
};

function List({ props }: ListProps) {
  const list = props;
  const posts = list.map((post, i) => {
    const {
      count, href, title, author, date, mark,
    } = post;
    return (
      <div className="r-ent" key={i.toString()}>
        <div className="nrec">
          <span className="h1 f1">{count}</span>
        </div>
        <div className="title">
          <a href={href}>{title}</a>
        </div>
        <div className="meta">
          <div className="author pwe-menu">
            <div className="pwe-menu">{author}</div>
          </div>
          <div className="article-Menu" />
          <div className="data">{date}</div>
          <div className="mark">{mark}</div>
        </div>
      </div>
    );
  });
  return posts;
}

class PostList extends React.Component {
  constructor(props) {
    super(props);
    this.state = props.postlistprops;
  }

  render() {
    const { list } = this.state;
    return (
      <div id="main-container">
        <div className="action-bar">
          <div className="btn-group btn-group-dir">
            <a className="btn-selected" href="/bbs/MobileComm/index.html">
              看板
            </a>
          </div>
          <div className="btn-group btn-group-paging">
            <a className="btn wide" href="/bbs/MobileComm/index.html">
              最舊
            </a>
            <a className="btn wide" href="/bbs/MobileComm/index.html">
              上頁
            </a>
            <a className="btn wide" href="/bbs/MobileComm/index.html">
              下頁
            </a>
            <a className="btn wide" href="/bbs/MobileComm/index.html">
              最新
            </a>
          </div>
        </div>
        <div className="r-list-container">
          <List props={list} />
        </div>
      </div>
    );
  }
}

PostList.defaultProps = {
  postlistprops: {
    list: [
      {
        count: '爆',
        href: '/bbs/MobileComm/M.1540446065.A.825.html',
        title: '[LIVE] 小米Mix3發表會',
        author: 'Feishawn',
        date: '10/25',
        mark: 'M',
      },
    ],
  },
};
PostList.propTypes = {
  postlistprops: PropTypes.shape({
    list: PropTypes.arrayOf(
      PropTypes.shape({
        count: PropTypes.string,
        href: PropTypes.string,
        title: PropTypes.string,
        author: PropTypes.string,
        date: PropTypes.string,
        mark: PropTypes.string,
      }),
    ),
  }),
};

export default PostList;
