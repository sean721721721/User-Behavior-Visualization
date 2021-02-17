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
import _ from 'lodash';
// import * as sententree from 'sententree';
// import { max } from 'moment';
// import { Row, Form } from 'antd';
import * as jsnx from 'jsnetworkx';
import { loading } from '../loading';
// import OpinionLeaderView from '../OpinionLeaderView';

export default function AuthorTable(nodes, div, $this, callback) {
  console.log(nodes);
  div.selectAll('*').remove();
  // console.log(parseFloat(d3.select('.network').style('height')));
  // console.log(parseFloat(d3.select('.termMap').style('height')));
  const h = parseFloat(d3.select('.authorList').style('height'));
  const authorList = JSON.parse(JSON.stringify(nodes));
  const deltaLengthList = [];
  const threshold = 0;
  const noCuttedAuthorIdList = JSON.parse(JSON.stringify(nodes));
  authorIdPreprocessing(authorList);
  const clickType = d3.select('input[name="pageRank"]').property('checked');
  if (clickType) leaderPageRank(authorList);
  console.log(authorList);
  // computeSentimentMatrix(authorList);
  const articleCellSvg = d3.select('#graph');
  let authorIndex = 0;
  // compute author's influence
  authorList.forEach((author) => {
    let influence = 0;
    author.responder.forEach((article) => {
      // influence += article.message.length;
      influence += article.message_count.push;
      influence -= article.message_count.boo;
      influence += article.message_count.neutral / 2;
    });
    author.influence = influence;
    author.pageRank = author.pageRank || influence;
  });
  // authorList.children = authorList.children.filter(author => author.influence >= 100);
  authorList.sort((a, b) => d3.descending(a.pageRank, b.pageRank));
  let topicWithSelectedAuthor = JSON.parse(JSON.stringify(noCuttedAuthorIdList));
  topicWithSelectedAuthor = [];
  callback(authorList, 'test');
  // console.log(authorList.children);
  // console.log(div);
  div = div.append('div')
    .style('max-height', `${h}px`);
  const authorTable = div.append('table');
  // console.log(authorTable);
  const th = authorTable.append('tr');
  th.append('th').attr('class', 'tableHeader id')
    .attr('width', '30%')
    .text('AuthorID');
  th.append('th').attr('class', 'tableHeader deltaLength')
    .attr('width', '20%')
    .text('LPR');
  th.append('th').attr('class', 'tableHeader articleCount')
    .attr('width', '25%')
    .text('# Of Articles');
  th.append('th').attr('class', 'tableHeader messageCount')
    .attr('width', '25%')
    .text('Total Comments');

  authorTable.selectAll('.tableHeader')
    .style('background', d3.schemeTableau10[0])
    .style('color', 'white');

  // Create a table with rows and bind a data row to each table row
  const tr = authorTable.selectAll('tr.data')
    .data(authorList)
    .enter()
    .append('tr')
    .attr('class', 'datarow')
    .on('click', clicked);

  tr.append('td').text(d => d.id);
  tr.append('td').text(d => `${financial(d.pageRank)}`);
  tr.append('td').text(d => d.responder.length);
  tr.append('td')
    .text((d) => {
      const totalComment = d.responder.reduce((total, n) => total + n.messages.length, 0);
      return totalComment;
    });
  d3.selectAll('.datarow').filter(':nth-child(even)')
    .style('background', 'whitesmoke');

  function clicked(d) {
    console.log('table clicked');
    const pushAuthor = JSON.parse(JSON.stringify(d));
    pushAuthor.id = pushAuthor.oldId;
    if (!topicWithSelectedAuthor.some(e => e.id === pushAuthor.id)) {
      topicWithSelectedAuthor.push(pushAuthor);
      console.log(topicWithSelectedAuthor, pushAuthor);
      callback(topicWithSelectedAuthor, pushAuthor.id);
      authorIndex += 1;
    } else {
      const index = topicWithSelectedAuthor.findIndex(e => e.id === pushAuthor.id);
      if (topicWithSelectedAuthor.length > 1) {
        topicWithSelectedAuthor.splice(index, 1);
        console.log(topicWithSelectedAuthor, pushAuthor);
        callback(topicWithSelectedAuthor, topicWithSelectedAuthor[0].id);
      }
    }
  }

  function financial(x) {
    return Number.parseFloat(x).toFixed(2);
  }

  function authorIdPreprocessing(node_data) {
    node_data.forEach((n) => {
      if (n.id) {
        const new_id = n.id.split(' ');
        n.oldId = n.id;
        [n.id] = new_id;
      }
    });
  }

  function leaderPageRank(selectedNode) {
    const node = [];
    const link = [];
    const alpha = 0.85;
    const start = new Date();
    computeSentimentMatrix(selectedNode, node, link);
    computeTotalWeightOfEachNode(node, link);
    pageRank(node, link, alpha);
    // console.log(node, link);
    const minPageRank = findMinimumPagerank(node);
    selectedNode.children.forEach((e) => {
      const authorNode = node.find(e1 => e1.id === e.id);
      // console.log(authorNode);
      e.pageRank = authorNode
        ? authorNode.pageRank + Math.abs(minPageRank) + 1 : Math.abs(minPageRank) + 1;
    });
    // console.log(node);
    console.log(selectedNode.children);
    console.log(start - new Date());

    function computeSentimentMatrix(termNode, n, l) {
      termNode.children.forEach((e) => {
        const commentNumOfArticlesArr = e.responder.map(a => a.message_count[0].count);
        if (Math.max(...commentNumOfArticlesArr) >= threshold) {
          e.responder.forEach((e1) => {
            n.push({
              id: e.id,
              pageRank: 0.25,
              post: [{ article: e1.articleId }],
              reply: [],
              weight: 0,
            });
            let count = 1;
            if (e1.message_count[0].count >= threshold) {
              e1.message.every((e2) => {
                const existedNode = n.find(a => a.id === e2.push_userid);
                if (!existedNode) {
                  n.push({
                    id: e2.push_userid,
                    pageRank: 0.25,
                    reply: [{ author: e.id, article: e1.articleId, tag: e2.push_tag }],
                    weight: 0,
                  });
                } else {
                  // console.log(existedNode);
                  existedNode.reply.push({
                    author: e.id,
                    article: e1.articleId,
                    tag: e2.push_tag,
                  });
                }
                const existedLink = l.find(a => a.source === e2.push_userid && a.target === e.id);
                if (!existedLink) {
                  l.push({
                    source: e2.push_userid,
                    target: e.id,
                    value: pushTagWeight(e2.push_tag),
                    num: 1,
                  });
                } else {
                  existedLink.value += pushTagWeight(e2.push_tag);
                  existedLink.num += 1;
                }
                count += 1;
                return count > 0;
              });
            }
          });
        }
      });
      function pushTagWeight(tag) {
        switch (tag) {
          case '推':
            return 1;
          case '噓':
            return -2;
          default:
            return 0.5;
        }
      }
    }
    function computeTotalWeightOfEachNode(node_data, link_data) {
      link_data.forEach((l1) => {
        const n1 = node_data.find(n => n.id === l1.source);
        n1.weight += Math.abs(l1.value / l1.num);
      });
    }
    function pageRank(node_data, link_data, d) {
      const total_num = node_data.length;
      const link_num = link_data.length;
      const tolerance = 1e-6;
      // const clickType = d3.select('input[name="pageRank"]').property('checked');
      const loopMax = clickType ? 100 : 1;
      // const loopMax = 1;
      for (let k = 0; k < loopMax; k += 1) {
        const newPageRank = [];
        for (let i = 0; i < total_num; i += 1) {
          let total_rightFormula = 0;
          for (let j = 0; j < link_num; j += 1) {
            const temp_link = link_data[j];
            if (temp_link.target === node_data[i].id) {
            // console.log(node_data[i].id);
              const adjNode = node_data.find(e => e.id === temp_link.source);
              // console.log(adjencentNode);
              let sumOfEdgeWeightFromAdjNode = 0;
              if (adjNode.weight !== 0) {
                sumOfEdgeWeightFromAdjNode = adjNode.pageRank
                  * ((temp_link.value / temp_link.num) / adjNode.weight);
              }
              total_rightFormula += sumOfEdgeWeightFromAdjNode;
            }
          }
          newPageRank.push(((1 - d) / total_num) + (d * total_rightFormula));
        }
        let err = 0;
        for (let i = 0; i < total_num; i += 1) {
          err += Math.abs(node_data[i].pageRank - newPageRank[i]);
        }

        for (let m = 0; m < total_num; m += 1) {
          node_data[m].pageRank = newPageRank[m];
        }
        loading(k, loopMax, d3.select('#graph'));
        console.log(`leaderPageRank: ${err}, total_num * tolerance: ${total_num * tolerance}`);
        if (err <= total_num * tolerance) break;
      }
    }
    function findMinimumPagerank(node_data) {
      let min = 0;
      node_data.forEach((n) => {
        if (n.pageRank < min) min = n.pageRank;
      });
      return min;
    }
  }
  // WordTree({ word: [['ag v'], ['ag c']] });
}

export { AuthorTable };
