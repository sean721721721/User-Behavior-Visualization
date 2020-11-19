/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
/* eslint-disable linebreak-style */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
import React, { Component, PureComponent } from 'react';
// import PropTypes from 'prop-types';
// import { connect } from 'react-redux';
// import { push } from 'react-router-redux';
import * as d3 from 'd3';
// import * as sententree from 'sententree';
// import { max } from 'moment';
// import { Row, Form } from 'antd';
// eslint-disable-next-line import/no-unresolved
import netClustering from 'netclustering';
import * as jsnx from 'jsnetworkx';
import Chart from 'react-google-charts';
import { commentTimeline } from './commentTimeline';
import fetch from '../../reducers/fetch';
// import jieba from 'nodejieba';

export default function treemap(cellNodes, beforeThisDate,
  svg, forceSimulation, totalInfluence, $this, optionsWord, submit) {
  const margin = {
    top: 10, right: 10, bottom: 10, left: 10,
  };

  const w = parseFloat(d3.select('.treemap').style('width'));
  const h = parseFloat(d3.select('.treemap').style('height'));
  const width = w - margin.left - margin.right;
  const height = h - margin.top - margin.bottom;
  const mostUserNum = 1000;
  // append the svg object to the body of the page
  svg.selectAll('*').remove();
  d3.select('.treemap').selectAll('div').remove();
  const articleTreemap = svg.append('g')
    .attr('transform',
      `translate(${margin.left},${margin.top})`);
  const selectedArticleNodes = [];
  // console.log(cellNodes);
  const data = { children: [] };
  const authorNodes = cellNodes.filter(e => e.responder);
  authorNodes.sort((a, b) => b.pageRank - a.pagrRank);
  const articleNodes = [];
  authorNodes.forEach((u) => {
    u.responder.forEach((a) => {
      if (!articleNodes.some(_a => _a.article_id === a.articleId)) {
        articleNodes.push({
          article_id: a.articleId, ...a,
        });
      }
    });
  });
  const top20Authors = authorNodes.filter((d, index) => index < 20);
  top20Authors.forEach((n) => {
    const articles = [];
    let totalComments = 0;
    n.responder.forEach((a) => {
      totalComments += a.message.length;
    });
    n.responder.forEach((a) => {
      articles.push({
        name: a.title,
        id: a.articleId,
        group: 'A',
        value: (a.message.length * n.pageRank) / totalComments,
        message_count: a.message_count,
        colname: 'level3',
        messages: a.message.slice(0, mostUserNum),
        tag: 0,
      });
    });
    data.children.push({ name: n.id, children: articles });
  });

  // Give the data to this cluster layout:
  const root = d3.hierarchy(data).sum(d => d.value); // Here the size of each leave is given in the 'value' field in input data
  // Then d3.treemap computes the position of each element of the hierarchy
  // console.log(width, height);
  d3.treemap()
    .size([w, h])
    // .paddingTop(15)
    // .paddingRight(10)
    .paddingInner(0)(root);

  // prepare a color scale
  const color = d3.scaleOrdinal()
    .domain(['boss1', 'boss2', 'boss3'])
    .range(d3.schemeTableau10);

    // And a opacity scale
  const opacity = d3.scaleLinear()
    .domain([0, 1])
    .range([0.5, 1]);

    // use this information to add rectangles:
  d3.select('.treemap')
    .datum(root)
    .selectAll()
    .data(root.leaves())
    .enter()
    .append('div')
    .attr('class', 'node')
    .style('position', 'absolute')
    .style('overflow', 'hidden')
    .style('left', d => `${d.x0}px`)
    .style('top', d => `${d.y0}px`)
    .style('width', d => `${Math.max(0, d.x1 - d.x0 - 1)}px`)
    .style('height', d => `${Math.max(0, d.y1 - d.y0 - 1)}px`)
    .style('background', d => color(d.parent.data.name))
    .style('border', '1px solid black')
    .on('click', (d, index, nodes) => articleNodeClicked(d, d.data.id, index, nodes))
    .append('title')
    .text((d) => {
      const title = d.data.name.replace('mister_', '');
      return title;
    });
    // .text(d => d.data.name);
  // articleTreemap
  //   .selectAll('rect')
  //   .data(root.leaves())
  //   .enter()
    // .append('rect')
    // .attr('x', d => d.x0)
    // .attr('y', d => d.y0)
    // // .attr('rx', d => Math.min(d.x1 - d.x0, d.y1 - d.y0) / 20)
    // // .attr('ry', d => Math.min(d.x1 - d.x0, d.y1 - d.y0) / 20)
    // .attr('width', d => d.x1 - d.x0)
    // .attr('height', d => d.y1 - d.y0)
    // .style('stroke', 'black')
    // .style('fill', d => color(d.parent.data.name))
    // .style('opacity', d => opacity(d.data.value))
    // .on('click', (d, index, nodes) => articleNodeClicked(d, d.data.id, index, nodes))
    // .append('title')
    // .text((d) => {
    //   const title = d.data.name.replace('mister_', '');
    //   return title;
    // });

  // and to add the text labels
  articleTreemap
    .selectAll('text')
    .data(root.leaves())
    .enter()
    // .append('text')
    // .attr('x', d => d.x0 + 5) // +10 to adjust position (more right)
    // .attr('y', d => d.y0 + 15) // +20 to adjust position (lower)
    // .text((d) => {
    //   const length = d.x1 - d.x0;
    //   const title = d.data.name.replace('mister_', '');
    //   if (title.length > 10) {
    //     const shortTitle = title.slice(0, 10 + ((length - 150) / 20));
    //     return shortTitle;
    //   }
    //   return title;
    //   // const name = d.data.name.split(' ')[0];
    //   // return name;
    // })
    // .attr('font-size', '11px')
    // .attr('fill', 'white')
    .append('title')
    .text((d) => {
      const title = d.data.name.replace('mister_', '');
      return title;
    });

  // and to add the text labels
  articleTreemap
    .selectAll('vals')
    .data(root.leaves())
    .enter()
    .append('text')
    .attr('x', d => d.x0 + 5) // +10 to adjust position (more right)
    .attr('y', d => d.y0 + 35) // +20 to adjust position (lower)
    .text((d) => {
      // const { message_count } = d.data;
      // return `Total Comment: ${message_count[0].count + message_count[1].count + message_count[2].count}<br>
      //   push: ${message_count[0].count}, boo: ${message_count[1].count}, neutral: ${message_count[2].count}`;
    })
    .attr('font-size', '8px')
    .attr('fill', 'white');

  // Add title for the 3 groups
  d3.select('.treemap')
    .selectAll()
    .data(root.descendants().filter(d => d.depth === 1))
    .enter()
    .append('div')
    .style('position', 'absolute')
    .style('overflow', 'hidden')
    .style('text-align', 'center')
    .style('left', d => `${Math.max(0, (d.x1 + d.x0) / 2 - Math.max(0, d.x1 - d.x0 - 11) / 2)}px`)
    .style('top', d => `${Math.max(0, d.y1 + d.y0) / 2 - 9}px`)
    .style('width', d => `${Math.max(0, d.x1 - d.x0 - 11)}px`)
    .style('height', (d) => {
      return (d.y1 - d.y0) > 20 ? '20px' : '0px';
    })
    .text((d) => {
      const name = d.data.name.split(' ')[0];
      return name;
    })
    .attr('font-size', '12px')
    .attr('fill', d => color(d.data.name));
  // articleTreemap
  //   .selectAll('titles')
  //   .data(root.descendants().filter(d => d.depth === 1))
  //   .enter()
  //   .append('text')
  //   .attr('x', d => d.x0)
  //   .attr('y', d => d.y0 + 11)
  //   .text((d) => {
  //     const name = d.data.name.split(' ')[0];
  //     return name;
  //   })
  //   .attr('font-size', '12px')
  //   .attr('fill', d => color(d.data.name));
  let selectedUser = [];

  function articleNodeClicked(d, article_id, index, nodes) {
    const commentTimelineSvg = d3.select('#articleStatus');
    // console.log(articleNodes);
    const article = articleNodes.find(e => e.article_id === article_id);
    commentTimeline(article, commentTimelineSvg, data.$this);
    const clickType = d3.select('input[name="set"]:checked').property('value');
    // submit(d);
    // const adj = cellLinks.filter(e => e.target.index === d.index);
    // const index = selectedArticleNodes.findIndex(e => e === d.title);
    // if (index !== -1) selectedArticleNodes.splice(index, 1);
    // else if (!d.containUsers) selectedArticleNodes.push(d.title);
    // // article nodes
    // adj.forEach((n) => {
    //   const data = d3.selectAll(`circle.nodes.circle_${n.source.index}`).data();
    //   data.forEach((e) => {
    //     e.tag += index === -1 ? 1 : -1;
    //   });
    //   d3.selectAll('circle.nodes')
    //     .style('stroke', e => (e.tag === selectedArticleNodes.length ? 'red' : 'black'))
    //     .style('stroke-width', e => (e.tag === selectedArticleNodes.length ? 2 : 1))
    //     .style('stroke-opacity', 0.6);
    // });

    // // push userid to selectedUser (intersection)
    // if (d.data.tag === 0) {
    //   if (selectedUser.length === 0) {
    //     console.log('push');
    //     console.log(d.data.messages);
    //     d.data.messages.forEach((e) => {
    //       if (!selectedUser.some(id => id === e.push_userid)) {
    //         selectedUser.push(e.push_userid);
    //       }
    //     });
    //   } else {
    //     selectedUser = selectedUser.filter(e => d.data.messages.some(m => e === m.push_userid));
    //   }
    // }

    // // push userid to selectedUser (union)
    if (d.data.tag === 0) {
      d3.select(nodes[index])
        .style('background', 'black');
      d.data.tag = 1;
      // console.log('push');
      selectedArticleNodes.push(article_id);
      if (clickType === 'union') {
        d.data.messages.forEach((e) => {
          if (!selectedUser.some(u => u.id === e.push_userid)) {
            selectedUser.push({ id: e.push_userid, group: selectedArticleNodes.length });
          }
        });
      } else if (clickType === 'intersection' && selectedUser.length > 0) {
        // intersection
        console.log('intersection');
        selectedUser = selectedUser.filter(e => d.data.messages.some(e1 => e1.push_userid === e.id));
      } else {
        d.data.messages.forEach((e) => {
          if (!selectedUser.some(u => u.id === e.push_userid)) {
            selectedUser.push({ id: e.push_userid, group: selectedArticleNodes.length });
          }
        });
      }
    } else {
      d3.select(nodes[index])
        .style('background', color(d.parent.data.name));
      d.data.tag = 0;
      selectedUser = selectedUser.filter(e => !d.data.messages.some(mes => mes.push_userid === e.id));
    }
    // console.log(cellNodes);
    drawSelectedUserTable(selectedUser);
  }

  function drawSelectedUserTable(nodes) {
    const userArr = nodes;
    const selectedUserDiv = d3.selectAll('.selectedUserTable');
    selectedUserDiv.selectAll('*').remove();

    const buttonDiv = selectedUserDiv.append('div')
      .attr('class', 'p-2 d-flex justify-content-center')
      .attr('id', 'submitDiv');
    buttonDiv.append('button')
      .style('type', 'button')
      .style('font-size', 'smaller')
      .attr('class', 'btn btn-primary')
      .attr('id', 'submitUsers')
      .text('Get Activity!')
      .on('click', (d) => {
        const test = [];
        d3.selectAll('.userDataRow')
          .each((_d, _index, _nodes) => {
            test.push(d3.select(_nodes[_index]).selectAll('td').data()[0]);
          });
        selectedUserClick(test);
      });

    let network_h = parseFloat(d3.select('.selectedUserTable.d-flex.flex-column').style('height'));
    network_h -= parseFloat(d3.select('#submitDiv').style('height'));
    const tableDiv = selectedUserDiv.append('div')
      .style('border', 'gray 1px solid')
      .style('border-right', '0px')
      .style('border-bottom', '0px')
      .style('border-radius', '5px')
      .style('max-height', `${parseInt(network_h, 10)}px`)
      .style('overflow-y', 'scroll');
    const table = tableDiv.append('table');
    table.append('tr').append('td')
      .text(`ID (${userArr.length})`)
      .style('background', d3.schemeTableau10[0])
      .style('color', 'white');
    const tr = table.selectAll('tr.user')
      .data(userArr)
      .enter()
      .append('tr')
      .attr('class', 'userDataRow')
      .style('padding', '0px')
      .append('td')
      .text(d => d.id)
      .on('click', (d) => {
        clickUserTable(d, userArr);
      });

    d3.selectAll('.userDataRow').filter(':nth-child(even)')
      .style('background', 'whitesmoke');
  }

  function clickUserTable(d, arr) {
    const index = arr.findIndex(e => e.id === d.id);
    arr.splice(index, 1);
    drawSelectedUserTable(arr);
  }

  function selectedUserClick(d) {
    // console.log(d);
    submit(d);
  }
}

export { treemap };
