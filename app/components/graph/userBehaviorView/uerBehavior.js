/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable no-console */
/* eslint-disable prefer-const */
/* eslint-disable react/prop-types */
import React from 'react';
import * as d3 from 'd3';
import { userActivityView } from './userActivityView';
import { loading } from '../loading';

class UserBehavior extends React.Component {
  componentDidUpdate() {
    const { data } = this.props;
    const userData = data || undefined;
    if (userData) {
      const userSimilaritySvg = d3.select('#timeLine');
      userActivityView(
        userData.beginDate,
        userData.endDate,
        userData.userListArray,
        userSimilaritySvg,
        userData.fixedUserArr,
        userData.articles,
        userData.submit,
      );
    }
  }

  render() {
    const { data } = this.props;
    return (
      <div className="opinionLeaderView">
        <div className="heatMap">
          <div className="optionDiv" style={{ width: '100%', display: 'grid' }}>
            <div className="row option d-flex justify-content-start" style={{ paddingLeft: '10px', width: '100%', display: 'inline' }} />
          </div>
          {/* <div className="option"/> */}
          <div className="timeline" style={{ width: '100%', display: 'grid' }}>
            {/* <svg id="timeLine" width="100%" height="100%" /> */}
            <svg id="timeLine" viewBox="0 0 826 755" />
          </div>
        </div>
        <div className="contextDiv" style={{ display: 'block' }}>
          <div className="row align-items-center p-0 col-sm" style={{ borderBottom: '2px solid slategray' }}>
            <div className="col-sm-4" style={{ padding: 0 }}><p id="value-range" /></div>
            <div className="col-sm-8" style={{ paddingLeft: '10px' }}><div id="slider-range" /></div>
          </div>
          {/* <div className="option " style={{width: '100%', height: '50px', display: 'block', borderBottom: '2px solid slategray' }}/> */}
          <div style={{ height: '100%' }}>
            {/* <svg id="context" width="100%" height="100%" /> */}
            <svg id="context" viewBox="0 0 500 1000" />
          </div>
        </div>
      </div>
    );
  }
}

export default UserBehavior;
