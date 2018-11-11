// @flow
import React from 'react';

class DownloadTab extends React.Component {
  /*
  handleClick = () => {
    this.props = '';
  };
  */

  render() {
    const tab = this.props;
    if (tab.show) {
      return (
        <div id="Download" className="tabcontent">
          <span className="topright" role="button" tabIndex="0" onClick={tab.onChange} onKeyDown={tab.onChange}>
            x
          </span>
          <div id="csv">
            <p>csv</p>
          </div>
        </div>
      );
    }
    return null;
  }
}

export default DownloadTab;
