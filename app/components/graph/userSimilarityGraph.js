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
import jLouvain from './jLouvain';
import { userActivityTimeline } from './userActivityTimeline';

export default function userSimilarityGraph(data, svg, user, articles) {
  // console.log(user);
  const commentTimelineSvg = d3.select('#commentTimeline');
  console.log(math.sqrt(-4));
  console.log(data);
  console.log(user);
  svg.selectAll('*').remove();
  // set the dimensions and margins of the graph
  const margin = {
    top: 30, right: 30, bottom: 30, left: 30,
  };
  const width = 1300 - margin.left - margin.right;
  const height = 450 - margin.top - margin.bottom;

  // Labels of row and columns
  const myGroups = getAllAuthorId(data); // author
  const myVars = user;

  adjacencyMatrixNoAuthor();
  // heatMapWithAuthor();

  function adjacencyMatrixNoAuthor() {
    svg.attr('height', user.length * 20 + 150);
    svg.attr('width', user.length * 20 + 1500);
    // const similarity = computeUserSimilarity(data, user);
    const similarity = computeUserSimilarityByArticles(data, user);
    console.log(similarity);

    const community = jLouvainClustering(user, similarity);
    const color = d3.schemeTableau10;
    // responderCommunityDetecting(nodes, similarity);
    // console.log(nodes);

    const newUserAxisValues = [];
    const axisDomain = [];
    for (let i = 0; i < user.length; i += 1) {
      axisDomain.push(i);
    }
    const [matrix, origMatrix] = relationToMatrix(similarity);
    const similarityScale = d3.scalePow().exponent(2).range([0, 100]);
    // enlarge the difference between user
    for (let i = 0; i < user.length; i += 1) {
      matrix[i] = matrix[i].map(e => similarityScale(e));
      // matrix[i] = matrix[i].map(e => (e >= 0.5 && e < 2 ? 1 : e));
      // matrix[i] = matrix[i].map(e => e * 10);
    }
    console.log(matrix);
    const [
      permuted_mat,
      permuted_origMat,
    ] = matrixReordering(matrix, origMatrix, newUserAxisValues);
    const [
      secondOrdering_mat,
      secondOrdering_origMat,
    ] = matrixReorderingByCommunity(permuted_mat, permuted_origMat, community, newUserAxisValues);
    const x = d3.scaleBand()
      .range([0, axisDomain.length * 12])
      .domain(axisDomain)
      .padding(0.05);

    const leftSvg = svg.append('g')
      .attr('transform', 'scale(1) translate(100,100)');
    leftSvg.append('g')
      .attr('class', 'authorAxisX')
      .call(d3.axisTop(x).tickFormat((d, i) => newUserAxisValues[i]));

    const y = d3.scaleBand()
      .range([0, axisDomain.length * 12])
      .domain(axisDomain)
      .padding(0.05);
    leftSvg.append('g').call(d3.axisLeft(y).tickFormat((d, i) => newUserAxisValues[i]));
    leftSvg.selectAll('.tick')
      .on('click', (d) => {
        click(d);
      });
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
    const mouseover = (d) => {
      Tooltip
        .style('opacity', 1)
        .html(`similarity: ${Math.round(d * 100) / 100}`)
        .style('left', `${d3.event.pageX + 25}px`)
        .style('top', `${d3.event.pageY}px`);
      d3.select(this)
        .style('stroke', 'black')
        .style('opacity', 1);
    };
    const mouseout = (d) => {
      Tooltip
        .style('opacity', 0);
      d3.select(this)
        .style('stroke', 'none')
        .style('opacity', 0.8);
    };
    let selectedUser = [];
    const click = (d) => {
      console.log(d);
      if (!selectedUser.includes(newUserAxisValues[d])) {
        selectedUser.push(newUserAxisValues[d]);
      } else {
        selectedUser = selectedUser.filter(e => e !== newUserAxisValues[d]);
      }
      if (selectedUser.length >= 1) {
        const filteredArticles = articles.filter(art => art.messages.some(m => selectedUser.includes(m.push_userid)));
        userActivityTimeline(filteredArticles, commentTimelineSvg, selectedUser);
      }
    };

    for (let i = 0; i < secondOrdering_mat.length; i += 1) {
      leftSvg.append('g').selectAll()
        .data(secondOrdering_mat[i])
        .enter()
        .append('rect')
        .attr('x', (d, index) => x(index))
        .attr('y', y(i))
        .attr('width', x.bandwidth())
        .attr('height', y.bandwidth())
        .style('fill', (d, index) => {
          const xUser = community.find(e => e.id === newUserAxisValues[index]);
          const yUser = community.find(e => e.id === newUserAxisValues[i]);
          if (xUser.community === yUser.community) {
            const communityColor = d3.scaleLinear()
              .range(['white', color[xUser.community]])
              .domain([0, 100]);
            return communityColor(d);
          }
          return leftMyColor(d);
        })
        .on('mouseover', mouseover)
        .on('mouseout', mouseout);
    }
    svg.selectAll('.authorAxisX')
      .selectAll('.tick')
      .selectAll('text')
      .style('color', (d) => {
        const index = community.findIndex(e => e.id === newUserAxisValues[d]);
        return color[community[index].community];
      });
    const rightSvg = svg.append('g')
      .attr('transform', `scale(1) translate(${axisDomain.length * 20 + 200},100)`);
    rightSvg.append('g').attr('class', 'authorAxisX')
      .call(d3.axisTop(x).tickFormat((d, i) => newUserAxisValues[i]));
    rightSvg.append('g').call(d3.axisLeft(y).tickFormat((d, i) => newUserAxisValues[i]));
    rightSvg.selectAll('.tick')
      .on('click', (d) => {
        click(d);
      });

    for (let i = 0; i < permuted_mat.length; i += 1) {
      rightSvg.append('g').selectAll()
        .data(permuted_origMat[i])
        .enter()
        .append('rect')
        .attr('x', (d, index) => x(index))
        .attr('y', y(i))
        .attr('width', x.bandwidth())
        .attr('height', y.bandwidth())
        .style('fill', d => myColor(d))
        .on('mouseover', mouseover)
        .on('mouseout', mouseout);
    }

    svg.selectAll('g.authorAxisX')
      .selectAll('text')
      .attr('y', 0)
      .attr('x', 9)
      .attr('dy', '.35em')
      .attr('transform', 'rotate(-90)')
      .style('text-anchor', 'start');
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

    console.log(origMat);
    return [mat, origMat];
  }

  function matrixReordering(mat, origMat, userAxis) {
    for (let i = 0; i < user.length; i += 1) {
      userAxis.push(Array(user.length).fill(''));
    }

    const gra = reorder.mat2graph(mat);
    const perm = reorder.spectral_order(gra);

    const orig_gra = reorder.mat2graph(origMat);
    const orig_perm = reorder.spectral_order(orig_gra);
    console.log(perm);
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
    console.log(permutedMat);
    console.log(userAxis);
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
    console.log(perm);
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

  function heatMapWithAuthor() {
    // Build X scales and axis:
    const x = d3.scaleBand()
      .range([0, myGroups.length * 20])
      .domain(myGroups)
      .padding(0.05);
    svg.attr('width', myGroups.length * 20 + 60);
    svg = svg.append('g').attr('transform', 'translate(60,20)');
    svg.append('g')
      .attr('transform', `translate(0,${myVars.length * 20})`)
      .attr('class', 'authorAxisX')
      .call(d3.axisBottom(x));

    // Build X scales and axis:
    const y = d3.scaleBand()
      .range([myVars.length * 20, 0])
      .domain(myVars)
      .padding(0.05);
    svg.append('g').call(d3.axisLeft(y));

    // Build color scale
    const userColor = userColorScaleArray(data);
    // console.log(userColor);
    const myColor = d3.scaleLinear()
      .range([d3.interpolateRdYlGn(0.4), d3.interpolateRdYlGn(0.1)])
      .domain([1, 10]);
    const scaleExponent = d3.scalePow().exponent(2);
    const Tooltip = d3.select('#timeLine')
      .append('div')
      .style('opacity', 0)
      .attr('class', 'tooltip')
      .style('background-color', 'white')
      .style('border', 'solid')
      .style('border-width', '2px')
      .style('border-radius', '5px')
      .style('padding', '5px');

    // Three function that change the tooltip when user hover / move / leave a cell
    const mouseover = function (d) {
      Tooltip
        .style('opacity', 1);
      d3.select(this)
        .style('stroke', 'black')
        .style('opacity', 1);
    };
    const mousemove = function (d) {
      Tooltip
        .html(`The exact value of<br>this cell is: ${d.value}`)
        .style('left', `${d3.mouse(this)[0] + 70}px`)
        .style('top', `${d3.mouse(this)[1]}px`);
    };
    const mouseleave = function (d) {
      Tooltip
        .style('opacity', 0);
      d3.select(this)
        .style('stroke', 'none')
        .style('opacity', 0.8);
    };

    // Read the data
    svg.selectAll()
      .data(data)
      .enter()
      .each((d, i) => {
        svg.append('g')
          .attr('class', `${d.id}`)
          .selectAll('rect')
          .data(d.reply)
          .enter()
          .append('rect')
          .attr('x', d2 => x(d2.author))
          .attr('y', y(d.id))
          .attr('width', x.bandwidth())
          .attr('height', y.bandwidth())
          .style('fill', d2 => userColor[d.id](scaleExponent(d2.count)))
          .on('mouseover', mouseover)
          .on('mousemove', mousemove)
          .on('mouseleave', mouseleave)
          .append('title')
          .text(d2 => d2.count);
      });

    svg.selectAll('g.authorAxisX')
      .selectAll('text')
      .attr('y', 0)
      .attr('x', 9)
      .attr('dy', '.35em')
      .attr('transform', 'rotate(90)')
      .style('text-anchor', 'start');
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
    for (let i = 0; i < userAuthorRelationShipArr.length - 1; i += 1) {
      const temp = userAuthorRelationShipArr[i];
      for (let j = i + 1; j < userAuthorRelationShipArr.length; j += 1) {
        let linkValue = 0;
        const next = userAuthorRelationShipArr[j];
        temp.reply.forEach((e) => {
          const existedSameAuthor = next.reply.find(a => a.author === e.author);
          if (existedSameAuthor) {
            linkValue += e.count / temp.totalReplyCount;
            linkValue += existedSameAuthor.count / next.totalReplyCount;
          }
        });
        userListArray.push({ source: temp.id, target: next.id, value: linkValue });
      }
    }
    // userListArray = userListArray.filter(e => e.value >= 1);
    return userListArray;
  }

  function computeUserSimilarityByArticles(userAuthorRelationShipArr) {
    const userListArray = [];
    for (let i = 0; i < userAuthorRelationShipArr.length - 1; i += 1) {
      const temp = userAuthorRelationShipArr[i].repliedArticle;
      for (let j = i + 1; j < userAuthorRelationShipArr.length; j += 1) {
        const next = userAuthorRelationShipArr[j].repliedArticle;
        const tempdiff = temp.filter(o1 => next.filter(o2 => o2.article_id === o1.article_id).length === 0);
        const nextdiff = next.filter(o1 => temp.filter(o2 => o2.article_id === o1.article_id).length === 0);
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
    // const init_part = { joy2001billy: 0, yiersan: 1 };
    // console.log(edge_data);
    // const community = jLouvain()
    //   .nodes(nodes)
    //   .edges(edge_data)
    //   .partition_init(init_part);
    // const result = community();
    // console.log(result);

    console.log('Input Node Data2', nodes);
    console.log('Input Edge Data2', edge_data);

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

    console.log('Input Node Data3', node_data3);
    console.log('Input Edge Data3', edge_data3);

    const community3 = jLouvain().nodes(node_data3).edges(edge_data3);
    console.log(community3());
    // Drawing code
    const original_node_data = d3.entries(nodes);
    console.log(original_node_data);

    const forceSimulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.key));
    forceSimulation
      .nodes(original_node_data);

    forceSimulation
      .force('link')
      .links(edge_data3);
    // Communnity detection on click event
    const community_assignment_result = community3();
    console.log(original_node_data);
    console.log('Resulting Community Data', community_assignment_result);
    const final = [];
    const keys = Object.keys(community_assignment_result);
    for (let i = 0; i < keys.length; i += 1) {
      final.push({ id: nodes[keys[i]], community: community_assignment_result[keys[i]] });
    }
    console.log(final);
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
      links[i].source = dataNodes.findIndex(ele => ele.id === dataLinks[i].source.id || ele.id === dataLinks[i].source);
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
