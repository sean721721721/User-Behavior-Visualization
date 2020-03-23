/* eslint-disable no-console */
/* eslint-disable prefer-const */
/* eslint-disable react/prop-types */
import React from 'react';
import * as d3 from 'd3';
import { OpinionLeader } from './OpinionLeader';
import { commentTimeline } from './commentTimeline';
import WordTree from './wordTree';

class OpinionLeaderView extends React.Component {
  componentDidUpdate() {
    console.log(this.props);
    const { data } = this.props;
    if (data) {
      let {
        cellData,
        beforeThisDate,
        cellForceSimulation,
        totalAuthorInfluence,
      } = data;
      let articleCellSvg = d3.select('#articleCell');
      let commentTimelineSvg = d3.select('#commentTimeline');
      if (cellData.nodes) {
        if (data.$this.state.hover !== 1) {
          console.log('do OPView rendering');
          OpinionLeader(cellData.nodes, cellData.links,
            beforeThisDate, articleCellSvg, cellForceSimulation, totalAuthorInfluence, data.$this);
        }
        commentTimeline(cellData.nodes, commentTimelineSvg, data.$this);
      }
    }
  }

  render() {
    const { data } = this.props;
    const { word } = data;
    console.log(d3.select('#articleCell'));
    return (
      <div className="opinionLeaderView">
        <div className="articleCell">
          <div
            className="opinionLeaderfilterBar"
            id="timeSlider"
            style={{ width: '100%', height: '25px', padding: '0px 10px' }}
          />
          <svg id="articleCell" width="100%" height="94%" />
        </div>
        <div className="commentTimeline">
          <svg id="commentTimeline" width="100%" height="100%" />
        </div>
        <WordTree word={word} />
      </div>
    );
  }
}

export default OpinionLeaderView;
