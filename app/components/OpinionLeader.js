/* eslint-disable no-use-before-define */
import React, { Component, PureComponent } from 'react';
// import PropTypes from 'prop-types';
// import { connect } from 'react-redux';
// import { push } from 'react-router-redux';
import * as d3 from 'd3';
// import * as sententree from 'sententree';
// import { max } from 'moment';
// import { Row, Form } from 'antd';

export default function OpinionLeader(cellNodes, cellLinks, totalInfluence,
  sliderHasBeenLoaded, articleCellSvg) {
  const cellForceSimulation = d3.forceSimulation()
    .force('link', d3.forceLink().id((d) => {
      if (d.group === 1) return d.titleTerm;
      return d.id;
    }))
    .force('charge', d3.forceManyBody().strength(-10))
    // .force('charge', d3.forceManyBody().distanceMax(1000))
    .force('center', d3.forceCenter(200, 500));

  const pie = d3.pie()
    .value(d => d.count)
    .sort(null);
  const pieColor = d3.schemeTableau10;
  //   const startDate = new Date(date.$gte);
  //   const endDate = new Date(date.$lt);
  //   const timeScale = d3.scaleTime().domain([startDate, endDate]).range([0, 100]);

  //   if (sliderHasBeenLoaded) {
  //     beforeThisDate = d3.select('#customRange2').property('value');
  //     beforeThisDate = timeScale.invert(beforeThisDate);
  //   }
  //   console.log(beforeThisDate);
  console.log(cellNodes);
  console.log(cellLinks);
  // ({ nodes, links } = data);
  articleCellSvg.selectAll('*').remove();
  // articleCellSvg = articleCellSvg
  //   .call(d3.zoom().scaleExtent([1 / 2, 8]).on('zoom', articleCellZoomed))
  //   .append('g');

  const cellLink = articleCellSvg.selectAll('line')
    .data(cellLinks);

  // link.exit().remove();
  const cellLinkEnter = cellLink.enter()
    // .append('g')
    .append('line')
    .attr('class', 'links')
    .style('z-index', -1)
    .attr('visibility', 'hidden')
    .attr('stroke', d => d.color)
    .attr('stroke-width', d => (d.value < 100000 ? d.value : 3));

  const cellNode = articleCellSvg.append('g')
    .attr('class', 'nodes')
    .selectAll('g')
    .data(cellNodes);

  const cellNodeEnter = cellNode.enter()
    .append('g')
    .attr('class', 'nodes')
    .style('z-index', 1)
    .attr('opacity', (d) => {
      if (d.group !== 2 && d.connected === 0) return 0.2;
      if (d.show === 0) return 0.2;
      return 1;
    });

  cellNodeEnter
    .append('defs')
    .append('pattern')
    .attr('id', 'pic_user')
    .attr('height', 60)
    .attr('width', 60)
    .attr('x', 0)
    .attr('y', 0)
    .append('image')
    .attr('xlink:href', 'https://i.imgur.com/jTUiJ1l.png')
    .attr('height', 10)
    .attr('width', 10)
    .attr('x', 0)
    .attr('y', 0);

  const cellKeyPlayerCircles = cellNodeEnter.selectAll('circle');

  const cellCircles = cellNodeEnter.append('circle')
    .transition()
    .duration(500)
    .attr('r', d => (d.group === 1 ? 10 : 1))
    .attr('fill', d => (d.group === 1 ? 'gray' : 'green'))
    .style('fill-opacity', 1)
    .attr('stroke', 'gray')
    .attr('stroke-width', d => (d.group === 1 ? 2 : 0.9))
    .attr('stroke-opacity', 0);
  //   const cellInfluence = cellNodeEnter.append('circle')
  //     .attr('r', (d) => {
  //       let tempInfluence = 0;
  //       // let temp;
  //       console.log(d);
  //       if (d.responder) {
  //         d.responder.forEach((article) => {
  //           tempInfluence += article.message.filter((msg) => {
  //             const push_ipdatetime = msg.push_ipdatetime.split(' ');
  //             const pushDateTime = (push_ipdatetime.length > 2) ? `${push_ipdatetime[1]} ${push_ipdatetime[2]}` : push_ipdatetime;
  //             return (new Date(`2019 ${pushDateTime}`) < beforeThisDate);
  //           }).length;
  //         });
  //         console.log(tempInfluence);
  //         return 314 * (tempInfluence / totalInfluence);
  //       }
  //       return d.group === 1 ? 5 : 314 * (d.size / totalInfluence);
  //     })
  //     .attr('fill', 'gray')
  //     .style('fill-opacity', 0)
  //     .attr('stroke', 'gray')
  //     .attr('stroke-width', 1)
  //     .attr('stroke-opacity', 1);

  const cellPieGroup = cellNodeEnter.append('g');
  const cellPath = cellPieGroup.selectAll('path')
    .data((d) => {
      if (d.group === 3) {
        // const totalMessageCount = d.data.reduce((pre, next) => pre.count + next.count);
        // console.log(d.message_count);
        return pie(d.message_count);
      }
      return [];
    });

  cellPath.enter().append('path')
    .attr('fill', (d) => {
      switch (d.data.type) {
        case 'push':
          return pieColor[4];
        case 'boo':
          return pieColor[2];
        case 'neutral':
          return pieColor[5];
        default:
          break;
      }
      return 'gray';
    })
    .attr('d', (d) => {
      // console.log(d);
      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(5 + Math.sqrt(d.data.radius))
        .startAngle(d.startAngle)
        .endAngle(d.endAngle);
      return arc();
    })
    .attr('stroke', 'white')
    .attr('stroke-width', '0.2px');


  //   const cellLables = cellNodeEnter.append('text')
  //     .text(d => d.author)
  //     .style('text-anchor', 'middle')
  //     .attr('font-family', 'Microsoft JhengHei')
  //     .attr('font-size', '10px')
  //     .attr('color', '#000')
  //     .attr('y', d => (d.group !== 1 ? 3 : centrality(selectedCentrality, d) * 2 + 5));

  cellNodeEnter.append('title')
    .text(d => `Title: ${d.id}${'\n'}url: ${d.url}`);
  // cellNode = cellNodeEnter.merge(node);

  //   const cellStrengthScale = d3.scaleLinear()
  //     .domain([
  //       Math.min(...set.links.map(l => l.value)),
  //       Math.max(...set.links.map(l => l.value)),
  //     ]).range([1, 100]);

  cellForceSimulation
    .nodes(cellNodes)
    .on('tick', cellTicked);

  cellForceSimulation.alphaDecay(0.005)
    .force('link')
    .links(cellLinks)
    .distance(100)
    .strength(1);

  cellForceSimulation.force('collision', d3.forceCollide(d => (d.size ? 314 * (d.size / totalInfluence) : 5)));

  function cellTicked() {
    // console.log(data.nodes[0]);
    // if (data.nodes[0].x) {
    //   const cellPolygonShapes = voronoi(data.nodes.map(d => [d.x, d.y])).polygons();
    //   // console.log(cellPolygonShapes);
    //   cellPolygons.attr('points', (d, i) => cellPolygonShapes[i]);
    // }
    cellLink
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);
    cellNode
      .attr('transform', d => `translate( ${d.x}, ${d.y})`);
  }

  return <svg />;
}

export { OpinionLeader };
