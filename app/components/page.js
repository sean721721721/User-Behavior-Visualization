// @flow
import React from 'react';
import PropTypes from 'prop-types';
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
    this.handleChange = this.handleChange.bind(this);
  }

  // should change to <input>
  handleChange(e) {
    const { target } = e;
    const { name, value } = target;
    switch (name) {
      case 'pagename1':
        this.setState({ pagename1: value });
        break;
      case 'since1':
        this.setState({ since1: value });
        break;
      case 'until1':
        this.setState({ until1: value });
        break;
      case 'wordfilter1':
        this.setState({ wordfilter1: value });
        break;
      case 'idfilter1':
        this.setState({ idfilter1: value });
        break;
      case 'contentfilter1':
        this.setState({ contentfilter1: value });
        break;
      default:
        // console.log(target, name, value);
        break;
    }
  }

  /*
  handleClick = () => {
    this.props = '';
  };
  */

  render() {
    const {
      pagename1, since1, until1, wordfilter1, idfilter1, contentfilter1,
    } = this.state;
    const tab = this.props;
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
    if (tab.show) {
      return (
        <div id="Page1" className="tabcontent">
          <span
            className="topright"
            role="button"
            tabIndex="0"
            onClick={tab.onChange}
            onKeyDown={tab.onChange}
          >
            x
          </span>
          <fieldset>
            <legend>Query date1</legend>
            <label htmlFor="x">
              pagename:
              <input
                name="pagename1"
                id="pagename1"
                type="text"
                list="pagenamelist"
                value={pagename1}
                onChange={this.handleChange}
              />
            </label>
            <DataList props={pagenamelist} />
            <label htmlFor="x">
              since:
              <input
                type="date"
                name="since1"
                id="date1"
                placeholder="date"
                value={since1}
                onChange={this.handleChange}
              />
            </label>
            <label htmlFor="x">
              until:
              <input
                type="date"
                name="until1"
                id="date2"
                placeholder="date"
                value={until1}
                onChange={this.handleChange}
              />
            </label>
            <label htmlFor="x">
              key word filter:
              <input
                type="keyword1"
                name="wordfilter1"
                id="keyword1"
                placeholder="keyword"
                value={wordfilter1}
                onChange={this.handleChange}
              />
            </label>
            <label htmlFor="x">
              userid filter:
              <input
                type="userid1"
                name="idfilter1"
                id="userid1"
                placeholder="userid"
                value={idfilter1}
                onChange={this.handleChange}
              />
            </label>
            <label htmlFor="x">
              content word filter:
              <input
                type="keyword3"
                name="contentfilter1"
                id="keyword3"
                placeholder="keyword"
                value={contentfilter1}
                onChange={this.handleChange}
              />
            </label>
          </fieldset>
        </div>
      );
    }
    return null;
  }
}

Page.defaultProps = {};
Page.propTypes = {
  init: PropTypes.shape({
    pagename1: PropTypes.string,
    since1: PropTypes.string,
    until1: PropTypes.string,
    wordfilter1: PropTypes.string,
    idfilter1: PropTypes.string,
    contentfilter1: PropTypes.string,
  }).isRequired,
};

export default Page;
