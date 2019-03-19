import React from 'react';
import PropTypes from 'prop-types';

const listStyle = {
  display: 'inline-block',
};

function Term(props) {
    // console.log(props.terms);
  const termsRanking = (
    props.terms.map((termfreq, i) => {
      const {
        0: term,
        1: count,
      } = termfreq;
      return (
        <ul key={i.toString()}>
          <li style={listStyle} key={i.toString()}>
            <p>{term}: {count}</p>
          </li>
        </ul>
      );
    })
  );
  return termsRanking;
}

class Termlist extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      list: ['', 0],
    };
  }

  render() {
    const { termlistprops: termpair } = this.props;
    // console.log(this.state);
    // console.log(this.props);
    // console.log(termpair);
    return (
      <div id="termlist">
        <Term terms={termpair} />
      </div>
    );
  }
}

Termlist.defaultProps = {};
Termlist.propTypes = {
  termlistprops: PropTypes.arrayOf(
    PropTypes.oneOfType(
      PropTypes.string,
      PropTypes.number,
    ),
  ).isRequired,
};
export default Termlist;
