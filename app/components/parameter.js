// @flow
import React from 'react';
import PropTypes from 'prop-types';
import DataList from './datalist';

class ParameterTab extends React.Component {
  constructor(props) {
    super(props);
    this.state = props.init;
    this.handleChange = this.handleChange.bind(this);
  }

  // should change to <input>
  handleChange(e) {
    const { target } = e;
    const { name, value } = target;
    switch (name) {
      case 'var1':
        this.setState({ var1: value });
        break;
      case 'var2':
        this.setState({ var2: value });
        break;
      case 'posttype':
        this.setState({ posttype: value });
        break;
      default:
        // console.log(target, name, value);
        break;
    }
  }

  render() {
    // const showParameter = this.props.value;
    const {
      var1, min1, max1, var2, min2, max2, posttype,
    } = this.state;
    const tab = this.props;
    console.log(tab);
    const actions = ['reaction', 'comment', 'share', 'push', 'boo', 'neutral'];
    const list1 = {
      listid: 'varname1list',
      selectid: 'varname1',
      name: 'var1',
      lists: actions,
    };
    const list2 = {
      listid: 'varname2list',
      selectid: 'varname2',
      name: 'var2',
      lists: actions,
    };
    const posttypelist = {
      listid: 'posttypelist',
      selectid: 'posttype',
      name: 'posttype',
      lists: ['status', 'video', 'link', 'photo', 'PTT'],
    };
    if (tab.show) {
      return (
        <div id="Parameters" className="tabcontent">
          <span
            className="topright"
            role="button"
            tabIndex="0"
            onClick={tab.onChange}
            onKeyDown={tab.onChange}
          >
            x
          </span>
          <fieldset>
            <legend>Set query Parameters</legend>
            <label htmlFor="varname1">
              var 1:
              <input
                name="var1"
                id="varname1"
                type="text"
                list="varname1list"
                value={var1}
                onChange={this.handleChange}
              />
            </label>
            <DataList props={list1} />
            <label htmlFor="minvar1">
              from
              <input
                name="minvar1"
                id="minvar1"
                type="number"
                min="0"
                value={min1}
                onChange={this.handleChange}
              />
            </label>
            <label htmlFor="maxvar1">
              to
              <input
                name="maxvar1"
                id="maxvar1"
                type="number"
                min="0"
                value={max1}
                onChange={this.handleChange}
              />
            </label>
            <label htmlFor="varname2">
              var 2:
              <input
                name="var2"
                id="varname2"
                type="text"
                list="varname2list"
                value={var2}
                onChange={this.handleChange}
              />
            </label>
            <DataList props={list2} />
            <label htmlFor="x">
              from
              <input
                name="minvar2"
                id="minvar2"
                type="number"
                min="0"
                value={min2}
                onChange={this.handleChange}
              />
            </label>
            <label htmlFor="x">
              to
              <input
                name="maxvar2"
                id="maxvar2"
                type="number"
                min="0"
                value={max2}
                onChange={this.handleChange}
              />
            </label>
            <label htmlFor="x">
              posttype:
              <input
                name="posttype"
                id="posttype"
                type="text"
                list="posttypelist"
                value={posttype}
                onChange={this.handleChange}
              />
            </label>
            <DataList props={posttypelist} />
          </fieldset>
        </div>
      );
    }
    return null;
  }
}

ParameterTab.defaultProps = {};
ParameterTab.propTypes = {
  init: PropTypes.shape({
    var1: PropTypes.string,
    min1: PropTypes.string,
    max1: PropTypes.string,
    var2: PropTypes.string,
    min2: PropTypes.string,
    posttype: PropTypes.string,
  }).isRequired,
};

export default ParameterTab;
