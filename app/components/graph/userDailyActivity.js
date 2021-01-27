/* eslint-disable max-len */
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
import * as slider from 'd3-simple-slider';
import AuthorTable from './authorTable';

export default function userDailyActivity(data, user, svg, begin, end) {
  // console.log(begin);
  svg.selectAll('*').remove();
  // const h = parseFloat(d3.select('.commentTimeline').style('height'));
  // const w = parseFloat(d3.select('.commentTimeline').style('width'));
  const h = parseFloat(d3.select('#context').style('height')) - 220;
  const w = parseFloat(d3.select('#context').style('width'));
  let original_date1 = new Date(begin);
  original_date1.setHours(0, 0, 0);
  let original_date2 = new Date(end);
  original_date2.setHours(23, 59, 59);
  // console.log(original_date1, original_date2);
  let filteredArticles = [];
  // Range
  d3.select('div#slider-range').select('svg').remove();
  const sliderRange = slider.sliderBottom()
    .min(original_date1)
    .max(original_date2)
    .width(300)
    .tickFormat(d3.timeFormat('%m/%d %H'))
    .ticks(5)
    .default([original_date1, original_date2])
    .fill('#2196f3')
    .on('onchange', (val) => {
      update(new Date(val[0]), new Date(val[1]));
      original_date1 = new Date(val[0]);
      original_date2 = new Date(val[1]);
    });

  const gRange = d3
    .select('div#slider-range')
    .append('svg')
    .attr('width', 300)
    .attr('height', 30)
    .append('g')
    .attr('transform', 'scale(0.8) translate(20,10)');

  gRange.call(sliderRange);
  gRange.select('.axis')
    .attr('transform', 'translate(0, 0)')
    .selectAll('text')
    .attr('y', 10);
  gRange.selectAll('.parameter-value')
    .selectAll('text')
    .attr('y', 15);
  d3.select('p#value-range').text('Time Range')
    .style('text-align', 'right');

  //----------------

  svg.selectAll('*').remove();
  const gridSize = 12;
  const userListByReplyCountPerHours = computeUserListByReplyCountPerHours(data, user);
  // console.log(userListByReplyCountPerHours);
  const color = [
    d3.interpolateBlues,
    d3.interpolateOranges,
    d3.interpolateGreens,
    d3.interpolatePurples,
    d3.interpolateReds,
    d3.interpolateYlOrBr,
    d3.interpolateGnBu,
    d3.interpolateGreys,
  ];
  const pushTypeColor = d3.schemeTableau10;
  const myColor = d3.scaleLinear()
    .range([d3.interpolateYlGn(0), d3.interpolateYlGn(0.8)])
    .domain([0, 10]);
  const xScale = getXScale(original_date1, original_date2);
  const timeScale = d3.scaleTime().domain([original_date1, original_date2]).range([0, h]);
  // console.log('height', h);
  const userScaleRange = 350;
  const userID = user.map(e => e.id);
  const userScale = d3.scaleBand().domain(userID).range([0, userScaleRange]);
  const yDomain = getYDomain(original_date1, original_date2);
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
  const Tooltip = d3.select('.tooltip');
  let isClicked = null;
  const click = (article) => {
    isClicked = isClicked ? null : article.article_id;
    console.log('isClicked', isClicked);
    Tooltip
      .style('opacity', 0)
      .style('left', '0px')
      .style('top', '0px');
    if (isClicked) {
      tooltipForArticle(article);
    }
    fixedSvg.selectAll('.repostLink')
      .attr('opacity', isClicked ? 0 : 1);
    fixedSvg.selectAll('.pointer')
      .attr('opacity', isClicked ? 0 : 1);
    fixedSvg.selectAll('.article')
      .attr('opacity', isClicked ? 0 : 1);
    const articleId = article.article_id.replace(/\./gi, '');
    fixedSvg.selectAll(`.pointer.articleID_${articleId}`)
      .attr('opacity', 1);
    const includesUser = [];
    article.messages.forEach((mes) => {
      if (userID.includes(mes.push_userid)) {
        if (!includesUser.includes(mes.push_userid)) {
          includesUser.push(mes.push_userid);
        }
      }
    });
    const pointerWidth = d3.scaleLinear().domain([0, userID.length]).range([0, -80]);
    fixedSvg.selectAll(`.pointer.articleID_${articleId}`)
      .selectAll('rect')
      .transition()
      .duration(1000)
      .attr('width', isClicked ? -pointerWidth(includesUser.length) + userScale.range()[1] : -pointerWidth(includesUser.length));
    console.log(article);
    if (isClicked) {
      const postYear = new Date(article.date).getFullYear();
      const filteredMessages = article.messages.filter(e => userID.includes(e.push_userid));
      fixedSvg.selectAll()
        .data(filteredMessages)
        .enter()
        .append('circle')
        .attr('class', 'commentTime')
        .attr('cx', d => userScale(d.push_userid) + userScale.bandwidth() / 2)
        .attr('r', 4)
        // .attr('width', userScale.bandwidth())
        .style('fill', d => commentTypeColor(d.push_tag))
        .attr('opacity', (d, index) => {
          const date = dateFormat(d);
          const commentTime = new Date(new Date(date).setFullYear(postYear));
          return timeScale(commentTime) < h ? 1 : 0;
        })
        .on('mouseover', d => mouseover(article, d))
        .on('mouseout', d => mouseout(d, article.article_id))
        .attr('cy', timeScale(new Date(article.date)))
        .transition()
        .duration(1000)
        .attr('cy', (d, index) => {
          const date = dateFormat(d);
          const commentTime = new Date(new Date(date).setFullYear(postYear));
          return timeScale(commentTime);
        });
    } else {
      fixedSvg.selectAll('.commentTime').remove();
    }
  };

  const mouseover = (d, e) => {
    // console.log(d, e, isClicked);
    if (isClicked) {
      if (d.article_id === isClicked) {
        if (Array.isArray(e)) {
          tooltipForArticle(d);
        } else {
          Tooltip
            .style('opacity', 1)
            .html(`<p style="color: white;">${e.push_tag} ${e.push_userid}: ${e.push_content} ${e.push_ipdatetime}</p>`)
            .style('left', `${d3.event.pageX + 25}px`)
            .style('top', `${d3.event.pageY + 25}px`);
          d3.select(this)
            .style('stroke', 'black')
            .style('opacity', 1);
        }
      }
      if (d !== isClicked) return;
    }

    if (Array.isArray(e)) {
      const title = d.article_title || '';
      tooltipForArticle(d);
      fixedSvg.selectAll('.repostLink')
        .attr('opacity', '0');
      fixedSvg.selectAll('.pointer')
        .attr('opacity', '0');
      fixedSvg.selectAll('.article')
        .attr('opacity', '0');
      const articleId = d.article_id.replace(/\./gi, '');
      fixedSvg.selectAll(`.articleID_${articleId}`)
        .attr('opacity', '1');
      for (let i = 0; i < e.length; i += 1) {
        if (d.article_title[0] === 'R') {
          if (d.article_title.substring(4) === e[i].article_title) {
            const originalId = e[i].article_id.replace(/\./gi, '');
            fixedSvg.selectAll(`.articleID_${originalId}`)
              .attr('opacity', '1');
            fixedSvg.selectAll(`.repostLink.${originalId}`)
              .attr('opacity', '1');
          }
        } else if (d.article_title === e[i].article_title.substring(4)) {
          const originalId = d.article_id.replace(/\./gi, '');
          const repostId = e[i].article_id.replace(/\./gi, '');
          fixedSvg.selectAll(`.articleID_${repostId}`)
            .attr('opacity', '1');
          fixedSvg.selectAll(`.repostLink.${originalId}`)
            .attr('opacity', '1');
        }
      }
    } else {
      Tooltip
        .style('opacity', 1)
        .html(`<p style="color: white;">${e.push_tag} ${e.push_userid}: ${e.push_content} ${e.push_ipdatetime}</p>`)
        .style('left', `${d3.event.pageX + 25}px`)
        .style('top', `${d3.event.pageY + 25}px`);
      d3.select(this)
        .style('stroke', 'black')
        .style('opacity', 1);
    }
  };
  const mouseout = (d, articleId) => {
    console.log(d);
    if (!isClicked) {
      Tooltip
        .style('opacity', 0)
        .style('left', '0px')
        .style('top', '0px');
      fixedSvg.selectAll('.repostLink')
        .attr('opacity', 1);
      fixedSvg.selectAll('.article')
        .attr('opacity', 1);
      fixedSvg.selectAll('.pointer')
        .attr('opacity', 1);
      d3.select(this)
        .style('stroke', 'none')
        .style('opacity', 0.8);
    }
  };

  const repostLinkMouseOver = (d) => {
    if (!isClicked) {
      fixedSvg.selectAll('.repostLink')
        .attr('opacity', '0');
      fixedSvg.selectAll('.article')
        .attr('opacity', '0');
      fixedSvg.selectAll('.pointer')
        .attr('opacity', '0');
      const articleId1 = d[0].replace(/\./gi, '');
      console.log(articleId1);
      fixedSvg.selectAll(`.articleID_${articleId1}`)
        .attr('opacity', '1');
      const articleId2 = d[1].replace(/\./gi, '');
      fixedSvg.selectAll(`.articleID_${articleId2}`)
        .attr('opacity', '1');
      fixedSvg.selectAll(`#${articleId1}_${articleId2}`)
        .attr('opacity', '1');
    }
  };

  // const legends = svg.append('g').attr('transform', 'translate(50,25)');
  // legends.selectAll('mydots')
  //   .data(user)
  //   .enter()
  //   .append('circle')
  //   .attr('cx', (d, i) => i * 100)
  //   .attr('cy', 0)
  //   .attr('r', 7)
  //   .style('fill', (d, i) => color[i]);

  // legends.selectAll('mylabels')
  //   .data(user)
  //   .enter()
  //   .append('text')
  //   .attr('x', (d, i) => 12 + i * 100)
  //   .attr('y', 0)
  //   .style('fill', (d, i) => color[i])
  //   .text(d => d)
  //   .attr('font-size', '12px')
  //   .attr('text-anchor', 'left')
  //   .style('alignment-baseline', 'middle');

  // svg.attr('height', `${200 + user.length * (yDomain.length + 5) * gridSize}`);
  const userOffset = 0;
  // for (let i = 0; i < userListByReplyCountPerHours.length; i += 1) {
  //   if (i !== 0) {
  //     userOffset = userOffset + yDomain.length + 10;
  //   }
  // svg.append('g')
  //   .attr('transform', () => {
  //     if (i === 0) return 'translate(200, 100)';
  //     return `translate(200, ${userOffset * gridSize + 100})`;
  //   })
  //   .selectAll()
  //   .data(userListByReplyCountPerHours[i].time)
  //   .enter()
  //   .append('rect')
  //   // .attr('x', (d, index) => x(d.hours))
  //   .attr('x', (d, index) => x(d.hours))
  //   // eslint-disable-next-line no-loop-func
  //   .attr('y', d => y(`${d.month + 1}/${d.date}`))
  //   .attr('width', x.bandwidth())
  //   .attr('height', x.bandwidth())
  //   .style('fill', d => myColor(d.reply.length))
  //   .attr('border', '0.5px solid black')
  //   .on('mouseover', d => mouseover(data[i], d))
  //   .on('mouseout', mouseout);
  const fixedSvg = svg.append('g')
    .attr('transform', `translate(${w - userScaleRange - 10}, 100)`);
  // for (let i = 0; i < userID.length; i += 1) {
  //   fixedSvg.append('g')
  //     .selectAll()
  //     .data(userID)
  //     .enter()
  //     .append('rect')
  //     .attr('y', 0)
  //     .attr('x', d => userScale(d))
  //     .attr('height', timeScale.range()[1])
  //     .attr('width', userScale.bandwidth())
  //     .attr('stroke', 'black')
  //     .attr('stroke-width', '0.3px')
  //     .style('fill', (d, index) => (index % 2 ? 'white' : 'gainsboro'));
  // }

  // add gray area for off day
  for (let i = timeScale.domain()[0]; i < timeScale.domain()[1]; i = new Date(i).setDate(new Date(i).getDate() + 1)) {
    if (new Date(i).getDay() > 5 || new Date(i).getDay() < 1) {
      fixedSvg.selectAll()
        .data([i])
        .enter()
        .append('rect')
        .attr('class', 'offday')
        .attr('x', 0)
        .attr('y', d => timeScale(new Date(d)))
        .attr('fill', 'lightgray')
        .attr('width', userScale.range()[1])
        .attr('height', (d) => {
          const nextDate = new Date(d);
          const temp = new Date(d);
          nextDate.setDate(nextDate.getDate() + 1);
          return timeScale(nextDate) - timeScale(temp);
        });
    } else {
      fixedSvg.selectAll()
        .data([new Date(new Date(new Date(i).setHours(0)).setMinutes(0)).setSeconds(0)])
        .enter()
        .append('rect')
        .attr('class', 'beforWork')
        .attr('x', 0)
        .attr('y', d => timeScale(new Date(d)))
        .attr('fill', 'lightgray')
        .attr('width', userScale.range()[1])
        .attr('height', (d) => {
          const workHour = new Date(d);
          const temp = new Date(d);
          workHour.setHours(workHour.getHours() + 9);
          return timeScale(workHour) - timeScale(temp);
        });
      fixedSvg.selectAll()
        .data([new Date(new Date(new Date(i).setHours(18)).setMinutes(0)).setSeconds(0)])
        .enter()
        .append('rect')
        .attr('class', 'afterWork')
        .attr('x', 0)
        .attr('y', d => timeScale(new Date(d)))
        .attr('fill', 'lightgray')
        .attr('width', userScale.range()[1])
        .attr('height', (d) => {
          const midnight = new Date(d);
          const temp = new Date(d);
          midnight.setHours(midnight.getHours() + 6);
          return timeScale(midnight) - timeScale(temp);
        });
    }
  }
  // user axis
  fixedSvg.append('g')
    .attr('class', 'xAxis')
    .call(d3.axisTop(userScale).tickSizeInner([-h]))
    .selectAll('text')
    .style('text-anchor', 'start')
    .attr('font-size', 14)
    .attr('fill', d => color[user.find(e => e.id === d).community](0.8))
    .attr('dx', '0.8em')
    .attr('dy', '0.5em')
    .attr('transform', 'rotate(-90)');

  // date axis
  fixedSvg.append('g')
    .attr('class', 'yAxis')
    .call(d3.axisLeft(timeScale)
      .ticks(d3.timeDay.every(1))
      .tickFormat(d3.timeFormat('%m/%d'))
      .tickSizeInner([100]));
  
  // article reply by users axis
  // const percentOfUsersReplyScale = d3.scaleLinear().domain(['0%', '25%', '50%', '75%', '100%']).range([0, -80]);
  const percentOfUsersReplyScale = d3.scaleLinear().domain([0, 100]).range([0, -80]);
  fixedSvg.append('g')
    .attr('class', 'xAxis')
    .call(d3.axisTop(percentOfUsersReplyScale).tickSizeInner([-h]).ticks(4).tickFormat(d => `${d}%`))
    .selectAll('text')
    .style('text-anchor', 'start')
    .attr('font-size', 14)
    .attr('dx', '0.8em')
    .attr('dy', '0.5em')
    .attr('transform', 'rotate(-90)');
  
  // legend
  fixedSvg.append('circle')
    .attr('cx', 0)
    .attr('cy', h + 50)
    .attr('r', 5)
    .attr('fill', commentTypeColor('推'));
  fixedSvg.append('text')
    .text('推')
    .attr('x', 10)
    .attr('y', h + 50);
  fixedSvg.append('circle')
    .attr('cx', 50)
    .attr('cy', h + 50)
    .attr('r', 5)
    .attr('fill', commentTypeColor('→'));
  fixedSvg.append('text')
    .text('→')
    .attr('x', 60)
    .attr('y', h + 50);
  fixedSvg.append('circle')
    .attr('cx', 100)
    .attr('cy', h + 50)
    .attr('r', 5)
    .attr('fill', commentTypeColor('噓'));
  fixedSvg.append('text')
    .text('噓')
    .attr('x', 110)
    .attr('y', h + 50);
  
  fixedSvg.append('text')
    .text('白色區域: 平日9:00 - 18:00')
    .attr('x', 160)
    .attr('y', h + 50);
  // add repost link
  const pointerScale = d3.scaleLinear().domain([0, userID.length]).range([0, 10]);
  const pointerOffset = d3.scaleLinear().domain([0, userID.length]).range([0, -80]);
  const sortedArticles = data.sort((a, b) => new Date(a.date) - new Date(b.date))
    .filter(art => art.messages.some(mes => userID.includes(mes.push_userid)));
  console.log(sortedArticles);
  const curveOffset = d3.scaleLinear().domain([0, 610]).range([-30, -100]);
  for (let i = 0; i < sortedArticles.length; i += 1) {
    for (let j = i + 1; j < sortedArticles.length; j += 1) {
      if (!sortedArticles[i].article_title || !sortedArticles[j].article_title) break;
      console.log(sortedArticles[i].article_title, sortedArticles[j].article_title.substring(4));
      console.log(sortedArticles[i].article_title === sortedArticles[j].article_title.substring(4));
      if (sortedArticles[i].article_title === sortedArticles[j].article_title.substring(4)) {
        const y1 = timeScale(new Date(sortedArticles[i].date));
        const y2 = timeScale(new Date(sortedArticles[j].date));
        const articleId1 = sortedArticles[i].article_id.replace(/\./gi, '');
        const articleId2 = sortedArticles[j].article_id.replace(/\./gi, '');
        const includesUser1 = [];
        sortedArticles[i].messages.forEach((mes) => {
          if (userID.includes(mes.push_userid)) {
            if (!includesUser1.includes(mes.push_userid)) {
              includesUser1.push(mes.push_userid);
            }
          }
        });
        const includesUser2 = [];
        sortedArticles[j].messages.forEach((mes) => {
          if (userID.includes(mes.push_userid)) {
            if (!includesUser2.includes(mes.push_userid)) {
              includesUser2.push(mes.push_userid);
            }
          }
        });
        const line = d3.line()
          .curve(d3.curveBasis)
          .x(d => d.x)
          .y(d => d.y);
        fixedSvg.append('path')
          .attr('class', `repostLink ${articleId1}`)
          .attr('id', `${articleId1}_${articleId2}`)
          .attr('d', line([
            { x: pointerOffset(includesUser1.length), y: y1 },
            { x: Math.min(pointerOffset(includesUser1.length) - 20, pointerOffset(includesUser2.length) - 20), y: (y1 + y2) / 2 },
            { x: pointerOffset(includesUser2.length), y: y2 },
          ]))
          .attr('stroke', 'gray')
          .attr('stroke-width', '4px')
          .attr('fill', () => {
            console.log('repostlink');
            return 'none';
          })
          .on('mouseover', () => repostLinkMouseOver([sortedArticles[i].article_id, sortedArticles[j].article_id]))
          .on('mouseout', mouseout);
      }
    }
  }

  // add article pointers
  for (let i = 0; i < data.length; i += 1) {
    if (data[i].messages.some(mes => userID.includes(mes.push_userid))) {
      const articleId = data[i].article_id.replace(/\./gi, '');
      const includesUser = [];
      data[i].messages.forEach((mes) => {
        if (userID.includes(mes.push_userid)) {
          if (!includesUser.includes(mes.push_userid)) {
            includesUser.push(mes.push_userid);
          }
        }
      });
      fixedSvg.append('g')
        .attr('class', `pointer articleID_${articleId}`)
        .attr('transform', 'translate(0, 0)')
        .selectAll()
        .data([data[i]])
        .enter()
        .each((d, index, nodes) => {
          d3.select(nodes[index]).append('rect')
            .attr('y', (_d) => {
              const postTime = new Date(_d.date);
              return timeScale(postTime);
            })
            .attr('opacity', (_d) => {
              const postTime = new Date(_d.date);
              return timeScale(postTime) < h ? 1 : 0;
            })
            .attr('x', pointerOffset(includesUser.length))
            .attr('width', -pointerOffset(includesUser.length))
            .attr('height', 2)
            .style('fill', color[0](0.8))
            .on('mouseover', _d => mouseover(_d, data))
            .on('mouseout', mouseout);
          d3.select(nodes[index]).append('circle')
            .attr('cy', (_d) => {
              const postTime = new Date(_d.date);
              return timeScale(postTime) + 1;
            })
            .attr('opacity', (_d) => {
              const postTime = new Date(_d.date);
              return timeScale(postTime) < h ? 1 : 0;
            })
            .attr('cx', pointerOffset(includesUser.length))
            // .attr('r', pointerScale(includesUser.length))
            .attr('r', 5)
            .attr('stroke', 'black')
            .attr('stroke-width', (_d) => {
              if (!_d.article_title) return '0px';
              return _d.article_title[0] !== 'R' ? '2px' : '0px';
            })
            .style('fill', color[0](0.8))
            .on('mouseover', _d => mouseover(_d, data))
            .on('mouseout', mouseout)
            .on('click', click);
        });

      const postYear = new Date(data[i].date).getFullYear();
      const filteredMessages = data[i].messages.filter(e => userID.includes(e.push_userid));
      fixedSvg.append('g')
        .attr('class', `article articleID_${articleId}`)
        .selectAll()
        .data(filteredMessages)
        .enter()
        .append('circle')
        .attr('cy', (d, index) => {
          const date = dateFormat(d);
          const commentTime = new Date(new Date(date).setFullYear(postYear));
          return timeScale(commentTime);
          // const postTime = new Date(data[i].date);
          // return timeScale(postTime);
        })
        .attr('opacity', (d, index) => {
          const date = dateFormat(d);
          const commentTime = new Date(new Date(date).setFullYear(postYear));
          return timeScale(commentTime) < h ? 1 : 0;
          // const postTime = new Date(data[i].date);
          // return timeScale(postTime);
        })
        .attr('cx', d => userScale(d.push_userid) + userScale.bandwidth() / 2)
        .attr('r', 4)
        // .attr('width', userScale.bandwidth())
        .style('fill', d => commentTypeColor(d.push_tag))
        .attr('stroke', 'black')
        .on('mouseover', d => mouseover(data[i], d))
        .on('mouseout', mouseout)
        .on('click', click);
    }
  }

  // fixedSvg.selectAll('path').remove();

  // fixedSvg.append('g')
  //   .attr('transform', () => {
  //     if (i === 0) return 'translate(10, 100)';
  //     return `translate(10, ${userOffset * gridSize + 100})`;
  //   })
  //   .append('text')
  //   .text(userListByReplyCountPerHours[i].id);

  // fixedSvg.append('g')
  //   .attr('class', 'yAxis')
  //   .attr('transform', () => {
  //     if (i === 0) return 'translate(200, 100)';
  //     return `translate(200, ${userOffset * gridSize + 100})`;
  //   })
  //   .call(d3.axisLeft(y).tickSize(0));
  // fixedSvg.append('g')
  //   .attr('class', 'xAxis')
  //   .attr('transform', () => {
  //     if (i === 0) return 'translate(200, 100)';
  //     return `translate(200, ${userOffset * gridSize + 100})`;
  //   })
  //   .call(d3.axisTop(x).tickSize(0));
  // fixedSvg.selectAll('.yAxis')
  //   .selectAll('.tick')
  //   .selectAll('text')
  //   .style('color', (d) => {
  //     const date = new Date(`${new Date(begin).getFullYear()}/${d}`);
  //     if (date.getDay() > 0 && date.getDay() < 6) return 'black';
  //     return 'lightgray';
  //   });
  // fixedSvg.selectAll('.xAxis')
  //   .selectAll('.tick')
  //   .selectAll('text')
  //   .style('color', (d) => {
  //     if (d >= 8 && d <= 18) return 'black';
  //     return 'lightgray';
  //   });
  // }

  function tooltipForArticle(d) {
    const date = new Date(d.date);
    Tooltip
      .style('opacity', 1)
      .html(`<p style="color: white;">Title: ${d.article_title}<br>
        Date: ${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}<br>
        <a href="${d.url}" target="_blank" style="color: cornflowerblue;">Go To Post Page</a></p>`)
      .style('left', `${d3.event.pageX + 25}px`)
      .style('top', `${d3.event.pageY - 130}px`);
  }
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
    // console.log(userList);
    userList.forEach((e) => {
      if (!e.time[0]) e.totalDate = 0;
      else {
        const earliestDate = new Date(`${e.time[0].month}/${e.time[0].date}`);
        const latestDate = new Date(`${e.time[e.time.length - 1].month}/${e.time[e.time.length - 1].date}`);
        const diffTime = Math.abs(latestDate - earliestDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        e.totalDate = diffDays;
      }
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
  function commentTypeColor(tag) {
    switch (tag) {
      case '推':
        return pushTypeColor[4];
      case '噓':
        return pushTypeColor[2];
      case '→':
        return pushTypeColor[5];
      default:
        return 'black';
    }
  }
  function update(date1, date2) {
    timeScale.domain([new Date(date1), new Date(date2)]);
    if (isClicked) {
      const article = data.find(e => e.article_id === isClicked);
      const postYear = new Date(article.date).getFullYear();
      fixedSvg.selectAll('.commentTime')
        .attr('cy', (d) => {
          const date = dateFormat(d);
          const commentTime = new Date(new Date(date).setFullYear(postYear));
          return timeScale(commentTime);
        })
        .attr('opacity', (d) => {
          const date = dateFormat(d);
          const commentTime = new Date(new Date(date).setFullYear(postYear));
          return timeScale(commentTime) < h && timeScale(commentTime) > 0 ? 1 : 0;
        });
    }
    // update offday rect
    fixedSvg.selectAll('.offday')
      .attr('y', d => (timeScale(new Date(d)) > 0 ? timeScale(new Date(d)) : 0))
      .attr('height', (d) => {
        const nextDate = new Date(d);
        const tempDate = new Date(d);
        nextDate.setDate(nextDate.getDate() + 1);
        const tempDatePos = timeScale(tempDate) > 0 ? timeScale(tempDate) : 0;
        const nextDatePos = timeScale(nextDate) < h ? timeScale(nextDate) : h;
        return Math.max(0, nextDatePos - tempDatePos);
      })
      .attr('opacity', d => (timeScale(new Date(d)) < h ? 1 : 0));
    // update beforeWorl rect
    fixedSvg.selectAll('.beforWork')
      .attr('y', d => (timeScale(new Date(d)) > 0 ? timeScale(new Date(d)) : 0))
      .attr('height', (d) => {
        const workHour = new Date(d);
        const tempDate = new Date(d);
        workHour.setHours(workHour.getHours() + 9);
        const tempDatePos = timeScale(tempDate) > 0 ? timeScale(tempDate) : 0;
        const workHourPos = timeScale(workHour) < h ? timeScale(workHour) : h;
        return Math.max(0, workHourPos - tempDatePos);
      })
      .attr('opacity', d => (timeScale(new Date(d)) < h ? 1 : 0));
    // update afterWork rect
    fixedSvg.selectAll('.afterWork')
      .attr('y', d => (timeScale(new Date(d)) > 0 ? timeScale(new Date(d)) : 0))
      .attr('height', (d) => {
        const workHour = new Date(d);
        const tempDate = new Date(d);
        workHour.setHours(workHour.getHours() + 6);
        const tempDatePos = timeScale(tempDate) > 0 ? timeScale(tempDate) : 0;
        const workHourPos = timeScale(workHour) < h ? timeScale(workHour) : h;
        return Math.max(0, workHourPos - tempDatePos);
      })
      .attr('opacity', d => (timeScale(new Date(d)) < h ? 1 : 0));
    // fixedSvg.selectAll('path').remove();
    // const updateYScale = d3.scaleTime().domain([new Date(date1), new Date(date2)]).range([0, h]);
    const updateXScale = d3.scaleBand().domain(userID).range([0, userScaleRange]);
    // const curveOffset = d3.scaleLinear().domain([0, 610]).range([-30, -100]);
    const filteredSortedArticles = sortedArticles.filter((e) => {
      return new Date(date1) < new Date(e.date) && new Date(date2) > new Date(e.date);
    });
    // update reposting link
    fixedSvg.selectAll('path.repostLink').attr('visibility', 'hidden');
    for (let i = 0; i < filteredSortedArticles.length; i += 1) {
      for (let j = i + 1; j < filteredSortedArticles.length; j += 1) {
        if (filteredSortedArticles[i].article_title === filteredSortedArticles[j].article_title.substring(4)) {
          const y1 = timeScale(new Date(filteredSortedArticles[i].date));
          const y2 = timeScale(new Date(filteredSortedArticles[j].date));
          const articleId1 = filteredSortedArticles[i].article_id.replace(/\./gi, '');
          const articleId2 = filteredSortedArticles[j].article_id.replace(/\./gi, '');
          const includesUser1 = [];
          filteredSortedArticles[i].messages.forEach((mes) => {
            if (userID.includes(mes.push_userid)) {
              if (!includesUser1.includes(mes.push_userid)) {
                includesUser1.push(mes.push_userid);
              }
            }
          });
          const includesUser2 = [];
          filteredSortedArticles[j].messages.forEach((mes) => {
            if (userID.includes(mes.push_userid)) {
              if (!includesUser2.includes(mes.push_userid)) {
                includesUser2.push(mes.push_userid);
              }
            }
          });
          const line = d3.line()
            .curve(d3.curveBasis)
            .x(d => d.x)
            .y(d => d.y);
          fixedSvg.select(`path#${articleId1}_${articleId2}`)
            .attr('visibility', 'visible')
            .attr('d', line([
              { x: pointerOffset(includesUser1.length), y: y1 },
              { x: Math.min(pointerOffset(includesUser1.length) - 20, pointerOffset(includesUser2.length) - 20) - 20, y: (y1 + y2) / 2 },
              { x: pointerOffset(includesUser2.length), y: y2 },
            ]));
        }
      }
    }
    if (original_date1 < new Date(date1) || original_date2 > new Date(date2)) {
      filteredArticles.forEach((art) => {
        const article_id = art.article_id.replace(/\./gi, '');
        fixedSvg.selectAll(`.articleID_${article_id}`)
          .each((d, index, nodes) => {
            if (d3.select(nodes[index]).attr('class')[0] === 'p') {
              // article pointers
              if (new Date(art.date) > new Date(date1) && new Date(art.date) < new Date(date2)) {
                d3.select(nodes[index])
                  .attr('visibility', 'visible')
                  .selectAll('rect')
                  .attr('y', _d => timeScale(new Date(_d.date)))
                  .attr('opacity', _d => (timeScale(new Date(_d.date)) < h && timeScale(new Date(_d.date)) > 0 ? 1 : 0));
                d3.select(nodes[index])
                  .selectAll('circle')
                  .attr('cy', _d => timeScale(new Date(_d.date)) + 1)
                  .attr('opacity', _d => (timeScale(new Date(_d.date)) < h && timeScale(new Date(_d.date)) > 0 ? 1 : 0));
              } else {
                d3.select(nodes[index])
                  .attr('visibility', 'hidden');
              }
            } else {
              // user activities
              const postYear = new Date(art.date).getFullYear();
              const beginDateMinusTwo = new Date(date1);
              beginDateMinusTwo.setDate(beginDateMinusTwo.getDate() - 2);
              if (new Date(art.date) > beginDateMinusTwo && new Date(art.date) < new Date(date2)) {
                d3.select(nodes[index])
                  .attr('visibility', 'visible')
                  .selectAll('circle')
                  .attr('cy', (e, i) => {
                    const date = dateFormat(e);
                    const commentTime = new Date(new Date(date).setFullYear(postYear));
                    return timeScale(commentTime);
                    // const postDate = new Date(art.date);
                    // return timeScale(postDate);
                  })
                  .attr('opacity', (e, i) => {
                    const date = dateFormat(e);
                    const commentTime = new Date(new Date(date).setFullYear(postYear));
                    return timeScale(commentTime) < h && timeScale(commentTime) > 0 ? 1 : 0;
                    // const postDate = new Date(art.date);
                    // return timeScale(postDate) < h && timeScale(postDate) > 0 ? 1 : 0;
                  });
              } else {
                d3.select(nodes[index])
                  .attr('visibility', 'hidden');
              }
            }
          });
      });
    } else {
      // article pointers
      fixedSvg.selectAll('.pointer')
        .each((d, index, nodes) => {
          const article_id = d3.select(nodes[index]).attr('class').slice(18);
          const article = data.find(e => e.article_id.replace(/\./gi, '') === article_id);
          if (new Date(article.date) > new Date(date1) && new Date(article.date) < new Date(date2)) {
            d3.select(nodes[index])
              .attr('visibility', 'visible')
              .selectAll('rect')
              .attr('y', _d => timeScale(new Date(_d.date)))
              .attr('opacity', _d => (timeScale(new Date(_d.date)) < h && timeScale(new Date(_d.date)) > 0 ? 1 : 0));
            d3.select(nodes[index])
              .selectAll('circle')
              .attr('cy', _d => timeScale(new Date(_d.date)) + 1)
              .attr('opacity', _d => (timeScale(new Date(_d.date)) < h && timeScale(new Date(_d.date)) > 0 ? 1 : 0));
          } else {
            d3.select(nodes[index])
              .attr('visibility', 'hidden');
          }
        });
      // user activities
      fixedSvg.selectAll('.article')
        .each((d, index, nodes) => {
          const article_id = d3.select(nodes[index]).attr('class').slice(18);
          const article = data.find(e => e.article_id.replace(/\./gi, '') === article_id);
          const postYear = new Date(article.date).getFullYear();
          const beginDateMinusTwo = new Date(date1);
          beginDateMinusTwo.setDate(beginDateMinusTwo.getDate() - 2);
          if (new Date(article.date) > beginDateMinusTwo && new Date(article.date) < new Date(date2)) {
            d3.select(nodes[index])
              .attr('visibility', 'visible')
              .selectAll('circle')
              .attr('cy', (_d, _index) => {
                const date = dateFormat(_d);
                const commentTime = new Date(new Date(date).setFullYear(postYear));
                return timeScale(commentTime);
                // const postDate = new Date(article.date);
                // return timeScale(postDate);
              })
              .attr('opacity', (_d, _index) => {
                const date = dateFormat(_d);
                const commentTime = new Date(new Date(date).setFullYear(postYear));
                return timeScale(commentTime) < h && timeScale(commentTime) > 0 ? 1 : 0;
                // const postDate = new Date(article.date);
                // return timeScale(postDate) < h && timeScale(postDate) > 0 ? 1 : 0;
              });
          } else {
            d3.select(nodes[index])
              .attr('visibility', 'hidden');
          }
        });
    }

    filteredArticles = data.filter((e) => {
      const beginDateMinusTwo = new Date(date1);
      beginDateMinusTwo.setDate(beginDateMinusTwo.getDate() - 2);
      return new Date(beginDateMinusTwo) < new Date(e.date) && new Date(date2) > new Date(e.date);
    });

    // fixedSvg.select('.xAxis')
    //   .call(d3.axisTop(updateXScale).tickSizeInner([-h]))
    //   .attr('stroke-width', '0.5px');
    const aDay = 60 * 60 * 24 * 1000;
    if ((date2 - date1) / aDay <= 1) {
      fixedSvg.select('.yAxis')
        .call(d3.axisLeft(timeScale).tickFormat(d3.timeFormat('%H:%M')).tickSizeInner([40]));
    } else if ((date2 - date1) / aDay < 5) {
      fixedSvg.select('.yAxis')
        .call(d3.axisLeft(timeScale).ticks(d3.timeDay.every(1)).tickFormat(d3.timeFormat('%m/%d %H:%M')).tickSizeInner([40]));
    } else if ((date2 - date1) / aDay < 15) {
      fixedSvg.select('.yAxis')
        .call(d3.axisLeft(timeScale).ticks(d3.timeDay.every(3)).tickFormat(d3.timeFormat('%m/%d')).tickSizeInner([40]));
    } else if ((date2 - date1) / aDay < 30) {
      fixedSvg.select('.yAxis')
        .call(d3.axisLeft(timeScale).ticks(d3.timeDay.every(5)).tickFormat(d3.timeFormat('%m/%d')).tickSizeInner([40]));
    } else if ((date2 - date1) / aDay < 60) {
      fixedSvg.select('.yAxis')
        .call(d3.axisLeft(timeScale).ticks(d3.timeDay.every(10)).tickFormat(d3.timeFormat('%m/%d')).tickSizeInner([40]));
    } else {
      fixedSvg.select('.yAxis')
        .call(d3.axisLeft(timeScale).ticks(d3.timeDay.every(1)).tickFormat(d3.timeFormat('%m/%d')).tickSizeInner([40]));
    }
    // fixedSvg.selectAll('path').remove();
  }
}

export { userDailyActivity };
