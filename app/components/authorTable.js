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


export default function AuthorTable(nodes, div, callback) {
  div.selectAll('*').remove();
  const authorList = JSON.parse(JSON.stringify(nodes));
  let authorIndex = 0;
  // compute author's influence
  authorList.children.forEach((author) => {
    let influence = 0;
    author.responder.forEach((article) => {
      influence += article.message.length;
    });
    author.influence = influence;
  });
  authorList.children = authorList.children.filter(author => author.influence >= 100);
  authorList.children.sort((a, b) => ((a.influence < b.influence) ? 1 : -1));
  const topicWithSelectedAuthor = JSON.parse(JSON.stringify(authorList));
  topicWithSelectedAuthor.children = [];
  // console.log(authorList.children);
  // console.log(div);
  const authorTable = div.append('table');
  // console.log(authorTable);
  const th = authorTable.append('tr');
  th.append('th').attr('class', 'tableHeader id')
    .attr('width', '25%')
    .text('UserID');
  th.append('th').attr('class', 'tableHeader articleCount')
    .attr('width', '25%')
    .text('ArticleCount');
  th.append('th').attr('class', 'tableHeader messageCount')
    .attr('width', '25%')
    .text('Total Comments');
  th.append('th').attr('class', 'tableHeader articles')
    .attr('width', '25%')
    .text('Articles');
  th.append('th').attr('class', 'tableHeader comments')
    .attr('width', '25%')
    .text('comments');

  authorTable.selectAll('.tableHeader')
    .style('background', d3.schemeTableau10[0])
    .style('color', 'white');

  // Create a table with rows and bind a data row to each table row
  const tr = authorTable.selectAll('tr.data')
    .data(authorList.children)
    .enter()
    .append('tr')
    .attr('class', 'datarow')
    .on('click', clicked);

  tr.append('td')
    .text(d => d.id);

  tr.append('td')
    .text(d => d.responder.length);

  tr.append('td')
    .text((d) => {
      const totalComment = d.responder.reduce((total, n) => total + n.message.length, 0);
      return totalComment;
    });
  d3.selectAll('.datarow').filter(':nth-child(even)')
    .style('background', 'whitesmoke');
  // .style('border', d => (d.tag === 1 ? '2px black solid' : 'none'))

  function clicked(d) {
    console.log('table clicked');
    // console.log(d);
    topicWithSelectedAuthor.children.push(d);
    callback(topicWithSelectedAuthor, d.id);
    authorIndex += 1;
  }
}

export { AuthorTable };
