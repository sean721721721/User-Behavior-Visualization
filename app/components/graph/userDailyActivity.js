/* eslint-disable no-loop-func */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
/* eslint-disable linebreak-style */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
import * as d3 from 'd3';

export default function userDailyActivity(data, user, svg, begin, end) {
  // console.log(user);
  // console.log(data);
  // console.log(begin);
  svg.selectAll('*').remove();
  const h = parseFloat(d3.select('.commentTimeline').style('height'));
  const w = parseFloat(d3.select('.commentTimeline').style('width'));
  const gridSize = 12;
  const userListByReplyCountPerHours = computeUserListByReplyCountPerHours(data, user);
  // console.log(userListByReplyCountPerHours);
  const color = d3.schemeTableau10;
  const myColor = d3.scaleLinear()
    .range([d3.interpolateYlGn(0), d3.interpolateYlGn(0.8)])
    .domain([0, 10]);
  const xScale = getXScale(begin, end);
  const yDomain = getYDomain(begin, end);
  // console.log(yDomain);
  const xDomain = oneToNArray(24);
  const x = d3.scaleBand()
    .range([0, 24 * gridSize])
    .domain(xDomain)
    .padding(0.05);
  const y = d3.scaleBand()
    .range([0, yDomain.length * gridSize])
    .domain(yDomain)
    .padding(0.05);
  const Tooltip = d3.select('.heatMap')
    .select('div')
    .style('opacity', 0)
    .attr('class', 'tooltip')
    .style('background-color', 'white')
    .style('border', 'solid')
    .style('border-width', '2px')
    .style('border-radius', '5px')
    .style('padding', '3px');

  const mouseover = (d, e) => {
    Tooltip
      .style('opacity', 1)
      .html(`<p>${d.article_title} <br> ${e.push_tag} ${e.push_userid}: ${e.push_content}</p>`)
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

  svg.attr('height', `${200 + user.length * (yDomain.length + 5) * gridSize}`);
  let userOffset = 0;
  for (let i = 0; i < userListByReplyCountPerHours.length; i += 1) {
    if (i !== 0) {
      userOffset = userOffset + yDomain.length + 10;
    }
    svg.append('g')
      .attr('transform', () => {
        if (i === 0) return 'translate(200, 100)';
        return `translate(200, ${userOffset * gridSize + 100})`;
      })
      .selectAll()
      .data(userListByReplyCountPerHours[i].time)
      .enter()
      .append('rect')
      .attr('x', (d, index) => x(d.hours))
      // eslint-disable-next-line no-loop-func
      .attr('y', d => y(`${d.month + 1}/${d.date}`))
      .attr('width', x.bandwidth())
      .attr('height', x.bandwidth())
      .style('fill', d => myColor(d.reply.length))
      .attr('border', '0.5px solid black')
      .on('mouseover', d => mouseover(data[i], d))
      .on('mouseout', mouseout);

    svg.append('g')
      .attr('transform', () => {
        if (i === 0) return 'translate(10, 100)';
        return `translate(10, ${userOffset * gridSize + 100})`;
      })
      .append('text')
      .text(userListByReplyCountPerHours[i].id);

    svg.append('g')
      .attr('class', 'yAxis')
      .attr('transform', () => {
        if (i === 0) return 'translate(200, 100)';
        return `translate(200, ${userOffset * gridSize + 100})`;
      })
      .call(d3.axisLeft(y).tickSize(0));
    svg.append('g')
      .attr('class', 'xAxis')
      .attr('transform', () => {
        if (i === 0) return 'translate(200, 100)';
        return `translate(200, ${userOffset * gridSize + 100})`;
      })
      .call(d3.axisTop(x).tickSize(0));
    svg.selectAll('.yAxis')
      .selectAll('.tick')
      .selectAll('text')
      .style('color', (d) => {
        const date = new Date(`${new Date(begin).getFullYear()}/${d}`);
        if (date.getDay() > 0 && date.getDay() < 6) return 'black';
        return 'lightgray';
      });
    svg.selectAll('.xAxis')
      .selectAll('.tick')
      .selectAll('text')
      .style('color', (d) => {
        if (d >= 8 && d <= 18) return 'black';
        return 'lightgray';
      });
  }
  // svg.append('g')
  //   .selectAll('circle')
  //   .data(data)
  //   .enter()
  //   .each((d, i) => {
  //     const year = new Date(d.date).getFullYear();
  //     svg.append('g').attr('transform', 'translate(0,50)')
  //       .selectAll('circle')
  //       .data(d.messages)
  //       .enter()
  //       .append('circle')
  //       .attr('r', e => (user.includes(e.push_userid) ? 5 : 0))
  //       .attr('fill', (e) => {
  //         const index = user.findIndex(u => u === e.push_userid);
  //         return index !== -1 ? color[index] : commentTypeColor(e.push_tag);
  //       })
  //       .attr('cy', (e) => {
  //         const index = user.findIndex(u => u === e.push_userid);
  //         const beginDate = new Date(begin);
  //         const pushDate = new Date(new Date(e.push_ipdatetime).setFullYear(year));
  //         console.log(beginDate, pushDate);
  //         const diffTime = Math.abs(pushDate - beginDate);
  //         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  //         return `${(10 * diffDays) + ((index + 1) * 200)}px`;
  //       })
  //       .attr('cx', (e) => {
  //         const date = new Date(e.push_ipdatetime);
  //         const hours = date.getHours();
  //         const minutes = date.getMinutes();
  //         return xScale(minutes * hours);
  //       })
  //       .on('mouseover', e => mouseover(d, e))
  //       .on('mouseout', mouseout);
  function computeUserListByReplyCountPerHours(d, u) {
    const userList = [];
    u.forEach((e) => {
      userList.push({ id: e, time: [] });
    });
    d.forEach((article) => {
      article.messages.forEach((mes) => {
        const userIndex = userList.findIndex(e => e.id === mes.push_userid);
        if (userIndex !== -1) {
          // console.log(userIndex);
          const date = new Date(mes.push_ipdatetime).getDate();
          const month = new Date(mes.push_ipdatetime).getMonth();
          const hours = new Date(mes.push_ipdatetime).getHours();
          const pushTime = `${month}/${date}/${hours}`;
          const timeIndex = userList[userIndex].time.findIndex(e => e.pushTime === pushTime);
          if (timeIndex !== -1) {
            userList[userIndex].time[timeIndex].reply.push(mes);
          } else {
            userList[userIndex].time.push({
              pushTime,
              month,
              hours,
              date,
              reply: [mes],
            });
          }
        }
      });
    });
    userList.forEach((e) => {
      const earliestDate = new Date(`${e.time[0].month}/${e.time[0].date}`);
      const latestDate = new Date(`${e.time[e.time.length - 1].month}/${e.time[e.time.length - 1].date}`);
      const diffTime = Math.abs(latestDate - earliestDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      e.totalDate = diffDays;
    });
    return userList;
  }
  function oneToNArray(n) {
    const arr = [];
    for (let i = 0; i < n; i += 1) {
      arr.push(i);
    }
    return arr;
  }
  function getYDomain(be, en) {
    const beginDate = new Date(be);
    const endDate = new Date(en);
    // console.log(beginDate, endDate);
    const diffTime = Math.abs(endDate - beginDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const month = beginDate.getMonth();
    const date = beginDate.getDate();
    const arr = [];
    arr.push(`${beginDate.getMonth() + 1}/${beginDate.getDate()}`);
    for (let i = 0; i < diffDays + 3; i += 1) {
      const tempDate = new Date(beginDate.setDate(beginDate.getDate() + 1));
      // console.log(tempDate);
      arr.push(`${tempDate.getMonth() + 1}/${tempDate.getDate()}`);
    }
    return arr;
  }
  function getXScale() {
    const totalMinutes = 60 * 24;
    return d3.scaleTime().domain([0, totalMinutes]).range([100, 1000]);
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

export { userDailyActivity };