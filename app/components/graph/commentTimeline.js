/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
/* eslint-disable linebreak-style */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
import * as d3 from 'd3';

export default function commentTimeline(data, svg, $this) {
  svg.selectAll('*').remove();
  // svg.attr('viewBox', '0 0 960 500');
  console.log(data, svg, $this);
  const h = parseFloat(d3.select('#articleStatus').style('height'));
  const w = parseFloat(d3.select('#articleStatus').style('width'));
  const xScaleWidth = w - 110;
  const timePeriod = 3;
  // const opinionLeader = nodes.find(e => e.id === $this.state.mouseOverUser);
  const timeScaleObjArr = [];
  timeScale(data, timeScaleObjArr);

  const numOfArticleScale = d3.scaleLinear()
    .domain([0, 1])
    .range([0, h]);
  let articleIndex = -1; // control each article lines position
  const articleTime = svg.selectAll('g')
    .data([data])
    .enter()
    .append('g')
    .attr('class', 'articles')
    .attr('id', (d, i) => `article_${i}`)
    .attr('transform', () => {
      articleIndex += 1;
      return `translate(40,${150 + articleIndex * 150})`;
    })
    .each((d, index, nodes) => {
      const xAxis = makeXAxis(d);
      const yAxis_left = makeYAxis('left');
      const yAxis_right = makeYAxis('right');
      const line = d3.line()
        .x((m, j) => {
          const time = dateFormat(m);
          const articleYear = new Date(m.articleDate).getFullYear();
          return xScale(m.articleId, new Date(time).setFullYear(articleYear));
        })
        .y(m => yScale(m.articleId, m.value)) // set the y values for the line generator
        .curve(d3.curveMonotoneX); // apply smoothing to the line
      const axis = d3.select(nodes[index]);
      const info = axis.append('g');
      info.append('text')
        .text(`Title: ${d.title}`)
        .attr('x', 30)
        .attr('y', -130);
      info.append('text')
        .text(`Author: ${d.author}`)
        .attr('x', 30)
        .attr('y', -110);
      info.append('text')
        .text(`推: ${d.message_count[0].count}  噓: ${d.message_count[1].count}  →: ${d.message_count[2].count}`)
        .attr('x', 30)
        .attr('y', -90);
      axis.append('g')
        .attr('transform', 'translate(10, -80)')
        .call(yAxis_left)
        .append('text')
        .attr('fill', 'black')
        .attr('font-size', 12)
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(-30, 50) rotate(-90)')
        .text('Push - Boo');
      axis.append('g')
        .attr('transform', `translate(${xScaleWidth}, -80)`)
        .call(yAxis_right)
        .append('text')
        .attr('fill', 'black')
        .attr('font-size', 12)
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(40, 50) rotate(-90)')
        .text('comments per 10 mins');
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
      const newData = commentTimeData(d);
      const removeOverTimeData = newData.filter((mes) => {
        let t = dateFormat(mes);
        const art = new Date(mes.articleDate).getFullYear();
        t = new Date(t).setFullYear(art);
        if ((new Date(t) - new Date(mes.articleDate)) / (timePeriod * 60 * 60000) < 1) return true;
        return false;
      });
      return removeOverTimeData;
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

  svg.selectAll('.articles')
    .each((d, i, n) => {
      d3.select(n[i]).selectAll('circle')
        .each((_d, _i, _n) => {
          const x = parseFloat(d3.select(_n[_i]).attr('cx'));
          const y = parseFloat(d3.select(_n[_i]).attr('cy'));
          d3.selectAll('.articles').each((d2, i2, n2) => {
            // console.log(d2);
            d3.select(n2[i2]).selectAll(`.${_d.push_userid}`).each((_d2, _i2, _n2) => {
              // console.log(d3.select(this).attr('cx'));
              if (i < i2) {
                linkCoordinateWithSameUser.push({
                  class: _d.push_userid,
                  x1: x,
                  y1: y + (100 + (i * 130)),
                  x2: parseFloat(d3.select(_n2[_i2]).attr('cx')),
                  y2: parseFloat(d3.select(_n2[_i2]).attr('cy')) + (100 + (i2 * 130)),
                });
              }
            });
          });
        });
    });

  svg.append('g')
    .attr('class', 'link')
    .attr('transform', 'translate(40,0)')
    .selectAll('line')
    .data(linkCoordinateWithSameUser)
    .enter()
    .append('line')
    .attr('class', d => d.class)
    .attr('x1', d => d.x1)
    .attr('y1', d => d.y1)
    .attr('x2', d => d.x2)
    .attr('y2', d => d.y2)
    .attr('stroke', 'gray')
    .attr('stroke-opacity', 0.1)
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

  function timeScale(d, arr) {
    const begin = new Date(d.date);
    const afterThreeDays = new Date(d.date);
    afterThreeDays.setHours(begin.getHours() + timePeriod);

    const scaleX = d3.scaleTime().domain([begin, afterThreeDays]).range([10, w - 100]);
    const scaleY = d3.scaleLinear().domain([-100, 100]).range([100, 0]);
    arr.push({ articleId: d.articleId, scaleX, scaleY });
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
      .range([10, w - 110]);
    const afterArticlePostTimeFormat = (date) => {
      const dateMinusPostTime = d3.timeMinute.count(articleDate, new Date(date));
      return `${Math.floor(dateMinusPostTime / 60)}h${dateMinusPostTime % 60}m`;
    };
    return d3.axisBottom(commentTimeScale)
      .ticks(3).tickFormat(date => afterArticlePostTimeFormat(date));
  }

  function makeYAxis(direction) {
    if (direction === 'left') {
      const commentScoreScale = d3.scaleLinear().domain([-100, 100])
        .range([100, 0]);
      return d3.axisLeft(commentScoreScale).ticks(3);
    } if (direction === 'right') {
      const commentScoreScale = d3.scaleLinear().domain([0, 100])
        .range([100, 0]);
      return d3.axisRight(commentScoreScale).ticks(3);
    }
    return null;
  }

  function makeDataFitLineChart(d) {
    const newData = JSON.parse(JSON.stringify(d));
    newData.message.forEach((mes) => {
      mes.articleId = d.articleId;
      mes.articleDate = d.date;
      mes.value = 1;
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
    const message = newData.message.filter((mes) => {
      let t = dateFormat(mes);
      const art = new Date(mes.articleDate).getFullYear();
      t = new Date(t).setFullYear(art);
      if ((new Date(t) - new Date(mes.articleDate)) / (timePeriod * 60 * 60000) < 1) return true;
      return false;
    });
    return message;
  }

  function commentTimeData(d) {
    const newData = JSON.parse(JSON.stringify(d));
    newData.message.forEach((mes) => {
      mes.articleId = d.articleId;
      mes.articleDate = d.date;
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
