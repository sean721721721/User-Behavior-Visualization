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
import Chart from 'react-google-charts';
import netClustering from 'netclustering';
import sentiment from 'multilang-sentiment';
import { string } from 'prop-types';
import * as jsnx from 'jsnetworkx';
import Louvain from './jLouvain';

const SetNumOfNodes = 200;
class Graph extends Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.state = { ...props };
    this.drawWordTree = this.drawWordTree.bind(this);
  }

  componentDidMount() {
    console.log('vis_DidMount');
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (JSON.stringify(this.props) === JSON.stringify(nextProps)) {
      console.log('vis not update !');
      return false;
    }
    console.log('vis update !');
    this.props = nextProps;
    this.drawwithlabels();
    return true;
  }

  drawwithlabels() {
    // var sentiment = require('multilang-sentiment');
    // var tokens = ['世界','就','是','一个','疯子','的','囚笼'];
    // const result = sentiment('Cats are totally amazing!');
    // console.log(result);
    // props[i][0]== userID, props[i][1]== articleIndex, props[i][0]== articlePostTime;
    // const { visprops } = this.props;
    // const { word, post } = this.props;
    console.log(this.props);
    const { date } = this.props;
    const startDate = new Date(date.$gte);
    const endDate = new Date(date.$lt);
    const timePeriod = endDate - startDate;
    // const props = JSON.parse(JSON.stringify(visprops)); // clone props;
    // const set = { nodes: [], links: [] };
    const { set: propsSet } = this.props;
    let set = JSON.parse(JSON.stringify(propsSet));
    // console.log(set);
    let link;
    let node;
    let links;
    let nodes;
    const userList = [{ id: '', count: 0, term: [] }];
    const propsUserList = [{ id: '', count: 0, term: [] }];
    const { initLinks } = this.props;
    console.log(initLinks);
    // const initLinks = [];
    const removeWords = ['新聞', '八卦', '幹嘛', '問卦', '爆卦'];
    const groupedWords = [];
    // const max = Math.min(props.length, SetNumOfNodes);
    const someData = [];
    const pi = Math.PI;
    const LinkThreshold = 0.1;
    const pie = d3.pie()
      .value(d => d.count)
      .sort(null);
    const pieColor = d3.schemeTableau10;
    const keyPlayerThreshold = 0;
    const G = new jsnx.Graph();
    const termColor = d3.interpolateBlues;
    let selectedCluster = -1;
    let fontSizeThreshhold = 20;
    let sliderHasBeenLoaded = 0;
    const NodeHiding = 1;
    let cellData = { nodes: [], links: [] };
    // G.addNodesFrom([1, 2, 3, 4, 5]);
    // G.addEdgesFrom([[1, 2], [1, 3], [1, 5], [1, 4]]);
    // console.log(G);
    // let betweenness = jsnx.betweennessCentrality(G);
    // let degree = jsnx.degree(G);
    // // var eigenvector = jsnx.eigenvectorCentrality(G);
    // console.log('betweenness:', betweenness);
    // console.log(degree);
    // props.splice(SetNumOfNodes); // Splice props to match properly size

    // mergeTermNodes(); // props combine any titleterms with the equal users
    // removeTermNodesWithRemovedWords();

    // for (let i = 0; i < props.length - 1; i += 1) {
    //   props[i][1] = [...new Set(props[i][1])];
    //   props[i][1].sort();
    // }

    // computePropsUserList(); // Computing props user list
    // propsDataStructureBuild(); // props[i][1]=['id', 'id'] => props[i][1]=[{id:, count:, ... }]
    // mergeTermNodesWithUserCountEqualsOne(); // Combine all user with count == 1
    // setNodes(); // Nodes setting

    // for (let i = 0; i < set.nodes.length - 1; i += 1) {
    //   set.nodes[i].children.sort();
    // }

    // computeNodesUserList(); // Computing user list
    // computeNumOfUsersHaveSameTerm(); // compute how many same users each term has
    // LinkTitleWordByArticleIndex(); // title words links by articleIndex
    // reduceLinksByThreshHold(LinkThreshold);
    // setSpiralDataStructure();
    buildGraph();

    communityDetecting();
    const origSet = JSON.parse(JSON.stringify(set));
    const term_community = getTermCommunity();
    // console.log(term_community);
    const termCentrality = {
      Betweenness: jsnx.betweennessCentrality(G, { weight: true })._stringValues,
      EigenVector: jsnx.eigenvectorCentrality(G)._stringValues,
      Cluster: jsnx.clustering(G)._stringValues,
    };

    // console.log(termCentrality);

    const width = 900;
    const height = 900;
    let svg = d3.select('#graph');
    const realWidth = svg.attr('width');
    const realHeight = svg.attr('height');
    svg.selectAll('*').remove();

    svg = svg
      .call(d3.zoom().scaleExtent([1 / 2, 8]).on('zoom', zoomed))
      .append('g');
    // .attr('transform', 'translate(40,0)')
    // .attr('transform', 'scale(0.5,0.5)');

    const color = d3.schemeTableau10.concat(d3.schemeSet1);
    // console.log(color);
    const simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => (typeof d.id === 'number' ? d.id : d.titleTerm)))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('charge', d3.forceManyBody().distanceMax(1000))
      .force('center', d3.forceCenter(width / 2, height / 2));

    let conutOfClickedNode = 0;

    // Table with inline Bar chart

    const chartWidth = '100px';

    // Setup the scale for the values for display, use abs max as max value
    const x = d3.scaleLinear()
      .domain([0, d3.max(set.nodes, d => d.children.length)])
      .range(['0%', '100%']);
    const leftSvg = d3.select('#barChart');

    // const timeLineSvg = d3.select('#timeLine');

    let heatMapSvg = d3.select('#timeLine');
    let articleCellSvg = d3.select('#articleCell');
    const wordTreeSvg = d3.select('#wordTree')
      .call(d3.zoom().scaleExtent([1 / 2, 8]).on('zoom', wordTreeSvgZoomed));

    // const buttonDiv = d3.select(this.myRef.current).select('#button');
    const buttonDiv = d3.select('#button')
      .attr('width', 'auto')
      .style('background', 'white')
      .text('Centrality: ');
    buttonDiv.selectAll('*').remove()
      .append('form');
    // console.log(buttonDiv);
    const betweennessButton = buttonDiv.append('label')
      .text('betweenness')
      .append('input')
      .text('betweenness')
      .attr('type', 'radio')
      .attr('name', 'centrality')
      .attr('value', 'betweenness')
      .on('click', () => {
        update();
      });
    const eigenvectorButton = buttonDiv.append('label')
      .text('eigenvector')
      .append('input')
      .attr('type', 'radio')
      .attr('name', 'centrality')
      .attr('value', 'eigenvector')
      .property('checked', true)
      .on('click', () => {
        console.log(this.value);
        update(this.value);
      });
    d3.select('#betweenness').on('input', update());

    const nevigator = d3.select('#button');
    nevigator.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '24px')
      .attr('x', '50%')
      .attr('y', '10%')
      .text(`${'Centrality:'} ${'    '}`);
    nevigator.append('span')
      .attr('font-size', '24px')
      .attr('margin', '5px')
      .text('Low');

    const slider = nevigator.append('input');
    slider.datum({})
      .attr('type', 'range')
      .attr('class', 'custom-range')
      .attr('id', 'customRange1')
      .style('width', '150px')
      .style('padding-top', '15px')
      .attr('value', fontSizeThreshhold)
      .attr('min', 0)
      .attr('max', 100)
      .attr('step', 1)
      .on('input', () => {
        sliderHasBeenLoaded = 1;
        update();
      });

    nevigator.append('text')
      .attr('id', 'sizeThreshold')
      .attr('text-anchor', 'middle')
      .attr('font-size', '24px')
      .attr('x', '50%')
      .attr('y', '10%')
      .text('High');
    // update();

    function update() {
      if (sliderHasBeenLoaded) {
        fontSizeThreshhold = d3.select('#customRange1').property('value');
        // nevigator.select('#sizeThreshold').text(fontSizeThreshhold);
      }
      console.log(fontSizeThreshhold);
      // console.log('svgupdate');
      // console.log(initLinks);
      const selectedCentrality = d3.select('input[name="centrality"]:checked').property('value');
      // console.log(selectedCentrality);
      const termCentralityArr = {
        betweennessArr: Object.values(termCentrality.Betweenness),
        eigenvectorArr: Object.values(termCentrality.EigenVector),
        clusterArr: Object.values(termCentrality.Cluster),
      };

      const normalizeBetweenness = d3.scaleLinear()
        .domain([
          Math.min(...termCentralityArr.betweennessArr),
          Math.max(...termCentralityArr.betweennessArr),
        ]).range([5, 50]);

      const normalizeEigenvector = d3.scaleLinear()
        .domain([
          Math.min(...termCentralityArr.eigenvectorArr),
          Math.max(...termCentralityArr.eigenvectorArr),
        ]).range([5, 50]);
      const normalizeCluster = d3.scaleLinear()
        .domain([
          Math.min(...termCentralityArr.clusterArr),
          Math.max(...termCentralityArr.clusterArr),
        ]).range([0.2, 0.8]);

      console.log(set);
      ({ nodes, links } = set);
      svg.selectAll('g').remove();

      link = svg.selectAll('line')
        .data(set.links);

      link.exit().remove();
      const linkEnter = link.enter()
        // .append('g')
        .append('line')
        .attr('class', 'links')
        .style('z-index', -1)
        .attr('visibility', 'hidden')
        .attr('stroke', d => d.color)
        .attr('stroke-width', d => (d.value < 100000 ? d.value : 3));
      link = linkEnter.merge(link);
      console.log(realWidth, realHeight);
      const voronoi = d3.voronoi().extent([[-1000, -1000], [4000, 2000]]);

      const polygons = svg.append('g')
        .attr('class', 'polygons')
        .selectAll('polygon')
        .data(set.nodes)
        .enter()
        .append('polygon')
        .style('fill', (d) => {
          if (d.group === 1) {
            const cluster = d.cluster % 19;
            const betweennessColor = d3.hsl(color[cluster]);
            return betweennessColor;
          }
          return 'green';
        })
        .style('fill-opacity', 0.2)
        .style('stroke', 'white')
        .style('stroke-width', '0');
        // .call(d3.drag()
        //   .on('start', dragstarted)
        //   .on('drag', dragged)
        //   .on('end', dragended));


      // svg.selectAll('g').remove();
      node = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(set.nodes);
      // node.exit().remove();
      // let node = svg.selectAll('g').data(set.nodes)
      const nodeEnter = node.enter()
        .append('g')
        .attr('class', 'nodes')
        .style('z-index', 1)
        .attr('opacity', (d) => {
          if (d.group !== 2 && d.connected === 0) return 0.2;
          if (d.show === 0) return 0.2;
          return 1;
        })
        .on('click', clicked)
        .on('mouseover', mouseOver(0.1))
        .on('mouseout', mouseOut)
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended));

      nodeEnter
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

      nodeEnter.append('path')
        .attr('id', d => d.titleTerm)
        .attr('d', (d) => {
          if (d.group === 1) {
            const circle_radius = centrality(selectedCentrality, termCentrality.EigenVector[d.titleTerm]) / 2;
            const erliestTime = new Date(d.date[0]);
            const latestTime = new Date(d.date[d.date.length - 1]);
            const arc = d3.arc()
              .innerRadius(circle_radius + 2)
              .outerRadius(circle_radius + 3)
              .startAngle(((erliestTime - startDate) / timePeriod) * 360 * (pi / 180))
              .endAngle(((latestTime - startDate) / timePeriod) * 360 * (pi / 180));
            return arc();
          }
          // return 'M0';
        })
        .attr('fill', 'darkgray');

      const timeline = nodeEnter.selectAll('circle');
      // console.log(timeline);

      timeline.data(d => (d.group === 1 ? d.date : d))
        .enter()
        .append('g')
        // .selectAll('line')
        .append('line')
        .attr('transform', (d) => {
          const erliestTime = new Date(d);
          const rotate = `rotate(${((erliestTime - startDate) / timePeriod) * 360})`;
          return rotate;
        })
        .attr('x1', 0)
        .attr('y1', function setY_2(d) {
          let term = d3.select(this.parentNode.parentNode);
          term = term.select('path').attr('id');
          return -centrality(selectedCentrality, { titleTerm: term }) / 2;
        })
        .attr('x2', 0)
        .attr('y2', function setY_2(d) {
          let term = d3.select(this.parentNode.parentNode);
          term = term.select('path').attr('id');
          return (-centrality(selectedCentrality, { titleTerm: term }) / 2 - 5);
        })
        .attr('opacity', () => (NodeHiding ? 0 : 1))
        .style('stroke', 'green')
        .style('stroke-width', '1px');

      const keyPlayerCircles = nodeEnter.selectAll('circle');

      // keyPlayerCircles.data(d => (d.group === 2 ? [d] : d))
      //   .enter()
      //   .append('g').append('circle')
      //   .attr('r', d => d.size + Math.sqrt(d.postCount))
      //   .attr('fill', 'white')
      //   .style('fill-opacity', 1)
      //   .attr('stroke', 'gray')
      //   .attr('stroke-width', 2)
      //   .attr('stroke-opacity', d => (d.postCount >= 5 ? 1 : 0));

      const circles = nodeEnter.append('circle')
        .transition()
        .duration(500)
        .attr('r', d => (d.group === 1 ? centrality(selectedCentrality, d) / 2 : d.size / 2))
        .attr('fill', (d) => {
          if (d.group === 1) {
            const cluster = d.cluster % 19;
            const betweennessColor = d3.hsl(color[cluster]);
            return betweennessColor;
          }
          if (d.group === 2) {
            return 'green';
          }
          return 'url(#pic_user)';
          // if (d.group !== 2) return color(d.group);
          // if (d.merge > 1) return color(d.group);
          // return 'url(#pic_user)';
        })
        .style('fill-opacity', () => (NodeHiding ? 0 : 1))
        .attr('stroke', (d) => {
          if (d.group !== 2) {
            if (d.tag === 1) return 'red'; // d.group !== 2 && d.tag === 1
            const cluster = d.cluster % 19;
            let strokeColor = d3.color(color[cluster]);
            strokeColor = strokeColor.darker();
            return strokeColor; // d.group !== 2 && d.tag !== 1
          }
          return 'gray'; // d.group === 2
        })
        .attr('stroke-width', d => (d.group === 1 ? 2 : 0.9))
        .attr('stroke-opacity', () => (NodeHiding ? 0 : 1));

      const pieGroup = nodeEnter.append('g');
      const path = pieGroup.selectAll('path')
        .data((d) => {
          if (d.group === 3) {
            // const totalMessageCount = d.data.reduce((pre, next) => pre.count + next.count);
            console.log(d.message_count);
            return pie(d.message_count);
          }
          return [];
        });

      path.enter().append('path')
        .attr('fill', (d) => {
          switch (d.data.type) {
            case 'push':
              return pieColor[4];
            case 'boo':
              return pieColor[2];
            case 'neutral':
              return pieColor[5];
            default:
              break;
          }
          return 'gray';
        })
        .attr('d', (d) => {
          // console.log(d);
          const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(5 + Math.sqrt(d.data.radius))
            .startAngle(d.startAngle)
            .endAngle(d.endAngle);
          return arc();
        })
        .attr('stroke', 'white')
        .attr('stroke-width', '0.2px');


      const lables = nodeEnter.append('text')
        .text((d) => {
          // if (d.merge > 1) return d.numOfUsr;
          // if (d.group === 2) return d.postCount;
          if (d.group === 2) return '';
          return d.titleTerm;
        })
        .style('text-anchor', 'middle')
        .attr('font-family', 'Microsoft JhengHei')
        .attr('font-size', (d) => {
          if (centrality(selectedCentrality, d) <= fontSizeThreshhold) {
            return '0px';
          }
          return `${5 + centrality(selectedCentrality, d)}px`;
        })
        .attr('color', '#000')
        // .attr('visibility', d => (d.group !== 2 || d.merge > 1 ? 'visible' : 'hidden'))
        // .attr('x', d => (d.group !== 1 ? -3 : -d.size))
        .attr('y', (d) => {
          if (NodeHiding) return 0;
          return d.group !== 1 ? 3 : centrality(selectedCentrality, d) * 2 + 5;
        });

      nodeEnter.append('title')
        .text(d => d.titleTerm);
      node = nodeEnter.merge(node);

      const strengthScale = d3.scaleLinear()
        .domain([
          Math.min(...set.links.map(l => l.value)),
          Math.max(...set.links.map(l => l.value)),
        ]).range([1, 100]);

      simulation
        .nodes(set.nodes)
        .on('tick', ticked);

      simulation.alphaDecay(0.005)
        .force('link')
        .links(set.links)
        .distance(d => 500 / strengthScale(d.value));
      // .strength((d) => {
      //   console.log(strengthScale(d.value));
      //   return strengthScale(d.value);
      // });

      simulation.force('collision', d3.forceCollide(d => (d.group === 1 ? centrality(selectedCentrality, d) / 2 + 2 : d.size / 2 + 2)));
      // .distance(d => 300 / d.value);
      // .strength(1);

      leftSvg.selectAll('*').remove();

      drawTable(term_community);
      // drawTimeLine();
      drawHeatMap();
      // drawWordTree();

      function articleCell(cellNodes, cellLinks, cellIndex) {
        console.log(cellNodes);
        console.log(cellLinks);
        // ({ nodes, links } = data);
        articleCellSvg.selectAll('g').remove();
        articleCellSvg = articleCellSvg
          .call(d3.zoom().scaleExtent([1 / 2, 8]).on('zoom', articleCellZoomed))
          .append('g');

        let cellLink = articleCellSvg.selectAll('line')
          .data(cellLinks);

        link.exit().remove();
        const cellLinkEnter = cellLink.enter()
          // .append('g')
          .append('line')
          .attr('class', 'links')
          .style('z-index', -1)
          .attr('visibility', 'hidden')
          .attr('stroke', d => d.color)
          .attr('stroke-width', d => (d.value < 100000 ? d.value : 3));
        cellLink = cellLinkEnter.merge(link);
        console.log(realWidth, realHeight);
        const cellVoronoi = d3.voronoi().extent([[-1000, -1000], [4000, 2000]]);

        const cellPolygons = articleCellSvg.append('g')
          .attr('class', 'polygons')
          .selectAll('polygon')
          .data(cellNodes)
          .enter()
          .append('polygon')
          .style('fill', (d) => {
            if (d.group === 1 || d.group === 3) {
              const cluster = d.cluster % 19;
              const betweennessColor = d3.hsl(color[cluster]);
              return betweennessColor;
            }
            return 'green';
          })
          .style('fill-opacity', 0.2)
          .style('stroke', 'white')
          .style('stroke-width', '0');

        let cellNode = articleCellSvg.append('g')
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
          .on('click', clicked)
          .on('mouseover', mouseOver(0.1))
          .on('mouseout', mouseOut)
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

        cellNodeEnter.append('path')
          .attr('id', d => d.titleTerm)
          .attr('d', (d) => {
            if (d.group === 1) {
              const circle_radius = centrality(selectedCentrality, termCentrality.EigenVector[d.titleTerm]) / 2;
              const erliestTime = new Date(d.date[0]);
              const latestTime = new Date(d.date[d.date.length - 1]);
              const arc = d3.arc()
                .innerRadius(circle_radius + 2)
                .outerRadius(circle_radius + 3)
                .startAngle(((erliestTime - startDate) / timePeriod) * 360 * (pi / 180))
                .endAngle(((latestTime - startDate) / timePeriod) * 360 * (pi / 180));
              return arc();
            }
            // return 'M0';
          })
          .attr('fill', 'darkgray');

        const cellKeyPlayerCircles = cellNodeEnter.selectAll('circle');

        const cellCircles = cellNodeEnter.append('circle')
          .transition()
          .duration(500)
          .attr('r', d => (d.group === 1 ? centrality(selectedCentrality, d) / 2 : d.size / 2))
          .attr('fill', (d) => {
            if (d.group === 1) {
              const cluster = d.cluster % 19;
              const betweennessColor = d3.hsl(color[cluster]);
              return betweennessColor;
            }
            if (d.group === 2) {
              return 'green';
            }
            return 'url(#pic_user)';
          })
          .style('fill-opacity', () => (NodeHiding ? 0 : 1))
          .attr('stroke', (d) => {
            if (d.group === 3) {
              return 'red';
            }
            if (d.group !== 2) {
              if (d.tag === 1) return 'red'; // d.group !== 2 && d.tag === 1
              const cluster = d.cluster % 19;
              let strokeColor = d3.color(color[cluster]);
              strokeColor = strokeColor.darker();
              return strokeColor; // d.group !== 2 && d.tag !== 1
            }
            return 'gray'; // d.group === 2
          })
          .attr('stroke-width', d => (d.group === 1 ? 2 : 0.9))
          .attr('stroke-opacity', () => (NodeHiding ? 0 : 1));

        const cellPieGroup = cellNodeEnter.append('g');
        const cellPath = cellPieGroup.selectAll('path')
          .data((d) => {
            if (d.group === 3) {
              // const totalMessageCount = d.data.reduce((pre, next) => pre.count + next.count);
              // console.log(d.message_count);
              return pie(d.message_count);
            }
            return [];
          });

        cellPath.enter().append('path')
          .attr('fill', (d) => {
            switch (d.data.type) {
              case 'push':
                return pieColor[4];
              case 'boo':
                return pieColor[2];
              case 'neutral':
                return pieColor[5];
              default:
                break;
            }
            return 'gray';
          })
          .attr('d', (d) => {
            // console.log(d);
            const arc = d3.arc()
              .innerRadius(0)
              .outerRadius(5 + Math.sqrt(d.data.radius))
              .startAngle(d.startAngle)
              .endAngle(d.endAngle);
            return arc();
          })
          .attr('stroke', 'white')
          .attr('stroke-width', '0.2px');


        const cellLables = cellNodeEnter.append('text')
          .text(d => d.author)
          .style('text-anchor', 'middle')
          .attr('font-family', 'Microsoft JhengHei')
          .attr('font-size', '10px')
          .attr('color', '#000')
          .attr('y', (d) => {
            if (NodeHiding) return 0;
            return d.group !== 1 ? 3 : centrality(selectedCentrality, d) * 2 + 5;
          });

        cellNodeEnter.append('title')
          .text(d => d.titleTerm);
        cellNode = cellNodeEnter.merge(node);

        const cellStrengthScale = d3.scaleLinear()
          .domain([
            Math.min(...set.links.map(l => l.value)),
            Math.max(...set.links.map(l => l.value)),
          ]).range([1, 100]);

        const cellForceSimulation = d3.forceSimulation()
          .force('link', d3.forceLink().id(d => d.title))
          .force('charge', d3.forceManyBody().strength(-300))
          .force('charge', d3.forceManyBody().distanceMax(1000))
          .force('center', d3.forceCenter((100 * cellIndex) / 2, 500 / 2));

        cellForceSimulation
          .nodes(cellNodes)
          .on('tick', cellTicked);

        cellForceSimulation.alphaDecay(0.005)
          .force('link')
          .links(cellLinks)
          .distance(d => 100);

        // cellForceSimulation.force('collision', d3.forceCollide(d => d.size));
        // leftSvg.selectAll('*').remove();

        function cellTicked() {
          // console.log(data.nodes[0]);
          if (data.nodes[0].x) {
            const cellPolygonShapes = voronoi(data.nodes.map(d => [d.x, d.y])).polygons();
            // console.log(cellPolygonShapes);
            cellPolygons.attr('points', (d, i) => cellPolygonShapes[i]);
          }
          cellLink
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
          cellNode
            .attr('transform', d => `translate( ${d.x}, ${d.y})`);
        }
      }

      function drawTable(data) {
        const table = leftSvg.append('foreignObject')
          .attr('width', '100%')
          .attr('height', '100%')
          .style('overflow-y', 'scroll')
          .append('xhtml:table');
        const th = table.append('tr');

        th.append('td').attr('class', 'data name')
          .attr('width', '25%')
          .text('Cluster');
        // th.append('td').attr('class', 'data name')
        //   .attr('width', '30px')
        //   .text('Color');

        // Create a table with rows and bind a data row to each table row
        const tr = table.selectAll('tr.data')
          .data(data)
          .enter()
          .append('tr')
          .attr('class', 'datarow')
          .style('border', d => (d.tag === 1 ? '2px black solid' : 'none'))
          .on('mouseover', mouseOver(0.1))
          .on('mouseout', mouseOut)
          .on('click', clusterClicked);

        // Set the even columns
        d3.selectAll('.datarow').filter(':nth-child(even)')
          .style('background', 'whitesmoke');

        // Create the name column
        // tr.append('td').attr('class', 'data name')
        //   .text(d => d.cluster);

        // // Create the percent value column
        // tr.append('td').attr('class', 'data value')
        //   .text(d => (d.children === undefined ? 0 : d.children.length));

        // Create a column at the beginning of the table for the chart
        const chart = tr.append('td').attr('class', 'chart')
          .attr('width', '10px')
          .attr('padding-bottom', '2px')
          .attr('padding-top', '2px');

        // Create the div structure of the chart
        chart.append('div')
          .style('height', '17px')
          .attr('class', 'chart')
          .style('float', 'left')
          .style('width', '50%')
          .append('div')
          .style('height', '17px')
          .attr('class', 'positive');

        // Creates the positive div bar
        tr.select('div.positive')
          .style('width', '17px')
          .style('background-color', (d) => {
            const cluster = d.cluster % 19;
            const betweennessColor = d3.hsl(color[cluster]);
            return betweennessColor;
          });
        // .transition()
        // .duration(500)
        // .style('width', d => (d.children !== undefined && d.children.length > 0 ?
        // x(d.children.length) : '0%'));
      }

      function drawHeatMap() {
        // Labels of row and columns
        const domainName = [];
        set.nodes.forEach((term) => {
          domainName.push(term.titleTerm);
        });

        const postDate = [];
        const currentDate = new Date(startDate.toDateString());
        while (currentDate <= endDate) {
          postDate.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }
        // console.log(postDate);

        // set the dimensions and margins of the graph
        // console.log(heatMapSvg);
        heatMapSvg.selectAll('*').remove();
        heatMapSvg = heatMapSvg
          .call(d3.zoom().scaleExtent([1 / 2, 8]).on('zoom', heatMapZoomed))
          .append('g');
        const margin = {
          top: 30, right: 30, bottom: 30, left: 30,
        };
        const heatMapWidth = postDate.length * 30;
        const heatMapHeight = domainName.length * 30;

        // append the svg object to the body of the page
        const heatMap = heatMapSvg.attr('height', heatMapHeight + margin.top + margin.bottom)
          // .attr('width', heatMapWidth + margin.left + margin.right + 200)
          .append('g')
          .attr('transform',
            `translate(${200}, ${margin.top})`);

        // Build X scales and axis:
        const heatMapX = d3.scaleBand()
          .range([0, heatMapWidth])
          .domain(postDate)
          .padding(0.1);
        heatMap.append('g')
          // .attr('transform', `translate(0, ${heatMapHeight})`)
          .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended))
          .call(d3.axisTop(heatMapX).tickFormat(d3.timeFormat('%m/%d')));

        // Build X scales and axis:
        const heatMapY = d3.scaleBand()
          .range([0, heatMapHeight])
          .domain(domainName)
          .padding(0.1);
        heatMap.append('g')
          .attr('class', 'axisY')
          .call(d3.axisLeft(heatMapY));

        // Build color scale
        // const myColor = d3.scaleLinear()
        //   .range(['white', '#69b3a2'])
        //   .domain([1, 100]);
        const myColor = d3.interpolateRdYlGn;

        set.nodes.forEach((obj) => {
          const numOfPostAtDate = {};
          postDate.forEach((ele) => {
            numOfPostAtDate[ele] = 0;
          });
          if (obj.date) {
            obj.date.forEach((ele) => {
              let postdate = new Date(ele);
              postdate = new Date(postdate.toDateString());
              numOfPostAtDate[postdate] += 1;
            });
            // console.log(numOfPostAtDate);
            heatMap.selectAll()
              .data(obj.date).enter()
              .append('rect')
              .attr('x', (d) => {
                const post_Date = new Date(d);
                return heatMapX(new Date(post_Date.toDateString()));
              })
              .attr('y', heatMapY(obj.titleTerm))
              .attr('width', heatMapX.bandwidth())
              .attr('height', heatMapY.bandwidth())
              .style('fill', (d) => {
                let postdate = new Date(d);
                postdate = new Date(postdate.toDateString());
                const percentage = numOfPostAtDate[postdate] / 100;
                return myColor(0.5 - (percentage / 2));
              });
          }
        });

        heatMap.select('.axisY')
          .attr('font-size', '15px');
        heatMap.selectAll('.axisY .tick')
          .on('click', clicked);
      }

      // function drawTimeLine() {
      //   // const { gatekeeperprops } = this.state;
      //   // const { ptt, news } = gatekeeperprops;
      //   // console.log(news, ptt);

      //   const xScale = d3.scaleTime().domain([startDate, endDate]).range([0, 100]);
      //   const colorScale = d3.scaleLinear().domain([0, 1]).range([0.0, 0.5]);
      //   const timeLinecolor = d3.interpolateSinebow;

      //   // function update() {
      //   timeLineSvg.selectAll('*').remove();

      //   const formatTime = d3.timeFormat('%B %d, %Y');
      //   // const g = timeLineSvg.append('foreignObject')
      //   //   .attr('width', '100%')
      //   //   .attr('height', '100%')
      //   //   .style('overflow-y', 'scroll');
      //   // const spectrums = g.append('g');
      //   const spectrums = timeLineSvg.append('g');
      //   // spectrums.attr('transform', `translate(${width / 2 - 270}, -100) scale(1.2,1.2)`);
      //   const domainName = [];
      //   set.nodes.forEach((term) => {
      //     domainName.push(term.titleTerm);
      //   });

      //   const term_y = d3.scalePoint().range([0, domainName.length * 10]);
      //   term_y.domain(domainName);

      //   const date_x = d3.scaleTime().range([0, 900]);
      //   date_x.domain([startDate, endDate]);
      //   const colors = d3.schemeTableau10;
      //   console.log(colors);
      //   for (let i = 0; i < domainName.length; i += 1) {
      //     const postTime = spectrums.selectAll('line').data(set.nodes[i].date);
      //     postTime.enter()
      //       .append('circle')
      //       .attr('transform', 'translate(110,20)')
      //       .attr('cy', (i * 10) + 1)
      //       .attr('cx', d => date_x(new Date(d)))
      //       .attr('r', 2)
      //       .style('fill', colors[((i % 10) + 1)]);
      //   }

      //   // Add the x Axis
      //   const axisX = spectrums;
      //   const axisY = spectrums;

      //   axisY.append('g')
      //     .attr('transform', 'translate(110,20)')
      //     .call(d3.axisLeft(term_y).tickFormat(d => d));

      //   axisX.append('g')
      //     .attr('transform', 'translate(110,17)')
      //     .call(d3.axisTop(date_x).tickFormat(d3.timeFormat('%m/%d')));

      //   axisY.attr('color', 'black');
      // }

      // function drawWordTree() {
      //   wordTreeSvg.selectAll('*').remove();
      //   let treeData = {
      //     name: 'Top Level',
      //     children: [
      //       {
      //         name: 'Level 2: A',
      //         children: [
      //           { name: 'Son of A' },
      //           { name: 'Daughter of A' },
      //         ],
      //       },
      //       { name: 'Level 2: B' },
      //     ],
      //   };

      //   // Set the dimensions and margins of the diagram
      //   const margin = {
      //     top: 20, right: 90, bottom: 30, left: 90,
      //   };
      //   const treeWidth = 960 - margin.left - margin.right;
      //   const treeHeight = 500 - margin.top - margin.bottom;

      //   // append the svg object to the body of the page
      //   // appends a 'group' element to 'svg'
      //   // moves the 'group' element to the top left margin
      //   wordTreeSvg = wordTreeSvg.attr('fill', 'black')
      //     .style('background', 'white')
      //     .append('g')
      //     .attr('transform', `translate(${margin.left}, ${margin.top})`);

      //   let i = 0;
      //   const duration = 750;

      //   // declares a tree layout and assigns the size
      //   const treemap = d3.tree().size([treeHeight, treeWidth]);

      //   // Assigns parent, children, height, depth
      //   const root = d3.hierarchy(treeData, d => d.children);
      //   root.x0 = treeHeight / 2;
      //   root.y0 = 0;

      //   // Collapse after the second level
      //   // root.children.forEach(collapse);

      //   updateTree(root);

      //   // Collapse the node and all it's children
      //   // function collapse(d) {
      //   //   if(d.children) {
      //   //     d._children = d.children
      //   //     d._children.forEach(collapse)
      //   //     d.children = null
      //   //   }
      //   // }

      //   function updateTree(source) {
      //     // Assigns the x and y position for the nodes
      //     treeData = treemap(root);

      //     // Compute the new tree layout.
      //     const treeNodes = treeData.descendants();
      //     const treeLinks = treeData.descendants().slice(1);

      //     // Normalize for fixed-depth.
      //     treeNodes.forEach((d) => { d.y = d.depth * 180; });

      //     // ****************** Nodes section ***************************

      //     // Update the nodes...
      //     const treeNode = wordTreeSvg.selectAll('g.node')
      //       .data(treeNodes, (d) => {
      //         i += 1;
      //         if (d.id) {
      //           return d.id;
      //         }
      //         d.id = i;
      //         return d.id;
      //       });

      //     // Enter any new modes at the parent's previous position.
      //     const treeNodeEnter = treeNode.enter().append('g')
      //       .attr('class', 'node')
      //       .attr('transform', d => `translate(${source.y0},${source.x0})`)
      //       .on('click', click);

      //     // Add Circle for the nodes
      //     treeNodeEnter.append('circle')
      //       .attr('class', 'node')
      //       .attr('r', 1e-6)
      //       .style('fill', d => (d.childrenHide ? 'lightsteelblue' : '#fff'));

      //     // Add labels for the nodes
      //     treeNodeEnter.append('text')
      //       .attr('dy', '.35em')
      //       .attr('x', d => (d.children || d.childrenHide ? -13 : 13))
      //       .attr('text-anchor', d => (d.children || d.childrenHide ? 'end' : 'start'))
      //       .text(d => d.data.name);

      //     // UPDATE
      //     const nodeUpdate = treeNodeEnter.merge(treeNode);

      //     // Transition to the proper position for the node
      //     nodeUpdate.transition()
      //       .duration(duration)
      //       .attr('transform', d => `translate(${d.y}, ${d.x})`);

      //     // Update the node attributes and style
      //     nodeUpdate.select('circle.node')
      //       .attr('r', 10)
      //       .style('fill', d => (d.childrenHide ? 'lightsteelblue' : '#fff'))
      //       .attr('cursor', 'pointer')
      //       .attr('fill', '#fff')
      //       .attr('stroke', 'steelblue')
      //       .attr('stroke-width', '3px');


      //     // Remove any exiting nodes
      //     const nodeExit = treeNode.exit().transition()
      //       .duration(duration)
      //       .attr('transform', d => `translate(${source.y}, ${source.x})`)
      //       .remove();

      //     // On exit reduce the node circles size to 0
      //     nodeExit.select('circle')
      //       .attr('r', 1e-6);

      //     // On exit reduce the opacity of text labels
      //     nodeExit.select('text')
      //       .style('fill-opacity', 1e-6)
      //       .attr('font', '12px sans-serif');

      //     // ****************** links section ***************************

      //     // Update the links...
      //     const treeLink = wordTreeSvg.selectAll('path.link')
      //       .data(treeLinks, d => d.id);

      //     // Enter any new links at the parent's previous position.
      //     const treeLinkEnter = treeLink.enter().insert('path', 'g')
      //       .attr('class', 'link')
      //       .attr('fill', 'none')
      //       .attr('stroke', '#ccc')
      //       .attr('stroke-width', '2px')
      //       .attr('d', (d) => {
      //         const o = { x: source.x0, y: source.y0 };
      //         return diagonal(o, o);
      //       });

      //     // UPDATE
      //     const linkUpdate = treeLinkEnter.merge(treeLink);

      //     // Transition back to the parent element position
      //     linkUpdate.transition()
      //       .duration(duration)
      //       .attr('d', d => diagonal(d, d.parent));

      //     // Remove any exiting links
      //     const linkExit = treeLink.exit().transition()
      //       .duration(duration)
      //       .attr('d', (d) => {
      //         const o = { x: source.x, y: source.y };
      //         return diagonal(o, o);
      //       })
      //       .remove();

      //     // Store the old positions for transition.
      //     treeNodes.forEach((d) => {
      //       d.x0 = d.x;
      //       d.y0 = d.y;
      //     });

      //     // Creates a curved (diagonal) path from parent to the child nodes
      //     function diagonal(s, d) {
      //       const path = `M ${s.y} ${s.x}
      //               C ${(s.y + d.y) / 2} ${s.x},
      //                 ${(s.y + d.y) / 2} ${d.x},
      //                 ${d.y} ${d.x}`;

      //       return path;
      //     }

      //     // Toggle children on click.
      //     function click(d) {
      //       if (d.children) {
      //         d.childrenHide = d.children;
      //         d.children = null;
      //       } else {
      //         d.children = d.childrenHide;
      //         d.childrenHide = null;
      //       }
      //       updateTree(d);
      //     }
      //   }
      // }

      function ticked() {
        // console.log(set.nodes[0]);
        if (set.nodes[0].x) {
          const polygonShapes = voronoi(set.nodes.map(d => [d.x, d.y])).polygons();
          // console.log(polygonShapes);
          polygons.attr('points', (d, i) => polygonShapes[i]);
        }

        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);
        node
          .attr('transform', d => `translate( ${d.x}, ${d.y})`);
      }

      function clusterClicked(d) {
        console.log(`cluster: ${d.cluster} clicked!`);
        if (selectedCluster === d.cluster) {
          set.nodes.forEach((_node) => { _node.show = 1; });
        } else {
          set.nodes.forEach((_node) => {
            if (_node.cluster === d.cluster) {
              _node.show = 1;
            } else {
              _node.show = 0;
            }
          });
        }
        selectedCluster = d.cluster;
        update();
      }
      function clicked(d) {
        console.log('clicked');
        if (d3.event.defaultPrevented) return; // dragged
        if (typeof d === 'string') {
          d = set.nodes.find(ele => ele.titleTerm === d);
        }
        console.log(d);
        set.nodes.forEach((_node) => {
          if (isConnected(d, _node)) {
            if (_node.connected <= 0) _node.connected = 1;
            else _node.connected += 1;
          } else if (_node.connected === -1) {
            _node.connected = 0;
          }
        });

        if (d.tag === 0) {
          set.nodes.forEach((_node) => {
            // console.log(isConnected(d, _node));
            if (!isConnected(d, _node)) {
              // console.log(_node.titleTerm);
              set.links = set.links.filter(
                _link => _link.source.titleTerm !== _node.titleTerm
                  && _link.target.titleTerm !== _node.titleTerm,
              );
              // console.log(set.links);
              delete set.nodes[set.nodes.indexOf(_node)];
              set.nodes = set.nodes.filter(() => true);
            }
          });
          d3.select(this).select('circle').attr('stroke', 'red');

          d.children.forEach((id_1) => {
            if (id_1 != null) {
              if (id_1.titleTerm !== undefined) {
                // console.log(id_1.titleTerm);
                set.nodes.push({
                  titleTerm: id_1.titleTerm,
                  group: 3,
                  children: id_1.children,
                  tag: 0,
                  connected: -1,
                  x: d.x,
                  y: d.y,
                  size: 5 + Math.log2(id_1.children.length),
                });
                let num = 0;
                id_1.children.forEach((id) => {
                  num = (d.children.includes(id)) ? num + 1 : num;
                });
                set.links.push({
                  source: id_1.titleTerm,
                  target: d,
                  color: '#ffbb78',
                  tag: 0,
                  value: num,
                });
              }
            }
          });

          d.children.forEach((id_1) => {
            if (id_1 != null && id_1.id !== undefined) {
              // console.log(id_1.id);
              const checkUserId = obj => obj.titleTerm === id_1.id;
              if (!set.nodes.some(checkUserId)) {
                set.nodes.forEach((_node) => {
                  if (_node.children) {
                    _node.children.forEach((id_2) => {
                      if (id_1.id === id_2.id) {
                        if (id_1.postCount > keyPlayerThreshold) {
                          // console.log(id_1.id);
                          set.links.push({
                            source: id_1.id,
                            target: _node.titleTerm,
                            tag: 1,
                            color: '#ffbb78 ',
                            value: 1000000,
                          });
                        }
                      }
                    });
                  }
                });
                const existId = set.nodes.find(ele => ele.titleTerm === id_1.id);
                if (existId === undefined) {
                  // const { count } = userList.find(user => user.id === id_1.id);
                  if (id_1.postCount > keyPlayerThreshold) {
                    const articleReplyCount = id_1.responder.reduce((sum, next) => {
                      // console.log(sum, next.message_count);
                      // console.log(d.articleId, next.articleId);
                      if (d.articleId.includes(next.articleId)) {
                        const all = next.message_count.reduce((num, { count }) => num + count, 0);
                        // console.log(all);
                        return sum + all;
                      }
                      return sum + 0;
                    }, 0);
                    // console.log(articleReplyCount);
                    const size = (articleReplyCount / d.messageCount.all) * 50;
                    set.nodes.push({
                      titleTerm: id_1.id,
                      parentNode: d.titleTerm,
                      count: id_1.count,
                      group: 2,
                      tag: 1,
                      connected: 1,
                      merge: id_1.merge,
                      numOfUsr: id_1.numOfUsr,
                      postCount: id_1.postCount,
                      x: d.x,
                      y: d.y,
                      size,
                      responder: id_1.responder,
                    });
                  }
                }
                if (id_1.postCount > keyPlayerThreshold) {
                  set.links.push({
                    source: id_1.id,
                    target: d,
                    color: '#ffbb78',
                    tag: 1,
                    value: 1000000,
                  });
                }
              } else {
                const index = set.nodes.findIndex(_node => _node.titleTerm === id_1.id);
                set.nodes[index].connected += 1;
              }
            }
          });

          d.tag = 1;
          conutOfClickedNode += 1;
          const clickedNode = JSON.parse(JSON.stringify(d));
          cellData = { nodes: [clickedNode], links: [] };
          clickedNode.articles.forEach((article) => {
            cellData.nodes.push(article);
            cellData.links.push({
              source: article,
              target: clickedNode,
              color: '#ffbb78',
              tag: 1,
              value: 1,
            });
          });

          d.children.forEach((usr) => {
            if (usr.responder.length > 1) {
              for (let i = 0; i < usr.responder.length - 1; i += 1) {
                const temp = cellData.nodes.filter(n => n.articleId === usr.responder[i].articleId);
                for (let j = 1; j < usr.responder.length; j += 1) {
                  const next = cellData.nodes.filter(n => n.articleId === usr.responder[j].articleId);
                  cellData.links.push({
                    source: temp[0],
                    target: next[0],
                    color: '#ffbb78',
                    tag: 1,
                    value: 1,
                  });
                }
              }
            }
          });

          cellDataCommunityDetection(clickedNode);
          console.log(cellData);
          for (let i = 1; i < cellData.nodes.length; i += 1) {
            articleCell(cellData.nodes[i], cellData.links, i);
          }
        } else {
          set = JSON.parse(JSON.stringify(origSet));
          // console.log(set);
          // console.log(origSet);
          // d3.select(this).select('circle').attr('stroke', 'white');
          // node.data(set.nodes, (o) => {
          //   if (isConnected(d, o)) {
          //     const index_0 = set.nodes.findIndex(_node => (
          //       _node === undefined ? -1 : _node.titleTerm === o.titleTerm));
          //       console.log(o.titleTerm, index_0);
          //     console.log(set.nodes[index_0]);
          //     set.nodes[index_0].connected -= 1;
          //     // console.log(set.nodes[index_0].connected);
          //   }
          // });

          // node.style('fill-opacity', function(o) {
          //   return 1;
          // });

          if (d.group === 1) {
            // d.children.forEach((id_1) => {
            //   if (id_1 != null) {
            //     const index_1 = set.nodes.findIndex(
            //       _node => ((_node === undefined) ? -1 : _node.titleTerm === id_1.id),
            //     );

            //     set.nodes[index_1].connected -= 1;

            //     set.nodes.forEach((_node) => {
            //       if (_node.titleTerm === id_1.id && _node.connected <= 0) {
            //         delete set.nodes[set.nodes.indexOf(_node)];
            //         set.nodes = set.nodes.filter(() => true);
            //       }
            //     });

            //     const { length } = set.links;
            //     for (let j = 0; j < length; j += 1) {
            //       const pos = set.links.map(e => e.source.titleTerm).indexOf(id_1.id);
            //       if (pos !== -1) {
            //         const index_2 = set.nodes.findIndex(
            //           _node => (_node === undefined ? -1 : _node.titleTerm === id_1.id),
            //         );
            //         if (index_2 === -1) set.links.splice(pos, 1);
            //         else if (set.nodes[index_2] === undefined) set.links.splice(pos, 1);
            //       }
            //     }
            //   }
            // });
          } else {
            let uniquePostID = 0;
            d.responder.forEach((article) => {
              set.nodes.push({
                titleTerm: article.title,
                parentNode: d.titleTerm,
                count: article.message.length,
                message_count: article.message_count,
                group: 3,
                tag: 1,
                connected: 1,
                x: d.x,
                y: d.y,
                size: 5 + Math.sqrt(article.message_count.all),
                id: uniquePostID,
              });
              set.links.push({
                source: uniquePostID,
                target: d,
                color: '#ffbb78',
                tag: 1,
                value: 100000,
              });
              console.log(set.links);
              uniquePostID += 1;
            });
          }
          set.nodes = set.nodes.filter(() => true);
          set.links = set.links.filter(() => true);
          conutOfClickedNode -= 1;

          if (conutOfClickedNode === 0) set.nodes.forEach((_node) => { _node.connected = -1; });
          // mouseOut();
          d.tag = 0;
        }
        console.log('done!');
        update();
      }

      function mouseOut() {
        node.style('stroke-opacity', 1);
        node.style('fill-opacity', 1);
        node.selectAll('text').style('visibility', d => (d.group === 2 ? 'visible' : 'visible'));
        // node.selectAll('circle').style('fill', d => (d.group === 2 ? '#ff7f0e' : '1f77b4'));
        link.style('stroke-opacity', 1);
        // link.style('stroke', '#ddd');
      }

      function centrality(option, d) {
        if (option === 'eigenvector') return normalizeEigenvector(termCentrality.EigenVector[d.titleTerm]);
        return normalizeBetweenness(termCentrality.Betweenness[d.titleTerm]);
      }

      function cellDataCommunityDetection(clickedNode) {
        const filteredLinks = cellData.links.filter((l) => {
          if (l.target !== undefined) {
            // console.log(l.target);
            return l.target.titleTerm !== clickedNode.titleTerm;
          }
          return true;
        });
        console.log(filteredLinks);
        const cellLinks = JSON.parse(JSON.stringify(filteredLinks));
        // const cellLinks = JSON.parse(JSON.stringify(cellData.links));
        console.log(cellData);
        for (let i = 0; i < cellLinks.length; i += 1) {
          // console.log(links[i]);
          cellLinks[i].source = cellData.nodes.findIndex(ele => ele === cellData.links[i].source);
          cellLinks[i].target = cellData.nodes.findIndex(ele => ele === cellData.links[i].target);
        }
        console.log(cellLinks);
        netClustering.cluster(cellData.nodes, cellLinks);
      }
    }
    // build a dictionary of nodes that are linked
    const linkedByIndex = {};
    // console.log(initLinks);
    // console.log(links);
    initLinks.forEach((d) => {
      linkedByIndex[`${d.source.index},${d.target.index}`] = 1;
    });
    // console.log(linkedByIndex);
    // check the dictionary to see if nodes are linked
    function isConnected(a, b) {
      return linkedByIndex[`${a.index},${b.index}`] || linkedByIndex[`${b.index},${a.index}`] || a.index === b.index;
    }

    // fade nodes on hover
    function mouseOver(opacity) {
      return (d) => {
        node.selectAll('text').style('visibility', 'visible');
        // also style link accordingly
        link.style('stroke-opacity', o => (o.source === d || o.target === d ? 1 : opacity));
        // link.style('stroke', o => (o.source === d || o.target === d ? '#2E2E2E' : '#ddd'));
      };
    }

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

    // function removeDuplicates(array, key) {
    //   const lookup = new Set();
    //   return array.filter(obj => !lookup.has(obj[key]) && lookup.add(obj[key]));
    // }

    // function mergeTermNodes() {
    //   for (let i = 0; i < props.length - 1; i += 1) {
    //     for (let j = i + 1; j < props.length; j += 1) {
    //       let numOfSameUser = 0;
    //       for (let k = 0; k < props[i][1].length; k += 1) {
    //         const findTheSameUser = props[j][1].includes(props[i][1][k]);
    //         numOfSameUser = (findTheSameUser) ? numOfSameUser + 1 : numOfSameUser;
    //       }
    //       if (numOfSameUser === props[i][1].length && numOfSameUser === props[j][1].length) {
    //         // console.log(numOfSameUser, props[i][1], props[j][1]);
    //         const addingTerm = ` ${props[j][0]}`;
    //         props[i][0] += addingTerm;
    //         props.splice(j, 1);
    //         j -= 1;
    //       }
    //     }
    //   }
    // }

    // function removeTermNodesWithRemovedWords() {
    //   for (let i = 0; i < removeWords.length; i += 1) {
    //     const index = props.findIndex(prop => prop[0] === removeWords[i]);
    //     if (index !== -1) props.splice(index, 1);
    //   }
    // }

    // function computePropsUserList() {
    //   // console.log(props);
    //   for (let i = 0; i < props.length; i += 1) {
    //     if (props[i][1]) {
    //       props[i][1].forEach((userId) => {
    //         const existedUser = propsUserList.find(user => user.id === userId);
    //         if (existedUser) {
    //           existedUser.term.push(props[i][0]);
    //           existedUser.count += 1;
    //         } else {
    //           const count = post.filter(article => article.author === userId).length;
    //           propsUserList.push({
    //             id: userId,
    //             numOfUsr: 1,
    //             merge: 1,
    //             count: 1,
    //             postCount: count,
    //             term: [props[i][0]],
    //             responder: [],
    //           });
    //         }
    //       });
    //     }
    //   }

    //   post.forEach((article) => {
    //     const index = propsUserList.find(user => user.id === article.author);
    //     if (index) {
    //       const { push, boo, neutral } = article.message_count;
    //       const totalMessageCount = push + boo + neutral;
    //       index.responder.push({
    //         title: article.article_title,
    //         message: article.messages,
    //         message_count: [
    //           { type: 'push', count: article.message_count.push, radius: totalMessageCount },
    //           { type: 'boo', count: article.message_count.boo, radius: totalMessageCount },
    //           {
    //             type: 'neutral',
    //             count: article.message_count.neutral, radius: totalMessageCount },
    //         ],
    //       });
    //     }
    //   });
    //   // console.log(propsUserList);
    // }

    // function propsDataStructureBuild() {
    //   for (let i = 0; i < props.length; i += 1) {
    //     propsUserList.forEach((propsUser) => {
    //       const index = props[i][1].findIndex(user => user === propsUser.id);
    //       if (index !== -1) {
    //         props[i][1].splice(index, 1);
    //         props[i][1].push(propsUser);
    //       }
    //     });
    //   }
    // }

    // function mergeTermNodesWithUserCountEqualsOne() {
    //   // const findIndex = (array, num) => array.findIndex(ele => ele.id === num);
    //   // for (let i = 0; i < props.length; i += 1) {
    //   //   userList = props[i][1].filter(user => user.count === 1);
    //   //   // console.log(userList);
    //   //   let temp = '';
    //   //   let size = 0;
    //   //   for (let j = 1; j < userList.length; j += 1) {
    //   //     temp += ` ${userList[j].id}`;
    //   //     size += 1;
    //   //     const deleteIndex = findIndex(props[i][1], userList[j].id);
    //   //     props[i][1].splice(deleteIndex, 1);
    //   //   }
    //   //   if (userList.length > 0) {
    //   //     userList[0].id += temp;
    //   //     userList[0].numOfUsr += size;
    //   //     userList[0].merge = 2;
    //   //   }
    //   // }
    //   const hasMergedId = [];
    //   for (let i = 0; i < props.length; i += 1) { // which title
    //     for (let j = 0; j < props[i][1].length - 1; j += 1) {
    //       for (let k = j + 1; k < props[i][1].length; k += 1) {
    //         let equal = 1;
    //         // console.log(props[i][1][j].id, props[i][1][k].id);
    //         if (props[i][1][j].count === props[i][1][k].count && props[i][1][j].term) {
    //           for (let l = 0; l < props[i][1][j].term.length; l += 1) {
    //             if (!props[i][1][k].term.includes(props[i][1][j].term[l])) {
    //               // console.log(`${props[i][1][j].id} is not equal to ${props[i][1][k].id}`);
    //               equal = 0;
    //               break;
    //             }
    //           }
    //           if (equal === 1) {
    //             if (!hasMergedId.includes(props[i][1][k].id)) {
    //               // console.log(`${props[i][1][j].id} is equal to ${props[i][1][k].id}`);
    //               props[i][1][j].id += props[i][1][k].id;
    //               hasMergedId.push(props[i][1][k].id);
    //               props[i][1][j].responder = props[i][1][j].responder
    //                 .concat(props[i][1][k].responder);
    //               props[i][1][j].merge = 2;
    //               props[i][1][j].numOfUsr += 1;
    //               // console.log(props[i][1][j].postCount, props[i][1][k].postCount);
    //               props[i][1][j].postCount += props[i][1][k].postCount;
    //               // console.log(props[i][1][j].responder, props[i][1][k].responder);
    //             }
    //             props[i][1].splice(k, 1);
    //             k -= 1;
    //           }
    //         }
    //       }
    //     }
    //   }
    // }

    // function setNodes() {
    //   for (let i = 0; i < Math.min(props.length, SetNumOfNodes); i += 1) {
    //     if (props[i][0] != null) {
    //       const existKey = set.nodes.find(ele => ele.titleTerm === props[i][0]);
    //       if (existKey === undefined) {
    //         if (!removeWords.includes(props[i][0])) {
    //           set.nodes.push({
    //             titleTerm: props[i][0],
    //             children: props[i][1],
    //             _children: [],
    //             articleIndex: props[i][2],
    //             date: props[i][3],
    //             community: [['', 0]],
    //             group: 1,
    //             tag: 0,
    //             show: 1,
    //             connected: -1,
    //             size: 5 + Math.log2(props[i][1].length),
    //           });
    //           props[i][1].forEach((titleTerm) => {
    //             const existId = set.nodes.find(ele => ele.titleTerm === titleTerm);
    //             if (existId === undefined) {
    //               // if(id != null)
    //               //   set.nodes.push({id: id, group: 2, tag: 0, size: 5});
    //             }
    //           });
    //         }
    //       }
    //     }
    //   }
    // }

    // function computeNodesUserList() {
    //   for (let i = 0; i <= set.nodes.length; i += 1) {
    //     if (set.nodes[i]) {
    //       if (set.nodes[i].children) {
    //         set.nodes[i].children.forEach((userId) => {
    //           const existedUser = userList.find(x => x.id === userId);
    //           if (existedUser) {
    //             existedUser.term.push(set.nodes[i].titleTerm);
    //             existedUser.count += 1;
    //           } else {
    //             userList.push({ id: userId, count: 1, term: [set.nodes[i].titleTerm] });
    //           }
    //         });
    //       }
    //     }
    //   }
    //   // console.log(userList);
    // }

    // function computeNumOfUsersHaveSameTerm() {
    //   for (let i = 0; i < set.nodes.length - 1; i += 1) {
    //     for (let j = i + 1; j < set.nodes.length; j += 1) {
    //       let numOfSameUsers = 0;
    //       const largestNumOfSameUsers = 0;
    //       // let term = '';
    //       for (let k = 0; k < set.nodes[i].children.length; k += 1) {
    //         const haveTheSameUsers = set.nodes[j].children.includes(set.nodes[i].children[k]);
    //         if (haveTheSameUsers) numOfSameUsers += 1;
    //       }
    //       if (numOfSameUsers > set.nodes[i].community[0][1]) {
    //         set.nodes[i].community[0][0] = set.nodes[j].titleTerm;
    //         set.nodes[i].community[0][1] = numOfSameUsers;
    //       } else if (numOfSameUsers === set.nodes[i].community[0][1]) {
    //         set.nodes[i].community.push([set.nodes[j].titleTerm, numOfSameUsers]);
    //       }
    //     }
    //   }
    // }

    // function LinkTitleWordByArticleIndex() {
    //   let link_index = 0;
    //   for (let i = 0; i < set.nodes.length - 1; i += 1) {
    //     for (let j = i + 1; j < set.nodes.length; j += 1) {
    //       let count = 0;
    //       if (i !== j) {
    //         set.nodes[i].children.forEach((id1) => {
    //           if (set.nodes[j].children.includes(id1)) count += 1;
    //         });
    //         if (count !== 0) {
    //           set.links.push({
    //             source: set.nodes[i].titleTerm,
    //             target: set.nodes[j].titleTerm,
    //             tag: 0,
    //             color: '#d9d9d9 ',
    //             value: count,
    //           });
    //           initLinks.push({
    //             source: {
    //               titleTerm: set.nodes[i].titleTerm,
    //               index: i,
    //             },
    //             target: {
    //               titleTerm: set.nodes[j].titleTerm,
    //               index: j,
    //             },
    //             tag: 0,
    //             value: count,
    //           });
    //           link_index += 1;
    //         }
    //       }
    //     }
    //   }
    // }

    // function reduceLinksByThreshHold(threshold) {
    //   for (let i = 0; i < set.links.length; i += 1) {
    //     const { source, target } = set.links[i];
    //     const links_Strength = set.links[i].value;
    //     const source_Strength = set.nodes.find(_node => _node.titleTerm === source)
    //       .articleIndex.length;
    //     const target_Strength = set.nodes.find(_node => _node.titleTerm === target)
    //       .articleIndex.length;
    //     const link_threshold = (source_Strength + target_Strength) * threshold;
    //     if ((links_Strength * 2) < link_threshold || links_Strength === 1) {
    //       // console.log(link_threshold);
    //       // console.log(source, target);
    //       set.links.splice(i, 1);
    //       i -= 1;
    //     }
    //   }
    // }

    // function setSpiralDataStructure() {
    //   let postCount;
    //   for (let i = 0; i < 365; i += 1) {
    //     const currentDate = new Date();
    //     currentDate.setDate(currentDate.getDate() + i - 233);
    //     someData.push({
    //       date: currentDate,
    //       value: 0,
    //       group: currentDate.getMonth(),
    //     });
    //   }

    //   if (props[0]) postCount = props[0][3].length;
    //   // console.log(`posCount: ${postCount}`);
    //   for (let i = 0; i < postCount; i += 1) {
    //     someData.find((data) => {
    //       const xMonth = data.date.getMonth();
    //       const dataMonth = new Date(props[0][3][i]).getMonth();
    //       const xDate = data.date.getDate();
    //       const dataDate = new Date(props[0][3][i]).getDate();
    //       return xMonth === dataMonth && xDate === dataDate;
    //     }).value += 1;
    //   }
    // }

    function buildGraph() {
      const node_data = set.nodes.map(d => d.titleTerm);
      const edge_data = set.links.map(d => [d.source, d.target, d.value]);
      G.addNodesFrom(node_data);
      G.addEdgesFrom(edge_data);
    }

    function communityDetecting() {
      // const node_data = set.nodes.map(d => d.titleTerm);
      // const edge_data = set.links.map(d => [d.source, d.target, d.value]);
      // const node_data = ['id1', 'id2', 'id3', 'id4'];
      // const edge_data = [
      //   {source: 'id1', target: 'id2', weight: 10.0},
      //   {source: 'id2', target: 'id3', weight: 20.0},
      //   {source: 'id3', target: 'id1', weight: 30.0}
      // ];
      // const init_part = {id1: 0, id2: 0, id3: 1};
      // const community = Louvain().nodes(node_data).edges(edge_data);
      // const result = community();
      const links = JSON.parse(JSON.stringify(set.links));
      // console.log(links);
      for (let i = 0; i < links.length; i += 1) {
        // console.log(links[i]);
        links[i].source = set.nodes.findIndex(ele => ele.titleTerm === set.links[i].source);
        links[i].target = set.nodes.findIndex(ele => ele.titleTerm === set.links[i].target);
      }

      netClustering.cluster(set.nodes, links);
      // console.log(set.nodes, links);
      // console.log(community());
      // console.log(result);
    }

    function getTermCommunity() {
      let communityArr = [];
      set.nodes.forEach((d) => {
        const index = communityArr.findIndex(a => a.cluster === d.cluster);
        if (index !== -1) {
          communityArr[index].id.push(d.titleTerm);
        } else {
          communityArr.push({ cluster: d.cluster, id: [d.titleTerm] });
        }
      });

      communityArr = communityArr.sort((a, b) => (a.cluster > b.cluster ? 1 : -1));
      return communityArr;
    }

    function zoomed() {
      svg.attr('transform', d3.event.transform);
    }

    function heatMapZoomed() {
      heatMapSvg.attr('transform', d3.event.transform);
    }

    function articleCellZoomed() {
      articleCellSvg.attr('transform', d3.event.transform);
    }

    function wordTreeSvgZoomed() {
      wordTreeSvg.attr('transform', d3.event.transform);
    }
  }

  drawWordTree(d) {
    const options = {
      maxFontSize: 14,
      wordtree: {
        format: 'implicit',
        word: 'cats',
      },
    };
    // console.log(this);
    // console.log('wordtree');
    const style = {
      float: 'left',
      border: '2px solid gray',
    };
    return (
      <div className="wordTree" style={style}>
        <Chart
          // style={style}
          chartType="WordTree"
          width="100%"
          height="700px"
          data={d}
          options={options}
        />
      </div>
    );
  }

  render() {
    // const myRef = 'titleUserView';
    const { id, word } = this.props;
    return (
      <div className="graph" ref={this.myRef}>
        {/* <div style={{ width: '10%', height: '10px', float: 'left' }} /> */}
        {/* <div id="button" style={{ width: '100%', height: '20px', background: 'white' }} /> */}
        {/* <div ref={this.myRef}> */}
        <div className="barchart">
          <svg id="barChart" width="100%" height="100%" style={{ border: '2px solid gray' }} />
        </div>
        <div className="network">
          <div
            className="centralityOption"
            id="button"
            style={{
              width: '100%',
              height: '25px',
              padding: '0px 10px',
              // background: 'white',
              // border: '2px solid gray',
              // borderBottom: 'none',
            }}
          />
          <div id="slider" />
          <svg id="graph" width="100%" height="95%" style={{}} />
        </div>
        <div className="articleCell">
          <svg id="articleCell" width="100%" height="100%" />
        </div>
        {this.drawWordTree(word)}
        <div className="heatMap" style={{ border: '2px solid gray' }}>
          <svg id="timeLine" width="100%" height="600px" />
        </div>
        {/* </div> */}
      </div>
    );
  }
}

export default Graph;
