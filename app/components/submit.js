// @flow
import React from 'react';

class SubmitTab extends React.Component {
  /*
  handleClick = () => {
    this.props = '';
  };
  */

  getCR = (str) => {
    console.log('this is:', str);
  };

  render() {
    const tab = this.props;
    if (tab.show) {
      return (
        <div id="Submit" className="tabcontent">
          <span className="topright" role="button" tabIndex="0" onClick={tab.onChange} onKeyDown={tab.onChange}>
            x
          </span>
          <form action="/query" method="post" id="para">
            <fieldset>
              <legend>Get co-activity</legend>
              <button name="submit" type="button" onClick={this.getCR('Co reaction')}>
                Co reaction
              </button>
              <button name="submit" type="button" onClick={this.getCR('Co comment')}>
                Co comment
              </button>
              <button name="submit" type="button" onClick={this.getCR('Co share')}>
                Co share
              </button>
              <button name="submit" type="button" onClick={this.getCR('All')}>
                New Submit
              </button>
            </fieldset>
          </form>
        </div>
      );
    }
    return null;
  }
}

export default SubmitTab;
