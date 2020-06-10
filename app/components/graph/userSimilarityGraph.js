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
import netClustering from 'netclustering';
import CheckboxGroup from 'antd/lib/checkbox/Group';
import jLouvain from './jLouvain';
import { userActivityTimeline } from './userActivityTimeline';

export default function userSimilarityGraph(data, svg, user, articles) {
  // console.log(user);
  const svgScale = d3.scaleLinear().domain([1, 100]).range([1, 0.1]);
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
    top: 30, right: 30, bottom: 30, left: 30,
  };
  const width = 1300 - margin.left - margin.right;
  const height = 450 - margin.top - margin.bottom;

  // Labels of row and columns
  const myGroups = getAllAuthorId(data); // author
  const myVars = user;
  const clickedUser = [];
  const similarThresh = 0.1;
  adjacencyMatrixNoAuthor(similarThresh);
  // heatMapWithAuthor();

  function adjacencyMatrixNoAuthor(thresh) {
    // svg.attr('height', h);
    svg.attr('width', w);
    svg.call(d3.zoom()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 8])
      .on('zoom', zoomed));
    svg = svg.append('g')
      .attr('class', 'position');
    const group = svg.append('g')
      .attr('transform', 'translate(0,0)');
    function zoomed() {
      group.attr('transform', (d, index, nodes) => {
        // const transformX = d3.select(nodes[index]).attr('transform');
        // const translateX = transformX.substring(transformX.indexOf('(') + 1, transformX.indexOf(')')).split(',');
        // const offSetX = parseInt(translateX[0], 10);
        // console.log(d3.event.transform.x);
        // return `scale (${d3.event.transform.k}) translate(${offSetX + d3.event.transform.x},${d3.event.transform.y})`;
        return d3.event.transform;
      });
    }
    const color = d => d3.schemeTableau10[d + 1];
    // Article Similarity
    const similarity = computeUserSimilarityByArticles(data, user);
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
    console.log(articleSimilarity);
    const articleIds = filteredArticles.map(e => e.article_id);
    const articlesCommunity = jLouvainClustering(articleIds, articleSimilarity);
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
    const [
      permuted_mat,
      permuted_origMat,
    ] = matrixReordering(matrix, origMatrix, newUserAxisValues, users);
    const [
      secondOrdering_mat,
      secondOrdering_origMat,
    ] = matrixReorderingByCommunity(permuted_mat, permuted_origMat,
      community, newUserAxisValues, users);

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
    const x = d3.scaleBand()
      .range([0, axisDomain.length * gridSize])
      .domain(axisDomain);
    d3.select('.position').attr('transform', `scale(1) translate(${w / 2 - x.range()[1] / 2},0)`);
    const leftSvg = group.append('g')
      .attr('class', 'leftSvg')
      .attr('transform', `scale(${svgScale(datas.length)}) translate(0,100)`);

    const y = d3.scaleBand()
      .range([0, axisDomain.length * gridSize])
      .domain(axisDomain);

    builduserGroupAxis(newUserAxisValues);

    // Build color scale
    const userColor = userColorScaleArray(datas);
    const myColor = d3.scaleLinear()
      .range([d3.interpolateYlOrRd(0), d3.interpolateYlOrRd(0.8)])
      .domain([0, 1]);
    const leftMyColor = d3.scaleLinear()
      // .range([d3.interpolateYlOrRd(0), d3.interpolateYlOrRd(0.8)])
      .range(['white', 'black'])
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
        .style('top', `${d3.event.pageY}px`);
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

    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);
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
          if (i > index || xUser.community === yUser.community) {
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
                  if (i < index) return color(xUser.community);
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

    // find user group index
    const groupIndex = [];
    newUserAxisValues.forEach((e, index) => {
      const tempCom = community.find(e1 => e1.id === e).community;
      const existedCommunity = groupIndex.find(e1 => e1.community === tempCom);
      if (existedCommunity) {
        existedCommunity.num += 1;
      } else {
        groupIndex.push({ community: tempCom, num: 1, index });
      }
    });
    console.log('groupIndex:', groupIndex);
    // draw user group heatmap
    for (let i = 0; i < groupIndex.length - 1; i += 1) {
      const rectY = groupIndex[i].index;
      for (let j = i + 1; j < groupIndex.length; j += 1) {
        const rectX = groupIndex[j].index;
        leftSvg.append('g')
          .attr('class', `community${groupIndex[i].community}${groupIndex[j].community}`)
          .append('rect')
          .attr('x', x(rectX))
          .attr('y', y(rectY))
          .attr('width', groupIndex[j].num * gridSize)
          .attr('height', groupIndex[i].num * gridSize)
          .attr('fill', () => {
            let totalSim = 0;
            for (let k = rectY; k < rectY + groupIndex[i].num; k += 1) {
              for (let l = rectX; l < rectX + groupIndex[j].num; l += 1) {
                totalSim += secondOrdering_mat[k][l];
              }
            }
            // console.log(totalSim);
            return leftMyColor(totalSim / (groupIndex[i].num * groupIndex[j].num));
          });
      }
    }
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
    // d3.select('#timeLine').attr('height', newUserAxisValues.length * gridSize + 100 + focusHeight + 300);
    drawUserRepliedArticleMatrix(articlesOrderByCommunity);
    // drawUserGroupRadial();
    drawUserGroupBipartiteRelations();
    // drawUserRepliedAuthorMatrix(authorArr);
    // drawAuthorArticleMatrix(articlesOrderByCommunity, authorArr);

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

      // // vertical line
      // const lineGroup = articleGroup.append('g')
      //   .attr('class', 'lineGroup');
      // for (let i = 0; i < article_titles.length; i += 1) {
      //   lineGroup.append('line')
      //     .attr('x1', i * xScale.bandwidth())
      //     .attr('x2', i * xScale.bandwidth())
      //     .attr('y1', 0)
      //     .attr('y2', newUserAxisValues.length * gridSize)
      //     .attr('stroke-width', '1px')
      //     .attr('stroke', 'black');
      // }
      // // horizontal line
      // for (let i = 0; i < newUserAxisValues.length; i += 1) {
      //   lineGroup.append('line')
      //     .attr('y1', (i + 1) * gridSize)
      //     .attr('y2', (i + 1) * gridSize)
      //     .attr('x1', 0)
      //     .attr('x2', article_titles.length * gridSize)
      //     .attr('stroke-width', '0.5px')
      //     .attr('stroke', 'black');
      // }
      const focusOffSetX = -w / 2 + (newUserAxisValues.length * gridSize) / 2 + 400;
      const focusOffsetY = svgScale(datas.length) * (newUserAxisValues.length * gridSize + 120);
      d3.select('#focus').selectAll('*').remove();
      const focus = d3.select('#focus').append('g')
        .attr('class', 'focus')
        .attr('transform', `translate(${0},${50})`);
      const context = svg.append('g')
        .attr('class', 'context');
      for (let i = 0; i < datas.length; i += 1) {
        articleGroup.append('g')
          .attr('class', datas[i].id)
          .selectAll('circle')
          .data(datas[i].repliedArticle)
          .enter()
          .append('g', d => d.article_id)
          .each((d, index, nodes) => {
            const postYear = new Date(d.date).getFullYear();
            const commentTimeGroup = [[], [], [], [], []];
            d.messages.filter(e => e.push_userid === datas[i].id).forEach((mes) => {
              const date = dateFormat(mes);
              const commentTime = new Date(new Date(date).setFullYear(postYear));
              const timeDiff = commentTime - new Date(d.date);
              const timeGroup = timeDiff / 1000 / 60;
              if (timeGroup <= 5) {
                commentTimeGroup[0].push({
                  group: 5, diff: timeGroup, time: commentTime, tag: mes.push_tag,
                });
              } else if (timeGroup <= 30) {
                commentTimeGroup[1].push({
                  group: 30, diff: timeGroup, time: commentTime, tag: mes.push_tag,
                });
              } else if (timeGroup <= 60) {
                commentTimeGroup[2].push({
                  group: 60, diff: timeGroup, time: commentTime, tag: mes.push_tag,
                });
              } else if (timeGroup <= 180) {
                commentTimeGroup[3].push({
                  group: 180, diff: timeGroup, time: commentTime, tag: mes.push_tag,
                });
              } else {
                commentTimeGroup[4].push({
                  group: 1440, diff: timeGroup, time: commentTime, tag: mes.push_tag,
                });
              }
            });
            let nonLinearTime = d3.select(nodes[index]).append('g')
              .attr('class', 'nonLinearTime')
              .attr('opacity', '0')
              .attr('transform', () => {
                const userIndex = newUserAxisValues.findIndex(e => e === datas[i].id);
                return `translate(0, ${y(userIndex)})`;
              });
            nonLinearTime = d3.select(nodes[index]).select('.nonLinearTime');
            nonLinearTime.selectAll('line')
              .data(commentTimeGroup)
              .enter()
              .each((e, groupIndex, ns) => {
                d3.select(ns[groupIndex]).selectAll('line')
                  .data(e)
                  .enter()
                  .append('line')
                  .attr('x1', 0)
                  .attr('x2', 2)
                  .attr('y1', (e1) => {
                    let start = 0;
                    if (groupIndex === 1) start = 5;
                    else if (groupIndex === 2) start = 30;
                    else if (groupIndex === 3) start = 60;
                    else if (groupIndex === 4) start = 180;

                    const nonLinearTimeScale = d3.scaleLinear()
                      .domain([start, e1.group]).range([0, 4]);
                    let offSet = nonLinearTimeScale(e1.diff) > 4 ? 4 : nonLinearTimeScale(e1.diff);
                    offSet = offSet < 0 ? 0 : offSet;
                    return offSet + 4 * groupIndex;
                    // return offSet;
                  })
                  .attr('y2', (e1) => {
                    let start = 0;
                    if (groupIndex === 1) start = 5;
                    else if (groupIndex === 2) start = 30;
                    else if (groupIndex === 3) start = 60;
                    else if (groupIndex === 4) start = 180;

                    const nonLinearTimeScale = d3.scaleLinear()
                      .domain([start, e1.group]).range([0, 4]);
                    let offSet = nonLinearTimeScale(e1.diff) > 4 ? 4 : nonLinearTimeScale(e1.diff);
                    offSet = offSet < 0 ? 0 : offSet;
                    return offSet + 4 * groupIndex;
                  })
                  .attr('stroke-width', '0.5px')
                  .attr('stroke', (e1) => {
                    switch (e1.tag) {
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
                  .append('title')
                  .text(e1 => e1.diff);
              });
          });

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
      const focusDivW = parseFloat(d3.select('#focus').style('width'));
      const focusDivH = parseFloat(d3.select('#focus').style('height'));
      articleGroup.selectAll('.articleXAxis').remove();
      articleGroup.select('.lineGroup').selectAll('line').remove();
      const article_titles = articleArray.map(e => e.article_title);
      const highlightArticle_id = highlightArticles.map(e => e.article_id);
      // const xScale = d3.scaleBand()
      //   .range([0, article_titles.length * gridSize])
      //   .domain(article_titles);
      const focusGridWidth = 25;
      const xScale = d3.scaleBand().range([0, article_titles.length * 2])
        .domain(article_titles);

      const highlightArticleXScale = d3.scaleBand().range([0, highlightArticle_id.length * 2])
        .domain(highlightArticle_id);
      const focusWidth = w - 500;
      const focusScaleX = d3.scaleBand().range([0, focusDivW - 50])
        .domain(highlightArticle_id);

      const yScale = d3.scaleBand().domain(newUserAxisValues)
        .range([0, focusDivH - 100]);

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

      const contextXScale = d3.scaleBand()
        .range([0, highlightArticle_id.length * 10])
        .domain(highlightArticle_id);
      const contextYScale = d3.scaleLinear()
        .domain([0, 10])
        .range([0, 150]);

      const brush = d3.brush()
        .extent([[0, 0], [contextXScale.range()[1], contextYScale.range()[1]]])
        .on('brush end', brushed);

      // const zoom = d3.zoom()
      //   .scaleExtent([1, Infinity])
      //   .translateExtent([[0, 0], [width, height]])
      //   .extent([[0, 0], [width, height]])
      //   .on('zoom', zoomed);

      svg.append('defs').append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr('width', width)
        .attr('height', height);

      // d3.select('.focus').remove();
      const focus = d3.select('.focus');
      focus.select('.lineGroup').remove();
      focus.selectAll('.axis').remove();
      const focusLineGroup = focus.append('g')
        .attr('class', 'lineGroup');
      let context = d3.select('#context');
      // context.attr('transform', `translate(${-(w / 2 - x.range()[1] / 2) + 50}, 0)`);
      context.selectAll('*').remove();
      context = context.append('g')
        .attr('transform', `translate(50, 50)`);
      const articlesWithTypeComment = highlightArticles.map(e => ({ article_id: e.article_id, article_title: e.article_title }));
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
              if (index2 === 0) return contextYScale(10) - d2.length * 5;
              if (index2 === 1) return contextYScale(10) - (d.commentType.push.length + d.commentType.neutral.length) * 5;
              return contextYScale(10) - (d.commentType.push.length + d.commentType.neutral.length + d.commentType.boo.length) * 5;
            })
            .attr('width', contextXScale.bandwidth())
            .attr('height', d2 => d2.length * 5)
            .attr('fill', (d2, index2) => {
              if (index2 === 0) return 'green';
              if (index2 === 1) return 'yellow';
              return 'red';
            });
        });

      contextXScale.domain(focusScaleX.domain());
      // contextYScale.domain(yScale.domain());

      focus.append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', `translate(0,${yScale.range()[1]})`)
        .call(d3.axisBottom(focusScaleX).tickFormat((d, i) => highlightArticles[i].article_title));
      focus.append('g')
        .attr('class', 'axis axis--y')
        .call(d3.axisLeft(yScale));

      context.select('.brush').remove();
      context.select('.axis').remove();
      context.append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', `translate(0,${contextYScale.range()[1]})`)
        .call(d3.axisBottom(contextXScale).tickFormat((d, i) => highlightArticles[i].article_title));
      context.select('.axis--x')
        .selectAll('text')
        .attr('dy', '.35em')
        .style('writing-mode', 'tb')
        .style('text-anchor', 'start');
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
            contextYScale.range()[1],
          ]]);

      // svg.append('rect')
      //   .attr('class', 'zoom')
      //   .attr('width', width)
      //   .attr('height', height)
      //   .attr('transform', `translate(${margin.left},${margin.top})`)
      //   .call(zoom);

      function brushed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return; // ignore brush-by-zoom
        const s = d3.event.selection || contextXScale.range();
        console.log(s);
        console.log(contextXScale.bandwidth());
        const newDomainX = highlightArticle_id.slice(s[0][0] / contextXScale.bandwidth(), s[1][0] / contextXScale.bandwidth());
        focusScaleX.domain(newDomainX);
        console.log(focusScaleX.domain());
        // const newDomainY = newUserAxisValues.slice(s[0][1] / contextYScale.bandwidth(), s[1][1] / contextYScale.bandwidth());
        const newDomainY = newUserAxisValues.slice();
        // console.log(newDomainY);
        yScale.domain(newDomainY);

        focusLineGroup.selectAll('*').remove();
        focusLineGroup.append('g');
        // horizontal
        for (let i = 0; i <= yScale.domain().length * 5; i += 1) {
          focusLineGroup.append('line')
            .attr('x1', 0)
            .attr('y1', i * yScale.bandwidth() / 5)
            .attr('x2', focusScaleX.range()[1])
            .attr('y2', i * yScale.bandwidth() / 5)
            .attr('stroke-width', '0.5px')
            .attr('stroke', i % 5 ? 'lightgray' : 'black');
        }
        // vertical
        for (let i = 0; i <= focusScaleX.domain().length; i += 1) {
          focusLineGroup.append('line')
            .attr('x1', i * focusScaleX.bandwidth())
            .attr('y1', 0)
            .attr('x2', i * focusScaleX.bandwidth())
            .attr('y2', yScale.range()[1])
            .attr('stroke-width', '0.5px')
            .attr('stroke', 'black');
        }
        // focus.select('.area').attr('d', area);
        focus.select('.axis--y')
          .call(d3.axisLeft(yScale));
        focus.select('.axis--x')
          .call(d3.axisBottom(focusScaleX)
            .tickFormat((d, i) => {
              return highlightArticles.find(e => e.article_id === d).article_title;
            }));
        focus.select('.axis--x')
          .selectAll('text')
          .attr('dy', '.35em')
          .style('writing-mode', 'tb')
          .style('text-anchor', 'start');
        // focus.selectAll('.axis--y')
        //   .selectAll('text')
        //   .style('color', (d) => {
        //     const index = community.findIndex(e => e.id === d);
        //     return color(community[index].community);
        //   });
        // d3.select('.axis--y').selectAll('.tick')
        //   .attr('class', d => `tick ${d}`);
        // d3.select('.axis--y').selectAll(`.${newUserAxisValues[userX]}`)
        //   .selectAll('text')
        //   .transition()
        //   .duration(1000)
        //   .style('font-size', '25px')
        //   .style('stroke', 'black');
        // d3.select('.axis--y').selectAll(`.${newUserAxisValues[userY]}`)
        //   .selectAll('text')
        //   .transition()
        //   .duration(1000)
        //   .style('font-size', '25px')
        //   .style('stroke', 'black');

        // svg.select('.zoom').call(zoom.transform, d3.zoomIdentity
        //   .scale(width / (s[1] - s[0]))
        //   .translate(-s[0], 0));

        for (let i = 0; i < datas.length; i += 1) {
          focus.select(`.${datas[i].id}`)
            .selectAll('g')
            // .data(datas[i].repliedArticle.filter(e =>
            //   highlightArticle_id.some(e1 => e1 === e.article_id)))
            // .attr('transform', d => `translate(${focusScaleX(d.article_id)},0)`)
            .attr('visibility', d => (yScale(datas[i].id) !== undefined && focusScaleX(d.article_id) !== undefined ? 'visible' : 'hidden'))
            .each((d, index, nodes) => {
              const articleID = d3.select(nodes[index]).datum().article_id;
              if (yScale(datas[i].id) !== undefined && focusScaleX(articleID) !== undefined) {
                d3.select(nodes[index])
                  .attr('transform', `translate(${focusScaleX(d.article_id)},0)`);
                const postYear = new Date(d.date).getFullYear();
                d3.select(nodes[index]).selectAll('text').remove();
                d3.select(nodes[index]).selectAll('rect')
                  // .attr('width', focusScaleX.bandwidth() > 100 ?
                  // focusScaleX.bandwidth() - 85 : focusScaleX.bandwidth())
                  .attr('width', focusScaleX.bandwidth())
                  .attr('height', e => (e.push_userid ? Math.max(yScale.bandwidth() / 50, 1) : yScale.bandwidth()))
                  // .attr('y', yScale(datas[i].id))
                  .attr('y', (e) => {
                    if (!e.push_userid) return yScale(datas[i].id);
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
                      timeOffSet = yScale.bandwidth() / 5;
                      start = 5;
                      end = 30;
                    } else if (timeGroup <= 60) {
                      timeOffSet = 2 * (yScale.bandwidth() / 5);
                      start = 30;
                      end = 60;
                    } else if (timeGroup <= 180) {
                      timeOffSet = 3 * (yScale.bandwidth() / 5);
                      start = 60;
                      end = 180;
                    } else {
                      timeOffSet = 4 * (yScale.bandwidth() / 5);
                      start = 180;
                      end = 1440;
                    }
                    const nonLinearTimeScale = d3.scaleLinear()
                      .domain([start, end]).range([0, yScale.bandwidth() / 5]);
                    return nonLinearTimeScale(timeGroup) + timeOffSet + yScale(datas[i].id);
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
                .attr('y', yScale(datas[i].id))
                .attr('width', focusScaleX.bandwidth())
                .attr('height', 300)
                .attr('fill', 'lightgray');
            }
          });

          // if (focusScaleX.bandwidth() > 200) {

          // }
        }
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

    function updateArticleMatrixv2(highlightArticles, communityIndex) {
      articleGroup.selectAll('.articleXAxis').remove();
      articleGroup.select('.lineGroup').selectAll('line').remove();
      const usersInGroup = datas.filter(e => e.community === communityIndex);
      const highlightArticle_id = highlightArticles.map(e => e.article_id);

      const xScale = d3.scaleBand().range([0, highlightArticle_id.length * 2])
        .domain(highlightArticle_id);

      const highlightArticleXScale = d3.scaleBand().range([0, highlightArticle_id.length * 2])
        .domain(highlightArticle_id);

      const focusWidth = w - 500;
      const focusScaleX = d3.scaleBand().range([0, focusWidth])
        .domain(highlightArticle_id);

      const yScale = d3.scaleBand().domain(newUserAxisValues)
        .range([0, focusHeight]);

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

      const contextXScale = d3.scaleBand()
        .range([0, highlightArticle_id.length * 10])
        .domain(highlightArticle_id);
      const contextYScale = d3.scaleBand()
        .domain(newUserAxisValues)
        .range([0, newUserAxisValues.length * gridSize * 2]);

      const brush = d3.brush()
        .extent([[0, 0], [highlightArticle_id.length * 2, newUserAxisValues.length * gridSize]])
        .on('brush end', brushed);

        // const zoom = d3.zoom()
        //   .scaleExtent([1, Infinity])
        //   .translateExtent([[0, 0], [width, height]])
        //   .extent([[0, 0], [width, height]])
        //   .on('zoom', zoomed);

      svg.append('defs').append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr('width', width)
        .attr('height', height);

      // d3.select('.focus').remove();
      const focus = d3.select('.focus');
      focus.select('.lineGroup').remove();
      focus.selectAll('.axis').remove();
      const focusLineGroup = focus.append('g')
        .attr('class', 'lineGroup');
      const context = articleGroup;


      contextXScale.domain(focusScaleX.domain());
      contextYScale.domain(yScale.domain());

      focus.append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', `translate(0,${yScale.range()[1]})`)
        .call(d3.axisBottom(focusScaleX).tickFormat((d, i) => highlightArticles[i].article_title));
      focus.append('g')
        .attr('class', 'axis axis--y')
        .call(d3.axisLeft(yScale));

      context.select('.brush').remove();
      context.append('g')
        .attr('class', 'brush')
        .call(brush)
        .call(brush.move, [[0, 0],
          [
            Math.min(contextXScale.range()[1], 50),
            Math.min(yScale.range()[1], gridSize * 3),
          ]]);
      context.append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', `translate(0,${yScale.range()[1]})`)
        .call(d3.axisBottom(contextXScale).tickFormat((d, i) => highlightArticles[i].article_title));
      context.append('g')
        .attr('class', 'axis axis--y')
        .call(d3.axisLeft(yScale));
  
      // svg.append('rect')
      //   .attr('class', 'zoom')
      //   .attr('width', width)
      //   .attr('height', height)
      //   .attr('transform', `translate(${margin.left},${margin.top})`)
      //   .call(zoom);
      function brushed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return; // ignore brush-by-zoom
        const s = d3.event.selection || contextXScale.range();
        const newDomainX = highlightArticle_id.slice(s[0][0] / 2, s[1][0] / 2);
        focusScaleX.domain(newDomainX);

        const newDomainY = newUserAxisValues.slice(s[0][1] / gridSize, s[1][1] / gridSize);
        // console.log(newDomainY);
        yScale.domain(newDomainY);

        focusLineGroup.selectAll('*').remove();
        focusLineGroup.append('g');
        // horizontal
        for (let i = 0; i <= yScale.domain().length * 5; i += 1) {
          focusLineGroup.append('line')
            .attr('x1', 0)
            .attr('y1', i * yScale.bandwidth() / 5)
            .attr('x2', focusScaleX.range()[1])
            .attr('y2', i * yScale.bandwidth() / 5)
            .attr('stroke-width', '0.5px')
            .attr('stroke', i % 5 ? 'lightgray' : 'black');
        }
        // vertical
        for (let i = 0; i <= focusScaleX.domain().length; i += 1) {
          focusLineGroup.append('line')
            .attr('x1', i * focusScaleX.bandwidth())
            .attr('y1', 0)
            .attr('x2', i * focusScaleX.bandwidth())
            .attr('y2', yScale.range()[1])
            .attr('stroke-width', '0.5px')
            .attr('stroke', 'black');
        }
        // focus.select('.area').attr('d', area);
        focus.select('.axis--y')
          .call(d3.axisLeft(yScale));
        focus.select('.axis--x')
          .call(d3.axisBottom(focusScaleX)
            .tickFormat((d, i) => highlightArticles[i].article_title));
        focus.select('.axis--x')
          .selectAll('text')
          .attr('dy', '.35em')
          .style('writing-mode', 'tb')
          .style('text-anchor', 'start');
        focus.selectAll('.axis--y')
          .selectAll('text')
          .style('color', (d) => {
            const index = community.findIndex(e => e.id === d);
            return color(community[index].community);
          });
        d3.select('.axis--y').selectAll('.tick')
          .attr('class', d => `tick ${d}`);
        d3.select('.axis--y').selectAll(`.${newUserAxisValues[userX]}`)
          .selectAll('text')
          .transition()
          .duration(1000)
          .style('font-size', '25px')
          .style('stroke', 'black');
        d3.select('.axis--y').selectAll(`.${newUserAxisValues[userY]}`)
          .selectAll('text')
          .transition()
          .duration(1000)
          .style('font-size', '25px')
          .style('stroke', 'black');

        // svg.select('.zoom').call(zoom.transform, d3.zoomIdentity
        //   .scale(width / (s[1] - s[0]))
        //   .translate(-s[0], 0));

        for (let i = 0; i < datas.length; i += 1) {
          focus.select(`.${datas[i].id}`)
            .selectAll('g')
            // .data(datas[i].repliedArticle.filter(e =>
            //   highlightArticle_id.some(e1 => e1 === e.article_id)))
            // .attr('transform', d => `translate(${focusScaleX(d.article_id)},0)`)
            .attr('visibility', d => (yScale(datas[i].id) !== undefined && focusScaleX(d.article_id) !== undefined ? 'visible' : 'hidden'))
            .each((d, index, nodes) => {
              const articleID = d3.select(nodes[index]).datum().article_id;
              if (yScale(datas[i].id) !== undefined && focusScaleX(articleID) !== undefined) {
                d3.select(nodes[index])
                  .attr('transform', `translate(${focusScaleX(d.article_id)},0)`);
                const postYear = new Date(d.date).getFullYear();
                d3.select(nodes[index]).selectAll('text').remove();
                d3.select(nodes[index]).selectAll('rect')
                  // .attr('width', focusScaleX.bandwidth() > 100 ?
                  // focusScaleX.bandwidth() - 85 : focusScaleX.bandwidth())
                  .attr('width', focusScaleX.bandwidth())
                  .attr('height', e => (e.push_userid ? Math.max(yScale.bandwidth() / 50, 1) : yScale.bandwidth()))
                  // .attr('y', yScale(datas[i].id))
                  .attr('y', (e) => {
                    if (!e.push_userid) return yScale(datas[i].id);
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
                      timeOffSet = yScale.bandwidth() / 5;
                      start = 5;
                      end = 30;
                    } else if (timeGroup <= 60) {
                      timeOffSet = 2 * (yScale.bandwidth() / 5);
                      start = 30;
                      end = 60;
                    } else if (timeGroup <= 180) {
                      timeOffSet = 3 * (yScale.bandwidth() / 5);
                      start = 60;
                      end = 180;
                    } else {
                      timeOffSet = 4 * (yScale.bandwidth() / 5);
                      start = 180;
                      end = 1440;
                    }
                    const nonLinearTimeScale = d3.scaleLinear()
                      .domain([start, end]).range([0, yScale.bandwidth() / 5]);
                    return nonLinearTimeScale(timeGroup) + timeOffSet + yScale(datas[i].id);
                  });
              }
            });
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
                .attr('y', yScale(datas[i].id))
                .attr('width', focusScaleX.bandwidth())
                .attr('height', 300)
                .attr('fill', 'lightgray');
            }
          });
        }
      }
    }
    function updateUserMatrix(highlightArticles, matrixX, matrixY) {
      leftSvg.select('.authorAxisX').remove();
      leftSvg.select('.authorAxisY').remove();
      builduserGroupAxis(newUserAxisValues);
      const xAxis = leftSvg.select('.authorAxisX');
      const yAxis = leftSvg.select('.authorAxisY');
      leftSvgLineGroup.selectAll('*').remove();
      const lineDomain = [];
      for (let i = 0; i <= highlightArticles.length; i += 1) {
        lineDomain.push(i + 1);
      }
      const lineXScale = d3.scaleBand()
        .range([0, lineDomain.length * 2])
        .domain(lineDomain);
      const yScale = d3.scaleBand()
        .domain(newUserAxisValues)
        .range([0, newUserAxisValues.length * gridSize]);
      const userOffset = (matrixX + 1) * gridSize;
      let indexSmall = matrixX;
      let indexLarge = matrixY;
      if (matrixX > matrixY) {
        indexSmall = matrixY;
        indexLarge = matrixX;
      }

      let maxLength = 0;
      newUserAxisValues.forEach((e) => {
        maxLength = Math.max(e.length * 15, maxLength);
      });

      // moveRectToLeftTopCorner(indexSmall, indexLarge);
      for (let j = 0; j <= highlightArticles.length; j += 1) {
        leftSvgLineGroup
          .append('line')
          .attr('x1', userOffset + lineXScale(j + 1))
          .attr('x2', userOffset + lineXScale(j + 1))
          .attr('y1', 0)
          .attr('y2', 0)
          .transition()
          .duration(1000)
          .delay(1000)
          .attr('x1', userOffset + lineXScale(j + 1))
          .attr('x2', userOffset + lineXScale(j + 1))
          .attr('y1', 0)
          .attr('y2', newUserAxisValues.length * 20)
          .attr('stroke-width', '0.1px')
          .attr('stroke', 'lightgray');
      }
      for (let i = 0; i < newUserAxisValues.length; i += 1) {
        leftSvgLineGroup.append('line')
          .attr('x1', userOffset)
          .attr('x2', userOffset)
          .attr('y1', yScale(newUserAxisValues[i]))
          .attr('y2', yScale(newUserAxisValues[i]))
          .transition()
          .duration(1000)
          .delay(1000)
          .attr('x1', userOffset)
          .attr('x2', userOffset + highlightArticles.length * 2)
          .attr('y1', yScale(newUserAxisValues[i]))
          .attr('y2', yScale(newUserAxisValues[i]))
          .attr('stroke-width', '0.1px')
          .attr('stroke', 'black');
        let articleOffset = i > matrixX ? highlightArticles.length * 2 : 0;
        articleOffset = i < matrixX ? -maxLength : articleOffset;
        // if (i !== matrixY && i !== matrixX) {
        //   leftSvg.selectAll(`.x${i}`)
        //     .attr('transform', `translate(${articleOffset}, 0)`);
        //   rightSvg.selectAll(`.x${i}`)
        //     .attr('transform', `translate(${articleOffset}, 0)`);
        // }
        leftSvg.selectAll(`.x${i}`)
          .transition()
          .duration(1000)
          .attr('transform', `translate(${articleOffset}, 0)`);
        // rightSvg.selectAll(`.x${i}`)
        //   .transition()
        //   .duration(1000)
        //   .attr('transform', `translate(${articleOffset}, 0)`);
        const transformX = xAxis.select(`.${newUserAxisValues[i]}`).attr('transform');
        const translateX = transformX.substring(transformX.indexOf('(') + 1, transformX.indexOf(')')).split(',');
        const offSetX = parseInt(translateX[0], 10) + highlightArticles.length * 2;
        const transformY = yAxis.select(`.${newUserAxisValues[i]}`).attr('transform');
        const translateY = transformY.substring(transformY.indexOf('(') + 1, transformY.indexOf(')')).split(',');
        const offSetY = parseInt(translateY[1], 10);
        yAxis.select(`.${newUserAxisValues[i]}`)
          .transition()
          .duration(1000)
          .attr('transform', `translate(${matrixX * gridSize}, ${offSetY})`);
        if (i > matrixX) {
          xAxis.select(`.${newUserAxisValues[i]}`)
            .transition()
            .duration(1000)
            .attr('transform', `translate(${offSetX}, 0)`);
        } else if (i < matrixX) {
          xAxis.select(`.${newUserAxisValues[i]}`)
            .transition()
            .duration(1000)
            .attr('transform', `translate(${parseInt(translateX[0], 10) + articleOffset}, 0)`);
        }
        let clickedOffset = 0;
        clickedOffset = maxLength / 2 - highlightArticles.length;
        group.transition().duration(1000)
          .attr('transform', `translate(${clickedOffset},0)`);
      }
      function moveRectToLeftTopCorner(s, l) {
        const refAxis = newUserAxisValues.slice();
        while (newUserAxisValues.shift() !== undefined);
        if (s !== l) {
          newUserAxisValues.push(refAxis[s]);
          newUserAxisValues.push(refAxis[l]);
        } else {
          newUserAxisValues.push(refAxis[s]);
        }
        leftSvg.selectAll(`.x${s}`)
          // .transition()
          // .duration(1000)
          .attr('x', x(0))
          .attr('cx', x(0) + (x.bandwidth() / 2));
        // rightSvg.selectAll(`.x${s}`)
        //   // .transition()
        //   // .duration(1000)
        //   .attr('x', x(0))
        //   .attr('cx', x(0) + (x.bandwidth() / 2));
        // move Y
        leftSvg.selectAll(`.y${s}`)
          .attr('y', y(0))
          .attr('cy', y(0) + (y.bandwidth() / 2));
        // rightSvg.selectAll(`.y${s}`)
        //   .attr('y', y(0))
        //   .attr('cy', y(0) + (y.bandwidth() / 2));
        if (s !== l) {
          leftSvg.selectAll(`.x${l}`)
            .attr('x', x(1))
            .attr('cx', x(1) + (x.bandwidth() / 2));
          // rightSvg.selectAll(`.x${l}`)
          //   .attr('x', x(1))
          //   .attr('cx', x(1) + (x.bandwidth() / 2));
          leftSvg.selectAll(`.y${l}`)
            .attr('y', y(1))
            .attr('cy', y(1) + (y.bandwidth() / 2));
          // rightSvg.selectAll(`.y${l}`)
          //   .attr('y', y(1))
          //   .attr('cy', y(1) + (y.bandwidth() / 2));
        }
        for (let i = 0; i < refAxis.length; i += 1) {
          if (i !== s && i !== l) newUserAxisValues.push(refAxis[i]);
          if (s !== l) {
            if (i < s) {
              leftSvg.selectAll(`.x${i}`)
                .transition()
                .duration(1000)
                .attr('x', x(i + 2))
                .attr('cx', x(i + 2) + (x.bandwidth() / 2));
              // rightSvg.selectAll(`.x${i}`)
              //   .transition()
              //   .duration(1000)
              //   .attr('x', x(i + 2))
              //   .attr('cx', x(i + 2) + (x.bandwidth() / 2));
              leftSvg.selectAll(`.y${i}`)
                .attr('y', y(i + 2))
                .attr('cy', y(i + 2) + (y.bandwidth() / 2));
              // rightSvg.selectAll(`.y${i}`)
              //   .attr('y', y(i + 2))
              //   .attr('cy', y(i + 2) + (y.bandwidth() / 2));
            } else if (i < l) {
              leftSvg.selectAll(`.x${i}`)
                .transition()
                .duration(1000)
                .attr('x', x(i + 1))
                .attr('cx', x(i + 1) + (x.bandwidth() / 2));
              // rightSvg.selectAll(`.x${i}`)
              //   .transition()
              //   .duration(1000)
              //   .attr('x', x(i + 1))
              //   .attr('cx', x(i + 1) + (x.bandwidth() / 2));
              leftSvg.selectAll(`.y${i}`)
                .attr('y', y(i + 1))
                .attr('cy', y(i + 1) + (y.bandwidth() / 2));
              // rightSvg.selectAll(`.y${i}`)
              //   .attr('y', y(i + 1))
              //   .attr('cy', y(i + 1) + (y.bandwidth() / 2));
            }
          } else if (i < s) {
            leftSvg.selectAll(`.x${i}`)
              .transition()
              .duration(1000)
              .attr('x', x(i + 1))
              .attr('cx', x(i + 1) + (x.bandwidth() / 2));
            // rightSvg.selectAll(`.x${i}`)
            //   .transition()
            //   .duration(1000)
            //   .attr('x', x(i + 1))
            //   .attr('cx', x(i + 1) + (x.bandwidth() / 2));
            leftSvg.selectAll(`.y${i}`)
              .attr('y', y(i + 1))
              .attr('cy', y(i + 1) + (y.bandwidth() / 2));
            // rightSvg.selectAll(`.y${i}`)
            //   .attr('y', y(i + 1))
            //   .attr('cy', y(i + 1) + (y.bandwidth() / 2));
          }
        }
        builduserGroupAxis(newUserAxisValues);
      }
    }
    function drawUserRepliedAuthorMatrix(authorArray) {
      authorGroup.selectAll('*').remove();
      const xScale = d3.scaleBand()
        .domain(newUserAxisValues)
        .range([0, newUserAxisValues.length * gridSize]);

      const yScale = d3.scaleBand()
        .range([0, authorArray.length * gridSize])
        .domain(authorArray.map(e => e.id))
        .padding(0.05);

      for (let i = 0; i < datas.length; i += 1) {
        authorGroup.append('g').selectAll('circle')
          .data(datas[i].reply)
          .enter()
          .append('g')
          .attr('class', `${datas[i].id}`)
          .each((d, index, nodes) => {
            const repliedAuthor = authorArray.find(a => a.id === d.author);
            d3.select(nodes[index]).selectAll('rect')
              .data(d.articles)
              .enter()
              .append('rect')
              .attr('x', e => xScale(datas[i].id))
              .attr('y', (e) => {
                const articlesIndex = repliedAuthor.articles.findIndex(
                  a => a.article_title === e.article_title,
                );
                const ratio = articlesIndex / repliedAuthor.articles.length;
                return yScale(d.author) + (yScale.bandwidth() * ratio);
              })
              .attr('width', gridSize)
              .attr('height', (e) => {
                const articlesIndex = repliedAuthor.articles.findIndex(
                  a => a.article_title === e.article_title,
                );
                const ratio = articlesIndex / repliedAuthor.articles.length;
                if (articlesIndex === repliedAuthor.articles.length - 1) {
                  return gridSize - (yScale.bandwidth() * ratio) - 0.5;
                }
                return gridSize / repliedAuthor.articles.length - 0.5;
              })
              .attr('fill', color(datas[i].community))
              // .attr('stroke', 'lightgray')
              // .attr('stroke-width', '0.5px')
              .on('mouseover', (e) => {
                let commentString = '';
                if (e.push_content) {
                  e.push_content.forEach((m) => {
                    commentString += `${m.push_tag} ${m.push_content} <br>`;
                  });
                }
                const tooltipString = `Replyer: ${datas[i].id} <br> 
                  Author: ${d.author}, Post: ${e.count} <br>
                  pushContent: ${commentString}`;
                authorGroupMouseover(tooltipString);
              })
              .on('mouseout', mouseout);
          });
      }
      // horizontal line
      for (let i = 0; i < authorArray.length; i += 1) {
        for (let j = 0; j < authorArray[i].articles.length; j += 1) {
          const postNum = authorArray[i].articles.length;
          authorGroup.append('line')
            .attr('y1', yScale(authorArray[i].id) + (yScale.bandwidth() * j / postNum))
            .attr('y2', yScale(authorArray[i].id) + (yScale.bandwidth() * j / postNum))
            .attr('x1', 0)
            .attr('x2', (newUserAxisValues.length + articles.length) * gridSize)
            .attr('stroke-width', '0.5px')
            .attr('stroke', 'gray');
        }
        authorGroup.append('line')
          .attr('y1', yScale(authorArray[i].id))
          .attr('y2', yScale(authorArray[i].id))
          .attr('x1', 0)
          .attr('x2', (newUserAxisValues.length + articles.length) * gridSize)
          .attr('stroke-width', '1px')
          .attr('stroke', 'black');
      }
      // vertical line
      for (let i = 0; i < newUserAxisValues.length; i += 1) {
        authorGroup.append('line')
          .attr('x1', i * xScale.bandwidth())
          .attr('x2', i * xScale.bandwidth())
          .attr('y1', yScale(authorArray[0].id))
          .attr('y2', authorArray.length * gridSize)
          .attr('stroke-width', '1px')
          .attr('stroke', 'black');
      }
      authorGroup.append('g')
        .attr('class', 'articleYAxis')
        .call(d3.axisLeft(yScale));
      authorGroup.select('.articleYAxis')
        .selectAll('line')
        .remove();
      authorGroup.select('.articleYAxis')
        .selectAll('text')
        .attr('x', -3)
        .style('font-size', 'medium');
    }

    function drawAuthorArticleMatrix(articleArray, authorArray) {
      const offset = newUserAxisValues.length * gridSize + 100;
      authorArticleGroup.selectAll('*').remove();
      authorArticleGroup.attr('transform', `translate(${offset}, ${offset})`);
      const article_titles = articleArray.map(e => e.article_title);
      const xScale = d3.scaleBand()
        .range([0, article_titles.length * gridSize])
        .domain(article_titles);
      const yScale = d3.scaleBand()
        .range([0, authorArray.length * gridSize])
        .domain(authorArray.map(e => e.id))
        .padding(0.05);
      authorArticleGroup.append('g').selectAll('circle')
        .data(articleArray)
        .enter()
        .append('rect')
        .attr('x', d => xScale(d.article_title))
        .attr('y', (d) => {
          const author = authorArray.find(e => e.id === d.author);
          const articlesIndex = author.articles.findIndex(
            a => a.article_title === d.article_title,
          );
          const ratio = articlesIndex / author.articles.length;
          return yScale(d.author) + (yScale.bandwidth() * ratio);
        })
        .attr('width', xScale.bandwidth())
        .attr('height', (d) => {
          const author = authorArray.find(e => e.id === d.author);
          const articlesIndex = author.articles.findIndex(
            a => a.article_title === d.article_title,
          );
          const ratio = articlesIndex / author.articles.length;
          if (articlesIndex === author.articles.length - 1) {
            return gridSize - (yScale.bandwidth() * ratio) - 0.5;
          }
          return gridSize / author.articles.length - 0.5;
        });
      // .attr('fill', () => {
      //   const u = community.find(e => e.id === datas[i].id);
      //   return color[u.community];
      // })
      // .append('title')
      // .text(d => `${datas[i].id} title: ${d.article_title}`);
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

    function drawPieChartHeatmap() {
      for (let i = 0; i < permuted_mat.length; i += 1) {
        for (let j = 0; j < permuted_mat.length; j += 1) {
          const xUserID = newUserAxisValues[j];
          const yUserID = newUserAxisValues[i];
          const xUser = datas.find(e => e.id === xUserID);
          console.log(xUser);
          const yUser = datas.find(e => e.id === yUserID);
          const sameArticlesNum = xUser.repliedArticle.filter(
            value1 => yUser.repliedArticle.some(value2 => value2.article_id === value1.article_id),
          ).length;
          const pieData = {
            xUserID: xUser.repliedArticle.length - sameArticlesNum,
            sameAritcles: sameArticlesNum,
            yUserID: yUser.repliedArticle.length - sameArticlesNum,
          };
          console.log(pieData);
          const datas_ready = pie(d3.entries(pieData));
          drawPieChart(datas_ready, j, i);
        }
      }
      function drawPieChart(pieChartData, positionX, positionY) {
        leftSvg.append('g')
          .attr('transform', `translate(${x(positionX) + (gridSize / 2)},${y(positionY) + (gridSize / 2)}) rotate(-45)`)
          .selectAll()
          .data(pieChartData)
          .enter()
          .append('g')
          .append('path')
          .attr('d', d3.arc().innerRadius(0).outerRadius(gridSize / 2))
          .attr('fill', (d, index) => {
            // console.log(d.data.key);
            // if (d.data.key === 'xUserID') return '#739ffb';
            // if (d.data.key === 'yUserID') return '#eb7f65';
            // if (d.data.key === 'sameAritcles') return '#73dfb3';
            // return color1(d.data.key);
            const xUser = community.find(e => e.id === newUserAxisValues[positionX]);
            const yUser = community.find(e => e.id === newUserAxisValues[positionY]);

            if (xUser.community === yUser.community) {
              const communityColor = d3.scaleLinear()
                .range(['white', color(xUser.community)])
                .domain([0, 100]);
              return communityColor(d);
            }
            return leftMyColor(d);
          })
          // .attr('stroke', 'black')
          // .style('stroke-width', '0.1px')
          .style('opacity', (d) => {
            console.log(d.data.key);
            if (d.data.key === 'xUserID') return 0;
            if (d.data.key === 'yUserID') return 0;
            return 1;
          });
      }
    }

    function drawUserGroupRadial() {
      const radial = d3.select('#timeLine').append('g')
        .attr('class', 'radialGroup')
        .attr('transform', 'translate(110, 100)');
      const numOfArtCom = Math.max(...articlesCommunity.map(e => e.community)) + 1;
      const numOfArtOfEachComunity = [];
      for (let i = 0; i < numOfArtCom; i += 1) {
        const tempCommunity = articlesCommunity.filter(e => e.community === i);
        numOfArtOfEachComunity.push(tempCommunity);
      }
      console.log(numOfArtOfEachComunity);
      const artComPie = d3.pie()
        .value(d => d.length)
        .sort(null);
      const dataReady = artComPie(numOfArtOfEachComunity);
      console.log(dataReady);
      const numOfUserCom = Math.max(...community.map(e => e.community));

      for (let i = 0; i <= numOfUserCom; i += 1) {
        const groupRadial = radial.append('g')
          .attr('class', `group_${i}`)
          .attr('transform', `translate(0, ${i * 140})`);
        for (let j = 0; j < 5; j += 1) {
          groupRadial.append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 55 - 10 * j)
            .attr('stroke-width', '1px')
            .attr('stroke', 'black')
            .attr('fill', 'white');
        }
        // group legend
        groupRadial.append('text')
          .text(`group_${i}`)
          .attr('x', -80)
          .attr('y', -65);
        groupRadial.append('circle')
          .attr('cx', -90)
          .attr('cy', -67.5)
          .attr('r', 5)
          .attr('fill', color(i));
        drawRadial(i);
      }
      function drawRadial(index) {
        const groupRadial = radial.select(`.group_${index}`);
        const communityIndex = community.filter(e => e.community === index);
        const communityIndexDatas = datas.filter(e => communityIndex.some(e1 => e1.id === e.id));
        console.log(communityIndexDatas);
        const communityIndexArticles = [];
        communityIndexDatas.forEach((u) => {
          u.repliedArticle.forEach((article) => {
            const findArticle = articlesCommunity.find(a => a.id === article.article_id);
            const existedComunity = communityIndexArticles.find(e => e.community === findArticle.community);
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
              communityIndexArticles.push({
                community: findArticle.community,
                articles: [{
                  article_id: findArticle.id,
                  count: 1 / communityIndexDatas.length,
                }],
              });
            }
          });
        });
        console.log(communityIndexArticles);
        const communityEachLevelCount = [];
        communityIndexArticles.forEach((e) => {
          const levelOne = e.articles.filter(a => a.count > 0).length;
          const levelTwo = e.articles.filter(a => a.count >= 0.2).length;
          const levelThree = e.articles.filter(a => a.count >= 0.4).length;
          const levelFour = e.articles.filter(a => a.count >= 0.6).length;
          const levelFive = e.articles.filter(a => a.count >= 0.8).length;
          communityEachLevelCount.push({
            community: e.community,
            level: [levelOne, levelTwo, levelThree, levelFour, levelFive],
          });
        });
        console.log(communityEachLevelCount);
        for (let i = 0; i < communityEachLevelCount.length; i += 1) {
          const radialColor = d3.scaleLinear().domain([-1, 4]).range(['white', color(index)]);
          const tempCommunity = communityEachLevelCount[i].community;
          for (let j = 0; j < 5; j += 1) {
            // groupRadial.append('g')
            //   .attr('transform', `rotate(${360 * (tempCommunity / numOfArtCom)})`)
            //   .append('line')
            //   .attr('x1', 0)
            //   .attr('y1', -5)
            //   .attr('x2', 0)
            //   .attr('y2', -5 - 50 * (communityEachLevelCount[i].level[j] / numOfArtOfEachComunity[tempCommunity].length))
            //   .attr('opacity', communityEachLevelCount[i].level[j] === 0 ? 0 : 1)
            //   .attr('stroke-width', 5)
            //   .attr('stroke', radialColor(j));
            groupRadial.append('g')
              .selectAll('path')
              .data(dataReady)
              .enter()
              .append('path')
              .attr('d', d3.arc()
                .innerRadius(5)
                .outerRadius(5 + 50 * (communityEachLevelCount[i].level[j] / numOfArtOfEachComunity[tempCommunity].length)))
              .attr('fill', radialColor(j))
              .attr('stroke', 'black')
              .style('stroke-width', '0.3px')
              .style('opacity', (d, dataIndex) => (dataIndex === tempCommunity ? 0.7 : 0));
            if (i === 0) {
              // depth legend
              groupRadial.append('text')
                .text(`> ${Math.round((0 + 0.2 * j) * 10) / 10}`)
                .attr('font-size', 9)
                .attr('x', 85)
                .attr('y', -47 + (j * 10));
              groupRadial.append('g')
                .append('rect')
                .attr('x', 70)
                .attr('y', -55 + (j * 10))
                .attr('width', 10)
                .attr('height', 10)
                .attr('fill', radialColor(j));
            }
          }
        }
      }
    }

    function drawUserGroupBipartiteRelations() {
      const radial = leftSvg.append('g')
        .attr('class', 'radialGroup')
        .attr('transform', `translate(${newUserAxisValues.length * gridSize}, 0)`);
      const numOfArtCom = Math.max(...articlesCommunity.map(e => e.community)) + 1;
      const numOfArtOfEachComunity = [];
      for (let i = 0; i < numOfArtCom; i += 1) {
        const tempCommunity = articlesCommunity.filter(e => e.community === i);
        numOfArtOfEachComunity.push(tempCommunity);
      }
      console.log(numOfArtOfEachComunity);
      const artComPie = d3.pie()
        .value(d => d.length)
        .sort(null);
      const dataReady = artComPie(numOfArtOfEachComunity);
      console.log(dataReady);
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
      console.log(comunityIndexY);
      const articleGroupWidthScale = d3.scaleLinear().domain([0, filteredArticles.length]).range([10, 100]);
      const articleGroupIndexArray = [];
      const articleGroupXScale = [0];
      const padding = 2;
      for (let i = 0; i < numOfArtCom; i += 1) {
        articleGroupIndexArray.push(i);
        if (i < numOfArtCom - 1) {
          articleGroupXScale.push(padding + articleGroupXScale[i] + articleGroupWidthScale(numOfArtOfEachComunity[i].length));
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
            .attr('x', articleGroupXScale[j])
            .attr('y', y(comunityIndexY[i]) + 1)
            .attr('width', articleGroupWidthScale(numOfArtOfEachComunity[j].length))
            .attr('height', numOfUser * gridSize - 2)
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
        communityIndexDatas.forEach((u) => {
          u.repliedArticle.forEach((article) => {
            const findArticle = articlesCommunity.find(a => a.id === article.article_id);
            const existedComunity = communityIndexArticles.find(e => e.community === findArticle.community);
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
              communityIndexArticles.push({
                community: findArticle.community,
                articles: [{
                  article_id: findArticle.id,
                  count: 1 / communityIndexDatas.length,
                }],
              });
            }
          });
        });
        // console.log(communityIndexArticles);
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
        // console.log(communityEachLevelCount);
        for (let i = 0; i < communityEachLevelCount.length; i += 1) {
          const radialColor = d3.scaleLinear().domain([-1, 4]).range(['white', color(index)]);
          const tempCommunity = communityEachLevelCount[i].community;
          groupRadial.append('g')
            .selectAll('path')
            .data(communityEachLevelCount[i].level)
            .enter()
            .append('rect')
            .attr('x', articleGroupXScale[tempCommunity])
            .attr('y', (d) => {
              const offset = (userCount * gridSize - 2) * (1 - d.length / numOfArtOfEachComunity[tempCommunity].length);
              return y(comunityIndexY[index]) + offset + 1;
            })
            .attr('width', articleGroupWidthScale(numOfArtOfEachComunity[tempCommunity].length))
            .attr('height', (d) => {
              return (userCount * gridSize - 2) * (d.length / numOfArtOfEachComunity[tempCommunity].length);
            })
            .attr('fill', (d, levelIndex) => radialColor(levelIndex))
            .on('click', (d, levelIndex) => rectClick(d, index));
        }
        function computeNumOfArticlesOfEachCommunity() {
          const arr = [];
          communityIndexDatas.forEach((u) => {
            u.repliedArticle.forEach((article) => {
              const findArticle = articlesCommunity.find(a => a.id === article.article_id);
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

  function computeUserSimilarity(userAuthorRelationShipArr, userArr) {
    const userListArray = [];
    // for (let i = 0; i < userAuthorRelationShipArr.length - 1; i += 1) {
    //   const temp = userAuthorRelationShipArr[i];
    //   for (let j = i + 1; j < userAuthorRelationShipArr.length; j += 1) {
    //     let linkValue = 0;
    //     const next = userAuthorRelationShipArr[j];
    //     temp.reply.forEach((e) => {
    //       const existedSameAuthor = next.reply.find(a => a.author === e.author);
    //       if (existedSameAuthor) {
    //         linkValue += e.count / temp.totalReplyCount;
    //         linkValue += existedSameAuthor.count / next.totalReplyCount;
    //       }
    //     });
    //     userListArray.push({ source: temp.id, target: next.id, value: linkValue / 2 });
    //   }
    // }
    for (let i = 0; i < userAuthorRelationShipArr.length - 1; i += 1) {
      const temp = userAuthorRelationShipArr[i];
      for (let j = i + 1; j < userAuthorRelationShipArr.length; j += 1) {
        const next = userAuthorRelationShipArr[j];
        const repliedAllAuthor = [];
        temp.reply.forEach(e => repliedAllAuthor.push(e.author));
        next.reply.forEach((e) => {
          if (!repliedAllAuthor.some(a => a === e.author)) repliedAllAuthor.push(e.author);
        });
        const repliedSameAuthor = temp.reply.filter(
          e => next.reply.some(e2 => e2.author === e.author),
        );
        // console.log(temp, next, repliedAllAuthor, repliedSameAuthor);
        userListArray.push({
          source: temp.id,
          target: next.id,
          value: repliedSameAuthor.length / repliedAllAuthor.length,
        });
      }
    }
    // userListArray = userListArray.filter(e => e.value >= 1);
    return userListArray;
  }
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
        console.log(e);
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

  function responderCommunityDetecting(dataNodes, dataLinks) {
    // console.log(dataLinks);
    const authorCluster = dataNodes.filter(e => e.influence);
    dataNodes = dataNodes.filter(e => !e.influence);
    // const filteredLinks = dataLinks.filter(l => l.tag === 1);
    const links = JSON.parse(JSON.stringify(dataLinks));
    for (let i = 0; i < links.length; i += 1) {
      // console.log(links[i]);
      links[i].source = dataNodes.findIndex(
        ele => ele.id === dataLinks[i].source.id || ele.id === dataLinks[i].source,
      );
      links[i].target = dataNodes.findIndex(ele => (ele.id === dataLinks[i].target
        || ele.articleId === dataLinks[i].target));
      links[i].value *= 100;
    }
    console.log(links);
    netClustering.cluster(dataNodes, links);
    console.log('community detecting done');
  }
}

export { userSimilarityGraph };
