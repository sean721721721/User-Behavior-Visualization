// @flow
import React from 'react';
import PropTypes from 'prop-types';
// import ParameterTab from './parameter';
import Page from './page';
// import SubmitTab from './submit';
// import DownloadtTab from './download';
// import

class Menu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...props.menuprops,
      showPage1: true,
      // showSubmit: false,
    };
    this.openTab = this.openTab.bind(this);
    this.handleCloseTab = this.handleCloseTab.bind(this);
  }

  openTab = (evt, tabName) => {
    switch (tabName) {
      // case 'Parameters':
      //   this.setState(() => ({
      //     showPage1: false,
      //     showSubmit: false,
      //   }));
      //   break;
      case 'Page1':
        this.setState(() => ({
          showPage1: true,
          // showSubmit: false,
        }));
        break;
      // case 'Page2':
      //   this.setState(() => ({
      //     showPage1: false,
      //     showSubmit: false,
      //     showDownload: false,
      //   }));
      //   break;
      // case 'Submit':
      //   this.setState(() => ({
      //     showPage1: false,
      //     showSubmit: true,
      //   }));
      //   break;
      // case 'Download':
      //   this.setState(() => ({
      //     showPage1: false,
      //     showSubmit: false,
      //   }));
      //   break;
      default:
    }
  };

  handleCloseTab = () => {
    // e.preventDefault();
    // console.log('close');
    this.setState(() => ({
      showPage1: true,
      // showSubmit: false,
    }));
    // this.parentElement.style.display = 'none';
  };

  render() {
    const {
      showPage1,
      // showSubmit,
      // submitType,
      // showDownload,
    } = this.state;

    const {
      onSubmit,
      menuprops: {
        initPage1,
      },
      handlePT1,
    } = this.props;

    return (
      <div className="box menu">
        <div className="tab">
          {/* <button className="tablinks" type="button">
            <a href="/">Reset</a>
          </button> */}
          {/* <button className="tablinks" type="button" onClick={e => this.openTab(e, 'Page1')}>
            Page1
          </button> */}
          {/* <button className="tablinks" type="button" onClick={e => this.openTab(e, 'Page2')}>
            Page2
          </button> */}
          {/* <button className="tablinks" type="button" onClick={e => this.openTab(e, 'Submit')}>
            Submit
          </button> */}
          {/* <button className="tablinks" type="button" onClick={e => this.openTab(e, 'Download')}>
            Download
          </button> */}
        </div>
        {/* <ParameterTab
          show={showParameter}
          init={initParameter}
          onChange={this.handleCloseTab}
          handlePT={handlePT}
        /> */}
        <Page
          show={showPage1}
          init={initPage1}
          onChange={this.handleCloseTab}
          handlePT={handlePT1}
          onSubmit={onSubmit}
        />
        {/* <Page
          show={showPage2}
          init={initPage2}
          onChange={this.handleCloseTab}
          handlePT={handlePT2}
        /> */}
        {/* <SubmitTab
          show={showSubmit}
          type={submitType}
          set={this.state}
          onChange={this.handleCloseTab}
          onSubmit={onSubmit}
        /> */}
        {/* <DownloadtTab
          show={showDownload}
          config={initDownload}
          onChange={this.handleCloseTab}
          handleDT={handleDT}
          selectedOptions={selectedOptions}
        /> */}
      </div>
    );
  }
}

Menu.defaultProps = {};
Menu.propTypes = {
  menuprops: PropTypes.shape({
    showParameter: PropTypes.bool,
    showPage1: PropTypes.bool,
    showPage2: PropTypes.bool,
    showSubmit: PropTypes.bool,
    showDownload: PropTypes.bool,
    initPage1: PropTypes.shape({
      pagename: PropTypes.string,
      since: PropTypes.string,
      until: PropTypes.string,
      wordfilter: PropTypes.string,
      idfilter: PropTypes.string,
      contentfilter: PropTypes.string,
    }),
    initPage2: PropTypes.shape({
      pagename: PropTypes.string,
      since: PropTypes.string,
      until: PropTypes.string,
      wordfilter: PropTypes.string,
      idfilter: PropTypes.string,
      contentfilter: PropTypes.string,
    }),
    submitType: PropTypes.string,
    initDownload: PropTypes.shape({
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
    }),
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  // handlePT: PropTypes.func.isRequired,
  handlePT1: PropTypes.func.isRequired,
  // handlePT2: PropTypes.func.isRequired,
  // handleDT: PropTypes.func.isRequired,
  // selectedOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default Menu;
