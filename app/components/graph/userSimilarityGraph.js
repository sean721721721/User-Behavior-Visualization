/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
/* eslint-disable linebreak-style */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
import * as d3 from 'd3';

export default function userSimilarityGraph(data, svg, user) {
  console.log(user);
  console.log(data);
  svg.selectAll('*').remove();
  // svg.attr('viewBox', '0 0 960 500');
  const h = parseFloat(d3.select('#timeLine').style('height'));
  const w = parseFloat(d3.select('#timeLine').style('width'));
  const xScaleWidth = w - 110;
  const timePeriod = 1;
  const timeScaleObjArr = [];
  const color = d3.schemeTableau10;
  const width = 500;
  const height = 500;

  const nodes = user.map(e => ({ name: e }));
  console.log(nodes);
  const edges = computeUserSimilarity(data, user);
  const edgesWeight = edges.map(e => e.value);
  console.log(edges);
  console.log(edgesWeight);
  const linkWidthScale = d3.scaleLinear()
    .domain([Math.min(...edgesWeight), Math.max(...edgesWeight)])
    .range([0, 10]);
  const dataset = { nodes, edges };

  svg = svg.append('g').attr('transform', 'scale(1, 1)');

  const simulation = d3.forceSimulation()
    .force('link', d3.forceLink().id(d => d.name))
    .force('charge', d3.forceManyBody())
    .force('center', d3.forceCenter(w / 2, h / 2));

  const link = svg.selectAll('line')
    .data(dataset.edges)
    .enter()
    .append('line')
    .style('stroke', '#ccc')
    .style('stroke-width', (d) => {
      return linkWidthScale(d.value);
    });

  const node = svg.append('g')
    .attr('class', 'nodes')
    .selectAll('g')
    .data(dataset.nodes)
    .enter()
    .append('g');

  const circles = node.append('circle')
    .attr('r', 10)
    .attr('fill', (d, i) => color[i])
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));

  const lables = node.append('text')
    .text(d => d.name)
    .attr('x', 6)
    .attr('y', 3);

  node.append('title')
    .text(d => d.name);

  simulation
    .nodes(dataset.nodes)
    .on('tick', ticked);

  simulation.force('link')
    .links(dataset.edges)
    .distance(d => 200)
    // .strength(d => Math.min(1, 0.1 * d.value));
    .strength(d => 0.3);

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  function ticked() {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    node
      .attr('transform', d => `translate(${d.x},${d.y})`);
  }

  function computeUserSimilarity(userAuthorRelationShipArr, userArr) {
    const userListArray = [];
    for (let i = 0; i < userAuthorRelationShipArr.length - 1; i += 1) {
      const temp = userAuthorRelationShipArr[i];
      for (let j = i + 1; j < userAuthorRelationShipArr.length; j += 1) {
        let linkValue = 0;
        const next = userAuthorRelationShipArr[j];
        temp.reply.forEach((e) => {
          const existedSameAuthor = next.reply.find(a => a.author === e.author);
          if (existedSameAuthor) {
            linkValue += Math.min(e.count, existedSameAuthor.count);
          }
        });
        userListArray.push({ source: temp.id, target: next.id, value: linkValue });
      }
    }
    return userListArray;
  }
}

export { userSimilarityGraph };
