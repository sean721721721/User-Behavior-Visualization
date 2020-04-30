/* eslint-disable no-console */
/* eslint-disable prefer-const */
/* eslint-disable react/prop-types */
import React from 'react';
import * as d3 from 'd3';
import { OpinionLeader } from './OpinionLeader';
import { commentTimeline } from './commentTimeline';
import { userActivityTimeline } from './userActivityTimeline';
import { userSimilarityGraph } from './userSimilarityGraph';
import { loading } from './loading';
import WordTree from './wordTree';

class OpinionLeaderView extends React.Component {
  componentDidUpdate() {
    const { data } = this.props;
    let {
      cellData,
      beforeThisDate,
      cellForceSimulation,
      totalAuthorInfluence,
      optionsWord,
    } = data;
    let articleCellSvg = d3.select('#graph');
    let commentTimelineSvg = d3.select('#commentTimeline');
    let userSimilaritySvg = d3.select('#timeLine');

    function resArrayToArticlesArray(resArray) {
      const articlesArray = [];
      resArray.forEach((arr) => {
        arr.forEach((a) => {
          if (!articlesArray.some(e => e.article_id === a.article_id)) {
            articlesArray.push(a);
          }
        });
      });
      return articlesArray;
    }

    function getReqstr(id) {
      const {
        menuprops: {
          initParameter: {
            var1: varname1, min1: minvar1, max1: maxvar1, posttype,
          },
          initPage1: {
            pagename: pagename1,
            // since: date1,
            // until: date2,
            contentfilter: keyword3,
            // authorfilter: author1,
          },
        },
      } = data.opState;

      const beginDate = d3.select('#date1').attr('value');
      const endDate = d3.select('#date2').attr('value');
      // make url string for request data
      const strminvar1 = `min${varname1}=${minvar1}` || '';
      const strmaxvar1 = `max${varname1}=${maxvar1}` || '';
      const strposttype = `posttype=${posttype}` || '';
      const strpage1 = `page1=${pagename1}` || '';
      const strtime1 = `time1=${beginDate}` || '';
      const strtime2 = `time2=${endDate}` || '';
      const struser1 = `user1=${id}` || '';
      const strauthor1 = `author1=${''}` || '';
      const strkeyword1 = `keyword1=${''}` || '';
      const strkeyword3 = `keyword3=${keyword3}` || '';
      const stractivity = `activity=${1}` || '';
      const searchurl = '/searching?';
      const str = `${searchurl + strminvar1}&${strmaxvar1}&${strposttype}&`
      + `${strpage1}&${strtime1}&${strtime2}&${strauthor1}&${struser1}&${strkeyword1}&${strkeyword3}&${stractivity}&`;
      return str;
    }

    function buildUserList(userLists, articles, userId) {
      // console.log(articles, userId);
      const authorList = [];
      let totalReplyCount = 0;
      articles.forEach((article) => {
        if (article.messages.some(e => e.push_userid === userId)) {
          const existedAuthorList = authorList.find(e => e.author === article.author);
          totalReplyCount += 1;
          if (existedAuthorList) {
            existedAuthorList.count += 1;
          } else {
            authorList.push({ author: article.author, count: 1 });
          }
        }
      });
      userLists.push({ id: userId, reply: authorList, totalReplyCount });
    }

    function handleSubmit(e) {
      // e.preventDefault();
      const userNumsPerRequest = 30;
      const { length } = e;
      const myRequest = [];
      const userListArray = [];
      const min = Math.min(e.length, userNumsPerRequest);
      const fixedUserArr = [e.slice(0, min)];
      // console.log(fixedUserArr);
      const url = [encodeURI(getReqstr(fixedUserArr[0]))];
      for (let i = 1; i < length / userNumsPerRequest; i += 1) {
        fixedUserArr.push(e.slice(i * userNumsPerRequest, (i + 1) * userNumsPerRequest));
        // console.log(fixedUserArr);
        url.push(encodeURI(getReqstr(fixedUserArr[i])));
      }
      url.forEach((u) => {
        myRequest.push(new Request(u, {
          method: 'get',
        }));
      });
      // console.log(url);
      // console.log(myRequest);
      loading(0, myRequest.length, commentTimelineSvg);
      const resArr = [];
      fetch(myRequest[0])
        .then(response => response.json())
        .then((response) => {
          resArr.push(response[0][0]);
          loading(resArr.length, myRequest.length, commentTimelineSvg);
          for (let j = 0; j < fixedUserArr[0].length; j += 1) {
            buildUserList(userListArray, response[0][0], fixedUserArr[0][j]);
          }
          if (myRequest.length === 1) {
            userActivityTimeline(response[0][0], commentTimelineSvg, fixedUserArr[0]);
            userSimilarityGraph(userListArray, userSimilaritySvg, fixedUserArr[0], response[0][0]);
          }
          for (let i = 1; i < myRequest.length; i += 1) {
            fetch(myRequest[i])
              .then(res => res.json())
              .then((res) => {
                resArr.push(res[0][0]);
                loading(resArr.length, myRequest.length, commentTimelineSvg);
                // console.log(res[0][0]);
                for (let j = 0; j < fixedUserArr[i].length; j += 1) {
                  buildUserList(userListArray, res[0][0], fixedUserArr[i][j]);
                }
                return res;
              })
              .then(() => {
                console.log(`recieveDataCount: ${resArr.length}, total: ${myRequest.length}`);
                if (resArr.length === myRequest.length) {
                  const articlesArr = resArrayToArticlesArray(resArr);
                  // console.log(articlesArr);
                  let usrArr = [];
                  for (let j = 0; j < fixedUserArr.length; j += 1) {
                    usrArr = usrArr.concat(fixedUserArr[j]);
                  }
                  userActivityTimeline(articlesArr, commentTimelineSvg, usrArr);
                  userSimilarityGraph(userListArray, userSimilaritySvg, usrArr, articlesArr);
                }
              });
          }
          // const articlesArr = resArr[0];
          // userActivityTimeline(articlesArr, commentTimelineSvg, fixedUserArr);
          // userSimilarityGraph(userListArray, userSimilaritySvg, fixedUserArr);
        })
        .catch((error) => {
          console.log(error);
        });
    }

    if (cellData.nodes) {
      if (data.$this.state.hover !== 1) {
        console.log('do OPView rendering');
        OpinionLeader(cellData.nodes, cellData.links,
          beforeThisDate, articleCellSvg, cellForceSimulation,
          totalAuthorInfluence, data.$this, optionsWord, handleSubmit);
      }
      commentTimeline(cellData.nodes, commentTimelineSvg, data.$this);
    }
  }

