import React from 'react';
import PropTypes from 'prop-types';

const maxTermNum = 1000;

const trStyle = {
  color: 'white',
  background: '#333',
};

const trStyle1 = {
  color: '#444',
  background: 'white',
};

const trStyle2 = {
  color: '#444',
  background: 'lightgrey',
};

function Term(props) {
  const fixedterms = props.terms.slice(0, maxTermNum);
  const termsRanking = (
    fixedterms.map((termfreq, i) => {
      const {
        0: term,
        1: count,
      } = termfreq;
      if (i % 2 === 0) {
        return (
          <tr id={i} key={i.toString()} style={trStyle1}>
            <td>{term}</td>
            <td>{count}</td>
          </tr>
        );
      }
      return (
        <tr id={i} key={i.toString()} style={trStyle2}>
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
          <thead>
            <tr style={trStyle}>
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
