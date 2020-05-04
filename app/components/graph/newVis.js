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
    const { hover, word } = this.state;
    // console.log(this.props, nextProps);
    // console.log(thisWithoutOpState, nextWithoutOpState);
    if (!hover) {
      if (JSON.stringify(thisWithoutOpState) === JSON.stringify(nextWithoutOpState)) {
        if (JSON.stringify(word) === JSON.stringify(nextState.word)) {
          console.log('shouldUpdate? No!!');
          return false;
        }
      }
    }
    console.log('vis update !');
    if (JSON.stringify(thisWithoutOpState)
      !== JSON.stringify(nextWithoutOpState) || nextState.draw === 1) {
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
    const beforeThisDate = startDate;
    const timeScale = d3.scaleTime().domain([startDate, endDate]).range([0, 100]);
    const { set: propsSet } = this.props;
    const set = JSON.parse(JSON.stringify(propsSet));
    const authorSet = removeTermLayer(set);
    console.log(authorSet);
    const authorTable = d3.select('#authorList');

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
    const selectedCluster = -1;
    const fontSizeThreshhold = 0;
    const sliderHasBeenLoaded = 0;
    const NodeHiding = 1;
    const cellData = { nodes: [], links: [] };
    let totalAuthorInfluence = 0;
    const svgwidth = parseFloat(d3.select('#graph').style('width'));
    const svgHeight = parseFloat(d3.select('#graph').style('height'));
    const authorInfluenceThreshold = 100;
    const articleInfluenceThreshold = 1;
    const topAuthorThreshold = 8;
    const cellForceSimulation = d3.forceSimulation()
      .force('link', d3.forceLink().id((d) => {
        if (d.group === 1) return d.titleTerm;

        return d.articleId ? d.articleId : d.id;
      }))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('charge', d3.forceManyBody().distanceMax(1000))
      .force('center', d3.forceCenter(0, 0))
      .alphaTarget(1);
    // cellForceSimulation.alphaTarget(0.3).restart();
    AuthorTable(authorSet, authorTable, (n, index) => {
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
    function removeTermLayer(data) {
      if (!data) return [];
      const { nodes: termNodes } = data;
      const authorNodes = [];
      termNodes.forEach((termnode) => {
        termnode.children.forEach((user) => {
          console.log(authorNodes);
          console.log(authorNodes.some(e => e.id === user.id), user.id);
          if (!authorNodes.some(e => e.id === user.id)) {
            authorNodes.push(user);
          }
        });
      });
      return { children: authorNodes };
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
          <div className="selectedUserTable d-flex flex-column" style={{ margin: '0px 0px 20px 0px', maxHeight: '700px', minHeight: '400px' }} />
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
        {/* <div className="heatMap" style={{ border: '2px solid gray', height: 'fit-content', overflowX: 'scroll' }}>
          <svg id="timeLine" width="100%" height="600px" />
        </div> */}
        {/* </div> */}
        <div className="userDailyActivity" style={{ border: '2px solid gray', height: 'fit-content', overflowX: 'scroll' }}>
          <svg id="userDailyActivity" width="100%" height="100%" style={{}} />
        </div>
      </div>
    );
  }
}

export default Graph;
