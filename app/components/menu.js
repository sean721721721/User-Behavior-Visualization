// @flow
import React from 'react';
import PropTypes from 'prop-types';
import ParameterTab from './parameter';
import Page1 from './page';
import SubmitTab from './submit';
import DownloadtTab from './download';

class Menu extends React.Component {
  constructor(props) {
    super(props);
    this.state = props.menuprops;

    this.openTab = this.openTab.bind(this);
    this.handleCloseTab = this.handleCloseTab.bind(this);
  }

  openTab = (evt, tabName) => {
    switch (tabName) {
      case 'Parameters':
        this.setState(() => ({
          showParameter: true,
          showPage1: false,
          initPage1: {
            pagename1: 'Gossiping',
            since1: '2018-06-01',
            until1: '2018-06-10',
            wordfilter1: '丁守中',
            idfilter1: '',
            contentfilter1: '柯文哲',
          },
          showPage2: false,
          initPage2: {
            pagename1: 'Gossiping',
            since1: '2018-06-01',
            until1: '2018-06-10',
            wordfilter1: '柯文哲',
            idfilter1: '',
            contentfilter1: '丁守中',
          },
          showSubmit: false,
          showDownload: false,
        }));
        break;
      case 'Page1':
        this.setState(() => ({
          showParameter: false,
          showPage1: true,
          initPage1: {
            pagename1: 'Gossiping',
            since1: '2018-06-01',
            until1: '2018-06-10',
            wordfilter1: '丁守中',
            idfilter1: '',
            contentfilter1: '柯文哲',
          },
          showPage2: false,
          initPage2: {
            pagename1: 'Gossiping',
            since1: '2018-06-01',
            until1: '2018-06-10',
            wordfilter1: '柯文哲',
            idfilter1: '',
            contentfilter1: '丁守中',
          },
          showSubmit: false,
          showDownload: false,
        }));
        break;
      case 'Page2':
        this.setState(() => ({
          showParameter: false,
          showPage1: false,
          initPage1: {
            pagename1: 'Gossiping',
            since1: '2018-06-01',
            until1: '2018-06-10',
            wordfilter1: '丁守中',
            idfilter1: '',
            contentfilter1: '柯文哲',
          },
          showPage2: true,
          initPage2: {
            pagename1: 'Gossiping',
            since1: '2018-06-01',
            until1: '2018-06-10',
            wordfilter1: '柯文哲',
            idfilter1: '',
            contentfilter1: '丁守中',
          },
          showSubmit: false,
          showDownload: false,
        }));
        break;
      case 'Submit':
        this.setState(() => ({
          showParameter: false,
          showPage1: false,
          initPage1: {
            pagename1: 'Gossiping',
            since1: '2018-06-01',
            until1: '2018-06-10',
            wordfilter1: '丁守中',
            idfilter1: '',
            contentfilter1: '柯文哲',
          },
          showPage2: false,
          initPage2: {
            pagename1: 'Gossiping',
            since1: '2018-06-01',
            until1: '2018-06-10',
            wordfilter1: '柯文哲',
            idfilter1: '',
            contentfilter1: '丁守中',
          },
          showSubmit: true,
          showDownload: false,
        }));
        break;
      case 'Download':
        this.setState(() => ({
          showParameter: false,
          showPage1: false,
          initPage1: {
            pagename1: 'Gossiping',
            since1: '2018-06-01',
            until1: '2018-06-10',
            wordfilter1: '丁守中',
            idfilter1: '',
            contentfilter1: '柯文哲',
          },
          showPage2: false,
          initPage2: {
            pagename1: 'Gossiping',
            since1: '2018-06-01',
            until1: '2018-06-10',
            wordfilter1: '柯文哲',
            idfilter1: '',
            contentfilter1: '丁守中',
          },
          showSubmit: false,
          showDownload: true,
        }));
        break;
      default:
    }
  };

  handleCloseTab = () => {
    // e.preventDefault();
    console.log('close');
    this.setState(() => ({
      showParameter: false,
      showPage1: false,
      initPage1: {
        pagename1: 'Gossiping',
        since1: '2018-06-01',
        until1: '2018-06-10',
        wordfilter1: '丁守中',
        idfilter1: '',
        contentfilter1: '柯文哲',
      },
      showPage2: false,
      initPage2: {
        pagename1: 'Gossiping',
        since1: '2018-06-01',
        until1: '2018-06-10',
        wordfilter1: '柯文哲',
        idfilter1: '',
        contentfilter1: '丁守中',
      },
      showSubmit: false,
      showDownload: false,
    }));
    // this.parentElement.style.display = 'none';
  };

  render() {
    const {
      showParameter,
      showPage1,
      initPage1,
      showPage2,
      initPage2,
      showSubmit,
      showDownload,
    } = this.state;

    return (
      <div className="box menu">
        <div className="tab">
          <button className="tablinks" type="button">
            <a href="/">Reset</a>
          </button>
          <button
            className="tablinks"
            type="button"
            onClick={(e) => {
              this.openTab(e, 'Parameters');
            }}
          >
            Parameters
          </button>
          <button
            className="tablinks"
            type="button"
            onClick={(e) => {
              this.openTab(e, 'Page1');
            }}
          >
            Page1
          </button>
          <button
            className="tablinks"
            type="button"
            onClick={(e) => {
              this.openTab(e, 'Page2');
            }}
          >
            Page2
          </button>
          <button
            className="tablinks"
            type="button"
            onClick={(e) => {
              this.openTab(e, 'Submit');
            }}
          >
            Submit
          </button>
          <button
            className="tablinks"
            type="button"
            onClick={(e) => {
              this.openTab(e, 'Download');
            }}
          >
            Download
          </button>
        </div>
        <ParameterTab show={showParameter} onChange={this.handleCloseTab} />
        <Page1 show={showPage1} init={initPage1} onChange={this.handleCloseTab} />
        <Page1 show={showPage2} init={initPage2} onChange={this.handleCloseTab} />
        <SubmitTab show={showSubmit} onChange={this.handleCloseTab} />
        <DownloadtTab show={showDownload} onChange={this.handleCloseTab} />
      </div>
    );
  }
}

Menu.defaultProps = {};
Menu.propTypes = {
  menuprops: PropTypes.shape({
    showParameter: PropTypes.bool,
    showPage1: PropTypes.bool,
    initPage1: PropTypes.shape({
      pagename1: PropTypes.string,
      since1: PropTypes.string,
      until1: PropTypes.string,
      wordfilter1: PropTypes.string,
      idfilter1: PropTypes.string,
      contentfilter1: PropTypes.string,
    }),
    showPage2: PropTypes.bool,
    initPage2: PropTypes.shape({
      pagename2: PropTypes.string,
      since2: PropTypes.string,
      until2: PropTypes.string,
      wordfilter2: PropTypes.string,
      idfilter2: PropTypes.string,
      contentfilter2: PropTypes.string,
    }),
    showSubmit: PropTypes.bool,
    showDownload: PropTypes.bool,
  }).isRequired,
};

export default Menu;
