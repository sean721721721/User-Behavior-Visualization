import React from 'react';
import PropTypes from 'prop-types';

const listStyle = {
  display: 'inline-block',
};

const tableStyle = {
  color: 'black',
  background: 'white',
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
        <tr key={i.toString()}>
          <td>{term}</td>
          <td>{count}</td>
        </tr>
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
        <table>
          <thead style={tableStyle}>
            <tr>
              <th>Term</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            <Term terms={termpair} />
          </tbody>
        </table>
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
