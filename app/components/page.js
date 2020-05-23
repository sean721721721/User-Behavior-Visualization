// @flow
import React from 'react';
import PropTypes from 'prop-types';
// import InputGroup from 'react-bootstrap/InputGroup';
// import FormControl from 'react-bootstrap/FormControl';
import Button from 'react-bootstrap/Button';
// import { Row } from 'antd';
// import './style/input.css';
import DataList from './datalist';

class Page extends React.Component {
  constructor(props) {
    super(props);
    this.state = props.init;
    /*
    this.state = {
      pagename1: props.init.pagename1,
      since1: props.init.since1,
      until1: props.init.until1,
      wordfilter1: props.init.wordfilter1,
      idfilter1: props.init.idfilter1,
      contentfilter1: props.init.contentfilter1,
    };
    */
  }

  /*
  handleClick = () => {
    this.props = '';
  };
  */
  getCR = (e, str) => {
    const { onSubmit } = this.props;
    this.setState(() => ({
      type: str,
    }));
    console.log(e);
    onSubmit(e);
  };

  render() {
    const {
      show,
      init: {
        pagename, since, until, wordfilter, authorfilter, idfilter, contentfilter, commentfilter,
      },
      onChange,
      handlePT,
    } = this.props;
    const actions = [
      '客台',
      '勞動之王',
      '古斌',
      '安唯綾',
      '張靜之',
      '黃騰浩',
      'Gossiping',
      'Soft_Job',
      'Tech_Job',
    ];
    const pagenamelist = {
      listid: 'pagenamelist',
      selectid: 'pagename',
      name: 'pagename',
      lists: actions,
    };
    if (show) {
      return (
        <div id="Page1" className="tabcontent">
          {/* <span
            className="topright"
            role="button"
            tabIndex="0"
            onClick={onChange}
            onKeyDown={onChange}
          >
              x
          </span> */}
          <fieldset>
            {/* <legend>Query date1</legend> */}
            <label htmlFor="x">
                Board:
              <input
                className="form-control"
                name="pagename"
                id="pagename1"
                type="text"
                list="pagenamelist"
                value={pagename}
                onChange={handlePT}
              />
            </label>
            <DataList props={pagenamelist} />
            <label htmlFor="x">
                Time:
              <input
                className="form-control date"
                type="date"
                name="since"
                id="date1"
                placeholder="date"
                value={since}
                onChange={handlePT}
              />
            </label>
            <span>~ &nbsp; </span>
            <label htmlFor="x">
              <input
                className="form-control date"
                type="date"
                name="until"
                id="date2"
                placeholder="date"
                value={until}
                onChange={handlePT}
              />
            </label>
            <label htmlFor="x">
                Title:
              <input
                className="form-control"
                type="keyword1"
                name="wordfilter"
                id="keyword1"
                placeholder="keyword ex: 總統|大選"
                value={wordfilter}
                onChange={handlePT}
              />
            </label>
            <label htmlFor="x">
                AuthorID:
              <input
                className="form-control"
                type="authorid1"
                name="authorfilter"
                id="authorid1"
                placeholder="authorid"
                value={authorfilter}
                onChange={handlePT}
              />
            </label>
            <label htmlFor="x">
                UserID:
              <input
                className="form-control"
                type="userid1"
                name="idfilter"
                id="userid1"
                placeholder="userid"
                value={idfilter}
                onChange={handlePT}
              />
            </label>
            <label htmlFor="x">
                Content word:
              <input
                className="form-control"
                type="keyword3"
                name="contentfilter"
                id="keyword3"
                placeholder="keyword"
                value={contentfilter}
                onChange={handlePT}
              />
            </label>
            <label htmlFor="x">
                comment threshold:
              <input
                className="form-control"
                type="commentThreshold"
                name="commentfilter"
                id="commentThreshold"
                placeholder="500"
                value={commentfilter}
                onChange={handlePT}
              />
            </label>
          </fieldset>
          <Button name="submit" type="button" size="sm" onClick={e => this.getCR(e, 'All')}>
                Query Submit
          </Button>
        </div>
      );
    }
    return null;
  }
}

Page.defaultProps = {};
Page.propTypes = {
  show: PropTypes.bool.isRequired,
  init: PropTypes.shape({
    pagename: PropTypes.string,
    since: PropTypes.string,
    until: PropTypes.string,
    wordfilter: PropTypes.string,
    idfilter: PropTypes.string,
    authorfilter: PropTypes.string,
    contentfilter: PropTypes.string,
    commentfilter: PropTypes.number,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  handlePT: PropTypes.func.isRequired,
};

export default Page;