  render() {
    const { data } = this.props;
    const { word, optionsWord } = data;
    return (
      <div className="opinionLeaderView">
        {/* <div className="articleCell">
          <div
            className="opinionLeaderfilterBar"
            id="timeSlider"
            style={{ width: '100%', height: '25px', padding: '0px 10px' }}
          />
          <svg id="articleCell" width="100%" height="94%" />
        </div> */}
        <div className="heatMap" style={{ borderRight: '2px solid gray', overflowX: 'scroll', maxHeight: '700px', minHeight: '400px' }}>
          <svg id="timeLine" width="100%" height="600px" />
        </div>
        {/* <div className="selectedUserTable d-flex flex-column" style={{ margin: '20px 0px', maxHeight: '700px', minHeight: '400px' }} /> */}
        <div
          className="commentTimeline"
          style={{
            // position: 'absolute',
            // top: '15px',
            // left: '15px',
            overflowY: 'scroll',
            minHeight: '400px',
            maxHeight: '400px',
            // width: '280px',
            // height: '400px',
            // backgroundColor: '#e8e8e8',
            // border: '1px solid #AAAAAA',
            // borderRadius: '4px',
            // boxShadow: 'inset 1px 1px 6px 2px rgba(0,0,0, .25)',
          }}
        >
          <svg id="commentTimeline" width="100%" height="auto" />
        </div>
        <WordTree word={word} optionsWord={optionsWord} />
      </div>
    );
  }
}

export default OpinionLeaderView;
