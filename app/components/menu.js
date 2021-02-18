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
      case 'Page1':
        this.setState(() => ({
          showPage1: true,
        }));
        break;
      default:
    }
  };

  handleCloseTab = () => {
    this.setState(() => ({
      showPage1: true,
    }));
  };

  render() {
    const {
      showPage1,
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
        <Page
          show={showPage1}
          init={initPage1}
          onChange={this.handleCloseTab}
          handlePT={handlePT1}
          onSubmit={onSubmit}
        />
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
    submitType: PropTypes.string,
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  handlePT1: PropTypes.func.isRequired,
};

export default Menu;
