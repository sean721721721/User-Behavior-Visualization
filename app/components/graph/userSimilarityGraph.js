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
import netClustering from 'netclustering';
import CheckboxGroup from 'antd/lib/checkbox/Group';
import { cps } from 'redux-saga/effects';
import jLouvain from './jLouvain';
import { userActivityTimeline } from './userActivityTimeline';

export default function userSimilarityGraph(data, svg, user, articles) {
  // console.log(user);
  const svgScale = d3.scaleSqrt().domain([1, 100]).range([1.5, 0.01]);
  const commentTimelineSvg = d3.select('#commentTimeline');
  const w = parseFloat(d3.select('.heatMap').style('width'));
  const h = parseFloat(d3.select('.heatMap').style('height'));
  const focusHeight = 500;
  // data = data.filter(e => e.repliedArticle.length > 1);
  // console.log(data);
  // console.log(user);
  // console.log(articles);
  svg.selectAll('*').remove();
  const authorArr = computeAuthorArray(articles);
  console.log('author array', authorArr);
  // set the dimensions and margins of the graph
  const margin = {
    top: 30, right: 30, bottom: 60, left: 30,
  };
  const width = 1300 - margin.left - margin.right;
  const height = 450 - margin.top - margin.bottom;

  // Labels of row and columns
  const myGroups = getAllAuthorId(data); // author
  const clickedUser = [];
  drawSlider();
  drawFilterDiv();
  drawSortOptionDiv();
  function drawSlider() {
    d3.select('.option').selectAll('*').remove();
    const sliderSvg = d3.select('.option').append('svg')
      .attr('class', 'sliderSvg')
      .style('margin-top', '10px');
    const similarThresh = 0.1;

    const similaritySlider = slider.sliderBottom()
      .min(0)
      .max(1)
      .width(150)
      .tickFormat(d3.format('.1'))
      .ticks(5)
      .default(similarThresh)
      .on('onchange', (val) => { adjacencyMatrixNoAuthor(val); });

    const gSlider = sliderSvg.append('g')
      .attr('class', 'similaritySlider')
      .attr('transform', `translate(${4 * margin.left},${margin.top / 2})`);
    const sliderText = sliderSvg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top / 2})`)
      .append('text')
      .text('Similarity')
      .attr('y', 5);
    gSlider.call(similaritySlider);

    d3.select('.similaritySlider')
      .selectAll('.tick')
      .selectAll('text')
      .attr('y', 10);

    adjacencyMatrixNoAuthor(similarThresh);
  }

  function drawFilterDiv() {
    const filterDiv = d3.select('.heatMap').select('.option').append('div')
      .attr('class', 'filterDiv')
      .style('margin-top', '10px');
    filterDiv.append('p')
      .style('margin-bottom', '0px')
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

  function adjacencyMatrixNoAuthor(thresh) {
    d3.select('.position').remove();
    d3.select('.groupLegends').remove();
    // svg.attr('height', h);
    svg.attr('width', w);
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
    const color = d => d3.schemeTableau10[d + 1];
    // Article Similarity
    const similarity = computeUserSimilarityByArticles(data, user);
    console.log(similarity);
    const [datas, users, similaritys] = filterAlwaysNonSimilarUser(data, user, similarity, thresh);
    console.log('datas:', datas, 'users:', users, 'similaritys:', similaritys);
    // similarity for articles grouping
    let filteredArticles = articles;
    filteredArticles = filteredArticles.filter(
      e => e.messages.some(mes => datas.some(usr => usr.id === mes.push_userid)),
    );
    // if (articles.length > 100) {
    //   filteredArticles = filteredArticles.filter(e => e.message_count.all > 100);
    //   console.log(filteredArticles);
    // }

    // similarity for articles grouping
    const articleSimilarity = computeArticleSimilarity(filteredArticles, data);
    console.log('articleSimilarityCount: ', articleSimilarity.length);
    const articleIds = filteredArticles.map(e => e.article_id);
    // const articlesCommunity = jLouvainClustering(articleIds, articleSimilarity);
    const articlesCommunity = articleGroupByTag(articleIds, filteredArticles);
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
    const [matrix, origMatrix] = relationToMatrix(similaritys, users);
    const similarityScale = d3.scalePow().exponent(0.5).range([0, 100]);
    // enlarge the difference between users
    for (let i = 0; i < users.length; i += 1) {
      matrix[i] = matrix[i].map(e => similarityScale(e));
    }
    const [permuted_mat, permuted_origMat] = matrixReordering(
      matrix, origMatrix, newUserAxisValues, users,
    );
    const [secondOrdering_mat, secondOrdering_origMat] = matrixReorderingByCommunity(
      permuted_mat, permuted_origMat, community, newUserAxisValues, users,
    );
    // const secondOrdering_mat = permuted_mat;
    // Author Similarity
    // const authorSimilarity = computeUserSimilarity(datas, users);
    // console.log('authorSimilarity', authorSimilarity);
    // const newUserAxisValuesByAuthor = [];
    // const communityByAuthor = jLouvainClustering(users, authorSimilarity);
    // const [matrixByAuthor, origMatrixByAuthor] = relationToMatrix(authorSimilarity, users);
    // // enlarge the difference between users
    // for (let i = 0; i < users.length; i += 1) {
    //   matrixByAuthor[i] = matrixByAuthor[i].map(e => similarityScale(e));
    //   // matrix[i] = matrix[i].map(e => (e >= 0.5 && e < 2 ? 1 : e));
    //   // matrix[i] = matrix[i].map(e => e * 10);
    // }
    // console.log('matrixByAuthor', matrixByAuthor);
    // const [
    //   permuted_matByAuthor,
    //   permuted_origMatByAuthor,
    // ] = matrixReordering(matrixByAuthor, origMatrixByAuthor, newUserAxisValuesByAuthor, users);
    // const [
    //   secondOrdering_matByAuthor,
    //   secondOrdering_origMatByAuthor,
    // ] = matrixReorderingByCommunity(
    //   permuted_matByAuthor, permuted_origMatByAuthor,
    //   communityByAuthor, newUserAxisValuesByAuthor, users,
    // );

    const gridSize = 20;
    const x = d3.scaleBand().range([0, axisDomain.length * gridSize])
      .domain(axisDomain);
    // d3.select('.position').attr('transform', `scale(1) translate(${w / 2 - x.range()[1] / 2},${2 * margin.top})`);
    d3.select('.position').attr('transform', `scale(1) translate(${2 * margin.left},${4 * margin.top})`);
    const leftSvg = group.append('g')
      .attr('class', 'leftSvg')
      .attr('transform', `scale(${svgScale(datas.length)}) translate(150,100)`);

    const y = d3.scaleBand().range([0, axisDomain.length * gridSize])
      .domain(axisDomain);

    // builduserGroupAxis(newUserAxisValues);

    // Build color scale
    const userColor = userColorScaleArray(datas);
    const myColor = d3.scaleLinear()
      .range([d3.interpolateYlOrRd(0), d3.interpolateYlOrRd(0.8)])
      .domain([0, 1]);
    const leftMyColor = d3.scaleLinear()
      // .range([d3.interpolateYlOrRd(0), d3.interpolateYlOrRd(0.8)])
      .range(['white', '#212529'])
      .domain([0, 100]);
    const scaleExponent = d3.scalePow().exponent(2);
    d3.select('.tooltip').remove();
    const Tooltip = d3.select('.heatMap')
      .append('div')
      .style('opacity', 0)
      .attr('class', 'tooltip')
      .style('background-color', 'white')
      .style('border', 'solid')
      .style('border-width', '2px')
      .style('border-radius', '5px')
      .style('padding', '5px');

    // Three function that change the tooltip when user hover / move / leave a cell
    const mouseover = (d, index, i) => {
      const xUser = newUserAxisValues[index];
      const yUser = newUserAxisValues[i];
      Tooltip
        .style('opacity', 1)
        .html(`Similarity between ${xUser} and ${yUser} is ${Math.round(d) / 100}`)
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
      Tooltip
        .style('opacity', 0)
        .style('left', '0px')
        .style('top', '0px');
      d3.select(this)
        .style('stroke', 'none')
        .style('opacity', 0.8);
    };

    const rectClick = (d, index, i) => {
      let bothRepliedArticles = [];
      if (i) {
        const xID = newUserAxisValues[index];
        const yID = newUserAxisValues[i];
        const xUser = datas.find(e => e.id === xID);
        const yUser = datas.find(e => e.id === yID);
        d3.select('.leftSvg')
          .selectAll('rect')
          .attr('stroke', 'white');
        // d3.select('.rightSvg')
        //   .selectAll('rect')
        //   .transition()
        //   .duration(500)
        //   .attr('stroke', 'white');
        d3.selectAll(`.x${index}`)
          .transition()
          .duration(500)
          .attr('stroke', 'black');
        d3.selectAll(`.y${i}`)
          .transition()
          .duration(500)
          .attr('stroke', 'black');

        bothRepliedArticles = xUser.repliedArticle.filter(
          e => yUser.repliedArticle.some(e2 => e2.article_id === e.article_id),
        );
      } else {
        const articleIdArr = d.map(e => e.article_id);
        bothRepliedArticles = articles.filter(e => articleIdArr.some(e1 => e1 === e.article_id));
      }
      articles.sort((a, b) => {
        if (bothRepliedArticles.find(e => e.article_title === b.article_title)) return 1;
        return -1;
      });
      console.log('sorted articles', articles);
      updateArticleMatrix(articles, bothRepliedArticles, index);
      // updateArticleMatrixv2(bothRepliedArticles, index);
    };
    let selectedUser = [];
    const tickClick = (d) => {
      console.log(d);
      if (!selectedUser.includes(newUserAxisValues[d])) {
        selectedUser.push(newUserAxisValues[d]);
      } else {
        selectedUser = selectedUser.filter(e => e !== newUserAxisValues[d]);
      }
      if (selectedUser.length >= 1) {
        const filteredArticles = articles.filter(
          art => art.messages.some(m => selectedUser.includes(m.push_userid)),
        );
        userActivityTimeline(filteredArticles, commentTimelineSvg, selectedUser);
      }
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
        d3.select(nodes[index])
          .append('text')
          .text(`Group ${index}`)
          .attr('x', 10);

        d3.select(nodes[index])
          .append('circle')
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
    drawNewHeatmap();
    // d3.select('#timeLine').attr('height', newUserAxisValues.length * gridSize + 100 + focusHeight + 300);
    drawUserRepliedArticleMatrix(articlesOrderByCommunity);
    // drawUserGroupRadial();
    drawUserGroupBipartiteRelations();
    // drawUserRepliedAuthorMatrix(authorArr);
    // drawAuthorArticleMatrix(articlesOrderByCommunity, authorArr);
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
    function drawHeatmap() {
      const [maxRepliedSameArticles, maxRepliedArticles] = computeScaleMaximum();
      const circleRadiusScaleForSameArticles = d3.scaleLinear()
        .domain([0, maxRepliedSameArticles]).range([0, 10]);
      const circleRadiusScaleForRepliedArticles = d3.scaleLinear()
        .domain([0, maxRepliedArticles]).range([0, 10]);
      for (let i = 0; i < permuted_mat.length; i += 1) {
        leftSvg.append('g').selectAll()
          .data(secondOrdering_mat[i])
          .enter()
          .append('rect')
          .each((d, index, nodes) => {
            const xUser = community.find(e => e.id === newUserAxisValues[index]);
            const yUser = community.find(e => e.id === newUserAxisValues[i]);
            if (i < index || xUser.community === yUser.community) {
              if (i !== index) {
                d3.select(nodes[index])
                  .attr('class', () => {
                    const xUserID = newUserAxisValues[index];
                    const yUserID = newUserAxisValues[i];
                    return `${xUserID} ${yUserID} y${i} x${index}`;
                  })
                  .attr('x', () => x(index))
                  .attr('y', y(i))
                  .attr('width', x.bandwidth())
                  .attr('height', y.bandwidth())
                  .style('fill', () => {
                    if (i > index) return color(xUser.community);
                    if (xUser.community === yUser.community) {
                      const communityColor = d3.scaleLinear()
                        .range(['white', color(xUser.community)])
                        .domain([0, 100]);
                      return communityColor(d);
                    }
                    return leftMyColor(d);
                  })
                  .on('mouseover', () => mouseover(d, index, i))
                  .on('mouseout', mouseout)
                  .on('click', () => rectClick(d, index, i));
              }
            }
          });

        // circle heatMap
        leftSvg.append('g').selectAll()
          .data(secondOrdering_mat[i])
          .enter()
          .append('circle')
          .each((d, index, nodes) => {
            d3.select(nodes[index])
              .attr('class', `x${index} y${i}`)
              .attr('cx', () => x(index) + (x.bandwidth() / 2))
              .attr('cy', y(i) + (y.bandwidth() / 2))
              .attr('r', () => {
                const xUser = datas.find(e => e.id === newUserAxisValues[index]);
                const yUser = datas.find(e => e.id === newUserAxisValues[i]);
                if (index === i) return circleRadiusScaleForRepliedArticles(xUser.repliedArticle.length);
                const sameArticlesNum = xUser.repliedArticle.filter(
                  value1 => yUser.repliedArticle.some(value2 => value2.article_id === value1.article_id),
                ).length;
                return circleRadiusScaleForSameArticles(sameArticlesNum);
              })
              .style('fill', () => {
                const xUser = community.find(e => e.id === newUserAxisValues[index]);
                const yUser = community.find(e => e.id === newUserAxisValues[i]);
                if (xUser.community === yUser.community) {
                  const communityColor = d3.scaleLinear()
                    .range(['white', color(xUser.community)])
                    .domain([0, 100]);
                  return communityColor(d);
                }
                return leftMyColor(d);
              })
              .attr('stroke', 'black')
              .style('stroke-width', '0.1px')
              .attr('visibility', () => {
                if (i === index) return 'visible';
                return 'hidden';
              })
              .on('mouseover', () => mouseover(d, index, i))
              .on('mouseout', mouseout)
              .on('click', () => rectClick(d, index, i));
          });
      }

      // draw user group heatmap
      for (let i = 0; i < groupIndex.length - 1; i += 1) {
        const rectX = groupIndex[i].index;
        for (let j = i + 1; j < groupIndex.length; j += 1) {
          const rectY = groupIndex[j].index;
          leftSvg.append('g')
            .attr('class', `community${groupIndex[i].community}${groupIndex[j].community}`)
            .append('rect')
            .attr('x', x(rectX))
            .attr('y', y(rectY))
            .attr('height', groupIndex[j].num * gridSize)
            .attr('width', groupIndex[i].num * gridSize)
            .attr('fill', () => {
              let totalSim = 0;
              for (let k = rectX; k < rectX + groupIndex[i].num; k += 1) {
                for (let l = rectY; l < rectY + groupIndex[j].num; l += 1) {
                  totalSim += secondOrdering_mat[k][l];
                }
              }
              // console.log(totalSim);
              return leftMyColor(totalSim / (groupIndex[i].num * groupIndex[j].num));
            });
        }
      }
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
        leftSvg.append('g').selectAll()
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
                .on('mouseover', () => mouseover(d, index, i))
                .on('mouseout', mouseout)
                .on('click', () => rectClick(d, index, i));
            }
          });
      }
      // draw user group heatmap
      for (let i = 0; i < groupIndex.length - 1; i += 1) {
        const rectX = groupIndex[i].index;
        for (let j = i + 1; j < groupIndex.length; j += 1) {
          const rectY = groupIndex[j].index;
          leftSvg.append('g')
            .attr('class', `community${groupIndex[i].community}${groupIndex[j].community}`)
            .append('rect')
            .attr('x', positionScale[rectX])
            .attr('y', positionScale[rectY])
            .attr('height', () => {
              const tem = groupIndex[j].index;
              let nex = positionScale.length - 1;
              if (groupIndex[j + 1]) nex = groupIndex[j + 1].index;
              console.log(positionScale[nex], positionScale[tem]);
              return positionScale[nex] - positionScale[tem];
            })
            .attr('width', () => {
              const tem = groupIndex[i].index;
              const nex = tem + groupIndex[i].num;
              console.log(positionScale[nex], positionScale[tem]);
              return positionScale[nex] - positionScale[tem];
            })
            .attr('fill', () => {
              let totalSim = 0;
              for (let k = rectX; k < rectX + groupIndex[i].num; k += 1) {
                for (let l = rectY; l < rectY + groupIndex[j].num; l += 1) {
                  totalSim += secondOrdering_mat[k][l];
                }
              }
              // console.log(totalSim);
              return leftMyColor(totalSim / (groupIndex[i].num * groupIndex[j].num));
            });
        }
      }
      drawUserAxis();
      leftSvg.append('g').attr('class', 'radialGroup')
        .attr('transform', `translate(0,${positionScale[positionScale.length - 1] + 30})`);
      function drawUserAxis() {
        leftSvg.append('g')
          .attr('class', 'yAxis')
          .selectAll()
          .data(newUserAxisValues)
          .enter()
          .append('g')
          .append('text')
          .text(d => d)
          .attr('x', -10)
          .attr('y', (d, index) => {
            return (positionScale[index + 1] + positionScale[index]) / 2;
          })
          .attr('fill', (d) => {
            const index = community.findIndex(e => e.id === d);
            return color(community[index].community);
          })
          .style('text-anchor', 'end')
          .attr('dy', '0.2em')
          .style('font-size', (d, index) => (positionScale[index + 1] - positionScale[index]) / 2);
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

    function builduserGroupAxis(axisValue, axis_x, axis_y) {
      leftSvg.append('g')
        .attr('transform', 'scale(1) translate(0,0)')
        .attr('class', 'authorAxisX')
        .call(d3.axisTop(x).tickFormat((d, i) => axisValue[i]));
      const leftSvgTicksX = leftSvg.select('.authorAxisX')
        .selectAll('.tick')
        .attr('class', (d, i) => `tick ${axisValue[i]}`);
      leftSvg.append('g')
        .attr('class', 'authorAxisY').call(d3.axisLeft(y).tickFormat((d, i) => axisValue[i]));
      const leftSvgTicksY = leftSvg.select('.authorAxisY')
        .selectAll('.tick')
        .attr('class', (d, i) => `tick ${axisValue[i]}`);
      leftSvg.selectAll('.tick')
        .on('click', (d) => {
          tickClick(d);
        });
      group.selectAll('.authorAxisY')
        .selectAll('.tick')
        .selectAll('line')
        .remove();
      group.selectAll('.authorAxisX')
        .selectAll('.tick')
        .selectAll('line')
        .remove();
      group.selectAll('.authorAxisX')
        .selectAll('.tick')
        .selectAll('text')
        .style('font-size', '15px')
        .style('color', (d) => {
          const index = community.findIndex(e => e.id === axisValue[d]);
          return color(community[index].community);
        });
      group.selectAll('.authorAxisY')
        .selectAll('.tick')
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('x', -3)
        .attr('dy', '.35em')
        .style('font-size', '15px')
        .style('color', (d) => {
          const index = community.findIndex(e => e.id === axisValue[d]);
          return color(community[index].community);
        });
      group.selectAll('g.authorAxisX')
        .selectAll('text')
        .attr('y', 0)
        .attr('x', 3)
        .attr('dy', '.35em')
        .attr('transform', 'rotate(-90)')
        .style('text-anchor', 'start');
      group.selectAll('path')
        .attr('opacity', 0);
    }
    function drawUserRepliedArticleMatrix(articleArray) {
      const article_titles = articleArray.map(e => e.article_id);
      const xScale = d3.scaleBand().domain(article_titles)
        .range([0, article_titles.length * gridSize]);

      // articleGroup.append('g').attr('class', 'articleXAxis').call(d3.axisTop(xScale));

      // const articleGroupTickX = articleGroup.select('.articleXAxis')
      //   .selectAll('.tick')
      //   .attr('class', (d, i) => `tick ${d}`)
      //   .select('text')
      //   .attr('fill', (d) => {
      //     const axisX = articlesCommunity.find(e => e.id === d);
      //     return color(axisX.community);
      //   });

      const yScale = d3.scaleBand().domain(newUserAxisValues)
        .range([0, newUserAxisValues.length * gridSize]);

      const focusOffSetX = -w / 2 + (newUserAxisValues.length * gridSize) / 2 + 400;
      const focusOffsetY = svgScale(datas.length) * (newUserAxisValues.length * gridSize + 120);
      d3.select('#focus').selectAll('*').remove();
      // d3.select('#focus').attr('height', '500px');
      const focus = d3.select('#focus').append('g')
        .attr('class', 'focus')
        .attr('transform', `translate(${100},${50})`);
      const context = position.append('g')
        .attr('class', 'context');
      for (let i = 0; i < datas.length; i += 1) {
        // focus
        focus.append('g')
          .attr('class', datas[i].id)
          .selectAll('circle')
          .data(datas[i].repliedArticle)
          .enter()
          .append('g')
          .attr('class', d => d.article_id)
          .attr('transform', d => `translate(${xScale(d.article_title)},0)`)
          .attr('visibility', 'hidden')
          .each((d, index, nodes) => {
            const postYear = new Date(d.date).getFullYear();
            const lastPushTimeWithoutYear = dateFormat(d.messages[d.messages.length - 1]);
            const lastPushTime = new Date(lastPushTimeWithoutYear).setFullYear(postYear);
            const pushPositionScale = d3.scaleLinear()
              .domain([new Date(d.date), new Date(lastPushTime)])
              .range([0, gridSize - 1]);

            d3.select(nodes[index]).selectAll('rect')
              .data(d.messages.filter(e => e.push_userid === datas[i].id))
              .enter()
              .append('rect')
              // .attr('x', e => pushPositionScale(new Date(dateFormat(e)).setFullYear(postYear)))
              // .attr('y', e => yScale(datas[i].id))
              // .attr('height', yScale.bandwidth())
              .attr('width', 1)
              .attr('fill', (e) => {
                switch (e.push_tag) {
                  case '推':
                    return color(3);
                  case '噓':
                    return color(1);
                  case '→':
                    return color(4);
                  default:
                    return color(0);
                }
              })
              .on('mouseover', (e) => {
                let commentString = '';
                if (d.messages) {
                  d.messages.forEach((m) => {
                    if (m.push_userid === datas[i].id) {
                      if (m.push_content === e.push_content) {
                        commentString += `<strong style='color: red'>${m.push_tag} ${m.push_content} ${dateFormat(m)} </strong> <br>`;
                      } else {
                        commentString += `${m.push_tag} ${m.push_content} ${dateFormat(m)} <br>`;
                      }
                    }
                  });
                }
                const tooltipString = `Replyer: ${datas[i].id} <br> 
                  Author: ${d.author} <br> Post: ${d.article_title} <br>
                  pushContent: <br> ${commentString}`;
                authorGroupMouseover(tooltipString);
              })
              .on('mouseout', mouseout);
          });
      }
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
      console.log(highlightArticles);
      const focusDivW = parseFloat(d3.select('#focus').style('width'));
      const focusDivH = parseFloat(d3.select('#focus').style('height'));
      articleGroup.selectAll('.articleXAxis').remove();
      articleGroup.select('.lineGroup').selectAll('line').remove();
      const article_titles = articleArray.map(e => e.article_title);
      const communityUserCount = datas.filter(e => e.community === communityIndex).length;

      const focusGridWidth = 25;
      // const xScale = d3.scaleBand().range([0, article_titles.length * 2])
      //   .domain(article_titles);

      // const highlightArticleXScale = d3.scaleBand().range([0, highlightArticle_id.length * 2])
      // .domain(highlightArticle_id);
      const focusWidth = w - 500;
      const highlightArticle_id = highlightArticles.map(e => e.article_id);
      console.log(highlightArticle_id);
      const focusScaleX = d3.scaleBand().range([0, focusDivW - 50])
        .domain(highlightArticle_id);
      const focusArticleScaleY = d3.scaleBand().domain(highlightArticle_id)
        .paddingInner(0.5)
        .range([0, focusDivH - 100]);
      const focusUserScaleY = d3.scaleBand().domain(newUserAxisValues)
        .range([0, focusArticleScaleY.bandwidth()]);
      const yScale = d3.scaleBand().domain(newUserAxisValues)
        .range([0, focusDivH - 200]);

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
      // const contextXScale = d3.scaleBand()
      //   .range([0, highlightArticle_id.length * 10])
      //   .domain(highlightArticle_id);
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
        .extent([[0, 0], [contextXScale.range()[1], contextYScale.range()[1]]])
        .on('brush end', brushed);

      // const zoom = d3.zoom()
      //   .scaleExtent([1, Infinity])
      //   .translateExtent([[0, 0], [width, height]])
      //   .extent([[0, 0], [width, height]])
      //   .on('zoom', zoomed);

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
      context.attr('height', contextYScale.range()[1] + 100);
      context.attr('width', contextXScale.range()[1] + 100);
      context.selectAll('*').remove();
      context = context.append('g').attr('transform', 'translate(50, 60)');
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
      // drawArticlesWithTypeComment();

      // contextXScale.domain(focusScaleX.domain());
      // contextYScale.domain(yScale.domain());

      // focus.append('g')
      //   .attr('class', 'axis axis--x')
      //   .attr('transform', `translate(0,${yScale.range()[1]})`)
      //   .call(d3.axisBottom(focusScaleX).tickFormat((d, i) => highlightArticles[i].article_title));
      // focus.append('g')
      //   .attr('class', 'axis axis--y')
      //   .call(d3.axisLeft(yScale));

      context.select('.brush').remove();
      context.select('.axis').remove();
      context.append('g')
        .attr('class', 'axis axis--x')
        // .attr('transform', `translate(0,${contextYScale.range()[1]})`)
        .call(d3.axisTop(contextXScale).ticks(5));
      context.append('g')
        .attr('class', 'axis axis--y')
        .call(d3.axisLeft(contextYScale).tickFormat(d => highlightArticles.find(e => e.article_id === d).article_title));
      context.select('.axis--x')
        .selectAll('text')
        .attr('dy', '.35em')
        .attr('y', '-20')
        .style('font-size', 'larger')
        // .style('writing-mode', 'tb')
        .style('text-anchor', 'middle');
      // context.select('.axis--x')
      //   .selectAll('line')
      //   .remove();
      // context.select('.axis--x')
      //   .selectAll('path')
      //   .remove();

      context.append('g')
        .attr('class', 'brush')
        // .attr('transform', () => {
        //   const userOffset = (newUserAxisValues.length - userX - 1) * gridSize;
        //   return `translate(-${userOffset}, 0)`;
        // })
        .call(brush)
        .call(brush.move, [[0, 0],
          [
            Math.min(contextXScale.range()[1], 50),
            // Math.min(yScale.range()[1], gridSize * 3),
            Math.min(contextYScale.range()[1], 120),
          ]]);

      // svg.append('rect')
      //   .attr('class', 'zoom')
      //   .attr('width', width)
      //   .attr('height', height)
      //   .attr('transform', `translate(${margin.left},${margin.top})`)
      //   .call(zoom);
      
      function brushed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return; // ignore brush-by-zoom
        const s = d3.event.selection || contextYScale.range();
        const newDepthDomainX = contextXScale.domain().slice(s[0][0] / contextXScale.bandwidth(), s[1][0] / contextXScale.bandwidth());
        // const newDomainX = newUserAxisValues.filter(e => datas.find(e1 => e1.id === e).community === communityIndex);
        const newUserDomainY = newUserAxisValues.filter(e => datas.find(e1 => e1.id === e).community === communityIndex);
        // focusScaleX.domain(newDomainX);
        focusUserScaleY.domain(newUserDomainY);
        // const newDomainY = highlightArticle_id.slice(s[0][0] / contextXScale.bandwidth(), s[1][0] / contextXScale.bandwidth());
        const newArticleDomainY = contextYScale.domain().slice(s[0][1] / contextYScale.bandwidth(), s[1][1] / contextYScale.bandwidth());
        // console.log(newDomainY);
        focusArticleScaleY.domain(newArticleDomainY);
        // yScale.domain(newDomainY);
        focusUserScaleY.range([0, focusArticleScaleY.bandwidth()]);

        focusLineGroup.selectAll('*').remove();
        focusLineGroup.append('g');

        // article box
        const boxHeight = 100;
        const boxWidth = 50;
        const boxMargin = 20;
        focus.selectAll('.axis--y').remove();
        for (let i = 0; i < focusArticleScaleY.domain().length; i += 1) {
          const lineGroupY = focusArticleScaleY(focusArticleScaleY.domain()[i]);
          // console.log(focusArticleScaleY.domain()[i]);
          const art = articleTree.find(e => e.article_id === focusArticleScaleY.domain()[i]);
          // console.log(art);
          const articleBoxNum = Math.min(art.children.length + 1, newDepthDomainX[newDepthDomainX.length - 1]);
          focus.append('g')
            .attr('class', 'axis axis--y')
            .attr('transform', `translate(0,${lineGroupY})`)
            .call(d3.axisLeft(focusUserScaleY));
          const articleBoxGroup = focusLineGroup.append('g')
            .attr('transform', `translate(0,${lineGroupY})`);
          articleBoxGroup.append('text')
            .text(art.article_title)
            .attr('y', -10);
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
            for (let j = 0; j < focusUserScaleY.domain().length; j += 1) {
              boxGroup.append('line')
                .attr('x1', 0)
                .attr('y1', j * focusUserScaleY.bandwidth())
                .attr('x2', boxWidth)
                .attr('y2', j * focusUserScaleY.bandwidth())
                .attr('stroke-width', '0.5px')
                .attr('stroke', 'black');
            }
          }
        }

        for (let i = 0; i < datas.length; i += 1) {
          focus.select(`.${datas[i].id}`)
            .selectAll('g')
            .attr('visibility', d => (focusUserScaleY(datas[i].id) !== undefined && focusArticleScaleY(d.article_id) !== undefined ? 'visible' : 'hidden'))
            .each((d, index, nodes) => {
              const articleID = d3.select(nodes[index]).datum().article_id;
              if (focusUserScaleY(datas[i].id) !== undefined && focusArticleScaleY(articleID) !== undefined) {
                d3.select(nodes[index])
                  .attr('transform', `translate(0, ${focusArticleScaleY(d.article_id)})`);
                const postYear = new Date(d.date).getFullYear();
                d3.select(nodes[index]).selectAll('text').remove();
                d3.select(nodes[index]).selectAll('rect')
                  .attr('height', focusUserScaleY.bandwidth())
                  .attr('width', e => (e.push_userid ? Math.max(boxWidth / 20, 1) : boxWidth))
                  .attr('x', (e) => {
                    if (!e.push_userid) return 0;
                    const date = dateFormat(e);
                    const commentTime = new Date(new Date(date).setFullYear(postYear));
                    const timeDiff = commentTime - new Date(d.date);
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
                    return nonLinearTimeScale(timeGroup) + timeOffSet;
                  })
                  .attr('y', (e) => {
                    if (!e.push_userid) return focusUserScaleY(datas[i].id);
                    // const date = dateFormat(e);
                    // const commentTime = new Date(new Date(date).setFullYear(postYear));
                    // const timeDiff = commentTime - new Date(d.date);
                    // const timeGroup = timeDiff / 1000 / 60;
                    // let timeOffSet = 0;
                    // let start = 0;
                    // let end = 5;
                    // if (timeGroup <= 5) {
                    //   timeOffSet = 0;
                    //   start = 0;
                    // } else if (timeGroup <= 30) {
                    //   timeOffSet = yScale.bandwidth() / 5;
                    //   start = 5;
                    //   end = 30;
                    // } else if (timeGroup <= 60) {
                    //   timeOffSet = 2 * (yScale.bandwidth() / 5);
                    //   start = 30;
                    //   end = 60;
                    // } else if (timeGroup <= 180) {
                    //   timeOffSet = 3 * (yScale.bandwidth() / 5);
                    //   start = 60;
                    //   end = 180;
                    // } else {
                    //   timeOffSet = 4 * (yScale.bandwidth() / 5);
                    //   start = 180;
                    //   end = 1440;
                    // }
                    // const nonLinearTimeScale = d3.scaleLinear()
                    //   .domain([start, end]).range([0, yScale.bandwidth() / 5]);
                    // return nonLinearTimeScale(timeGroup) + timeOffSet + yScale(datas[i].id);
                    return focusUserScaleY(datas[i].id);
                  });
              // if (focusScaleX.bandwidth() > 100 && d.messages) {
              //   console.log(d);
              //   d3.select(nodes[index]).selectAll('text')
              //     .data(d.messages.filter(e => e.push_userid === datas[i].id))
              //     .enter()
              //     .append('text')
              //     .text(e => e.push_ipdatetime)
              //     .style('text-anchor', 'end')
              //     .attr('dy', 5)
              //     .attr('x', focusScaleX.bandwidth())
              //     .attr('y', (e) => {
              //       if (!e.push_userid) return yScale(datas[i].id);
              //       const date = dateFormat(e);
              //       const commentTime = new Date(new Date(date).setFullYear(postYear));
              //       const timeDiff = commentTime - new Date(d.date);
              //       const timeGroup = timeDiff / 1000 / 60;
              //       let timeOffSet = 0;
              //       let start = 0;
              //       let end = 5;
              //       if (timeGroup <= 5) {
              //         timeOffSet = 0;
              //         start = 0;
              //       } else if (timeGroup <= 30) {
              //         timeOffSet = yScale.bandwidth() / 5;
              //         start = 5;
              //         end = 30;
              //       } else if (timeGroup <= 60) {
              //         timeOffSet = 2 * (yScale.bandwidth() / 5);
              //         start = 30;
              //         end = 60;
              //       } else if (timeGroup <= 180) {
              //         timeOffSet = 3 * (yScale.bandwidth() / 5);
              //         start = 60;
              //         end = 180;
              //       } else {
              //         timeOffSet = 4 * (yScale.bandwidth() / 5);
              //         start = 180;
              //         end = 1440;
              //       }
              //       const nonLinearTimeScale = d3.scaleLinear()
              //         .domain([start, end]).range([0, yScale.bandwidth() / 5]);
              //       return nonLinearTimeScale(timeGroup) + timeOffSet + yScale(datas[i].id);
              //     });
              // }
              }
            });
          // .enter()
          // .exit()
          // .remove();
          highlightArticle_id.forEach((articleID) => {
            const className = String(articleID).replace(/\./g, '');
            if (!datas[i].repliedArticle.some(e => e.article_id === articleID)) {
              focus.select(`.${datas[i].id}`)
                .selectAll(`.${className}`)
                .data([{ article_id: articleID }])
                .enter()
                .append('g')
                .attr('class', className)
                .append('rect')
                // .attr('x', focusScaleX(articleID))
                .attr('y', focusUserScaleY(datas[i].id))
                .attr('width', boxWidth)
                .attr('height', 300)
                .attr('fill', 'lightgray');
            }
          });
        }
      }
      function _brushed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return; // ignore brush-by-zoom
        const s = d3.event.selection || contextYScale.range();
        const newDomainX = newUserAxisValues.filter(e => datas.find(e1 => e1.id === e).community === communityIndex);
        const newUserDomainY = newUserAxisValues.filter(e => datas.find(e1 => e1.id === e).community === communityIndex);
        focusScaleX.domain(newDomainX);
        focusUserScaleY.domain(newUserDomainY);
        // const newDomainY = newUserAxisValues.slice(s[0][1] / contextYScale.bandwidth(), s[1][1] / contextYScale.bandwidth());
        // const newDomainY = newUserAxisValues.slice();
        const newDomainY = highlightArticle_id.slice(s[0][0] / contextXScale.bandwidth(), s[1][0] / contextXScale.bandwidth());
        const newArticleDomainY = highlightArticle_id.slice(s[0][0] / contextXScale.bandwidth(), s[1][0] / contextXScale.bandwidth());
        // console.log(newDomainY);
        focusArticleScaleY.domain(newArticleDomainY);
        yScale.domain(newDomainY);

        focusLineGroup.selectAll('*').remove();
        focusLineGroup.append('g');
        // horizontal
        for (let i = 0; i <= yScale.domain().length; i += 1) {
          focusLineGroup.append('line')
            .attr('x1', 0)
            .attr('y1', i * yScale.bandwidth())
            .attr('x2', focusScaleX.range()[1])
            .attr('y2', i * yScale.bandwidth())
            .attr('stroke-width', '0.5px')
            .attr('stroke', 'black');
        }
        // vertical
        for (let i = 0; i <= focusScaleX.domain().length * 5; i += 1) {
          focusLineGroup.append('line')
            .attr('x1', i * focusScaleX.bandwidth() / 5)
            .attr('y1', 0)
            .attr('x2', i * focusScaleX.bandwidth() / 5)
            .attr('y2', yScale.range()[1])
            .attr('stroke-width', '0.5px')
            .attr('stroke', i % 5 ? 'lightgray' : 'black');
        }
        // focus.select('.area').attr('d', area);
        focus.select('.axis--y')
          .call(d3.axisLeft(yScale));
        focus.select('.axis--x')
          .call(d3.axisBottom(focusScaleX)
            .tickFormat((d, i) => highlightArticles.find(e => e.article_id === d).article_title));
        focus.select('.axis--x')
          .selectAll('text')
          .attr('dy', '.35em')
          .style('writing-mode', 'tb')
          .style('text-anchor', 'start');

        // for (let i = 0; i < datas.length; i += 1) {
        //   focus.select(`.${datas[i].id}`)
        //     .selectAll('g')
        //     .attr('visibility', d => (yScale(datas[i].id) !== undefined && focusScaleX(d.article_id) !== undefined ? 'visible' : 'hidden'))
        //     .each((d, index, nodes) => {
        //       const articleID = d3.select(nodes[index]).datum().article_id;
        //       if (yScale(datas[i].id) !== undefined && focusScaleX(articleID) !== undefined) {
        //         d3.select(nodes[index])
        //           .attr('transform', `translate(${focusScaleX(d.article_id)},0)`);
        //         const postYear = new Date(d.date).getFullYear();
        //         d3.select(nodes[index]).selectAll('text').remove();
        //         d3.select(nodes[index]).selectAll('rect')
        //           .attr('height', yScale.bandwidth())
        //           .attr('width', e => (e.push_userid ? Math.max(focusScaleX.bandwidth() / 20, 1) : focusScaleX.bandwidth()))
        //           .attr('x', (e) => {
        //             if (!e.push_userid) return 0;
        //             const date = dateFormat(e);
        //             const commentTime = new Date(new Date(date).setFullYear(postYear));
        //             const timeDiff = commentTime - new Date(d.date);
        //             const timeGroup = timeDiff / 1000 / 60;
        //             let timeOffSet = 0;
        //             let start = 0;
        //             let end = 5;
        //             if (timeGroup <= 5) {
        //               timeOffSet = 0;
        //               start = 0;
        //             } else if (timeGroup <= 30) {
        //               timeOffSet = focusScaleX.bandwidth() / 5;
        //               start = 5;
        //               end = 30;
        //             } else if (timeGroup <= 60) {
        //               timeOffSet = 2 * (focusScaleX.bandwidth() / 5);
        //               start = 30;
        //               end = 60;
        //             } else if (timeGroup <= 180) {
        //               timeOffSet = 3 * (focusScaleX.bandwidth() / 5);
        //               start = 60;
        //               end = 180;
        //             } else {
        //               timeOffSet = 4 * (focusScaleX.bandwidth() / 5);
        //               start = 180;
        //               end = 1440;
        //             }
        //             const nonLinearTimeScale = d3.scaleLinear()
        //               .domain([start, end]).range([0, focusScaleX.bandwidth() / 5]);
        //             return nonLinearTimeScale(timeGroup) + timeOffSet;
        //           })
        //           .attr('y', (e) => {
        //             if (!e.push_userid) return yScale(datas[i].id);
        //             // const date = dateFormat(e);
        //             // const commentTime = new Date(new Date(date).setFullYear(postYear));
        //             // const timeDiff = commentTime - new Date(d.date);
        //             // const timeGroup = timeDiff / 1000 / 60;
        //             // let timeOffSet = 0;
        //             // let start = 0;
        //             // let end = 5;
        //             // if (timeGroup <= 5) {
        //             //   timeOffSet = 0;
        //             //   start = 0;
        //             // } else if (timeGroup <= 30) {
        //             //   timeOffSet = yScale.bandwidth() / 5;
        //             //   start = 5;
        //             //   end = 30;
        //             // } else if (timeGroup <= 60) {
        //             //   timeOffSet = 2 * (yScale.bandwidth() / 5);
        //             //   start = 30;
        //             //   end = 60;
        //             // } else if (timeGroup <= 180) {
        //             //   timeOffSet = 3 * (yScale.bandwidth() / 5);
        //             //   start = 60;
        //             //   end = 180;
        //             // } else {
        //             //   timeOffSet = 4 * (yScale.bandwidth() / 5);
        //             //   start = 180;
        //             //   end = 1440;
        //             // }
        //             // const nonLinearTimeScale = d3.scaleLinear()
        //             //   .domain([start, end]).range([0, yScale.bandwidth() / 5]);
        //             // return nonLinearTimeScale(timeGroup) + timeOffSet + yScale(datas[i].id);
        //             return yScale(datas[i].id);
        //           });
        //       // if (focusScaleX.bandwidth() > 100 && d.messages) {
        //       //   console.log(d);
        //       //   d3.select(nodes[index]).selectAll('text')
        //       //     .data(d.messages.filter(e => e.push_userid === datas[i].id))
        //       //     .enter()
        //       //     .append('text')
        //       //     .text(e => e.push_ipdatetime)
        //       //     .style('text-anchor', 'end')
        //       //     .attr('dy', 5)
        //       //     .attr('x', focusScaleX.bandwidth())
        //       //     .attr('y', (e) => {
        //       //       if (!e.push_userid) return yScale(datas[i].id);
        //       //       const date = dateFormat(e);
        //       //       const commentTime = new Date(new Date(date).setFullYear(postYear));
        //       //       const timeDiff = commentTime - new Date(d.date);
        //       //       const timeGroup = timeDiff / 1000 / 60;
        //       //       let timeOffSet = 0;
        //       //       let start = 0;
        //       //       let end = 5;
        //       //       if (timeGroup <= 5) {
        //       //         timeOffSet = 0;
        //       //         start = 0;
        //       //       } else if (timeGroup <= 30) {
        //       //         timeOffSet = yScale.bandwidth() / 5;
        //       //         start = 5;
        //       //         end = 30;
        //       //       } else if (timeGroup <= 60) {
        //       //         timeOffSet = 2 * (yScale.bandwidth() / 5);
        //       //         start = 30;
        //       //         end = 60;
        //       //       } else if (timeGroup <= 180) {
        //       //         timeOffSet = 3 * (yScale.bandwidth() / 5);
        //       //         start = 60;
        //       //         end = 180;
        //       //       } else {
        //       //         timeOffSet = 4 * (yScale.bandwidth() / 5);
        //       //         start = 180;
        //       //         end = 1440;
        //       //       }
        //       //       const nonLinearTimeScale = d3.scaleLinear()
        //       //         .domain([start, end]).range([0, yScale.bandwidth() / 5]);
        //       //       return nonLinearTimeScale(timeGroup) + timeOffSet + yScale(datas[i].id);
        //       //     });
        //       // }
        //       }
        //     });
        //   // .enter()
        //   // .exit()
        //   // .remove();
        //   highlightArticle_id.forEach((articleID) => {
        //     const className = String(articleID).replace(/\./g, '');
        //     if (!datas[i].repliedArticle.some(e => e.article_id === articleID)) {
        //       focus.select(`.${datas[i].id}`)
        //         .selectAll(`.${className}`)
        //         .data([{ article_id: articleID }])
        //         .enter()
        //         .append('g')
        //         .attr('class', className)
        //         .append('rect')
        //         // .attr('x', focusScaleX(articleID))
        //         .attr('y', yScale(datas[i].id))
        //         .attr('width', focusScaleX.bandwidth())
        //         .attr('height', 300)
        //         .attr('fill', 'lightgray');
        //     }
        //   });

        //   // if (focusScaleX.bandwidth() > 200) {

        //   // }
        // }
      }
      function buildArticleTree(articleArr) {
        const copyArtArr = JSON.parse(JSON.stringify(articleArr));
        // copyArtArr.sort((a, b) => ((new Date(a.date) - new Date(b.date)) > 0 ? 1 : -1));
        const arr = copyArtArr.filter(e => e.article_title[0] !== 'R');
        arr.forEach((e) => { e.children = []; });
        console.log(arr);
        copyArtArr.filter(e => e.article_title[0] === 'R').forEach((a) => {
          console.log(a);
          console.log(a.article_title.substring(4));
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
      function drawArticlesWithTypeComment() {
        context.append('g')
          .selectAll('rect')
          .data(articlesWithTypeComment)
          .enter()
          .append('g')
          .each((d, index, nodes) => {
            d3.select(nodes[index])
              .selectAll('rect')
              .data([d.commentType.push, d.commentType.neutral, d.commentType.boo])
              .enter()
              .append('rect')
              .attr('x', contextXScale(d.article_id))
              .attr('y', (d2, index2) => {
                if (index2 === 0) return contextYScale(3) - contextYScale(d2.length / communityUserCount);
                if (index2 === 1) return contextYScale(3) - contextYScale((d.commentType.push.length + d.commentType.neutral.length) / communityUserCount);
                return contextYScale(3) - contextYScale((d.commentType.push.length + d.commentType.neutral.length + d.commentType.boo.length) / communityUserCount);
              })
              .attr('width', contextXScale.bandwidth())
              .attr('height', d2 => contextYScale(d2.length / communityUserCount))
              .attr('fill', (d2, index2) => {
                if (index2 === 0) return color(3); // push
                if (index2 === 1) return color(4); // neutral
                return color(1); // boo
              })
              .append('title')
              .text(d2 => (d2.length / communityUserCount));
          });
      }

      function drawArticleTree(tree, userGroupIndex) {
        // const groupLegend = d3.select('#timeLine')
        //   .append('g').attr('class', 'groupLegends')
        //   .attr('transform', `translate(${margin.left}, ${margin.top})`);
        // groupLegend.selectAll('rect')
        //   .data(groupIndex)
        //   .enter()
        //   .append('g')
        //   .attr('class', (d, index) => `group_${index}`)
        //   .attr('transform', (d, index) => `translate(${100 * (index % 4)}, ${20 * Math.floor(index / 4)})`)
        //   // .attr('transform', (d, index) => `translate(0 ${20 * index})`)
        //   .each((d, index, nodes) => {
        //     // console.log(d);
        //     d3.select(nodes[index])
        //       .append('text')
        //       .text(`Group ${index}`)
        //       .attr('x', 10);

        //     d3.select(nodes[index])
        //       .append('circle')
        //       .attr('cx', 0)
        //       .attr('cy', -5)
        //       .attr('fill', color(index))
        //       .attr('r', 5);
        //   });
        const contextLegend = context.append('g')
          .attr('class', 'contextLegend')
          .attr('transform', `translate(0, ${-margin.top * 4 / 3})`);
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
          .selectAll('rect')
          .data(tree)
          .enter()
          .append('g')
          .attr('transform', d => `translate(0,${contextYScale(d.article_id) + contextYScale.bandwidth() / 2})`)
          .each((d, index, nodes) => {
            let depth = 1;
            const recursion = (_d, _index, _nodes) => {
              if (!_d) return;
              // console.log(`aritcle_id: ${_d.article_id}, article_title: ${_d.article_title}`);

              d3.select(_nodes[_index])
                .append('path')
                .attr('transform', `translate(${contextXScale(depth) + contextXScale.bandwidth() / 2},0)`)
                .attr('d', d3.arc()
                  .startAngle(0)
                  .endAngle(Math.PI * 2)
                  .innerRadius(10)
                  .outerRadius(12.5))
                .attr('fill', 'lightgray');


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
                .append('g')
                .attr('transform', `translate(${contextXScale(depth) + contextXScale.bandwidth() / 2},0)`)
                .append('path')
                .attr('d', d3.arc()
                  .innerRadius(0)
                  .outerRadius(15))
                .attr('fill', (_d2, _index2) => {
                  if (_index2 === 0) return color(3); // push
                  if (_index2 === 1) return color(1); // boo
                  if (_index2 === 2) return color(4); // neutral
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
                .attr('fill', 'white');

              depth += 1;
              if (d.children) recursion(d.children[depth - 2], _index, _nodes);
            };
            recursion(d, index, nodes);
          });
      }
      // function zoomed() {
      //   if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush')
      //     return; // ignore zoom-by-brush
      //   let t = d3.event.transform;
      //   x.domain(t.rescaleX(x2).domain());
      //   focus.select('.area').attr('d', area);
      //   focus.select('.axis--x').call(xAxis);
      //   context.select('.brush').call(brush.move, x.range().map(t.invertX, t));
      // }
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
    function computeScaleMaximum() {
      let maxSame = 0;
      let maxArticles = 0;
      for (let i = 0; i < permuted_mat.length; i += 1) {
        for (let j = 0; j < permuted_mat.length; j += 1) {
          const xUserID = newUserAxisValues[j];
          const yUserID = newUserAxisValues[i];
          const xUser = datas.find(e => e.id === xUserID);
          const yUser = datas.find(e => e.id === yUserID);
          if (i !== j) {
            const sameArticlesNum = xUser.repliedArticle.filter(
              value1 => yUser.repliedArticle.some(
                value2 => value2.article_id === value1.article_id,
              ),
            ).length;
            maxSame = sameArticlesNum > maxSame ? sameArticlesNum : maxSame;
          }
          maxArticles = xUser.repliedArticle.length > maxArticles
            ? xUser.repliedArticle.length : maxArticles;
          maxArticles = yUser.repliedArticle.length > maxArticles
            ? yUser.repliedArticle.length : maxArticles;
        }
      }
      return [maxSame, maxArticles];
    }

    function drawUserGroupBipartiteRelations() {
      const radialGroupMargin = 50;
      const radial = leftSvg.select('.radialGroup');
      const numOfArtCom = Math.max(...articlesCommunity.map(e => e.community)) + 1;
      const numOfArtOfEachComunity = [];
      for (let i = 0; i < numOfArtCom; i += 1) {
        const tempCommunity = articlesCommunity.filter(e => e.community === i);
        numOfArtOfEachComunity.push(tempCommunity);
      }
      console.log('numOfArtOfEachComunity', numOfArtOfEachComunity);
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
      const articleGroupWidthScale = d3.scaleLinear().domain([1, filteredArticles.length]).range([10, 500]);
      const articleGroupIndexArray = [];
      const articleGroupYScale = [0];
      const padding = 2;
      for (let i = 0; i < numOfArtCom; i += 1) {
        articleGroupIndexArray.push(i);
        if (i < numOfArtCom - 1) {
          articleGroupYScale.push(padding + articleGroupYScale[i] + articleGroupWidthScale(numOfArtOfEachComunity[i].length));
        }
      }
      for (let i = 0; i < numOfUserCom; i += 1) {
        const groupRadial = radial.append('g')
          .attr('class', `group_${i}`);
        let numOfUser = 0;
        if (i === numOfUserCom - 1) numOfUser = newUserAxisValues.length - comunityIndexY[i];
        else numOfUser = comunityIndexY[i + 1] - comunityIndexY[i];
        for (let j = 0; j < numOfArtCom; j += 1) {
          groupRadial.append('rect')
            .attr('y', articleGroupYScale[j])
            .attr('x', positionScale[comunityIndexY[i]])
            .attr('height', articleGroupWidthScale(numOfArtOfEachComunity[j].length))
            .attr('width', () => {
              const tem = comunityIndexY[i];
              let nex = positionScale.length - 1;
              if (comunityIndexY[i + 1]) nex = comunityIndexY[i + 1];
              console.log(positionScale[tem], positionScale[nex]);
              return positionScale[nex] - positionScale[tem];
            })
            .attr('fill', 'white')
            .attr('stroke', color(i))
            .attr('stroke-width', '0.5px');
        }
        // group legend
        // groupRadial.append('text')
        //   .text(`group_${i}`)
        //   .attr('x', -80)
        //   .attr('y', -65);
        // groupRadial.append('circle')
        //   .attr('cx', -90)
        //   .attr('cy', -67.5)
        //   .attr('r', 5)
        //   .attr('fill', color(i));
        drawRelationRatio(i, numOfUser);
      }
      function drawRelationRatio(index, userCount) {
        const groupRadial = radial.select(`.group_${index}`);
        const communityIndexDatas = datas.filter(e => e.community === index);
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
        // console.log('communityEachLevelCount', communityEachLevelCount);
        const tem = comunityIndexY[index];
        let nex = positionScale.length - 1;
        if (comunityIndexY[index + 1]) nex = comunityIndexY[index + 1];
        const maxWidth = positionScale[nex] - positionScale[tem];
        for (let i = 0; i < communityEachLevelCount.length; i += 1) {
          const radialColor = d3.scaleLinear().domain([-1, 4]).range(['white', color(index)]);
          const tempCommunity = communityEachLevelCount[i].community;
          groupRadial.append('g')
            .selectAll('path')
            .data(communityEachLevelCount[i].level)
            .enter()
            .append('rect')
            .attr('y', articleGroupYScale[tempCommunity])
            .attr('x', (d) => {
              const offset = (maxWidth) * (1 - d.length / numOfArtOfEachComunity[tempCommunity].length);
              return positionScale[tem] + offset;
            })
            .attr('height', articleGroupWidthScale(numOfArtOfEachComunity[tempCommunity].length))
            .attr('width', d => maxWidth * (d.length / numOfArtOfEachComunity[tempCommunity].length))
            .attr('fill', (d, levelIndex) => radialColor(levelIndex))
            .on('click', (d, levelIndex) => rectClick(d, index));
        }
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
          return arr;
        }
      }
    }
  }

  function computeAuthorArray(articleArr) {
    const arr = [];
    articleArr.forEach((a) => {
      const author = arr.find(e => e.id === a.author);
      if (author) author.articles.push(a);
      else arr.push({ id: a.author, articles: [a] });
    });
    return arr;
  }

  function relationToMatrix(sim, users) {
    const mat = [];
    const origMat = [];
    for (let i = 0; i < users.length; i += 1) {
      mat.push(Array(users.length).fill(1));
      origMat.push(Array(users.length).fill(1));
    }

    sim.forEach((e) => {
      const sourceUserIndex = users.findIndex(u => u === e.source);
      const targetUserIndex = users.findIndex(u => u === e.target);
      mat[sourceUserIndex][targetUserIndex] = e.value;
      mat[targetUserIndex][sourceUserIndex] = e.value;
      origMat[sourceUserIndex][targetUserIndex] = e.value;
      origMat[targetUserIndex][sourceUserIndex] = e.value;
    });

    // console.log('origMat', origMat);
    return [mat, origMat];
  }

  function matrixReordering(mat, origMat, userAxis, users) {
    // console.log(mat, origMat, userAxis, users);
    for (let i = 0; i < users.length; i += 1) {
      userAxis.push(Array(users.length).fill(''));
    }

    const gra = reorder.mat2graph(mat);
    const perm = reorder.spectral_order(gra);

    // console.log('length', gra.components().length);
    // for (let j = 0; j < 2; j += 1) {
    //   let lap = reorder.laplacian(gra, gra.components()[0]);
    //   console.log('laplacian', lap);
    //   let fie = reorder.fiedler_vector(lap);
    //   console.log('fiedler', fie);
    //   let p = reorder.sort_order(fie);
    //   console.log('sort_order', p);
    //   let order = [];
    //   order = order.concat(reorder.permute(gra.components()[0], p));
    //   console.log('order', order);
    // }
    const orig_gra = reorder.mat2graph(origMat);
    const orig_perm = reorder.spectral_order(orig_gra);
    // console.log('permutation', perm);
    let tempUser = [...users];
    for (let j = 0; j < users.length; j += 1) {
      // console.log(tempUser, perm, j);
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

    // let originalMat = reorder.permute(origMat, orig_perm);
    // originalMat = reorder.transpose(originalMat);
    // originalMat = reorder.permute(originalMat, orig_perm);
    // originalMat = reorder.transpose(originalMat);

    // for (let i = 0; i < 10; i += 1) {
    //   gra = reorder.mat2graph(permutedMat);
    //   perm = reorder.spectral_order(gra);
    //   console.log(perm);
    //   for (let j = 0; j < user.length; j += 1) {
    //     userAxis[j] = tempUser[perm[j]];
    //   }
    //   tempUser = [...userAxis];
    //   // console.log(userAxis);
    //   permutedMat = reorder.permute(permutedMat, perm);
    //   permutedMat = reorder.transpose(permutedMat);
    //   permutedMat = reorder.permute(permutedMat, perm);
    //   permutedMat = reorder.transpose(permutedMat);
    //   originalMat = reorder.permute(originalMat, perm);
    //   originalMat = reorder.transpose(originalMat);
    //   originalMat = reorder.permute(originalMat, perm);
    //   originalMat = reorder.transpose(originalMat);
    // }
    // let permuted_mat = matrix;
    // let userAxis = user;
    // console.log('permutedMatrix', permutedMat);
    // console.log('userAxis', userAxis);
    return [permutedMat, originalMat];
  }

  function matrixReorderingByCommunity(mat, origMat, com, userAxis, users) {
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
    for (let j = 0; j < users.length; j += 1) {
      userAxis[j] = tempUser[perm[j]];
    }
    let permutedMat = reorder.permute(mat, perm);
    permutedMat = reorder.transpose(permutedMat);
    permutedMat = reorder.permute(permutedMat, perm);
    permutedMat = reorder.transpose(permutedMat);
    return [permutedMat, origMat];
    // return [mat, origMat];
  }

  function getAllAuthorId(d) {
    const authorID = [];
    let authorList = [];
    d.forEach((usr) => {
      usr.reply.forEach((re) => {
        if (!authorList.some(e => e.id === re.author)) {
          authorList.push({ id: re.author, count: re.count });
        } else {
          authorList.find(e => e.id === re.author).count += re.count;
        }
      });
    });
    authorList = authorList.sort((a, b) => (a.count < b.count ? 1 : -1));
    authorList.forEach((e) => {
      authorID.push(e.id);
    });
    // console.log(authorList);
    return authorID;
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

  // function dragstarted(d) {
  //   if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  //   d.fx = d.x;
  //   d.fy = d.y;
  // }

  // function dragged(d) {
  //   d.fx = d3.event.x;
  //   d.fy = d3.event.y;
  // }

  // function dragended(d) {
  //   if (!d3.event.active) simulation.alphaTarget(0);
  //   d.fx = null;
  //   d.fy = null;
  // }

  // function ticked() {
  //   link
  //     .attr('x1', d => d.source.x)
  //     .attr('y1', d => d.source.y)
  //     .attr('x2', d => d.target.x)
  //     .attr('y2', d => d.target.y);

  //   node
  //     .attr('transform', d => `translate(${d.x},${d.y})`);
  // }

  function computeArticleSimilarity(articleArray, userArray) {
    const array = [];
    for (let i = 0; i < articleArray.length; i += 1) {
      const temp = articleArray[i];
      for (let j = i + 1; j < articleArray.length; j += 1) {
        const next = articleArray[j];
        const tempdiff = temp.messages.filter(
          o1 => next.messages.filter(o2 => o2.push_userid === o1.push_userid).length === 0,
        );
        const nextdiff = next.messages.filter(
          o1 => temp.messages.filter(o2 => o2.push_userid === o1.push_userid).length === 0,
        );
        const intersectUsers = temp.messages.length - tempdiff.length;
        const nextintersectArticles = next.messages.length - nextdiff.length;
        const similarity = intersectUsers / (temp.messages.length + next.messages.length - intersectUsers);
        if (similarity) {
          array.push({
            source: temp.article_id,
            target: next.article_id,
            value: similarity,
          });
        }
      }
    }
    return array;
  }
  function articlesOrdering(articleArray, articlesWithcommunity) {
    let array = [];
    // const clone = obj => Object.assign({}, obj);
    // const renameKey = (object, key, newKey) => {
    //   const clonedObj = clone(object);
    //   const targetKey = clonedObj[key];
    //   delete clonedObj[key];
    //   clonedObj[newKey] = targetKey;
    //   return clonedObj;
    // };
    for (let i = 0; i < articlesWithcommunity.length; i += 1) {
      const filtered = articlesWithcommunity.filter(e => e.community === i);
      const temp = articleArray.filter(e => filtered.some(e1 => e1.id === e.article_id));
      console.log(filtered, temp);
      array = array.concat(temp);
    }
    return array;
  }
  function computeUserSimilarityByArticles(userAuthorRelationShipArr) {
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
        const similarity = intersectArticles / (temp.length + next.length - intersectArticles);
        userListArray.push({
          source: userAuthorRelationShipArr[i].id,
          target: userAuthorRelationShipArr[j].id,
          value: similarity,
        });
      }
    }
    return userListArray;
  }
  function filterAlwaysNonSimilarUser(datas, users, similaritys, threshold) {
    const copyUsers = users.slice();
    const isBelowThreshold = currentValue => currentValue.value < threshold;
    copyUsers.forEach((e) => {
      const filteredSimilarity = similaritys.filter(e1 => e1.source === e || e1.target === e);
      if (filteredSimilarity.filter(e1 => e1.source !== e1.target).every(isBelowThreshold)) {
        // console.log(e);
        similaritys = similaritys.filter(e1 => !(e1.source === e || e1.target === e));
        datas = datas.filter(e1 => e1.id !== e);
        users = users.filter(e1 => e1 !== e);
      }
    });
    return [datas, users, similaritys];
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
}

export { userSimilarityGraph };
