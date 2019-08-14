// @flow
import React from 'react';
import PropTypes from 'prop-types';
import List from './postlist';
import Button from './Button';
import CSV from './csv';
import './style/bbs.css';

const PostPage = (props) => {
  const {
    postlistprops: { list },
    downloadprops,
    filename,
    onChange,
    previousPage,
    nextPage,
    postCount,
  } = props;
  console.log(props);
  return (
    <div id="main-container">
      <div className="action-bar">
        {/* <CSV filename={filename} post={list} config={downloadprops} /> */}
        <div className="btn-group btn-group-dir">
          <a className="btn-selected" href="/bbs/MobileComm/index.html">
            看板
          </a>
        </div>
        <div className="btn-group btn-group-paging">
          <a className="btn wide" href="/bbs/MobileComm/index.html">
            最舊
          </a>
          <Button classname="btn wide" action={previousPage} title="上頁" type="button" />
          <Button classname="btn wide" action={nextPage} title="下頁" type="button" />
          <a className="btn wide" href="/bbs/MobileComm/index.html">
            最新
          </a>
        </div>
      </div>
      <div id="post-Count" style={{float:'right'}}>
        Total Post: {postCount}
      </div>
      <div className="r-list-container">
        <List list={list} downloadprops={downloadprops} onChange={onChange} />
      </div>
    </div>
  );
};

PostPage.defaultProps = {};
PostPage.propTypes = {
  postlistprops: PropTypes.shape({
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
    ),
    next: PropTypes.string.isRequired,
  }).isRequired,
  /* postprops: PropTypes.shape({
    author: PropTypes.string,
    board: PropTypes.string,
    article_title: PropTypes.string,
    date: PropTypes.string,
    content: PropTypes.string,
    url: PropTypes.string,
    messages: PropTypes.arrayOf(
      PropTypes.shape({
        push_tag: PropTypes.string,
        push_userid: PropTypes.string,
        push_content: PropTypes.string,
        push_ipdatetime: PropTypes.string,
      }),
    ),
  }).isRequired, */
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
      push_ipdatetime: PropTypes.bool,
      push_tag: PropTypes.bool,
      push_userid: PropTypes.bool,
    }),
    url: PropTypes.bool,
  }).isRequired,
  filename: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  previousPage: PropTypes.func.isRequired,
  nextPage: PropTypes.func.isRequired,
  postCount: PropTypes.number.isRequired,
};

export default PostPage;
