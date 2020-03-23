/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
/* eslint-disable linebreak-style */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
import * as d3 from 'd3';

export default function commentTimeline(nodes, svg, $this) {
  console.log(nodes);
  svg.selectAll('*').remove();
  const h = parseFloat(d3.select('.commentTimeline').style('height'));
  const w = parseFloat(d3.select('.commentTimeline').style('width'));
  console.log(w);
  const timePeriod = 12;
  const opinionLeader = nodes.find(e => e.id === $this.state.mouseOverUser);
  const timeScaleObjArr = [];
  timeScale(opinionLeader, timeScaleObjArr);

  const numOfArticleScale = d3.scaleLinear()
    .domain([0, opinionLeader.responder.length])
    .range([0, h]);
  let articleIndex = 0; // control each article lines position
  const articleTime = svg.selectAll('g')
    .data(opinionLeader.responder)
    .enter()
    .append('g')
    .attr('id', (d, i) => `article_${i}`)
    .attr('transform', () => {
      articleIndex += 1;
      return `translate(0,${articleIndex * 30})`;
    })
    .each((d, i) => {
      console.log(d);
      const axis = d3.select(`#article_${i}`);
      console.log(axis);
      const articleDate = new Date(d.date);
      const afterSixHours = new Date(d.date);
      afterSixHours.setHours(articleDate.getDate() + timePeriod);
      const commentTimeScale = d3.scaleTime().domain([articleDate, afterSixHours])
        .range([20, w - 20]);
      const xAxis = d3.axisBottom(commentTimeScale).ticks(6);
      axis.append('g')
        .attr('transform', 'translate(0, 20)')
        .call(xAxis);
    });

  const commentTime = articleTime.selectAll('circle')
    .data((d) => {
      d.message.forEach((m) => {
        m.articleId = d.articleId;
        m.articleDate = d.date;
      });
      return d.message;
    })
    .enter()
    .append('rect')
    .attr('fill', (d) => {
      let color = 'green';
      switch (d.push_tag) {
        case '推':
          color = 'green';
          break;
        case '噓':
          color = 'red';
          break;
        case '→':
          color = 'yellow';
          break;
        default:
          break;
      }
      return color;
    })
    .attr('r', 2)
    .attr('x', (d) => {
      const time = dateFormat(d);
      const articleYear = new Date(d.articleDate).getFullYear();
      return xScale(d.articleId, new Date(time).setFullYear(articleYear));
    })
    .attr('y', 10)
    .attr('width', 1)
    .attr('height', 10);

  function dateFormat(mes) {
    let dat = '';
    const splitedDate = mes.push_ipdatetime.split(' ');
    if (splitedDate.length === 3) {
      dat = dat.concat('', splitedDate[1]);
      dat = dat.concat(' ', splitedDate[2]);
      return dat;
    }
    return mes.push_ipdatetime;
  }

  function timeScale(node, arr) {
    node.responder.forEach((a) => {
      const begin = new Date(a.date);
      const afterThreeDays = new Date(a.date);
      afterThreeDays.setHours(begin.getDate() + timePeriod);

      const commentTimeScale = d3.scaleTime()
        .domain([begin, afterThreeDays])
        .range([20, w - 20]);
      arr.push({ articleId: a.articleId, scale: commentTimeScale });
    });
  }

  function xScale(id, date) {
    const { scale } = timeScaleObjArr.find(e => e.articleId === id);
    return scale(date);
  }
}

export { commentTimeline };
