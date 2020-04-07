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
  console.log(data);
  svg.selectAll('*').remove();
  // svg.attr('viewBox', '0 0 960 500');
  const h = parseFloat(d3.select('.commentTimeline').style('height'));
  const w = parseFloat(d3.select('.commentTimeline').style('width'));
  const xScaleWidth = w - 110;
  const timePeriod = 3;
  const timeScaleObjArr = [];
  const articleArr = sortedArticleArray(data.nodes);
  console.log(articleArr);

  const yScale = d3.scalePoint()
    .domain(articleArr.map(e => e.title)) // This is what is written on the Axis: from 0 to 100
    .range([0, articleArr.length * 20]); // This is where the axis is placed: from 100 px to 800px

  const xScale = respondingTimeScaleArray(articleArr);
  // d3.scaleTime()
  //   .domain([]) // This is what is written on the Axis: from 0 to 100
  //   .range([100, 800]); // This is where the axis is placed: from 100 px to 800px

  // Draw the axis
  svg
    .append('g')
    .attr('transform', 'translate(100,50)') // This controls the vertical position of the Axis
    .call(d3.axisLeft(yScale));

  // Add 1 circle for the group B:
  svg.selectAll('circle')
    .data(articleArr)
    .enter()
    .each((d, i) => {
      console.log(d, i);
      const year = new Date(d.date).getFullYear();
      console.log(year);
      svg.append('g').attr('transform', 'translate(0,50)')
        .selectAll('circle')
        .data(d.message)
        .enter()
        .append('circle')
        .attr('r', (e) => {
          return e.push_userid === user.id ? 5 : 2;
        })
        .attr('fill', e => commentTypeColor(e.push_tag))
        .attr('cy', yScale(d.title))
        .attr('cx', (e) => {
          const date = new Date(e.push_ipdatetime);
          return xScale[i](new Date(date.setFullYear(year)));
        })
        .attr('stroke-width', (e) => {
          return e.push_userid === user.id ? 1 : 0;
        })
        .attr('stroke', 'black');
    });


  function sortedArticleArray(arr) {
    const tempArr = [];
    arr.forEach((e) => {
      e.articles.forEach((a) => {
        tempArr.push(a);
      });
    });
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
