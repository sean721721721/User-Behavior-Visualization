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
// import { max } from 'moment';
// import { Row, Form } from 'antd';

const SetNumOfNodes = 100;
class Graph extends Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.state = { ...props };
  }

  componentDidMount() {
    console.log('vis_DidMount');
  }

  // componentDidUpdate() {
  //   this.drawwithlabels();
  //   console.log('vis_DidUpdate');
  // }

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
    // props[i][0]== userID, props[i][1]== articleIndex, props[i][0]== articlePostTime;
    // console.log(this.props);
    const { visprops } = this.props;
    const { date } = this.props;
    // console.log(date);
    const startDate = new Date(date.$gte);
    const endDate = new Date(date.$lt);
    const timePeriod = endDate - startDate;
    // console.log(startDate, endDate);
    const props = JSON.parse(JSON.stringify(visprops)); // clone props;
    const set = { nodes: [], links: [] };
    let link;
    let node;
    let links;
    let nodes;
    let userList = [{ id: '', count: 0, term: [] }];
    const propsUserList = [{ id: '', count: 0, term: [] }];
    const initLinks = [];
    const removeWords = ['新聞', '八卦', '幹嘛'];

    // Splice props to match properly size

    props.splice(SetNumOfNodes);

    // props combine any titleterms with the equal users

    for (let i = 0; i < props.length - 1; i += 1) {
      for (let j = i + 1; j < props.length; j += 1) {
        let numOfSameUser = 0;
        for (let k = 0; k < props[i][1].length; k += 1) {
          const findTheSameUser = props[j][1].includes(props[i][1][k]);
          if (findTheSameUser) {
            numOfSameUser += 1;
          }
        }
        if (numOfSameUser === props[i][1].length && numOfSameUser === props[j][1].length) {
          // console.log(numOfSameUser, props[i][1], props[j][1]);
          const addingTerm = ` ${props[j][0]}`;
          props[i][0] += addingTerm;
          props.splice(j, 1);
          j -= 1;
        }
      }
    }

    for (let i = 0; i < removeWords.length; i += 1) {
      const index = props.findIndex(x => x[0] === removeWords[i]);
      if (index !== -1) {
        props.splice(index, 1);
      }
    }

    for (let i = 0; i < props.length - 1; i += 1) {
      props[i][1] = [...new Set(props[i][1])];
      props[i][1].sort();
    }
    // console.log(props.length);

    // Computing props user list

    for (let i = 0; i < props.length; i += 1) {
      if (props[i][1]) {
        props[i][1].forEach((userId) => {
          const existedUser = propsUserList.find(x => x.id === userId);
          if (existedUser) {
            existedUser.term.push(props[i][0]);
            existedUser.count += 1;
          } else {
            propsUserList.push({
              id: userId,
              numOfUsr: 1,
              merge: 1,
              count: 1,
              term: [props[i][0]],
            });
          }
        });
      }
    }

    // console.log(propsUserList);

    // props[i][1]=['id', 'id'] => props[i][1]=[{id:, count:, ... }]

    for (let i = 0; i < props.length; i += 1) {
      propsUserList.forEach((x) => {
        const index = props[i][1].findIndex(user => user === x.id);
        if (index !== -1) {
          props[i][1].splice(index, 1);
          props[i][1].push(x);
        }
      });
    }
    const copyprops = JSON.parse(JSON.stringify(props));
    // console.log(copyprops);
    // console.log(props);

    // Combine all user with count == 1
    const findIndex = (array, num) => array.findIndex(x => x.id === num);
    for (let i = 0; i < props.length; i += 1) {
      userList = props[i][1].filter(x => x.count === 1);
      // console.log(userList);
      let temp = '';
      let size = 0;
      for (let j = 1; j < userList.length; j += 1) {
        temp += ` ${userList[j].id}`;
        size += 1;
        const deleteIndex = findIndex(props[i][1], userList[j].id);
        // const deleteIndex = props[i][1].findIndex(x => x.id === userList[j].id);
        props[i][1].splice(deleteIndex, 1);
      }
      if (userList.length > 0) {
        userList[0].id += temp;
        userList[0].numOfUsr += size;
        userList[0].merge = 2;
      }
    }
    const hasMergedId = [];
    for (let i = 0; i < props.length; i += 1) { // which title
      for (let j = 0; j < props[i][1].length - 1; j += 1) {
        for (let k = j + 1; k < props[i][1].length; k += 1) {
          let equal = 1;
          // console.log(props[i][1][j].id, props[i][1][k].id);
          if (props[i][1][j].count === props[i][1][k].count) {
            if (props[i][1][j].term) {
              for (let l = 0; l < props[i][1][j].term.length; l += 1) {
                if (!props[i][1][k].term.includes(props[i][1][j].term[l])) {
                  // console.log(`${props[i][1][j].id} is not equal to ${props[i][1][k].id}`);
                  equal = 0;
                  break;
                }
              }
              if (equal === 1) {
                if (!hasMergedId.includes(props[i][1][k].id)) {
                  // console.log(`${props[i][1][j].id} is equal to ${props[i][1][k].id}`);
                  props[i][1][j].id += props[i][1][k].id;
                  hasMergedId.push(props[i][1][k].id);
                  props[i][1][j].merge = 2;
                  props[i][1][j].numOfUsr += 1;
                }
                props[i][1].splice(k, 1);
                k -= 1;
              }
            }
          }
        }
      }
    }

    // for (let i = 0; i < props.length; i += 1) { // i == which term
    //   console.log(`${props[i][0]} round ${i}`);
    //   for (let l = 0; l < props[i][1].length; l += 1) {
    // l == the user which other nodes will be merge to
    //     let unique = 1;
    //     let index = l;
    //     for (let j = l + 1; j < props[i][1].length; j += 1) {
    //       for (let k = 0; k < props.length; k += 1) {
    //         if (k !== i && props[k][1].includes(props[i][1][j])) {
    //           console.log(`${props[i][1][j]} not unique in ${props[k][0]}!
    //                        i = ${i}, j = ${j}, k = ${k} `);
    //           unique = 0;
    //           break;
    //         }
    //         // console.log(props[k][0]);
    //       }
    //       if (unique === 1) {
    //         console.log('unique!');
    //         props[i][1][index] += props[i][1][j];
    //         console.log(props[i][0]);
    //         console.log(props[i][1][index], props[i][1][j]);
    //         props[i][1].splice(j, 1);
    //       }
    //     }
    //   }
    // }

    // console.log(props);

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
              date: props[i][3],
              community: [['', 0]],
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

    for (let i = 0; i < set.nodes.length - 1; i += 1) {
      set.nodes[i].children.sort();
    }

    // 1st round merging nodes

    // for (let i = 0; i < set.nodes.length - 1; i += 1) {
    //   for (let j = i + 1; j < set.nodes.length; j += 1) {
    //     let numOfSameUsers = 0;
    //     if (set.nodes[i].children.length === set.nodes[j].children.length) {
    //       for (let k = 0; k < set.nodes[i].children.length; k += 1) {
    //         const haveTheSameUsers = set.nodes[j].children.includes(set.nodes[i].children[k]);
    //         if (haveTheSameUsers) {
    //           numOfSameUsers += 1;
    //         }
    //       }
    //       if (numOfSameUsers === set.nodes[i].children.length) {
    //         const addingTerm = ` ${set.nodes[j].titleTerm}`;
    //         set.nodes[i].titleTerm += addingTerm;
    //         set.nodes.splice(j, 1);
    //         j -= 1;
    //       }
    //     }
    //   }
    // }

    // Computing user list

    for (let i = 0; i <= set.nodes.length; i += 1) {
      if (set.nodes[i]) {
        if (set.nodes[i].children) {
          set.nodes[i].children.forEach((userId) => {
            const existedUser = userList.find(x => x.id === userId);
            if (existedUser) {
              existedUser.term.push(set.nodes[i].titleTerm);
              existedUser.count += 1;
            } else {
              userList.push({ id: userId, count: 1, term: [set.nodes[i].titleTerm] });
            }
          });
        }
      }
    }

    // Find all of users with only one term, then merge them

    // console.log(userList.filter(x => x.count === 1));
    // const userListWithCountEqualsOne = userList.filter(x => x.count === 1); // array
    // console.log(set.nodes, userListWithCountEqualsOne);
    // for (let i = 0; i < userListWithCountEqualsOne.length - 1; i += 1) {
    //   let userListWithSameTerm = set.nodes.filter(
    //     x => x.titleTerm === userListWithCountEqualsOne[i].term[0],
    //   );
    //   console.log(userListWithSameTerm);
    //   let firstSameUser = userListWithSameTerm[0].children.find(
    //     x => x === userListWithCountEqualsOne[0].id,
    //   );
    //   firstSameUser = 0;
    //   console.log(userListWithSameTerm, firstSameUser);
    //   userListWithCountEqualsOne.forEach((user) => {
    //     let userToBeMerged = userListWithSameTerm[0].children.filter(x => x === user.id);
    //     firstSameUser += userToBeMerged;
    //     console.log(userToBeMerged, firstSameUser, set.nodes);
    //   })
    // }


    // 2nd round merging nodes
    // for (let i = 0; i < set.nodes.length - 1; i += 1) {
    //   set.nodes.children = [...new Set(set.nodes.children)];
    //   for (let j = i + 1; j < set.nodes.length; j += 1) {
    //     let numOfSameUsers = 0;
    //     // console.log(i, j);
    //     for (let k = 0; k < set.nodes[i].children.length; k += 1) {
    //       const haveTheSameUsers = set.nodes[j].children.includes(set.nodes[i].children[k]);
    //       if (haveTheSameUsers) {
    //         numOfSameUsers += 1;
    //       }
    //     }
    //     // console.log(numOfSameUsers, set.nodes[i].titleTerm, set.nodes[j].titleTerm,
    //     //   set.nodes[i].children.length, set.nodes[j].children.length);
    //     if (numOfSameUsers >= set.nodes[j].children.length) {
    //       // console.log('#ofuser == set.node[j].children.length');
    //       // console.log(set.nodes[i].titleTerm, set.nodes[j].titleTerm);
    //       set.nodes[i].children.push(set.nodes[j]);
    //       set.nodes.splice(j, 1);
    //       j -= 1;
    //     }
    //   }
    // }

    // compute how many same users each term has

    for (let i = 0; i < set.nodes.length - 1; i += 1) {
      for (let j = i + 1; j < set.nodes.length; j += 1) {
        let numOfSameUsers = 0;
        const largestNumOfSameUsers = 0;
        // let term = '';
        for (let k = 0; k < set.nodes[i].children.length; k += 1) {
          const haveTheSameUsers = set.nodes[j].children.includes(set.nodes[i].children[k]);
          if (haveTheSameUsers) {
            numOfSameUsers += 1;
          }
        }
        if (numOfSameUsers > set.nodes[i].community[0][1]) {
          set.nodes[i].community[0][0] = set.nodes[j].titleTerm;
          set.nodes[i].community[0][1] = numOfSameUsers;
          // set.nodes.splice(j, 1);
          // j -= 1;
        } else if (numOfSameUsers === set.nodes[i].community[0][1]) {
          set.nodes[i].community.push([set.nodes[j].titleTerm, numOfSameUsers]);
        }
      }
    }

    // title words links by articleIndex
    const groupedWords = [];
    const max = Math.min(props.length, SetNumOfNodes);
    for (let i = 0; i < set.nodes.length - 1; i += 1) {
      for (let j = 0; j < set.nodes.length; j += 1) {
        let count = 0;
        set.nodes[i].children.forEach((id1) => {
          if (set.nodes[j].children.includes(id1)) {
            count += 1;
          }
        });
        if (count !== 0) {
          set.links.push({
            source: set.nodes[i].titleTerm,
            target: set.nodes[j].titleTerm,
            tag: 0,
            color: '#d9d9d9 ',
            value: count,
          });
          initLinks.push({
            source: set.nodes[i].titleTerm,
            target: set.nodes[j].titleTerm,
            tag: 0,
            value: count,
          });
        }
      }
    }
    // for (let i = 0; i < max - 1; i += 1) {
    //   if (props[i][0] != null && !removeWords.includes(props[i][0])) {
    //     for (let j = i + 1; j < max; j += 1) {
    //       let count = 0;
    //       if (props[j][0] != null && !removeWords.includes(props[j][0])) {
    //         props[i][1].forEach((id1) => {
    //           props[j][1].forEach((id2) => {
    //             if (id1 != null && id2 != null) {
    //               if (id1 === id2) {
    //                 count += 1;
    //               }
    //             }
    //           });
    //         });
    //       }
    //       if (count !== 0) {
    //         set.links.push({
    //           source: props[i][0],
    //           target: props[j][0],
    //           tag: 0,
    //           color: '#d9d9d9 ',
    //           value: count,
    //         });
    //         initLinks.push({
    //           source: props[i][0],
    //           target: props[j][0],
    //           tag: 0,
    //           value: count,
    //         });
    //       }
    //     }
    //   }
    // }

    // console.log(set);

    const someData = [];
    let postCount;
    for (let i = 0; i < 365; i += 1) {
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + i - 233);
      someData.push({
        date: currentDate,
        value: 0,
        group: currentDate.getMonth(),
      });
    }

    if (props[0]) {
      postCount = props[0][3].length;
    }
    // console.log(`posCount: ${postCount}`);
    for (let i = 0; i < postCount; i += 1) {
      someData.find((x) => {
        const xMonth = x.date.getMonth();
        const dataMonth = new Date(props[0][3][i]).getMonth();
        const xDate = x.date.getDate();
        const dataDate = new Date(props[0][3][i]).getDate();
        return xMonth === dataMonth && xDate === dataDate;
      }).value += 1;
    }

    // console.log(someData);


    const pi = Math.PI;

    const width = 900;
    const height = 900;
    let svg = d3.select(this.myRef.current)
      .select('#graph');

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
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    let conutOfClickedNode = 0;

    // Table with inline Bar chart

    const chartWidth = '100px';

    // Setup the scale for the values for display, use abs max as max value
    const x = d3.scaleLinear()
      .domain([0, d3.max(set.nodes, d => d.children.length)])
      .range(['0%', '100%']);
    const leftSvg = d3.select(this.myRef.current)
      .select('#barChart');
    const timeLineSvg = d3.select(this.myRef.current)
      .select('#timeLine');
    let heatMapSvg = d3.select(this.myRef.current)
      .select('#timeLine');
    update();

    function update() {
      console.log(set);
      ({ nodes, links } = set);
      //  let g =svg.append('g')
      //     .attr('class', 'everything')
      svg.selectAll('g').remove();
      // const linkGroup = svg.append('g').append('line');
      link = svg.selectAll('line')
        .data(set.links);

      link.exit().remove();
      const linkEnter = link.enter()
        // .append('g')
        .append('line')
        .attr('class', 'links')
        .style('z-index', -1)
        .attr('stroke', d => d.color)
        .attr('stroke-width', 1);
      link = linkEnter.merge(link);
      // svg.selectAll('g').remove();
      node = svg.selectAll('g')
        .data(set.nodes);
      // node.exit().remove();
      // let node = svg.selectAll('g').data(set.nodes)
      const nodeEnter = node.enter()
        .append('g')
        .attr('class', 'nodes')
        .style('z-index', 1)
        .on('click', clicked)
        .on('mouseover', mouseOver(0.2))
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
        .attr('d', (d) => {
          if (d.group === 1) {
            const erliestTime = new Date(d.date[0]);
            const latestTime = new Date(d.date[d.date.length - 1]);
            const arc = d3.arc()
              .innerRadius(20)
              .outerRadius(21)
              .startAngle(((erliestTime - startDate) / timePeriod) * 360 * (pi / 180))
              .endAngle(((latestTime - startDate) / timePeriod) * 360 * (pi / 180));
            return arc();
          }
          // return 'M0';
        })
        .attr('fill', 'darkgray');

      const timeline = nodeEnter.selectAll('circle');
      // console.log(timeline);

      timeline.data((d) => {
        // console.log(d);
        if (d.group === 1) {
          return d.date;
        }
        return d;
      })
        .enter()
        .append('g')
        // .selectAll('line')
        .append('line')
        .attr('transform', (d) => {
          // console.log(d);
          const erliestTime = new Date(d);
          const rotate = `rotate(${((erliestTime - startDate) / timePeriod) * 360})`;
          return rotate;
        })
        .attr('x1', 0)
        .attr('y1', -20)
        .attr('x2', 0)
        .attr('y2', -25)
        .style('stroke', 'green')
        .style('stroke-width', '1px');

      const circles = nodeEnter.append('circle')
        .attr('r', d => d.size)
        .attr('fill', (d) => {
          if (d.group !== 2) {
            return color(d.group);
          }
          if (d.merge > 1) {
            return color(d.group);
          }
          return 'url(#pic_user)';
        })
        .style('fill-opacity', (d) => {
          if (d.group !== 2) {
            return d.connected === 0 ? 0.1 : 1;
          }
          return 1;
        })
        .attr('stroke', (d) => {
          if (d.group !== 2) {
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
        .text((d) => {
          if (d.merge > 1) {
            return d.numOfUsr;
          }
          return d.titleTerm;
        })
        .attr('font-family', 'sans-serif')
        .attr('font-size', ' 10px')
        .attr('color', '#000')
        .attr('visibility', (d) => {
          if (d.group !== 2 || d.merge > 1) {
            return 'visible';
          }
          return 'hidden';
        })
        .attr('x', (d) => {
          if (d.merge > 1) {
            return -3;
          }
          return -d.size;
        })
        .attr('y', (d) => {
          if (d.merge > 1) {
            return 3;
          }
          return d.size + 7;
        });
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

      leftSvg.selectAll('*').remove();

      drawTable();
      // drawTimeLine();
      drawHeatMap();
      // drawSpiral();

      function drawTable() {
        const table = leftSvg.append('foreignObject')
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
          .attr('class', 'datarow')
          .style('border', (d) => {
            if (d.tag === 1) {
              return '2px black solid';
            }
            // if (d.connected === 1) {
            //   return '2px red solid';
            // }
            return 'none';
          })
          .on('mouseover', mouseOver(0.2))
          .on('mouseout', mouseOut)
          .on('click', clicked);

        // Set the even columns
        d3.selectAll('.datarow').filter(':nth-child(even)')
          .style('background', 'whitesmoke');

        // Create the name column
        tr.append('td').attr('class', 'data name')
          .text(d => d.titleTerm);

        // Create the percent value column
        tr.append('td').attr('class', 'data value')
          .text((d) => {
            if (d.children === undefined) {
              return 0;
            }
            return d.children.length;
          });
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
          .style('width', (d) => {
            if (d.children !== undefined) {
              if (d.children.length > 0) {
                return x(d.children.length);
              }
            }
            return '0%';
          });
      }

      function drawSpiral() {
        // Spiral Display

        const start = 0;
        const end = 2.25;
        const numSpirals = 3;
        const margin = {
          top: 50, bottom: 50, left: 50, right: 50,
        };

        const theta = r => numSpirals * Math.PI * r;

        // used to assign nodes color by group
        // const color = d3.scaleOrdinal(d3.schemeCategory10);

        const r = d3.min([500, 500]) / 2 - 40;

        const radius = d3.scaleLinear()
          .domain([start, end])
          .range([40, r]);

        const points = d3.range(start, end + 0.001, (end - start) / 1000);

        const spiral = d3.radialLine()
          .curve(d3.curveCardinal)
          .angle(theta)
          .radius(radius);

        const path = svg.attr('transform', `translate(${width / 4},${height / 4})`)
          .append('path')
          .datum(points)
          .attr('id', 'spiral')
          .attr('d', spiral)
          .style('fill', 'none')
          .style('stroke', 'steelblue');

        const spiralLength = path.node().getTotalLength();
        const N = 365;
        const barWidth = (spiralLength / N) - 1;


        const timeScale = d3.scaleTime()
          .domain(d3.extent(someData, d => d.date))
          .range([0, spiralLength]);

        // yScale for the bar height
        const yScale = d3.scaleLinear()
          .domain([0, d3.max(someData, d => d.value)])
          .range([0, (r / numSpirals) - 30]);

        svg.selectAll('rect')
          .data(someData)
          .enter()
          .append('rect')
          .attr('x', (d, i) => {
            const linePer = timeScale(d.date);
            const posOnLine = path.node().getPointAtLength(linePer);
            const angleOnLine = path.node().getPointAtLength(linePer - barWidth);

            d.linePer = linePer; // % distance are on the spiral
            d.x = posOnLine.x; // x postion on the spiral
            d.y = posOnLine.y; // y position on the spiral

            // angle at the spiral position
            d.a = (Math.atan2(angleOnLine.y, angleOnLine.x) * 180 / Math.PI) - 90;
            return d.x;
          })
          .attr('y', d => d.y)
          .attr('width', barWidth)
          .attr('height', d => yScale(d.value))
          .style('fill', d => color(d.group))
          .style('stroke', 'none')
          .attr('transform', d => `rotate(${d.a},${d.x},${d.y})`);

        // add date labels
        const tF = d3.timeFormat('%b %Y');
        const firstInMonth = {};

        svg.selectAll('text')
          .data(someData)
          .enter()
          .append('text')
          .attr('dy', 10)
          .style('text-anchor', 'start')
          .style('font', '10px arial')
          .append('textPath')
        // only add for the first of each month
          .filter((d) => {
            const sd = tF(d.date);
            if (!firstInMonth[sd]) {
              firstInMonth[sd] = 1;
              return true;
            }
            return false;
          })
          .text(d => tF(d.date))
          // place text along spiral
          .attr('xlink:href', '#spiral')
          .style('fill', 'grey')
          .attr('startOffset', d => `${(d.linePer / spiralLength) * 100}%`);


        const tooltip = d3.select('#chart')
          .append('div')
          .attr('class', 'tooltip');

        tooltip.append('div')
          .attr('class', 'date');
        tooltip.append('div')
          .attr('class', 'value');

        svg.selectAll('rect')
          .on('mouseover', (d) => {
            tooltip.select('.date').html(`Date: <b>${d.date.toDateString()}</b>`);
            tooltip.select('.value').html(`Value: <b>${Math.round(d.value * 100) / 100}<b>`);

            d3.select(this)
              .style('fill', '#FFFFFF')
              .style('stroke', '#000000')
              .style('stroke-width', '2px');

            tooltip.style('display', 'block');
            tooltip.style('opacity', 2);
          })
          .on('mousemove', (d) => {
            tooltip.style('top', `${d3.event.layerY + 10}px`)
              .style('left', `${d3.event.layerX - 25}px`);
          })
          .on('mouseout', (d) => {
            d3.selectAll('rect')
              .style('fill', color(d.group))
              .style('stroke', 'none');

            tooltip.style('display', 'none');
            tooltip.style('opacity', 0);
          });
      }

      function drawTimeLine() {
        // const { gatekeeperprops } = this.state;
        // const { ptt, news } = gatekeeperprops;
        // console.log(news, ptt);

        const xScale = d3.scaleTime().domain([startDate, endDate]).range([0, 100]);
        const colorScale = d3.scaleLinear().domain([0, 1]).range([0.0, 0.5]);
        const timeLinecolor = d3.interpolateSinebow;

        // function update() {
        timeLineSvg.selectAll('*').remove();

        const formatTime = d3.timeFormat('%B %d, %Y');
        // const g = timeLineSvg.append('foreignObject')
        //   .attr('width', '100%')
        //   .attr('height', '100%')
        //   .style('overflow-y', 'scroll');
        // const spectrums = g.append('g');
        const spectrums = timeLineSvg.append('g');
        // spectrums.attr('transform', `translate(${width / 2 - 270}, -100) scale(1.2,1.2)`);
        let domainName = [];
        set.nodes.forEach((term) => {
          domainName.push(term.titleTerm);
        });

        const term_y = d3.scalePoint().range([0, domainName.length * 10]);
        term_y.domain(domainName);

        const date_x = d3.scaleTime().range([0, 900]);
        date_x.domain([startDate, endDate]);
        const colors = d3.schemeTableau10;
        console.log(colors);
        for (let i = 0; i < domainName.length; i += 1) {
          const postTime = spectrums.selectAll('line').data(set.nodes[i].date);
          postTime.enter()
            .append('circle')
            .attr('transform', 'translate(110,20)')
            .attr('cy', (i * 10) + 1)
            .attr('cx', d => date_x(new Date(d)))
            .attr('r', 2)
            .style('fill', colors[((i % 10) + 1)]);
        }
        

        // Add the x Axis
        const axisX = spectrums;
        const axisY = spectrums;

        axisY.append('g')
          .attr('transform', 'translate(110,20)')
          .call(d3.axisLeft(term_y).tickFormat(d => d));

        axisX.append('g')
          .attr('transform', 'translate(110,17)')
          .call(d3.axisTop(date_x).tickFormat(d3.timeFormat('%m/%d')));

        axisY.attr('color', 'black');
      }

      function drawHeatMap() {
        // set the dimensions and margins of the graph
        heatMapSvg.selectAll('*').remove();
        const margin = {
          top: 30, right: 30, bottom: 30, left: 30,
        };
        const heatMapWidth = 450 - margin.left - margin.right;
        const heatMapHeight = 450 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        heatMapSvg = heatMapSvg.attr('height', heatMapHeight + margin.top + margin.bottom)
          .append('g')
          .attr('transform',
            `translate(${300}, ${margin.top})`);

        // Labels of row and columns
        // const myGroups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        const domainName = [];
        set.nodes.forEach((term) => {
          domainName.push(term.titleTerm);
        });
        // const myVars = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9', 'v10'];
        // const postDate = [new Date('2019/4/1'), new Date('2019/5/2'), new Date('2019/5/3')];
        const postDate = [];
        const currentDate = startDate;
        while (currentDate <= endDate) {
          postDate.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Build X scales and axis:
        const heatMapX = d3.scaleBand()
          .range([0, heatMapWidth])
          .domain(postDate)
          .padding(0.01);
        heatMapSvg.append('g')
          .attr('transform', `translate(0, ${heatMapHeight})`)
          .call(d3.axisBottom(heatMapX).tickFormat(d3.timeFormat('%m/%d')));

        // Build X scales and axis:
        const heatMapY = d3.scaleBand()
          .range([heatMapHeight, 0])
          .domain(domainName)
          .padding(0.01);
        heatMapSvg.append('g')
          .call(d3.axisLeft(heatMapY));

        // Build color scale
        const myColor = d3.scaleLinear()
          .range(['white', '#69b3a2'])
          .domain([1, 100]);

        // Read the data

        heatMapSvg.selectAll()
          .data([{ group: domainName[0], variable: new Date('2019/5/2'), value: '71' }, { group: domainName[2], variable: new Date('2019/5/3'), value: '11' }])
          .enter()
          .append('rect')
          .attr('x', (d) => {
            console.log(d.group);
            heatMapY(d.group);
          })
          .attr('y', d => heatMapX(d.variable))
          .attr('width', heatMapY.bandwidth())
          .attr('height', heatMapX.bandwidth())
          .style('fill', d => myColor(d.value));
        // });
      }

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
                set.links.push({
                  source: id_1.titleTerm,
                  target: d,
                  color: '#ffbb78',
                  tag: 0,
                  value: 10,
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
                        set.links.push({
                          source: id_1.id,
                          target: _node.titleTerm,
                          tag: 1,
                          color: '#ffbb78 ',
                          value: 1000000,
                        });
                      }
                    });
                  }
                });
                const existId = set.nodes.find(ele => ele.titleTerm === id_1.id);
                if (existId === undefined) {
                  // const { count } = userList.find(user => user.id === id_1.id);
                  set.nodes.push({
                    titleTerm: id_1.id,
                    parentNode: d.titleTerm,
                    count: id_1.count,
                    group: 2,
                    tag: 1,
                    connected: 1,
                    merge: id_1.merge,
                    numOfUsr: id_1.numOfUsr,
                    x: d.x,
                    y: d.y,
                    size: 5 * id_1.merge,
                  });
                }
                set.links.push({
                  source: id_1.id,
                  target: d,
                  color: '#ffbb78',
                  tag: 1,
                  value: 1000000,
                });
              } else {
                const index = set.nodes.findIndex(_node => _node.titleTerm === id_1.id);
                set.nodes[index].connected += 1;
              }
            }
          });
          // set.links = removeDuplicates(set.links, 'source');
          // console.log(set.links);
          // let nodeToBeMerged = set.nodes.filter(_node => _node.parentNode === d.titleTerm);
          // nodeToBeMerged = nodeToBeMerged.filter(_node => _node.count === 1);
          // // set.nodes.find(_node => _node.titleTerm === nodeToBeMerged.titleTerm)
          // console.log(nodeToBeMerged);
          // for (let i = 1; i <= nodeToBeMerged.length - 1; i += 1) {
          //   // set.nodes.find(_node => _node.titleTerm === nodeToBeMerged.titleTerm).titleTerm
          //   const linkToBeMerged = set.links.filter(
          //     _link => _link.source === nodeToBeMerged[0].titleTerm,
          //   );
          //   console.log(linkToBeMerged);
          //   nodeToBeMerged[0].titleTerm += nodeToBeMerged[i].titleTerm;
          //   linkToBeMerged[0].source += nodeToBeMerged[i].titleTerm;
          //   // linkToBeMerged[1].source += nodeToBeMerged[i].titleTerm;
          // }
          // console.log(set);
          // console.log(nodeToBeMerged);


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
                console.log(_node, id_1);
                if (_node === undefined) {
                  return -1;
                }
                return _node.titleTerm === id_1.id;
              });
              // console.log(id_1, index_1)
              // console.log(set.nodes, index_1);
              set.nodes[index_1].connected -= 1;

              set.nodes.forEach((_node) => {
                if (_node.titleTerm === id_1.id && _node.connected <= 0) {
                  delete set.nodes[set.nodes.indexOf(_node)];
                  set.nodes = set.nodes.filter(() => true);
                }
              });

              const { length } = set.links;
              for (let j = 0; j < length; j += 1) {
                const pos = set.links.map(e => e.source.titleTerm).indexOf(id_1.id);
                if (pos !== -1) {
                  const index_2 = set.nodes.findIndex((_node) => {
                    if (_node === undefined) {
                      return -1;
                    }
                    return _node.titleTerm === id_1.id;
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
        console.log('done!');
        update();
      }

      function mouseOut() {
        node.style('stroke-opacity', d => 1);
        node.style('fill-opacity', 1);
        node.selectAll('text').style('visibility', d => (d.group === 2 ? 'visible' : 'visible'));
        node.selectAll('circle').style('fill', (d) => {
          if (d.group === 2) {
            return '#ff7f0e';
          }
          return '1f77b4';
        });
        link.style('stroke-opacity', 1);
        link.style('stroke', d => '#ddd');
      }
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
    function mouseOver(opacity) {
      return (d) => {
        // check all other nodes to see if they're connected
        // to this one. if so, keep the opacity at 1, otherwise
        // fade
        // node.selectAll('circles').style('stroke-opacity', (o) => {
        //   let thisOpacity = isConnected(d, o) ? 1 : opacity;
        //   return thisOpacity;
        // });
        // node.style('fill-opacity', (o) => {
        //   let thisOpacity = isConnected(d, o) ? 1 : opacity;
        //   return thisOpacity;
        // });
        node.selectAll('text').style('visibility', (o) => {
          if (isConnected(d, o) || o.tag !== 0) {
            return 'visible';
          }
          return 'hidden';
        });
        // also style link accordingly
        link.style('stroke-opacity', o => (o.source === d || o.target === d ? 1 : opacity));
        link.style('stroke', o => (o.source === d || o.target === d ? '#2E2E2E' : '#ddd'));
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

    function removeDuplicates(array, key) {
      const lookup = new Set();
      return array.filter(obj => !lookup.has(obj[key]) && lookup.add(obj[key]));
    }
  }

  render() {
    // const myRef = 'titleUserView';
    const { id } = this.props;
    return (
      <div id={`#${id}`}>
        <div ref={this.myRef}>
          <svg id="barChart" width="20%" height="700px" />
          <svg id="graph" width="80%" height="700px" />
          <svg id="timeLine" width="100%" height="200px" />
        </div>
      </div>
    );
  }
}

export default Graph;
