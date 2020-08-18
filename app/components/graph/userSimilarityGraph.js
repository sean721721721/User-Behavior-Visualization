/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
/* eslint-disable linebreak-style */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
import * as d3 from 'd3';
import * as science from 'science';
import * as Queue from 'tiny-queue';
import * as reorder from 'reorder.js/index';
import * as math from 'mathjs';
import * as slider from 'd3-simple-slider';
// eslint-disable-next-line import/no-unresolved
import netClustering from 'netclustering';
import CheckboxGroup from 'antd/lib/checkbox/Group';
import { cps } from 'redux-saga/effects';
import jLouvain from './jLouvain';
import { userActivityTimeline } from './userActivityTimeline';
import { userDailyActivity } from './userDailyActivity';

export default function userSimilarityGraph(data, svg, user, articles) {
  // console.log(user);
  const svgScale = d3.scaleSqrt().domain([1, 200]).range([0.5, 0.1]);
  const commentTimelineSvg = d3.select('#commentTimeline');
  const h = parseFloat(d3.select('.heatMap').style('height'));
  const focusHeight = 500;
  svg.selectAll('*').remove();
  const margin = {
    top: 30, right: 30, bottom: 60, left: 30,
  };
  const width = 1300 - margin.left - margin.right;
  const height = 450 - margin.top - margin.bottom;
  const userSimilarity = computeUserSimilarityByArticles(data, user);
  // const myGroups = getAllAuthorId(data); // author
  const clickedUser = [];

  const [filteredArticles, articleSimilarity] = computeArticleSimilarity(data);
  console.log('articleSimilarity: ', articleSimilarity);
  const articleIds = filteredArticles.map(e => e.article_id);
  const articlesCommunity = jLouvainClustering(articleIds, articleSimilarity);
  // const articlesCommunity = articleGroupByTag(articleIds, filteredArticles);
  console.log('articlesCommunity', articlesCommunity);

  drawSlider();
  drawFilterDiv();
  drawSortOptionDiv();

  function computeArticleSimilarity(userArr) {
    const articleArray = [];
    userArr.forEach((u) => {
      u.repliedArticle.forEach((a) => {
        if (!articleArray.some(e => e.article_id === a.article_id)) {
          articleArray.push(a);
        }
      });
    });
    // console.log(articleArray);
    const array = [];
    for (let i = 0; i < articleArray.length; i += 1) {
      const temp = articleArray[i];
      for (let j = i + 1; j < articleArray.length; j += 1) {
        const next = articleArray[j];
        const intersect = temp.cuttedTitle.filter(c1 => next.cuttedTitle.some(c2 => c2.word === c1.word));
        // console.log(intersect, temp.cuttedTitle, next.cuttedTitle);
        const sim = intersect.length / (temp.cuttedTitle.length + next.cuttedTitle.length - intersect.length);
        if (sim) {
          array.push({
            source: temp.article_id,
            target: next.article_id,
            value: sim,
          });
        }
      }
    }
    return [articleArray, array];
  }

  function jLouvainClustering(nodes, edges) {
    const edge_data = edges.map((e) => {
      e.weight = e.value * 10;
      return e;
    });

    // console.log('Input Node Data2', nodes);
    // console.log('Input Edge Data2', edge_data);

    const node_data3 = [];
    for (let i = 0; i < nodes.length; i += 1) {
      node_data3.push(i);
    }
    let edge_data3 = [];
    edge_data3 = edge_data.map((e) => {
      const s = nodes.findIndex(d => d === e.source);
      const t = nodes.findIndex(d => d === e.target);
      return { source: s, target: t, weight: e.weight };
    });

    // console.log('Input Node Data3', node_data3);
    // console.log('Input Edge Data3', edge_data3);

    const community3 = jLouvain().nodes(node_data3).edges(edge_data3);
    // console.log(community3());
    // Drawing code
    const original_node_data = d3.entries(nodes);
    // console.log(original_node_data);

    const forceSimulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.key));
    forceSimulation
      .nodes(original_node_data);

    forceSimulation
      .force('link')
      .links(edge_data3);
    // Communnity detection on click event
    const community_assignment_result = community3();
    // console.log(original_node_data);
    // console.log('Resulting Community Data', community_assignment_result);
    const final = [];
    const keys = Object.keys(community_assignment_result);
    for (let i = 0; i < keys.length; i += 1) {
      final.push({ id: nodes[keys[i]], community: community_assignment_result[keys[i]] });
    }
    // console.log('node after clustering', final);
    return final;
  }

  function drawSlider() {
    d3.select('.option').selectAll('*').remove();
    const sliderSvg = d3.select('.option').append('div')
      .style('display', 'inline-block')
      .append('svg')
      .attr('class', 'sliderSvg')
      .attr('width', '220px')
      .attr('height', '50px')
      .append('g')
      .attr('transform', 'scale(0.8)');
    let similarThresh = 0.2;
    let articleThresh = 1;
    const similaritySlider = slider.sliderBottom()
      .min(0)
      .max(1)
      .width(150)
      .tickFormat(d3.format('.1'))
      .ticks(5)
      .default(similarThresh)
      .on('onchange', (val) => {
        similarThresh = val;
        adjacencyMatrixNoAuthor(userSimilarity, similarThresh, articleThresh);
      });

    const gSlider1 = sliderSvg.append('g')
      .attr('class', 'similaritySlider')
      .attr('transform', `translate(${3 * margin.left},${margin.top / 2})`);
    const sliderText1 = sliderSvg.append('g')
      .attr('transform', `translate(0,${margin.top / 2})`)
      .append('text')
      .text('Similarity')
      .attr('y', 5);
    gSlider1.call(similaritySlider);

    d3.select('.similaritySlider')
      .selectAll('.tick')
      .selectAll('text')
      .attr('y', 10);
    const repliedSliderSvg = d3.select('.option').append('div')
      .style('display', 'inline-block')
      .append('svg')
      .attr('class', 'repliedSliderSvg')
      .attr('height', '50px')
      .attr('width', '220px')
      .append('g')
      .attr('transform', 'scale(0.8)');
    const repliedSlider = slider.sliderBottom()
      .min(0)
      .max(100)
      .width(150)
      // .tickFormat(d3.format('.1'))
      .ticks(10)
      .default(articleThresh)
      .on('onchange', (val) => {
        articleThresh = val;
        adjacencyMatrixNoAuthor(userSimilarity, similarThresh, articleThresh);
      });

    const gSlider2 = repliedSliderSvg.append('g')
      .attr('class', 'repliedSlider')
      .attr('transform', `translate(${3 * margin.left + 10},${margin.top / 2})`);
    const sliderText2 = repliedSliderSvg.append('g')
      .attr('transform', `translate(0,${margin.top / 2})`)
      .append('text')
      .text('ReplyCount')
      .attr('y', 5);
    gSlider2.call(repliedSlider);

    d3.select('.repliedSlider')
      .selectAll('.tick')
      .selectAll('text')
      .attr('y', 10);
    adjacencyMatrixNoAuthor(userSimilarity, similarThresh, articleThresh);
  }

  function drawFilterDiv() {
    let filterDiv = d3.select('.heatMap').select('.option').append('div')
      .style('display', 'inline-block')
      .attr('class', 'filterDiv');
    filterDiv = filterDiv.append('div')
      .style('margin-bottom', '0px')
      .style('transform', 'scale(0.8)')
      .text('ArticleGroupBy:');
    const tagInput = filterDiv.append('div')
      .style('margin-left', '10px');
    tagInput.append('input')
      .attr('type', 'radio')
      .attr('id', 'tag')
      .attr('name', 'group')
      .attr('value', 'tag')
      .property('checked', true);
    tagInput.append('label')
      .attr('for', 'tag')
      .style('margin-left', '10px')
      .text('tag');
  }
  // heatMapWithAuthor();

  function drawSortOptionDiv() {
    d3.select('.contextDiv').select('.option').selectAll('*').remove();
    const sortDiv = d3.select('.contextDiv').select('.option')
      .append('div')
      .attr('class', 'sort')
      .style('margin-top', '10px');
    const tagInput = sortDiv.append('div')
      .style('margin-left', '10px');
    tagInput.append('label')
      .style('margin-bottom', '0px')
      .text('SortBy:');
    tagInput.append('input')
      .attr('type', 'radio')
      .attr('id', 'date')
      .attr('name', 'sort')
      .attr('value', 'date')
      .property('checked', true);
    tagInput.append('label')
      .attr('for', 'date')
      .style('margin-left', '10px')
      .text('date');
    tagInput.append('input')
      .attr('type', 'radio')
      .attr('id', 'push')
      .attr('name', 'sort')
      .attr('value', 'push')
      .property('checked', null);
    tagInput.append('label')
      .attr('for', 'push')
      .style('margin-left', '10px')
      .text('push');
    tagInput.append('input')
      .attr('type', 'radio')
      .attr('id', 'boo')
      .attr('name', 'sort')
      .attr('value', 'boo')
      .property('checked', null);
    tagInput.append('label')
      .attr('for', 'boo')
      .style('margin-left', '10px')
      .text('boo');
    tagInput.append('input')
      .attr('type', 'radio')
      .attr('id', 'comments')
      .attr('name', 'sort')
      .attr('value', 'comments')
      .property('checked', null);
    tagInput.append('label')
      .attr('for', 'comments')
      .style('margin-left', '10px')
      .text('comments');
  }

  function computeUserSimilarityByArticles(userAuthorRelationShipArr) {
    const similarityScale = d3.scaleLinear().domain([0, 2]).range([1, 0]);
    // if (userAuthorRelationShipArr[0].titleWordScore) {
    //   const userListArray = [];
    //   for (let i = 0; i < userAuthorRelationShipArr.length - 1; i += 1) {
    //     const temp = userAuthorRelationShipArr[i].titleWordScore;
    //     const tempTotal = temp.reduce((acc, obj) => acc + obj.score, 0);
    //     for (let j = i + 1; j < userAuthorRelationShipArr.length; j += 1) {
    //       const next = userAuthorRelationShipArr[j].titleWordScore;
    //       const searchedWord = [];
    //       let dis = 0;
    //       const nextTotal = next.reduce((acc, obj) => acc + obj.score, 0);
    //       temp.forEach((e, index) => {
    //         if (!searchedWord.includes(e.word)) {
    //           searchedWord.push(e.word);
    //           const sameWord = next.find(e1 => e1.word === e.word);
    //           const nextWordScore = sameWord ? sameWord.score : 0;
    //           dis += Math.sqrt(Math.abs(((e.score / tempTotal) * (e.score / tempTotal)) - ((nextWordScore / nextTotal) * (nextWordScore / nextTotal))));
    //         }
    //       });
    //       next.forEach((e, index) => {
    //         if (!searchedWord.includes(e.word)) {
    //           searchedWord.push(e.word);
    //           const sameWord = temp.find(e1 => e1.word === e.word);
    //           const tempWordScore = sameWord ? sameWord.score : 0;
    //           dis += Math.sqrt(Math.abs(((e.score / nextTotal) * (e.score / nextTotal)) - ((tempWordScore / tempTotal) * (tempWordScore / tempTotal))));
    //         }
    //       });
    //       // const sim = 1 / (1 + (dis));
    //       // console.log(`${userAuthorRelationShipArr[i].id} ${userAuthorRelationShipArr[j].id} dis: ${dis} sim: ${similarityScale(dis)}`);
    //       // console.log(userAuthorRelationShipArr[i].id, userAuthorRelationShipArr[j].id, dis);
    //       userListArray.push({
    //         source: userAuthorRelationShipArr[i].id,
    //         target: userAuthorRelationShipArr[j].id,
    //         value: similarityScale(dis),
    //       });
    //     }
    //   }
    //   return userListArray;
    // }

    const userListArray = [];
    for (let i = 0; i < userAuthorRelationShipArr.length - 1; i += 1) {
      const temp = userAuthorRelationShipArr[i].repliedArticle;
      for (let j = i + 1; j < userAuthorRelationShipArr.length; j += 1) {
        const next = userAuthorRelationShipArr[j].repliedArticle;
        const tempdiff = temp.filter(
          o1 => next.filter(o2 => o2.article_id === o1.article_id).length === 0,
        );
        const nextdiff = next.filter(
          o1 => temp.filter(o2 => o2.article_id === o1.article_id).length === 0,
        );
        const intersectArticles = temp.length - tempdiff.length;
        const nextintersectArticles = next.length - nextdiff.length;
        const sim = intersectArticles / (temp.length + next.length - intersectArticles);
        userListArray.push({
          source: userAuthorRelationShipArr[i].id,
          target: userAuthorRelationShipArr[j].id,
          value: sim,
        });
      }
    }
    return userListArray;
  }

  function adjacencyMatrixNoAuthor(similarity, simThresh, artThresh) {
    console.log(similarity, simThresh, artThresh);
    d3.select('.position').remove();
    d3.select('.groupLegends').remove();
    // svg.attr('height', h);
    // svg.attr('width', w);
    // svg.attr('height', h);
    svg.call(d3.zoom()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 8])
      .on('zoom', zoomed));
    const position = svg.append('g')
      .attr('class', 'position');
    const group = position.append('g')
      .attr('class', 'group')
      .attr('transform', 'translate(-30,-100)');
    function zoomed() {
      group.attr('transform', d3.event.transform);
    }
    const color = d => d3.schemeTableau10[d];
    // Article Similarity

    console.log(similarity);
    const [datas, users, similaritys] = filterAlwaysNonSimilarUser(data, user, similarity, simThresh, artThresh);
    console.log('datas:', datas, 'users:', users, 'similaritys:', similaritys);
    // similarity for articles grouping
    // let filteredArticles = articles;
    // filteredArticles = filteredArticles.filter(
    //   e => e.messages.some(mes => datas.some(usr => usr.id === mes.push_userid)),
    // );

    // similarity for articles grouping
    // const [filteredArticles, articleSimilarity] = computeArticleSimilarity(datas);
    // console.log('articleSimilarity: ', articleSimilarity);
    // const articleIds = filteredArticles.map(e => e.article_id);
    // const articlesCommunity = jLouvainClustering(articleIds, articleSimilarity);
    // const articlesCommunity = articleGroupByTag(articleIds, filteredArticles);
    console.log('articlesCommunity', articlesCommunity);


    // articlesOrderByCommunity = articlesOrdering(articles, articlesCommunity);
    // console.log('articlesOrderByCommunity', articlesOrderByCommunity);
    const articlesOrderByCommunity = filteredArticles;
    // responderCommunityDetecting(nodes, similaritys);
    const newUserAxisValues = [];
    const axisDomain = [];
    for (let i = 0; i < users.length; i += 1) {
      axisDomain.push(i);
    }
    const community = jLouvainClustering(users, similaritys);
    community.forEach((e) => {
      datas.find(e1 => e1.id === e.id).community = e.community;
    });
    const communityWord = computeCommunityTitleWordScore(datas);
    console.log('communityWord: ', communityWord);
    if (communityWord.length) {
      const score = communityWord[0].wordList.reduce((acc, obj) => acc + obj.score, 0);
    }

    const [matrix, origMatrix] = relationToMatrix(similaritys, users);
    const similarityScale = d3.scalePow().exponent(0.5).range([0, 100]);
    // enlarge the difference between users
    for (let i = 0; i < users.length; i += 1) {
      matrix[i] = matrix[i].map(e => similarityScale(e));
      // matrix[i] = matrix[i].map(e => e * 100);
    }
    const [permuted_mat, permuted_origMat] = matrixReordering(
      matrix, origMatrix, newUserAxisValues, users,
    );
    console.log('permuted_mat, permuted_origMat: ', permuted_mat, permuted_origMat);
    let [secondOrdering_mat, secondOrdering_origMat] = matrixReorderingByCommunity(
      permuted_mat, permuted_origMat, community, newUserAxisValues, users,
    );
    // const [secondOrdering_mat, secondOrdering_origMat] = [permuted_mat, permuted_origMat];
    console.log('secondOrdering_mat, secondOrdering_origMat: ', secondOrdering_mat, secondOrdering_origMat);

    const gridSize = 20;
    const x = d3.scaleBand().range([0, axisDomain.length * gridSize])
      .domain(axisDomain);
    // d3.select('.position').attr('transform', `scale(1) translate(${w / 2 - x.range()[1] / 2},${2 * margin.top})`);
    d3.select('.position').attr('transform', `scale(1) translate(${2 * margin.left},${4 * margin.top})`);
    const leftSvg = group.append('g')
      .attr('class', 'leftSvg')
      .attr('transform', `rotate(-45) scale(${svgScale(datas.length) > 0 ? svgScale(datas.length) : 0.4}) translate(0,0)`);

    const y = d3.scaleBand().range([0, axisDomain.length * gridSize])
      .domain(axisDomain);

    // Build color scale
    const userColor = userColorScaleArray(datas);
    const myColor = d3.scaleLinear()
      .range([d3.interpolateYlOrRd(0), d3.interpolateYlOrRd(0.8)])
      .domain([0, 1]);
    const leftMyColor = d3.scaleLinear()
      // .range([d3.interpolateYlOrRd(0), d3.interpolateYlOrRd(0.8)])
      .range(['white', color(9)])
      .domain([0, 100]);
    const scaleExponent = d3.scalePow().exponent(2);
    d3.select('.tooltip').remove();
    const Tooltip = d3.select('.heatMap')
      .append('div')
      .style('opacity', 0)
      .attr('class', 'tooltip')
      .style('background-color', 'black')
      .style('border', 'solid')
      .style('border-width', '2px')
      .style('border-radius', '5px')
      .style('padding', '5px');

    // Three function that change the tooltip when user hover / move / leave a cell
    const mouseover = (d, index, i) => {
      if (typeof d === 'string') {
        // user axis
        d3.selectAll(`circle.${d}`)
          .attr('r', 10);
      }
      const xUser = newUserAxisValues[index];
      const yUser = newUserAxisValues[i];
      Tooltip
        .style('opacity', 1)
        .html(`<p style="color: white;">Similarity between ${xUser} and ${yUser} is ${Math.round(d * 100) / 100}</p>`)
        .style('left', `${d3.event.pageX + 25}px`)
        .style('top', `${d3.event.pageY}px`);
      d3.select(this)
        .style('stroke', 'black')
        .style('opacity', 1);
    };
    const authorGroupMouseover = (string) => {
      Tooltip
        .style('opacity', 1)
        .html(string)
        .style('left', `${d3.event.pageX + 25}px`)
        .style('top', `${d3.event.pageY - 100}px`);
      d3.select(this)
        .style('stroke', 'black')
        .style('opacity', 1);
    };
    const mouseout = (d) => {
      if (typeof d === 'string') {
        // user axis
        d3.selectAll(`circle.${d}`)
          .attr('r', 3);
      }
      Tooltip
        .style('opacity', 0)
        .style('left', '0px')
        .style('top', '0px');
      d3.select(this)
        .style('stroke', 'none')
        .style('opacity', 0.8);
    };

    const rectClick = (d, index, i) => {
      console.log(index);
      let bothRepliedArticles = [];
      if (i) {
        const xID = newUserAxisValues[index];
        const yID = newUserAxisValues[i];
        const xUser = datas.find(e => e.id === xID);
        const yUser = datas.find(e => e.id === yID);
        d3.select('.leftSvg').selectAll('rect')
          .attr('stroke', 'white');
        d3.selectAll(`.x${index}`).transition().duration(500)
          .attr('stroke', 'black');
        d3.selectAll(`.y${i}`).transition().duration(500)
          .attr('stroke', 'black');

        bothRepliedArticles = xUser.repliedArticle.filter(
          e => yUser.repliedArticle.some(e2 => e2.article_id === e.article_id),
        );
      } else {
        const articleIdArr = d.map(e => e.article_id);
        articleIdArr.forEach((e) => {
          bothRepliedArticles.push(articles.find(e1 => e1.article_id === e));
        });
      }
      articles.sort((a, b) => {
        if (bothRepliedArticles.find(e => e.article_title === b.article_title)) return 1;
        return -1;
      });
      console.log('sorted articles', articles);
      console.log(bothRepliedArticles);
      updateArticleMatrix(articles, bothRepliedArticles, index);
      // updateArticleMatrixv2(bothRepliedArticles, index);
    };
    let selectedUser = [];
    const tickClick = (d) => {
      const beginDate = d3.select('#date1').attr('value');
      const endDate = d3.select('#date2').attr('value');
      const { community: thisCom } = datas.find(e => e.id === d);
      console.log(thisCom);
      const us = datas.filter(_d => _d.community === thisCom).map(e => e.id);
      userDailyActivity(articles, us, commentTimelineSvg, beginDate, endDate);
      // console.log(d);
      // if (!selectedUser.includes(newUserAxisValues[d])) {
      //   selectedUser.push(newUserAxisValues[d]);
      // } else {
      //   selectedUser = selectedUser.filter(e => e !== newUserAxisValues[d]);
      // }
      // if (selectedUser.length >= 1) {
      //   const filtered_articles = articles.filter(
      //     art => art.messages.some(m => selectedUser.includes(m.push_userid)),
      //   );
      //   userActivityTimeline(filtered_articles, commentTimelineSvg, selectedUser);
      // }
    };

    // find user group index
    const groupIndex = [];
    newUserAxisValues.forEach((e, index) => {
      const tempCom = community.find(e1 => e1.id === e).community;
      const existedCommunity = groupIndex.find(e1 => e1.community === tempCom);
      if (existedCommunity) existedCommunity.num += 1;
      else groupIndex.push({ community: tempCom, num: 1, index });
    });
    console.log('groupIndex:', groupIndex);

    // reorder community inner matrix
    // [secondOrdering_mat, secondOrdering_origMat] = communityInnerMatrixReordering(secondOrdering_mat, secondOrdering_origMat, newUserAxisValues, users, groupIndex);
    // console.log(secondOrdering_mat, secondOrdering_origMat);

    // draw userGroup legends
    const groupLegend = d3.select('#timeLine')
      .append('g').attr('class', 'groupLegends')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    groupLegend.selectAll('rect')
      .data(groupIndex)
      .enter()
      .append('g')
      .attr('class', (d, index) => `group_${index}`)
      .attr('transform', (d, index) => `translate(${100 * (index % 4)}, ${20 * Math.floor(index / 4)})`)
      // .attr('transform', (d, index) => `translate(0 ${20 * index})`)
      .each((d, index, nodes) => {
        d3.select(nodes[index]).append('text')
          .text(`Group ${index}`)
          .attr('x', 10);

        d3.select(nodes[index]).append('circle')
          .attr('cx', 0)
          .attr('cy', -5)
          .attr('fill', color(index))
          .attr('r', 5);
      });

    const artComWidth = 100 + Math.max(...articlesCommunity.map(e => e.community)) * (2 + 10);
    const articleGroup = group.append('g')
      .attr('class', 'articleGroup')
      .attr('transform', `scale(${svgScale(datas.length)}) translate(${newUserAxisValues.length * gridSize + artComWidth}, 100)`);
    const authorGroup = group.append('g')
      .attr('class', 'authorGroup')
      .attr('transform', `translate(0, ${newUserAxisValues.length * gridSize})`);
    const authorArticleGroup = group.append('g')
      .attr('class', 'authorArticleGroup');
    const leftSvgLineGroup = leftSvg.append('g');
    // drawHeatmap();
    const totalReplied = datas.reduce((prev, current) => {
      const preLen = prev.repliedArticle ? prev.repliedArticle.length : prev;
      const curLen = current.repliedArticle ? current.repliedArticle.length : current;
      return preLen + curLen;
    });
    const bandWidthScale = d3.scaleSqrt().domain([1, totalReplied])
      .range([5, 500]);
    const positionScale = computePosition(datas, bandWidthScale);

    const activityTranslateX = 120;
    drawNewHeatmap();
    // drawCommunityWord();
    drawUserRepliedArticleMatrix(articlesOrderByCommunity);
    drawUserGroupBipartiteRelations();

    function computePosition(userArr, scale) {
      const arr = [];
      let init = 0;
      for (let i = 0; i <= userArr.length; i += 1) {
        arr.push(init);
        if (i < userArr.length) {
          const usr = userArr.find(e => e.id === newUserAxisValues[i]);
          init += scale(usr.repliedArticle.length);
        }
      }
      return arr;
    }

    function drawNewHeatmap() {
      const max = datas.reduce((prev, current) => {
        const preLen = prev.repliedArticle ? prev.repliedArticle.length : prev;
        const curLen = current.repliedArticle ? current.repliedArticle.length : current;
        return (preLen > curLen) ? preLen : curLen;
      });
      const min = datas.reduce((prev, current) => {
        const preLen = prev.repliedArticle ? prev.repliedArticle.length : prev;
        const curLen = current.repliedArticle ? current.repliedArticle.length : current;
        return (preLen < curLen) ? preLen : curLen;
      });

      for (let i = 0; i < permuted_mat.length; i += 1) {
        const leftSvgGroup = leftSvg.append('g');
        leftSvgGroup.selectAll()
          .data(secondOrdering_mat[i])
          .enter()
          .append('rect')
          .each((d, index, nodes) => {
            const xUser = community.find(e => e.id === newUserAxisValues[index]);
            const yUser = community.find(e => e.id === newUserAxisValues[i]);
            if (i < index || xUser.community === yUser.community) {
            // if (i <= index) {
              d3.select(nodes[index])
                .attr('class', () => {
                  const xUserID = newUserAxisValues[index];
                  const yUserID = newUserAxisValues[i];
                  return `${xUserID} ${yUserID} y${i} x${index}`;
                })
                .attr('x', () => positionScale[index])
                .attr('y', positionScale[i])
                .attr('rx', () => {
                  if (i > index) return 0;
                  const size = datas.find(e => e.id === xUser.id).repliedArticle.length;
                  return Math.min(15, bandWidthScale(size) / 10);
                })
                // .attr('stroke', 'white')
                // .attr('stroke-width', () => {
                //   if (i > index) return '0px';
                //   return '2px';
                // })
                .attr('width', () => {
                  const size = datas.find(e => e.id === xUser.id).repliedArticle.length;
                  return bandWidthScale(size);
                })
                .attr('height', () => {
                  const size = datas.find(e => e.id === yUser.id).repliedArticle.length;
                  return bandWidthScale(size);
                })
                .style('fill', () => {
                  if (i > index) return leftMyColor(100);
                  if (xUser.community === yUser.community) {
                    const communityColor = d3.scaleLinear()
                      .range(['white', color(xUser.community)])
                      .domain([0, 100]);
                    return communityColor(d);
                  }
                  return leftMyColor(d);
                })
                .attr('visibility', i >= index ? 'hidden' : 'visible')
                .on('mouseover', () => mouseover(secondOrdering_origMat[i][index], index, i))
                .on('mouseout', mouseout)
                .on('click', () => rectClick(d, index, i));
            }
          });
        const tempUser = community.find(e => e.id === newUserAxisValues[i]);
        leftSvgGroup.append('path')
          .attr('d', () => {
            const start = positionScale[i];
            const size = datas.find(e => e.id === tempUser.id).repliedArticle.length;
            const end = positionScale[i] + bandWidthScale(size);
            return `M ${start} ${start} L ${end} ${start} L ${end} ${end}`;
          })
          .attr('fill', color(tempUser.community));
      }
      // draw user group heatmap
      // for (let i = 0; i < groupIndex.length - 1; i += 1) {
      //   const rectX = groupIndex[i].index;
      //   for (let j = i + 1; j < groupIndex.length; j += 1) {
      //     const rectY = groupIndex[j].index;
      //     leftSvg.append('g')
      //       .attr('class', `community${groupIndex[i].community}${groupIndex[j].community}`)
      //       .append('rect')
      //       .attr('x', positionScale[rectX])
      //       .attr('y', positionScale[rectY])
      //       .attr('rx', () => {
      //         const tem = groupIndex[i].index;
      //         const nex = tem + groupIndex[i].num;
      //         return Math.min(15, (positionScale[nex] - positionScale[tem]) / 10);
      //       })
      //       .attr('ry', () => {
      //         const tem = groupIndex[j].index;
      //         const nex = groupIndex[j + 1] ? groupIndex[j + 1].index : positionScale.length - 1;
      //         return Math.min(15, (positionScale[nex] - positionScale[tem]) / 10);
      //       })
      //       .attr('stroke', 'white')
      //       .attr('stroke-width', '2px')
      //       .attr('height', () => {
      //         const tem = groupIndex[j].index;
      //         const nex = groupIndex[j + 1] ? groupIndex[j + 1].index : positionScale.length - 1;
      //         return positionScale[nex] - positionScale[tem];
      //       })
      //       .attr('width', () => {
      //         const tem = groupIndex[i].index;
      //         const nex = tem + groupIndex[i].num;
      //         return positionScale[nex] - positionScale[tem];
      //       })
      //       .attr('fill', () => {
      //         let totalSim = 0;
      //         for (let k = rectX; k < rectX + groupIndex[i].num; k += 1) {
      //           for (let l = rectY; l < rectY + groupIndex[j].num; l += 1) {
      //             totalSim += secondOrdering_mat[k][l];
      //           }
      //         }
      //         // console.log(totalSim);
      //         return leftMyColor(totalSim / (groupIndex[i].num * groupIndex[j].num));
      //       });
      //   }
      // }
      drawUserAxis();
      leftSvg.append('g').attr('class', 'radialGroup')
        .attr('transform', `translate(0,${positionScale[positionScale.length - 1] + 30})`);
      function drawUserAxis() {
        // y-axis
        leftSvg.append('g')
          .attr('class', 'yAxis')
          .selectAll()
          .data(newUserAxisValues)
          .enter()
          .append('g')
          .append('text')
          .text(d => d)
          .attr('x', positionScale[positionScale.length - 1] + 30)
          .attr('y', (d, index) => (positionScale[index + 1] + positionScale[index]) / 2)
          .attr('fill', (d) => {
            const index = community.findIndex(e => e.id === d);
            return color(community[index].community);
          })
          .attr('dy', '0.2em')
          .style('font-size', (d, index) => (positionScale[index + 1] - positionScale[index]) / 2)
          .on('mouseover', mouseover)
          .on('mouseout', mouseout)
          .on('click', tickClick);

        // x-axis
        leftSvg.append('g')
          .attr('class', 'xAxis')
          .selectAll()
          .data(newUserAxisValues)
          .enter()
          .append('g')
          .append('text')
          .text((d) => {
            const usr = datas.find(e => e.id === d);
            return `${d} ${usr.orig_group}`;
          })
          .attr('dy', '.2em')
          .attr('transform', 'rotate(-90)')
          .style('text-anchor', 'start')
          .attr('x', 10)
          .attr('y', (d, index) => {
            const pos = positionScale.length - index - 2;
            return (positionScale[index + 1] + positionScale[index]) / 2;
          })
          .attr('fill', (d) => {
            const index = community.findIndex(e => e.id === d);
            return color(community[index].community);
          })
          .style('font-size', (d, index) => (positionScale[index + 1] - positionScale[index]) / 2)
          .on('mouseover', mouseover)
          .on('mouseout', mouseout)
          .on('click', tickClick);
        // leftSvg.select('.xAxis')
        //   .attr('transform', `translate(${positionScale[positionScale.length - 1]},-30)`);
      }
    }

    function articleGroupByTag(articleIdArr, articleArr) {
      const tagArr = [];
      const articleIdWithCommunity = [];
      articleArr.forEach((art, index) => {
        const title = art.article_title;
        let tag = '';
        if (title) {
          if (title[0] === 'R') tag = title.substring(4).slice(1, 3);
          else if (title[0] === 'F') tag = title.slice(0, 2);
          else if (title[0] !== '[') tag = 'no-tag';
          else tag = title.slice(1, 3);

          if (tag === 'Go') tag = 'Gossiping';
          if (tag === 'e:') tag = title.substring(7).slice(2, 4);
          const communityIndex = tagArr.findIndex(e => e === tag);
          if (communityIndex !== -1) {
            articleIdWithCommunity.push({ id: art.article_id, community: communityIndex });
          } else {
            articleIdWithCommunity.push({ id: art.article_id, community: tagArr.length });
            tagArr.push(tag);
          }
        }
      });
      console.log(tagArr);
      return articleIdWithCommunity;
    }

    function computeCommunityTitleWordScore(userList) {
      if (!userList[0].titleWordScore) return [];
      const communityWordArr = [];
      const comNums = Math.max(...userList.map(e => e.community)) + 1;
      for (let i = 0; i < comNums; i += 1) {
        communityWordArr.push({ community: i, wordList: [] });
      }
      userList.forEach((usr) => {
        // user's communty
        const usrCom = communityWordArr.find(e => e.community === usr.community);
        // user's top-50 words
        const filteredTitleWord = usr.titleWordScore.filter((e, index) => index < 50);
        // total number of words which user has used
        const usrTotalWordCount = filteredTitleWord.reduce((acc, obj) => acc + obj.score, 0);
        // user's replied articles
        const repliedArticles = usr.repliedArticle;
        usr.titleWordScore.every((e, index) => {
          let push = 0;
          let boo = 0;
          let neutral = 0;
          repliedArticles.forEach((art) => {
            if (art.cuttedTitle.some(w => w.word === e.word)) {
              const mes = art.messages.filter(m => m.push_userid === usr.id);
              push += mes.filter(m => m.push_tag === '推').length;
              boo += mes.filter(m => m.push_tag === '噓').length;
              neutral += mes.filter(m => m.push_tag === '→').length;
            }
          });
          const existedWord = usrCom.wordList.find(c => c.word === e.word);
          if (existedWord) {
            existedWord.score += (e.score / usrTotalWordCount);
            existedWord.push += push;
            existedWord.boo += boo;
            existedWord.neutral += neutral;
          } else {
            usrCom.wordList.push({
              word: e.word, score: e.score / usrTotalWordCount, push, boo, neutral,
            });
          }
          return index < (50 - 1);
        });
      });

      // each score divide by the number of the user of the community
      communityWordArr.forEach((e) => {
        const count = userList.filter(usr => usr.community === e.community).length;
        e.wordList.forEach((list) => {
          list.score = Math.round(list.score / count * 1000) / 1000;
          list.push = Math.round(list.push / count * 1000) / 1000;
          list.boo = Math.round(list.boo / count * 1000) / 1000;
          list.neutral = Math.round(list.neutral / count * 1000) / 1000;
        });
      });
      // sort
      communityWordArr.forEach((e) => {
        e.wordList.sort((a, b) => b.score - a.score);
      });
      return communityWordArr;
    }
    function drawCommunityWord() {
      leftSvg.append('g')
        .attr('class', 'wordGroup')
        .style('pointer-events', 'auto')
        .selectAll('text')
        .data(communityWord)
        .enter()
        .append('g')
        .attr('class', d => `group_${d.community}`)
        .attr('transform', (d, index) => `translate(500, ${200 * index})`)
        .each((d, index, nodes) => {
          d3.select(nodes[index])
            .selectAll('text')
            .data(d.wordList.filter((e, _index) => _index < 10))
            .enter()
            .append('text')
            .attr('y', (_d, _index) => _index * 15)
            .text(_d => `${_d.word}: ${_d.score}`)
            .on('click', (_d) => {
              const articleArr = [];
              const usrs = datas.filter(e => e.community === d.community);
              usrs.forEach((usr) => {
                usr.repliedArticle.forEach((art) => {
                  if (art.cuttedTitle.some(wl => wl.word === _d.word)) {
                    // article contained this word
                    if (!articleArr.some(a => a.article_id === art.article_id)) {
                      articleArr.push(art);
                    }
                  }
                });
              });
              console.log(articleArr);
              rectClick(articleArr, d.community);
            });
        });
    }

    function relationToMatrix(sim, us) {
      const mat = [];
      const origMat = [];
      for (let i = 0; i < us.length; i += 1) {
        mat.push(Array(us.length).fill(1));
        origMat.push(Array(us.length).fill(1));
      }

      sim.forEach((e) => {
        const sourceUserIndex = us.findIndex(u => u === e.source);
        const targetUserIndex = us.findIndex(u => u === e.target);
        mat[sourceUserIndex][targetUserIndex] = e.value;
        mat[targetUserIndex][sourceUserIndex] = e.value;
        origMat[sourceUserIndex][targetUserIndex] = e.value;
        origMat[targetUserIndex][sourceUserIndex] = e.value;
      });

      // console.log('origMat', origMat);
      return [mat, origMat];
    }

    function matrixReordering(mat, origMat, userAxis, us) {
      // console.log(mat, origMat, userAxis, users);
      for (let i = 0; i < us.length; i += 1) {
        userAxis.push(Array(users.length).fill(''));
      }

      const gra = reorder.mat2graph(mat);
      const perm = reorder.spectral_order(gra);

      const orig_gra = reorder.mat2graph(origMat);
      const orig_perm = reorder.spectral_order(orig_gra);

      let tempUser = [...us];
      for (let j = 0; j < us.length; j += 1) {
        userAxis[j] = tempUser[perm[j]];
      }
      tempUser = [...userAxis];
      // console.log(userAxis);
      let permutedMat = reorder.permute(mat, perm);
      permutedMat = reorder.transpose(permutedMat);
      permutedMat = reorder.permute(permutedMat, perm);
      permutedMat = reorder.transpose(permutedMat);

      let originalMat = reorder.permute(origMat, perm);
      originalMat = reorder.transpose(originalMat);
      originalMat = reorder.permute(originalMat, perm);
      originalMat = reorder.transpose(originalMat);

      return [permutedMat, originalMat];
    }

    function matrixReorderingByCommunity(mat, origMat, com, userAxis, us) {
      const max_community = Math.max(...com.map(p => p.community));
      const perm = [];
      for (let i = 0; i <= max_community; i += 1) {
        com.forEach((e, index) => {
          if (e.community === i) {
            const ind = userAxis.findIndex(d => d === e.id);
            perm.push(ind);
          }
        });
      }
      // console.log('community permutation for matrix', perm);
      const tempUser = userAxis.slice();
      for (let j = 0; j < us.length; j += 1) {
        userAxis[j] = tempUser[perm[j]];
      }
      let permutedMat = reorder.permute(mat, perm);
      permutedMat = reorder.transpose(permutedMat);
      permutedMat = reorder.permute(permutedMat, perm);
      permutedMat = reorder.transpose(permutedMat);
      let permutedOrigMat = reorder.permute(origMat, perm);
      permutedOrigMat = reorder.transpose(permutedOrigMat);
      permutedOrigMat = reorder.permute(permutedOrigMat, perm);
      permutedOrigMat = reorder.transpose(permutedOrigMat);
      return [permutedMat, permutedOrigMat];
      // return [mat, origMat];
    }

    function communityInnerMatrixReordering(mat, origMat, userAxis, us, communityData) {
      let copyMat = mat.slice();
      let copyOriginalMat = origMat.slice();
      communityData.forEach((com) => {
        const onlyCommunity = [];
        for (let i = 0; i < mat.length; i += 1) {
          onlyCommunity.push(mat[i].slice(com.index, com.index + com.num));
        }
        const gra = reorder.mat2graph(onlyCommunity);
        const prePerm = reorder.spectral_order(gra);
        // const orig_gra = reorder.mat2graph(origMat);
        // const orig_perm = reorder.spectral_order(orig_gra);
        const perm = [];
        for (let i = 0; i < mat.length; i += 1) {
          if (i < com.index || i >= com.index + com.num) {
            perm.push(i);
          } else {
            perm.push(prePerm[i - com.index] + com.index);
          }
        }
        const tempUser = userAxis.slice();
        for (let j = 0; j < us.length; j += 1) {
          userAxis[j] = tempUser[perm[j]];
        }
        console.log(userAxis);
        let permutedMat = reorder.permute(mat, perm);
        permutedMat = reorder.transpose(permutedMat);
        permutedMat = reorder.permute(permutedMat, perm);
        permutedMat = reorder.transpose(permutedMat);
        copyMat = permutedMat;
        let originalMat = reorder.permute(origMat, perm);
        originalMat = reorder.transpose(originalMat);
        originalMat = reorder.permute(originalMat, perm);
        originalMat = reorder.transpose(originalMat);
        copyOriginalMat = originalMat;
      });

      return [copyMat, copyOriginalMat];
    }

    function userColorScaleArray(d) {
      const scaleArray = {};
      d.forEach((usr) => {
        scaleArray[usr.id] = d3.scaleLinear()
          .range([d3.interpolateYlOrRd(0.2), d3.interpolateYlOrRd(0.8)])
          .domain([1, usr.totalReplyCount]);
      });
      return scaleArray;
    }

    function filterAlwaysNonSimilarUser(ds, us, sims, simTh, artTh) {
      const copyUsers = us.slice();
      const isBelowThreshold = currentValue => currentValue.value < simTh;
      copyUsers.forEach((e) => {
        const filteredSimilarity = sims.filter(e1 => e1.source === e || e1.target === e);
        if (filteredSimilarity.filter(e1 => e1.source !== e1.target).every(isBelowThreshold)) {
          // console.log(e);
          // console.log(filteredSimilarity);
          sims = sims.filter(e1 => !(e1.source === e || e1.target === e));
          ds = ds.filter(e1 => e1.id !== e);
          us = us.filter(e1 => e1 !== e);
        }
      });
      const filteredDs = ds.filter(e => e.repliedArticle.length > artTh);
      const filteredUs = us.filter(e => filteredDs.some(e1 => e1.id === e));
      const filteredSim = sims.filter(e => filteredDs.some(e1 => e1.id === e.source) && filteredDs.some(e1 => e1.id === e.target));
      return [filteredDs, filteredUs, filteredSim];
    }

    function drawUserRepliedArticleMatrix(articleArray) {
      const article_titles = articleArray.map(e => e.article_id);
      const xScale = d3.scaleBand().domain(article_titles)
        .range([0, article_titles.length * gridSize]);

      const yScale = d3.scaleBand().domain(newUserAxisValues)
        .range([0, newUserAxisValues.length * gridSize]);
      const w = parseFloat(d3.select('.heatMap').style('width'));
      const focusOffSetX = -w / 2 + (newUserAxisValues.length * gridSize) / 2 + 400;
      const focusOffsetY = svgScale(datas.length) * (newUserAxisValues.length * gridSize + 120);
      d3.select('#focus').selectAll('*').remove();
      d3.select('#context').selectAll('.focus').remove();
      const focus = d3.select('#context')
        .append('g')
        .attr('class', 'focus')
        .attr('transform', `translate(${activityTranslateX + 75},${60})`);

      articleGroup.selectAll('.articleXAxis')
        .selectAll('.tick')
        .selectAll('text')
        .attr('y', 0)
        .attr('x', 3)
        .attr('dy', '.35em')
        .attr('transform', 'rotate(-90)')
        .style('text-anchor', 'start')
        .style('font-size', 'medium');
      articleGroup.select('.articleXAxis')
        .selectAll('line')
        .remove();
      // lineGroup.selectAll('line').remove();
    }
    function updateArticleMatrix(articleArray, highlightArticles, communityIndex) {
      // console.log(highlightArticles);
      const focusH = 400;
      articleGroup.selectAll('.articleXAxis').remove();
      articleGroup.select('.lineGroup').selectAll('line').remove();
      const communityUserCount = datas.filter(e => e.community === communityIndex).length;
      const focusGridWidth = 25;
      const highlightArticle_id = highlightArticles.map(e => e.article_id);
      // console.log(highlightArticle_id);
      const focusArticleScaleY = d3.scaleBand().domain(highlightArticle_id)
        .paddingInner(0.3)
        .range([0, focusH]);
      const focusUserScaleY = d3.scaleBand().domain(newUserAxisValues)
        .range([0, focusArticleScaleY.bandwidth()]);

      highlightArticle_id.forEach((id) => {
        datas.forEach((usr) => {
          if (!usr.repliedArticle.some(e => e.article_id === id)) {
            articleGroup.select(`.${usr.id}`)
              .selectAll('circle')
              .data([{ article_id: id }])
              .enter()
              .append('g')
              .append('g')
              .attr('class', 'nonLinearTime')
              .append('line')
              .attr('x1', 1)
              .attr('x2', 1)
              .attr('y1', 0)
              .attr('y2', gridSize)
              .attr('stroke-width', '2px')
              .attr('stroke', 'lightgray');
          }
        });
      });
      const articleTree = buildArticleTree(highlightArticles);
      console.log(articleTree);
      const articleTreeId = sortedArticleId(articleTree, highlightArticles);
      const contextYScale = d3.scaleBand()
        .range([0, articleTreeId.length * 30])
        .domain(articleTreeId);

      console.log(contextYScale.domain());
      const fillArrayFrom0To5 = () => {
        const arr = [];
        for (let i = 1; i <= 10; i += 1) arr.push(i);
        return arr;
      };
      const depthIndex = fillArrayFrom0To5();
      const contextXScale = d3.scaleBand().range([0, 400])
        .domain(depthIndex);

      const brush = d3.brush()
        .extent([[0, 0], [activityTranslateX - 30, contextYScale.range()[1]]])
        .on('brush end', brushed);

      position.append('defs').append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr('width', width)
        .attr('height', height);

      // d3.select('.focus').remove();
      const focus = d3.select('.focus');
      focus.select('.lineGroup').remove();
      focus.selectAll('.axis').remove();

      const focusLineGroup = focus.append('g').attr('class', 'lineGroup');
      const contextDivW = parseFloat(d3.select('.contextDiv').style('width'));
      const contextDivH = parseFloat(d3.select('.contextDiv').style('height'));
      d3.select('.contextDiv')
        .style('max-height', `${contextDivH}px`)
        .style('max-width', `${contextDivW}px`);
      let context = d3.select('#context');
      context.attr('height', contextYScale.range()[1] + 1000);
      context.attr('width', contextXScale.range()[1] + 300);
      context.select('.context').remove();
      context = context.append('g')
        .attr('class', 'context')
        .attr('transform', `translate(${activityTranslateX}, 60)`);
      const articlesWithTypeComment = highlightArticles.map(e => ({ article_id: e.article_id, article_title: e.article_title, date: e.date }));
      articlesWithTypeComment.forEach((e) => {
        const article = highlightArticles.find(e1 => e1.article_id === e.article_id);
        const messages = article.messages.filter((mes) => {
          const u = datas.find(e1 => e1.id === mes.push_userid);
          if (!u) return false;
          return u.community === communityIndex;
        });
        const push = messages.filter(mes => mes.push_tag === '推');
        const boo = messages.filter(mes => mes.push_tag === '噓');
        const neutral = messages.filter(mes => mes.push_tag === '→');
        e.commentType = { push, boo, neutral };
      });
      console.log('articlesWithTypeComment:', articlesWithTypeComment);
      d3.select('.sort')
        .selectAll('input')
        .on('change', (_d, _index, _nodes) => {
          const sortType = d3.select(_nodes[_index]).attr('value');
          // contextYScale.domain(articleSortBy(sortType, articlesWithTypeComment));
          const arr = articleSortBy(sortType, articlesWithTypeComment, highlightArticles);
          updateArticleMatrix(articleArray, arr, communityIndex);
          // drawArticleTree(articleTree);
        });
      drawArticleTree(articleTree, communityIndex);

      context.select('.brush').remove();
      context.select('.axis').remove();


      context.append('g')
        .attr('class', 'brush')
        .attr('transform', `translate(${-activityTranslateX}, 0)`)
        .call(brush)
        .call(brush.move, [[0, 0],
          [
            // Math.min(contextXScale.range()[1], 50),
            activityTranslateX,
            // Math.min(yScale.range()[1], gridSize * 3),
            Math.min(contextYScale.range()[1], 120),
          ]]);
      context.select('.overlay')
        .attr('width', activityTranslateX)
        .attr('fill', 'lightgray');
      context.select('.selection')
        .attr('fill-opacity', 1)
        .attr('fill', 'white');

      context.append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', 'translate(75,-25)')
        .call(d3.axisBottom(contextXScale).ticks(5));
      context.append('g')
        .attr('class', 'axis axis--y')
        .call(d3.axisLeft(contextYScale));
      // .call(d3.axisLeft(contextYScale).tickFormat(d => highlightArticles.find(e => e.article_id === d).article_title));
      context.select('.axis--x')
        .selectAll('text')
        .attr('dy', '0em')
        .attr('y', '20')
        .style('font-size', 'larger')
        // .style('writing-mode', 'tb')
        .style('text-anchor', 'middle');
      context.select('.axis.axis--y')
        .selectAll('line')
        .remove();

      function brushed() {
        context.select('.handle.handle--n')
          .attr('x', 0)
          .attr('width', activityTranslateX)
          .attr('fill', 'darkgray');
        context.select('.handle.handle--s')
          .attr('x', 0)
          .attr('width', activityTranslateX)
          .attr('fill', 'darkgray');
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return; // ignore brush-by-zoom

        const s = d3.event.selection || contextYScale.range();
        if (s[1][1]) focus.attr('transform', `translate(${activityTranslateX + 75}, ${s[0][1] + 90})`);
        else focus.attr('transform', `translate(${activityTranslateX + 75}, ${90})`);

        const newDepthDomainX = contextXScale.domain();
        const newUserDomainY = newUserAxisValues.filter(e => datas.find(e1 => e1.id === e).community === communityIndex);
        focusUserScaleY.domain(newUserDomainY);
        const newArticleDomainY = contextYScale.domain().slice(s[0][1] / contextYScale.bandwidth(), s[1][1] / contextYScale.bandwidth());
        focusArticleScaleY.domain(newArticleDomainY);
        focusUserScaleY.range([0, focusArticleScaleY.bandwidth()]);
        focusLineGroup.selectAll('*').remove();
        focusLineGroup.append('g');

        // articleTree context lighgray area
        focus.selectAll('.unfocus').remove();
        // before focus area
        focus.append('rect')
          .attr('class', 'unfocus')
          .attr('width', contextXScale.range()[1])
          .attr('height', s[1][1] ? s[0][1] : 0)
          .attr('x', 0)
          .attr('y', -s[0][1] - 30)
          .attr('fill', 'lightgray');

        focus.append('rect')
          .attr('class', 'unfocus unfocusBottom')
          .attr('width', contextXScale.range()[1])
          .attr('height', 4)
          .attr('x', 0)
          .attr('y', s[1][1] ? s[0][1] - s[0][1] - 30 : -s[0][1] - 30)
          .attr('fill', 'darkgray');

        // after focus area
        const focusMargin = 30;
        focus.append('rect')
          .attr('class', 'unfocus')
          .attr('width', contextXScale.range()[1])
          .attr('height', () => focusMargin + contextYScale.bandwidth() * contextYScale.domain().slice(s[1][1] / contextYScale.bandwidth()).length)
          .attr('x', 0)
          .attr('y', s[1][1] ? 400 : -30)
          .attr('fill', 'lightgray');

        focus.append('rect')
          .attr('class', 'unfocus unfocusTop')
          .attr('width', contextXScale.range()[1])
          .attr('height', 4)
          .attr('x', 0)
          .attr('y', s[1][1] ? 400 : -30)
          .attr('fill', 'darkgray');

        // article box
        const boxHeight = 100;
        const boxWidth = 50;
        const boxMargin = 20;
        focus.selectAll('.axis--y').remove();

        for (let i = 0; i < focusArticleScaleY.domain().length; i += 1) {
          const lineGroupY = focusArticleScaleY(focusArticleScaleY.domain()[i]);
          const art = articleTree.find(e => e.article_id === focusArticleScaleY.domain()[i]);
          const articleBoxNum = Math.min(art.children.length + 1, newDepthDomainX[newDepthDomainX.length - 1]);
          const usersOfCommunityOfThisArticle = focusUserScaleY.domain().filter((e) => {
            if (art.messages.some(e1 => e1.push_userid === e)) return true;
            for (let j = 0; j < art.children.length; j += 1) {
              if (art.children[j].messages.some(e1 => e1.push_userid === e)) return true;
            }
            return false;
          });
          const thisArticleUserScale = d3.scaleBand().domain(usersOfCommunityOfThisArticle)
            .range([0, focusArticleScaleY.bandwidth()]);
          focus.append('g')
            .attr('class', 'axis axis--y')
            .attr('transform', `translate(0,${lineGroupY})`)
            .call(d3.axisLeft(thisArticleUserScale));
          const articleBoxGroup = focusLineGroup.append('g')
            .attr('transform', `translate(0,${lineGroupY})`);
          articleBoxGroup.append('text')
            .text(art.article_title)
            .attr('y', -10)
            .attr('font-size', '15px');
          for (let k = 0; k < articleBoxNum; k += 1) {
            const boxGroup = articleBoxGroup.append('g')
              .attr('transform', `translate(${k * (boxWidth + boxMargin)},0)`);
            // box border-top
            boxGroup.append('line')
              .attr('x1', 0)
              .attr('y1', 0)
              .attr('x2', boxWidth)
              .attr('y2', 0)
              .attr('stroke-width', '1px')
              .attr('stroke', 'black');
            // box border-bottom
            boxGroup.append('line')
              .attr('x1', 0)
              .attr('y1', focusArticleScaleY.bandwidth())
              .attr('x2', boxWidth)
              .attr('y2', focusArticleScaleY.bandwidth())
              .attr('stroke-width', '1px')
              .attr('stroke', 'black');
            // box border-left
            boxGroup.append('line')
              .attr('x1', 0)
              .attr('y1', 0)
              .attr('x2', 0)
              .attr('y2', focusArticleScaleY.bandwidth())
              .attr('stroke-width', '1px')
              .attr('stroke', 'black');
            // box border-right
            boxGroup.append('line')
              .attr('x1', boxWidth)
              .attr('y1', 0)
              .attr('x2', boxWidth)
              .attr('y2', focusArticleScaleY.bandwidth())
              .attr('stroke-width', '1px')
              .attr('stroke', 'black');
            // box inner border
            for (let j = 0; j < thisArticleUserScale.domain().length; j += 1) {
              boxGroup.append('line')
                .attr('x1', 0)
                .attr('y1', j * thisArticleUserScale.bandwidth())
                .attr('x2', boxWidth)
                .attr('y2', j * thisArticleUserScale.bandwidth())
                .attr('stroke-width', '0.5px')
                .attr('stroke', 'black');
            }
          }
        }

        // remove focus user axis's path
        focus.selectAll('.axis.axis--y')
          .selectAll('path')
          .remove();

        // hide context articleTree
        let IndexAfterFocus = 0;
        context.select('.articleTree').selectAll('g')
          .attr('visibility', (d, index) => {
            if (newArticleDomainY.some(e => e === d.article_id)) {
              IndexAfterFocus = index;
              return 'hidden';
            }
            return 'visible';
          })
          .attr('transform', (d) => {
            const translateY = contextYScale(d.article_id) + contextYScale.bandwidth() / 2;
            const offset = focusArticleScaleY.domain().length >= 1 ? (focusArticleScaleY.domain().length - 1) * 30 : 0;
            if (!newArticleDomainY.length) return `translate(75, ${translateY})`;
            if (newArticleDomainY.some(e => e === d.article_id)) return `translate(75,${translateY})`;
            const articleIndex = contextYScale.domain().findIndex(e => e === d.article_id);
            const focusArticleIndex = contextYScale.domain().findIndex(e => e === focusArticleScaleY.domain()[0]);
            if (articleIndex < focusArticleIndex) return `translate(75, ${translateY})`;
            return `translate(75, ${translateY + focusH + focusMargin - offset})`;
          });

        // focusUserScaleY.domain(newUserDomainY);
        // focusArticleScaleY.domain(newArticleDomainY);
        focus.select('.userGroup').remove();
        const focusUserGroup = focus.append('g')
          .attr('class', 'userGroup');
        focusArticleScaleY.domain().forEach((a_id) => {
          const aTree = articleTree.find(e => e.article_id === a_id);
          const usersOfCommunityOfThisArticle = focusUserScaleY.domain().filter((e) => {
            if (aTree.messages.some(e1 => e1.push_userid === e)) return true;
            for (let j = 0; j < aTree.children.length; j += 1) {
              if (aTree.children[j].messages.some(e1 => e1.push_userid === e)) return true;
            }
            return false;
          });
          const thisArticleUserScale = d3.scaleBand().domain(usersOfCommunityOfThisArticle)
            .range([0, focusArticleScaleY.bandwidth()]);
          for (let i = 0; i < aTree.children.length + 1; i += 1) {
            let a;
            if (i === 0) a = aTree;
            else a = aTree.children[i - 1];
            const userArr = [];
            a.messages.forEach((mes) => {
              if (thisArticleUserScale.domain().includes(mes.push_userid)) {
                if (!userArr.includes(mes.push_userid)) {
                  userArr.push(mes.push_userid);
                  focusUserGroup.append('rect')
                    .attr('x', 0 + i * (boxWidth + boxMargin))
                    .attr('y', thisArticleUserScale(mes.push_userid) + focusArticleScaleY(a_id))
                    .attr('width', boxWidth)
                    .attr('height', thisArticleUserScale.bandwidth())
                    .attr('fill', 'white')
                    .attr('opacity', 0)
                    .on('mouseover', () => {
                      let commentString = '';
                      const messages = a.messages.filter(e => e.push_userid === mes.push_userid);
                      const clr = (tag) => {
                        switch (tag) {
                          case '推':
                            return d3.schemeTableau10[4];
                          case '噓':
                            return d3.schemeTableau10[2];
                          case '→':
                            return d3.schemeTableau10[5];
                          default:
                            break;
                        }
                        return 'white';
                      };
                      messages.forEach((m) => {
                        commentString += `<strong style='color: ${clr(m.push_tag)}'>${m.push_tag}</strong> ${m.push_userid}: ${m.push_content} ${dateFormat(m)} <br>`;
                      });
                      // }
                      const tooltipString = `<p style='color:white'>
                        Author: ${a.author} <br> 
                        Post: ${a.article_title} <br>
                        pushContent: <br> ${commentString}
                        </p>`;
                      authorGroupMouseover(tooltipString);
                    })
                    .on('mouseout', mouseout);
                }
                focusUserGroup.append('g')
                  .attr('class', `.${mes.push_userid}`)
                  .append('rect')
                  .attr('x', () => {
                    const postYear = new Date(a.date).getFullYear();
                    if (!mes.push_userid) return 0;
                    const date = dateFormat(mes);
                    const commentTime = new Date(new Date(date).setFullYear(postYear));
                    const timeDiff = commentTime - new Date(a.date);
                    const timeGroup = timeDiff / 1000 / 60;
                    let timeOffSet = 0;
                    let start = 0;
                    let end = 5;
                    if (timeGroup <= 5) {
                      timeOffSet = 0;
                      start = 0;
                    } else if (timeGroup <= 30) {
                      timeOffSet = boxWidth / 5;
                      start = 5;
                      end = 30;
                    } else if (timeGroup <= 60) {
                      timeOffSet = 2 * (boxWidth / 5);
                      start = 30;
                      end = 60;
                    } else if (timeGroup <= 180) {
                      timeOffSet = 3 * (boxWidth / 5);
                      start = 60;
                      end = 180;
                    } else {
                      timeOffSet = 4 * (boxWidth / 5);
                      start = 180;
                      end = 1440;
                    }
                    const nonLinearTimeScale = d3.scaleLinear()
                      .domain([start, end]).range([0, boxWidth / 5]);
                    return nonLinearTimeScale(timeGroup) + timeOffSet + i * (boxWidth + boxMargin);
                  })
                  .attr('y', thisArticleUserScale(mes.push_userid) + focusArticleScaleY(a_id))
                  .attr('width', 1)
                  .attr('height', thisArticleUserScale.bandwidth())
                  .attr('fill', () => {
                    switch (mes.push_tag) {
                      case '推':
                        return d3.schemeTableau10[4];
                      case '噓':
                        return d3.schemeTableau10[2];
                      case '→':
                        return d3.schemeTableau10[5];
                      default:
                        return 'yellow';
                    }
                  })
                  .append('title')
                  .text(`${mes.push_userid}: ${mes.push_content}`);
              }
            });
          }
        });
      }

      function buildArticleTree(articleArr) {
        console.log(articleArr);
        const copyArtArr = JSON.parse(JSON.stringify(articleArr));
        // copyArtArr.sort((a, b) => ((new Date(a.date) - new Date(b.date)) > 0 ? 1 : -1));
        const arr = copyArtArr.filter(e => e.article_title[0] !== 'R');
        arr.forEach((e) => { e.children = []; });
        // console.log(arr);
        copyArtArr.filter(e => e.article_title[0] === 'R').forEach((a) => {
          // console.log(a);
          // console.log(a.article_title.substring(4));
          const existedArticle = arr.find(e => e.article_title === a.article_title.substring(4));
          const existedArticle2 = arr.find(e => e.article_title === a.article_title);
          if (existedArticle) existedArticle.children.push(a);
          else if (existedArticle2) existedArticle2.children.push(a);
          else {
            const art = JSON.parse(JSON.stringify(a));
            art.children = [];
            arr.push(art);
          }
        });
        return arr;
      }

      function sortedArticleId(treeArr, articleArr) {
        const arr = [];
        articleArr.forEach((e) => {
          const existed = treeArr.find(e1 => e1.article_id === e.article_id);
          if (existed) arr.push(existed.article_id);
        });
        return arr;
      }

      function articleSortBy(type, articleWithCommentTypeArr, articleArr) {
        const arr = JSON.parse(JSON.stringify(articleArr));
        if (type === 'date') {
          console.log(type);
          arr.sort((a, b) => ((new Date(a.date) - new Date(b.date)) < 0 ? 1 : -1));
        } else if (type === 'comments') {
          arr.sort((a, b) => {
            const article_a = articleWithCommentTypeArr.find(e => e.article_id === a.article_id);
            const article_b = articleWithCommentTypeArr.find(e => e.article_id === b.article_id);
            const total_a = article_a.commentType.push.length + article_a.commentType.boo.length + article_a.commentType.neutral.length;
            const total_b = article_b.commentType.push.length + article_b.commentType.boo.length + article_b.commentType.neutral.length;
            return (total_a - total_b) > 0 ? -1 : 1;
          });
        } else if (type === 'push') {
          arr.sort((a, b) => {
            const article_a = articleWithCommentTypeArr.find(e => e.article_id === a.article_id);
            const article_b = articleWithCommentTypeArr.find(e => e.article_id === b.article_id);
            const total_a = article_a.commentType.push.length - article_a.commentType.boo.length;
            const total_b = article_b.commentType.push.length - article_b.commentType.boo.length;
            return (total_a - total_b) > 0 ? -1 : 1;
          });
        } else if (type === 'boo') {
          arr.sort((a, b) => {
            const article_a = articleWithCommentTypeArr.find(e => e.article_id === a.article_id);
            const article_b = articleWithCommentTypeArr.find(e => e.article_id === b.article_id);
            const total_a = article_a.commentType.boo.length - article_a.commentType.push.length;
            const total_b = article_b.commentType.boo.length - article_b.commentType.push.length;
            return (total_a - total_b) > 0 ? -1 : 1;
          });
        }
        return arr;
      }

      function drawArticleTree(tree, userGroupIndex) {
        const contextLegend = context.append('g')
          .attr('class', 'contextLegend')
          .attr('transform', `translate(-90, ${-margin.top * 4 / 3})`);
        contextLegend.append('circle')
          .attr('cx', 0)
          .attr('cy', -5)
          .attr('fill', color(userGroupIndex))
          .attr('r', 5);
        contextLegend.append('text')
          .text(`Group ${userGroupIndex}'s activity`)
          .attr('x', 10);

        const artComPie = d3.pie()
          .value(d => d.length / communityUserCount)
          .sort(null);
        context.append('g')
          .attr('class', 'articleTree')
          .selectAll('rect')
          .data(tree)
          .enter()
          .append('g')
          .attr('class', d => d.article_id)
          .attr('transform', d => `translate(50,${contextYScale(d.article_id) + contextYScale.bandwidth() / 2})`)
          .each((d, index, nodes) => {
            let depth = 1;
            const recursion = (_d, _index, _nodes) => {
              if (!_d) return;
              d3.select(_nodes[_index])
                .append('path')
                .attr('transform', `translate(${contextXScale(depth) + contextXScale.bandwidth() / 2},0)`)
                .attr('d', d3.arc()
                  .startAngle(0)
                  .endAngle(Math.PI * 2)
                  .innerRadius(10)
                  .outerRadius(12.5))
                .attr('fill', 'gray');

              d3.select(_nodes[_index])
                .selectAll('rect')
                .data(() => {
                  const art = articlesWithTypeComment.find(e => e.article_id === _d.article_id);
                  const { push, boo, neutral } = art.commentType;
                  const arr = [push, boo, neutral];
                  const MaxMinusTotalComment = (3 * communityUserCount - (push.length + boo.length + neutral.length));
                  arr.push(Array(Math.max(0, MaxMinusTotalComment)));
                  return artComPie(arr);
                })
                .enter()
                .append('path')
                .attr('transform', `translate(${contextXScale(depth) + contextXScale.bandwidth() / 2},0)`)
                .attr('d', d3.arc()
                  .innerRadius(0)
                  .outerRadius(15))
                .attr('fill', (_d2, _index2) => {
                  if (_index2 === 0) return 'green'; // push
                  if (_index2 === 1) return 'red'; // boo
                  if (_index2 === 2) return 'yellow'; // neutral
                  return 'white';
                })
                .style('opacity', (_d2, _index2) => (_index2 === 3 ? 0 : 1))
                .append('title')
                .text(_d.article_title);

              d3.select(_nodes[_index])
                .append('circle')
                .attr('transform', `translate(${contextXScale(depth) + contextXScale.bandwidth() / 2},0)`)
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', 7.5)
                .attr('fill', 'lightgray');

              depth += 1;
              if (d.children) recursion(d.children[depth - 2], _index, _nodes);
            };
            recursion(d, index, nodes);
          });
      }
    }

    function dateFormat(mes) {
      let dat = '';
      const splitedDate = mes.push_ipdatetime.split(' ');
      if (splitedDate.length === 3) {
        dat = dat.concat('', splitedDate[1]);
        dat = dat.concat(' ', splitedDate[2]);
        return dat;
      }
      return mes.push_ipdatetime;
    }

    function drawUserGroupBipartiteRelations() {
      const radialGroupMargin = 50;
      const radial = group.append('g')
        .attr('class', 'radialGroup')
        .attr('transform', `translate(0, 10) scale(${svgScale(datas.length) > 0 ? svgScale(datas.length) : 0.4})`)
        .attr('stroke', 'black')
        .attr('stroke-width', '0.5px');
      const articleGroupHeatmap = leftSvg.append('g').attr('class', 'articleGroupHeatmap');
      const numOfArtCom = Math.max(...articlesCommunity.map(e => e.community)) + 1;
      const numOfArtOfEachComunity = [];
      for (let i = 0; i < numOfArtCom; i += 1) {
        const tempCommunity = articlesCommunity.filter(e => e.community === i);
        numOfArtOfEachComunity.push(tempCommunity);
      }
      // console.log('numOfArtOfEachComunity', numOfArtOfEachComunity);
      const artComPie = d3.pie()
        .value(d => d.length)
        .sort(null);
      const dataReady = artComPie(numOfArtOfEachComunity);
      const numOfUserCom = Math.max(...community.map(e => e.community)) + 1;
      const comunityIndexY = [];
      const temp = [];
      for (let i = 0; i < numOfUserCom; i += 1) {
        let axisIndex = 0;
        newUserAxisValues.every((e, index) => {
          axisIndex = index;
          return temp.some(e1 => e1 === community.find(e2 => e2.id === e).community);
        });
        temp.push(community.find(e => e.id === newUserAxisValues[axisIndex]).community);
        comunityIndexY.push(axisIndex);
      }
      const articleGroupWidthScale = d3.scaleLinear().domain([1, filteredArticles.length]).range([20, 2000]);
      const articleGroupIndexArray = [];
      const articleGroupYScale = [0];
      const padding = 2;
      for (let i = 0; i < numOfArtCom; i += 1) {
        articleGroupIndexArray.push(i);
        if (i < numOfArtCom - 1) {
          articleGroupYScale.push(padding + articleGroupYScale[i] + articleGroupWidthScale(numOfArtOfEachComunity[i].length));
        }
      }

      const articleGroupOfUserCommunity = [];
      for (let i = 0; i < numOfUserCom; i += 1) {
        const groupRadial = radial.append('g')
          .attr('class', `group_${i}`);
        const groupArtGroupHp = articleGroupHeatmap.append('g')
          .attr('class', `group_${i}`);
        let numOfUser = 0;
        if (i === numOfUserCom - 1) numOfUser = newUserAxisValues.length - comunityIndexY[i];
        else numOfUser = comunityIndexY[i + 1] - comunityIndexY[i];
        // for (let j = 0; j < numOfArtCom; j += 1) {
        //   groupRadial.append('rect')
        //     .attr('y', articleGroupYScale[j])
        //     .attr('x', positionScale[comunityIndexY[i]] * Math.sqrt(2))
        //     .attr('height', articleGroupWidthScale(numOfArtOfEachComunity[j].length))
        //     .attr('width', () => {
        //       const tem = comunityIndexY[i];
        //       let nex = positionScale.length - 1;
        //       if (comunityIndexY[i + 1]) nex = comunityIndexY[i + 1];
        //       return (positionScale[nex] - positionScale[tem]) * Math.sqrt(2);
        //     })
        //     .attr('fill', 'white')
        //     .attr('stroke', color(i))
        //     .attr('stroke-width', '0.5px');
        // }
        // draw bipartite graph visualization
        const arr = drawRelationRatio(i, numOfUser);
        articleGroupOfUserCommunity.push(arr);
      }
      console.log('articleGroupOfUserCommunity: ', articleGroupOfUserCommunity);
      // draw bipartite co-cluster graph
      drawCoClusterGraph(articleGroupOfUserCommunity);
      // draw article heatmap on the left side of the main heatMap
      // drawArticleGroupOfUserCommunity(articleGroupOfUserCommunity);

      function drawRelationRatio(index, userCount) {
        const communityIndexDatas = datas.filter(e => e.community === index);
        console.log(index, communityIndexDatas);
        // console.log(communityIndexDatas);
        const communityIndexArticles = computeNumOfArticlesOfEachCommunity();
        // console.log('communityIndexArticles', communityIndexArticles);
        const communityEachLevelCount = [];
        communityIndexArticles.forEach((e) => {
          const levelOne = e.articles.filter(a => a.count > 0);
          const levelTwo = e.articles.filter(a => a.count >= 0.2);
          const levelThree = e.articles.filter(a => a.count >= 0.4);
          const levelFour = e.articles.filter(a => a.count >= 0.6);
          const levelFive = e.articles.filter(a => a.count >= 0.8);
          communityEachLevelCount.push({
            community: e.community,
            level: [levelOne, levelTwo, levelThree, levelFour, levelFive],
          });
        });
        console.log(communityIndexArticles);
        console.log('communityEachLevelCount', communityEachLevelCount);
        const tem = comunityIndexY[index];
        let nex = positionScale.length - 1;
        if (comunityIndexY[index + 1]) nex = comunityIndexY[index + 1];
        // width of user group
        const maxWidth = (positionScale[nex] - positionScale[tem]) * Math.sqrt(2);
        const groupRadial = radial.select(`.group_${index}`);
        // article group heatmap
        const t = groupIndex[index].index;
        const n = groupIndex[index + 1] ? groupIndex[index + 1].index : positionScale.length - 1;
        const userCommunityHeight = positionScale[n] - positionScale[t];
        const totalRepliedArticleOfUserCommunity = communityIndexArticles.reduce((acc, obj) => acc + obj.articles.length, 0);
        const articleGroupScale = d3.scaleLinear().domain([0, totalRepliedArticleOfUserCommunity]).range([0, userCommunityHeight]);

        return communityEachLevelCount;

        function computeNumOfArticlesOfEachCommunity() {
          const arr = [];
          communityIndexDatas.forEach((u) => {
            u.repliedArticle.forEach((article) => {
              const findArticle = articlesCommunity.find(a => a.id === article.article_id);
              if (findArticle) {
                const existedComunity = arr.find(e => e.community === findArticle.community);
                if (existedComunity) {
                // same community
                  const existedArticle = existedComunity.articles.find(e => e.article_id === findArticle.id);
                  if (existedArticle) {
                  // same aritcle
                    existedArticle.count += 1 / communityIndexDatas.length;
                  } else {
                  // can't find article
                    existedComunity.articles.push({ article_id: findArticle.id, count: 1 / communityIndexDatas.length });
                  }
                } else {
                // can't find community
                  arr.push({
                    community: findArticle.community,
                    articles: [{
                      article_id: findArticle.id,
                      count: 1 / communityIndexDatas.length,
                    }],
                  });
                }
              }
            });
          });
          arr.sort((a, b) => b.articles.length - a.articles.length);
          return arr;
        }
      }

      function drawCoClusterGraph(arr) {
        const boxHeight = 200;
        // calculate all article community position
        for (let i = 0; i < arr.length; i += 1) {
          const tem = comunityIndexY[i];
          const nex_tem = comunityIndexY[i + 1] ? comunityIndexY[i + 1] : positionScale.length - 1;
          const maxWidth_tem = (positionScale[nex_tem] - positionScale[tem]) * Math.sqrt(2);
          const numOfArticles = arr[i].reduce((acc, obj) => acc + obj.level[0].length, 0);
          const scale = d3.scaleLinear().domain([0, numOfArticles]).range([0, maxWidth_tem]);
          // article community position
          for (let j = 0; j < arr[i].length; j += 1) {
            arr[i][j].position = (j === 0) ? 0 : arr[i][j - 1].position + scale(arr[i][j - 1].level[0].length);
          }
        }

        for (let i = 0; i < arr.length; i += 1) {
          // user Community i
          // const groupRadial = radial.select(`.group_${i}`);
          const groupRadial = radial;
          const tem = comunityIndexY[i];
          const nex_tem = comunityIndexY[i + 1] ? comunityIndexY[i + 1] : positionScale.length - 1;
          const numOfArticles = arr[i].reduce((acc, obj) => acc + obj.level[0].length, 0);
          const maxWidth_tem = (positionScale[nex_tem] - positionScale[tem]) * Math.sqrt(2);
          const radialColor = d3.scaleLinear().domain([-1, 4]).range(['white', color(i)]);
          const scale = d3.scaleLinear().domain([0, numOfArticles]).range([0, maxWidth_tem]);
          for (let k = 0; k < arr.length; k += 1) {
            groupRadial.append('g')
              .selectAll('path')
              .data(arr[i])
              .enter()
              .append('g')
              .each((d, index, nodes) => {
                if (k !== i) {
                  // blank area
                  d3.select(nodes[index])
                    .append('rect')
                    .attr('y', boxHeight * (k + 1) - boxHeight)
                    .attr('x', (_d, _index) => positionScale[tem] * Math.sqrt(2) + d.position)
                    .attr('height', boxHeight)
                    .attr('width', (_d) => {
                      const sameArticles = d.level[0].filter(e => d.level[0].some(e1 => e1.article_id === e.article_id));
                      return scale(sameArticles.length);
                    })
                    .attr('fill', 'white')
                    .on('click', _d => rectClick(d, i));
                } else {
                  // for i === k show density of replied articles of userCommunity
                  d3.select(nodes[index]).selectAll('path')
                    .data(d.level)
                    .enter()
                    .append('rect')
                    .attr('y', (_d) => {
                      const heightScale = d3.scaleLinear().domain([0, d.level[0].length]).range([0, boxHeight]);
                      const sameArticles = d.level[0].filter(e => _d.some(e1 => e1.article_id === e.article_id));
                      return boxHeight * (k + 1) - heightScale(sameArticles.length);
                      // return boxHeight * k;
                    })
                    .attr('x', (_d, _index) => positionScale[tem] * Math.sqrt(2) + d.position)
                    .attr('height', (_d) => {
                      const heightScale = d3.scaleLinear().domain([0, d.level[0].length]).range([0, boxHeight]);
                      const sameArticles = d.level[0].filter(e => _d.some(e1 => e1.article_id === e.article_id));
                      return heightScale(sameArticles.length);
                    })
                    .attr('width', (_d) => {
                      const sameArticles = d.level[0].filter(e => d.level[0].some(e1 => e1.article_id === e.article_id));
                      return scale(sameArticles.length);
                    })
                    .attr('fill', (_d, _index) => {
                      const c = d3.hsl(radialColor(_index));
                      return c;
                    })
                    // .attr('stroke', (_d, _index) => (_index === 0 ? 'black' : 'none'))
                    .on('click', _d => rectClick(_d, i))
                    .on('mouseover', _d => coClusterMouseover(_d, i));
                }
              });
          }
        }
        for (let i = 0; i < arr.length; i += 1) {
          // const groupRadial = radial.select(`.group_${i}`);
          const groupRadial = radial;
          const tem = comunityIndexY[i];
          const nex_tem = comunityIndexY[i + 1] ? comunityIndexY[i + 1] : positionScale.length - 1;
          const numOfArticles = arr[i].reduce((acc, obj) => acc + obj.level[0].length, 0);
          const maxWidth_tem = (positionScale[nex_tem] - positionScale[tem]) * Math.sqrt(2);
          const radialColor = d3.scaleLinear().domain([-1, 4]).range(['white', color(i)]);
          const scale = d3.scaleLinear().domain([0, numOfArticles]).range([0, maxWidth_tem]);
          for (let j = 0; j < arr.length; j += 1) {
            if (i !== j) {
              const nex = comunityIndexY[j];
              const nex_nex = comunityIndexY[j + 1] ? comunityIndexY[j + 1] : positionScale.length - 1;
              const maxWidth_nex = (positionScale[nex_nex] - positionScale[nex]) * Math.sqrt(2);
              const numOfArticlesOfUserCommunity = arr[j].reduce((acc, obj) => acc + obj.level[0].length, 0);
              const widthScale = d3.scaleLinear().domain([0, numOfArticlesOfUserCommunity]).range([0, maxWidth_nex]);
              groupRadial.append('g')
                .selectAll('path')
                .data(arr[i])
                .enter()
                .append('g')
                .each((d, index, nodes) => {
                  d3.select(nodes[index]).selectAll('path')
                    .data(d.level)
                    .enter()
                    .append('rect')
                    .attr('y', (_d) => {
                      const temCommunity = d.community;
                      const nextArticleCommunity = arr[j].find(e => e.community === temCommunity);
                      if (!nextArticleCommunity) return 0;
                      const heightScale = d3.scaleLinear().domain([0, nextArticleCommunity.level[0].length]).range([0, boxHeight]);
                      const sameArticles = nextArticleCommunity.level[0].filter(e => _d.some(e1 => e1.article_id === e.article_id));
                      return boxHeight * (i + 1) - heightScale(sameArticles.length);
                    })
                    .attr('x', (_d, _index) => {
                      const temCommunity = d.community;
                      const nexCommunity = arr[j].find(e => e.community === temCommunity);
                      if (nexCommunity) {
                        return positionScale[nex] * Math.sqrt(2) + nexCommunity.position;
                      }
                      return positionScale[nex] * Math.sqrt(2);
                    })
                  // .attr('height', boxHeight)
                  // .attr('width', (d) => {
                  //   const temCommunity = d.community;
                  //   console.log(temCommunity, arr[j]);
                  //   const nextArticleCommunity = arr[j].find(e => e.community === temCommunity);
                  //   if (!nextArticleCommunity) return 0;
                  //   const sameArticles = nextArticleCommunity.level[0].filter(e => d.level[0].some(e1 => e1.article_id === e.article_id));
                  //   return widthScale(sameArticles.length);
                  // })
                    .attr('width', (_d) => {
                      const temCommunity = d.community;
                      const nextArticleCommunity = arr[j].find(e => e.community === temCommunity);
                      if (!nextArticleCommunity) return 0;
                      return widthScale(nextArticleCommunity.level[0].length);
                    })
                    .attr('height', (_d) => {
                      const temCommunity = d.community;
                      const nextArticleCommunity = arr[j].find(e => e.community === temCommunity);
                      if (!nextArticleCommunity) return 0;
                      const heightScale = d3.scaleLinear().domain([0, nextArticleCommunity.level[0].length]).range([0, boxHeight]);
                      const sameArticles = nextArticleCommunity.level[0].filter(e => _d.some(e1 => e1.article_id === e.article_id));
                      return heightScale(sameArticles.length);
                    })
                    .attr('fill', (_d, _index) => {
                      const c = d3.hsl(radialColor(_index));
                      return c;
                    })
                    // .attr('stroke', (_d, _index) => (_index === 0 ? 'black' : 'none'))
                    .on('click', (_d, levelIndex) => {
                      const temCommunity = d.community;
                      const nextArticleCommunity = arr[j].find(e => e.community === temCommunity);
                      if (!nextArticleCommunity) return 0;
                      const sameArticles = nextArticleCommunity.level[0].filter(e => _d.some(e1 => e1.article_id === e.article_id));
                      console.log(sameArticles);
                      rectClick(sameArticles, i);
                      return 0;
                    });
                });
            }
          }
        }

        function coClusterMouseover(arts, communityIndex) {
          const usrs = datas.filter(e => e.community === communityIndex);
          usrs.forEach((u) => {
            u.haveReplied = u.repliedArticle.filter(a => arts.some(_a => _a.article_id === a.article_id));
          });
        }
      }

      function drawArticleGroupOfUserCommunity(arr) {
        console.log(arr);
        for (let i = 0; i < arr.length; i += 1) {
          // community_i
          const tem = groupIndex[i].index;
          const nextOfTem = groupIndex[i + 1] ? groupIndex[i + 1].index : positionScale.length - 1;
          const totalArticleOfUserCommunity_temp = arr[i].reduce((acc, obj) => acc + obj.level[0].length, 0);
          const tempHeight = positionScale[nextOfTem] - positionScale[tem];
          const xScale = d3.scaleLinear().domain([0, totalArticleOfUserCommunity_temp]).range([0, tempHeight]);
          console.log(arr[i]);
          console.log(articleGroupHeatmap);
          articleGroupHeatmap.append('g')
            .selectAll('path')
            .data(arr[i])
            .enter()
            .append('path')
            .attr('d', (d, index) => {
              let numOfArticles = 0;
              for (let k = 0; k < index; k += 1) {
                numOfArticles += xScale(arr[i][k].level[0].length);
              }
              const startPoint = numOfArticles + positionScale[tem];
              const endPoint = startPoint + xScale(d.level[0].length);
              return `M ${startPoint} ${startPoint} L ${startPoint} ${endPoint} L ${endPoint} ${endPoint}`;
            })
            .attr('fill', (d, index) => d3.schemeTableau10[index]);

          articleGroupHeatmap.append('g')
            .selectAll('path')
            .data(arr[i])
            .enter()
            .append('g')
            .attr('class', `communit_${i}`)
            .each((d, index, nodes) => {
              for (let j = i; j < arr.length; j += 1) {
                const nex = groupIndex[j].index;
                const nextOfNext = groupIndex[j + 1] ? groupIndex[j + 1].index : positionScale.length - 1;
                const nextHeight = positionScale[nextOfNext] - positionScale[nex];
                const totalArticleOfUserCommunity_next = arr[j].reduce((acc, obj) => acc + obj.level[0].length, 0);
                const yScale = d3.scaleLinear().domain([0, totalArticleOfUserCommunity_next]).range([0, nextHeight]);
                // articleGroup_j of community_i
                d3.select(nodes[index]).selectAll('path')
                  .data(arr[j])
                  .enter()
                  .append('rect')
                  .attr('y', (_d, _index) => {
                    // console.log(d, _d);
                    let numOfArticles = 0;
                    for (let k = 0; k < _index; k += 1) {
                      numOfArticles += yScale(arr[j][k].level[0].length);
                    }
                    return numOfArticles + positionScale[nex];
                  })
                  .attr('x', (_d, _index) => {
                    // num of same articles
                    // let numOfArticles = d.level[0].filter(e => _d.level[0].some(e1 => e1.article_id === e.article_id)).length;
                    let numOfArticles = 0;
                    for (let k = 0; k < index; k += 1) {
                      numOfArticles += xScale(arr[i][k].level[0].length);
                    }
                    return numOfArticles + positionScale[tem];
                  })
                  .attr('height', _d => yScale(_d.level[0].length))
                  .attr('width', _d => xScale(d.level[0].length))
                  .attr('fill', (_d, _index) => (index === _index ? d3.schemeTableau10[_index] : leftMyColor(55)))
                  .attr('visibility', (_d, _index) => {
                    if (i === j) return 'hidden';
                    return index === _index ? 'visible' : 'hidden';
                  });
              }
            });
          // .attr('y', (d, _index) => {
          //   let numOfArticles = 0;
          //   for (let k = 0; k < _index; k += 1) {
          //     numOfArticles += articleGroupScale(arr[i][k].level[0].length);
          //   }
          //   return numOfArticles + positionScale[tem];
          // })
          // .attr('x', (d, _index) => {
          //   let numOfArticles = 0;
          //   for (let k = 0; k < _index; k += 1) {
          //     numOfArticles += articleGroupScale(arr[i][k].level[0].length);
          //   }
          //   return numOfArticles + positionScale[tem];
          // })
          // .attr('height', d => articleGroupScale(d.level[0].length))
          // .attr('width', d => articleGroupScale(d.level[0].length))
          // .attr('fill', (d, _index) => color(_index));
        }
      }
    }
  }
}

export { userSimilarityGraph };
