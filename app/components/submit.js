// @flow
import React from 'react';
import PropTypes from 'prop-types';

class SubmitTab extends React.Component {
  constructor(props) {
    super(props);
    this.state = props;
  }

  getCR = (e, str) => {
    this.setState(() => ({
      type: str,
    }));
    this.props.onSubmit(e);
    console.log(this.state);
  };

  render() {
    const tab = this.props;
    // console.log(tab);
    if (tab.show) {
      return (
        <div id="Submit" className="tabcontent">
          <span
            className="topright"
            role="button"
            tabIndex="0"
            onClick={tab.onChange}
            onKeyDown={tab.onChange}
          >
            x
          </span>
          <form action="/query" method="post" id="para">
            <fieldset>
              <legend>Get co-activity</legend>
              <button name="submit" type="button" onClick={e => this.getCR(e, 'Co reaction')}>
                Co reaction
              </button>
              <button name="submit" type="button" onClick={e => this.getCR(e, 'Co comment')}>
                Co comment
              </button>
              <button name="submit" type="button" onClick={e => this.getCR(e, 'Co share')}>
                Co share
              </button>
              <button name="submit" type="button" onClick={e => this.getCR(e, 'All')}>
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

SubmitTab.defaultProps = {};
SubmitTab.propTypes = {
  type: PropTypes.string.isRequired,
  set: PropTypes.shape().isRequired,
};

export default SubmitTab;
