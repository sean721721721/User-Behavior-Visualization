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
import fetch from '../../reducers/fetch';
// import jieba from 'nodejieba';

export default function treemap(cellNodes, beforeThisDate,
  svg, forceSimulation, totalInfluence, $this, optionsWord, submit) {
  const margin = {
    top: 10, right: 10, bottom: 10, left: 10,
  };

  const w = parseFloat(d3.select('.termMap').style('width'));
  const h = parseFloat(d3.select('.termMap').style('height'));
  const width = w - margin.left - margin.right;
  const height = h - margin.top - margin.bottom;
  const mostUserNum = 1000;
  // append the svg object to the body of the page
  svg.selectAll('*').remove();
  const articleTreemap = svg.append('g')
    .attr('transform',
      `translate(${margin.left},${margin.top})`);
  const selectedArticleNodes = [];

  console.log(cellNodes);
  const data = { children: [] };
  const authorNodes = cellNodes.filter(e => e.responder);
  authorNodes.sort((a, b) => b.pageRank - a.pagrRank);
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

  // const newAuthorNodes = cellNodes.map((e) => {
  //   return {
  //     name: e.id,
  //     value: e.pageRank,
  //   };
  // });
  // console.log(newAuthorNodes);
  // const data = { children: [{name: 'Authors', children: newAuthorNodes }] };

  // console.log(data);
  // read json data
  // const data = {
  //   children: [{
  //     name: 'boss1',
  //     children: [{
  //       name: 'mister_a', group: 'A', value: 28, colname: 'level3',
  //     }, {
  //       name: 'mister_b', group: 'A', value: 19, colname: 'level3',
  //     }, {
  //       name: 'mister_c', group: 'C', value: 18, colname: 'level3',
  //     }, {
  //       name: 'mister_d', group: 'C', value: 19, colname: 'level3',
  //     }],
  //     colname: 'level2',
  //   }, {
  //     name: 'boss2',
  //     children: [{
  //       name: 'mister_e', group: 'C', value: 14, colname: 'level3',
  //     }, {
  //       name: 'mister_f', group: 'A', value: 11, colname: 'level3',
  //     }, {
  //       name: 'mister_g', group: 'B', value: 15, colname: 'level3',
  //     }, {
  //       name: 'mister_h', group: 'B', value: 16, colname: 'level3',
  //     }],
  //     colname: 'level2',
  //   }, {
  //     name: 'boss3',
  //     children: [{
  //       name: 'mister_i', group: 'B', value: 10, colname: 'level3',
  //     }, {
  //       name: 'mister_j', group: 'A', value: 13, colname: 'level3',
  //     }, {
  //       name: 'mister_k', group: 'A', value: 13, colname: 'level3',
  //     }, {
  //       name: 'mister_l', group: 'D', value: 25, colname: 'level3',
  //     }, {
  //       name: 'mister_m', group: 'D', value: 16, colname: 'level3',
  //     }, {
  //       name: 'mister_n', group: 'D', value: 28, colname: 'level3',
  //     }],
  //     colname: 'level2',
  //   }],
  //   name: 'CEO',
  // };
  // Give the data to this cluster layout:
  const root = d3.hierarchy(data).sum(d => d.value); // Here the size of each leave is given in the 'value' field in input data
  // Then d3.treemap computes the position of each element of the hierarchy
  console.log(width, height);
  d3.treemap()
    .size([width, height])
    .paddingTop(15)
    .paddingRight(10)
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
  articleTreemap
    .selectAll('rect')
    .data(root.leaves())
    .enter()
    .append('rect')
    .attr('x', d => d.x0)
    .attr('y', d => d.y0)
    .attr('rx', d => Math.min(d.x1 - d.x0, d.y1 - d.y0) / 20)
    .attr('ry', d => Math.min(d.x1 - d.x0, d.y1 - d.y0) / 20)
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => d.y1 - d.y0)
    .style('stroke', 'black')
    .style('fill', d => color(d.parent.data.name))
    .style('opacity', d => opacity(d.data.value))
    .on('click', articleNodeClicked)
    .append('title')
    .text((d) => {
      const title = d.data.name.replace('mister_', '');
      return title;
    });

  // and to add the text labels
  articleTreemap
    .selectAll('text')
    .data(root.leaves())
    .enter()
    .append('text')
    .attr('x', d => d.x0 + 5) // +10 to adjust position (more right)
    .attr('y', d => d.y0 + 15) // +20 to adjust position (lower)
    .text((d) => {
      const length = d.x1 - d.x0;
      const title = d.data.name.replace('mister_', '');
      if (title.length > 10) {
        const shortTitle = title.slice(0, 10 + ((length - 150) / 20));
        return shortTitle;
      }
      return title;
      // const name = d.data.name.split(' ')[0];
      // return name;
    })
    .attr('font-size', '11px')
    .attr('fill', 'white')
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
  articleTreemap
    .selectAll('titles')
    .data(root.descendants().filter(d => d.depth === 1))
    .enter()
    .append('text')
    .attr('x', d => d.x0)
    .attr('y', d => d.y0 + 11)
    .text((d) => {
      const name = d.data.name.split(' ')[0];
      return name;
    })
    .attr('font-size', '12px')
    .attr('fill', d => color(d.data.name));
  let selectedUser = [];
  function articleNodeClicked(d, index, nodes) {
    d3.select(nodes[index])
      .style('fill', 'black');
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

    // // push userid to selectedUser
    // const data = svg.selectAll('circle.nodes').data();
    if (d.data.tag === 0) {
      if (selectedUser.length === 0) {
        console.log('push');
        console.log(d.data.messages);
        d.data.messages.forEach((e) => {
          if (!selectedUser.some(id => id === e.push_userid)) {
            selectedUser.push(e.push_userid);
          }
        });
      } else {
        selectedUser = selectedUser.filter(e => d.data.messages.some(m => e === m.push_userid));
        // const test = selectedUser.filter(e => d.data.messages.some(m => e === m.push_userid));
        // console.log(selectedUser, test);
      }
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
            test.push(d3.select(_nodes[_index]).select('td').text());
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
      .text('ID')
      .style('background', d3.schemeTableau10[0])
      .style('color', 'white');
    const tr = table.selectAll('tr.user')
      .data(userArr)
      .enter()
      .append('tr')
      .attr('class', 'userDataRow')
      .style('padding', '0px')
      .append('td')
      .text(d => d)
      .on('click', (d) => {
        clickUserTable(d, userArr);
      });

    d3.selectAll('.userDataRow').filter(':nth-child(even)')
      .style('background', 'whitesmoke');
  }

  function clickUserTable(d, arr) {
    const index = arr.findIndex(e => e === d);
    arr.splice(index, 1);
    drawSelectedUserTable(arr);
  }

  function selectedUserClick(d) {
    // console.log(d);
    submit(d);
  }
}

export { treemap };
