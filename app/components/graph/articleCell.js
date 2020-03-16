import React from 'react';
import { OpinionLeader } from './OpinionLeader';

export default function ArticleCell(props) {
  console.log(props);
  if (props.data) {
    const { data } = props;
    const {
      cellData,
      beforeThisDate,
      articleCellSvg,
      cellForceSimulation,
      totalAuthorInfluence,
    } = data;
    console.log(cellData);
    if (cellData.nodes) {
      console.log('do OPView rendering');
      OpinionLeader(cellData.nodes, cellData.links,
        beforeThisDate, articleCellSvg, cellForceSimulation, totalAuthorInfluence);
    }
  }
  return (
    <div className="articleCell">
      <div
        className="opinionLeaderfilterBar"
        id="timeSlider"
        style={{ width: '100%', height: '25px', padding: '0px 10px' }}
      />

      <svg id="articleCell" width="100%" height="95%" />
    </div>
  );
}

export { ArticleCell };
