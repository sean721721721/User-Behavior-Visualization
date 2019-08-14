/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
import React, { Component } from 'react';
// import PropTypes from 'prop-types';
// import { connect } from 'react-redux';
// import { push } from 'react-router-redux';
import * as d3 from 'd3';
// import { max } from 'moment';
// import { Row, Form } from 'antd';

const SetNumOfNodes = 100;
class Graph extends Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.state = props;
  }

  componentDidMount() {
    console.log('componentDidMount');
  }

  componentDidUpdate() {
    this.drawwithlabels();
    console.log('componentDidUpdate');
  }

  drawwithlabels() {
    console.log(this.props);
    const { visprops: props } = this.props;
    const set = { nodes: [], links: [] };
    let link;
    let node;
    let links;
    let nodes;
    const initLinks = [];
    const removeWords = ['新聞', '八卦', '幹嘛'];
    // const keys = Object.keys(props);

    // Nodes setting
    for (let i = 0; i < Math.min(props.length, SetNumOfNodes); i += 1) {
      if (props[i][0] != null) {
        const existKey = set.nodes.find(ele => ele.titleTerm === props[i][0]);
        if (existKey === undefined) {
          if (!removeWords.includes(props[i][0])) {
            set.nodes.push({
              titleTerm: props[i][0],
              children: props[i][1],
              _children: [],
              articleIndex: props[i][2],
              group: 1,
              tag: 0,
              connected: -1,
              size: 5 + Math.log2(props[i][1].length),
            });
            props[i][1].forEach((titleTerm) => {
              const existId = set.nodes.find(ele => ele.titleTerm === titleTerm);
              if (existId === undefined) {
                // if(id != null)
                //   set.nodes.push({id: id, group: 2, tag: 0, size: 5});
              }
            });
          }
        }
      }
    }

    // title words links by articleIndex
    const groupedWords = [];
    const max = Math.min(props.length, SetNumOfNodes);
    for (let i = 0; i < max - 1; i += 1) {
      if (props[i][0] != null && !removeWords.includes(props[i][0])) {
        for (let j = i + 1; j < max; j += 1) {
          let count = 0;
          if (props[j][0] != null && !removeWords.includes(props[j][0])) {
            props[i][1].forEach((id1) => {
              props[j][1].forEach((id2) => {
                if (id1 != null && id2 != null) {
                  if (id1 === id2) {
                    count += 1;
                  }
                }
              });
            });
          }
          if (count !== 0) {
            set.links.push({
              source: props[i][0],
              target: props[j][0],
              tag: 0,
              color: '#d9d9d9 ',
              value: count,
            });
            initLinks.push({
              source: props[i][0],
              target: props[j][0],
              tag: 0,
              value: count,
            });
          }
        }
      }
    }

    // Links setting
    // for(let i=0;i<Math.min(props.length,SetNumOfNodes);i++){
    //   if(props[i][0] != null){
    //     props[i][1].forEach(function(id){
    //       if(id != null){
    //         let existLink = set.links.find(function(ele){
    //           return ele.source === id && ele.target === props[i][0];
    //         })
    //         if(existLink === undefined){
    //             if(!removeWords.includes(props[i][0])){
    //               set.links.push({source: id,target:props[i][0], tag: 0, value: 1});
    //             }
    //         }else{
    //           existLink.value++;
    //           //console.log(existLink);
    //         }
    //       }
    //     })
    //   }
    // }
    // console.log(set);
    const width = 900;
    const height = 900;
    let svg = d3.select(this.myRef.current)
      .select('svg');

    svg.selectAll('*').remove();

    function zoomed() {
      svg.attr('transform', d3.event.transform);
    }

    svg = svg.call(d3.zoom().scaleExtent([1 / 2, 8]).on('zoom', zoomed))
      .append('g')
      .attr('transform', 'translate(40,0)');

    const color = d3.scaleOrdinal(d3.schemeCategory10);
    color(1);
    const simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.titleTerm))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(width / 2, height / 2));

    let conutOfClickedNode = 0;
    update();

    function update() {
      // console.log(set);
      ({ nodes, links } = set);
      //  let g =svg.append('g')
      //     .attr('class', 'everything')

      link = svg.selectAll('line')
        .data(set.links);
      link.exit().remove();
      const linkEnter = link.enter()
        .append('line')
        .attr('class', 'links')
        .style('z-index', -1)
        .attr('stroke', d => d.color)
        .attr('stroke-width', 1);
      link = linkEnter.merge(link);
      svg.selectAll('g').remove();
      node = svg.selectAll('g')
        .data(set.nodes);
      // node.exit().remove();
      // let node = svg.selectAll('g').data(set.nodes)
      const nodeEnter = node.enter()
        .append('g')
        .attr('class', 'nodes')
        .style('z-index', 1)
        .on('click', clicked)
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended));
        // .on('mouseover', mouseOver(.2))
        // .on('mouseout', mouseOut);
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
      const circles = nodeEnter.append('circle')
        .attr('r', d => d.size)
        .attr('fill', (d) => {
          if (d.group === 1) {
            return color(d.group);
          }
          return 'url(#pic_user)';
        })
        .style('fill-opacity', (d) => {
          if (d.group === 1) {
            return d.connected === 0 ? 0.1 : 1;
          }
          return 1;
        })
        .attr('stroke', (d) => {
          if (d.group === 1) {
            if (d.tag === 1) {
              return 'red';
            }
            return 'white';
          }
          return '#ff7f0e';
        })
        .attr('stroke-width', 0.9)
        .attr('stroke-opacity', 1);
      // let zoom_handler = d3.zoom()
      //       .on('zoom', zoom_actions);
      // zoom_handler(svg);
      const lables = nodeEnter.append('text')
        .text(d => d.titleTerm)
        .attr('font-family', 'sans-serif')
        .attr('font-size', ' 10px')
        .attr('color', '#000')
        .attr('visibility', (d) => {
          if (d.group === 1) {
            return 'visible';
          }
          return 'hidden';
        })
        .attr('x', d => -d.size)
        .attr('y', d => d.size + 7);
      nodeEnter.append('title')
        .text(d => d.titleTerm);
      node = nodeEnter.merge(node);
      simulation
        .nodes(set.nodes)
        .on('tick', ticked);

      simulation.alphaDecay(0.005)
        .force('link')
        .links(set.links)
        .distance(d => 300 / d.value);
      // .strength(1);
      function ticked() {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);
        node
          .attr('transform', d => `translate( ${d.x}, ${d.y})`);
      }

      function clicked(d) {
        console.log('clicked');
        if (d3.event.defaultPrevented) return; // dragged
        set.nodes.forEach((_node) => {
          if (isConnected(d, _node)) {
            // console.log(d, _node);
            if (_node.connected <= 0) {
              _node.connected = 1;
            } else {
              _node.connected += 1;
            }
          } else if (_node.connected === -1) {
            _node.connected = 0;
          }
        });

        if (d.tag === 0) {
          d3.select(this).select('circle').attr('stroke', 'red');

          d.children.forEach((id_1) => {
            if (id_1 != null) {
              const checkUserId = obj => obj.titleTerm === id_1;

              if (!set.nodes.some(checkUserId)) {
                set.nodes.forEach((_node) => {
                  if (_node.children) {
                    _node.children.forEach((id_2) => {
                      if (id_1 === id_2) {
                        set.links.push({
                          source: id_1,
                          target: _node.titleTerm,
                          tag: 1,
                          color: '#ffbb78 ',
                          value: 1000000,
                        });
                      }
                    });
                  }
                });
                const existId = set.nodes.find(ele => ele.titleTerm === id_1);
                if (existId === undefined) {
                  set.nodes.push({
                    titleTerm: id_1,
                    group: 2,
                    tag: 1,
                    connected: 1,
                    x: d.x,
                    y: d.y,
                    size: 5,
                  });
                }
                set.links.push({
                  source: id_1,
                  target: d,
                  color: '#ffbb78',
                  tag: 1,
                  value: 1000000,
                });
              } else {
                const index = set.nodes.findIndex(_node => _node.titleTerm === id_1);
                set.nodes[index].connected += 1;
              }
            }
          });
          d.tag = 1;
          conutOfClickedNode += 1;
        } else {
          d3.select(this).select('circle').attr('stroke', 'white');
          node.data(set.nodes, (o) => {
            if (isConnected(d, o)) {
              const index_0 = set.nodes.findIndex((_node) => {
                if (_node === undefined) {
                  return -1;
                }
                return _node.titleTerm === o.titleTerm;
              });
              // console.log(id_1, index_1)
              set.nodes[index_0].connected -= 1;
              // console.log(set.nodes[index_0].connected);
            }
          });

          // node.style('fill-opacity', function(o) {
          //   return 1;
          // });

          d.children.forEach((id_1) => {
            if (id_1 != null) {
              const index_1 = set.nodes.findIndex((_node) => {
                if (_node === undefined) {
                  return -1;
                }
                return _node.titleTerm === id_1;
              });
              // console.log(id_1, index_1)
              set.nodes[index_1].connected -= 1;

              set.nodes.forEach((_node) => {
                if (_node.titleTerm === id_1 && _node.connected <= 0) {
                  delete set.nodes[set.nodes.indexOf(_node)];
                  set.nodes = set.nodes.filter(() => true);
                }
              });
              const length = set.links.length();
              for (let j = 0; j < length; j += 1) {
                const pos = set.links.map(e => e.source.titleTerm).indexOf(id_1);
                if (pos !== -1) {
                  const index_2 = set.nodes.findIndex((_node) => {
                    if (_node === undefined) {
                      return -1;
                    }
                    return _node.titleTerm === id_1;
                  });
                  if (index_2 === -1) {
                    set.links.splice(pos, 1);
                  } else if (set.nodes[index_2] === undefined) {
                    set.links.splice(pos, 1);
                  }
                }
              }
            }
          });

          set.nodes = set.nodes.filter(() => true);
          set.links = set.links.filter(() => true);
          conutOfClickedNode -= 1;

          if (conutOfClickedNode === 0) {
            set.nodes.forEach((_node) => {
              _node.connected = -1;
              // console.log(_node.connected);
            });
          }
          // mouseOut();
          d.tag = 0;
        }
        update();
      }

      // function mouseOut() {
      //   node.style('stroke-opacity', (d) => {
      //     d.tag=0;
      //     return 1;
      //   });
      //   node.style('fill-opacity', 1);
      //   node.selectAll('text').style('visibility', (d) => {
      //     if(d.group === 1)
      //       return 'visible';
      //     return 'hidden';
      //   });
      //   node.selectAll('circle').style('fill', (d) => {
      //     if (d.group === 2) {
      //       return '#ff7f0e';
      //     }
      //     return '1f77b4';
      //     });
      //   link.style('stroke-opacity', 1);
      //   link.style('stroke', (d) => {
      //     d.tag=0;
      //     return '#ddd';
      //   });
      // }
    }
    // build a dictionary of nodes that are linked
    const linkedByIndex = {};
    links.forEach((d) => {
      linkedByIndex[`${d.source.index},${d.target.index}`] = 1;
    });

    // check the dictionary to see if nodes are linked
    function isConnected(a, b) {
      return linkedByIndex[`${a.index},${b.index}`] || linkedByIndex[`${b.index},${a.index}`] || a.index === b.index;
    }

    // fade nodes on hover
    // function mouseOver(opacity) {
    //     return (d) =>  {
    //         // check all other nodes to see if they're connected
    //         // to this one. if so, keep the opacity at 1, otherwise
    //         // fade
    //         node.selectAll('circles').style('stroke-opacity', function(o) {
    //           let thisOpacity = isConnected(d, o) ? 1 : opacity;
    //           return thisOpacity;
    //         });
    //         node.style('fill-opacity', function(o) {
    //           let thisOpacity = isConnected(d, o) ? 1 : opacity;
    //           return thisOpacity;
    //         });

    //         node.selectAll('text').style('visibility',function(o){
    //           if(isConnected(d, o) || o.tag != 0)
    //             return 'visible';
    //         });
    //         // also style link accordingly
    //         link.style('stroke-opacity', function(o) {
    //             return o.source === d || o.target === d ? 1 : opacity;
    //         });
    //         link.style('stroke', function(o){
    //             return o.source === d || o.target === d ? o.source.colour : '#ddd';
    //         });
    //     };
    // }

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

    // Table with inline Bar chart

    const chartWidth = '100px';

    // Setup the scale for the values for display, use abs max as max value
    const x = d3.scaleLinear()
      .domain([0, d3.max(set.nodes, d => d.children.length)])
      .range(['0%', '100%']);
    const rightSvg = d3.select(this.myRef.current)
      .select('#barChart');

    rightSvg.selectAll('*').remove();

    const table = rightSvg.append('foreignObject')
      .attr('width', '100%')
      .attr('height', '100%')
      .style('overflow-y', 'scroll')
      .append('xhtml:table');
    const th = table.append('tr');

    th.append('td').attr('class', 'data name')
      .text('Title Term');
    th.append('td').attr('class', 'data name')
      .text('# of User');

    // Create a table with rows and bind a data row to each table row
    const tr = table.selectAll('tr.data')
      .data(set.nodes)
      .enter()
      .append('tr')
      .attr('class', 'datarow');

    // Set the even columns
    d3.selectAll('.datarow').filter(':nth-child(even)')
      .style('background', 'whitesmoke');

    // Create the name column
    tr.append('td').attr('class', 'data name')
      .text(d => d.titleTerm);

    // Create the percent value column
    tr.append('td').attr('class', 'data value')
      .text(d => d.children.length);
    // Create a column at the beginning of the table for the chart
    const chart = tr.append('td').attr('class', 'chart')
      .attr('width', chartWidth)
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
      .style('width', '0%')
      .style('background-color', 'steelblue')
      .transition()
      .duration(500)
      .style('width', d => (d.children.length > 0 ? x(d.children.length) : '0%'));
  /* let set = {
      'name':'',
      'children':[{'name':'','size':1000}]
    }

    let removeWords=['新聞','八卦','幹嘛']
    let keys = Object.keys(props);

    //Nodes setting
    for(let i=0;i<Math.min(props.length,SetNumOfNodes);i++){
      if(props[i][0] != null){
          if(!removeWords.includes(props[i][0])){
            props[i][1].forEach(function(id){
              if(id != null)
                set['children'].push({
                  name: props[i][0],
                  children: [{
                    name:id,
                    group: 2,
                    tag: 0,
                    size: 1000
                  }]
                });
            })
        }
      }
    }
    console.log(set);

    let root = set;
    const width=900,height=700;
    let svg = d3.select(this.refs.chart)
      .select('svg');

    svg.selectAll('*').remove();

    let color = d3.scaleOrdinal(d3.schemeCategory10 );
    color(1);
    let force = d3.forceSimulation()
        .force('link', d3.forceLink().id((d) =>  { return d.id; }))
        .force('charge', d3.forceManyBody().strength(-30))
        .force('center', d3.forceCenter(width / 2, height / 2));

    let link = svg.selectAll('.link'),
        node = svg.selectAll('.node');

    root = set;
    update();

    force.on('tick',tick);
    function update() {
      let hierarchy = d3.hierarchy(root);
      let tree = d3.tree();
      let links = tree(hierarchy).links();

      let nodes = flatten(root);
          //links = d3.tree().links(nodes);
      console.log(nodes);
      console.log(hierarchy);
      console.log(links);
      // Restart the force layout.
      force.nodes(nodes)
          .force('link', d3.forceLink(links).distance(70));

      // Update the links…
      link = link.data(links, (d) =>  { return d.target.id; });

      // Exit any old links.
      link.exit().remove();

      // Enter any new links.
      link.enter().insert('line', '.node')
          .attr('class', 'link')
          .attr('x1', (d) =>  { return d.source.x; })
          .attr('y1', (d) =>  { return d.source.y; })
          .attr('x2', (d) =>  { return d.target.x; })
          .attr('y2', (d) =>  { return d.target.y; });

      // Update the nodes…
      node = node.data(nodes, (d) =>  { return d.id; }).style('fill', color);

      // Exit any old nodes.
      node.exit().remove();

      // Enter any new nodes.
      node.enter().append('circle')
          .attr('class', 'node')
          .attr('cx', (d) =>  { return d.x; })
          .attr('cy', (d) =>  { return d.y; })
          .attr('r', (d) =>  { return Math.sqrt(d.size) / 10 || 4.5; })
          .style('fill', color)
          .on('click', click);
          //.call(force.drag);
    }

    function tick() {
      link.attr('x1', (d) =>  { return d.source.x; })
          .attr('y1', (d) =>  { return d.source.y; })
          .attr('x2', (d) =>  { return d.target.x; })
          .attr('y2', (d) =>  { return d.target.y; });

      node.attr('transform', (d) =>  {
            return 'translate(' + d.x + ',' + d.y + ')';
          })
    }

    // Color leaf nodes orange, and packages white or blue.
    function color(d) {
      return d._children ? '#3182bd' : d.children ? '#c6dbef' : '#fd8d3c';
    }

    // Toggle children on click.
    function click(d) {
      if (!d3.event.defaultPrevented) {
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        update();
      }
    }

    // Returns a list of all nodes under the root.
    function flatten(root) {
      let nodes = [], i = 0;

      function recurse(node) {
        if (node.children) node.children.forEach(recurse);
        if (!node.id) node.id = ++i;
        nodes.push(node);
      }

      recurse(root);
      return nodes;
    } */
  }

  render() {
    // const myRef = 'titleUserView';
    const { id } = this.props;
    return (
      <div id={`#${id}`}>
        <div ref={this.myRef}>
          <svg width="80%" height="900px" />
          <svg id="barChart" width="20%" height="900px" />
        </div>
      </div>
    );
  }
}

export default Graph;
