/* eslint-disable no-console */
/* eslint-disable prefer-const */
/* eslint-disable react/prop-types */
import React, { PureComponent } from 'react';
import * as d3 from 'd3';
import netClustering from 'netclustering';
import * as jsnx from 'jsnetworkx';
import { OpinionLeader } from './OpinionLeader';

class ArticleCell extends React.Component {
  componentDidUpdate() {
    console.log(this.props);
    const { data } = this.props;
    if (data) {
      let {
        cellData,
        beforeThisDate,
        articleCellSvg,
        cellForceSimulation,
        totalAuthorInfluence,
      } = data;
      articleCellSvg = d3.select('#articleCell');
      if (cellData.nodes) {
        if (data.$this.state.hover !== 1) {
          console.log('do OPView rendering');
          OpinionLeader(cellData.nodes, cellData.links,
            beforeThisDate, articleCellSvg, cellForceSimulation, totalAuthorInfluence, data.$this);
        }
      }
    }
  }

  render() {
    console.log(d3.select('#articleCell'));
    return (
      <div className="articleCell">
        <div
          className="opinionLeaderfilterBar"
          id="timeSlider"
          style={{ width: '100%', height: '25px', padding: '0px 10px' }}
        />
        {/* {props.data.beforeThisDate} */}
        <svg id="articleCell" width="100%" height="95%" />
      </div>
    );
  }
}

export default ArticleCell;
