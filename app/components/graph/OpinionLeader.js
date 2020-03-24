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
import netClustering from 'netclustering';
import * as jsnx from 'jsnetworkx';
import Chart from 'react-google-charts';
// import jieba from 'nodejieba';

export default function OpinionLeader(cellNodes, cellLinks, beforeThisDate,
  svg, forceSimulation, totalInfluence, $this) {
  const G = new jsnx.Graph();
  const color = d3.schemeTableau10;
  const articleInfluenceThreshold = 100;
  const node_r = d3.scaleLinear().range([3, 20]);
  buildGraph();

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
    ]).range([1, 10]);

  const normalizeEigenvector = d3.scaleLinear()
    .domain([
      Math.min(...termCentralityArr.eigenvectorArr),
      Math.max(...termCentralityArr.eigenvectorArr),
    ]).range([1, 10]);

  console.log(termCentrality);

  const authorNodes = cellNodes.filter(node => node.influence);
  // const articleNodes = [];
  // authorNodes.map(e => e.responder).forEach((e) => {
  //   e.forEach((article) => {
  //     articleNodes.push(article);
  //   });
  // });
  const articleNodes = cellNodes.filter(node => node.type === 'article');

  // console.log('articleNodes: ', articleNodes);
  // console.log('authorNodes: ', authorNodes);

  const authorArr = authorNodes.map(node => node.id);
  // console.log(authorArr);
  const opinoinLeaderPie = d3.pie()
    .value((d) => {
      const totalComments = d.responder.reduce((pre, nex) => ({
        message: {
          length: pre.message.length + nex.message.length,
        },
      }));
      // console.log(d);
      return 360 / authorArr.length;
    })
    .sort(null);

  const articlePie = d3.pie()
    .value((d) => {
      const author = authorNodes.find(e => e.id === d.author);
      // console.log(author);
      const articleRatio = author.responder.filter(
        e => e.message.length >= articleInfluenceThreshold,
      );
      return (360 / authorArr.length) / articleRatio.length;
    })
    .sort(null);

  console.log('articlePie(articleNodes): ', articlePie(articleNodes));

  responderCommunityDetecting(cellNodes, cellLinks);

  // ({ nodes, links } = data);
  svg.selectAll('*').remove();
  // svg = svg
  //   .call(d3.zoom().scaleExtent([1 / 2, 8]).on('zoom', articleCellZoomed))
  //   .append('g');
  svg = svg.append('g')
    .attr('transform', (d) => {
      const w = parseFloat(d3.select('#articleCell').style('width'));
      const h = parseFloat(d3.select('#articleCell').style('height'));
      return `translate(${w / 2}, ${h / 2}) scale(1.3,1.3)`;
    });
  let cellLink = svg.selectAll('line')
    .data(cellLinks);

  // link.exit().remove();
  const cellLinkEnter = cellLink.enter()
  // .append('g')
    .append('line')
    .attr('class', 'links')
    .style('z-index', -1)
  // .attr('visibility', 'hidden')
    .attr('stroke', d => d.color)
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
    .innerRadius(135)
    .outerRadius(140);

  cellPath.enter().append('path')
    .attr('fill', (d) => {
      const index = authorArr.findIndex(e => e === d.data.id);
      return color[index];
      // return color[d.data.cluster];
    })
    .attr('d', arc)
    .attr('stroke', 'white')
    .attr('stroke-width', '0.2px');

  // const authorData = cellPath.data();
  // console.log(cellPath.enter().datum());
  // console.log(authorData);

  const articlePathGroup = cellPieGroup.append('g');
  const articlePath = articlePathGroup.selectAll('path')
    .data(articlePie(articleNodes));

  const articleArc = d3.arc()
    .innerRadius(130)
    .outerRadius(135);

  articlePath.enter().append('path')
    .attr('fill', (d) => {
      // console.log(d);
      return 'white';
    })
    .attr('d', articleArc)
    .attr('stroke', 'black')
    .attr('stroke-width', '0.2px');

  cellPath.enter().append('text')
    .text(d => d.data.id)
    .attr('transform', (d) => {
      // console.log(d);
      if (d.data.id) {
        const author = cellNodes.find(e => e.id === d.data.id);
        // console.log(arc.centroid(d));
        [author.fx, author.fy] = arc.centroid(d);
      }
      return `translate(${arc.centroid(d)})`;
    })
    .style('text-anchor', 'middle')
    .attr('font-family', 'Microsoft JhengHei')
    .attr('font-size', '10px')
    .attr('color', '#000');

  articlePath.enter().append('text')
    // .text(d => d.data.articleId)
    .attr('transform', (d) => {
      if (d.data.id) {
        const article = cellNodes.find(e => e.id === d.data.id);
        // [article.fx, article.fy] = articleArc.centroid(d);
      }
      return `translate(${arc.centroid(d)})`;
    })
    .style('text-anchor', 'middle')
    .attr('font-family', 'Microsoft JhengHei')
    .attr('font-size', '10px')
    .attr('color', '#000');

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
    .attr('class', 'nodes')
    .attr('r', (d) => {
      let radius = 0;
      if (d.author) radius = 5; // article nodes
      else if (d.group === 1) radius = 0; // center point
      else if (d.influence) radius = 5; // author
      // else radius = d.pushCount; // replyer
      else radius = centrality(d);
      d.radius = radius;
      return radius;
    })
    .attr('fill', (d) => {
      // console.log(d);
      return color[d.cluster];
      if (d.influence) return color[authorArr.findIndex(e => e === d.id)]; // author
      if (d.authorGroup && d.authorGroup.length === 1) { // replyer
        const index = authorArr.findIndex(e => e === d.authorGroup[0]);
        // return color[d.cluster];
        return color[index];
      }
      if (d.author) { // article
        const index = authorArr.findIndex(e => e === d.author);
        // return color[d.cluster];
        return color[index];
      }
      if (d.reply) {
        if (d.reply.length === 1) {
          const index = authorArr.findIndex(e => e === d.reply[0].author.id);
          const author = authorNodes.find(e => e.id === d.reply[0].author.id);
          if (author.countedArticle === d.reply[0].article.length) return 'red';
          // return color[index];
          return 'green';
          // return color[d.cluster];
        }
        return 'green';
      }
    })
    .style('fill-opacity', 1)
    .attr('stroke', 'black')
    .attr('stroke-width', d => (d.group === 1 ? 2 : 0.9))
    .attr('stroke-opacity', d => (d.influence ? 1 : 0));

  cellNodeEnter.on('mouseover', (d) => { mouseevent(d, 'mouseover'); })
    .on('mouseout', (d) => { mouseevent(d, 'mouseout'); });

  // const labelBox = cellNodeEnter.append('rect')
  //   .attr('x', 0)
  //   .attr('y', 0)
  //   .attr('width', 100)
  //   .attr('height', 50)
  //   .style('fill', '#80d6c7');

  const cellLables = cellNodeEnter.append('text')
    .text((d) => {
      if (d.reply) {
        // return d.reply[0].article.length;
      }
      return '';
    })
    .style('text-anchor', 'middle')
    .attr('font-family', 'Microsoft JhengHei')
    .attr('font-size', '10px')
    .attr('color', '#000')
    .attr('y', 3);

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
    .strength((d) => {
      return Math.min(1, 0.1 * d.value);
    });
  // .strength(d => d.value / 7);

  forceSimulation.force('collision', d3.forceCollide(d => d.radius));

  const simulationDurationInMs = 120000; // 20 seconds

  const startTime = Date.now();
  const endTime = startTime + simulationDurationInMs;

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
    console.log(d);
    if (event === 'mouseover' && d.titleTermArr) {
      const userState = $this.state.user;
      if (!$this.state.user.includes(d.id)) {
        userState.push(d.id);
      }
      $this.setState({
        word: d.titleTermArr,
        user: userState,
        hover: 1,
        mouseOverUser: d.id,
      });
    }

    if (event === 'mouseover' && d.cutted_push_content) {
      console.log(d.cutted_push_content);
      const userState = $this.state.user;
      if (!$this.state.user.includes(d.id)) {
        userState.push(d.id);
      }
      $this.setState({
        word: d.cutted_push_content,
        user: userState,
        hover: 1,
      });
    }

    d3.selectAll('circle')
      .attr('r', (r) => {
        if (!r || !d.containUsers) return 2;
        if (d.containUsers.includes(r.push_userid)) {
          console.log(r, d.containUsers);
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
    const line_in_color = (event === 'mouseover') ? 'rgb(218, 41, 28)' : 'rgb(208,211,212)';
    const line_opacity = (event === 'mouseover') ? 1 : 0.3;
    const dot_self_color = (event === 'mouseover') ? 'rgb(218, 41, 28)' : '#fff';
    const dot_other_color = (event === 'mouseover') ? 'black' : '#fff';
    const dot_selected_opacity = 1;
    const dot_other_opacity = (event === 'mouseover') ? 0.1 : 1;
    const dot_self_stroke_width = (event === 'mouseover') ? 2 : 1;

    // clear out
    d3.selectAll('circle.nodes').attr('r', e => e.radius).style('stroke', '#fff').style('stroke-width', dot_self_stroke_width);
    d3.selectAll('line').attr('marker-end', 'none').style('stroke', 'rgb(208,211,212)').style('stroke-opacity', 0.3);
    d3.selectAll('text.background-text').style('fill', 'rgb(208,211,212)').style('stroke', 'rgb(208,211,212)');

    // color lines
    d3.selectAll(`line.to${d.index}`).each((e) => {
      e.type = 'in';
    })
      .attr('marker-end', e => ((event === 'mouseover') ? `url(#${e.type})` : 'none'))
      .style('stroke', line_in_color)
      .transition()
      .duration(500)
      .style('stroke-opacity', line_opacity);

    d3.selectAll(`line.from${d.index}`).each((e) => {
      e.type = 'out';
    })
      .attr('marker-end', e => ((event === 'mouseover') ? `url(#${e.type})` : 'none'))
      .style('stroke', line_out_color)
      .transition()
      .duration(500)
      .style('stroke-opacity', line_opacity);

    // highlight dots
    // d3.selectAll('circle.nodes').transition().style('opacity', dot_other_opacity);
    // self
    d3.selectAll(`circle#_${d.index}`)
      .style('stroke', dot_self_color)
      .transition()
      .duration(800)
    // .attr('r', e => ((event === 'mouseover') ? node_r(e.highlight_mode) : node_r(e.normal_mode)))
      .style('opacity', dot_selected_opacity)
      .style('stroke-width', dot_self_stroke_width);
    // to dots
    d3.selectAll(`line.from${d.index}`).filter(e => e.target.index !== e.source.index).each((e) => {
      if (event === 'mouseover') {
        d3.select(`nodes#_${e.target.index}`)
          .style('stroke', dot_other_color)
          .attr('r', (e1) => {
            console.log(e1);
            return (event === 'mouseover') ? node_r(10) : e1.radius;
          })
          .each((e1) => {
            e1.select_radius = d3.select(this).attr('r');
          })
          .transition()
          .duration(300)
          .style('opacity', dot_selected_opacity);
      } else {
        d3.select(`circle#_${e.target.index}`)
          .attr('r', e1 => e1.radius)
          .style('stroke', dot_other_color)
          .style('opacity', dot_selected_opacity);
      }
    });
    // from dots
    d3.selectAll(`line.to${d.index}`).filter(e => e.target.index !== e.source.index).each((e) => {
      d3.select(`nodes#_${e.source.index}`)
      // .attr('r', e1 => ((event === 'mouseover') ? node_r(e.count) : e1.radius))
        .each((e1) => {
          e1.select_radius = d3.select(this).attr('r');
        })
        .style('stroke', dot_other_color)
        .transition()
        .duration(300)
        .style('opacity', dot_selected_opacity);
    });
  }

  function responderCommunityDetecting(dataNodes, dataLinks) {
    const filteredLinks = dataLinks.filter(l => l.tag === 1 || l.tag === 0);
    // console.log(filteredLinks);
    const links = JSON.parse(JSON.stringify(filteredLinks));
    // const links = filteredLinks;
    // console.log(filteredLinks);
    // console.log(dataNodes);
    for (let i = 0; i < links.length; i += 1) {
      // console.log(links[i]);
      links[i].source = dataNodes.findIndex((ele) => {
        // console.log(ele.id, filteredLinks[i].source, ele.id === filteredLinks[i].source.id);
        return ele.id === filteredLinks[i].source.id || ele.id === filteredLinks[i].source;
      });
      links[i].target = dataNodes.findIndex((ele) => {
        return ele.id === filteredLinks[i].target;
      });
    }
    // console.log(index, testLinks);
    // console.log(links);
    // console.log(filteredLinks);
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

  // function communityDetecting() {
  //   const l = JSON.parse(JSON.stringify(set.links));
  //   // console.log(links);
  //   for (let i = 0; i < l.length; i += 1) {
  //     // console.log(links[i]);
  //     l[i].source = set.nodes.findIndex(ele => ele.titleTerm === set.links[i].source);
  //     l[i].target = set.nodes.findIndex(ele => ele.titleTerm === set.links[i].target);
  //   }
  //   netClustering.cluster(set.nodes, l);
  // }
}

export { OpinionLeader };
