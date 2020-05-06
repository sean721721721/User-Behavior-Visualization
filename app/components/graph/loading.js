/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
/* eslint-disable linebreak-style */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
import * as d3 from 'd3';

export default function loading(temp, total, svg) {
  const h = parseFloat(d3.select('#commentTimeline').style('height'));
  const w = parseFloat(d3.select('#commentTimeline').style('width'));
  const color = d3.schemeTableau10;
  if (temp === 0) {
    // d3.select('#submitUsers')
    //   .style('visibility', 'hidden');
    svg.selectAll('*').remove();
    svg.append('rect')
      .attr('x', w / 2 - 100)
      .attr('y', 50)
      .attr('height', 10)
      .attr('width', 1)
      .attr('fill', color[0]);
    svg.append('text')
      .text(`${1} %`)
      .attr('x', (w / 2 - 100) + 1 + 10)
      .attr('y', 60);
  }

  if (temp > 0) {
    svg.selectAll('rect')
      .attr('x', w / 2 - 100)
      .attr('y', 50)
      .attr('height', 10)
      .transition()
      .duration(1000)
      .attr('width', 200 * (temp / total));
    svg.selectAll('text')
      .text(`${Math.round(100 * (temp / total))} %`)
      .transition()
      .duration(1000)
      .attr('x', (w / 2 - 100) + 200 * (temp / total) + 10)
      .attr('y', 60);
  }

  if (temp === total) {
    // d3.select('#submitUsers')
    //   .style('visibility', 'visible');
  }
}
export { loading };
