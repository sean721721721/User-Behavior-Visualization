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
import OpinionLeaderView from './OpinionLeaderView';
// import * as sententree from 'sententree';
// import { max } from 'moment';
// import { Row, Form } from 'antd';
import * as jsnx from 'jsnetworkx';

export default function AuthorTable(nodes, div, $this, callback) {
  console.log(nodes);
  div.selectAll('*').remove();
  const authorList = JSON.parse(JSON.stringify(nodes));
  const deltaLengthList = [];
  const threshold = 100;
  // computeDeltaLength(authorList, deltaLengthList);
  const noCuttedAuthorIdList = JSON.parse(JSON.stringify(nodes));
  authorIdPreprocessing(authorList.children);
  leaderPageRank(authorList);
  // computeSentimentMatrix(authorList);
  const articleCellSvg = d3.select('#graph');
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
  authorList.children.sort((a, b) => d3.descending(a.pageRank, b.pageRank));
  const topicWithSelectedAuthor = JSON.parse(JSON.stringify(noCuttedAuthorIdList));
  topicWithSelectedAuthor.children = [];
  callback({ children: authorList.children }, 'test');
  // console.log(authorList.children);
  // console.log(div);
  const authorTable = div.append('table');
  // console.log(authorTable);
  const th = authorTable.append('tr');
  th.append('th').attr('class', 'tableHeader id')
    .attr('width', '25%')
    .text('AuthorID');
  th.append('th').attr('class', 'tableHeader deltaLength')
    .attr('width', '25%')
    .text('LPR');
  th.append('th').attr('class', 'tableHeader articleCount')
    .attr('width', '25%')
    .text('# Of Articles');
  th.append('th').attr('class', 'tableHeader messageCount')
    .attr('width', '25%')
    .text('Total Comments');
  // th.append('th').attr('class', 'tableHeader articles')
  //   .attr('width', '25%')
  //   .text('Articles');
  // th.append('th').attr('class', 'tableHeader comments')
  //   .attr('width', '25%')
  //   .text('comments');

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
    .text((d) => {
      return financial(d.pageRank);
      // const { delta } = deltaLengthList.find(e => e.id === d.id);
      // return financial(delta);
    });

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
    const pushAuthor = JSON.parse(JSON.stringify(d));
    pushAuthor.id = pushAuthor.oldId;
    topicWithSelectedAuthor.children.push(pushAuthor);
    console.log(topicWithSelectedAuthor, pushAuthor);
    callback(topicWithSelectedAuthor, pushAuthor.id);
    authorIndex += 1;
  }

  function computeDeltaLength(termNode, list) {
    let n = [];
    let l = [];
    termNode.children.forEach((e) => {
      const commentNumOfArticlesArr = e.responder.map(a => a.message_count[0].count);
      if (Math.max(...commentNumOfArticlesArr) >= threshold) {
        e.responder.forEach((e1) => {
          n.push({
            id: e.id,
            post: [{
              article: e1.articleId,
            }],
            reply: [],
          });
          let count = 1;
          if (e1.message_count[0].count >= threshold) {
            e1.message.every((e2) => {
              const existedNode = n.find(a => a.id === e2.push_userid);
              if (!existedNode) {
                n.push({
                  id: e2.push_userid,
                  reply: [{
                    author: e.id,
                    article: e1.articleId,
                  }],
                });
              } else {
                console.log(existedNode);
                existedNode.reply.push({
                  author: e.id,
                  article: e1.articleId,
                });
              }
              if (!l.find(a => a.source === e2.push_userid && a.target === e.id)) {
                l.push({
                  source: e2.push_userid,
                  target: e.id,
                  value: 1,
                });
              }
              count += 1;
              return count < 100;
            });
          }
        });
      }
    });
    [n, l] = mergeCellDataNodes(n, l);
    console.log(n, l);
    const graph = new jsnx.Graph();
    buildGraph(graph, n, l, null);
    console.log(new Date());
    const length = jsnx.allPairsShortestPathLength(graph);
    console.log(new Date());
    const average_shortest_path_length = computeAverageShortestPathLength(length);
    console.log(new Date());
    console.log(`average_shortest_path_length: ${average_shortest_path_length}`);
    termNode.children.forEach((e) => {
      const commentNumOfArticlesArr = e.responder.map(a => a.message_count[0].count);
      let deltaLen = 0;
      if (Math.max(...commentNumOfArticlesArr) >= threshold) {
        const g = new jsnx.Graph();
        buildGraph(g, n, l, e);
        const len = jsnx.allPairsShortestPathLength(g);
        const avgLen = computeAverageShortestPathLength(len) || 0;
        deltaLen = average_shortest_path_length - avgLen;
        console.log(`removed_avgLen: ${avgLen} delta: ${deltaLen}`);
      }
      list.push({
        id: e.id,
        delta: Math.abs(deltaLen) || 0,
      });
    });
  }

  function buildGraph(G, userNodes, replyLinks, willBeRemovedNodes) {
    let newLinks = JSON.parse(JSON.stringify(replyLinks));
    let newNodes = JSON.parse(JSON.stringify(userNodes));
    if (willBeRemovedNodes) {
      console.log(`Removed Nodes: ${willBeRemovedNodes.id}`);
      newLinks = newLinks.filter(l => l.target !== willBeRemovedNodes.id);
      newNodes = newNodes.filter(n => n.id === willBeRemovedNodes.id);
    }
    console.log(`#Links after removed nodes: ${newLinks.length}`);
    const node_data = newNodes.map(d => d.id);
    const edge_data = newLinks.map(d => [d.source, d.target, d.value]);
    G.addNodesFrom(node_data);
    G.addEdgesFrom(edge_data);
  }

  function computeAverageShortestPathLength(path) {
    let totalLength = 0;
    let averageLength = 0;
    const numOfNodes = Object.keys(path._stringValues).length;
    Object.values(path._stringValues).forEach((p) => {
      Object.values(p._stringValues).forEach((l) => {
        totalLength += l;
      });
    });
    console.log(`#total length: ${totalLength}`);
    averageLength = totalLength / (numOfNodes * (numOfNodes - 1));
    return averageLength;
  }

  function financial(x) {
    return Number.parseFloat(x).toFixed(4);
  }

  function mergeCellDataNodes(ns, ls) {
    ls = ls.filter(e => e.source !== e.target);
    // merge nodes by author & article
    for (let i = 0; i < ns.length - 1; i += 1) {
      for (let j = i + 1; j < ns.length; j += 1) {
        if (!ns[i].post && !ns[j].post) {
          if (_.isEqual(ns[i].reply, ns[j].reply)) {
            const temp_id = ns[i].id;
            const next_id = ns[j].id;
            ls = ls.filter(e => e.source !== next_id);
            ns = ns.filter(e => e.id !== next_id);
            j -= 1;
          }
        }
      }
    }
    return [ns, ls];
  }

  function authorIdPreprocessing(node_data) {
    node_data.forEach((n) => {
      const new_id = n.id.split(' ');
      n.oldId = n.id;
      [n.id] = new_id;
    });
  }

  function leaderPageRank(selectedNode) {
    const node = [];
    const link = [];
    const alpha = 0.85;
    console.log(new Date());
    computeSentimentMatrix(selectedNode, node, link);
    computeTotalWeightOfEachNode(node, link);
    pageRank(node, link, alpha);
    console.log(node, link);
    const minPageRank = findMinimumPagerank(node);
    console.log(minPageRank);
    selectedNode.children.forEach((e) => {
      const authorNode = node.find(e1 => e1.id === e.id);
      console.log(authorNode);
      e.pageRank = authorNode ? authorNode.pageRank + minPageRank + 1 : minPageRank + 1;
    });
    console.log(node);
    console.log(selectedNode.children);
    console.log(new Date());

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
      const loopMax = 1;
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
                sumOfEdgeWeightFromAdjNode = adjNode.pageRank * ((temp_link.value / temp_link.num) / adjNode.weight);
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
          // if (node_data[m].post && node_data[m].weight > 0) console.log(node_data[m], node_data[m].pageRank);
        }
        console.log(`leaderPageRank: ${err}, total_num * tolerance: ${total_num * tolerance}`);
        if (err < total_num * tolerance) break;
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
