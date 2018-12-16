// @flow
import React from 'react';
import PropTypes from 'prop-types';
import DataList from './datalist';

class ParameterTab extends React.Component {
  constructor(props) {
    super(props);
    this.state = props.init;
  }

  render() {
    // const showParameter = this.props.value;
    const {
      show,
      init: {
        var1, min1, max1, var2, min2, max2, posttype,
      },
      onChange,
      handlePT,
    } = this.props;
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
    if (show) {
      return (
        <div id="Parameters" className="tabcontent">
          <span
            className="topright"
            role="button"
            tabIndex="0"
            onClick={onChange}
            onKeyDown={onChange}
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
                onChange={handlePT}
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
                onChange={handlePT}
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
                onChange={handlePT}
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
                onChange={handlePT}
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
                onChange={handlePT}
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
                onChange={handlePT}
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
                onChange={handlePT}
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
  show: PropTypes.bool.isRequired,
  init: PropTypes.shape({
    var1: PropTypes.string,
    min1: PropTypes.string,
    max1: PropTypes.string,
    var2: PropTypes.string,
    min2: PropTypes.string,
    posttype: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  handlePT: PropTypes.func.isRequired,
};

export default ParameterTab;
