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
import * as math from 'mathjs';
import * as slider from 'd3-simple-slider';
// eslint-disable-next-line import/no-unresolved
import CheckboxGroup from 'antd/lib/checkbox/Group';
import { cps } from 'redux-saga/effects';
// import { userActivityTimeline } from './userActivityTimeline';
import { timelineView } from './timelineView';
import * as dp from './dataprocess';

export default function userActivityView(beginDateOfQuery, endDateOfQuery, data, svg, user, articles, submit) {
  // console.log(user);
  // doTest2();
  const svgScale = d3.scaleSqrt().domain([0, 200]).range([0.5, 0.1]);
  const commentTimelineSvg = d3.select('#context');
  const h = parseFloat(d3.select('.heatMap').style('height'));
  const focusHeight = 500;
  svg.selectAll('*').remove();
  const margin = {
    top: 30, right: 30, bottom: 60, left: 30,
  };
  const width = 1300 - margin.left - margin.right;
  const height = 450 - margin.top - margin.bottom;
  const colorArray = [
    d3.interpolateBlues,
    d3.interpolateOranges,
    d3.interpolateGreens,
    d3.interpolatePurples,
    d3.interpolateReds,
    d3.interpolateYlOrBr,
    d3.interpolateGnBu,
    d3.interpolateGreys,
    d3.interpolateBlues,
    d3.interpolateOranges,
    d3.interpolateGreens,
    d3.interpolatePurples,
    d3.interpolateReds,
    d3.interpolateYlOrBr,
    d3.interpolateGnBu,
    d3.interpolateGreys,
  ];
  // Build color scale
  const color = d => d3.schemeTableau10[d];
  const leftMyColor = d3.scaleLinear()
    .range(['white', color(9)])
    .domain([0, 100]);
  const userSimilarity = dp.computeUserSimilarityByArticles(data, user);
  // const myGroups = getAllAuthorId(data); // author
  const clickedUser = [];
  let newUserAxisValues = [];
  let datas = [];
  let users = [];
  let similaritys = [];
  // const [filteredArticles, articleSimilarity] = dp.computeArticleSimilarity(data);
  // console.log('articleSimilarity: ', articleSimilarity.length);
  // const articleIds = filteredArticles.map(e => e.article_id);
  // const articlesCommunity = dp.jLouvainClustering(articleIds, articleSimilarity);
  // // const articlesCommunity = articleGroupByTag(articleIds, filteredArticles);
  // console.log('[articlesCommunity]', [articlesCommunity]);

  const selectedUser = user.slice();
  // Similarity & Reply Count Filter Div
  drawFilterDiv();
  // 5-Level & Reply Quantile visibility Option Div
  drawOptionDiv();

  function drawFilterDiv() {
    const similarThresh = 0.2;
    const articleThresh = 1;
    d3.select('.option').selectAll('*').remove();
    const similarThreshDiv = d3.select('.option').append('div')
      .style('padding', '0px')
      .style('padding-left', '10px')
      .attr('class', 'col-sm-3')
      .style('display', 'flex')
      .append('div')
      .style('display', 'flex')
      .style('margin-left', 'auto')
      .style('margin-right', '0px')
      .style('align-items', 'center');
    similarThreshDiv.append('h6')
      .text('Similarity >=')
      .style('margin-right', '10px')
      .style('margin-top', 'auto')
      .style('margin-bottom', 'auto');
    similarThreshDiv.append('input')
      .attr('type', 'number')
      .attr('id', 'similarThresh')
      .style('width', '50px')
      .style('height', 'fit-content')
      .attr('value', similarThresh);
    // .on('keypress', (d, index, nodes) => {
    //   if (d3.event.keyCode === 13) {
    //     const val = d3.select(nodes[index]).property('value');
    //     similarThresh = val;
    //     adjacencyMatrixNoAuthor(userSimilarity, similarThresh, articleThresh);
    //   }
    // });
    const articleThreshDiv = d3.select('.option').append('div')
      .style('padding', '0px')
      .attr('class', 'col-sm-3')
      .style('display', 'flex')
      .append('div')
      .style('display', 'flex')
      .style('margin-left', 'auto')
      .style('margin-right', '0px')
      .style('align-items', 'center');
    articleThreshDiv.append('h6')
      .text('Reply >=')
      .style('margin-right', '10px')
      .style('margin-top', 'auto')
      .style('margin-bottom', 'auto');
    articleThreshDiv.append('input')
      .attr('type', 'number')
      .attr('id', 'articleThresh')
      .style('width', '50px')
      .style('height', 'fit-content')
      .attr('value', articleThresh);
    const filterButton = d3.select('.option').append('div')
      .style('padding-left', '10px')
      .attr('class', 'col-sm-1')
      .style('display', 'flex');
    filterButton.append('button')
      .style('type', 'button')
      .style('font-size', 'smaller')
      .attr('class', 'btn btn-primary')
      .attr('id', 'submitUsers')
      .text('Filter')
      .on('click', () => {
        const simThresh = d3.select('#similarThresh').property('value');
        const artThresh = d3.select('#articleThresh').property('value');
        adjacencyMatrixNoAuthor(userSimilarity, simThresh, artThresh);
      });
    adjacencyMatrixNoAuthor(userSimilarity, similarThresh, articleThresh);
  }

  function drawOptionDiv() {
    let simOptionsDiv = d3.select('.heatMap').select('.option').append('div')
      .attr('class', 'col-sm-5 filterDiv d-flex align-items-center');
    simOptionsDiv = simOptionsDiv.append('div')
      .style('margin-right', '0px')
      .style('margin-left', 'auto')
      .style('align-self', 'center')
      .style('display', 'flex')
      .style('font-size', 'x-small');
    simOptionsDiv.append('h6')
      .text('Options:')
      .style('margin-top', 'auto')
      .style('margin-bottom', 'auto');
    simOptionsDiv = simOptionsDiv.append('div').style('margin-left', '10px');
    const fiveLevelOption = simOptionsDiv.append('div')
      .style('float', 'left')
      .style('display', 'flex');
    fiveLevelOption.append('input')
      .attr('type', 'checkbox')
      .attr('id', 'fiveLevel')
      .attr('name', 'similarity')
      .attr('value', 'fiveLevel')
      .property('checked', true);
    fiveLevelOption.append('label')
      .attr('for', 'fiveLevel')
      .text('5-Level')
      .style('margin-right', '10px')
      .style('margin-bottom', '0px');
    const replyQuantileOption = simOptionsDiv.append('div')
      .style('float', 'left')
      .style('display', 'flex');
    replyQuantileOption.append('input')
      .attr('type', 'checkbox')
      .attr('id', 'replyQuantile')
      .attr('name', 'similarity')
      .attr('value', 'replyQuantile')
      .property('checked', true);
    replyQuantileOption.append('label')
      .attr('for', 'replyQuantile')
      .text('Quantile')
      .style('margin-right', '0px')
      .style('margin-bottom', '0px');
    const getActivityDiv = d3.select('.option')
      .append('div')
      .style('padding-left', '10px')
      .style('margin-bottom', '5px')
      .style('margin-top', '5px');
    getActivityDiv.append('span')
      .style('margin-left', '5px')
      .style('margin-right', '5px')
      .text('From');
    getActivityDiv.append('input')
      .attr('type', 'date')
      .attr('name', 'since')
      .attr('id', 'userDate1')
      .each((d, index, nodes) => {
        // if (!d3.select(nodes[index]).property('value')) {
        //   d3.select(nodes[index]).property('value', d3.select('#date1').attr('value'));
        // }
        d3.select(nodes[index]).property('value', beginDateOfQuery);
      })
      .attr('placeholder', 'since');

    getActivityDiv.append('span')
      .style('margin-left', '5px')
      .style('margin-right', '5px')
      .text('to');

    getActivityDiv.append('input')
      .style('margin-right', '5px')
      .attr('type', 'date')
      .attr('name', 'until')
      .attr('id', 'userDate2')
      .each((d, index, nodes) => {
        // if (!d3.select(nodes[index]).property('value')) {
        //   d3.select(nodes[index]).property('value', d3.select('#date2').attr('value'));
        // }
        d3.select(nodes[index]).property('value', endDateOfQuery);
      })
      .attr('placeholder', 'until');

    getActivityDiv.append('button')
      .style('type', 'button')
      .style('font-size', 'smaller')
      .attr('class', 'btn btn-primary')
      .attr('id', 'submitUsers')
      .text('Get Activity!')
      .on('click', d => {
        const usr = [];
        selectedUser.forEach(e => {
          usr.push({ id: e });
        });
        submit(usr, 0);
      });
    simOptionsDiv.selectAll('input').on('change', (d, index, nodes) => {
      const type = d3.select(nodes[index]).attr('value');
      const checked = d3.select(nodes[index]).property('checked');
      switch (type) {
        case 'userArticle':
          d3.selectAll('.articleSimilarity')
            .attr('visibility', checked ? 'visible' : 'hidden');
          break;
        case 'userAuthor':
          d3.selectAll('.authorSimilarity')
            .attr('visibility', checked ? 'visible' : 'hidden');
          break;
        case 'community':
          d3.selectAll('.avgSimilarityPath')
            .attr('visibility', checked ? 'visible' : 'hidden');
          break;

        case 'quantile':
          d3.selectAll('.quantilePath')
            .attr('visibility', checked ? 'visible' : 'hidden');
          break;
        case 'fiveLevel':
          d3.select('.leftSvg')
            .selectAll('.articleSimilarity')
            .attr('fill', (_d, _index, _nodes) => {
              const className = d3.select(_nodes[_index]).attr('class');
              console.log(className);
              const xID = className.split(' ')[1];
              const yID = className.split(' ')[2];
              console.log(xID, yID);
              const user1 = datas.find(e => e.id === xID);
              const user2 = datas.find(e => e.id === yID);
              // if (index1 > index2) return leftMyColor(100);
              if (user1.community === user2.community) {
                if (checked) {
                  console.log('checked');
                  return colorArray[user1.community](Math.floor(_d * 100 / 20) * 0.2);
                }
                return colorArray[user1.community](_d);
              }
              if (checked) {
                console.log('checked');
                return colorArray[7](Math.floor(_d * 100 / 20) * 0.2);
              }
              return colorArray[7](_d);
            });
          break;
        case 'replyQuantile':
          d3.selectAll('.betweenUsers.quantilePath')
            .attr('visibility', checked ? 'hidden' : 'visible');
          const simThresh = d3.select('#similarThresh').property('value');
          const artThresh = d3.select('#articleThresh').property('value');
          adjacencyMatrixNoAuthor(userSimilarity, simThresh, artThresh);
          break;

        default:
          break;
      }
    });
  }
  // heatMapWithAuthor();

  function adjacencyMatrixNoAuthor(similarity, simThresh, artThresh) {
    newUserAxisValues = [];
    svg.selectAll('*').remove();
    svg.call(d3.zoom()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 8])
      .on('zoom', zoomed));
    const position = svg.append('g').attr('class', 'position');
    const group = position.append('g').attr('class', 'group')
      .attr('transform', 'translate(-30, 200)');
    function zoomed() {
      group.attr('transform', d3.event.transform);
    }
    // Article Similarity
    [datas, users, similaritys] = dp.filterAlwaysNonSimilarUser(data, user, similarity, simThresh, artThresh);

    console.log('[datas]:', [datas], '[users]:', [users], '[similaritys]:', [similaritys]);
    if (!datas.length) {
      svg.append('text')
        .text('No users meet the conditions. Please adjust the filter value')
        .attr('x', 100)
        .attr('y', height / 2)
        .attr('font-size', 20)
        .attr('fill', 'red');
      return;
    }
    // similarity for articles grouping
    // let filteredArticles = articles;
    // filteredArticles = filteredArticles.filter(
    //   e => e.messages.some(mes => datas.some(usr => usr.id === mes.push_userid)),
    // );

    // articlesOrderByCommunity = articlesOrdering(articles, articlesCommunity);
    // console.log('articlesOrderByCommunity', articlesOrderByCommunity);
    const articlesOrderByCommunity = filteredArticles;
    // responderCommunityDetecting(nodes, similaritys);
    const axisDomain = [];
    for (let i = 0; i < users.length; i += 1) {
      axisDomain.push(i);
    }
    console.log('Similarity: ', similaritys.length);
    const community = dp.jLouvainClustering(users, similaritys);
    community.forEach(e => {
      datas.find(e1 => e1.id === e.id).community = e.community;
    });
    // console.log(community);
    const communityWord = dp.computeCommunityTitleWordScore(datas);
    // console.log('communityWord: ', communityWord);
    if (communityWord.length) {
      const score = communityWord[0].wordList.reduce((acc, obj) => acc + obj.score, 0);
    }
    // similarity for articles grouping
    const [filteredArticles, articleSimilarity] = dp.computeArticleSimilarity(datas);
    console.log('articleSimilarity: ', articleSimilarity.length);
    const articleIds = filteredArticles.map(e => e.article_id);
    const articlesCommunity = dp.jLouvainClustering(articleIds, articleSimilarity);
    // console.log('articlesCommunity', articlesCommunity);

    const [matrix, origMatrix] = dp.relationToMatrix(similaritys, users);
    const similarityScale = d3.scalePow().exponent(0.5).range([0, 100]);
    // console.log('[matrix]', [matrix]);
    const [permuted_mat, permuted_origMat] = dp.matrixReordering(
      matrix, origMatrix, newUserAxisValues, users, community,
    );
    // console.log('[permuted_mat], [permuted_origMat]: ', [permuted_mat], [permuted_origMat]);

    const [secondOrdering_mat, secondOrdering_origMat] = dp.matrixReorderingByCommunity(
      permuted_mat, permuted_origMat, community, newUserAxisValues, users,
    );
    // console.log(newUserAxisValues);
    // find user group index
    const groupIndex = [];
    newUserAxisValues.forEach((e, index) => {
      const tempCom = community.find(e1 => e1.id === e).community;
      const existedCommunity = groupIndex.find(e1 => e1.community === tempCom);
      if (existedCommunity) existedCommunity.num += 1;
      else groupIndex.push({ community: tempCom, num: 1, index });
    });
    // console.log('position Index of each user community:', groupIndex);

    // const [secondOrdering_mat, secondOrdering_origMat] = [permuted_mat, permuted_origMat];
    // [secondOrdering_mat, secondOrdering_origMat] = moveNonSimilarUsersToCorner(
    //   secondOrdering_mat, secondOrdering_origMat, groupIndex, newUserAxisValues, users,
    // );

    // [secondOrdering_mat, secondOrdering_origMat] = dp.communityInnerMatrixReordering(secondOrdering_mat, secondOrdering_origMat, newUserAxisValues, users, groupIndex);
    // console.log('secondOrdering_mat, secondOrdering_origMat: ', secondOrdering_mat, secondOrdering_origMat);

    const gridSize = 20;
    d3.select('.position').attr('transform', `scale(1) translate(${2 * margin.left},${4 * margin.top})`);
    const leftSvg = group.append('g')
      .attr('class', 'leftSvg')
      .attr('transform', `rotate(-45) scale(${svgScale(datas.length) > 0 ? svgScale(datas.length) : 0.4}) translate(0,0)`);

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
        d3.selectAll(`circle.id_${d}`).attr('r', 10);
      }
      const xUser = newUserAxisValues[index];
      const yUser = newUserAxisValues[i];
      Tooltip
        .style('opacity', 1)
        .html(`<p style="color: white;">Similarity between ${xUser} and ${yUser} is ${Math.round(d.value * 100) / 100}</p>`)
        .style('left', `${d3.event.pageX + 25}px`)
        .style('top', `${d3.event.pageY}px`);
      d3.select(this)
        .style('stroke', 'black')
        .style('opacity', 1);
    };
    const mouseout = d => {
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
    const selectedArticles = [];
    const rectClick = (d, index, i) => {
      let bothRepliedArticles = [];
      const beginDate = d3.select('#userDate1').property('value');
      const endDate = d3.select('#userDate2').property('value');
      const us = datas.filter(_d => selectedUser.includes(_d.id));
      if (us.length === 2) {
        bothRepliedArticles = us[0].repliedArticle.filter(a => us[1].repliedArticle.some(_a => a.article_id === _a.article_id));
      } else {
        us.forEach(usr => {
          usr.repliedArticle.forEach(art => {
            if (!bothRepliedArticles.some(e => e.article_id === art.article_id)) {
              bothRepliedArticles.push(art);
            }
          });
        });
      }
      const sortedUs = [];
      newUserAxisValues.forEach(e => {
        const usr = us.find(u => u.id === e);
        if (usr) sortedUs.push(usr);
      });
      bothRepliedArticles = selectedArticles.length >= 1 ? selectedArticles : bothRepliedArticles;
      timelineView(bothRepliedArticles, sortedUs, commentTimelineSvg, beginDate, endDate);

      articles.sort((a, b) => {
        if (bothRepliedArticles.find(e => e.article_title === b.article_title)) return 1;
        return -1;
      });
      console.log('sorted articles', articles);
      console.log('bothRepliedArticles', bothRepliedArticles);
      // updateArticleMatrix(bothRepliedArticles);
    };

    const tickClick = d => {
      const beginDate = beginDateOfQuery;
      const endDate = endDateOfQuery;
      const repliedArticles = [];
      const us = datas.filter(_d => selectedUser.includes(_d.id));
      us.forEach(usr => {
        usr.repliedArticle.forEach(art => {
          if (!repliedArticles.some(e => e.article_id === art.article_id)) {
            repliedArticles.push(art);
          }
        });
      });
      const sortedUs = [];
      newUserAxisValues.forEach(e => {
        const usr = us.find(u => u.id === e);
        if (usr) sortedUs.push(usr);
      });
      if (selectedArticles.length > 0) timelineView(selectedArticles, sortedUs, commentTimelineSvg, beginDate, endDate);
      else timelineView(repliedArticles, sortedUs, commentTimelineSvg, beginDate, endDate);
      console.log('tickclick');
      // updateArticleMatrix(repliedArticles);
    };

    // reorder community inner matrix
    // [secondOrdering_mat, secondOrdering_origMat] = dp.communityInnerMatrixReordering(secondOrdering_mat, secondOrdering_origMat, newUserAxisValues, users, groupIndex);
    // console.log(secondOrdering_mat, secondOrdering_origMat);

    // draw userGroup legends
    const groupLegend = d3.select('#timeLine')
      .append('g').attr('class', 'groupLegends')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    const legendSize = 15;
    groupLegend.selectAll('rect')
      .data(groupIndex)
      .enter()
      .append('g')
      .attr('class', (d, index) => `group_${index}`)
      .attr('transform', (d, index) => `translate(${110 * (index % 2)}, ${70 * Math.floor(index / 2)})`)
      // .attr('transform', (d, index) => `translate(0 ${20 * index})`)
      .each((d, index, nodes) => {
        d3.select(nodes[index]).append('text')
          .text(`Community ${index + 1}`)
          .attr('x', 0)
          .attr('font-size', 14)
          .attr('fill', colorArray[d.community](1));

        d3.select(nodes[index])
          .selectAll()
          .data([1, 0.8, 0.6, 0.4, 0.2])
          .enter()
          .append('rect')
          .attr('x', (_d, _index) => _index * legendSize)
          .attr('y', 10)
          .attr('width', legendSize)
          .attr('height', legendSize)
          .attr('fill', _d => colorArray[d.community](_d));
        d3.select(nodes[index])
          .selectAll()
          .data(['1', '.8', '.6', '.4', '.2'])
          .enter()
          .append('text')
          .text(_d => _d)
          .attr('x', (_d, _index) => _index * legendSize + 5)
          .attr('y', 35)
          .attr('font-size', 10)
          .attr('fill', 'black');
      });

    const rectMargin = 20;
    const maxReplied = Math.max(...datas.map(usr => usr.repliedArticle.length));
    const maxSize = 80;
    const fixedSize = maxSize - 10;
    const bandWidthScale = d3.scaleSqrt().domain([0, maxReplied])
      .range([0, fixedSize]);
    const positionScale = computePosition(datas, bandWidthScale);

    const activityTranslateX = 120;
    const brushHeight = 20;
    // Upper Part Of UserActivityView
    drawNewHeatmap();
    // Bottom Part Of UserActivityView
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
      // const max = datas.reduce((prev, current) => {
      //   const preLen = prev.repliedArticle ? prev.repliedArticle.length : prev;
      //   const curLen = current.repliedArticle ? current.repliedArticle.length : current;
      //   return (preLen > curLen) ? preLen : curLen;
      // });
      // const min = datas.reduce((prev, current) => {
      //   const preLen = prev.repliedArticle ? prev.repliedArticle.length : prev;
      //   const curLen = current.repliedArticle ? current.repliedArticle.length : current;
      //   return (preLen < curLen) ? preLen : curLen;
      // });
      for (let i = 0; i < permuted_mat.length; i += 1) {
        const leftSvgGroup = leftSvg.append('g');
        leftSvgGroup.selectAll()
          .data(secondOrdering_mat[i])
          .enter()
          // .append('rect')
          .each((d, index, nodes) => {
            if (index >= i) {
              const xUser = datas.find(e => e.id === newUserAxisValues[index]);
              const yUser = datas.find(e => e.id === newUserAxisValues[i]);
              if (i < index || xUser.community === yUser.community) {
                const xSize = datas.find(e => e.id === xUser.id).repliedArticle.length;
                const ySize = datas.find(e => e.id === yUser.id).repliedArticle.length;
                const bothReplied = getBothRepliedArticle(xUser, yUser);
                const bothSize = bothReplied.length;
                // user rect
                drawUserRect(nodes, index, i);

                // draw article similarity between users
                drawArticleSimilarity(d, nodes, index, i, xUser, yUser, bothSize);

                // draw user reply time quantile
                const quantileFilter = d3.select('#replyQuantile');
                const checked = quantileFilter.empty() ? null : quantileFilter.property('checked');
                if (i === index || checked === false) {
                  drawNewReplyTimeWithQuantile(nodes, index, i, xUser, yUser, bothReplied);
                }
              }
            }
          });
        // user self path
        drawUserPath(leftSvgGroup, i);
      }

      // brush & focus Users
      rangeSelectingUsers();

      function drawUserRect(n, indX, indY) {
        d3.select(n[indX])
          .append('rect')
          .attr('class', () => {
            const xUserID = newUserAxisValues[indX];
            const yUserID = newUserAxisValues[indY];
            return `userRect ${xUserID} ${yUserID} y${indY} x${indX}`;
          })
          .attr('x', (indX % newUserAxisValues.length) * (maxSize + rectMargin))
          .attr('y', indY * (maxSize + rectMargin))
          .attr('width', maxSize)
          .attr('height', maxSize)
          .attr('fill', 'white')
          .attr('stroke', colorArray[7](1))
          .attr('stroke-width', '2px')
          .attr('opacity', indY > indX ? 0 : 1);
      }

      function drawNewReplyTimeWithQuantile(n, indX, indY, user1, user2, bothRepliedArticles) {
        const xUserRepliedTime = getAllReplyTime(user1, bothRepliedArticles);
        const yUserRepliedTime = getAllReplyTime(user2, bothRepliedArticles);
        // for user study
        if (user1.id === user2.id) datas.find(e => e.id === user1.id).replyTime = xUserRepliedTime;
        const threeHours = 60 * 60 * 3;
        const thisTimeRectwidth = 10;
        const thisTimeMaxLong = maxSize - 10;
        d3.select(n[indX])
          .selectAll()
          .data([xUserRepliedTime, yUserRepliedTime])
          .enter()
          .append('g')
          .attr('class', () => {
            if (user1.id === user2.id) return 'userSelf quantilePath';
            return 'betweenUsers quantilePath';
          })
          .each((_d, _index, _n) => {
            const quantile = [
              Math.max(0, d3.quantile(_d, 0.25)),
              Math.max(0, d3.quantile(_d, 0.5)),
              Math.max(0, d3.quantile(_d, 0.75)),
            ];
            d3.select(_n[_index])
              .selectAll()
              .data([[quantile[0], quantile[2]], quantile[1]])
              .enter()
              .append('path')
              .attr('d', (q, type) => {
                const initX = ((indX % newUserAxisValues.length) + 1) * (maxSize + rectMargin) - rectMargin - (thisTimeRectwidth / 2);
                const initY = indY * (maxSize + rectMargin) + (thisTimeRectwidth / 2);
                if (type === 0) {
                  // quantile q3 - q1
                  const q1_minutes = q[0] / 60;
                  const q1_long = Math.min(thisTimeMaxLong * 2, (q1_minutes / (6 * 60)) * thisTimeMaxLong * 2);
                  const q3_minutes = q[1] / 60;
                  const q3_long = Math.min(thisTimeMaxLong * 2, (q3_minutes / (6 * 60)) * thisTimeMaxLong * 2);
                  if (q3_long <= thisTimeMaxLong) {
                    return `
                      M ${initX - ((_index % 2) * q1_long)} ${initY + (((_index + 1) % 2) * q1_long)} 
                      L ${initX - ((_index % 2) * q3_long)} ${initY + (((_index + 1) % 2) * q3_long)}
                      L ${initX - ((_index % 2) * q3_long) + (((_index + 1) % 2) * thisTimeRectwidth)} ${initY + (((_index + 1) % 2) * q3_long) - ((_index % 2) * thisTimeRectwidth)} 
                      L ${initX - ((_index % 2) * q1_long) + (((_index + 1) % 2) * thisTimeRectwidth)} ${initY + (((_index + 1) % 2) * q1_long) - ((_index % 2) * thisTimeRectwidth)} 
                      L ${initX - ((_index % 2) * q1_long)} ${initY + (((_index + 1) % 2) * q1_long)} 
                    `;
                  }
                  if (q3_long > thisTimeMaxLong && q1_long < thisTimeMaxLong) {
                    if (_index === 0) {
                      // right side
                      const fixedLong = q3_long - thisTimeMaxLong;
                      return `
                      M ${initX} ${initY + (((_index + 1) % 2) * q1_long)} 
                      L ${initX} ${initY + thisTimeMaxLong} 
                      L ${initX - fixedLong} ${initY + thisTimeMaxLong} 
                      L ${initX - fixedLong} ${initY + thisTimeMaxLong + thisTimeRectwidth} 
                      L ${initX + thisTimeRectwidth} ${initY + thisTimeMaxLong + thisTimeRectwidth}
                      L ${initX + thisTimeRectwidth} ${initY + (((_index + 1) % 2) * q1_long)} 
                      L ${initX} ${initY + (((_index + 1) % 2) * q1_long)} 
                      `;
                    }
                    // left side
                    const fixedLong = q3_long - thisTimeMaxLong;
                    return `
                      M ${initX - ((_index % 2) * q1_long)} ${initY} 
                      L ${initX - thisTimeMaxLong} ${initY} 
                      L ${initX - thisTimeMaxLong} ${initY + fixedLong} 
                      L ${initX - thisTimeMaxLong - thisTimeRectwidth} ${initY + fixedLong} 
                      L ${initX - thisTimeMaxLong - thisTimeRectwidth} ${initY - thisTimeRectwidth} 
                      L ${initX - ((_index % 2) * q1_long)} ${initY - thisTimeRectwidth} 
                      L ${initX - ((_index % 2) * q1_long)} ${initY} 
                    `;
                  }
                  if (q3_long > thisTimeMaxLong && q1_long > thisTimeMaxLong) {
                    if (_index === 0) {
                      // right side
                      const fixedLong = q3_long - thisTimeMaxLong;
                      return `
                        M ${initX - (q1_long - thisTimeMaxLong)} ${initY + thisTimeMaxLong} 
                        L ${initX - fixedLong} ${initY + thisTimeMaxLong} 
                        L ${initX - fixedLong} ${initY + thisTimeMaxLong + thisTimeRectwidth} 
                        L ${initX - (q1_long - thisTimeMaxLong)} ${initY + thisTimeMaxLong + thisTimeRectwidth} 
                        L ${initX - (q1_long - thisTimeMaxLong)} ${initY + thisTimeMaxLong} 
                        `;
                    }
                    // left side
                    const fixedLong = q3_long - thisTimeMaxLong;
                    return `
                      M ${initX - thisTimeMaxLong} ${initY + (q1_long - thisTimeMaxLong)} 
                      L ${initX - thisTimeMaxLong} ${initY + fixedLong}
                      L ${initX - thisTimeMaxLong - thisTimeRectwidth} ${initY + fixedLong}
                      L ${initX - thisTimeMaxLong - thisTimeRectwidth} ${initY + (q1_long - thisTimeMaxLong)}
                      L ${initX - thisTimeMaxLong} ${initY + (q1_long - thisTimeMaxLong)}
                    `;
                  }
                }
                const q2_minutes = q / 60;
                const q2_long = Math.min(thisTimeMaxLong * 2 - 1, (q2_minutes / (6 * 60)) * thisTimeMaxLong * 2);
                if (q2_long <= thisTimeMaxLong) {
                  // right side
                  if (_index === 0) {
                    return `
                      M ${initX} ${initY + q2_long} 
                      L ${initX} ${initY + (q2_long + 1)} 
                      L ${initX + thisTimeRectwidth} ${initY + (q2_long + 1)} 
                      L ${initX + thisTimeRectwidth} ${initY + q2_long} 
                      `;
                  }
                  // left side
                  return `
                    M ${initX - q2_long} ${initY} 
                    L ${initX - (q2_long + 1)} ${initY} 
                    L ${initX - (q2_long + 1)} ${initY - thisTimeRectwidth} 
                    L ${initX - q2_long} ${initY - thisTimeRectwidth} 
                    `;
                }
                // right side
                if (_index === 0) {
                  return `
                    M ${initX - (q2_long - thisTimeMaxLong)} ${initY + thisTimeMaxLong} 
                    L ${initX - (q2_long - thisTimeMaxLong + 1)} ${initY + thisTimeMaxLong}
                    L ${initX - (q2_long - thisTimeMaxLong + 1)} ${initY + thisTimeMaxLong + thisTimeRectwidth}
                    L ${initX - (q2_long - thisTimeMaxLong)} ${initY + thisTimeMaxLong + thisTimeRectwidth}
                    `;
                }
                // left side
                return `
                  M ${initX - thisTimeMaxLong} ${initY + (q2_long - thisTimeMaxLong)} 
                  L ${initX - thisTimeMaxLong} ${initY + (q2_long - thisTimeMaxLong + 1)}
                  L ${initX - thisTimeMaxLong - thisTimeRectwidth} ${initY + (q2_long - thisTimeMaxLong + 1)}
                  L ${initX - thisTimeMaxLong - thisTimeRectwidth} ${initY + (q2_long - thisTimeMaxLong)}
                  `;
              })
              .attr('fill', () => {
                if (_index === 0) return colorArray[user1.community](secondOrdering_mat[indX][indY]);
                return colorArray[user2.community](secondOrdering_mat[indX][indY]);
              })
              .attr('stroke', (q, step) => 'black')
              .attr('stroke-width', (q, step) => (step === 1 ? '3px' : '3px'));
          });
      }
      function drawArticleSimilarity(_d, n, indX, indY, user1, user2, size) {
        d3.select(n[indX])
          .append('rect')
          .attr('class', () => {
            const xUserID = newUserAxisValues[indX];
            const yUserID = newUserAxisValues[indY];
            return `articleSimilarity ${xUserID} ${yUserID} y${indY} x${indX}`;
          })
          .attr('x', (indX % newUserAxisValues.length) * (maxSize + rectMargin) + ((maxSize - fixedSize) / 2))
          .attr('y', indY * (maxSize + rectMargin) + ((maxSize - fixedSize) / 2))
          .attr('rx', () => {
            if (indY > indX) return 0;
            return Math.min(15, bandWidthScale(size) / 10);
          })
          .attr('width', fixedSize)
          .attr('height', fixedSize)
          .attr('fill', () => {
            if (indY > indX) return leftMyColor(100);
            if (user1.community === user2.community) {
              const communityColor = d3.scaleLinear()
                .range(['white', color(user1.community)])
                .domain([0, 1]);
              // return communityColor(_d);
              return colorArray[user1.community](Math.floor(_d * 100 / 20) * 0.2);
            }
            // return leftMyColor(_d);
            return colorArray[7](Math.floor(_d * 100 / 20) * 0.2);
          })
          .attr('opacity', indY >= indX ? 0 : 1)
          .on('mouseover', () => mouseover(secondOrdering_origMat[indY][indX], indX, indY))
          .on('mouseout', mouseout)
          .on('click', () => {
            selectedUser.splice(0, selectedUser.length);
            selectedUser.push(newUserAxisValues[indY]);
            selectedUser.push(newUserAxisValues[indX]);
            rectClick(_d, indX, indY);
          });
      }

      function drawUserPath(selectedGroup, ind) {
        const tempUser = community.find(e => e.id === newUserAxisValues[ind]);
        selectedGroup.append('path')
          .attr('d', () => {
            const size = datas.find(e => e.id === tempUser.id).repliedArticle.length;
            const offset = (bandWidthScale.range()[1] - bandWidthScale(size)) / 2 + ((maxSize - fixedSize) / 2);
            const start = ind * (maxSize + rectMargin) + offset;
            const end = start + bandWidthScale(size);
            return `M ${start} ${start} L ${end} ${start} L ${end} ${end} L ${start} ${end} L ${start} ${start}`;
          })
          .attr('fill', colorArray[tempUser.community](0.8))
          .on('click', () => {
            selectedUser.splice(0, selectedUser.length);
            selectedUser.push(newUserAxisValues[ind]);
            rectClick();
          });
      }

      function rangeSelectingUsers() {
        const reverseScale = svgScale(datas.length) > 0 ? svgScale(datas.length) : 0.4;
        const widthOfHeatmap = (maxSize + rectMargin) * datas.length - rectMargin;
        const brush = d3.brushX()
          .extent([[0, 0], [widthOfHeatmap * reverseScale * Math.sqrt(2), brushHeight]])
          .on('end', brushed);

        leftSvg.append('defs').append('clipPath')
          .attr('id', 'clip')
          .append('rect')
          .attr('width', width)
          .attr('height', height);

        const context = group;

        context.append('g')
          .attr('class', 'brush')
          .attr('transform', `translate(0, ${maxSize * reverseScale})`)
          .call(brush)
          .call(brush.move, [0, 0])
          .on('mouseover', () => {
            d3.selectAll('.avgSimilarityPath')
              .attr('opacity', 0);
          })
          .on('mouseout', () => {
            d3.selectAll('.avgSimilarityPath')
              .attr('opacity', 1);
          });

        context.select('.handle.handle--n')
          .attr('fill', 'slategray');
        context.select('.handle.handle--s')
          .attr('fill', 'slategray');

        d3.select('.brush').append('path')
          .attr('d', 'M 0 0 L 0 0 L 0 0');
        function brushed(d) {
          if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return; // ignore brush-by-zoom
          const s = d3.event.selection;
          const focusUserIndex = [];
          selectedUser.splice(0, selectedUser.length);
          const start = Math.round((s[0] / reverseScale) / ((maxSize + rectMargin) * Math.sqrt(2)));
          const end = Math.floor((s[1] / reverseScale) / ((maxSize + rectMargin) * Math.sqrt(2)));
          for (let i = start; i <= end; i += 1) {
            d3.selectAll(`circle.id_${newUserAxisValues[i]}`).attr('r', 7.5);
            selectedUser.push(newUserAxisValues[i]);
          }
          // resize brush controller
          const fixedX1 = start * (maxSize + rectMargin) * reverseScale * Math.sqrt(2);
          const fixedX2 = (end * (maxSize + rectMargin) + maxSize) * reverseScale * Math.sqrt(2);

          d3.select('.brush').nodes()[0].__brush.selection[0][0] = fixedX1;
          d3.select('.brush').nodes()[0].__brush.selection[1][0] = fixedX2;
          context.select('.handle.handle--w')
            .attr('x', fixedX1)
            .attr('fill', 'slategray');
          context.select('.handle.handle--e')
            .attr('x', fixedX2)
            .attr('fill', 'slategray');
          context.select('.selection')
            .attr('x', fixedX1)
            .attr('width', fixedX2 - fixedX1);
          // setting all co-cluster rect stroke-width to 1
          // d3.select('.radialGroup').selectAll('rect')
          //   .attr('stroke', 'slategray')
          //   .attr('stroke-width', '0.3px');
          // highlight selected grid of heatmap
          const brushPathOffset = maxSize * reverseScale;
          d3.select('.brush').select('path')
            .transition()
            .attr('d', () => `
                M ${fixedX1} ${-brushPathOffset} 
                L ${(fixedX2 + fixedX1) / 2} ${-(fixedX2 - fixedX1) / 2 - brushPathOffset} 
                L ${fixedX2} ${-brushPathOffset} 
                L ${fixedX1} ${-brushPathOffset}
              `)
            .attr('stroke', 'black')
            .attr('stroke-width', '2px')
            .attr('fill', 'gray')
            .attr('opacity', '0.5')
            .style('pointer-events', 'none');
          tickClick();
        }
      }

      function getBothRepliedArticle(usr1, usr2) {
        const articleArr = usr1.repliedArticle.filter(
          a => usr2.repliedArticle.some(_a => _a.article_id === a.article_id),
        );
        return articleArr;
      }

      function getAllReplyTime(usr, articleArr) {
        // simArr.sort((a, b) => a - b);
        const arr = [];
        articleArr.forEach(a => {
          const postYear = new Date(a.date).getFullYear();
          const mes = a.messages.find(m => m.push_userid === usr.id);
          const date = dateFormat(mes);
          const commentTime = new Date(new Date(date).setFullYear(postYear));
          const diff = commentTime - new Date(a.date);
          arr.push(diff / 1000);
        });
        arr.sort((a, b) => a - b);
        return arr;
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
        .attr('transform', `translate(0, ${maxSize + brushHeight}) scale(${svgScale(datas.length) > 0 ? svgScale(datas.length) : 0.4})`)
        .attr('stroke', 'slategray')
        .attr('stroke-width', '0.3px');
      // const articleGroupHeatmap = leftSvg.append('g').attr('class', 'articleGroupHeatmap');
      const numOfArtCom = Math.max(...articlesCommunity.map(e => e.community)) + 1;
      const numOfArtOfEachComunity = [];
      for (let i = 0; i < numOfArtCom; i += 1) {
        const tempCommunity = articlesCommunity.filter(e => e.community === i);
        if (tempCommunity.length) numOfArtOfEachComunity.push({ community: i, articles: tempCommunity });
      }
      numOfArtOfEachComunity.sort((a, b) => b.articles.length - a.articles.length);
      // console.log('numOfArtOfEachComunity', numOfArtOfEachComunity);
      const existedCommunityOfArticle = [];
      numOfArtOfEachComunity.forEach(e => {
        existedCommunityOfArticle.push(e.community);
      });
      // console.log('existedCommunityOfArticle', existedCommunityOfArticle);
      const artComPie = d3.pie()
        .value(d => d.length)
        .sort(null);
      const dataReady = artComPie(numOfArtOfEachComunity);
      const numOfUserCom = Math.max(...community.map(e => e.community)) + 1;
      const comunityIndexY = [];
      const temp = [];

      for (let j = 0; j < newUserAxisValues.length; j += 1) {
        const com = datas.find(e => e.id === newUserAxisValues[j]).community;
        if (!temp.includes(com)) {
          temp.push(com);
          comunityIndexY.push(j);
        }
      }

      const articleGroupWidthScale = d3.scaleLinear().domain([0, filteredArticles.length]).range([0, 2000]);
      const articleGroupIndexArray = [];
      const articleGroupYScale = [0];
      const padding = 2;
      for (let i = 0; i < numOfArtCom; i += 1) {
        articleGroupIndexArray.push(i);
        if (i < numOfArtCom - 1) {
          const articlesOfCommunityI = numOfArtOfEachComunity.find(e => e.community === i);
          if (articlesOfCommunityI) {
            articleGroupYScale.push(padding + articleGroupYScale[i] + articleGroupWidthScale(articlesOfCommunityI.articles.length));
          } else {
            articleGroupYScale.push(0);
          }
        }
      }

      const articleGroupOfUserCommunity = [];
      for (let i = 0; i < numOfUserCom; i += 1) {
        let numOfUser = 0;
        if (i === numOfUserCom - 1) numOfUser = newUserAxisValues.length - comunityIndexY[i];
        else numOfUser = comunityIndexY[i + 1] - comunityIndexY[i];
        // draw bipartite graph visualization
        const arr = drawRelationRatio(i, numOfUser);
        articleGroupOfUserCommunity.push(arr);
      }
      // console.log('articleGroupOfUserCommunity: ', articleGroupOfUserCommunity);

      // draw bipartite co-cluster graph
      drawNewCoClusterGraph(articleGroupOfUserCommunity);

      function drawRelationRatio(index, userCount) {
        const communityIndexDatas = datas.filter(e => e.community === index);
        const communityIndexArticles = computeNumOfArticlesOfEachCommunity();
        const communityEachLevelCount = [];
        communityIndexArticles.forEach(e => {
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
        // console.log('communityEachLevelCount', communityEachLevelCount);
        let nex = positionScale.length - 1;
        if (comunityIndexY[index + 1]) nex = comunityIndexY[index + 1];

        return communityEachLevelCount;

        function computeNumOfArticlesOfEachCommunity() {
          const arr = [];
          communityIndexDatas.forEach(u => {
            u.repliedArticle.forEach(article => {
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

      function drawNewCoClusterGraph(arr) {
        const positionOfArticleCom = [];
        const numberOfArticles = numOfArtOfEachComunity.reduce((acc, obj) => acc + obj.articles.length, 0);
        const scale = d3.scaleLinear().domain([0, numberOfArticles]).range([0, datas.length * maxSize]);
        // calculate all article community position

        // article community position
        for (let j = 0; j < numOfArtOfEachComunity.length; j += 1) {
          const prePosition = j <= 0 ? 0 : positionOfArticleCom[j - 1].position;
          if (j > 0) {
            positionOfArticleCom.push({
              community: numOfArtOfEachComunity[j].community,
              position: prePosition + scale(numOfArtOfEachComunity[j - 1].articles.length) * (3 / 2),
            });
          } else {
            positionOfArticleCom.push({
              community: numOfArtOfEachComunity[j].community,
              position: prePosition,
            });
          }
        }

        for (let i = 0; i < arr.length; i += 1) {
          // user Community i
          // const groupRadial = radial.select(`.group_${i}`);
          const groupRadial = radial;
          const tem = comunityIndexY[i];
          const nex_tem = comunityIndexY[i + 1] ? comunityIndexY[i + 1] : positionScale.length - 1;
          const maxWidth_tem = ((nex_tem - tem) * (maxSize + rectMargin) - rectMargin) * Math.sqrt(2);
          // blank area
          drawBlankAreaOfArticleCommunity(groupRadial, i, maxWidth_tem);
          // bipartite relations with articles and users
          drawBipartiteOfUserAndArticles(groupRadial, i, maxWidth_tem);
          // visual intersection
          drawIntersectionOfUserCommunities(groupRadial, i);
        }
        radial.selectAll('rect')
          .attr('stroke-width', '5px');
        function coClusterMouseover(arts, communityIndex) {
          const usrs = datas.filter(e => e.community === communityIndex);
          usrs.forEach(u => {
            u.haveReplied = u.repliedArticle.filter(a => arts.some(_a => _a.article_id === a.article_id));
          });
        }

        function drawBlankAreaOfArticleCommunity(svgGroup, com, maxWidth) {
          const tempIndex = comunityIndexY[com];
          svgGroup.append('g')
            .attr('class', `co-cluster_${com}`)
            .selectAll('path')
            .data(positionOfArticleCom)
            .enter()
            .append('rect')
            .attr('class', d => `blank_group_${d.community}`)
            .attr('x', () => (tempIndex * (maxSize + rectMargin)) * Math.sqrt(2))
            .attr('y', d => d.position)
            .attr('height', d => {
              const { articles: art } = numOfArtOfEachComunity.find(e => e.community === d.community);
              return scale(art.length);
            })
            .attr('width', maxWidth)
            .attr('fill', 'gray')
            .attr('stroke', 'black');
          // .attr('stroke-width', '1px');
        }

        function drawBipartiteOfUserAndArticles(svgGroup, com, maxWidth) {
          const tempIndex = comunityIndexY[com];
          const tempCom = temp[com];
          svgGroup.append('g')
            .attr('class', `co-cluster_${com}`)
            .selectAll('path')
            .data(arr[tempCom])
            .enter()
            .append('g')
            .each((d, index, nodes) => {
              // for i === k show density of replied articles of userCommunity
              d3.select(nodes[index]).selectAll('path')
                .data(d.level)
                .enter()
                .append('rect')
                .attr('x', (_d, _index) => (tempIndex * (maxSize + rectMargin)) * Math.sqrt(2))
                .attr('y', (_d, _index) => {
                  const { position: pos } = positionOfArticleCom.find(e => e.community === d.community);
                  return pos;
                })
                // .attr('x', (_d, _index) => positionScale[tem] * Math.sqrt(2) + d.position)
                .attr('height', _d => {
                  const { articles: art } = numOfArtOfEachComunity.find(e => e.community === d.community);
                  return scale(art.length);
                })
                .attr('width', _d => {
                  const totalArticlesOfThisCommunityOfArticle = numOfArtOfEachComunity.find(e => e.community === d.community).articles;
                  const thisWidthScale = d3.scaleLinear().domain([0, totalArticlesOfThisCommunityOfArticle.length]).range([0, maxWidth]);
                  const sameArticles = d.level[0].filter(e => _d.some(e1 => e1.article_id === e.article_id));
                  return thisWidthScale(sameArticles.length);
                })
                .attr('stroke', 'black')
                // .attr('stroke-width', '1px')
                .attr('fill', (_d, _index) => colorArray[tempCom]((_index + 1) * 0.2))
                // .attr('stroke', (_d, _index) => (_index === 0 ? 'black' : 'none'))
                .on('click', (_d, _index, _nodes) => {
                  selectedArticles.splice(0, selectedArticles.length);
                  if (d3.select(_nodes[_index]).attr('stroke-width') === '10px') {
                    // already has been selected
                    svgGroup.selectAll('rect').attr('stroke-width', '3px');
                  } else {
                    svgGroup.selectAll('rect').attr('stroke-width', '3px');
                    d3.select(_nodes[_index]).attr('stroke-width', '10px');
                    articles.forEach(e => {
                      if (_d.some(e1 => e1.article_id === e.article_id)) selectedArticles.push(e);
                    });
                  }
                  rectClick(_d, com);
                })
                .on('mouseover', _d => coClusterMouseover(_d, com))
                .each(() => {
                  // svgGroup.select(`.co-cluster_${com}`).select(`.blank_group_${d.community}`).attr('fill', 'none');
                });
            });
        }

        function drawIntersectionOfUserCommunities(svgGroup, com) {
          let positionIndex = com;
          let diffAterSame = 0;
          const tempCom = temp[com];
          for (let j = 0; j < arr.length; j += 1) {
            if (com !== j) {
              // cluster between community_i & community_k
              const nextCom = temp[j];
              positionIndex += diffAterSame;
              diffAterSame = 0;
              const pIndex = positionIndex;
              const nex = comunityIndexY[j];
              const nex_nex = comunityIndexY[j + 1] ? comunityIndexY[j + 1] : positionScale.length - 1;
              const maxWidth_nex = ((nex_nex - nex) * (maxSize + rectMargin) - rectMargin) * Math.sqrt(2);
              const numOfArticlesOfUserCommunity = arr[j].reduce((acc, obj) => acc + obj.level[0].length, 0);
              svgGroup.append('g')
                .attr('class', `co-cluster_${tempCom}_${nextCom}`)
                .selectAll('path')
                .data(arr[tempCom])
                .enter()
                .append('g')
                .each((d, index, nodes) => {
                  const temCommunity = d.community;
                  const nextArticleCommunity = arr[nextCom].find(e => e.community === temCommunity);

                  // visual co-cluster's maxWidth
                  d3.select(nodes[index]).selectAll('path')
                    .data([1])
                    .enter()
                    .append('rect')
                    .attr('x', _d => (nex * (maxSize + rectMargin)) * Math.sqrt(2))
                    .attr('y', (_d, _index) => {
                      if (nextArticleCommunity) {
                        const artNum = numOfArtOfEachComunity.find(e => e.community === nextArticleCommunity.community).articles.length;
                        const offset = scale(artNum) + (pIndex - 1) * (scale(artNum) / 2 / arr.length);
                        return positionOfArticleCom.find(e => e.community === nextArticleCommunity.community).position + offset;
                      }
                      return 0;
                    })
                    .attr('height', (_d, _index) => {
                      if (nextArticleCommunity) {
                        const artNum = numOfArtOfEachComunity.find(e => e.community === nextArticleCommunity.community).articles.length;
                        return scale(artNum) / 2 / arr.length;
                      }
                      return 0;
                    })
                    .attr('width', _d => {
                      if (!nextArticleCommunity) return 0;
                      const totalArticlesOfThisCommunityOfArticle = numOfArtOfEachComunity.find(e => e.community === nextArticleCommunity.community).articles;
                      const thisWidthScale = d3.scaleLinear().domain([0, totalArticlesOfThisCommunityOfArticle.length]).range([0, maxWidth_nex]);
                      const maxWidth = thisWidthScale(nextArticleCommunity.level[0].length);
                      const heightScale = d3.scaleLinear().domain([0, nextArticleCommunity.level[0].length]).range([0, maxWidth]);
                      return maxWidth;
                    })
                    .attr('fill', 'none')
                    .attr('stroke', 'black');

                  d3.select(nodes[index]).selectAll('path')
                    .data(d.level)
                    .enter()
                    .append('rect')
                    .attr('x', _d => (nex * (maxSize + rectMargin)) * Math.sqrt(2))
                    .attr('y', (_d, _index) => {
                      if (nextArticleCommunity) {
                        const artNum = numOfArtOfEachComunity.find(e => e.community === nextArticleCommunity.community).articles.length;
                        const offset = scale(artNum) + (pIndex - 1) * (scale(artNum) / 2 / arr.length);
                        return positionOfArticleCom.find(e => e.community === nextArticleCommunity.community).position + offset;
                      }
                      return 0;
                    })
                    .attr('height', (_d, _index) => {
                      if (nextArticleCommunity) {
                        const artNum = numOfArtOfEachComunity.find(e => e.community === nextArticleCommunity.community).articles.length;
                        return scale(artNum) / 2 / arr.length;
                      }
                      return 0;
                    })
                    .attr('width', _d => {
                      if (!nextArticleCommunity) return 0;
                      const totalArticlesOfThisCommunityOfArticle = numOfArtOfEachComunity.find(e => e.community === nextArticleCommunity.community).articles;
                      const thisWidthScale = d3.scaleLinear().domain([0, totalArticlesOfThisCommunityOfArticle.length]).range([0, maxWidth_nex]);
                      const maxWidth = thisWidthScale(nextArticleCommunity.level[0].length);
                      const heightScale = d3.scaleLinear().domain([0, nextArticleCommunity.level[0].length]).range([0, maxWidth]);
                      const sameArticles = nextArticleCommunity.level[0].filter(e => _d.some(e1 => e1.article_id === e.article_id));
                      return heightScale(sameArticles.length);
                    })
                    .attr('fill', (_d, _index) => colorArray[tempCom](_index * 0.25))
                    .attr('stroke', 'black')
                    .attr('stroke', (_d, _index) => (_index === 0 ? 'black' : 'none'))
                    .on('click', (_d, _index, _nodes, levelIndex) => {
                      if (!nextArticleCommunity) return 0;
                      const sameArticles = nextArticleCommunity.level[0].filter(e => _d.some(e1 => e1.article_id === e.article_id));
                      selectedArticles.splice(0, selectedArticles.length);
                      if (d3.select(_nodes[_index]).attr('stroke-width') === '10px') {
                        // already has been selected
                        svgGroup.selectAll('rect').attr('stroke-width', '1px');
                      } else {
                        svgGroup.selectAll('rect').attr('stroke-width', '1px');
                        d3.select(_nodes[_index]).attr('stroke-width', '10px');
                        articles.forEach(e => {
                          if (sameArticles.some(e1 => e1.article_id === e.article_id)) {
                            selectedArticles.push(e);
                          }
                        });
                      }
                      console.log('selectedArticles: ', selectedArticles);
                      console.log(sameArticles);
                      rectClick(sameArticles, com);
                      return 0;
                    });
                });
            } else {
              diffAterSame = 1;
            }
          }
        }
      }
    }
  }
}

export { userActivityView };
