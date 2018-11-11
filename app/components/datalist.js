// @flow
import React from 'react';
import PropTypes from 'prop-types';

type DataListProps = {
  props: PropTypes.object,
  listid: PropTypes.string,
  selectid: PropTypes.string,
  lists: PropTypes.array,
};

function DataList({ props }: DataListProps) {
  const { listid, selectid, lists } = props;
  const listItems = lists.map((item, i) => <option key={i.toString()}>{item}</option>);
  return (
    <datalist id={listid}>
      <select id={selectid} name={selectid}>
        {listItems}
      </select>
    </datalist>
  );
}

/*
class DataList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: 'yes' };
    this.handleChange = this.handleChange.bind(this);
  }

  // should change to <input>
  handleChange(e) {
    const { target } = e;
    const { value } = target;
    this.setState({ value });
    console.log(this.state);
  }

  render() {
    const data = this.props;
    const { listid, selectid, lists } = data.props;
    const { value } = this.state;
    const listItems = lists.map((item, i) => <option key={i.toString()}>{item}</option>);
    return (
      <datalist id={listid}>
        <select id={selectid} name={selectid} value={value} onChange={this.handleChange}>
          {listItems}
        </select>
      </datalist>
    );
  }
}

DataList.propTypes: {
  props: PropTypes.object,
  listid: PropTypes.string,
  selectid: PropTypes.string,
  lists: PropTypes.array,
};
*/
export default DataList;
