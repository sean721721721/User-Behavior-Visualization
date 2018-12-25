// @flow
import React from 'react';
import PropTypes from 'prop-types';

class SubmitTab extends React.Component {
  constructor(props) {
    super(props);
    this.state = props.set;
    this.getCR = this.getCR.bind(this);
  }

  getCR = (e, str) => {
    const { onSubmit } = this.props;
    this.setState(() => ({
      type: str,
    }));
    onSubmit(e);
  };

  render() {
    const { show, onChange } = this.props;
    // console.log(tab);
    if (show) {
      return (
        <div id="Submit" className="tabcontent">
          <span
            className="topright"
            role="button"
            tabIndex="0"
            onClick={onChange}
            onKeyDown={onChange}
          >
            x
          </span>
          <form action="/query" method="post" id="para">
            <fieldset>
              <legend>Get co-activity</legend>
              {/* <button name="submit" type="button" onClick={e => this.getCR(e, 'Co reaction')}>
                Co reaction
              </button>
              <button name="submit" type="button" onClick={e => this.getCR(e, 'Co comment')}>
                Co comment
              </button>
              <button name="submit" type="button" onClick={e => this.getCR(e, 'Co share')}>
                Co share
              </button> */}
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
  show: PropTypes.bool.isRequired,
  set: PropTypes.shape().isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default SubmitTab;
