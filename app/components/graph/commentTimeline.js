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
  // svg.attr('viewBox', '0 0 960 500');
  const h = parseFloat(d3.select('.commentTimeline').style('height'));
  const w = parseFloat(d3.select('.commentTimeline').style('width'));
  const timePeriod = 3;
  const opinionLeader = nodes.find(e => e.id === $this.state.mouseOverUser);
  const timeScaleObjArr = [];
  timeScale(opinionLeader, timeScaleObjArr);

  const numOfArticleScale = d3.scaleLinear()
    .domain([0, opinionLeader.responder.length])
    .range([0, h]);
  let articleIndex = -1; // control each article lines position
  const articleTime = svg.selectAll('g')
    .data(opinionLeader.responder)
    .enter()
    .append('g')
    .attr('id', (d, i) => `article_${i}`)
    .attr('transform', () => {
      articleIndex += 1;
      return `translate(0,${100 + articleIndex * 130})`;
    })
    .each((d, i) => {
      const xAxis = makeXAxis(d);
      const line = d3.line()
        .x((m, j) => {
          const time = dateFormat(m);
          const articleYear = new Date(m.articleDate).getFullYear();
          return xScale(m.articleId, new Date(time).setFullYear(articleYear));
        })
        .y((m) => {
          // console.log(m);
          // console.log(m.value, yScale(m.articleId, m.value));
          return yScale(m.articleId, m.value);
        }) // set the y values for the line generator
        .curve(d3.curveMonotoneX); // apply smoothing to the line
      const axis = d3.select(`#article_${i}`);
      axis.append('g')
        .attr('transform', 'translate(0, 20)')
        .call(xAxis)
        .append('g')
        .attr('transform', 'translate(0, -50)')
        .append('path')
        .datum(makeDataFitLineChart(d)) // 10. Binds data to the line
        .attr('class', 'line') // Assign a class for styling
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1.5)
        .attr('d', line); // 11. Calls the line g;
    });

  const commentTime = articleTime.selectAll('circle')
    .data((d) => {
      return commentTimeData(d);
      // d.message.forEach((m) => {
      //   m.articleId = d.articleId;
      //   m.articleDate = d.date;
      // });
      // return d.message;
    })
    .enter()
    .append('circle')
    .attr('class', d => d.push_userid)
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
    .attr('r', 3)
    .attr('cx', (d) => {
      const time = dateFormat(d);
      const articleYear = new Date(d.articleDate).getFullYear();
      return xScale(d.articleId, new Date(time).setFullYear(articleYear));
    })
    .attr('cy', (d) => {
      let value = d.value > 100 ? 100 : d.value;
      value = d.value < -100 ? -100 : value;
      return yScale(d.articleId, value) - 80;
    });

  commentTime.append('title')
    .text(d => d.push_ipdatetime);

  const linkCoordinateWithSameUser = [];
  d3.select('#commentTimeline')
    .selectAll('circle')
    .each((d, i, ns) => {
      console.log(d3.select(ns[i]));
      const x = d3.select(ns[i]).attr('cx');
      const y = d3.select(ns[i]).attr('cy');
      d3.selectAll(`.${d.push_userid}`).each((d2, j, _ns) => {
        // console.log(d3.select(this).attr('cx'));
        console.log(d3.select(_ns[j]));
        linkCoordinateWithSameUser.push({
          x1: x,
          y1: y,
          x2: d3.select(_ns[j]).attr('cx'),
          y2: d3.select(_ns[j]).attr('cy'),
        });
      });
    });
  
  console.log(linkCoordinateWithSameUser);

  svg.append('g')
    .attr('class', 'link')
    .attr('transform', 'translate(0,100)')
    .selectAll('line')
    .data(linkCoordinateWithSameUser)
    .enter()
    .append('line')
    .attr('x1', d => d.x1)
    .attr('y1', d => d.y1)
    .attr('x2', d => d.x2)
    .attr('y2', d => d.y2)
    .attr('stroke', 'blue')
    .attr('stroke-width', 1);



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
      afterThreeDays.setHours(begin.getHours() + timePeriod);

      const scaleX = d3.scaleTime().domain([begin, afterThreeDays]).range([10, w - 30]);
      const scaleY = d3.scaleLinear().domain([-100, 100]).range([100, 0]);
      arr.push({ articleId: a.articleId, scaleX, scaleY });
    });
  }

  function xScale(id, date) {
    const { scaleX } = timeScaleObjArr.find(e => e.articleId === id);
    return scaleX(date);
  }

  function yScale(id, date) {
    const { scaleY } = timeScaleObjArr.find(e => e.articleId === id);
    return scaleY(date);
  }

  function makeXAxis(d) {
    const articleDate = new Date(d.date);
    const afterSixHours = new Date(d.date);
    afterSixHours.setHours(articleDate.getHours() + timePeriod);
    const commentTimeScale = d3.scaleTime().domain([articleDate, afterSixHours])
      .range([10, w - 30]);
    return d3.axisBottom(commentTimeScale).ticks(12).tickFormat(d3.timeFormat('%H:%M'));
  }

  function makeDataFitLineChart(data) {
    const newData = JSON.parse(JSON.stringify(data));
    newData.message.forEach((mes) => {
      mes.articleId = data.articleId;
      mes.articleDate = data.date;
      mes.value = 1;
      // switch (mes.push_tag) {
      //   case '推':
      //     mes.value = 1;
      //     break;
      //   case '噓':
      //     mes.value = -1;
      //     break;
      //   case '→':
      //     mes.value = 0;
      //     break;
      //   default:
      //     break;
      // }
    });
    // date type need to preprocess ip format
    for (let i = 0; i < newData.message.length; i += 1) {
      for (let j = i + 1; j < newData.message.length; j += 1) {
        const pre = newData.message[i];
        const nex = newData.message[j];
        const preTime = dateFormat(pre);
        const nexTime = dateFormat(nex);
        if (new Date(nexTime) - new Date(preTime) > 300000) break;
        pre.value += nex.value;
        newData.message.splice(j, 1);
        j -= 1;
      }
    }
    return newData.message;
  }

  function commentTimeData(data) {
    const newData = JSON.parse(JSON.stringify(data));
    newData.message.forEach((mes) => {
      mes.articleId = data.articleId;
      mes.articleDate = data.date;
      switch (mes.push_tag) {
        case '推':
          mes.value = 1;
          break;
        case '噓':
          mes.value = -1;
          break;
        case '→':
          mes.value = 0;
          break;
        default:
          break;
      }
    });

    for (let i = 0; i < newData.message.length - 1; i += 1) {
      const pre = newData.message[i];
      const nex = newData.message[i + 1];
      nex.value += pre.value;
    }
    return newData.message;
  }
}

export { commentTimeline };
