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
import * as science from 'science';
import * as Queue from 'tiny-queue';
import * as reorder from 'reorder.js/index';
import sentiment from 'multilang-sentiment';
import { string } from 'prop-types';
import * as jsnx from 'jsnetworkx';
import Louvain from './jLouvain';
import { OpinionLeader } from './OpinionLeader';
import { AuthorTable } from './authorTable';
import WordTree from './wordTree';
import OpinionLeaderView from './OpinionLeaderView';
// import request from 'request';

const SetNumOfNodes = 200;
class Graph extends Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.state = {
      ...props,
      draw: 1,
      cellData: {},
      beforeThisDate: '',
      cellForceSimulation: '',
      totalAuthorInfluence: '',
      user: [],
      hover: 0,
    };
    this.drawWordTree = this.drawWordTree.bind(this);
  }

  componentDidMount() {
    // console.log(this.props.name);
    // console.log('vis_DidMount');
  }

  shouldComponentUpdate(nextProps, nextState) {
    // console.log(this.state, nextState);
    const { opState: thisOpState, ...thisWithoutOpState } = this.props;
    const { opState: nextOpstate, ...nextWithoutOpState } = nextProps;
    // console.log(this.props, nextProps);
    // console.log(thisWithoutOpState, nextWithoutOpState);
    if (!this.state.hover) {
      if (JSON.stringify(thisWithoutOpState) === JSON.stringify(nextWithoutOpState)) {
        if (JSON.stringify(this.state.word) === JSON.stringify(nextState.word)) {
          console.log('shouldUpdate? No!!');
          return false;
        }
      }
    }
    console.log('vis update !');
    if (JSON.stringify(thisWithoutOpState) !== JSON.stringify(nextWithoutOpState) || nextState.draw === 1) {
      this.props = nextProps;
      this.drawwithlabels();
    }
    return true;
  }

  drawWordTree = (d) => {
    const options = {
      maxFontSize: 14,
      wordtree: {
        format: 'implicit',
        word: 'cats',
      },
    };
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

  drawwithlabels() {
    const matrix = [
      [0, 0, 0, 1, 1, 1, 0, 0],
      [1, 1, 1, 0, 0, 0, 0, 0],
      [1, 1, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 0, 0],
      [1, 1, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 1],
    ];
    const gra = reorder.mat2graph(matrix);
    const perm = reorder.spectral_order(gra);
    console.log(perm);
    const permuted_mat = reorder.permute(matrix, perm);
    // permuted_mat = reorder.transpose(permuted_mat);
    // permuted_mat = reorder.permute(permuted_mat, perm);
    // permuted_mat = reorder.transpose(permuted_mat);

    // for (let i = 0; i < 10; i += 1) {
    //   gra = reorder.mat2graph(permuted_mat);
    //   perm = reorder.spectral_order(gra);
    //   console.log(perm);
    //   permuted_mat = reorder.permute(permuted_mat, perm);
    //   permuted_mat = reorder.transpose(permuted_mat);
    //   permuted_mat = reorder.permute(permuted_mat, perm);
    //   permuted_mat = reorder.transpose(permuted_mat);

    // }
    console.log(permuted_mat);

    console.log('draw');
    console.log(this.props);
    const $this = this;
    const { date } = this.props;
    const { word: titleTermArr } = this.props;
    const startDate = new Date(date.$gte);
    const endDate = new Date(date.$lt);
    const timePeriod = endDate - startDate;
    let beforeThisDate = startDate;
    const timeScale = d3.scaleTime().domain([startDate, endDate]).range([0, 100]);
    const { set: propsSet } = this.props;
    let set = JSON.parse(JSON.stringify(propsSet));
    const authorSet = removeTermLayer(set);
    console.log(authorSet);
    // console.log(set);
    let link;
    let node;
    let links;
    let nodes;
    const userList = [{ id: '', count: 0, term: [] }];
    const propsUserList = [{ id: '', count: 0, term: [] }];
    const { initLinks } = this.props;

    const removeWords = ['新聞', '八卦', '幹嘛', '問卦', '爆卦'];
    const groupedWords = [];

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
    let fontSizeThreshhold = 0;
    let sliderHasBeenLoaded = 0;
    const NodeHiding = 1;
    const cellData = { nodes: [], links: [] };
    let totalAuthorInfluence = 0;
    const svgwidth = parseFloat(d3.select('#graph').style('width'));
    const svgHeight = parseFloat(d3.select('#graph').style('height'));
    const authorInfluenceThreshold = 100;
    const articleInfluenceThreshold = 1;
    const topAuthorThreshold = 8;

    buildGraph();

    communityDetecting();
    const origSet = JSON.parse(JSON.stringify(set));

    const termCentrality = {
      Betweenness: {},
      EigenVector: {},
      Cluster: {},
    };

    try {
      termCentrality.Betweenness = jsnx.betweennessCentrality(G, { weight: true })._stringValues;
      termCentrality.EigenVector = jsnx.eigenvectorCentrality(G)._stringValues;
      termCentrality.Cluster = jsnx.clustering(G)._stringValues;
    } catch (error) {
      console.log(error);
      Object.keys(G.node._stringValues).map((key, index) => {
        termCentrality.Betweenness[key] = 1;
        termCentrality.EigenVector[key] = 1;
        termCentrality.Cluster[key] = 1;
        return true;
      });
    }

    const width = 900;
    const height = 900;
    let svg = d3.select('#graph');
    let heatMapSvg = d3.select('#timeLine');
    const leftSvg = d3.select('#barChart');
    const authorTable = d3.select('#authorList');
    const realWidth = svg.attr('width');
    const realHeight = svg.attr('height');
    svg.selectAll('*').remove();

    svg = svg
      .call(d3.zoom().scaleExtent([1 / 2, 8]).on('zoom', zoomed))
      .append('g');

    const color = d3.schemeTableau10.concat(d3.schemeSet1);
    const simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => (typeof d.id === 'number' ? d.id : d.titleTerm)))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('charge', d3.forceManyBody().distanceMax(1000))
      .force('center', d3.forceCenter(svgwidth / 2, svgHeight / 2));

    const cellForceSimulation = d3.forceSimulation()
      .force('link', d3.forceLink().id((d) => {
        if (d.group === 1) return d.titleTerm;

        return d.articleId ? d.articleId : d.id;
      }))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('charge', d3.forceManyBody().distanceMax(1000))
      .force('center', d3.forceCenter(0, 0));

    let conutOfClickedNode = 0;

    // Table with inline Bar chart

    const chartWidth = '100px';

    // Setup the scale for the values for display, use abs max as max value
    const x = d3.scaleLinear()
      .domain([0, d3.max(set.nodes, d => d.children.length)])
      .range(['0%', '100%']);

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

    const navigator = d3.select('#button');
    // navigator.append('text')
    //   .attr('text-anchor', 'middle')
    //   .attr('font-size', '24px')
    //   .attr('x', '50%')
    //   .attr('y', '10%')
    //   .text(`${'Centrality:'} ${'    '}`);
    // navigator.append('span')
    //   .attr('font-size', '24px')
    //   .attr('margin', '5px')
    //   .text('Low');

    const slider = navigator.append('input');
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

    // navigator.append('text')
    //   .attr('id', 'sizeThreshold')
    //   .attr('text-anchor', 'middle')
    //   .attr('font-size', '24px')
    //   .attr('x', '50%')
    //   .attr('y', '10%')
    //   .text('High');

    const cellNavigator = d3.select('#timeSlider');
    cellNavigator.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '24px')
      .attr('x', '50%')
      .attr('y', '10%')
      .text(`${'Date:'} ${'    '}`);
    cellNavigator.append('span')
      .attr('font-size', '24px')
      .attr('margin', '5px')
      .text('Earliest');

    const timeSlider = cellNavigator.append('input');
    timeSlider.datum({})
      .attr('type', 'range')
      .attr('class', 'custom-range')
      .attr('id', 'customRange2')
      .style('width', '150px')
      .style('padding-top', '15px')
      .attr('value', beforeThisDate)
      .attr('min', startDate)
      .attr('max', endDate)
      .attr('step', 1)
      .on('input', () => {
        sliderHasBeenLoaded = 1;
        if (sliderHasBeenLoaded) {
          beforeThisDate = d3.select('#customRange2').property('value');
          beforeThisDate = timeScale.invert(beforeThisDate);
        }
        OpinionLeader(cellData.nodes, cellData.links,
          beforeThisDate, cellForceSimulation, totalAuthorInfluence);
      });

    cellNavigator.append('text')
      .attr('id', 'sizeThreshold')
      .attr('text-anchor', 'middle')
      .attr('font-size', '24px')
      .attr('x', '50%')
      .attr('y', '10%')
      .text('Latest');
    // update();

    function update() {
      if (sliderHasBeenLoaded) {
        fontSizeThreshhold = d3.select('#customRange1').property('value');
        beforeThisDate = d3.select('#customRange2').property('value');
        beforeThisDate = timeScale.invert(beforeThisDate);
        // nevigator.select('#sizeThreshold').text(fontSizeThreshhold);
      }
      // console.log(beforeThisDate);
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

      // console.log(set);
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
      // console.log(realWidth, realHeight);
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
        .style('fill-opacity', 0.3)
        .style('stroke', 'white')
        .style('stroke-width', '0');

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
        // .attr('opacity', () => (NodeHiding ? 0 : 1))
        .attr('opacity', 0)
        .style('stroke', 'green')
        .style('stroke-width', '1px');

      const keyPlayerCircles = nodeEnter.selectAll('circle');
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
        })
        .style('fill-opacity', () => (NodeHiding ? 0 : 1))
        // .style('fill-opacity', 1)
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
        .attr('fill', 'rgb(0,0,0)')
        .attr('y', (d) => {
          if (NodeHiding) return 0;
          return d.group !== 1 ? 3 : centrality(selectedCentrality, d) * 2 + 5;
        });
        // .style('stroke', (d) => {
        //   if (d.group === 1) {
        //     const cluster = d.cluster % 19;
        //     const betweennessColor = d3.hsl(color[cluster]);
        //     return betweennessColor;
        //   }
        // });
        // style="fill: none; stroke: rgb(0, 0, 0); font-size: 48px; visibility: visible;"
      nodeEnter.append('title')
        .text(d => d.titleTerm);
      node = nodeEnter.merge(node);

      const strengthScale = d3.scaleLinear()
        .domain([
          Math.min(...set.links.map(l => l.value)),
          Math.max(...set.links.map(l => l.value)),
        ]).range([1, 100]);


      const simulationDurationInMs = 20000; // 20 seconds

      const startTime = Date.now();
      const endTime = startTime + simulationDurationInMs;

      function onSimulationTick() {
        if (Date.now() < endTime) {
          ticked();
        } else {
          simulation.stop();
        }
      }

      simulation
        .nodes(set.nodes)
        .on('tick', onSimulationTick);

      simulation.alphaDecay(0.005)
        .force('link')
        .links(set.links)
        .distance(d => 100 / strengthScale(d.value));
      // .strength((d) => {
      //   console.log(strengthScale(d.value));
      //   return strengthScale(d.value);
      // });

      simulation.force('collision', d3.forceCollide(d => (d.group === 1 ? centrality(selectedCentrality, d) * 2 + 2 : d.size / 2 + 2)));
      // .distance(d => 300 / d.value);
      // .strength(1);

      leftSvg.selectAll('*').remove();

      // drawTable(term_community);
      // drawTimeLine();
      drawHeatMap();
      // drawWordTree();

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
          .append('g')
          .attr('transform', `translate(${200}, ${margin.top})`);

        // Build X scales and axis:
        const heatMapX = d3.scaleBand()
          .range([0, heatMapWidth])
          .domain(postDate)
          .padding(0.1);
        heatMap.append('g')
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

      function ticked() {
        if (set.nodes[0].x) {
          const polygonShapes = voronoi(set.nodes.map(d => [d.x, d.y])).polygons();
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
            _node.show = _node.cluster === d.cluster ? 1 : 0;
          });
        }
        selectedCluster = d.cluster;
        update();
      }
      function clicked(d) {
        console.log(d);
        console.log('clicked');
        const opWord = d.titleTerm.split(' ')[0];
        $this.setState({
          optionsWord: opWord,
          word: [['clicked']],
          draw: 0,
        });
        if (d3.event.defaultPrevented) return; // dragged
        if (typeof d === 'string') {
          d = set.nodes.find(ele => ele.titleTerm === d);
        }
        // AuthorTable(d, authorTable, (n) => {
        //   console.log(n);
        // });
        // console.log(d);
        set.nodes.forEach((_node) => {
          if (isConnected(d, _node)) {
            _node.connected = _node.connected <= 0 ? 1 : _node.connected += 1;
          } else if (_node.connected === -1) {
            _node.connected = 0;
          }
        });

        if (d.tag === 0) {
          d.tag = 1;
          conutOfClickedNode += 1;

          AuthorTable(d, authorTable, (n, index) => {
            const clickedNode = JSON.parse(JSON.stringify(n));
            cellData.nodes = [];
            cellData.links = [];
            clickedNode.fx = 0;
            clickedNode.fy = 0;
            cellData.nodes.push(clickedNode);
            totalAuthorInfluence = 0;

            // compute author's influence
            clickedNode.children.forEach((author) => {
              let influence = 0;
              author.responder.forEach((article) => {
                if (article.message.length >= articleInfluenceThreshold) {
                  influence += article.message.length;
                }
              });
              author.influence = influence;
            });
            clickedNode.children.sort((a, b) => ((a.influence < b.influence) ? 1 : -1));
            // compute cellnodes and celllinks
            let topInfluenceAuthor = 1;
            const topNumOfPushes = 100;

            // testing data structure
            let authorGroup = index;
            clickedNode.children.every((author) => {
              let size = 0;
              let countedArticle = 0;
              if (topInfluenceAuthor <= topAuthorThreshold) {
                author.responder.forEach((article) => {
                  let replyCount = 0;
                  if (article.message.length >= articleInfluenceThreshold) {
                    cellData.nodes.push(article);
                    cellData.links.push({
                      source: article.articleId,
                      target: author.id,
                      tag: 0,
                      value: 1,
                    });
                    // console.log(cellData);
                    article.message.every((mes) => {
                      let cuttedPushContent = '';
                      mes.cutted_push_content.forEach((w) => {
                        cuttedPushContent = cuttedPushContent.concat(' ', w);
                      });
                      if (replyCount < topNumOfPushes) {
                        // if (mes.push_tag === '推') {
                        if (mes.push_tag) {
                          if (cellData.nodes.some(data => data.id === mes.push_userid)) {
                            // already has same replyer
                            const replyer = cellData.nodes.find(data => data.id === mes.push_userid);
                            // console.log(mes.push_userid, replyer);
                            replyer.push_content.push({ id: mes.push_userid, content: mes.push_content });
                            // console.log(replyer);
                            replyer.adj[mes.push_userid] += 1;
                            if (!replyer.push_detail) {
                              replyer.push_detail = [];
                            }
                            replyer.push_detail.push({
                              author,
                              article: [{
                                title: article,
                                messageCount: {
                                  push: mes.push_tag === '推' ? 1 : 0, boo: mes.push_tag === '噓' ? 1 : 0,
                                },
                                messageContent: mes.push_content,
                                pushDate: mes.push_ipdatetime,
                              }],
                            });
                            // console.log(replyer);
                            if (replyer.cutted_push_content) replyer.cutted_push_content.push([cuttedPushContent]);
                            else replyer.cutted_push_content = [cuttedPushContent];
                            replyer.authorGroup = replyer.authorGroup ? replyer.authorGroup : [];
                            if (!replyer.authorGroup.some(e => e === author.id)) replyer.authorGroup.push(author.id);
                            replyer.reply = replyer.reply ? replyer.reply : [];
                            if (replyer.reply.some(e => e.author.id === author.id)) {
                              // reply same author
                              // console.log(replyer, author);
                              const repliedAuthor = replyer.reply.find(e => e.author === author);
                              const repliedArticle = repliedAuthor.article.find(e => e.title === article);
                              if (repliedArticle) {
                                // reply same article
                                // cellData.links.find(e => e.target === article.articleId
                                // && e.source === mes.push_userid).value += 1;
                                const type = (mes.push_tag === '推') ? 'push' : 'boo';
                                repliedArticle.messageCount[type] += 1;
                              } else {
                                // reply different article
                                replyer.pushCount += 1;
                                repliedAuthor.article.push({
                                  title: article,
                                  messageCount: {
                                    push: mes.push_tag === '推' ? 1 : 0, boo: mes.push_tag === '噓' ? 1 : 0,
                                  },
                                });
                                // cellData.links.push({
                                //   source: mes.push_userid,
                                //   target: article.articleId, color: '#ffbb78', tag: 1, value: 1,
                                // });
                              }
                            } else {
                              replyer.reply.push({
                                author,
                                article: [{
                                  title: article,
                                  messageCount: {
                                    push: mes.push_tag === '推' ? 1 : 0, boo: mes.push_tag === '噓' ? 1 : 0,
                                  },
                                  push_content: mes.push_content,
                                }],
                              });
                              // replyer.push_detail.push({
                              //   author,
                              //   article: [{
                              //     title: article,
                              //     messageCount: {
                              //       push: mes.push_tag === '推' ? 1 : 0,
                              //       boo: mes.push_tag === '噓' ? 1 : 0,
                              //     },
                              //     messageContent: mes.push_content,
                              //     pushDate: mes.push_ipdatetime,
                              //   }],
                              // });
                              // cellData.links.push({
                              //   source: mes.push_userid,
                              //   target: article.articleId,
                              //   color: '#ffbb78',
                              //   tag: 1,
                              //   value: 1,
                              // });
                            }
                          } else {
                            cellData.nodes.push({
                              id: mes.push_userid,
                              containUsers: [mes.push_userid],
                              pushCount: 1,
                              push_content: [{ id: mes.push_userid, content: mes.push_content }],
                              push_ipdatetime: mes.push_ipdatetime,
                              authorGroup: [author.id],
                              adj: {
                                [mes.push_userid]: 1,
                              },
                              reply: [{
                                author,
                                article: [{
                                  title: article,
                                  messageCount: {
                                    push: mes.push_tag === '推' ? 1 : 0, boo: mes.push_tag === '噓' ? 1 : 0,
                                  },
                                }],
                              }],
                              push_detail: [{
                                author,
                                article: [{
                                  title: article,
                                  messageCount: {
                                    push: mes.push_tag === '推' ? 1 : 0, boo: mes.push_tag === '噓' ? 1 : 0,
                                  },
                                  messageContent: mes.push_content,
                                  pushDate: mes.push_ipdatetime,
                                }],
                              }],
                              cutted_push_content: [[cuttedPushContent]],
                            });

                            // cellData.links.push({
                            //   source: mes.push_userid,
                            //   target: article.articleId,
                            //   color: '#ffbb78',
                            //   tag: 1,
                            //   value: 1,
                            // });
                          }
                          replyCount += 1;
                        }
                        return true;
                      }
                      return false;
                    });
                    size += article.message.length;
                    countedArticle += 1;
                  }
                });
                author.size = size;
                totalAuthorInfluence += size;
                // console.log(author);
                if (size >= authorInfluenceThreshold) {
                  author.countedArticle = countedArticle;
                  author.adj = {};
                  author.adj[author.id] = -1;
                  cellData.nodes.push(author);
                }
                topInfluenceAuthor += 1;
                return true;
              }
              authorGroup += 1;
              return false;
            });

            // node links other nodes which comments the same article
            // nodeLinksOtherNodesWithSameArticle(clickedNode, topInfluenceAuthor, topNumOfPushes);

            // node links the author
            // nodeLinksToAuthor(clickedNode, topInfluenceAuthor, topNumOfPushes);
            nodeLinksToArticle(clickedNode, topInfluenceAuthor, topNumOfPushes);
            mergeCellDataNodes(cellData);

            cellData.nodes.sort((a, b) => ((a.size < b.size) ? 1 : -1));
            const userState = $this.state.user;
            if (!$this.state.user.includes(index)) {
              userState.push(index);
            }
            const setStateWord = cellData.nodes.find(e => e.id === index).titleTermArr;
            // console.log(userState);
            $this.setState({
              word: setStateWord,
              draw: 0,
              cellData,
              beforeThisDate,
              cellForceSimulation,
              totalAuthorInfluence,
              user: userState,
              hover: 0,
              mouseOverUser: index,
            });
            console.log($this.state);
          });
          update();
        } else {
          set = JSON.parse(JSON.stringify(origSet));
          // node.style('fill-opacity', function(o) {
          //   return 1;
          // });

          if (d.group === 1) {
            //
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

      function mergeCellDataNodes(data) {
        data.links = data.links.filter(e => e.source !== e.target);
        for (let i = 0; i < data.links.length; i += 1) {
          const t = data.links[i].target; // target id
          const s = data.links[i].source; // source id
          const target_node = data.nodes.find(e => e.id === t); // find target node
          const source_node = data.nodes.find(e => e.id === s); // find source node

          // adjacency matrix
          // target_node.adj[s] = target_node.adj[s]
          //   ? target_node.adj[s] + data.links[i].value : data.links[i].value;
          // source_node.adj[t] = source_node.adj[t]
          //   ? source_node.adj[t] + data.links[i].value : data.links[i].value;
        }

        // merge nodes by author & article
        for (let i = 0; i < data.nodes.length - 1; i += 1) {
          for (let j = i + 1; j < data.nodes.length; j += 1) {
            if (!data.nodes[i].responder && data.nodes[i].id) {
              if (_.isEqual(data.nodes[i].reply, data.nodes[j].reply)) {
                const temp_id = data.nodes[i].id;
                const next_id = data.nodes[j].id;
                data.nodes[i].containUsers.push(data.nodes[j].id);
                data.nodes[j].cutted_push_content.forEach((c) => {
                  data.nodes[i].cutted_push_content.push(c);
                });
                data.nodes[j].push_detail.forEach((c) => {
                  data.nodes[i].push_detail.push(c);
                });
                data.nodes[j].push_content.forEach((c) => {
                  data.nodes[i].push_content.push(c);
                });
                data.nodes[i].id = data.nodes[i].id.concat(' ', data.nodes[j].id);

                data.links.forEach((l) => {
                  if (l.source === temp_id) l.source = data.nodes[i].id;
                  if (l.source === next_id) l.source = data.nodes[i].id;
                  if (l.target === temp_id) l.target = data.nodes[i].id;
                  if (l.target === next_id) l.target = data.nodes[i].id;
                });
                data.links = data.links.filter(e => e.source !== e.target);
                data.nodes = data.nodes.filter(e => e.id !== data.nodes[j].id);
                j -= 1;
              }
            }
          }
        }


        // // merge links
        for (let i = 0; i < data.links.length - 1; i += 1) {
          const l = data.links[i];
          for (let j = i + 1; j < data.links.length; j += 1) {
            const temp = data.links[j];
            if ((temp.source === l.source && temp.target === l.target)
            || (temp.source === l.target && temp.target === l.source)) {
              // l.value += data.links[j].value;
              data.links.splice(j, 1);
              j -= 1;
            }
          }
          // data.links = data.links.filter((e) => {
          //   if (e.value > 1) return true;
          //   return e.source !== l.source && e.target !== l.target;
          // });
        }
        const count = 0;
        for (let i = 0; i < data.links.length - 1; i += 1) {
          if (data.links[i].source === data.links[i].target) console.log(data.links[i]);
        }
        // console.log(count);
        console.log(data);
      }

      function nodeLinksOtherNodesWithSameArticle(termNode,
        thresholdOfInfluence, topNumOfComments) {
        termNode.children.every((author) => {
          if (thresholdOfInfluence <= topAuthorThreshold) {
            author.responder.forEach((article) => {
              let replyCount = 0;
              // const filteredMessages = article.message.filter(e => e.push_tag === '推');
              const filteredMessages = article.message.filter(e => e.push_tag);
              // console.log(filteredMessages);
              const maximumLength = Math.min(topNumOfComments, filteredMessages.length);
              if (article.message.length >= articleInfluenceThreshold) {
                for (let i = 0; i < maximumLength - 1; i += 1) {
                  for (let j = i + 1; j < maximumLength; j += 1) {
                    const existedLink = cellData.links.find((l) => {
                      const temp_id = filteredMessages[i].push_userid;
                      const next_id = filteredMessages[j].push_userid;

                      return (l.source === temp_id && l.target === next_id)
                              || (l.source === next_id && l.target === temp_id);
                    });

                    if (existedLink) existedLink.value += 1;
                    else {
                      cellData.links.push({
                        source: filteredMessages[i].push_userid,
                        target: filteredMessages[j].push_userid,
                        color: '#ffbb78',
                        tag: 1,
                        value: 1,
                      });
                    }
                    replyCount += 1;
                  }
                }
              }
            });
            thresholdOfInfluence += 1;
            return true;
          }
          return false;
        });
      }

      function nodeLinksToAuthor(termNode, thresholdOfInfluence, topNumOfComments) {
        termNode.children.every((author) => {
          if (thresholdOfInfluence <= topAuthorThreshold) {
            author.responder.forEach((article) => {
              // const filteredMessages = article.message.filter(e => e.push_tag === '推');
              const filteredMessages = article.message.filter(e => e.push_tag);
              // console.log(filteredMessages);
              const maximumLength = Math.min(topNumOfComments, filteredMessages.length);
              if (article.message.length >= articleInfluenceThreshold) {
                for (let i = 0; i < maximumLength; i += 1) {
                  // console.log(filteredMessages[i]);
                  const existedLink = cellData.links.find((l) => {
                    const user_id = filteredMessages[i].push_userid;
                    const author_id = author.id;
                    return l.source === user_id && l.target === author.id;
                  });
                  if (existedLink) {
                    existedLink.value += 1;
                  } else {
                    cellData.links.push({
                      source: filteredMessages[i].push_userid,
                      target: author.id,
                      color: '#ffbb78',
                      tag: 0,
                      value: 1,
                    });
                  }
                }
              }
            });
            thresholdOfInfluence += 1;
            return true;
          }
          return false;
        });
      }

      function nodeLinksToArticle(termNode, thresholdOfInfluence, topNumOfComments) {
        termNode.children.every((author) => {
          if (thresholdOfInfluence <= topAuthorThreshold) {
            author.responder.forEach((article) => {
              // const filteredMessages = article.message.filter(e => e.push_tag === '推');
              const filteredMessages = article.message.filter(e => e.push_tag);
              // console.log(filteredMessages);
              const maximumLength = Math.min(topNumOfComments, filteredMessages.length);
              if (article.message.length >= articleInfluenceThreshold) {
                for (let i = 0; i < maximumLength; i += 1) {
                  // console.log(filteredMessages[i]);
                  const existedLink = cellData.links.find((l) => {
                    const user_id = filteredMessages[i].push_userid;
                    const author_id = author.id;
                    return l.source === user_id && l.target === author.id;
                  });
                  if (existedLink) {
                    existedLink.value += 1;
                  } else {
                    // cellData.links.push({
                    //   source: filteredMessages[i].push_userid,
                    //   target: author.id,
                    //   color: '#ffbb78',
                    //   tag: 0,
                    //   value: 1,
                    // });
                    cellData.links.push({
                      source: filteredMessages[i].push_userid,
                      target: article.articleId,
                      color: '#ffbb78',
                      tag: 1,
                      value: 1,
                    });
                  }
                }
              }
            });
            thresholdOfInfluence += 1;
            return true;
          }
          return false;
        });
      }

      function adjIsEquivalent(a, b) {
        const aAdj = a.adj;
        const bAdj = b.adj;
        if (!aAdj || !bAdj) return false;
        // Create arrays of property names
        console.log(a.id, b.id);
        const aProps = Object.getOwnPropertyNames(aAdj);
        const bProps = Object.getOwnPropertyNames(bAdj);

        // If number of properties is different,
        // objects are not equivalent
        if (aProps.length !== bProps.length) {
          return false;
        }

        for (let i = 0; i < aProps.length; i += 1) {
          const propName = aProps[i];
          if (aProps[i] !== a.id && aProps[i] !== b.id) {
            console.log(aProps[i]);
            // If values of same property are not equal,
            // objects are not equivalent
            if (aAdj[propName] !== bAdj[propName]) {
              return false;
            }
          }
        }

        // If we made it this far, objects
        // are considered equivalent
        return true;
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
    }

    // build a dictionary of nodes that are linked
    const linkedByIndex = {};
    initLinks.forEach((d) => {
      linkedByIndex[`${d.source.index},${d.target.index}`] = 1;
    });
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
      if (!d3.event.active) {
        simulation.alphaTarget(0.3).restart();
        cellForceSimulation.alphaTarget(0.3).restart();
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
        cellForceSimulation.alphaTarget(0.3).restart();
        simulation.alphaTarget(0);
      }
      d.fx = null;
      d.fy = null;
    }

    function buildGraph() {
      const node_data = set.nodes.map(d => d.titleTerm);
      const edge_data = set.links.map(d => [d.source, d.target, d.value]);
      G.addNodesFrom(node_data);
      G.addEdgesFrom(edge_data);
    }

    function removeTermLayer(data) {
      if (!data) return [];
      const { nodes: termNodes } = data;
      const authorNodes = [];
      termNodes.forEach((termnode) => {
        termnode.children.forEach((user) => {
          if (!authorNodes.includes(e => e.id === user.id)) {
            authorNodes.push(user);
          }
        });
      });
      return { children: authorNodes };
    }

    function communityDetecting() {
      const l = JSON.parse(JSON.stringify(set.links));
      // console.log(links);
      for (let i = 0; i < l.length; i += 1) {
        // console.log(links[i]);
        l[i].source = set.nodes.findIndex(ele => ele.titleTerm === set.links[i].source);
        l[i].target = set.nodes.findIndex(ele => ele.titleTerm === set.links[i].target);
      }
      // console.log(set.nodes, set.links, l);
      netClustering.cluster(set.nodes, l);
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
  }

  render() {
    console.log('render: ', this.state);
    const {
      cellData,
      beforeThisDate,
      cellForceSimulation,
      totalAuthorInfluence,
      word,
      optionsWord,
      opState,
    } = this.state;
    const $this = this;
    return (
      <div className="graph" ref={this.myRef}>
        {/* <div className="barchart">
          <svg id="barChart" width="100%" height="100%" style={{ border: '2px solid gray' }} />
        </div> */}
        <div className="network">
          <div
            className="filterBar"
            id="button"
            style={{ width: '100%', height: '25px', padding: '0px 10px' }}
          />
          <div className="termMap">
            <svg id="graph" width="100%" height="100%" style={{}} />
          </div>
          <div className="authorList" id="authorList" style={{ height: '100%', overflowY: 'auto' }} />
        </div>
        <OpinionLeaderView data={{
          word,
          cellData,
          beforeThisDate,
          cellForceSimulation,
          totalAuthorInfluence,
          $this,
          optionsWord,
          opState,
        }}
        />
        <div id="googleChart" />
        {/* <WordTree word={word} /> */}
        <div className="heatMap" style={{ border: '2px solid gray', height: 'fit-content', overflowX: 'scroll' }}>
          <svg id="timeLine" width="100%" height="600px" />
        </div>
        {/* </div> */}
      </div>
    );
  }
}

export default Graph;
