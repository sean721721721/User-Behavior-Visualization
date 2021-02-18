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
import netClustering from 'netclustering';
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
  drawSlider();
  drawFilterDiv();
  drawSortOptionDiv();

  function drawSlider() {
    let similarThresh = 0.2;
    let articleThresh = 1;
    d3.select('.option').selectAll('*').remove();
    const similarThreshDiv = d3.select('.option').append('div')
      .style('padding-left', '10px')
      .attr('class', 'col-sm-4')
      .style('display', 'flex');
    similarThreshDiv.append('h6')
      .text('Similarity >=')
      .style('margin-right', '10px')
      .style('margin-top', 'auto')
      .style('margin-bottom', 'auto');
    similarThreshDiv.append('input')
      .attr('type', 'number')
      .style('width', '50px')
      .style('height', 'fit-content')
      .attr('value', similarThresh)
      .on('keypress', (d, index, nodes) => {
        if (d3.event.keyCode === 13) {
          const val = d3.select(nodes[index]).property('value');
          similarThresh = val;
          adjacencyMatrixNoAuthor(userSimilarity, similarThresh, articleThresh);
        }
      });
    const articleThreshDiv = d3.select('.option').append('div')
      .style('padding-left', '10px')
      .attr('class', 'col-sm-4')
      .style('display', 'flex');
    articleThreshDiv.append('h6')
      .text('Reply >=')
      .style('margin-right', '10px')
      .style('margin-top', 'auto')
      .style('margin-bottom', 'auto');
    articleThreshDiv.append('input')
      .attr('type', 'number')
      .style('width', '50px')
      .style('height', 'fit-content')
      .attr('value', articleThresh)
      .on('keypress', (d, index, nodes) => {
        if (d3.event.keyCode === 13) {
          const val = d3.select(nodes[index]).property('value');
          articleThresh = val;
          adjacencyMatrixNoAuthor(userSimilarity, similarThresh, articleThresh);
        }
      });
    adjacencyMatrixNoAuthor(userSimilarity, similarThresh, articleThresh);
  }

  function drawFilterDiv() {
    let simOptionsDiv = d3.select('.heatMap').select('.option').append('div')
      .attr('class', 'col-sm-4 filterDiv d-flex align-items-center');
    simOptionsDiv = simOptionsDiv.append('div')
      .style('margin-left', '10px')
      .style('align-self', 'center')
      .style('display', 'flex')
      .style('font-size', 'x-small');
    simOptionsDiv.append('h6')
      .text('Options:')
      .style('margin-right', '10px')
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
      .on('click', (d) => {
        const usr = [];
        selectedUser.forEach((e) => {
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

        default:
          break;
      }
    });
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
    const community = dp.jLouvainClustering(users, similaritys);
    community.forEach((e) => {
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
    // console.log('articleSimilarity: ', articleSimilarity);
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
        .html(`<p style="color: white;">Similarity between ${xUser} and ${yUser} is ${Math.round(d * 100) / 100}</p>`)
        .style('left', `${d3.event.pageX + 25}px`)
        .style('top', `${d3.event.pageY}px`);
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
    const selectedArticles = [];
    const rectClick = (d, index, i) => {
      let bothRepliedArticles = [];
      const beginDate = d3.select('#userDate1').property('value');
      const endDate = d3.select('#userDate2').property('value');
      const us = datas.filter(_d => selectedUser.includes(_d.id));
      if (us.length === 2) {
        bothRepliedArticles = us[0].repliedArticle.filter(a => us[1].repliedArticle.some(_a => a.article_id === _a.article_id));
      } else {
        us.forEach((usr) => {
          usr.repliedArticle.forEach((art) => {
            if (!bothRepliedArticles.some(e => e.article_id === art.article_id)) {
              bothRepliedArticles.push(art);
            }
          });
        });
      }
      const sortedUs = [];
      newUserAxisValues.forEach((e) => {
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

    const tickClick = (d) => {
      const beginDate = beginDateOfQuery;
      const endDate = endDateOfQuery;
      const repliedArticles = [];
      const us = datas.filter(_d => selectedUser.includes(_d.id));
      us.forEach((usr) => {
        usr.repliedArticle.forEach((art) => {
          if (!repliedArticles.some(e => e.article_id === art.article_id)) {
            repliedArticles.push(art);
          }
        });
      });
      const sortedUs = [];
      newUserAxisValues.forEach((e) => {
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
    drawNewHeatmap();
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
            const xUser = datas.find(e => e.id === newUserAxisValues[index]);
            const yUser = datas.find(e => e.id === newUserAxisValues[i]);
            if (i < index || xUser.community === yUser.community) {
              const xSize = datas.find(e => e.id === xUser.id).repliedArticle.length;
              const ySize = datas.find(e => e.id === yUser.id).repliedArticle.length;
              const bothReplied = getBothRepliedArticle(xUser, yUser);
              const bothSize = bothReplied.length;
              // user rect
              drawUserRect(nodes, index, i);

              // article similarity
              drawArticleSimilarity(d, nodes, index, i, xUser, yUser, bothSize);

              // author similarity
              // drawAuthorSimilarity(d, nodes, index, i, xUser, yUser, bothSize);

              // reply time
              drawNewReplyTimeWithQuantile(nodes, index, i, xUser, yUser, bothReplied);
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
          .attr('class', 'quantilePath')
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
              .attr('stroke-width', (q, step) => (step === 1 ? '3px' : '3px'))
              .attr('opacity', indY > indX ? 0 : 1);
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

      function averageReplyTime(usr, articleArr) {
        // const postYear = new Date(a.date).getFullYear();
        // const date = dateFormat(mes);
        // const commentTime = new Date(new Date(date).setFullYear(postYear));
        let sum = 0;
        articleArr.forEach((a) => {
          const postYear = new Date(a.date).getFullYear();
          const mes = a.messages.find(m => m.push_userid === usr.id);
          const date = dateFormat(mes);
          const commentTime = new Date(new Date(date).setFullYear(postYear));
          const diff = commentTime - new Date(a.date);
          // console.log(new Date(a.date), commentTime, diff);
          sum += diff;
        });
        const avg = sum / articleArr.length;
        return avg / 1000;
      }

      function getAllReplyTime(usr, articleArr) {
        // simArr.sort((a, b) => a - b);
        const arr = [];
        articleArr.forEach((a) => {
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
      numOfArtOfEachComunity.forEach((e) => {
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
        const groupRadial = radial.append('g')
          .attr('class', `group_${i}`);
        // const groupArtGroupHp = articleGroupHeatmap.append('g')
          // .attr('class', `group_${i}`);
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

      // draw article heatmap on the left side of the main heatMap
      // drawArticleGroupOfUserCommunity(articleGroupOfUserCommunity);

      function drawRelationRatio(index, userCount) {
        const communityIndexDatas = datas.filter(e => e.community === index);
        const communityIndexArticles = computeNumOfArticlesOfEachCommunity();
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
        // console.log('communityEachLevelCount', communityEachLevelCount);
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
          // const maxWidth_tem = (positionScale[nex_tem] - positionScale[tem]) * Math.sqrt(2);
          const maxWidth_tem = ((nex_tem - tem) * (maxSize + rectMargin) - rectMargin) * Math.sqrt(2);
          console.log('maxWidth_tem', nex_tem, tem, maxWidth_tem);
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
          // const maxWidth_tem = (positionScale[nex_tem] - positionScale[tem]) * Math.sqrt(2);
          const maxWidth_tem = ((nex_tem - tem) * (maxSize + rectMargin) - rectMargin) * Math.sqrt(2);
          const scale = d3.scaleLinear().domain([0, numOfArticles]).range([0, maxWidth_tem]);
          for (let k = 0; k < arr.length; k += 1) {
            groupRadial.append('g')
              .selectAll('path')
              .data(arr[i])
              .enter()
              .append('g')
              .each((d, index, nodes) => {
                if (k > 0) {
                  // blank area
                  d3.select(nodes[index])
                    .append('rect')
                    .attr('y', boxHeight * (k + 1) - boxHeight)
                    // .attr('x', (_d, _index) => positionScale[tem] * Math.sqrt(2) + d.position)
                    .attr('x', (_d, _index) => (tem * (maxSize + rectMargin)) * Math.sqrt(2) + d.position)
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
                      // return boxHeight * (k + 1) - heightScale(sameArticles.length);
                      return boxHeight - heightScale(sameArticles.length);
                      // return boxHeight * k;
                    })
                    .attr('x', (_d, _index) => (tem * (maxSize + rectMargin)) * Math.sqrt(2) + d.position)
                    // .attr('x', (_d, _index) => positionScale[tem] * Math.sqrt(2) + d.position)
                    .attr('height', (_d) => {
                      const heightScale = d3.scaleLinear().domain([0, d.level[0].length]).range([0, boxHeight]);
                      const sameArticles = d.level[0].filter(e => _d.some(e1 => e1.article_id === e.article_id));
                      return heightScale(sameArticles.length);
                    })
                    .attr('width', (_d) => {
                      const sameArticles = d.level[0].filter(e => d.level[0].some(e1 => e1.article_id === e.article_id));
                      return scale(sameArticles.length);
                    })
                    .attr('fill', (_d, _index) => colorArray[i](_index * 0.25))
                    // .attr('stroke', (_d, _index) => (_index === 0 ? 'black' : 'none'))
                    .on('click', (_d, _index, _nodes) => {
                      selectedArticles.splice(0, selectedArticles.length);
                      if (d3.select(_nodes[_index]).attr('stroke-width') === '10px') {
                        // already has been selected
                        groupRadial.selectAll('rect').attr('stroke-width', '1px');
                      } else {
                        groupRadial.selectAll('rect').attr('stroke-width', '1px');
                        d3.select(_nodes[_index]).attr('stroke-width', '10px');
                        articles.forEach((e) => {
                          if (_d.some(e1 => e1.article_id === e.article_id)) {
                            selectedArticles.push(e);
                          }
                        });
                      }
                      console.log('selectedArticles: ', selectedArticles);
                      console.log(_d);
                      rectClick(_d, i);
                    })
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
          // const maxWidth_tem = (positionScale[nex_tem] - positionScale[tem]) * Math.sqrt(2);
          // const maxWidth_tem = ((nex_tem - tem) * (maxSize + rectMargin)) * Math.sqrt(2);
          const maxWidth_tem = ((nex_tem - tem) * (maxSize + rectMargin) - rectMargin) * Math.sqrt(2);
          const scale = d3.scaleLinear().domain([0, numOfArticles]).range([0, maxWidth_tem]);
          let positionIndex = i;
          let diffAterSame = 0;
          for (let j = 0; j < arr.length; j += 1) {
            if (i !== j) {
              positionIndex += diffAterSame;
              diffAterSame = 0;
              const pIndex = positionIndex;
              const nex = comunityIndexY[j];
              const nex_nex = comunityIndexY[j + 1] ? comunityIndexY[j + 1] : positionScale.length - 1;
              const maxWidth_nex = ((nex_nex - nex) * (maxSize + rectMargin) - rectMargin) * Math.sqrt(2);
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
                      // return boxHeight + pIndex * 20;
                      // return boxHeight + i * 20;
                      const temCommunity = d.community;
                      const nextArticleCommunity = arr[j].find(e => e.community === temCommunity);
                      if (!nextArticleCommunity) return 0;
                      const heightScale = d3.scaleLinear().domain([0, nextArticleCommunity.level[0].length]).range([0, boxHeight]);
                      const sameArticles = nextArticleCommunity.level[0].filter(e => _d.some(e1 => e1.article_id === e.article_id));
                      // return boxHeight * (i + 1) - heightScale(sameArticles.length);
                      return boxHeight * (pIndex + 1) - heightScale(sameArticles.length);
                    })
                    .attr('x', (_d, _index) => {
                      const temCommunity = d.community;
                      const nexCommunity = arr[j].find(e => e.community === temCommunity);
                      if (nexCommunity) {
                        return (nex * (maxSize + rectMargin)) * Math.sqrt(2) + nexCommunity.position;
                      }
                      return (nex * (maxSize + rectMargin)) * Math.sqrt(2);
                    })
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
                    .attr('fill', (_d, _index) => colorArray[i](_index * 0.25))
                    .on('click', (_d, _index, _nodes, levelIndex) => {
                      const temCommunity = d.community;
                      const nextArticleCommunity = arr[j].find(e => e.community === temCommunity);
                      if (!nextArticleCommunity) return 0;
                      const sameArticles = nextArticleCommunity.level[0].filter(e => _d.some(e1 => e1.article_id === e.article_id));
                      selectedArticles.splice(0, selectedArticles.length);
                      if (d3.select(_nodes[_index]).attr('stroke-width') === '10px') {
                        // already has been selected
                        groupRadial.selectAll('rect').attr('stroke-width', '1px');
                      } else {
                        groupRadial.selectAll('rect').attr('stroke-width', '1px');
                        d3.select(_nodes[_index]).attr('stroke-width', '10px');
                        articles.forEach((e) => {
                          if (sameArticles.some(e1 => e1.article_id === e.article_id)) {
                            selectedArticles.push(e);
                          }
                        });
                      }
                      console.log('selectedArticles: ', selectedArticles);
                      console.log(sameArticles);
                      rectClick(sameArticles, i);
                      return 0;
                    });
                });
            } else {
              diffAterSame = 1;
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

      function drawNewCoClusterGraph(arr) {
        const boxHeight = 200;
        const maxHeight = 200;
        const intersectHeight = 10;
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
        drawArticleGroupLabel(radial);

        for (let i = 0; i < arr.length; i += 1) {
          // user Community i
          // const groupRadial = radial.select(`.group_${i}`);
          const groupRadial = radial;
          const tem = comunityIndexY[i];
          const nex_tem = comunityIndexY[i + 1] ? comunityIndexY[i + 1] : positionScale.length - 1;
          const numOfArticles = arr[i].reduce((acc, obj) => acc + obj.level[0].length, 0);
          // const maxWidth_tem = (positionScale[nex_tem] - positionScale[tem]) * Math.sqrt(2);
          const maxWidth_tem = ((nex_tem - tem) * (maxSize + rectMargin) - rectMargin) * Math.sqrt(2);
          const widthScale = d3.scaleLinear().domain([0, numOfArticles]).range([0, maxWidth_tem]);
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
          usrs.forEach((u) => {
            u.haveReplied = u.repliedArticle.filter(a => arts.some(_a => _a.article_id === a.article_id));
          });
        }
        function drawArticleGroupLabel(svgGroup) {
          svgGroup.append('g')
            .attr('class', 'article_group_label')
            .selectAll('path')
            .data(positionOfArticleCom)
            .enter()
            .append('text')
            .attr('x', -50)
            .attr('y', (d, index) => {
              const num = numOfArtOfEachComunity.find(e => e.community === d.community).articles.length;
              return d.position + scale(num) / 2;
            })
            .attr('dominant-baseline', 'central')
            .attr('font-size', (d) => {
              const num = numOfArtOfEachComunity.find(e => e.community === d.community).articles.length;
              return scale(num) / 2;
            })
            .attr('text-anchor', 'end');
          // .text((d, index) => `Group ${index + 1}`);
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
            .attr('height', (d) => {
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
                .attr('height', (_d) => {
                  const { articles: art } = numOfArtOfEachComunity.find(e => e.community === d.community);
                  return scale(art.length);
                })
                .attr('width', (_d) => {
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
                    articles.forEach((e) => {
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
                    .attr('width', (_d) => {
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
                    .attr('width', (_d) => {
                      if (!nextArticleCommunity) return 0;
                      const totalArticlesOfThisCommunityOfArticle = numOfArtOfEachComunity.find(e => e.community === nextArticleCommunity.community).articles;
                      const thisWidthScale = d3.scaleLinear().domain([0, totalArticlesOfThisCommunityOfArticle.length]).range([0, maxWidth_nex]);
                      const maxWidth = thisWidthScale(nextArticleCommunity.level[0].length);
                      const heightScale = d3.scaleLinear().domain([0, nextArticleCommunity.level[0].length]).range([0, maxWidth]);
                      const sameArticles = nextArticleCommunity.level[0].filter(e => _d.some(e1 => e1.article_id === e.article_id));
                      return heightScale(sameArticles.length);
                      // return heightScale(nextArticleCommunity.length);
                    })
                    .attr('fill', (_d, _index) => colorArray[tempCom](_index * 0.25))
                    .attr('stroke', 'black')
                    // .attr('stroke-width', '1px')
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
                        articles.forEach((e) => {
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
  function doTest() {
    const mat = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 0.2, 0.1, 0.1, 0.2, 0.1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 0.2, 0.1, 0.1, 0.2, 0.1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 0.2, 0.1, 0.1, 0.2, 0.1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 0.2, 0.1, 0.1, 0.2, 0.1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 0.2, 0.1, 0.1, 0.2, 0.1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 0.2, 0.1, 0.1, 0.2, 0.1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 0.2, 0.1, 0.1, 0.2, 0.1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 0.2, 0.1, 0.1, 0.2, 0.1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 0.2, 0.1, 0.1, 0.2, 0.1],
      [0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 0.2, 0.1, 1, 1, 1, 1, 1, 1, 1, 0.2, 0.1, 0.1, 0.2, 0.1],
      [0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 0.2, 0.1, 1, 1, 1, 1, 1, 1, 1, 0.2, 0.1, 0.1, 0.2, 0.1],
      [0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 0.2, 0.1, 1, 1, 1, 1, 1, 1, 1, 0.2, 0.1, 0.1, 0.2, 0.1],
      [0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 0.2, 0.1, 1, 1, 1, 1, 1, 1, 1, 0.2, 0.1, 0.1, 0.2, 0.1],
      [0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 0.2, 0.1, 1, 1, 1, 1, 1, 1, 1, 0.2, 0.1, 0.1, 0.2, 0.1],
      [0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 0.2, 0.1, 1, 1, 1, 1, 1, 1, 1, 0.2, 0.1, 0.1, 0.2, 0.1],
      [0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 0.2, 0.1, 1, 1, 1, 1, 1, 1, 1, 0.2, 0.1, 0.1, 0.2, 0.1],
      [0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 0.2, 0.1, 0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 1, 1, 1, 1, 1],
      [0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 0.2, 0.1, 0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 1, 1, 1, 1, 1],
      [0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 0.2, 0.1, 0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 1, 1, 1, 1, 1],
      [0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 0.2, 0.1, 0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 1, 1, 1, 1, 1],
      [0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 0.2, 0.1, 0.5, 0.5, 0.5, 0.3, 0.1, 0.6, 0.4, 1, 1, 1, 1, 1],

    ];
    const mul = 1;
    for (let i = 0; i < mat[0].length; i += 1) {
      for (let j = 0; j < mat[0].length; j += 1) {
        if (i < 9 && j < 9) mat[i][j] = { com: 1, value: Math.min(mat[i][j] * mul, 1) };
        else if ((i >= 9 && i < 16) && (j >= 9 && j < 16)) mat[i][j] = { com: 2, value: Math.min(mat[i][j] * mul, 1) };
        else if (i >= 16 && j >= 16) {
          mat[i][j] = { com: 3, value: Math.min(mat[i][j] * mul, 1) };
        } else {
          mat[i][j] = { com: 0, value: mat[i][j] / 2 };
        }
      }
    }
    for (let i = 0; i < mat[0].length; i += 1) {
      for (let j = 0; j < mat[0].length; j += 1) {
        if (i > j) mat[j][i] = mat[i][j];
      }
    }
    console.log(mat);

    const mat1 = [];
    for (let i = 0; i < 21; i += 1) {
      mat1.push([]);
      for (let j = 0; j < 21; j += 1) {
        mat1[i][j] = 0;
      }
    }

    // for (let i = 0; i < mat1[0].length; i += 1) {
    //   for (let j = 0; j < mat1[0].length; j += 1) {
    //     if (i < 9 && j < 9) {
    //       mat1[i][j] = { com: 1, value: Math.min(getRandomArbitrary(0.5 + (i / 20), 1), 1) };
    //     }
    //     else if ((i >= 9 && i < 16) && (j >= 9 && j < 16)) {
    //       mat1[i][j] = {com: 2, value: Math.min(getRandomArbitrary(0.5 + ((i - 9) / 20), 1), 1)}
    //     }
    //     else if (i >= 16 && j >= 16) {
    //       mat1[i][j] = {com: 3, value: Math.min(getRandomArbitrary(0.5 + ((i - 9) / 20), 1), 1)};
    //     } else {
    //       mat1[i][j] = {com: 0, value: getRandomArbitrary(0, 0.6)};
    //     }
    //   }
    // }

    // for (let i = 0; i < mat1[0].length; i += 1) {
    //   for (let j = 0; j < mat1[0].length; j += 1) {
    //     if (i < 9 && j < 9) {
    //       if ((i >= 0 && i < 3) && (j >= 0 && j < 3)) mat1[i][j] = { com: 1, value: 1 };
    //       else if ((i >= 3 && i < 6) && (j >= 3 && j < 6)) mat1[i][j] = { com: 1, value: 0.9 };
    //       else if ((i >= 6 && i < 9) && (j >= 6 && j < 9)) mat1[i][j] = { com: 1, value: 0.8 };
    //       else {
    //         mat1[i][j] = { com: 1, value: Math.min(getRandomArbitrary(0.5, 0.8), 1) };
    //       }
    //     }
    //     else if ((i >= 9 && i < 16) && (j >= 9 && j < 16)) {
    //       if ((i >= 9 && i < 12) && (j >= 9 && j < 12)) mat1[i][j] = { com: 2, value: 1 };
    //       else if ((i >= 12 && i < 14) && (j >= 12 && j < 14)) mat1[i][j] = { com: 2, value: 0.9 };
    //       else if ((i >= 14 && i < 16) && (j >= 14 && j < 16)) mat1[i][j] = { com: 2, value: 0.8 };
    //       else {
    //         mat1[i][j] = { com: 2, value: Math.min(getRandomArbitrary(0.5, 0.8), 1) };
    //       }
    //     }
    //     else if (i >= 16 && j >= 16) {
    //       if ((i >= 16 && i < 19) && (j >= 16 && j < 19)) mat1[i][j] = { com: 3, value: 1 };
    //       else if ((i >= 19 && i < 21) && (j >= 19 && j < 21)) mat1[i][j] = { com: 3, value: 0.9 };
    //       else mat1[i][j] = {com: 3, value: Math.min(getRandomArbitrary(0.5, 0.8), 1)};
    //     } else {
    //       mat1[i][j] = {com: 0, value: getRandomArbitrary(0, 0.6)};
    //     }
    //   }
    // }

    for (let i = 0; i < mat1[0].length; i += 1) {
      for (let j = 0; j < mat1[0].length; j += 1) {
        if (i < 9 && j < 9) {
          if ((i >= 0 && i < 5) && (j >= 0 && j < 5)) mat1[i][j] = { com: 1, value: getRandomArbitrary(0.95, 1) };
          else if ((i >= 5 && i < 7) && (j >= 0 && j < 7)) mat1[i][j] = { com: 1, value: getRandomArbitrary(0.7, 0.8) };
          else if ((i >= 7 && i < 9) && (j >= 0 && j < 9)) mat1[i][j] = { com: 1, value: getRandomArbitrary(0.6, 0.7) };
          else {
            mat1[i][j] = { com: 1, value: Math.min(getRandomArbitrary(0.5, 0.5), 1) };
          }
        } else if ((i >= 9 && i < 16) && (j >= 9 && j < 16)) {
          if ((i >= 9 && i < 14) && (j >= 9 && j < 14)) mat1[i][j] = { com: 2, value: getRandomArbitrary(0.95, 1) };
          else if ((i >= 14 && i < 15) && (j >= 9 && j < 15)) mat1[i][j] = { com: 2, value: getRandomArbitrary(0.7, 0.8) };
          else if ((i >= 14 && i < 16) && (j >= 9 && j < 16)) mat1[i][j] = { com: 2, value: getRandomArbitrary(0.6, 0.7) };
          else {
            mat1[i][j] = { com: 2, value: Math.min(getRandomArbitrary(0.5, 0.5), 1) };
          }
        } else if (i >= 16 && j >= 16) {
          if ((i >= 16 && i < 19) && (j >= 16 && j < 19)) mat1[i][j] = { com: 3, value: 1 };
          else if ((i >= 19 && i < 21) && (j >= 16 && j < 21)) mat1[i][j] = { com: 3, value: getRandomArbitrary(0.7, 0.9) };
          else mat1[i][j] = { com: 3, value: Math.min(getRandomArbitrary(0.5, 0.5), 1) };
        } else {
          mat1[i][j] = { com: 0, value: getRandomArbitrary(0, 0.6) };
        }
      }
    }

    for (let i = 0; i < mat1[0].length; i += 1) {
      for (let j = 0; j < mat1[0].length; j += 1) {
        if (i > j) mat1[j][i] = mat1[i][j];
        else if (i === j) mat1[j][i].value = 1;
      }
    }
    const randomMat = dp.testRandomMatrixReordering(mat1);
    const remat_pre = dp.testMatrixReordering(randomMat);
    const remat_pre2 = dp.testMatrixReordering(remat_pre);
    const remat = dp.testMatrixReordering(remat_pre2);
    // const remat = [
    //   [
    //     {
    //       "com": 2,
    //       "value": 1
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.995726129926699
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.8412276678734143
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.9830940961947067
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5055884526049018
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.7597685494037316
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3190604598027059
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.8769746361409565
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.7133466930565281
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.571975178846749
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.035050086134460964
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.15632259569704313
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.42844860072477076
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.037079817581737014
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.40003682943593316
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.004776537303605055
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.15435352732602164
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3544782161322371
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3105985917085075
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.2915317526873477
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.08294767880909916
    //     }
    //   ],
    //   [
    //     {
    //       "com": 2,
    //       "value": 0.995726129926699
    //     },
    //     {
    //       "com": 2,
    //       "value": 1
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.7630131031772656
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.7946190721190501
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.580261939563615
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.6588202777444021
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5171829040628119
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.6225685514184428
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.9374293357631063
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.33306086927581663
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.34959187765449845
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5675963217607876
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.4114570449421714
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.036787750705733965
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.06969964528004997
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5796539311910122
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.06725591488419495
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.44263912047253956
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.062269028632011156
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.4912977818487092
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.06027050433986089
    //     }
    //   ],
    //   [
    //     {
    //       "com": 2,
    //       "value": 0.8412276678734143
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.7630131031772656
    //     },
    //     {
    //       "com": 2,
    //       "value": 1
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.8071815951358584
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5256749456857482
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.7109732511185557
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.265230997474873
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.6213797937508801
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.5865794380420426
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.49420166060605125
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.29868772173131447
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3466767920400658
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.40049854051421496
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.18377183239837497
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.0015601539410743826
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.32036181262162533
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.24363028439579984
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.09688554147539494
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.23536808089758954
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.15636428476539233
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.08024767228549128
    //     }
    //   ],
    //   [
    //     {
    //       "com": 2,
    //       "value": 0.9830940961947067
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.7946190721190501
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.8071815951358584
    //     },
    //     {
    //       "com": 2,
    //       "value": 1
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5957398846312231
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.705145515941219
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.4460938573203435
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.5297247643362608
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.7872652442355569
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.09496549584074788
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.2103195420673285
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5246098479585874
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.42338068670929463
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5266434495163675
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5033237660691102
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3711613134462599
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3310854469837445
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.20324241167015544
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3114051440874189
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.013821411869539623
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.09999793732751656
    //     }
    //   ],
    //   [
    //     {
    //       "com": 0,
    //       "value": 0.5055884526049018
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.580261939563615
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5256749456857482
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5957398846312231
    //     },
    //     {
    //       "com": 3,
    //       "value": 1
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.08040270908658394
    //     },
    //     {
    //       "com": 3,
    //       "value": 0.6124020761468603
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.49949561561717815
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.21396708601153408
    //     },
    //     {
    //       "com": 3,
    //       "value": 0.7124762717317576
    //     },
    //     {
    //       "com": 3,
    //       "value": 0.8135221580355234
    //     },
    //     {
    //       "com": 3,
    //       "value": 0.6154258555750716
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.39946154713196597
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3865856276413535
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.09483367848387458
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.03835380146476854
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.28403993601132926
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.25097072782440155
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.21892469693327404
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.013263018628601752
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.25845893732391506
    //     }
    //   ],
    //   [
    //     {
    //       "com": 2,
    //       "value": 0.7597685494037316
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.6588202777444021
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.7109732511185557
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.705145515941219
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.08040270908658394
    //     },
    //     {
    //       "com": 2,
    //       "value": 1
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.09090621550947402
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.9700841813384186
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.844537699486125
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5236658457109414
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.406114666826998
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5890164268213637
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5662757039404259
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.49427871554918124
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3177595337968593
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3121342911041266
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.14546629501878142
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.048546466819855326
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5569625156122612
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.539976492987364
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.11557760745952551
    //     }
    //   ],
    //   [
    //     {
    //       "com": 0,
    //       "value": 0.3190604598027059
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5171829040628119
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.265230997474873
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.4460938573203435
    //     },
    //     {
    //       "com": 3,
    //       "value": 0.6124020761468603
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.09090621550947402
    //     },
    //     {
    //       "com": 3,
    //       "value": 1
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.41724620935692625
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5384092779777127
    //     },
    //     {
    //       "com": 3,
    //       "value": 0.8568989541590827
    //     },
    //     {
    //       "com": 3,
    //       "value": 0.5200179457263336
    //     },
    //     {
    //       "com": 3,
    //       "value": 0.9272366683034002
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.023109597060329622
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3065707033755502
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5694989038558087
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.08439376094132034
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.24396811006957353
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.00018010288598944158
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.2323005925079651
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.25622005370462836
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.14886215009876141
    //     }
    //   ],
    //   [
    //     {
    //       "com": 2,
    //       "value": 0.8769746361409565
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.6225685514184428
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.6213797937508801
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.5297247643362608
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.49949561561717815
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.9700841813384186
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.41724620935692625
    //     },
    //     {
    //       "com": 2,
    //       "value": 1
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.9915282600609353
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5916277424281867
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.38159089787632794
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.4229713153717114
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.2810473335663651
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.38017996943107096
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3031035212746319
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.49696225500426516
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.4506851517524399
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5942909612216662
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.13710852193849843
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5427381536183405
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3982464898981992
    //     }
    //   ],
    //   [
    //     {
    //       "com": 2,
    //       "value": 0.7133466930565281
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.9374293357631063
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.5865794380420426
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.7872652442355569
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.21396708601153408
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.844537699486125
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5384092779777127
    //     },
    //     {
    //       "com": 2,
    //       "value": 0.9915282600609353
    //     },
    //     {
    //       "com": 2,
    //       "value": 1
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.09209039551580363
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.27338010121770023
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.02648596987539844
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.4242452683348768
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5385828060583961
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.4634767810912424
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.18808352036708656
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.53278071893952
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.31831831794805304
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.28068593497035116
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.45294717194464823
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.2967486749405396
    //     }
    //   ],
    //   [
    //     {
    //       "com": 0,
    //       "value": 0.571975178846749
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.33306086927581663
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.49420166060605125
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.09496549584074788
    //     },
    //     {
    //       "com": 3,
    //       "value": 0.7124762717317576
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5236658457109414
    //     },
    //     {
    //       "com": 3,
    //       "value": 0.8568989541590827
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5916277424281867
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.09209039551580363
    //     },
    //     {
    //       "com": 3,
    //       "value": 1
    //     },
    //     {
    //       "com": 3,
    //       "value": 0.7590074957075679
    //     },
    //     {
    //       "com": 3,
    //       "value": 0.9108679639234167
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.21547919150171432
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.46088488076853223
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.10410354361908003
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.4158283721534721
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5796979211237824
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.16356130622898016
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.4992717881654293
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.2976714509819284
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.29899298272363145
    //     }
    //   ],
    //   [
    //     {
    //       "com": 0,
    //       "value": 0.035050086134460964
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.34959187765449845
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.29868772173131447
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.2103195420673285
    //     },
    //     {
    //       "com": 3,
    //       "value": 0.8135221580355234
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.406114666826998
    //     },
    //     {
    //       "com": 3,
    //       "value": 0.5200179457263336
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.38159089787632794
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.27338010121770023
    //     },
    //     {
    //       "com": 3,
    //       "value": 0.7590074957075679
    //     },
    //     {
    //       "com": 3,
    //       "value": 1
    //     },
    //     {
    //       "com": 3,
    //       "value": 0.5230269538236773
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5708090769705032
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.019806248384711855
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3737502318917284
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.06338927912332512
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.23512777773847135
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.08454733899134945
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.4621343714381831
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.13364885245267297
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.34987889044641934
    //     }
    //   ],
    //   [
    //     {
    //       "com": 0,
    //       "value": 0.15632259569704313
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5675963217607876
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3466767920400658
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5246098479585874
    //     },
    //     {
    //       "com": 3,
    //       "value": 0.6154258555750716
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5890164268213637
    //     },
    //     {
    //       "com": 3,
    //       "value": 0.9272366683034002
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.4229713153717114
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.02648596987539844
    //     },
    //     {
    //       "com": 3,
    //       "value": 0.9108679639234167
    //     },
    //     {
    //       "com": 3,
    //       "value": 0.5230269538236773
    //     },
    //     {
    //       "com": 3,
    //       "value": 1
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5781401686319377
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.23060120373573753
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.44857394893365493
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5685688508770097
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.4883059200268148
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3317950878076548
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3430393854009047
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5019001708690985
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.05072325507735753
    //     }
    //   ],
    //   [
    //     {
    //       "com": 0,
    //       "value": 0.42844860072477076
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.4114570449421714
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.40049854051421496
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.42338068670929463
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.39946154713196597
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5662757039404259
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.023109597060329622
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.2810473335663651
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.4242452683348768
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.21547919150171432
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5708090769705032
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5781401686319377
    //     },
    //     {
    //       "com": 1,
    //       "value": 1
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.5490772258244531
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.5313562064607599
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.575717164720828
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.6488827287353145
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.8362723114244875
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.68071575682579
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.9645164022563362
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.842693317804661
    //     }
    //   ],
    //   [
    //     {
    //       "com": 0,
    //       "value": 0.037079817581737014
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.036787750705733965
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.18377183239837497
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5266434495163675
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3865856276413535
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.49427871554918124
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3065707033755502
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.38017996943107096
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5385828060583961
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.46088488076853223
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.019806248384711855
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.23060120373573753
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.5490772258244531
    //     },
    //     {
    //       "com": 1,
    //       "value": 1
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7325664769193371
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7568365539390913
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.619710335601557
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.6762266758232935
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.8152249845718137
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.821440871848289
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7040150348999965
    //     }
    //   ],
    //   [
    //     {
    //       "com": 0,
    //       "value": 0.40003682943593316
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.06969964528004997
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.0015601539410743826
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5033237660691102
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.09483367848387458
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3177595337968593
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5694989038558087
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3031035212746319
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.4634767810912424
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.10410354361908003
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3737502318917284
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.44857394893365493
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.5313562064607599
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7325664769193371
    //     },
    //     {
    //       "com": 1,
    //       "value": 1
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7871026317694436
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7756453325645469
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.820974927243875
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.9978385085220477
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.663760675595651
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7146006848188624
    //     }
    //   ],
    //   [
    //     {
    //       "com": 0,
    //       "value": 0.004776537303605055
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5796539311910122
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.32036181262162533
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3711613134462599
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.03835380146476854
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3121342911041266
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.08439376094132034
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.49696225500426516
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.18808352036708656
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.4158283721534721
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.06338927912332512
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5685688508770097
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.575717164720828
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7568365539390913
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7871026317694436
    //     },
    //     {
    //       "com": 1,
    //       "value": 1
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7513893095450103
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7600647191640301
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.9014845614444981
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.9730698273691765
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7074033504949494
    //     }
    //   ],
    //   [
    //     {
    //       "com": 0,
    //       "value": 0.15435352732602164
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.06725591488419495
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.24363028439579984
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3310854469837445
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.28403993601132926
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.14546629501878142
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.24396811006957353
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.4506851517524399
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.53278071893952
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5796979211237824
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.23512777773847135
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.4883059200268148
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.6488827287353145
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.619710335601557
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7756453325645469
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7513893095450103
    //     },
    //     {
    //       "com": 1,
    //       "value": 1
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.9298415328888482
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.8455536189710329
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.9715044378864258
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7689494473774602
    //     }
    //   ],
    //   [
    //     {
    //       "com": 0,
    //       "value": 0.3544782161322371
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.44263912047253956
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.09688554147539494
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.20324241167015544
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.25097072782440155
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.048546466819855326
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.00018010288598944158
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5942909612216662
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.31831831794805304
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.16356130622898016
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.08454733899134945
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3317950878076548
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.8362723114244875
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.6762266758232935
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.820974927243875
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7600647191640301
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.9298415328888482
    //     },
    //     {
    //       "com": 1,
    //       "value": 1
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7440117298663671
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.8100815579479367
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.8264467309254467
    //     }
    //   ],
    //   [
    //     {
    //       "com": 0,
    //       "value": 0.3105985917085075
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.062269028632011156
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.23536808089758954
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3114051440874189
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.21892469693327404
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5569625156122612
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.2323005925079651
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.13710852193849843
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.28068593497035116
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.4992717881654293
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.4621343714381831
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3430393854009047
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.68071575682579
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.8152249845718137
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.9978385085220477
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.9014845614444981
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.8455536189710329
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7440117298663671
    //     },
    //     {
    //       "com": 1,
    //       "value": 1
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.9959208467496916
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7864434382164727
    //     }
    //   ],
    //   [
    //     {
    //       "com": 0,
    //       "value": 0.2915317526873477
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.4912977818487092
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.15636428476539233
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.013821411869539623
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.013263018628601752
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.539976492987364
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.25622005370462836
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5427381536183405
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.45294717194464823
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.2976714509819284
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.13364885245267297
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.5019001708690985
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.9645164022563362
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.821440871848289
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.663760675595651
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.9730698273691765
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.9715044378864258
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.8100815579479367
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.9959208467496916
    //     },
    //     {
    //       "com": 1,
    //       "value": 1
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7578164220961799
    //     }
    //   ],
    //   [
    //     {
    //       "com": 0,
    //       "value": 0.08294767880909916
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.06027050433986089
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.08024767228549128
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.09999793732751656
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.25845893732391506
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.11557760745952551
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.14886215009876141
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.3982464898981992
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.2967486749405396
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.29899298272363145
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.34987889044641934
    //     },
    //     {
    //       "com": 0,
    //       "value": 0.05072325507735753
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.842693317804661
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7040150348999965
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7146006848188624
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7074033504949494
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7689494473774602
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.8264467309254467
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7864434382164727
    //     },
    //     {
    //       "com": 1,
    //       "value": 0.7578164220961799
    //     },
    //     {
    //       "com": 1,
    //       "value": 1
    //     }
    //   ]
    // ]
    const random = [
      [
        {
          com: 1,
          value: 1,
        },
        {
          com: 0,
          value: 0.4302813718984438,
        },
        {
          com: 1,
          value: 0.6704319335146465,
        },
        {
          com: 0,
          value: 0.4274312441433005,
        },
        {
          com: 0,
          value: 0.28885585785555257,
        },
        {
          com: 1,
          value: 0.9793073357772102,
        },
        {
          com: 1,
          value: 0.9838943206959297,
        },
        {
          com: 1,
          value: 0.712998925514988,
        },
        {
          com: 0,
          value: 0.4440709070638372,
        },
        {
          com: 0,
          value: 0.01733857892061046,
        },
        {
          com: 0,
          value: 0.21354300530313255,
        },
        {
          com: 1,
          value: 0.6780640125095587,
        },
        {
          com: 0,
          value: 0.5304877613285571,
        },
        {
          com: 1,
          value: 0.7805839253532785,
        },
        {
          com: 0,
          value: 0.5014890036722373,
        },
        {
          com: 1,
          value: 0.9620008487146012,
        },
        {
          com: 0,
          value: 0.3323588741943031,
        },
        {
          com: 0,
          value: 0.57439070957112,
        },
        {
          com: 0,
          value: 0.1515992541635371,
        },
        {
          com: 1,
          value: 0.9844877904710154,
        },
        {
          com: 0,
          value: 0.4832944509490521,
        },
      ],
      [
        {
          com: 0,
          value: 0.4302813718984438,
        },
        {
          com: 2,
          value: 1,
        },
        {
          com: 0,
          value: 0.16628507918558313,
        },
        {
          com: 2,
          value: 0.7000833891517283,
        },
        {
          com: 2,
          value: 0.6918277971656696,
        },
        {
          com: 0,
          value: 0.46979746505552733,
        },
        {
          com: 0,
          value: 0.5416289138838677,
        },
        {
          com: 0,
          value: 0.5727226668432291,
        },
        {
          com: 2,
          value: 0.7294952051497557,
        },
        {
          com: 0,
          value: 0.36088423171859135,
        },
        {
          com: 2,
          value: 0.7803276945021504,
        },
        {
          com: 0,
          value: 0.08581411019276435,
        },
        {
          com: 2,
          value: 0.7647136273982043,
        },
        {
          com: 0,
          value: 0.21193691348954408,
        },
        {
          com: 0,
          value: 0.4579345204649987,
        },
        {
          com: 0,
          value: 0.41276373391808535,
        },
        {
          com: 0,
          value: 0.5211496957519924,
        },
        {
          com: 2,
          value: 0.7004369202645425,
        },
        {
          com: 0,
          value: 0.17274904464353055,
        },
        {
          com: 0,
          value: 0.2953499083994237,
        },
        {
          com: 0,
          value: 0.2740767714302525,
        },
      ],
      [
        {
          com: 1,
          value: 0.6704319335146465,
        },
        {
          com: 0,
          value: 0.16628507918558313,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 0,
          value: 0.31639732377432034,
        },
        {
          com: 0,
          value: 0.118631433841144,
        },
        {
          com: 1,
          value: 0.6111487943582662,
        },
        {
          com: 1,
          value: 0.6406105126216658,
        },
        {
          com: 1,
          value: 0.6065982218249649,
        },
        {
          com: 0,
          value: 0.0559472347747703,
        },
        {
          com: 0,
          value: 0.4239345453591677,
        },
        {
          com: 0,
          value: 0.0546755986011306,
        },
        {
          com: 1,
          value: 0.6436252361982031,
        },
        {
          com: 0,
          value: 0.03548186569026037,
        },
        {
          com: 1,
          value: 0.6774247827366625,
        },
        {
          com: 0,
          value: 0.06464968319827542,
        },
        {
          com: 1,
          value: 0.686215746121468,
        },
        {
          com: 0,
          value: 0.20240997594212365,
        },
        {
          com: 0,
          value: 0.31831969917042324,
        },
        {
          com: 0,
          value: 0.5494082580419617,
        },
        {
          com: 1,
          value: 0.6320647952528045,
        },
        {
          com: 0,
          value: 0.44340437193875826,
        },
      ],
      [
        {
          com: 0,
          value: 0.4274312441433005,
        },
        {
          com: 2,
          value: 0.7000833891517283,
        },
        {
          com: 0,
          value: 0.31639732377432034,
        },
        {
          com: 2,
          value: 1,
        },
        {
          com: 2,
          value: 0.6415382242575653,
        },
        {
          com: 0,
          value: 0.374339032376708,
        },
        {
          com: 0,
          value: 0.463021246076638,
        },
        {
          com: 0,
          value: 0.15172905481558754,
        },
        {
          com: 2,
          value: 0.9925287032873288,
        },
        {
          com: 0,
          value: 0.18418252403534469,
        },
        {
          com: 2,
          value: 0.9660200638088474,
        },
        {
          com: 0,
          value: 0.4510721468395074,
        },
        {
          com: 2,
          value: 0.9595877600437693,
        },
        {
          com: 0,
          value: 0.5754706408600923,
        },
        {
          com: 0,
          value: 0.48488185769937475,
        },
        {
          com: 0,
          value: 0.21213928580264882,
        },
        {
          com: 0,
          value: 0.3834399597251908,
        },
        {
          com: 2,
          value: 0.9796040137720046,
        },
        {
          com: 0,
          value: 0.26918028268809113,
        },
        {
          com: 0,
          value: 0.016107572395066015,
        },
        {
          com: 0,
          value: 0.07248311613412128,
        },
      ],
      [
        {
          com: 0,
          value: 0.28885585785555257,
        },
        {
          com: 2,
          value: 0.6918277971656696,
        },
        {
          com: 0,
          value: 0.118631433841144,
        },
        {
          com: 2,
          value: 0.6415382242575653,
        },
        {
          com: 2,
          value: 1,
        },
        {
          com: 0,
          value: 0.40836613584932363,
        },
        {
          com: 0,
          value: 0.17956884136789414,
        },
        {
          com: 0,
          value: 0.14779303946815706,
        },
        {
          com: 2,
          value: 0.6909850366081302,
        },
        {
          com: 0,
          value: 0.30451697884078255,
        },
        {
          com: 2,
          value: 0.6402466244044014,
        },
        {
          com: 0,
          value: 0.34997248729244934,
        },
        {
          com: 2,
          value: 0.650260657057246,
        },
        {
          com: 0,
          value: 0.38692414762389116,
        },
        {
          com: 0,
          value: 0.3795680131826813,
        },
        {
          com: 0,
          value: 0.30295002387537806,
        },
        {
          com: 0,
          value: 0.28025169603249483,
        },
        {
          com: 2,
          value: 0.69513582570644,
        },
        {
          com: 0,
          value: 0.31841295045439627,
        },
        {
          com: 0,
          value: 0.11399916865786376,
        },
        {
          com: 0,
          value: 0.5751399574246424,
        },
      ],
      [
        {
          com: 1,
          value: 0.9793073357772102,
        },
        {
          com: 0,
          value: 0.46979746505552733,
        },
        {
          com: 1,
          value: 0.6111487943582662,
        },
        {
          com: 0,
          value: 0.374339032376708,
        },
        {
          com: 0,
          value: 0.40836613584932363,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 0.9905731760235057,
        },
        {
          com: 1,
          value: 0.7779557796026211,
        },
        {
          com: 0,
          value: 0.2571493895263891,
        },
        {
          com: 0,
          value: 0.49474235963891555,
        },
        {
          com: 0,
          value: 0.3296160463193344,
        },
        {
          com: 1,
          value: 0.6587204439519443,
        },
        {
          com: 0,
          value: 0.5145852902884008,
        },
        {
          com: 1,
          value: 0.7166297846113852,
        },
        {
          com: 0,
          value: 0.2951568317259717,
        },
        {
          com: 1,
          value: 0.9977709009992196,
        },
        {
          com: 0,
          value: 0.0360553705978063,
        },
        {
          com: 0,
          value: 0.09424162111247147,
        },
        {
          com: 0,
          value: 0.029198630929865386,
        },
        {
          com: 1,
          value: 0.9840525958479017,
        },
        {
          com: 0,
          value: 0.03979421504969376,
        },
      ],
      [
        {
          com: 1,
          value: 0.9838943206959297,
        },
        {
          com: 0,
          value: 0.5416289138838677,
        },
        {
          com: 1,
          value: 0.6406105126216658,
        },
        {
          com: 0,
          value: 0.463021246076638,
        },
        {
          com: 0,
          value: 0.17956884136789414,
        },
        {
          com: 1,
          value: 0.9905731760235057,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 0.7004121611469898,
        },
        {
          com: 0,
          value: 0.3492818081551138,
        },
        {
          com: 0,
          value: 0.12038442734240715,
        },
        {
          com: 0,
          value: 0.18053232281635062,
        },
        {
          com: 1,
          value: 0.668003187863772,
        },
        {
          com: 0,
          value: 0.18521008677077702,
        },
        {
          com: 1,
          value: 0.74969787328211,
        },
        {
          com: 0,
          value: 0.51208024949083,
        },
        {
          com: 1,
          value: 0.9851689237639557,
        },
        {
          com: 0,
          value: 0.21404655790741178,
        },
        {
          com: 0,
          value: 0.5774447782064832,
        },
        {
          com: 0,
          value: 0.29355478258498,
        },
        {
          com: 1,
          value: 0.9513895008713835,
        },
        {
          com: 0,
          value: 0.5799071800763311,
        },
      ],
      [
        {
          com: 1,
          value: 0.712998925514988,
        },
        {
          com: 0,
          value: 0.5727226668432291,
        },
        {
          com: 1,
          value: 0.6065982218249649,
        },
        {
          com: 0,
          value: 0.15172905481558754,
        },
        {
          com: 0,
          value: 0.14779303946815706,
        },
        {
          com: 1,
          value: 0.7779557796026211,
        },
        {
          com: 1,
          value: 0.7004121611469898,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 0,
          value: 0.31720707836742057,
        },
        {
          com: 0,
          value: 0.14757127752526683,
        },
        {
          com: 0,
          value: 0.17893163932918113,
        },
        {
          com: 1,
          value: 0.6532652273109822,
        },
        {
          com: 0,
          value: 0.15369061217942973,
        },
        {
          com: 1,
          value: 0.7208195730317702,
        },
        {
          com: 0,
          value: 0.2784512263758024,
        },
        {
          com: 1,
          value: 0.7020449086411032,
        },
        {
          com: 0,
          value: 0.3160574152068511,
        },
        {
          com: 0,
          value: 0.041107757855170936,
        },
        {
          com: 0,
          value: 0.03400120484921158,
        },
        {
          com: 1,
          value: 0.7534213594200394,
        },
        {
          com: 0,
          value: 0.03507171433330991,
        },
      ],
      [
        {
          com: 0,
          value: 0.4440709070638372,
        },
        {
          com: 2,
          value: 0.7294952051497557,
        },
        {
          com: 0,
          value: 0.0559472347747703,
        },
        {
          com: 2,
          value: 0.9925287032873288,
        },
        {
          com: 2,
          value: 0.6909850366081302,
        },
        {
          com: 0,
          value: 0.2571493895263891,
        },
        {
          com: 0,
          value: 0.3492818081551138,
        },
        {
          com: 0,
          value: 0.31720707836742057,
        },
        {
          com: 2,
          value: 1,
        },
        {
          com: 0,
          value: 0.11358462521119898,
        },
        {
          com: 2,
          value: 0.9786694247712003,
        },
        {
          com: 0,
          value: 0.39370444984005487,
        },
        {
          com: 2,
          value: 0.9552071356430223,
        },
        {
          com: 0,
          value: 0.3598135651934422,
        },
        {
          com: 0,
          value: 0.27915718062844275,
        },
        {
          com: 0,
          value: 0.5709446466761627,
        },
        {
          com: 0,
          value: 0.06448709275978479,
        },
        {
          com: 2,
          value: 0.9619458298313928,
        },
        {
          com: 0,
          value: 0.30285694918186756,
        },
        {
          com: 0,
          value: 0.22134637052600017,
        },
        {
          com: 0,
          value: 0.23040177821734237,
        },
      ],
      [
        {
          com: 0,
          value: 0.01733857892061046,
        },
        {
          com: 0,
          value: 0.36088423171859135,
        },
        {
          com: 0,
          value: 0.4239345453591677,
        },
        {
          com: 0,
          value: 0.18418252403534469,
        },
        {
          com: 0,
          value: 0.30451697884078255,
        },
        {
          com: 0,
          value: 0.49474235963891555,
        },
        {
          com: 0,
          value: 0.12038442734240715,
        },
        {
          com: 0,
          value: 0.14757127752526683,
        },
        {
          com: 0,
          value: 0.11358462521119898,
        },
        {
          com: 3,
          value: 1,
        },
        {
          com: 0,
          value: 0.2923503639747692,
        },
        {
          com: 0,
          value: 0.3971279428652952,
        },
        {
          com: 0,
          value: 0.23464576116897307,
        },
        {
          com: 0,
          value: 0.03253476317489832,
        },
        {
          com: 3,
          value: 0.8335709520066037,
        },
        {
          com: 0,
          value: 0.24051194916766427,
        },
        {
          com: 3,
          value: 1,
        },
        {
          com: 0,
          value: 0.5458810788029261,
        },
        {
          com: 3,
          value: 1,
        },
        {
          com: 0,
          value: 0.46459043537081546,
        },
        {
          com: 3,
          value: 0.7337267796273246,
        },
      ],
      [
        {
          com: 0,
          value: 0.21354300530313255,
        },
        {
          com: 2,
          value: 0.7803276945021504,
        },
        {
          com: 0,
          value: 0.0546755986011306,
        },
        {
          com: 2,
          value: 0.9660200638088474,
        },
        {
          com: 2,
          value: 0.6402466244044014,
        },
        {
          com: 0,
          value: 0.3296160463193344,
        },
        {
          com: 0,
          value: 0.18053232281635062,
        },
        {
          com: 0,
          value: 0.17893163932918113,
        },
        {
          com: 2,
          value: 0.9786694247712003,
        },
        {
          com: 0,
          value: 0.2923503639747692,
        },
        {
          com: 2,
          value: 1,
        },
        {
          com: 0,
          value: 0.5927260824811869,
        },
        {
          com: 2,
          value: 0.9587999016962205,
        },
        {
          com: 0,
          value: 0.07246040611158518,
        },
        {
          com: 0,
          value: 0.016062639549016388,
        },
        {
          com: 0,
          value: 0.35392730931587435,
        },
        {
          com: 0,
          value: 0.3854819563952922,
        },
        {
          com: 2,
          value: 0.9504278721001371,
        },
        {
          com: 0,
          value: 0.2783227422855877,
        },
        {
          com: 0,
          value: 0.4262094772617071,
        },
        {
          com: 0,
          value: 0.1285105107208667,
        },
      ],
      [
        {
          com: 1,
          value: 0.6780640125095587,
        },
        {
          com: 0,
          value: 0.08581411019276435,
        },
        {
          com: 1,
          value: 0.6436252361982031,
        },
        {
          com: 0,
          value: 0.4510721468395074,
        },
        {
          com: 0,
          value: 0.34997248729244934,
        },
        {
          com: 1,
          value: 0.6587204439519443,
        },
        {
          com: 1,
          value: 0.668003187863772,
        },
        {
          com: 1,
          value: 0.6532652273109822,
        },
        {
          com: 0,
          value: 0.39370444984005487,
        },
        {
          com: 0,
          value: 0.3971279428652952,
        },
        {
          com: 0,
          value: 0.5927260824811869,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 0,
          value: 0.019865094339557077,
        },
        {
          com: 1,
          value: 0.655654482133707,
        },
        {
          com: 0,
          value: 0.23149101768572702,
        },
        {
          com: 1,
          value: 0.6889207388851366,
        },
        {
          com: 0,
          value: 0.4634291281667471,
        },
        {
          com: 0,
          value: 0.1630149815179661,
        },
        {
          com: 0,
          value: 0.3181292763139884,
        },
        {
          com: 1,
          value: 0.6316671490949906,
        },
        {
          com: 0,
          value: 0.4734693052228483,
        },
      ],
      [
        {
          com: 0,
          value: 0.5304877613285571,
        },
        {
          com: 2,
          value: 0.7647136273982043,
        },
        {
          com: 0,
          value: 0.03548186569026037,
        },
        {
          com: 2,
          value: 0.9595877600437693,
        },
        {
          com: 2,
          value: 0.650260657057246,
        },
        {
          com: 0,
          value: 0.5145852902884008,
        },
        {
          com: 0,
          value: 0.18521008677077702,
        },
        {
          com: 0,
          value: 0.15369061217942973,
        },
        {
          com: 2,
          value: 0.9552071356430223,
        },
        {
          com: 0,
          value: 0.23464576116897307,
        },
        {
          com: 2,
          value: 0.9587999016962205,
        },
        {
          com: 0,
          value: 0.019865094339557077,
        },
        {
          com: 2,
          value: 1,
        },
        {
          com: 0,
          value: 0.07796543145200596,
        },
        {
          com: 0,
          value: 0.11823854101718227,
        },
        {
          com: 0,
          value: 0.20967072269092218,
        },
        {
          com: 0,
          value: 0.20773460227182666,
        },
        {
          com: 2,
          value: 0.978789730404256,
        },
        {
          com: 0,
          value: 0.5919728306953677,
        },
        {
          com: 0,
          value: 0.5162735150077128,
        },
        {
          com: 0,
          value: 0.004202473110855509,
        },
      ],
      [
        {
          com: 1,
          value: 0.7805839253532785,
        },
        {
          com: 0,
          value: 0.21193691348954408,
        },
        {
          com: 1,
          value: 0.6774247827366625,
        },
        {
          com: 0,
          value: 0.5754706408600923,
        },
        {
          com: 0,
          value: 0.38692414762389116,
        },
        {
          com: 1,
          value: 0.7166297846113852,
        },
        {
          com: 1,
          value: 0.74969787328211,
        },
        {
          com: 1,
          value: 0.7208195730317702,
        },
        {
          com: 0,
          value: 0.3598135651934422,
        },
        {
          com: 0,
          value: 0.03253476317489832,
        },
        {
          com: 0,
          value: 0.07246040611158518,
        },
        {
          com: 1,
          value: 0.655654482133707,
        },
        {
          com: 0,
          value: 0.07796543145200596,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 0,
          value: 0.28222946299767393,
        },
        {
          com: 1,
          value: 0.7142845685439907,
        },
        {
          com: 0,
          value: 0.15482297848658497,
        },
        {
          com: 0,
          value: 0.23215524245732871,
        },
        {
          com: 0,
          value: 0.4751022416580436,
        },
        {
          com: 1,
          value: 0.7646359355041064,
        },
        {
          com: 0,
          value: 0.516790082685222,
        },
      ],
      [
        {
          com: 0,
          value: 0.5014890036722373,
        },
        {
          com: 0,
          value: 0.4579345204649987,
        },
        {
          com: 0,
          value: 0.06464968319827542,
        },
        {
          com: 0,
          value: 0.48488185769937475,
        },
        {
          com: 0,
          value: 0.3795680131826813,
        },
        {
          com: 0,
          value: 0.2951568317259717,
        },
        {
          com: 0,
          value: 0.51208024949083,
        },
        {
          com: 0,
          value: 0.2784512263758024,
        },
        {
          com: 0,
          value: 0.27915718062844275,
        },
        {
          com: 3,
          value: 0.8335709520066037,
        },
        {
          com: 0,
          value: 0.016062639549016388,
        },
        {
          com: 0,
          value: 0.23149101768572702,
        },
        {
          com: 0,
          value: 0.11823854101718227,
        },
        {
          com: 0,
          value: 0.28222946299767393,
        },
        {
          com: 3,
          value: 1,
        },
        {
          com: 0,
          value: 0.14554920696714715,
        },
        {
          com: 3,
          value: 0.806699884272933,
        },
        {
          com: 0,
          value: 0.05293474700240459,
        },
        {
          com: 3,
          value: 0.7153565214728528,
        },
        {
          com: 0,
          value: 0.5536613177898603,
        },
        {
          com: 3,
          value: 0.7281112604543061,
        },
      ],
      [
        {
          com: 1,
          value: 0.9620008487146012,
        },
        {
          com: 0,
          value: 0.41276373391808535,
        },
        {
          com: 1,
          value: 0.686215746121468,
        },
        {
          com: 0,
          value: 0.21213928580264882,
        },
        {
          com: 0,
          value: 0.30295002387537806,
        },
        {
          com: 1,
          value: 0.9977709009992196,
        },
        {
          com: 1,
          value: 0.9851689237639557,
        },
        {
          com: 1,
          value: 0.7020449086411032,
        },
        {
          com: 0,
          value: 0.5709446466761627,
        },
        {
          com: 0,
          value: 0.24051194916766427,
        },
        {
          com: 0,
          value: 0.35392730931587435,
        },
        {
          com: 1,
          value: 0.6889207388851366,
        },
        {
          com: 0,
          value: 0.20967072269092218,
        },
        {
          com: 1,
          value: 0.7142845685439907,
        },
        {
          com: 0,
          value: 0.14554920696714715,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 0,
          value: 0.47294221836546396,
        },
        {
          com: 0,
          value: 0.3066450925464064,
        },
        {
          com: 0,
          value: 0.009262733314171179,
        },
        {
          com: 1,
          value: 0.9574947228269575,
        },
        {
          com: 0,
          value: 0.34707867884717886,
        },
      ],
      [
        {
          com: 0,
          value: 0.3323588741943031,
        },
        {
          com: 0,
          value: 0.5211496957519924,
        },
        {
          com: 0,
          value: 0.20240997594212365,
        },
        {
          com: 0,
          value: 0.3834399597251908,
        },
        {
          com: 0,
          value: 0.28025169603249483,
        },
        {
          com: 0,
          value: 0.0360553705978063,
        },
        {
          com: 0,
          value: 0.21404655790741178,
        },
        {
          com: 0,
          value: 0.3160574152068511,
        },
        {
          com: 0,
          value: 0.06448709275978479,
        },
        {
          com: 3,
          value: 1,
        },
        {
          com: 0,
          value: 0.3854819563952922,
        },
        {
          com: 0,
          value: 0.4634291281667471,
        },
        {
          com: 0,
          value: 0.20773460227182666,
        },
        {
          com: 0,
          value: 0.15482297848658497,
        },
        {
          com: 3,
          value: 0.806699884272933,
        },
        {
          com: 0,
          value: 0.47294221836546396,
        },
        {
          com: 3,
          value: 1,
        },
        {
          com: 0,
          value: 0.06362466799835444,
        },
        {
          com: 3,
          value: 1,
        },
        {
          com: 0,
          value: 0.5360138224776471,
        },
        {
          com: 3,
          value: 0.8534572864080539,
        },
      ],
      [
        {
          com: 0,
          value: 0.57439070957112,
        },
        {
          com: 2,
          value: 0.7004369202645425,
        },
        {
          com: 0,
          value: 0.31831969917042324,
        },
        {
          com: 2,
          value: 0.9796040137720046,
        },
        {
          com: 2,
          value: 0.69513582570644,
        },
        {
          com: 0,
          value: 0.09424162111247147,
        },
        {
          com: 0,
          value: 0.5774447782064832,
        },
        {
          com: 0,
          value: 0.041107757855170936,
        },
        {
          com: 2,
          value: 0.9619458298313928,
        },
        {
          com: 0,
          value: 0.5458810788029261,
        },
        {
          com: 2,
          value: 0.9504278721001371,
        },
        {
          com: 0,
          value: 0.1630149815179661,
        },
        {
          com: 2,
          value: 0.978789730404256,
        },
        {
          com: 0,
          value: 0.23215524245732871,
        },
        {
          com: 0,
          value: 0.05293474700240459,
        },
        {
          com: 0,
          value: 0.3066450925464064,
        },
        {
          com: 0,
          value: 0.06362466799835444,
        },
        {
          com: 2,
          value: 1,
        },
        {
          com: 0,
          value: 0.2876964248398442,
        },
        {
          com: 0,
          value: 0.5831320630152079,
        },
        {
          com: 0,
          value: 0.5445695927636868,
        },
      ],
      [
        {
          com: 0,
          value: 0.1515992541635371,
        },
        {
          com: 0,
          value: 0.17274904464353055,
        },
        {
          com: 0,
          value: 0.5494082580419617,
        },
        {
          com: 0,
          value: 0.26918028268809113,
        },
        {
          com: 0,
          value: 0.31841295045439627,
        },
        {
          com: 0,
          value: 0.029198630929865386,
        },
        {
          com: 0,
          value: 0.29355478258498,
        },
        {
          com: 0,
          value: 0.03400120484921158,
        },
        {
          com: 0,
          value: 0.30285694918186756,
        },
        {
          com: 3,
          value: 1,
        },
        {
          com: 0,
          value: 0.2783227422855877,
        },
        {
          com: 0,
          value: 0.3181292763139884,
        },
        {
          com: 0,
          value: 0.5919728306953677,
        },
        {
          com: 0,
          value: 0.4751022416580436,
        },
        {
          com: 3,
          value: 0.7153565214728528,
        },
        {
          com: 0,
          value: 0.009262733314171179,
        },
        {
          com: 3,
          value: 1,
        },
        {
          com: 0,
          value: 0.2876964248398442,
        },
        {
          com: 3,
          value: 1,
        },
        {
          com: 0,
          value: 0.005412576696464733,
        },
        {
          com: 3,
          value: 0.8564768112313015,
        },
      ],
      [
        {
          com: 1,
          value: 0.9844877904710154,
        },
        {
          com: 0,
          value: 0.2953499083994237,
        },
        {
          com: 1,
          value: 0.6320647952528045,
        },
        {
          com: 0,
          value: 0.016107572395066015,
        },
        {
          com: 0,
          value: 0.11399916865786376,
        },
        {
          com: 1,
          value: 0.9840525958479017,
        },
        {
          com: 1,
          value: 0.9513895008713835,
        },
        {
          com: 1,
          value: 0.7534213594200394,
        },
        {
          com: 0,
          value: 0.22134637052600017,
        },
        {
          com: 0,
          value: 0.46459043537081546,
        },
        {
          com: 0,
          value: 0.4262094772617071,
        },
        {
          com: 1,
          value: 0.6316671490949906,
        },
        {
          com: 0,
          value: 0.5162735150077128,
        },
        {
          com: 1,
          value: 0.7646359355041064,
        },
        {
          com: 0,
          value: 0.5536613177898603,
        },
        {
          com: 1,
          value: 0.9574947228269575,
        },
        {
          com: 0,
          value: 0.5360138224776471,
        },
        {
          com: 0,
          value: 0.5831320630152079,
        },
        {
          com: 0,
          value: 0.005412576696464733,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 0,
          value: 0.5152052893613951,
        },
      ],
      [
        {
          com: 0,
          value: 0.4832944509490521,
        },
        {
          com: 0,
          value: 0.2740767714302525,
        },
        {
          com: 0,
          value: 0.44340437193875826,
        },
        {
          com: 0,
          value: 0.07248311613412128,
        },
        {
          com: 0,
          value: 0.5751399574246424,
        },
        {
          com: 0,
          value: 0.03979421504969376,
        },
        {
          com: 0,
          value: 0.5799071800763311,
        },
        {
          com: 0,
          value: 0.03507171433330991,
        },
        {
          com: 0,
          value: 0.23040177821734237,
        },
        {
          com: 3,
          value: 0.7337267796273246,
        },
        {
          com: 0,
          value: 0.1285105107208667,
        },
        {
          com: 0,
          value: 0.4734693052228483,
        },
        {
          com: 0,
          value: 0.004202473110855509,
        },
        {
          com: 0,
          value: 0.516790082685222,
        },
        {
          com: 3,
          value: 0.7281112604543061,
        },
        {
          com: 0,
          value: 0.34707867884717886,
        },
        {
          com: 3,
          value: 0.8534572864080539,
        },
        {
          com: 0,
          value: 0.5445695927636868,
        },
        {
          com: 3,
          value: 0.8564768112313015,
        },
        {
          com: 0,
          value: 0.5152052893613951,
        },
        {
          com: 3,
          value: 1,
        },
      ],
    ];
    // const random2 = dp.testRandomMatrixReordering(random);
    const comMat = dp.testMatrixReorderingByCommunity(remat);
    const comMat2 = dp.testMatrixReorderingByCommunity(random);
    console.log('remat', remat);
    console.log('randomMat', randomMat);
    // console.log('random2', random2);
    console.log('comMat', comMat);
    console.log('comMat2', comMat2);
    function getRandomArbitrary(min, max) {
      return Math.random() * (max - min) + min;
    }
  }
  function doTest2() {
    const mat = [
      [
        1,
        0.6,
        0.42857142857142855,
        0.5,
        0.5,
        0.6,
        0.6,
        0.6,
        0.6,
        0.6,
        0.6,
        0.6,
        0.08333333333333333,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.125,
        0.125,
        0.1,
        0.07692307692307693,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.125,
      ],
      [
        0.6,
        1,
        0.42857142857142855,
        0.5,
        0.5,
        0.6,
        0.6,
        0.6,
        0.6,
        0.6,
        0.6,
        0.6,
        0.08333333333333333,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.125,
        0.125,
        0.1,
        0.07692307692307693,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.125,
      ],
      [
        0.42857142857142855,
        0.42857142857142855,
        1,
        0.8333333333333334,
        0.8333333333333334,
        0.6666666666666666,
        0.6666666666666666,
        0.6666666666666666,
        0.6666666666666666,
        0.6666666666666666,
        0.6666666666666666,
        0.6666666666666666,
        0.07142857142857142,
        0.1,
        0.1111111111111111,
        0.1111111111111111,
        0.1,
        0.1,
        0.08333333333333333,
        0.06666666666666667,
        0.1,
        0.1111111111111111,
        0.1111111111111111,
        0.2222222222222222,
      ],
      [
        0.5,
        0.5,
        0.8333333333333334,
        1,
        1,
        0.8,
        0.8,
        0.8,
        0.8,
        0.8,
        0.8,
        0.8,
        0.07692307692307693,
        0.1111111111111111,
        0.125,
        0.125,
        0.1111111111111111,
        0.1111111111111111,
        0.09090909090909091,
        0.07142857142857142,
        0.1111111111111111,
        0.125,
        0.125,
        0.25,
      ],
      [
        0.5,
        0.5,
        0.8333333333333334,
        1,
        1,
        0.8,
        0.8,
        0.8,
        0.8,
        0.8,
        0.8,
        0.8,
        0.07692307692307693,
        0.1111111111111111,
        0.125,
        0.125,
        0.1111111111111111,
        0.1111111111111111,
        0.09090909090909091,
        0.07142857142857142,
        0.1111111111111111,
        0.125,
        0.125,
        0.25,
      ],
      [
        0.6,
        0.6,
        0.6666666666666666,
        0.8,
        0.8,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0.08333333333333333,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.125,
        0.125,
        0.1,
        0.07692307692307693,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.125,
      ],
      [
        0.6,
        0.6,
        0.6666666666666666,
        0.8,
        0.8,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0.08333333333333333,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.125,
        0.125,
        0.1,
        0.07692307692307693,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.125,
      ],
      [
        0.6,
        0.6,
        0.6666666666666666,
        0.8,
        0.8,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0.08333333333333333,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.125,
        0.125,
        0.1,
        0.07692307692307693,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.125,
      ],
      [
        0.6,
        0.6,
        0.6666666666666666,
        0.8,
        0.8,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0.08333333333333333,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.125,
        0.125,
        0.1,
        0.07692307692307693,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.125,
      ],
      [
        0.6,
        0.6,
        0.6666666666666666,
        0.8,
        0.8,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0.08333333333333333,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.125,
        0.125,
        0.1,
        0.07692307692307693,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.125,
      ],
      [
        0.6,
        0.6,
        0.6666666666666666,
        0.8,
        0.8,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0.08333333333333333,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.125,
        0.125,
        0.1,
        0.07692307692307693,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.125,
      ],
      [
        0.6,
        0.6,
        0.6666666666666666,
        0.8,
        0.8,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0.08333333333333333,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.125,
        0.125,
        0.1,
        0.07692307692307693,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.125,
      ],
      [
        0.08333333333333333,
        0.08333333333333333,
        0.07142857142857142,
        0.07692307692307693,
        0.07692307692307693,
        0.08333333333333333,
        0.08333333333333333,
        0.08333333333333333,
        0.08333333333333333,
        0.08333333333333333,
        0.08333333333333333,
        0.08333333333333333,
        1,
        0.4,
        0.3,
        0.08333333333333333,
        0.07692307692307693,
        0.07692307692307693,
        0.14285714285714285,
        0.05555555555555555,
        0.07692307692307693,
        0.18181818181818182,
        0.08333333333333333,
        0.07692307692307693,
      ],
      [
        0.125,
        0.125,
        0.1,
        0.1111111111111111,
        0.1111111111111111,
        0.125,
        0.125,
        0.125,
        0.125,
        0.125,
        0.125,
        0.125,
        0.4,
        1,
        0.2857142857142857,
        0.2857142857142857,
        0.1111111111111111,
        0.1111111111111111,
        0.2,
        0.07142857142857142,
        0.25,
        0.125,
        0.125,
        0.1111111111111111,
      ],
      [
        0.14285714285714285,
        0.14285714285714285,
        0.1111111111111111,
        0.125,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.14285714285714285,
        0.14285714285714285,
        0.14285714285714285,
        0.14285714285714285,
        0.14285714285714285,
        0.3,
        0.2857142857142857,
        1,
        0.3333333333333333,
        0.125,
        0.125,
        0.2222222222222222,
        0.16666666666666666,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.125,
      ],
      [
        0.14285714285714285,
        0.14285714285714285,
        0.1111111111111111,
        0.125,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.14285714285714285,
        0.14285714285714285,
        0.14285714285714285,
        0.14285714285714285,
        0.14285714285714285,
        0.08333333333333333,
        0.2857142857142857,
        0.3333333333333333,
        1,
        0.125,
        0.125,
        0.1,
        0.16666666666666666,
        0.2857142857142857,
        0.14285714285714285,
        0.14285714285714285,
        0.125,
      ],
      [
        0.125,
        0.125,
        0.1,
        0.1111111111111111,
        0.1111111111111111,
        0.125,
        0.125,
        0.125,
        0.125,
        0.125,
        0.125,
        0.125,
        0.07692307692307693,
        0.1111111111111111,
        0.125,
        0.125,
        1,
        0.1111111111111111,
        0.09090909090909091,
        0.07142857142857142,
        0.1111111111111111,
        0.125,
        0.125,
        0.1111111111111111,
      ],
      [
        0.125,
        0.125,
        0.1,
        0.1111111111111111,
        0.1111111111111111,
        0.125,
        0.125,
        0.125,
        0.125,
        0.125,
        0.125,
        0.125,
        0.07692307692307693,
        0.1111111111111111,
        0.125,
        0.125,
        0.1111111111111111,
        1,
        0.09090909090909091,
        0.07142857142857142,
        0.1111111111111111,
        0.125,
        0.125,
        0.1111111111111111,
      ],
      [
        0.1,
        0.1,
        0.08333333333333333,
        0.09090909090909091,
        0.09090909090909091,
        0.1,
        0.1,
        0.1,
        0.1,
        0.1,
        0.1,
        0.1,
        0.14285714285714285,
        0.2,
        0.2222222222222222,
        0.1,
        0.09090909090909091,
        0.09090909090909091,
        1,
        0.4166666666666667,
        0.3333333333333333,
        0.375,
        0.1,
        0.09090909090909091,
      ],
      [
        0.07692307692307693,
        0.07692307692307693,
        0.06666666666666667,
        0.07142857142857142,
        0.07142857142857142,
        0.07692307692307693,
        0.07692307692307693,
        0.07692307692307693,
        0.07692307692307693,
        0.07692307692307693,
        0.07692307692307693,
        0.07692307692307693,
        0.05555555555555555,
        0.07142857142857142,
        0.16666666666666666,
        0.16666666666666666,
        0.07142857142857142,
        0.07142857142857142,
        0.4166666666666667,
        1,
        0.25,
        0.2727272727272727,
        0.07692307692307693,
        0.07142857142857142,
      ],
      [
        0.125,
        0.125,
        0.1,
        0.1111111111111111,
        0.1111111111111111,
        0.125,
        0.125,
        0.125,
        0.125,
        0.125,
        0.125,
        0.125,
        0.07692307692307693,
        0.25,
        0.125,
        0.2857142857142857,
        0.1111111111111111,
        0.1111111111111111,
        0.3333333333333333,
        0.25,
        1,
        0.5,
        0.125,
        0.1111111111111111,
      ],
      [
        0.14285714285714285,
        0.14285714285714285,
        0.1111111111111111,
        0.125,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.14285714285714285,
        0.14285714285714285,
        0.14285714285714285,
        0.14285714285714285,
        0.14285714285714285,
        0.18181818181818182,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.125,
        0.125,
        0.375,
        0.2727272727272727,
        0.5,
        1,
        0.14285714285714285,
        0.125,
      ],
      [
        0.14285714285714285,
        0.14285714285714285,
        0.1111111111111111,
        0.125,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.14285714285714285,
        0.14285714285714285,
        0.14285714285714285,
        0.14285714285714285,
        0.14285714285714285,
        0.08333333333333333,
        0.125,
        0.14285714285714285,
        0.14285714285714285,
        0.125,
        0.125,
        0.1,
        0.07692307692307693,
        0.125,
        0.14285714285714285,
        1,
        0.5,
      ],
      [
        0.125,
        0.125,
        0.2222222222222222,
        0.25,
        0.25,
        0.125,
        0.125,
        0.125,
        0.125,
        0.125,
        0.125,
        0.125,
        0.07692307692307693,
        0.1111111111111111,
        0.125,
        0.125,
        0.1111111111111111,
        0.1111111111111111,
        0.09090909090909091,
        0.07142857142857142,
        0.1111111111111111,
        0.125,
        0.5,
        1,
      ],
    ];
    const mul = 1;
    for (let i = 0; i < mat[0].length; i += 1) {
      for (let j = 0; j < mat[0].length; j += 1) {
        if (i < 12 && j < 12) mat[i][j] = { com: 1, value: Math.min(mat[i][j] * mul, 1) };
        else if ((i >= 12 && i < 18) && (j >= 12 && j < 18)) mat[i][j] = { com: 2, value: Math.min(mat[i][j] * mul, 1) };
        else if ((i >= 18 && i < 22) && (j >= 18 && j < 22)) mat[i][j] = { com: 3, value: Math.min(mat[i][j] * mul, 1) };
        else if (i >= 22 && j >= 22) mat[i][j] = { com: 4, value: Math.min(mat[i][j] * mul, 1) };
        else {
          mat[i][j] = { com: 0, value: mat[i][j] / 2 };
        }
      }
    }
    for (let i = 0; i < mat[0].length; i += 1) {
      for (let j = 0; j < mat[0].length; j += 1) {
        if (i > j) mat[j][i] = mat[i][j];
      }
    }
    console.log(mat);

    // const randomMat = dp.testRandomMatrixReordering(mat);
    const remat = dp.testMatrixReordering(mat);
    // const remat_pre2 = dp.testMatrixReordering(remat_pre);
    // const remat = dp.testMatrixReordering(remat_pre2);
    const random = [
      [
        {
          com: 3,
          value: 1,
        },
        {
          com: 3,
          value: 0.4166666666666667,
        },
        {
          com: 3,
          value: 0.3333333333333333,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.2,
        },
        {
          com: 3,
          value: 0.375,
        },
        {
          com: 0,
          value: 0.2222222222222222,
        },
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.09090909090909091,
        },
        {
          com: 0,
          value: 0.09090909090909091,
        },
        {
          com: 0,
          value: 0.09090909090909091,
        },
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.08333333333333333,
        },
        {
          com: 0,
          value: 0.09090909090909091,
        },
        {
          com: 0,
          value: 0.09090909090909091,
        },
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.1,
        },
      ],
      [
        {
          com: 3,
          value: 0.4166666666666667,
        },
        {
          com: 3,
          value: 1,
        },
        {
          com: 3,
          value: 0.25,
        },
        {
          com: 0,
          value: 0.05555555555555555,
        },
        {
          com: 0,
          value: 0.07142857142857142,
        },
        {
          com: 3,
          value: 0.2727272727272727,
        },
        {
          com: 0,
          value: 0.16666666666666666,
        },
        {
          com: 0,
          value: 0.16666666666666666,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.07142857142857142,
        },
        {
          com: 0,
          value: 0.07142857142857142,
        },
        {
          com: 0,
          value: 0.07142857142857142,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.06666666666666667,
        },
        {
          com: 0,
          value: 0.07142857142857142,
        },
        {
          com: 0,
          value: 0.07142857142857142,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
      ],
      [
        {
          com: 3,
          value: 0.3333333333333333,
        },
        {
          com: 3,
          value: 0.25,
        },
        {
          com: 3,
          value: 1,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.25,
        },
        {
          com: 3,
          value: 0.5,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.2857142857142857,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
      ],
      [
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.05555555555555555,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 2,
          value: 1,
        },
        {
          com: 2,
          value: 0.4,
        },
        {
          com: 0,
          value: 0.18181818181818182,
        },
        {
          com: 2,
          value: 0.3,
        },
        {
          com: 2,
          value: 0.08333333333333333,
        },
        {
          com: 0,
          value: 0.08333333333333333,
        },
        {
          com: 2,
          value: 0.07692307692307693,
        },
        {
          com: 2,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.08333333333333333,
        },
        {
          com: 0,
          value: 0.08333333333333333,
        },
        {
          com: 0,
          value: 0.07142857142857142,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.08333333333333333,
        },
        {
          com: 0,
          value: 0.08333333333333333,
        },
        {
          com: 0,
          value: 0.08333333333333333,
        },
        {
          com: 0,
          value: 0.08333333333333333,
        },
        {
          com: 0,
          value: 0.08333333333333333,
        },
        {
          com: 0,
          value: 0.08333333333333333,
        },
        {
          com: 0,
          value: 0.08333333333333333,
        },
      ],
      [
        {
          com: 0,
          value: 0.2,
        },
        {
          com: 0,
          value: 0.07142857142857142,
        },
        {
          com: 0,
          value: 0.25,
        },
        {
          com: 2,
          value: 0.4,
        },
        {
          com: 2,
          value: 1,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 2,
          value: 0.2857142857142857,
        },
        {
          com: 2,
          value: 0.2857142857142857,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 2,
          value: 0.1111111111111111,
        },
        {
          com: 2,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
      ],
      [
        {
          com: 3,
          value: 0.375,
        },
        {
          com: 3,
          value: 0.2727272727272727,
        },
        {
          com: 3,
          value: 0.5,
        },
        {
          com: 0,
          value: 0.18181818181818182,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 3,
          value: 1,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
      ],
      [
        {
          com: 0,
          value: 0.2222222222222222,
        },
        {
          com: 0,
          value: 0.16666666666666666,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 2,
          value: 0.3,
        },
        {
          com: 2,
          value: 0.2857142857142857,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 2,
          value: 1,
        },
        {
          com: 2,
          value: 0.3333333333333333,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 2,
          value: 0.125,
        },
        {
          com: 2,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
      ],
      [
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.16666666666666666,
        },
        {
          com: 0,
          value: 0.2857142857142857,
        },
        {
          com: 2,
          value: 0.08333333333333333,
        },
        {
          com: 2,
          value: 0.2857142857142857,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 2,
          value: 0.3333333333333333,
        },
        {
          com: 2,
          value: 1,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 2,
          value: 0.125,
        },
        {
          com: 2,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
      ],
      [
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.08333333333333333,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 4,
          value: 1,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 4,
          value: 0.5,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
      ],
      [
        {
          com: 0,
          value: 0.09090909090909091,
        },
        {
          com: 0,
          value: 0.07142857142857142,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 2,
          value: 0.07692307692307693,
        },
        {
          com: 2,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 2,
          value: 0.125,
        },
        {
          com: 2,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 2,
          value: 1,
        },
        {
          com: 2,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
      ],
      [
        {
          com: 0,
          value: 0.09090909090909091,
        },
        {
          com: 0,
          value: 0.07142857142857142,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 2,
          value: 0.07692307692307693,
        },
        {
          com: 2,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 2,
          value: 0.125,
        },
        {
          com: 2,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 2,
          value: 0.1111111111111111,
        },
        {
          com: 2,
          value: 1,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
      ],
      [
        {
          com: 0,
          value: 0.09090909090909091,
        },
        {
          com: 0,
          value: 0.07142857142857142,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 4,
          value: 0.5,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 4,
          value: 1,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.2222222222222222,
        },
        {
          com: 0,
          value: 0.25,
        },
        {
          com: 0,
          value: 0.25,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
      ],
      [
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.08333333333333333,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.42857142857142855,
        },
        {
          com: 1,
          value: 0.5,
        },
        {
          com: 1,
          value: 0.5,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6,
        },
      ],
      [
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.08333333333333333,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 0.42857142857142855,
        },
        {
          com: 1,
          value: 0.5,
        },
        {
          com: 1,
          value: 0.5,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6,
        },
      ],
      [
        {
          com: 0,
          value: 0.08333333333333333,
        },
        {
          com: 0,
          value: 0.06666666666666667,
        },
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.07142857142857142,
        },
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.2222222222222222,
        },
        {
          com: 1,
          value: 0.42857142857142855,
        },
        {
          com: 1,
          value: 0.42857142857142855,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 0.8333333333333334,
        },
        {
          com: 1,
          value: 0.8333333333333334,
        },
        {
          com: 1,
          value: 0.6666666666666666,
        },
        {
          com: 1,
          value: 0.6666666666666666,
        },
        {
          com: 1,
          value: 0.6666666666666666,
        },
        {
          com: 1,
          value: 0.6666666666666666,
        },
        {
          com: 1,
          value: 0.6666666666666666,
        },
        {
          com: 1,
          value: 0.6666666666666666,
        },
        {
          com: 1,
          value: 0.6666666666666666,
        },
      ],
      [
        {
          com: 0,
          value: 0.09090909090909091,
        },
        {
          com: 0,
          value: 0.07142857142857142,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.25,
        },
        {
          com: 1,
          value: 0.5,
        },
        {
          com: 1,
          value: 0.5,
        },
        {
          com: 1,
          value: 0.8333333333333334,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 0.8,
        },
      ],
      [
        {
          com: 0,
          value: 0.09090909090909091,
        },
        {
          com: 0,
          value: 0.07142857142857142,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.1111111111111111,
        },
        {
          com: 0,
          value: 0.25,
        },
        {
          com: 1,
          value: 0.5,
        },
        {
          com: 1,
          value: 0.5,
        },
        {
          com: 1,
          value: 0.8333333333333334,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 0.8,
        },
      ],
      [
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.08333333333333333,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6666666666666666,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
      ],
      [
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.08333333333333333,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6666666666666666,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
      ],
      [
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.08333333333333333,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6666666666666666,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
      ],
      [
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.08333333333333333,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6666666666666666,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
      ],
      [
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.08333333333333333,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6666666666666666,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
      ],
      [
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.08333333333333333,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6666666666666666,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
      ],
      [
        {
          com: 0,
          value: 0.1,
        },
        {
          com: 0,
          value: 0.07692307692307693,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.08333333333333333,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.14285714285714285,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 0,
          value: 0.125,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6,
        },
        {
          com: 1,
          value: 0.6666666666666666,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 0.8,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
        {
          com: 1,
          value: 1,
        },
      ],
    ];
    const random2 = dp.testRandomMatrixReordering(random);
    const comMat = dp.testMatrixReorderingByCommunity(remat);
    const comMat2 = dp.testMatrixReorderingByCommunity(random);
    console.log('remat', remat);
    // console.log('randomMat', randomMat);
    console.log('random2', random2);
    console.log('comMat', comMat);
    console.log('comMat2', comMat2);
    function getRandomArbitrary(min, max) {
      return Math.random() * (max - min) + min;
    }
  }
}

export { userActivityView };
