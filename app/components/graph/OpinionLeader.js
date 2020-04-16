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

export default function OpinionLeader(cellNodes, cellLinks, beforeThisDate,
  svg, forceSimulation, totalInfluence, $this, optionsWord, submit) {
  const w = parseFloat(d3.select('#articleCell').style('width'));
  const h = parseFloat(d3.select('#articleCell').style('height'));
  const G = new jsnx.Graph();
  const color = d3.schemeTableau10;
  const articleInfluenceThreshold = 100;
  const node_r = d3.scaleLinear().range([3, 20]);
  buildGraph();
  const selectedArticles = [];
  const termCentrality = {
    Betweenness: {},
    EigenVector: {},
  };

  try {
    termCentrality.Betweenness = jsnx.betweennessCentrality(G, { weight: true })._stringValues;
    termCentrality.EigenVector = jsnx.eigenvectorCentrality(G)._stringValues;
    // termCentrality.Cluster = jsnx.clustering(G)._stringValues;
  } catch (error) {
    console.log(error);
    Object.keys(G.node._stringValues).map((key, index) => {
      termCentrality.Betweenness[key] = 1;
      termCentrality.EigenVector[key] = 1;
      // termCentrality.Cluster[key] = 1;
      return true;
    });
  }

  const termCentralityArr = {
    betweennessArr: Object.values(termCentrality.Betweenness),
    eigenvectorArr: Object.values(termCentrality.EigenVector),
    // clusterArr: Object.values(termCentrality.Cluster),
  };

  const normalizeBetweenness = d3.scaleLinear()
    .domain([
      Math.min(...termCentralityArr.betweennessArr),
      Math.max(...termCentralityArr.betweennessArr),
    ]).range([3, 13]);

  const normalizeEigenvector = d3.scaleLinear()
    .domain([
      Math.min(...termCentralityArr.eigenvectorArr),
      Math.max(...termCentralityArr.eigenvectorArr),
    ]).range([1, 10]);

  // console.log(termCentrality);

  const authorNodes = cellNodes.filter(node => node.influence);
  const articleNodes = [];
  cellNodes.forEach((node) => {
    node.tag = 0;
    if (node.responder) {
      node.responder.forEach((a) => {
        articleNodes.push(a);
      });
    }
  });
  // console.log(articleNodes);
  const authorArr = authorNodes.map(node => node.id);
  const articleArr = cellNodes.map(node => !node.titleTerm && node.articleId).filter(e => e);
  const selectedAuthorTotalComments = computedNumOfAllArticleComments(authorNodes);
  const opinoinLeaderPie = d3.pie()
    .value((d) => {
      const totalComments = computedNumOfAllArticleComments([d]);
      // return 360 / authorArr.length;
      d.influenceRatio = totalComments / selectedAuthorTotalComments;
      return 360 * (totalComments / selectedAuthorTotalComments);
    })
    .sort(null);

  const articlePie = d3.pie()
    .value((d) => {
      // console.log(d);
      const author = authorNodes.find(e => e.id === d.author);
      // console.log(author);
      const articleRatio = author.responder.filter(
        e => e.message.length >= articleInfluenceThreshold,
      );
      // console.log(articleRatio);
      return (360 * author.influenceRatio) * (d.message.length / author.influence);
    })
    .sort(null);

  const linkAdjMatrix = articleAndUserLinkAdjMatrix(articleNodes);

  responderCommunityDetecting(cellNodes, cellLinks);
  // ({ nodes, links } = data);
  svg.selectAll('*').remove();
  // svg = svg
  //   .call(d3.zoom().scaleExtent([1 / 2, 8]).on('zoom', articleCellZoomed))
  //   .append('g');
  svg = svg.append('g')
    .attr('transform', d => `translate(${w / 3}, ${h / 2}) scale(1.3,1.3)`);

  svg.append('defs').append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '-0 -5 10 10')
    .attr('refX', 18)
    .attr('refY', 0)
    .attr('orient', 'auto')
    .attr('markerWidth', 8)
    .attr('markerHeight', 8)
    .attr('xoverflow', 'visible')
    .append('svg:path')
    .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
    .attr('fill', '#999')
    .style('stroke', 'none');
  let cellLink = svg.selectAll('line')
    .data(cellLinks);

  // link.exit().remove();
  const cellLinkEnter = cellLink.enter()
  // .append('g')
    .append('line')
    .attr('class', 'links')
    .attr('marker-end', 'url(#arrowhead)')
    .style('z-index', -1)
  // .attr('visibility', 'hidden')
    .attr('stroke', 'gray')
    .attr('stroke-opacity', 0.1)
    .attr('stroke-width', 1)
    .attr('stroke-width', d => Math.min(d.value, 10));
  // cellLink = cellLinkEnter.merge(link);
  cellLink = cellLinkEnter;

  const cellPieGroup = svg.append('g')
    .attr('class', 'pieChart')
    .selectAll('g')
    .data([cellNodes])
    .enter();
  const cellPath = cellPieGroup.selectAll('path')
    .data((d) => {
      const res = d.filter(e => e.responder);
      return opinoinLeaderPie(res);
    });

  const arc = d3.arc()
    .innerRadius(((w / 3) - 15) / 1.3)
    .outerRadius(((w / 3) - 10) / 1.3);

  const arc2 = d3.arc()
    .innerRadius(((w / 3) - 5) / 1.3)
    .outerRadius((w / 3) / 1.3);

  // cellPath.enter().append('path')
  //   .attr('fill', (d) => {
  //     // const index = authorArr.findIndex(e => e === d.data.id);
  //     const index = authorArr.findIndex(e => e === d.data.id);
  //     console.log();
  //     return color[index];
  //     // return color[d.data.cluster];
  //   })
  //   .attr('d', arc)
  //   .attr('stroke', 'white')
  //   .attr('stroke-width', '0.2px');


  // cellPath
  //   .data((d) => {
  //     const res = d.filter(e => e.responder);
  //     return opinoinLeaderPie(res);
  //   })
  //   .enter().append('path')
  //   .attr('fill', (d) => {
  //     const index = authorArr.findIndex(e => e === d.data.id);
  //     return color[index];
  //     // return color[d.data.cluster];
  //   })
  //   .attr('d', arc2)
  //   .attr('stroke', 'white')
  //   .attr('stroke-width', '0.2px');

  const articlePathGroup = cellPieGroup.append('g');
  const articlePath = articlePathGroup.selectAll('path')
    .data(articlePie(articleNodes));

  const articleArc = d3.arc()
    .innerRadius((w / 3 - 5) / 1.3)
    .outerRadius((w / 3) / 1.3);

  // articlePath.enter().append('path')
  //   .attr('fill', 'white')
  //   .attr('d', articleArc)
  //   .attr('stroke', 'black')
  //   .attr('stroke-width', '0.2px');

  // cellPath.enter().append('text')
  //   .text(d => d.data.id)
  //   .attr('transform', (d) => {
  //     // console.log(d);
  //     if (d.data.id) {
  //       const author = cellNodes.find(e => e.id === d.data.id);
  //       // console.log(arc.centroid(d));
  //       // [author.fx, author.fy] = arc.centroid(d);
  //     }
  //     return `translate(${arc.centroid(d)})`;
  //   })
  //   .style('text-anchor', 'middle')
  //   .attr('font-family', 'Microsoft JhengHei')
  //   .attr('font-size', '10px')
  //   .attr('color', '#000');

  // articlePath.enter().append('text')
  //   .text(d => d.data.title)
  //   .attr('transform', (d) => {
  //     if (d.data.id) {
  //       const article = cellNodes.find(e => e.id === d.data.id);
  //       // [article.fx, article.fy] = articleArc.centroid(d);
  //     }
  //     const position = arc.centroid(d);
  //     position[1] += 20;
  //     return `translate(${position})`;
  //   })
  //   .style('text-anchor', 'middle')
  //   .attr('font-family', 'Microsoft JhengHei')
  //   .attr('font-size', '10px')
  //   .attr('color', '#000')
  //   .on('click', clicked);

  // console.log('cellNodes: ', cellNodes);

  let cellNode = svg.append('g')
    .attr('class', 'nodes')
    .selectAll('g')
    .data(cellNodes);

  const cellNodeEnter = cellNode.enter()
    .append('g')
    .attr('class', 'nodes')
    .style('z-index', 1)
    .attr('opacity', (d) => {
      if (d.group !== 2 && d.connected === 0) return 0.2;
      if (d.show === 0) return 0.2;
      return 1;
    })
  // .on('click', clicked)
  // .on('mouseover', mouseOver(0.1))
  // .on('mouseout', mouseOut)
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));

  cellNodeEnter
    .append('defs')
    .append('pattern')
    .attr('id', 'pic_user')
    .attr('height', 60)
    .attr('width', 60)
    .attr('x', 0)
    .attr('y', 0)
    .append('image')
    .attr('xlink:href', 'https://i.imgur.com/jTUiJ1l.png')
    .attr('height', 10)
    .attr('width', 10)
    .attr('x', 0)
    .attr('y', 0);

  const cellKeyPlayerCircles = cellNodeEnter.selectAll('circle');

  const cellCircles = cellNodeEnter.append('circle')
    .transition()
    .duration(500)
    .attr('class', (d, i) => `nodes circle_${i}`)
    .attr('r', (d) => {
      let radius = 0;
      if (d.author) radius = 10; // article nodes
      else if (d.group === 1) radius = 0; // center point
      else if (d.influence) radius = 5; // author
      // else radius = d.pushCount; // replyer
      else radius = centrality(d);
      d.radius = radius;
      return radius;
    })
    .attr('fill', (d) => {
      // console.log(d);
      if (d.articleId) return color[2];
      // if (d.articleId) return color[articleArr.findIndex(a => a === d.articleId) + 2]; // article nodes
      if (d.influence) return color[1]; // author node
      return color[0];
    })
    .style('fill-opacity', 1)
    .attr('stroke', 'black')
    .attr('stroke-width', d => (d.group === 1 ? 2 : 0.9))
    .attr('stroke-opacity', 1);

  const selectedArticleNodes = [];
  cellNodeEnter.on('mouseover', (d) => { mouseevent(d, 'mouseover'); })
    .on('mouseout', (d) => { mouseevent(d, 'mouseout'); })
    .on('click', articleNodeClicked);

  const cellLables = cellNodeEnter.append('text')
    .text(d => (d.titleTerm ? '' : d.title))
    .style('text-anchor', 'middle')
    .attr('font-family', 'Microsoft JhengHei')
    .attr('font-size', '10px')
    .attr('color', '#000')
    .attr('y', 15);

  cellNodeEnter.append('title')
    .text((d) => {
      if (d.push_detail) {
        let push_content = '';
        d.push_detail.forEach((e) => {
          push_content = push_content.concat('\n', e.article[0].messageContent);
        });
        return `${d.id}${'\n'}content: ${push_content}`;
      }
      return `${d.id}${'\n'}content: ${d.url}`;
    });
  // cellNode = cellNodeEnter.merge(node);
  cellNode = cellNodeEnter;

  // const cellStrengthScale = d3.scaleLinear()
  //   .domain([
  //     Math.min(...set.links.map(l => l.value)),
  //     Math.max(...set.links.map(l => l.value)),
  //   ]).range([1, 100]);

  forceSimulation
    .nodes(cellNodes)
  // .on('tick', cellTicked)
    .on('tick', onSimulationTick);

  forceSimulation.alphaDecay(0.005)
    .force('link')
    .links(cellLinks)
    .distance(d => 30)
    // .strength(d => Math.min(1, 0.1 * d.value));
    .strength(d => 0.3);

  forceSimulation.force('collision', d3.forceCollide(d => d.radius));

  const simulationDurationInMs = 10000; // 20 seconds

  const startTime = Date.now();
  const endTime = startTime + simulationDurationInMs;

  function articleNodeClicked(d) {
    // console.log(d);
    // submit(d);
    const adj = cellLinks.filter(e => e.target.index === d.index);
    const selectedUser = [];
    const index = selectedArticleNodes.findIndex(e => e === d.title);
    if (index !== -1) selectedArticleNodes.splice(index, 1);
    else selectedArticleNodes.push(d.title);
    adj.forEach((n) => {
      const data = d3.selectAll(`circle.nodes.circle_${n.source.index}`).data();
      data.forEach((e) => {
        e.tag += index === -1 ? 1 : -1;
      });
      d3.selectAll('circle.nodes')
        .style('stroke', e => (e.tag === selectedArticleNodes.length ? 'red' : 'black'))
        .style('stroke-width', e => (e.tag === selectedArticleNodes.length ? 2 : 1))
        .style('stroke-opacity', 0.6);
    });
    const data = svg.selectAll('circle.nodes').data();
    data.forEach((e) => {
      if (e.tag === selectedArticleNodes.length) {
        e.containUsers.forEach((u) => {
          selectedUser.push(u);
        });
      }
    });
    console.log(cellNodes);
    drawSelectedUserTable(selectedUser);
  }

  function drawSelectedUserTable(nodes) {
    const userArr = nodes;
    const selectedUserDiv = d3.selectAll('.selectedUserTable');
    selectedUserDiv.selectAll('*').remove();

    const buttonDiv = selectedUserDiv.append('div')
      .attr('class', 'p-2 d-flex justify-content-center');
    buttonDiv.append('button')
      .style('type', 'button')
      .attr('class', 'btn btn-primary')
      .text('Submit!')
      .on('click', (d) => {
        console.log(d);
        selectedUserClick(userArr);
      });

    const tableDiv = selectedUserDiv.append('div')
      .style('border', 'black 1px solid')
      .style('max-height', '400px')
      .style('overflow-y', 'scroll');
    const table = tableDiv.append('table');
    table.append('tr').append('td')
      .text('ID')
      .style('background', color[0])
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
        console.log(userArr);

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
    console.log(d);
    submit(d);
  }

  function clicked(d) {
    console.log(d);
    if (d.data.title) {
      if (!selectedArticles.includes(d.data.title)) {
        selectedArticles.push(d.data.title);
        let remainUsers = [];
        remainUsers = findUsersCommentAllSelectedArticles(selectedArticles);
        console.log(remainUsers);
        // textArea.selectAll('text').remove();
        svg.select('.textArea').remove();
        const textArea = svg.append('g')
          .attr('class', 'textArea')
          .attr('transform', `translate(${w / 3.5},${-h / 3})`);
        textArea.selectAll('text')
          .data(remainUsers)
          .enter()
          .append('g')
          .attr('transform', (e, i) => `translate(0, ${i * 12})`)
          .append('text')
          .text(e => e.id)
          .attr('font-size', '10px')
          .on('click', userTextClicked);
      }
    }
  }
  function userTextClicked(d) {
    d3.selectAll('svg#commentTimeline').selectAll('line').style('stroke', 'gray')
      .style('stroke-width', 0.3)
      .style('stroke-opacity', 0.3);
    d3.selectAll('svg#commentTimeline').selectAll(`line.${d.id}`).style('stroke', 'red')
      .style('stroke-width', 1)
      .style('stroke-opacity', 1);
    d3.selectAll('circle')
      .attr('r', r => (r.push_userid === d.id ? 5 : 2))
      .attr('stroke', 'black')
      .attr('stroke-width', r => (r.push_userid === d.id ? 1 : 0));
  }
  function findUsersCommentAllSelectedArticles(arr) {
    let users = [];
    const nodes = [];
    arr.forEach((id) => {
      nodes.push(articleNodes.find(a => a.title === id));
    });
    const articleCount = nodes.length;
    nodes.forEach((a) => {
      const userInOneArticle = [];
      a.message.forEach((m) => {
        if (!userInOneArticle.includes(m.push_userid)) {
          userInOneArticle.push(m.push_userid);
          const existedUser = users.find(e => e.id === m.push_userid);
          if (existedUser) existedUser.count += 1;
          else {
            users.push({ id: m.push_userid, count: 1 });
          }
        }
      });
    });

    users = users.filter(e => e.count >= articleCount);
    return users;
  }

  function onSimulationTick() {
    if (Date.now() < endTime) {
      cellTicked();
    } else {
      forceSimulation.stop();
    }
  }

  function cellTicked() {
    cellLink
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
      .attr('class', d => (`from${d.source.index} to${d.target.index}`));

    cellNode
      .attr('transform', d => `translate( ${d.x}, ${d.y})`)
      .attr('id', d => `_${d.index}`);
  }

  function dragstarted(d) {
    if (!d3.event.active) {
      forceSimulation.alphaTarget(0.3).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) {
      forceSimulation.alphaTarget(0.3).restart();
    }
    d.fx = null;
    d.fy = null;
  }

  function mouseevent(d, event, mode) {
    if (event === 'mouseover' && d.titleTermArr) {
      const userState = $this.state.user;
      if (!$this.state.user.includes(d.id)) {
        userState.push(d.id);
      }
      $this.setState({
        optionsWord,
        word: d.titleTermArr,
        user: userState,
        hover: 1,
        mouseOverUser: d.id,
      });
    }

    if (event === 'mouseover' && d.cutted_push_content) {
      // console.log(d.cutted_push_content);
      const contentBeginWithSlash = cutted_push_contentAddSlash(d.cutted_push_content);
      const userState = $this.state.user;
      if (!$this.state.user.includes(d.id)) {
        userState.push(d.id);
      }
      $this.setState({
        optionsWord: '/',
        word: contentBeginWithSlash,
        user: userState,
        hover: 1,
      });
    }
    // console.log(d3.selectAll('.articles'));
    d3.selectAll('.articles').selectAll('circle')
      .attr('r', (r) => {
        if (!r || !d.containUsers) return 2;
        if (d.containUsers.includes(r.push_userid)) {
          return 5;
        }
        return 2;
      })
      .attr('stroke', 'black')
      .attr('stroke-width', (r) => {
        if (!r || !d.containUsers) return 0;
        if (d.containUsers.includes(r.push_userid)) return 1;
        return 0;
      });
    const line_out_color = (event === 'mouseover') ? 'black' : 'rgb(208,211,212)';
    const line_in_color = (event === 'mouseover') ? 'black' : 'rgb(208,211,212)';
    const line_opacity = (event === 'mouseover') ? 1 : 0.3;
    const dot_self_color = (event === 'mouseover') ? 'rgb(218, 41, 28)' : '#fff';
    const dot_other_color = (event === 'mouseover') ? 'black' : '#fff';
    const dot_selected_opacity = 1;
    const dot_other_opacity = (event === 'mouseover') ? 0.7 : 1;
    const dot_self_stroke_width = (event === 'mouseover') ? 1 : 0.3;
    const dot_self_storke_opacity = (event === 'mouseover') ? 1 : 1;

    // clear out
    // d3.selectAll('circle.nodes').attr('r', e => e.radius)
    //   .style('stroke-opacity', dot_self_storke_opacity).style('stroke', '#000')
    //   .style('stroke-width', dot_self_stroke_width);
    d3.selectAll('line').style('stroke', 'rgb(208,211,212)').style('stroke-opacity', 0.3);
    d3.selectAll('text.background-text').style('fill', 'rgb(208,211,212)').style('stroke', 'rgb(208,211,212)');

    // color lines
    d3.selectAll(`line.to${d.index}`).each((e) => {
      e.type = 'in';
    })
      // .attr('marker-end', e => ((event === 'mouseover') ? `url(#${e.type})` : 'none'))
      .style('stroke', line_in_color)
      .transition()
      .duration(500)
      .style('stroke-opacity', line_opacity);

    d3.selectAll(`line.from${d.index}`).each((e) => {
      e.type = 'out';
    })
      // .attr('marker-end', e => ((event === 'mouseover') ? `url(#${e.type})` : 'none'))
      .style('stroke', line_out_color)
      .transition()
      .duration(500)
      .style('stroke-opacity', line_opacity);

    // highlight commentTimeline link
    if (d.containUsers) {
      d.containUsers.forEach((id) => {
        d3.selectAll('svg#commentTimeline').selectAll(`line.${id}`).style('stroke', 'red');
      });
    }

    // highlight dots
    // d3.selectAll('circle.nodes').transition().style('opacity', dot_other_opacity);
    // // self
    // d3.selectAll(`.circle_${d.index}`)
    //   .style('stroke', dot_self_color)
    //   .transition()
    //   .duration(800)
    //   .attr('r', e => ((event === 'mouseover') ? node_r(e.highlight_mode) : node_r(e.normal_mode)))
    //   .style('opacity', dot_selected_opacity)
    //   .style('stroke-width', dot_self_stroke_width);
    // // to dots
    // d3.selectAll(`line.from${d.index}`).filter(e => e.target.index !== e.source.index).each((e) => {
    //   if (event === 'mouseover') {
    //     d3.select(`nodes#_${e.target.index}`)
    //       .style('stroke', dot_other_color)
    //       .attr('r', (e1) => {
    //         console.log(e1);
    //         return (event === 'mouseover') ? node_r(10) : e1.radius;
    //       })
    //       .each((e1) => {
    //         e1.select_radius = d3.select(this).attr('r');
    //       })
    //       .transition()
    //       .duration(300)
    //       .style('opacity', dot_selected_opacity);
    //   } else {
    //     d3.select(`circle#_${e.target.index}`)
    //       .attr('r', e1 => e1.radius)
    //       .style('stroke', dot_other_color)
    //       .style('opacity', dot_selected_opacity);
    //   }
    // });
    // // from dots
    // d3.selectAll(`line.to${d.index}`).filter(e => e.target.index !== e.source.index).each((e) => {
    //   d3.select(`nodes#_${e.source.index}`)
    //   // .attr('r', e1 => ((event === 'mouseover') ? node_r(e.count) : e1.radius))
    //     .each((e1) => {
    //       e1.select_radius = d3.select(this).attr('r');
    //     })
    //     .style('stroke', dot_other_color)
    //     .transition()
    //     .duration(300)
    //     .style('opacity', dot_selected_opacity);
    // });
  }

  function articleAndUserLinkAdjMatrix(node) {
    // const adj = {};
    // node.forEach((e) => {
    //   e.message
    //   adj[e.index].push
    // });
    return null;
  }

  function cutted_push_contentAddSlash(wordArr) {
    const newWordArr = [];
    wordArr.forEach((e) => {
      newWordArr.push(['/ '.concat(e[0])]);
    });
    return newWordArr;
  }

  function responderCommunityDetecting(dataNodes, dataLinks) {
    console.log(dataLinks);
    // const filteredLinks = dataLinks.filter(l => l.tag === 1 || l.tag === 0);
    const authorCluster = dataNodes.filter(e => e.influence);
    dataNodes = dataNodes.filter(e => !e.influence);
    const filteredLinks = dataLinks.filter(l => l.tag === 1);
    const links = JSON.parse(JSON.stringify(filteredLinks));
    for (let i = 0; i < links.length; i += 1) {
      // console.log(links[i]);
      links[i].source = dataNodes.findIndex(ele => ele.id === filteredLinks[i].source.id || ele.id === filteredLinks[i].source);
      links[i].target = dataNodes.findIndex(ele => (ele.id === filteredLinks[i].target
        || ele.articleId === filteredLinks[i].target));
    }
    // console.log(index, testLinks);
    // console.log(links);
    // console.log(filteredLinks);
    console.log(dataNodes, links);
    netClustering.cluster(dataNodes, links);
    console.log('community detecting done');
  }

  function buildGraph() {
    let newLinks = JSON.parse(JSON.stringify(cellLinks));
    newLinks = newLinks.filter(l => l.tag !== 0);
    const node_data = cellNodes.map(d => d.id);
    const edge_data = newLinks.map(d => [d.source, d.target, d.value]);
    G.addNodesFrom(node_data);
    G.addEdgesFrom(edge_data);
    // let length = jsnx.allPairsShortestPathLength(G);
    // console.log(Object.values(length._stringValues));
  }

  function centrality(d) {
    // if (option === 'eigenvector')
    // return normalizeEigenvector(termCentrality.EigenVector[d.id]);
    return normalizeBetweenness(termCentrality.Betweenness[d.id]);
  }

  function computedNumOfAllArticleComments(arr) {
    let count = 0;
    arr.forEach((author) => {
      author.responder.forEach((article) => {
        count += article.message.length;
      });
    });
    return count;
  }
}

export { OpinionLeader };
