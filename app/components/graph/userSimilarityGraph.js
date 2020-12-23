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
import { userActivityTimeline } from './userActivityTimeline';
import { userDailyActivity } from './userDailyActivity';
import * as dp from './dataprocess';

export default function userSimilarityGraph(data, svg, user, articles) {
  // console.log(user);
  // console.log(data);
  const svgScale = d3.scaleSqrt().domain([0, 200]).range([0.5, 0.1]);
  // const commentTimelineSvg = d3.select('#commentTimeline');
  const commentTimelineSvg = d3.select('#context');
  const h = parseFloat(d3.select('.heatMap').style('height'));
  const focusHeight = 500;
  svg.selectAll('*').remove();
  const margin = {
    top: 30, right: 30, bottom: 60, left: 30,
  };
  const width = 1300 - margin.left - margin.right;
  const height = 450 - margin.top - margin.bottom;
  const userSimilarity = dp.computeUserSimilarityByArticles(data, user);
  // const myGroups = getAllAuthorId(data); // author
  const clickedUser = [];

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
    d3.select('.option').selectAll('*').remove();
    const sliderSvg = d3.select('.option').append('div')
      // .style('display', 'inline-block')
      .append('svg')
      .attr('class', 'sliderSvg')
      .attr('width', '160px')
      .attr('height', '50px')
      .append('g')
      .attr('transform', 'scale(0.6) translate(10, 0)');
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
      .attr('transform', `translate(${3 * margin.left},${margin.top})`);
    const sliderText1 = sliderSvg.append('g')
      .attr('transform', `translate(0,${margin.top})`)
      .append('text')
      .text('Similarity')
      .attr('y', 5);
    gSlider1.call(similaritySlider);

    d3.select('.similaritySlider')
      .selectAll('.tick')
      .selectAll('text')
      .attr('y', 10);
    const repliedSliderSvg = d3.select('.option').append('div')
      // .style('display', 'inline-block')
      .append('svg')
      .attr('class', 'repliedSliderSvg')
      .attr('height', '50px')
      .attr('width', '160px')
      .append('g')
      .attr('transform', 'scale(0.6)');
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
      .attr('transform', `translate(${3 * margin.left + 10},${margin.top})`);
    const sliderText2 = repliedSliderSvg.append('g')
      .attr('transform', `translate(0,${margin.top})`)
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
    // let filterDiv = d3.select('.heatMap').select('.option').append('div')
    //   .attr('class', 'filterDiv d-flex align-items-center');
    // filterDiv = filterDiv.append('div')
    //   .style('margin-left', '10px')
    //   .style('align-self', 'center')
    //   .style('font-size', 'x-small')
    //   .text('ArticleGroupBy:');
    // const tagInput = filterDiv.append('div')
    //   .style('margin-left', '10px');
    // tagInput.append('input')
    //   .attr('type', 'radio')
    //   .attr('id', 'tag')
    //   .attr('name', 'group')
    //   .attr('value', 'tag')
    //   .property('checked', true);
    // tagInput.append('label')
    //   .attr('for', 'tag')
    //   .style('margin-left', '10px')
    //   .text('tag');
    let simOptionsDiv = d3.select('.heatMap').select('.option').append('div')
      .attr('class', 'filterDiv d-flex align-items-center');
    simOptionsDiv = simOptionsDiv.append('div')
      .style('margin-left', '10px')
      .style('align-self', 'center')
      .style('font-size', 'x-small');
    simOptionsDiv.append('p').text('Similarity options:');
    simOptionsDiv = simOptionsDiv.append('div').style('margin-left', '10px');
    const usersArticlesSim = simOptionsDiv.append('div')
      .style('float', 'left');
    usersArticlesSim.append('input')
      .attr('type', 'checkbox')
      .attr('id', 'userArticle')
      .attr('name', 'similarity')
      .attr('value', 'userArticle')
      .property('checked', true);
    usersArticlesSim.append('label')
      .attr('for', 'userArticle')
      .style('margin-left', '2px')
      .text('userArticle');
    const usersAuthorSim = simOptionsDiv.append('div')
      .style('float', 'left');
    usersAuthorSim.append('input')
      .attr('type', 'checkbox')
      .attr('id', 'userAuthor')
      .attr('name', 'similarity')
      .attr('value', 'userAuthor')
      .property('checked', true);
    usersAuthorSim.append('label')
      .attr('for', 'userAuthor')
      .style('margin-left', '2px')
      .text('userAuthor');
    const comsSim = simOptionsDiv.append('div')
      .style('float', 'left');
    comsSim.append('input')
      .attr('type', 'checkbox')
      .attr('id', 'community')
      .attr('name', 'similarity')
      .attr('value', 'community')
      .property('checked', true);
    comsSim.append('label')
      .attr('for', 'community')
      .style('margin-left', '2px')
      .text('community');
    const replyQuantileOption = simOptionsDiv.append('div')
      .style('float', 'left');
    replyQuantileOption.append('input')
      .attr('type', 'checkbox')
      .attr('id', 'quantile')
      .attr('name', 'similarity')
      .attr('value', 'quantile')
      .property('checked', true);
    replyQuantileOption.append('label')
      .attr('for', 'quantile')
      .style('margin-left', '2px')
      .text('quantile');
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
      
        default:
          break;
      }
    })
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
    // console.log(similarity, simThresh, artThresh);
    d3.select('.position').remove();
    d3.select('.groupLegends').remove();
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
    const color = d => d3.schemeTableau10[d];
    const colorArray = [
      d3.interpolateBlues,
      d3.interpolateOranges,
      d3.interpolateGreens,
      d3.interpolatePurples,
      d3.interpolateReds,
      d3.interpolateYlOrBr,
      d3.interpolateGnBu,
      d3.interpolateGreys,
    ];
    // Article Similarity

    // console.log(similarity);
    // console.log(user);
    const [datas, users, similaritys] = dp.filterAlwaysNonSimilarUser(data, user, similarity, simThresh, artThresh);
    console.log('[datas]:', [datas], '[users]:', [users], '[similaritys]:', [similaritys]);
    // similarity for articles grouping
    // let filteredArticles = articles;
    // filteredArticles = filteredArticles.filter(
    //   e => e.messages.some(mes => datas.some(usr => usr.id === mes.push_userid)),
    // );

    // articlesOrderByCommunity = articlesOrdering(articles, articlesCommunity);
    // console.log('articlesOrderByCommunity', articlesOrderByCommunity);
    const articlesOrderByCommunity = filteredArticles;
    // responderCommunityDetecting(nodes, similaritys);
    const newUserAxisValues = [];
    const axisDomain = [];
    for (let i = 0; i < users.length; i += 1) {
      axisDomain.push(i);
    }
    const community = dp.jLouvainClustering(users, similaritys);
    community.forEach((e) => {
      datas.find(e1 => e1.id === e.id).community = e.community;
    });
    const communityWord = dp.computeCommunityTitleWordScore(datas);
    console.log('communityWord: ', communityWord);
    if (communityWord.length) {
      const score = communityWord[0].wordList.reduce((acc, obj) => acc + obj.score, 0);
    }
    // similarity for articles grouping
    const [filteredArticles, articleSimilarity] = dp.computeArticleSimilarity(datas);
    console.log('articleSimilarity: ', articleSimilarity);
    const articleIds = filteredArticles.map(e => e.article_id);
    const articlesCommunity = dp.jLouvainClustering(articleIds, articleSimilarity);
    // const articlesCommunity = articleGroupByTag(articleIds, filteredArticles);
    console.log('articlesCommunity', articlesCommunity);

    const [matrix, origMatrix] = dp.relationToMatrix(similaritys, users);
    const similarityScale = d3.scalePow().exponent(0.5).range([0, 100]);
    // enlarge the difference between users
    // for (let i = 0; i < users.length; i += 1) {
    //   matrix[i] = matrix[i].map(e => similarityScale(e));
    //   // matrix[i] = matrix[i].map(e => e * 100);
    // }
    console.log('[matrix]', [matrix]);
    const [permuted_mat, permuted_origMat] = dp.matrixReordering(
      matrix, origMatrix, newUserAxisValues, users,
    );
    console.log('[permuted_mat], [permuted_origMat]: ', [permuted_mat], [permuted_origMat]);

    let [secondOrdering_mat, secondOrdering_origMat] = dp.matrixReorderingByCommunity(
      permuted_mat, permuted_origMat, community, newUserAxisValues, users,
    );

    // find user group index
    const groupIndex = [];
    newUserAxisValues.forEach((e, index) => {
      const tempCom = community.find(e1 => e1.id === e).community;
      const existedCommunity = groupIndex.find(e1 => e1.community === tempCom);
      if (existedCommunity) existedCommunity.num += 1;
      else groupIndex.push({ community: tempCom, num: 1, index });
    });
    console.log('position Index of each user community:', groupIndex);

    // const [secondOrdering_mat, secondOrdering_origMat] = [permuted_mat, permuted_origMat];
    // [secondOrdering_mat, secondOrdering_origMat] = moveNonSimilarUsersToCorner(
    //   secondOrdering_mat, secondOrdering_origMat, groupIndex, newUserAxisValues, users,
    // );

    [secondOrdering_mat, secondOrdering_origMat] = dp.communityInnerMatrixReordering(secondOrdering_mat, secondOrdering_origMat, newUserAxisValues, users, groupIndex);
    // console.log('secondOrdering_mat, secondOrdering_origMat: ', secondOrdering_mat, secondOrdering_origMat);

    const gridSize = 20;
    d3.select('.position').attr('transform', `scale(1) translate(${2 * margin.left},${4 * margin.top})`);
    const leftSvg = group.append('g')
      .attr('class', 'leftSvg')
      .attr('transform', `rotate(-45) scale(${svgScale(datas.length) > 0 ? svgScale(datas.length) : 0.4}) translate(0,0)`);

    // Build color scale
    const leftMyColor = d3.scaleLinear()
      .range(['white', color(9)])
      .domain([0, 100]);
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
    const selectedArticles = [];
    const rectClick = (d, index, i) => {
      let bothRepliedArticles = [];
      const beginDate = d3.select('#date1').attr('value');
      const endDate = d3.select('#date2').attr('value');
      const us = datas.filter(_d => selectedUser.includes(_d.id));
      if (us.length === 2) {
        bothRepliedArticles = us[0].repliedArticle.filter((a) => {
          return us[1].repliedArticle.some(_a => a.article_id === _a.article_id);
        });
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
      userDailyActivity(bothRepliedArticles, sortedUs, commentTimelineSvg, beginDate, endDate);

      articles.sort((a, b) => {
        if (bothRepliedArticles.find(e => e.article_title === b.article_title)) return 1;
        return -1;
      });
      console.log('sorted articles', articles);
      console.log('bothRepliedArticles', bothRepliedArticles);
      // updateArticleMatrix(bothRepliedArticles);
    };

    const tickClick = (d) => {
      const beginDate = d3.select('#date1').attr('value');
      const endDate = d3.select('#date2').attr('value');
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
      if (selectedArticles.length > 0) userDailyActivity(selectedArticles, sortedUs, commentTimelineSvg, beginDate, endDate);
      else userDailyActivity(repliedArticles, sortedUs, commentTimelineSvg, beginDate, endDate);
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
      .attr('transform', (d, index) => `translate(${110 * ((index % 2) + 4)}, ${70 * Math.floor(index / 2)})`)
      // .attr('transform', (d, index) => `translate(0 ${20 * index})`)
      .each((d, index, nodes) => {
        d3.select(nodes[index]).append('text')
          .text(`Community ${index}`)
          .attr('x', 0)
          .attr('font-size', 14)
          .attr('fill', colorArray[index](1));

        d3.select(nodes[index])
          .selectAll()
          .data([1, 0.8, 0.6, 0.4, 0.2])
          .enter()
          .append('rect')
          .attr('x', (_d, _index) => _index * legendSize)
          .attr('y', 10)
          .attr('width', legendSize)
          .attr('height', legendSize)
          .attr('fill', _d => colorArray[index](_d));
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

    const artComWidth = 100 + Math.max(...articlesCommunity.map(e => e.community)) * (2 + 10);
    const articleGroup = group.append('g')
      .attr('class', 'articleGroup')
      .attr('transform', `scale(${svgScale(datas.length)}) translate(${newUserAxisValues.length * gridSize + artComWidth}, 100)`);

    // drawHeatmap();
    const totalReplied = datas.reduce((prev, current) => {
      const preLen = prev.repliedArticle ? prev.repliedArticle.length : prev;
      const curLen = current.repliedArticle ? current.repliedArticle.length : current;
      return preLen + curLen;
    });
    // const bandWidthScale = d3.scaleSqrt().domain([0, totalReplied])
    //   .range([0, maxSize]);
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
    // drawCommunityWord();
    drawUserRepliedArticleMatrix(articlesOrderByCommunity);
    drawUserGroupBipartiteRelations();

    const removedUnusedDatas = JSON.parse(JSON.stringify(datas));
    removedUnusedDatas.forEach((e) => {
      e.totalReplyCount = e.repliedArticle.length;
      delete e.orig_group;
      delete e.haveReplied;
      delete e.reply;
      delete e.repliedArticle;
      delete e.titleWordScore;
      // delete e.totalReplyCount;
    });
    console.log('dataForNodeLink:', { nodes: removedUnusedDatas, links: similaritys });

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
              // drawReplyTime(nodes, index, i, xUser, yUser, bothReplied);
              // drawNewReplyTime(nodes, index, i, xUser, yUser, bothReplied);
              drawNewReplyTimeWithQuantile(nodes, index, i, xUser, yUser, bothReplied);
            }
          });
        // user self path
        drawUserPath(leftSvgGroup, i);
      }
      // draw user group heatmap
      // drawAverageSimilarity();
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
          .attr('stroke', () => {
            const user1 = datas.find(e => e.id === newUserAxisValues[indX]);
            const user2 = datas.find(e => e.id === newUserAxisValues[indY]);
            // if (indY > indX) return leftMyColor(100);
            // if (user1.community === user2.community) {
            //   const communityColor = d3.scaleLinear()
            //     .range(['white', color(user1.community)])
            //     .domain([0, 1]);
            //   return colorArray[user1.community](0.8);
            // }
            return colorArray[7](1);
          })
          // .attr('stroke', 'red')
          .attr('stroke-width', '2px')
          .attr('opacity', indY > indX ? 0 : 1);
      }

      function drawReplyTime(n, indX, indY, user1, user2, bothRepliedArticles) {
        const xUserAvgRepliedTime = averageReplyTime(user1, bothRepliedArticles);
        const yUserAvgRepliedTime = averageReplyTime(user2, bothRepliedArticles);
        const threeHours = 60 * 60 * 3;
        const thisTimeRectwidth = 5;
        d3.select(n[indX])
          .selectAll()
          .data([xUserAvgRepliedTime, yUserAvgRepliedTime])
          .enter()
          .append('path')
          .attr('d', (_d, _index) => {
            const minutes = _d / 60;
            const initX = ((indX % newUserAxisValues.length) + 1) * (maxSize + rectMargin) - ((4 - _index) * thisTimeRectwidth);
            const initY = indY * (maxSize + rectMargin);
            console.log(_d, minutes);
            if (minutes < 30) {
              const long = (_d / (30 * 60)) * maxSize;
              console.log(long);
              return `M ${initX} ${initY} 
              L ${initX} ${initY + long}`;
            }
            if (minutes < (3 * 60)) {
              const long = ((_d - (30 * 60)) / (3 * 60 * 60)) * maxSize;
              console.log(long);

              return `M ${initX} ${initY} 
              L ${initX} ${initY + (_index * thisTimeRectwidth) + maxSize} 
              L ${initX - long} ${initY + (_index * thisTimeRectwidth) + maxSize}`;
            }
            if (minutes < (6 * 60)) {
              const long = ((_d - (3 * 60 * 60)) / (3 * 60 * 60)) * maxSize;
              console.log(long);

              return `M ${initX} ${initY} 
              L ${initX} ${initY + (_index * thisTimeRectwidth) + maxSize} 
              L ${initX - maxSize - 2 * (_index * thisTimeRectwidth)} ${initY + (_index * thisTimeRectwidth) + maxSize} 
              L ${initX - maxSize - 2 * (_index * thisTimeRectwidth)} ${initY + maxSize - long - (_index * thisTimeRectwidth)}`;
            }
            const long = Math.min(maxSize, ((_d - (6 * 60 * 60)) / (18 * 60 * 60)) * maxSize);
            console.log(long);
            return `M ${initX} ${initY} 
              L ${initX} ${initY + (_index * thisTimeRectwidth) + maxSize} 
              L ${initX - maxSize - 2 * (_index * thisTimeRectwidth)} ${initY + (_index * thisTimeRectwidth) + maxSize} 
              L ${initX - maxSize - 2 * (_index * thisTimeRectwidth)} ${initY - (_index * thisTimeRectwidth)} 
              L ${initX - maxSize + long + (_index * thisTimeRectwidth)} ${initY - (_index * thisTimeRectwidth)}`;
            // const size = datas.find(e => e.id === tempUser.id).repliedArticle.length;
            // const offset = (bandWidthScale.range()[1] - bandWidthScale(size)) / 2;
            // console.log(offset);
            // const start = i * (maxSize + rectMargin) + offset;
            // const end = start + bandWidthScale(size);
            // return `M ${start} ${start} L ${end} ${start} L ${end} ${end}`;
          })
          .attr('fill', 'none')
          .attr('stroke', (_d, _index) => (_index === 0 ? 'red' : 'blue'))
          .attr('stroke-width', '5px')
          .attr('opacity', indY >= indX ? 0 : 1);
        // .append('rect')
        // .attr('x', (_d, _index) => {
        //   return ((index % newUserAxisValues.length) + 1) * (maxSize + rectMargin) - ((_index + 3) * thisTimeRectwidth);
        // })
        // .attr('y', () => {
        //   return i * (maxSize + rectMargin);
        // })
        // .attr('width', 5)
        // .attr('height', _d => Math.min((_d / threeHours) * 100, 100))
        // .attr('fill', (_d, _index) => (_index === 0 ? 'red' : 'blue'))
        // .attr('opacity', i >= index ? 0 : 1);
      }

      function drawNewReplyTime(n, indX, indY, user1, user2, bothRepliedArticles) {
        const xUserAvgRepliedTime = averageReplyTime(user1, bothRepliedArticles);
        const yUserAvgRepliedTime = averageReplyTime(user2, bothRepliedArticles);
        const threeHours = 60 * 60 * 3;
        const thisTimeRectwidth = 5;
        d3.select(n[indX])
          .append('circle')
          .attr('r', 2.5)
          .attr('cx', () => {
            const initX = ((indX % newUserAxisValues.length) + 1) * (maxSize + rectMargin) - rectMargin;
            return initX;
          })
          .attr('cy', () => {
            const initY = indY * (maxSize + rectMargin);
            return initY;
          })
          .attr('fill', 'black')
          .attr('opacity', indY >= indX ? 0 : 1);
        d3.select(n[indX])
          .selectAll()
          .data([xUserAvgRepliedTime, yUserAvgRepliedTime])
          .enter()
          .append('path')
          .attr('d', (_d, _index) => {
            const minutes = _d / 60;
            const initX = ((indX % newUserAxisValues.length) + 1) * (maxSize + rectMargin) - rectMargin;
            const initY = indY * (maxSize + rectMargin);
            const long = Math.min(100, (minutes / (6 * 60)) * maxSize * 2);
            if (long <= maxSize) {
              return `M ${initX} ${initY} 
              L ${initX - ((_index % 2) * long)} ${initY + (((_index + 1) % 2) * long)}`;
            }
            if (_index === 0) {
              const fixedLong = long - maxSize;
              return `M ${initX} ${initY} 
                L ${initX} ${initY + maxSize} 
                L ${initX - fixedLong} ${initY + maxSize}`;
            }
            const fixedLong = long - maxSize;
            return `M ${initX} ${initY} 
              L ${initX - maxSize} ${initY} 
              L ${initX - maxSize} ${initY + fixedLong}`;
          })
          .attr('fill', 'none')
          .attr('stroke', (_d, _index) => (_index === 0 ? 'black' : 'black'))
          .attr('stroke-width', '5px')
          .attr('opacity', indY >= indX ? 0 : 1);
      }

      function drawNewReplyTimeWithQuantile(n, indX, indY, user1, user2, bothRepliedArticles) {
        const xUserRepliedTime = getAllReplyTime(user1, bothRepliedArticles);
        const yUserRepliedTime = getAllReplyTime(user2, bothRepliedArticles);
        // for user study
        if (user1.id === user2.id) datas.find(e => e.id === user1.id).replyTime = xUserRepliedTime;

        const threeHours = 60 * 60 * 3;
        const thisTimeRectwidth = 10;
        const thisTimeMaxLong = maxSize - 10;
        // d3.select(n[indX])
        //   .append('circle')
        //   .attr('r', 2.5)
        //   .attr('cx', () => {
        //     const initX = ((indX % newUserAxisValues.length) + 1) * (maxSize + rectMargin) - rectMargin;
        //     return initX;
        //   })
        //   .attr('cy', () => {
        //     const initY = indY * (maxSize + rectMargin);
        //     return initY;
        //   })
        //   .attr('fill', 'black')
        //   .attr('opacity', indY >= indX ? 0 : 1);
        d3.select(n[indX])
          .selectAll()
          .data([xUserRepliedTime, yUserRepliedTime])
          .enter()
          .append('g')
          .attr('class', 'quantilePath')
          .each((_d, _index, _n) => {
            const quantile = [
              d3.quantile(_d, 0.25),
              d3.quantile(_d, 0.5),
              d3.quantile(_d, 0.75),
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
              .attr('fill', (q, step) => {
                // if (_index === 0) return colorArray[user1.community](0.6);
                // return colorArray[user2.community](0.6);
                if (_index === 0) return colorArray[user1.community](secondOrdering_mat[indX][indY]);
                return colorArray[user2.community](secondOrdering_mat[indX][indY]);
                if (step === 0) {
                  return 'black';
                }
                if (step === 1) {
                  return 'black';
                }
                return 'green';
              })
              .attr('stroke', (q, step) => {
                return 'black';
                // if (step === 1) return 'black';
                if (_index === 0) return colorArray[user1.community](0.8);
                return colorArray[user2.community](0.8);
                if (step === 0) {
                  return 'black';
                }
                if (step === 1) {
                  return 'black';
                }
                return 'green';
              })
              .attr('stroke-width', (q, step) => (step === 1 ? '3px' : '3px'))
              .attr('opacity', indY > indX ? 0 : 1);
          })
      }
      function drawArticleSimilarity(_d, n, indX, indY, user1, user2, size) {
        d3.select(n[indX])
          .append('rect')
          .attr('class', () => {
            const xUserID = newUserAxisValues[indX];
            const yUserID = newUserAxisValues[indY];
            return `articleSimilarity ${xUserID} ${yUserID} y${indY} x${indX}`;
          })
        // .attr('x', () => positionScale[indX])
        // .attr('y', positionScale[i])
          .attr('x', (indX % newUserAxisValues.length) * (maxSize + rectMargin) + ((maxSize - fixedSize) / 2))
          .attr('y', indY * (maxSize + rectMargin) + ((maxSize - fixedSize) / 2))
          .attr('rx', () => {
            if (indY > indX) return 0;
            return Math.min(15, bandWidthScale(size) / 10);
          })
          // .attr('width', () => bandWidthScale(size))
          // .attr('height', () => bandWidthScale(size))
          .attr('width', fixedSize)
          .attr('height', fixedSize)
          .style('fill', () => {
            if (indY > indX) return leftMyColor(100);
            if (user1.community === user2.community) {
              const communityColor = d3.scaleLinear()
                .range(['white', color(user1.community)])
                .domain([0, 1]);
              // return communityColor(_d);
              return colorArray[user1.community](_d);
            }
            // return leftMyColor(_d);
            return colorArray[7](_d);
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

      function drawAuthorSimilarity(_d, n, indX, indY, user1, user2, size) {
        const authorSim = dp.computeUserSimilarityByAuthors(user1, user2);
        d3.select(n[indX])
          .append('rect')
          .attr('class', () => {
            const xUserID = newUserAxisValues[indX];
            const yUserID = newUserAxisValues[indY];
            return `authorSimilarity ${xUserID} ${yUserID} y${indY} x${indX}`;
          })
        // .attr('x', () => {
        //   const size = datas.find(e => e.id === xUser.id).repliedArticle.length;
        //   return positionScale[index] + bandWidthScale(size) / 4;
        // })
        // .attr('y', () => {
        //   const size = datas.find(e => e.id === yUser.id).repliedArticle.length;
        //   return positionScale[i] + bandWidthScale(size) / 4;
        // })
          .attr('x', () => {
            const offset = (bandWidthScale.range()[1] - (bandWidthScale(size) / 2)) / 2;
            return (indX % newUserAxisValues.length) * (maxSize + rectMargin) + offset;
          })
          .attr('y', () => {
            const offset = (bandWidthScale.range()[1] - (bandWidthScale(size) / 2)) / 2;
            return indY * (maxSize + rectMargin) + offset;
          })
          .attr('rx', () => {
            if (indY > indX) return 0;
            return Math.min(15, bandWidthScale(size) / 10);
          })
          .attr('width', () => bandWidthScale(size) / 2)
          .attr('height', () => bandWidthScale(size) / 2)
          .style('fill', () => {
            if (indY > indX) return leftMyColor(100);
            // if (user1.community === user2.community) {
            //   const communityColor = d3.scaleLinear()
            //     .range(['white', color(user1.community)])
            //     .domain([0, 1]);
            //   // return communityColor(d);
            //   return colorArray[user1.community](authorSim);
            // }
            // return leftMyColor(d);
            return colorArray[7](authorSim);
          })
          .attr('opacity', indY >= indX ? 0 : 1)
          .on('mouseover', () => mouseover(authorSim, indX, indY))
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
          // .attr('d', () => {
          //   const start = positionScale[i];
          //   const size = datas.find(e => e.id === tempUser.id).repliedArticle.length;
          //   const end = positionScale[i] + bandWidthScale(size);
          //   return `M ${start} ${start} L ${end} ${start} L ${end} ${end}`;
          // })
          .attr('d', () => {
            const size = datas.find(e => e.id === tempUser.id).repliedArticle.length;
            const offset = (bandWidthScale.range()[1] - bandWidthScale(size)) / 2 + ((maxSize - fixedSize) / 2);
            const start = ind * (maxSize + rectMargin) + offset;
            const end = start + bandWidthScale(size);
            return `M ${start} ${start} L ${end} ${start} L ${end} ${end} L ${start} ${end} L ${start} ${start}`;
          })
          // .attr('fill', color(tempUser.community))
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
        // .attr('transform', `translate(${positionScale[positionScale.length - 1] + 30}, 0)`)
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
          console.log(s[0] / reverseScale, s[1] / reverseScale, (s[0] / reverseScale)/ ((maxSize + rectMargin) * Math.sqrt(2)), (s[1] / reverseScale) / ((maxSize + rectMargin) * Math.sqrt(2)));
          const start = Math.round((s[0] / reverseScale) / ((maxSize + rectMargin) * Math.sqrt(2)));
          const end = Math.floor((s[1] / reverseScale) / ((maxSize + rectMargin) * Math.sqrt(2)));
          for (let i = start; i <= end; i += 1) {
            selectedUser.push(newUserAxisValues[i]);
          }
          console.log(selectedUser);
          // positionScale.forEach((e, index) => {
          //   const tempPosition = (positionScale[index + 1] + positionScale[index]) / 2 * reverseScale * Math.sqrt(2);
          //   if (tempPosition >= s[0] && tempPosition <= s[1]) {
          //     selectedUser.push(newUserAxisValues[index]);
          //     focusUserIndex.push(index);
          //   }
          // });
          // resize brush controller
          // console.log(d3.select(this));
          // console.log(d3.select('.brush').nodes()[0].__brush);
          const fixedX1 = start * (maxSize + rectMargin) * reverseScale * Math.sqrt(2);
          const fixedX2 = (end * (maxSize + rectMargin) + maxSize) * reverseScale * Math.sqrt(2);
          // const fixedX1 = positionScale[focusUserIndex[0]] * reverseScale * Math.sqrt(2);
          // const fixedX2 = positionScale[focusUserIndex[focusUserIndex.length - 1] + 1] * reverseScale * Math.sqrt(2) - 6;

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
          // console.log(s);
          // setting all co-cluster rect stroke-width to 1
          // d3.select('.radialGroup').selectAll('rect')
          //   .attr('stroke', 'slategray')
          //   .attr('stroke-width', '0.3px');
          // highlight selected grid of heatmap
          const brushPathOffset = maxSize * reverseScale;
          d3.select('.brush').select('path')
            .transition()
            .attr('d', () => {
              return `
                M ${fixedX1} ${-brushPathOffset} 
                L ${(fixedX2 + fixedX1) / 2} ${-(fixedX2 - fixedX1) / 2 - brushPathOffset} 
                L ${fixedX2} ${-brushPathOffset} 
                L ${fixedX1} ${-brushPathOffset}
              `;
            })
            .attr('stroke', 'black')
            .attr('stroke-width', '2px')
            .attr('fill', 'gray')
            .attr('opacity', '0.5')
            .style('pointer-events', 'none');
          tickClick();
        }
      }
      // drawUserAxis();
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
          .style('pointer-events', 'none')
          // .on('mouseover', mouseover)
          // .on('mouseout', mouseout)
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
          .style('pointer-events', 'none')
          // .on('mouseover', mouseover)
          // .on('mouseout', mouseout)
          .on('click', tickClick);
        // leftSvg.select('.xAxis')
        //   .attr('transform', `translate(${positionScale[positionScale.length - 1]},-30)`);
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

      function drawAverageSimilarity() {
        for (let i = 0; i < groupIndex.length; i += 1) {
          const [similarityArray, selfAvgSimilarity] = computeAvgSim(i);
          console.log(`community ${groupIndex[i].community} avgSim ${selfAvgSimilarity}`);
          // self average similarity
          drawSelfAvgSim(selfAvgSimilarity, i);
          // self quantile similarity
          drawQuantileSimilarity(similarityArray, i);
          // average similarity between communities
          drawAvgSimBetweenComs(i);
        }

        function computeAvgSim(i) {
          let selfTotalSim = 0;
          const simArr = [];
          for (let j = groupIndex[i].index; j < groupIndex[i].index + groupIndex[i].num; j += 1) {
            for (let k = groupIndex[i].index; k < groupIndex[i].index + groupIndex[i].num; k += 1) {
              if (j !== k) {
                selfTotalSim += secondOrdering_mat[j][k];
                simArr.push(secondOrdering_mat[j][k]);
              }
            }
          }
          simArr.sort((a, b) => a - b);
          const selfAvgSim = selfTotalSim / (groupIndex[i].num * groupIndex[i].num - groupIndex[i].num);
          return [simArr, selfAvgSim];
        }

        function drawSelfAvgSim(selfAvgSim, i) {
          leftSvg.append('g')
            .attr('class', `avgSimilarityPath community${groupIndex[i].community}`)
            .append('path')
            .attr('fill', colorArray[groupIndex[i].community](selfAvgSim))
            // .attr('fill', colorArray[colorArray.length - 1](selfAvgSim))
            .attr('stroke', colorArray[groupIndex[i].community](1))
            .attr('stroke-width', '5px')
            .attr('d', () => {
              const tempX = groupIndex[i].index;
              const nextX = groupIndex[i].index + groupIndex[i].num;
              const start = positionScale[tempX];
              const end = positionScale[nextX];
              return `M ${start} ${start} L ${end} ${start} L ${end} ${end}`;
            })
            .on('mouseover', (d, index, nodes) => {
              d3.select(nodes[index]).attr('opacity', 0);
            })
            .on('mouseout', (d, index, nodes) => {
              d3.select(nodes[index]).attr('opacity', 1);
            });
        }

        function drawQuantileSimilarity(simArr, i) {
          const quantile = [
            d3.quantile(simArr, 0.75),
            d3.quantile(simArr, 0.5),
            d3.quantile(simArr, 0.25),
          ];
          console.log(quantile[2] - quantile[0]);
          leftSvg.append('g')
            .attr('class', `quantileSimilarityPath community${groupIndex[i].community}`)
            .selectAll()
            .data(quantile)
            .enter()
            .append('path')
            .attr('fill', d => colorArray[groupIndex[i].community](d))
            // .attr('stroke', colorArray[groupIndex[i].community](1))
            // .attr('stroke-width', '5px')
            .attr('d', (d, index) => {
              const tempX = groupIndex[i].index;
              const nextX = groupIndex[i].index + groupIndex[i].num;
              const start = positionScale[tempX];
              const end = positionScale[nextX];
              return `
                M ${start + (end - start) * index / 6} ${start + (end - start) * index / 6} 
                L ${start + (end - start) * (6 - index) / 6} ${start + (end - start) * index / 6} 
                L ${start + (end - start) * (6 - index) / 6} ${start + (end - start) * (6 - index) / 6}`;
            })
            .on('mouseover', (d, index, nodes) => {
              d3.select(nodes[index]).attr('opacity', 0);
            })
            .on('mouseout', (d, index, nodes) => {
              d3.select(nodes[index]).attr('opacity', 1);
            });
        }

        function drawAvgSimBetweenComs(i) {
          for (let j = i + 1; j < groupIndex.length; j += 1) {
            let totalSim = 0;
            for (let x = groupIndex[j - 1].index + groupIndex[j - 1].num; x < groupIndex[j].index + groupIndex[j].num; x += 1) {
              for (let y = groupIndex[i].index; y < groupIndex[i].index + groupIndex[i].num; y += 1) {
                totalSim += secondOrdering_mat[x][y];
              }
            }
            const avgSim = totalSim / (groupIndex[i].num * groupIndex[j].num);
            // console.log(totalSim);
            leftSvg.append('g')
              .attr('class', `avgSimilarityPath community${groupIndex[i].community}`)
              .append('rect')
              .attr('fill', colorArray[colorArray.length - 1](avgSim))
              .attr('stroke', colorArray[colorArray.length - 1](1))
              .attr('stroke-width', '1px')
              .attr('x', positionScale[groupIndex[j].index])
              .attr('y', positionScale[groupIndex[i].index])
              .attr('width', positionScale[groupIndex[j].index + groupIndex[j].num] - positionScale[groupIndex[j].index])
              .attr('height', positionScale[groupIndex[i].index + groupIndex[i].num] - positionScale[groupIndex[i].index])
              .on('mouseover', (d, index, nodes) => {
                d3.select(nodes[index]).attr('opacity', 0);
              })
              .on('mouseout', (d, index, nodes) => {
                d3.select(nodes[index]).attr('opacity', 1);
              });
          }
        }
      }
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

    function drawUserRepliedArticleMatrix() {
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
      const articleGroupHeatmap = leftSvg.append('g').attr('class', 'articleGroupHeatmap');
      const numOfArtCom = Math.max(...articlesCommunity.map(e => e.community)) + 1;
      const numOfArtOfEachComunity = [];
      for (let i = 0; i < numOfArtCom; i += 1) {
        const tempCommunity = articlesCommunity.filter(e => e.community === i);
        if (tempCommunity.length) numOfArtOfEachComunity.push({ community: i, articles: tempCommunity });
      }
      numOfArtOfEachComunity.sort((a, b) => b.articles.length - a.articles.length);
      console.log('numOfArtOfEachComunity', numOfArtOfEachComunity);
      const existedCommunityOfArticle = [];
      numOfArtOfEachComunity.forEach((e) => {
        existedCommunityOfArticle.push(e.community);
      });
      console.log('existedCommunityOfArticle', existedCommunityOfArticle);
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
      // drawCoClusterGraph(articleGroupOfUserCommunity);
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
                    // .attr('x', (_d, _index) => {
                    //   const temCommunity = d.community;
                    //   const nexCommunity = arr[j].find(e => e.community === temCommunity);
                    //   if (nexCommunity) {
                    //     return positionScale[nex] * Math.sqrt(2) + nexCommunity.position;
                    //   }
                    //   return positionScale[nex] * Math.sqrt(2);
                    // })
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
                      // const temCommunity = d.community;
                      // const nextArticleCommunity = arr[j].find(e => e.community === temCommunity);
                      // if (!nextArticleCommunity) return 0;
                      // const sameArticles = nextArticleCommunity.level[0].filter(e => _d.some(e1 => e1.article_id === e.article_id));
                      // return widthScale(sameArticles.length);

                      const temCommunity = d.community;
                      const nextArticleCommunity = arr[j].find(e => e.community === temCommunity);
                      if (!nextArticleCommunity) return 0;
                      return widthScale(nextArticleCommunity.level[0].length);
                    })
                    .attr('height', (_d) => {
                      // return 20;
                      const temCommunity = d.community;
                      const nextArticleCommunity = arr[j].find(e => e.community === temCommunity);
                      if (!nextArticleCommunity) return 0;
                      const heightScale = d3.scaleLinear().domain([0, nextArticleCommunity.level[0].length]).range([0, boxHeight]);
                      const sameArticles = nextArticleCommunity.level[0].filter(e => _d.some(e1 => e1.article_id === e.article_id));
                      return heightScale(sameArticles.length);
                    })
                    .attr('fill', (_d, _index) => colorArray[i](_index * 0.25))
                    // .attr('stroke', (_d, _index) => (_index === 0 ? 'black' : 'none'))
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
        console.log(positionOfArticleCom);
        console.log(arr);
        // simplify output arr of console.log
        const simpleArr = [];
        for (let i = 0; i < arr.length; i += 1) {
          simpleArr.push({ arr: [], num: 0 });
          simpleArr[i].num = (datas.filter(e => e.community === i).length);
          for (let j = 0; j < arr[i].length; j += 1) {
            simpleArr[i].arr.push({ community: arr[i][j].community, level: arr[i][j].level[0].length });
            simpleArr[i].arr[j].num = articlesCommunity.filter(e => e.community === arr[i][j].community).length;
          }
        }
        console.log(simpleArr);
        // article group label
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
            .attr('class', `article_group_label`)
            .selectAll('path')
            .data(positionOfArticleCom)
            .enter()
            .append('text')
            .attr('x', -50)
            .attr('y', (d, index) => {
              const num = numOfArtOfEachComunity.find(e => e.community === d.community).articles.length;
              console.log(scale(num) * (3 / 2) / 2);
              return d.position + scale(num) / 2;
            })
            .attr('dominant-baseline', 'central')
            .attr('font-size', (d) => {
              const num = numOfArtOfEachComunity.find(e => e.community === d.community).articles.length;
              return scale(num) / 2;
            })
            .attr('text-anchor', 'end')
            .text((d, index) => `Group ${index + 1}`);
        }
        function drawBlankAreaOfArticleCommunity(svgGroup, com, maxWidth) {
          const tempCom = comunityIndexY[com];
          svgGroup.append('g')
            .attr('class', `co-cluster_${com}`)
            .selectAll('path')
            .data(positionOfArticleCom)
            .enter()
            .append('rect')
            .attr('class', d => `blank_group_${d.community}`)
            .attr('x', () => (tempCom * (maxSize + rectMargin)) * Math.sqrt(2))
            .attr('y', d => d.position)
            .attr('height', (d) => {
              const { articles: art } = numOfArtOfEachComunity.find(e => e.community === d.community);
              return scale(art.length);
            })
            .attr('width', maxWidth)
            .attr('fill', 'gray')
            .attr('stroke', 'black')
            // .attr('stroke-width', '1px');
        }

        function drawBipartiteOfUserAndArticles(svgGroup, com, maxWidth) {
          const tempCom = comunityIndexY[com];
          svgGroup.append('g')
            .attr('class', `co-cluster_${com}`)
            .selectAll('path')
            .data(arr[com])
            .enter()
            .append('g')
            .each((d, index, nodes) => {
              // for i === k show density of replied articles of userCommunity
              d3.select(nodes[index]).selectAll('path')
                .data(d.level)
                .enter()
                .append('rect')
                .attr('x', (_d, _index) => (tempCom * (maxSize + rectMargin)) * Math.sqrt(2))
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
                .attr('fill', (_d, _index) => colorArray[com]((_index + 1) * 0.2))
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
          for (let j = 0; j < arr.length; j += 1) {
            if (com !== j) {
              // cluster between community_i & community_k
              positionIndex += diffAterSame;
              diffAterSame = 0;
              const pIndex = positionIndex;
              const nex = comunityIndexY[j];
              const nex_nex = comunityIndexY[j + 1] ? comunityIndexY[j + 1] : positionScale.length - 1;
              const maxWidth_nex = ((nex_nex - nex) * (maxSize + rectMargin) - rectMargin) * Math.sqrt(2);
              const numOfArticlesOfUserCommunity = arr[j].reduce((acc, obj) => acc + obj.level[0].length, 0);
              svgGroup.append('g')
                .attr('class', `co-cluster_${com}_${j}`)
                .selectAll('path')
                .data(arr[com])
                .enter()
                .append('g')
                .each((d, index, nodes) => {
                  const temCommunity = d.community;
                  const nextArticleCommunity = arr[j].find(e => e.community === temCommunity);

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
                    .attr('fill', (_d, _index) => colorArray[com](_index * 0.25))
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
}

export { userSimilarityGraph };
