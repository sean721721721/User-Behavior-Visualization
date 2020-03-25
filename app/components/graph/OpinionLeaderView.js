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
        optionsWord,
      } = data;
      let articleCellSvg = d3.select('#articleCell');
      let commentTimelineSvg = d3.select('#commentTimeline');
      if (cellData.nodes) {
        if (data.$this.state.hover !== 1) {
          console.log('do OPView rendering');
          OpinionLeader(cellData.nodes, cellData.links,
            beforeThisDate, articleCellSvg, cellForceSimulation, totalAuthorInfluence, data.$this, optionsWord);
        }
        commentTimeline(cellData.nodes, commentTimelineSvg, data.$this);
      }
    }
  }

  render() {
    const { data } = this.props;
    const { word, optionsWord } = data;
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
        <div
          className="commentTimeline"
          style={{
            // position: 'absolute',
            // top: '15px',
            // left: '15px',
            overflowY: 'scroll',
            // width: '280px',
            // height: '400px',
            // backgroundColor: '#e8e8e8',
            // border: '1px solid #AAAAAA',
            // borderRadius: '4px',
            // boxShadow: 'inset 1px 1px 6px 2px rgba(0,0,0, .25)',
          }}
        >
          <svg id="commentTimeline" width="100%" height="700px" />
        </div>
        <WordTree word={word} optionsWord={optionsWord} />
      </div>
    );
  }
}

export default OpinionLeaderView;
