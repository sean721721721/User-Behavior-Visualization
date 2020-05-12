/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
/* eslint-disable linebreak-style */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
import * as d3 from 'd3';

export default function userActivityTimeline(data, svg, user) {
  console.log(user);
  console.log(data);
  svg.selectAll('*').remove();
  // svg.attr('viewBox', '0 0 960 500');
  const h = parseFloat(d3.select('.commentTimeline').style('height'));
  const w = parseFloat(d3.select('.commentTimeline').style('width'));
  const xScaleWidth = w - 110;
  const timePeriod = 1;
  const timeScaleObjArr = [];
  const articleArr = sortedArticleArray(data);
  const color = d3.schemeTableau10;

  const yScale = d3.scalePoint()
    .domain(articleArr.map(e => e.article_title))
    .range([0, articleArr.length * 20]);

  const xScale = respondingTimeScaleArray(articleArr);
  const Tooltip = d3.select('.heatMap')
    .append('div')
    .style('opacity', 0)
    .attr('class', 'tooltip')
    .style('background-color', 'white')
    .style('border', 'solid')
    .style('border-width', '2px')
    .style('border-radius', '5px')
    .style('padding', '2px');

  // Three function that change the tooltip when user hover / move / leave a cell
  const mouseover = (d) => {
    Tooltip
      .style('opacity', 1)
      .html(`${d.push_tag} ${d.push_userid}: ${d.push_content}`)
      .style('left', `${d3.event.pageX + 25}px`)
      .style('top', `${d3.event.pageY}px`);
    d3.select(this)
      .style('stroke', 'black')
      .style('opacity', 1);
  };
  const mouseout = (d) => {
    Tooltip
      .style('opacity', 0);
    d3.select(this)
      .style('stroke', 'none')
      .style('opacity', 0.8);
  };
  const legends = svg.append('g').attr('transform', 'translate(50,25)');
  legends.selectAll('mydots')
    .data(user)
    .enter()
    .append('circle')
    .attr('cx', (d, i) => i * 100)
    .attr('cy', 0)
    .attr('r', 7)
    .style('fill', (d, i) => color[i]);

  legends.selectAll('mylabels')
    .data(user)
    .enter()
    .append('text')
    .attr('x', (d, i) => 12 + i * 100)
    .attr('y', 0)
    .style('fill', (d, i) => color[i])
    .text(d => d)
    .attr('font-size', '12px')
    .attr('text-anchor', 'left')
    .style('alignment-baseline', 'middle');

  svg.attr('height', articleArr.length * 20 + 100);
  // Draw the axis
  svg
    .append('g')
    .attr('transform', 'translate(100,50)') // This controls the vertical position of the Axis
    .call(d3.axisLeft(yScale));

  // Add 1 circle for the group B:
  svg.append('g')
    .selectAll('circle')
    .data(articleArr)
    .enter()
    .each((d, i) => {
      const year = new Date(d.date).getFullYear();
      svg.append('g').attr('transform', 'translate(0,50)')
        .selectAll('circle')
        .data(d.messages)
        .enter()
        .append('circle')
        .attr('r', e => (user.includes(e.push_userid) ? 5 : 0))
        .attr('fill', (e) => {
          const index = user.findIndex(u => u === e.push_userid);
          return index !== -1 ? color[index] : commentTypeColor(e.push_tag);
        })
        .attr('cy', yScale(d.article_title))
        .attr('cx', (e) => {
          const date = new Date(e.push_ipdatetime);
          return xScale[i](new Date(date.setFullYear(year)));
        })
        .on('mouseover', mouseover)
        .on('mouseout', mouseout);
      // .attr('stroke-width', (e) => {
      //   return user.some(u => u === e.push_userid) ? 1 : 0;
      // })
      // .attr('stroke', 'black');
    });


  function sortedArticleArray(arr) {
    const tempArr = arr;
    tempArr.sort((a, b) => new Date(a.date) - new Date(b.date));
    return tempArr;
  }

  function respondingTimeScaleArray(arr) {
    const scales = [];
    arr.forEach((e) => {
      const beginDate = new Date(e.date);
      const afterSixHours = new Date(e.date);
      afterSixHours.setHours(beginDate.getHours() + timePeriod);
      scales.push(d3.scaleTime().domain([beginDate, afterSixHours]).range([100, 800]));
    });
    return scales;
  }

  function commentTypeColor(tag) {
    switch (tag) {
      case '推':
        return 'green';
      case '噓':
        return 'red';
      case '→':
        return 'yellow';
      default:
        return 'black';
    }
  }
}

export { userActivityTimeline };
