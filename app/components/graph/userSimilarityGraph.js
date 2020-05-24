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
  const commentTimelineSvg = d3.select('#commentTimeline');
  console.log(math.sqrt(-4));
  // data = data.filter(e => e.repliedArticle.length > 1);
  console.log(data);
  console.log(user);
  console.log(articles);
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
  adjacencyMatrixNoAuthor();
  // heatMapWithAuthor();

  function adjacencyMatrixNoAuthor() {
    svg.attr('height', (user.length + authorArr.length) * 20 + 300);
    svg.attr('width', (user.length + articles.length) * 20 + 1500);
    svg.call(d3.zoom()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 8])
      .on('zoom', zoomed));
    const group = svg.append('g');
    function zoomed() {
      group.attr('transform', d3.event.transform);
    }
    const color = d => d3.schemeTableau10[d + 1];
    console.log(d3.schemeTableau10[0]);
    // similarity for articles grouping
    // const articleSimilarity = computeArticleSimilarity(articles, data);
    // console.log('articleSimilarity', articleSimilarity);
    // const articleIds = articles.map(e => e.article_id);
    // const articlesCommunity = jLouvainClustering(articleIds, articleSimilarity);
    // console.log('articlesCommunity', articlesCommunity);
    let articlesOrderByCommunity = articles;
    // articlesOrderByCommunity = articlesOrdering(articles, articlesCommunity);
    // console.log('articlesOrderByCommunity', articlesOrderByCommunity);
    // Article Similarity
    const similarity = computeUserSimilarityByArticles(data, user);
    console.log('similarity', similarity);
    // responderCommunityDetecting(nodes, similarity);
    const newUserAxisValues = [];
    const axisDomain = [];
    for (let i = 0; i < user.length; i += 1) {
      axisDomain.push(i);
    }
    const community = jLouvainClustering(user, similarity);
    const [matrix, origMatrix] = relationToMatrix(similarity);
    const similarityScale = d3.scalePow().exponent(0.5).range([0, 100]);
    // enlarge the difference between user
    for (let i = 0; i < user.length; i += 1) {
      matrix[i] = matrix[i].map(e => similarityScale(e));
      // matrix[i] = matrix[i].map(e => (e >= 0.5 && e < 2 ? 1 : e));
      // matrix[i] = matrix[i].map(e => e * 10);
    }
    console.log('matrix', matrix);
    const [
      permuted_mat,
      permuted_origMat,
    ] = matrixReordering(matrix, origMatrix, newUserAxisValues);
    const [
      secondOrdering_mat,
      secondOrdering_origMat,
    ] = matrixReorderingByCommunity(permuted_mat, permuted_origMat, community, newUserAxisValues);

    // Author Similarity
    const authorSimilarity = computeUserSimilarity(data, user);
    console.log('authorSimilarity', authorSimilarity);
    const newUserAxisValuesByAuthor = [];
    const communityByAuthor = jLouvainClustering(user, authorSimilarity);
    const [matrixByAuthor, origMatrixByAuthor] = relationToMatrix(authorSimilarity);
    // enlarge the difference between user
    for (let i = 0; i < user.length; i += 1) {
      matrixByAuthor[i] = matrixByAuthor[i].map(e => similarityScale(e));
      // matrix[i] = matrix[i].map(e => (e >= 0.5 && e < 2 ? 1 : e));
      // matrix[i] = matrix[i].map(e => e * 10);
    }
    console.log('matrixByAuthor', matrixByAuthor);
    const [
      permuted_matByAuthor,
      permuted_origMatByAuthor,
    ] = matrixReordering(matrixByAuthor, origMatrixByAuthor, newUserAxisValuesByAuthor);
    const [
      secondOrdering_matByAuthor,
      secondOrdering_origMatByAuthor,
    ] = matrixReorderingByCommunity(
      permuted_matByAuthor, permuted_origMatByAuthor, communityByAuthor, newUserAxisValuesByAuthor,
    );

    const gridSize = 20;
    const x = d3.scaleBand()
      .range([0, axisDomain.length * gridSize])
      .domain(axisDomain)
      .padding(0.05);

    const leftSvg = group.append('g')
      .attr('class', 'leftSvg')
      .attr('transform', 'scale(1) translate(100,100)');

    const y = d3.scaleBand()
      .range([0, axisDomain.length * gridSize])
      .domain(axisDomain);
      // .padding(0.05);
    builduserGroupAxis(newUserAxisValues);

    // Build color scale
    const userColor = userColorScaleArray(data);
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
      console.log(index, i);
      const xID = newUserAxisValues[index];
      const yID = newUserAxisValues[i];
      const xUser = data.find(e => e.id === xID);
      const yUser = data.find(e => e.id === yID);
      d3.select('.leftSvg')
        .selectAll('rect')
        .attr('stroke', 'white');
      d3.select('.rightSvg')
        .selectAll('rect')
        .transition()
        .duration(500)
        .attr('stroke', 'white');
      d3.selectAll(`.x${index}`)
        .transition()
        .duration(500)
        .attr('stroke', 'black');
      d3.selectAll(`.y${i}`)
        .transition()
        .duration(500)
        .attr('stroke', 'black');

      const bothRepliedArticles = xUser.repliedArticle.filter(
        e => yUser.repliedArticle.some(e2 => e2.article_id === e.article_id),
      );
      articles.sort((a, b) => {
        if (bothRepliedArticles.find(e => e.article_title === b.article_title)) return 1;
        return -1;
      });
      console.log('sorted articles', articles);
      const bothRepliedAuthors = xUser.reply.filter(
        e => yUser.reply.some(e2 => e2.author === e.author),
      );

      bothRepliedAuthors.forEach((e) => {
        const existed = yUser.reply.find(e2 => e2.author === e.author);
        e.count += existed.count;
      });

      authorArr.sort((a, b) => {
        const speA = bothRepliedAuthors.find(e => e.author === a.id);
        if (speA) {
          const speB = bothRepliedAuthors.find(e => e.author === b.id);
          if (speB) {
            if (speA.count > speB.count) return -1;
            return 1;
          }
          return -1;
        }
        return 1;
      });
      console.log('bothRepliedAuthors', bothRepliedAuthors);
      console.log('sorted authors', authorArr);
      updateArticleMatrix(articles, bothRepliedArticles, index);
      updateUserMatrix(bothRepliedArticles, index, i);
      d3.select('.authorAxisY').selectAll(`.tick.${yID}`)
        .selectAll('text')
        .transition()
        .duration(1000)
        .style('font-size', '25px')
        .style('stroke', 'black');
      d3.select('.authorAxisY').selectAll(`.tick.${xID}`)
        .selectAll('text')
        .transition()
        .duration(1000)
        .style('font-size', '25px')
        .style('stroke', 'black');
      // drawUserRepliedArticleMatrix(articles);
      // drawUserRepliedAuthorMatrix(authorArr);
      // drawAuthorArticleMatrix(articles, authorArr);
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
    // const data_ready = pie(d3.entries(data1));
    const [maxRepliedSameArticles, maxRepliedArticles] = computeScaleMaximum();
    console.log('maxRepliedSameArticles, maxRepliedArticles', maxRepliedSameArticles, maxRepliedArticles);
    const circleRadiusScaleForSameArticles = d3.scaleLinear()
      .domain([0, maxRepliedSameArticles]).range([0, 10]);
    const circleRadiusScaleForRepliedArticles = d3.scaleLinear()
      .domain([0, maxRepliedArticles]).range([0, 10]);
    for (let i = 0; i < permuted_mat.length; i += 1) {
      leftSvg.append('g').selectAll()
        .data(secondOrdering_mat[i])
        .enter()
        .append('rect')
        .attr('class', (d, index) => {
          const xUserID = newUserAxisValues[index];
          const yUserID = newUserAxisValues[i];
          return `${xUserID} ${yUserID} y${i} x${index}`;
        })
        .attr('x', (d, index) => x(index))
        .attr('y', y(i))
        .attr('width', x.bandwidth())
        .attr('height', y.bandwidth())
        .style('fill', (d, index) => {
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
        .attr('stroke', 'white')
        .attr('visibility', (d, index) => {
          if (i < index) return 'visible';
          return 'hidden';
        })
        .on('mouseover', (d, index) => mouseover(d, index, i))
        .on('mouseout', mouseout)
        .on('click', (d, index) => rectClick(d, index, i));

      // circle heatMap
      leftSvg.append('g').selectAll()
        .data(secondOrdering_mat[i])
        .enter()
        .append('circle')
        .attr('class', (d, index) => `x${index} y${i}`)
        .attr('cx', (d, index) => x(index) + (x.bandwidth() / 2))
        .attr('cy', y(i) + (y.bandwidth() / 2))
        .attr('r', (d, index) => {
          const xUser = data.find(e => e.id === newUserAxisValues[index]);
          const yUser = data.find(e => e.id === newUserAxisValues[i]);
          if (index === i) return circleRadiusScaleForRepliedArticles(xUser.repliedArticle.length);
          const sameArticlesNum = xUser.repliedArticle.filter(
            value1 => yUser.repliedArticle.some(value2 => value2.article_id === value1.article_id),
          ).length;
          return circleRadiusScaleForSameArticles(sameArticlesNum);
        })
        .style('fill', (d, index) => {
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
        .attr('visibility', (d, index) => {
          if (i === index) return 'visible';
          return 'hidden';
        })
        .on('mouseover', (d, index) => mouseover(d, index, i))
        .on('mouseout', mouseout)
        .on('click', (d, index) => rectClick(d, index, i));
    }

    // piechart in heatmap
    // drawPieChartHeatmap();
    const rightSvg = group.append('g')
      .attr('class', 'rightSvg')
      .attr('transform', 'scale(1) translate(100, 100)');
    // rightSvg.append('g').attr('class', 'authorAxisX')
    //   .call(d3.axisTop(x).tickFormat((d, i) => newUserAxisValuesByAuthor[i]));
    // rightSvg.append('g').attr('class', 'authorAxisY')
    //   .call(d3.axisLeft(y).tickFormat((d, i) => newUserAxisValuesByAuthor[i]));
    // rightSvg.selectAll('.tick')
    //   .on('click', (d) => {
    //     tickClick(d);
    //   });

    for (let i = 0; i < permuted_mat.length; i += 1) {
      rightSvg.append('g')
        .selectAll()
        .data(secondOrdering_matByAuthor[i])
        .enter()
        .append('rect')
        .attr('class', (d, index) => {
          const actualXUserIndex = newUserAxisValues.findIndex(
            e => e === newUserAxisValuesByAuthor[index],
          );
          const actualYUserIndex = newUserAxisValues.findIndex(
            e => e === newUserAxisValuesByAuthor[i],
          );
          const xUserID = newUserAxisValues[actualXUserIndex];
          const yUserID = newUserAxisValues[actualYUserIndex];
          return `${xUserID} ${yUserID} y${actualYUserIndex} x${actualXUserIndex}`;
        })
        .attr('x', (d, index) => {
          const actualXUserIndex = newUserAxisValues.findIndex(
            e => e === newUserAxisValuesByAuthor[index],
          );
          return x(actualXUserIndex);
        })
        .attr('y', () => {
          const actualYUserIndex = newUserAxisValues.findIndex(
            e => e === newUserAxisValuesByAuthor[i],
          );
          return y(actualYUserIndex);
        })
        .attr('width', x.bandwidth())
        .attr('height', y.bandwidth())
        .style('fill', (d, index) => {
          const xUser = community.find(e => e.id === newUserAxisValuesByAuthor[index]);
          const yUser = community.find(e => e.id === newUserAxisValuesByAuthor[i]);
          if (xUser.community === yUser.community) {
            const communityColor = d3.scaleLinear()
              .range(['white', color(xUser.community)])
              .domain([0, 100]);
            return communityColor(d);
          }
          return leftMyColor(d);
        })
        .attr('stroke', 'white')
        .attr('visibility', (d, index) => {
          const actualXUserIndex = newUserAxisValues.findIndex(
            e => e === newUserAxisValuesByAuthor[index],
          );
          const actualYUserIndex = newUserAxisValues.findIndex(
            e => e === newUserAxisValuesByAuthor[i],
          );
          if (actualYUserIndex <= actualXUserIndex) return 'hidden';
          return 'visible';
        })
        .on('mouseover', (d, index) => {
          const actualXUserIndex = newUserAxisValues.findIndex(
            e => e === newUserAxisValuesByAuthor[index],
          );
          const actualYUserIndex = newUserAxisValues.findIndex(
            e => e === newUserAxisValuesByAuthor[i],
          );
          mouseover(d, actualXUserIndex, actualYUserIndex);
        })
        .on('mouseout', mouseout)
        .on('click', (d, index) => {
          const actualXUserIndex = newUserAxisValues.findIndex(
            e => e === newUserAxisValuesByAuthor[index],
          );
          const actualYUserIndex = newUserAxisValues.findIndex(
            e => e === newUserAxisValuesByAuthor[i],
          );
          rectClick(d, actualXUserIndex, actualYUserIndex);
        });
    }

    const articleGroup = group.append('g')
      .attr('class', 'articleGroup')
      .attr('transform', `translate(${newUserAxisValues.length * gridSize + 100}, 100)`);
    const authorGroup = group.append('g')
      .attr('class', 'authorGroup')
      .attr('transform', `translate(100, ${newUserAxisValues.length * gridSize + 100})`);
    const authorArticleGroup = group.append('g')
      .attr('class', 'authorArticleGroup');
    const leftSvgLineGroup = leftSvg.append('g');
    drawUserRepliedArticleMatrix(articlesOrderByCommunity);
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
      // articleGroup.selectAll('*').remove();
      // articleGroup.selectAll('.articleXAxis').remove();
      const article_titles = articleArray.map(e => e.article_title);
      const xScale = d3.scaleBand()
        .range([0, article_titles.length * gridSize])
        .domain(article_titles);
      // const xScale = d3.scaleBand()
      //   .range([0, article_titles.length])
      //   .domain(article_titles);
      articleGroup.append('g')
        .attr('class', 'articleXAxis')
        .call(d3.axisTop(xScale));
      const yScale = d3.scaleBand()
        .domain(newUserAxisValues)
        .range([0, newUserAxisValues.length * gridSize]);

      // vertical line
      const lineGroup = articleGroup.append('g')
        .attr('class', 'lineGroup');
      for (let i = 0; i < article_titles.length; i += 1) {
        lineGroup.append('line')
          .attr('x1', i * xScale.bandwidth())
          .attr('x2', i * xScale.bandwidth())
          .attr('y1', 0)
          .attr('y2', newUserAxisValues.length * gridSize)
          .attr('stroke-width', '1px')
          .attr('stroke', 'black');
      }
      // horizontal line
      for (let i = 0; i < newUserAxisValues.length; i += 1) {
        lineGroup.append('line')
          .attr('y1', (i + 1) * gridSize)
          .attr('y2', (i + 1) * gridSize)
          .attr('x1', 0)
          .attr('x2', article_titles.length * gridSize)
          .attr('stroke-width', '0.5px')
          .attr('stroke', 'black');
      }
      const focus = group.append('g')
        .attr('class', 'focus')
        .attr('transform', `translate(${100},${newUserAxisValues.length * gridSize + 120})`);
      for (let i = 0; i < data.length; i += 1) {
        articleGroup.append('g')
          .attr('class', data[i].id)
          .selectAll('circle')
          .data(data[i].repliedArticle)
          .enter()
          .append('g', d => d.article_id)
          .each((d, index, nodes) => {
            const postYear = new Date(d.date).getFullYear();
            const commentTimeGroup = [[], [], [], [], []];
            d.messages.filter(e => e.push_userid === data[i].id).forEach((mes) => {
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
                const userIndex = newUserAxisValues.findIndex(e => e === data[i].id);
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
          .attr('class', data[i].id)
          .selectAll('circle')
          .data(data[i].repliedArticle)
          .enter()
          .append('g', d => d.article_id)
          .attr('transform', d => `translate(${xScale(d.article_title)},0)`)
          .each((d, index, nodes) => {
            const postYear = new Date(d.date).getFullYear();
            const commentTimeGroup = [[], [], [], [], []];
            d.messages.filter(e => e.push_userid === data[i].id).forEach((mes) => {
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
            const lastPushTimeWithoutYear = dateFormat(d.messages[d.messages.length - 1]);
            const lastPushTime = new Date(lastPushTimeWithoutYear).setFullYear(postYear);
            const pushPositionScale = d3.scaleLinear()
              .domain([new Date(d.date), new Date(lastPushTime)])
              .range([0, gridSize - 1]);

            d3.select(nodes[index]).selectAll('rect')
              .data(d.messages.filter(e => e.push_userid === data[i].id))
              .enter()
              .append('rect')
              .attr('x', e => pushPositionScale(new Date(dateFormat(e)).setFullYear(postYear)))
              .attr('y', e => yScale(data[i].id))
              .attr('height', yScale.bandwidth())
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
                console.log(d);
                if (d.messages) {
                  d.messages.forEach((m) => {
                    if (m.push_userid === data[i].id) {
                      if (m.push_content === e.push_content) {
                        commentString += `<strong style='color: red'>${m.push_tag} ${m.push_content} ${dateFormat(m)} </strong> <br>`;
                      } else {
                        commentString += `${m.push_tag} ${m.push_content} ${dateFormat(m)} <br>`;
                      }
                    }
                  });
                }
                console.log(commentString);
                const tooltipString = `Replyer: ${data[i].id} <br> 
                  Author: ${d.author} <br> Post: ${d.article_title} <br>
                  pushContent: <br> ${commentString}`;
                authorGroupMouseover(tooltipString);
              })
              .on('mouseout', mouseout);
          })
          .append('title')
          .text(d => `${data[i].id} title: ${d.article_title}`);
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
    function updateArticleMatrix(articleArray, highlightArticles, userIndex) {
      articleGroup.selectAll('.articleXAxis').remove();
      articleGroup.select('.lineGroup').selectAll('line').remove();
      const article_titles = articleArray.map(e => e.article_title);
      const highlightArticle_id = highlightArticles.map(e => e.article_id);
      // const xScale = d3.scaleBand()
      //   .range([0, article_titles.length * gridSize])
      //   .domain(article_titles);
      const focusGridWidth = 25;
      const xScale = d3.scaleBand()
        .range([0, article_titles.length * 2])
        .domain(article_titles);
      const highlightArticleXScale = d3.scaleBand()
        .range([0, highlightArticle_id.length * 2])
        .domain(highlightArticle_id);
      const focusScaleX = d3.scaleBand()
        .range([0, highlightArticle_id.length * focusGridWidth])
        .domain(highlightArticle_id);
      const yScale = d3.scaleBand()
        .domain(newUserAxisValues)
        .range([0, newUserAxisValues.length * gridSize]);

      highlightArticle_id.forEach((id) => {
        data.forEach((usr) => {
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
      for (let i = 0; i < data.length; i += 1) {
        articleGroup.select(`g.${newUserAxisValues[i]}`)
          .selectAll('g')
          .each((d, index, nodes) => {
            d3.select(nodes[index]).selectAll('.nonLinearTime')
              .transition()
              .duration(1000)
              .attr('opacity', () => {
                if (highlightArticles.some(e => e.article_id === d.article_id)) {
                  return 1;
                }
                return 0;
              })
              .attr('transform', () => {
                if (highlightArticles.some(e => e.article_id === d.article_id)) {
                  const userOffset = (newUserAxisValues.length - userIndex - 1) * gridSize;
                  return `translate(${highlightArticleXScale(d.article_id) - userOffset}, ${y(i)})`;
                }
                return '';
              });
            const postYear = new Date(d.date).getFullYear();
            d3.select(nodes[index]).selectAll('rect')
              // .data(d.messages.filter(e => e.push_userid === data[i].id))
              .transition()
              .duration(1000)
              .attr('x', (e) => {
                let commentOffset = 0;
                // const commentOffset = pushPositionScale(new Date(e.push_ipdatetime)
                //   .setFullYear(postYear));
                const userOffset = (newUserAxisValues.length - userIndex - 1) * gridSize;
                return xScale(d.article_title) + commentOffset - userOffset;
              })
              .attr('y', e => yScale(data[i].id))
              .transition()
              .duration(1000)
              .attr('visibility', 'hidden')
              .remove();
          });
      }

      const highlightArticleXScale2 = d3.scaleBand()
        .range([0, highlightArticle_id.length * 2])
        .domain(highlightArticle_id);
      const yScale2 = d3.scaleBand()
        .domain(newUserAxisValues)
        .range([0, newUserAxisValues.length * gridSize * 2]);

      const brush = d3.brushX()
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
      const focusLineGroup = focus.append('g')
        .attr('class', 'lineGroup');
      const context = articleGroup;


      highlightArticleXScale2.domain(focusScaleX.domain());
      yScale2.domain(yScale.domain());

      // for (let i = 0; i < data.length; i += 1) {
      //   console.log(focus);
      //   focus.append('g')
      //     .selectAll('line')
      //     .data(data[i].repliedArticle)
      //     .enter()
      //     .append('line')
      //     .attr('x1')
      //     .attr('y1')
      //     .attr('x2')
      //     .attr('y2')
      //     .attr('stroke-width', '1px')
      //     .attr('stroke', 'black');
      // }

      // focus.append('g')
      //   .attr('class', 'axis axis--x')
      //   .attr('transform', `translate(0,${height})`)
      //   .call(xAxis);

      // focus.append('g')
      //   .attr('class', 'axis axis--y')
      //   .call(yAxis);

      // context.append('path')
      //   .datum(data)
      //   .attr('class', 'area')
      //   .attr('d', area2);

      // context.append('g')
      //   .attr('class', 'axis axis--x')
      //   .attr('transform', `translate(0,${height2})`)
      //   .call(xAxis2);
      context.select('.brush').remove();
      context.append('g')
        .attr('class', 'brush')
        .attr('transform', () => {
          const userOffset = (newUserAxisValues.length - userIndex - 1) * gridSize;
          return `translate(-${userOffset}, 0)`;
        })
        .call(brush)
        .call(brush.move, highlightArticleXScale2.range());

      // svg.append('rect')
      //   .attr('class', 'zoom')
      //   .attr('width', width)
      //   .attr('height', height)
      //   .attr('transform', `translate(${margin.left},${margin.top})`)
      //   .call(zoom);

      function brushed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return; // ignore brush-by-zoom
        const s = d3.event.selection || highlightArticleXScale2.range();
        const newDomain = highlightArticle_id.slice(s[0] / 2, s[1] / 2);

        focusScaleX.domain(newDomain);

        focusLineGroup.selectAll('*').remove();
        focusLineGroup.append('g');
        // horizontal
        for (let i = 0; i <= yScale.domain().length; i += 1) {
          focusLineGroup.append('line')
            .attr('x1', 0)
            .attr('y1', i * gridSize)
            .attr('x2', focusScaleX.domain().length * focusScaleX.bandwidth())
            .attr('y2', i * gridSize)
            .attr('stroke-width', '1px')
            .attr('stroke', 'black');
        }
        // vertical
        for (let i = 0; i <= focusScaleX.domain().length; i += 1) {
          focusLineGroup.append('line')
            .attr('x1', i * focusScaleX.bandwidth())
            .attr('y1', 0)
            .attr('x2', i * focusScaleX.bandwidth())
            .attr('y2', yScale.domain().length * gridSize)
            .attr('stroke-width', '1px')
            .attr('stroke', 'black');
        }
        // focus.select('.area').attr('d', area);
        // focus.select('.axis--x').call(xAxis);
        // svg.select('.zoom').call(zoom.transform, d3.zoomIdentity
        //   .scale(width / (s[1] - s[0]))
        //   .translate(-s[0], 0));
        // console.log(highlightArticle_id);
        for (let i = 0; i < data.length; i += 1) {
          focus.select(`.${data[i].id}`)
            .selectAll('g')
            .attr('transform', d => `translate(${focusScaleX(d.article_id)},0)`)
            .attr('opacity', d => (focusScaleX(d.article_id) !== undefined ? 1 : 0));
        }
      }

      // function zoomed() {
      //   if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') return; // ignore zoom-by-brush
      //   let t = d3.event.transform;
      //   x.domain(t.rescaleX(x2).domain());
      //   focus.select('.area').attr('d', area);
      //   focus.select('.axis--x').call(xAxis);
      //   context.select('.brush').call(brush.move, x.range().map(t.invertX, t));
      // }

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
        console.log(maxLength);
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
        rightSvg.selectAll(`.x${i}`)
          .transition()
          .duration(1000)
          .attr('transform', `translate(${articleOffset}, 0)`);
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
        rightSvg.selectAll(`.x${s}`)
          // .transition()
          // .duration(1000)
          .attr('x', x(0))
          .attr('cx', x(0) + (x.bandwidth() / 2));
        // move Y
        leftSvg.selectAll(`.y${s}`)
          .attr('y', y(0))
          .attr('cy', y(0) + (y.bandwidth() / 2));
        rightSvg.selectAll(`.y${s}`)
          .attr('y', y(0))
          .attr('cy', y(0) + (y.bandwidth() / 2));
        if (s !== l) {
          leftSvg.selectAll(`.x${l}`)
            .attr('x', x(1))
            .attr('cx', x(1) + (x.bandwidth() / 2));
          rightSvg.selectAll(`.x${l}`)
            .attr('x', x(1))
            .attr('cx', x(1) + (x.bandwidth() / 2));
          leftSvg.selectAll(`.y${l}`)
            .attr('y', y(1))
            .attr('cy', y(1) + (y.bandwidth() / 2));
          rightSvg.selectAll(`.y${l}`)
            .attr('y', y(1))
            .attr('cy', y(1) + (y.bandwidth() / 2));
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
              rightSvg.selectAll(`.x${i}`)
                .transition()
                .duration(1000)
                .attr('x', x(i + 2))
                .attr('cx', x(i + 2) + (x.bandwidth() / 2));
              leftSvg.selectAll(`.y${i}`)
                .attr('y', y(i + 2))
                .attr('cy', y(i + 2) + (y.bandwidth() / 2));
              rightSvg.selectAll(`.y${i}`)
                .attr('y', y(i + 2))
                .attr('cy', y(i + 2) + (y.bandwidth() / 2));
            } else if (i < l) {
              leftSvg.selectAll(`.x${i}`)
                .transition()
                .duration(1000)
                .attr('x', x(i + 1))
                .attr('cx', x(i + 1) + (x.bandwidth() / 2));
              rightSvg.selectAll(`.x${i}`)
                .transition()
                .duration(1000)
                .attr('x', x(i + 1))
                .attr('cx', x(i + 1) + (x.bandwidth() / 2));
              leftSvg.selectAll(`.y${i}`)
                .attr('y', y(i + 1))
                .attr('cy', y(i + 1) + (y.bandwidth() / 2));
              rightSvg.selectAll(`.y${i}`)
                .attr('y', y(i + 1))
                .attr('cy', y(i + 1) + (y.bandwidth() / 2));
            }
          } else if (i < s) {
            leftSvg.selectAll(`.x${i}`)
              .transition()
              .duration(1000)
              .attr('x', x(i + 1))
              .attr('cx', x(i + 1) + (x.bandwidth() / 2));
            rightSvg.selectAll(`.x${i}`)
              .transition()
              .duration(1000)
              .attr('x', x(i + 1))
              .attr('cx', x(i + 1) + (x.bandwidth() / 2));
            leftSvg.selectAll(`.y${i}`)
              .attr('y', y(i + 1))
              .attr('cy', y(i + 1) + (y.bandwidth() / 2));
            rightSvg.selectAll(`.y${i}`)
              .attr('y', y(i + 1))
              .attr('cy', y(i + 1) + (y.bandwidth() / 2));
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

      for (let i = 0; i < data.length; i += 1) {
        authorGroup.append('g').selectAll('circle')
          .data(data[i].reply)
          .enter()
          .append('g')
          .attr('class', `${data[i].id}`)
          .each((d, index, nodes) => {
            const repliedAuthor = authorArray.find(a => a.id === d.author);
            d3.select(nodes[index]).selectAll('rect')
              .data(d.articles)
              .enter()
              .append('rect')
              .attr('x', e => xScale(data[i].id))
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
              .attr('fill', () => {
                const u = community.find(e => e.id === data[i].id);
                return color(u.community);
              })
              // .attr('stroke', 'lightgray')
              // .attr('stroke-width', '0.5px')
              .on('mouseover', (e) => {
                let commentString = '';
                console.log(e);
                if (e.push_content) {
                  e.push_content.forEach((m) => {
                    commentString += `${m.push_tag} ${m.push_content} <br>`;
                  });
                }
                console.log(commentString);
                const tooltipString = `Replyer: ${data[i].id} <br> 
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
      //   const u = community.find(e => e.id === data[i].id);
      //   return color[u.community];
      // })
      // .append('title')
      // .text(d => `${data[i].id} title: ${d.article_title}`);
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
          const xUser = data.find(e => e.id === xUserID);
          const yUser = data.find(e => e.id === yUserID);
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
          const xUser = data.find(e => e.id === xUserID);
          console.log(xUser);
          const yUser = data.find(e => e.id === yUserID);
          const sameArticlesNum = xUser.repliedArticle.filter(
            value1 => yUser.repliedArticle.some(value2 => value2.article_id === value1.article_id),
          ).length;
          const pieData = {
            xUserID: xUser.repliedArticle.length - sameArticlesNum,
            sameAritcles: sameArticlesNum,
            yUserID: yUser.repliedArticle.length - sameArticlesNum,
          };
          console.log(pieData);
          const data_ready = pie(d3.entries(pieData));
          drawPieChart(data_ready, j, i);
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

  function relationToMatrix(sim) {
    const mat = [];
    const origMat = [];
    for (let i = 0; i < user.length; i += 1) {
      mat.push(Array(user.length).fill(1));
      origMat.push(Array(user.length).fill(1));
    }

    sim.forEach((e) => {
      const sourceUserIndex = user.findIndex(u => u === e.source);
      const targetUserIndex = user.findIndex(u => u === e.target);
      mat[sourceUserIndex][targetUserIndex] = e.value;
      mat[targetUserIndex][sourceUserIndex] = e.value;
      origMat[sourceUserIndex][targetUserIndex] = e.value;
      origMat[targetUserIndex][sourceUserIndex] = e.value;
    });

    console.log('origMat', origMat);
    return [mat, origMat];
  }

  function matrixReordering(mat, origMat, userAxis) {
    for (let i = 0; i < user.length; i += 1) {
      userAxis.push(Array(user.length).fill(''));
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
    console.log('permutation', perm);
    let tempUser = [...user];
    for (let j = 0; j < user.length; j += 1) {
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
    console.log('permutedMatrix', permutedMat);
    console.log('userAxis', userAxis);
    return [permutedMat, originalMat];
  }

  function matrixReorderingByCommunity(mat, origMat, com, userAxis) {
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
    console.log('community permutation for matrix', perm);
    const tempUser = userAxis.slice();
    for (let j = 0; j < user.length; j += 1) {
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
        array.push({
          source: temp.article_id,
          target: next.article_id,
          value: similarity,
        });
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
    console.log('node after clustering', final);
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
