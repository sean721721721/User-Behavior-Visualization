/* eslint-disable no-console */
/* eslint-disable prefer-const */
/* eslint-disable react/prop-types */
import React from 'react';
import * as d3 from 'd3';
import { OpinionLeader } from './OpinionLeader';
import { commentTimeline } from './commentTimeline';
import { userActivityTimeline } from './userActivityTimeline';
import { userSimilarityGraph } from './userSimilarityGraph';
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
    let articleCellSvg = d3.select('#articleCell');
    let commentTimelineSvg = d3.select('#commentTimeline');
    let userSimilaritySvg = d3.select('#timeLine');
    // if (data) {
    // }

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
            since: date1,
            until: date2,
            contentfilter: keyword3,
            authorfilter: author1,
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
      const strauthor1 = `author1=${author1}` || '';
      const strkeyword1 = `keyword1=${''}` || '';
      const strkeyword3 = `keyword3=${keyword3}` || '';
      const stractivity = `activity=${1}` || '';
      const searchurl = '/searching?';
      const str = `${searchurl + strminvar1}&${strmaxvar1}&${strposttype}&`
      + `${strpage1}&${strtime1}&${strtime2}&${strauthor1}&${struser1}&${strkeyword1}&${strkeyword3}&${stractivity}&`;
      return str;
    }

    function buildUserList(userLists, articles, userId) {
      const authorList = [];
      articles.forEach((article) => {
        if (article.messages.some(e => e.push_userid === userId)) {
          const existedAuthorList = authorList.find(e => e.author === article.author);
          if (existedAuthorList) {
            existedAuthorList.count += 1;
          } else {
            authorList.push({ author: article.author, count: 1 });
          }
        }
      });
      userLists.push({ id: userId, reply: authorList });
    }

    function handleSubmit(e) {
      // e.preventDefault();
      const myRequest = [];
      const userListArray = [];
      e.forEach((id) => {
        const url = encodeURI(getReqstr(id));
        myRequest.push(new Request(url, {
          method: 'get',
        }));
      });
      const resArr = [];
      const min = Math.min(myRequest.length, 10);
      console.log(myRequest);
      fetch(myRequest[0])
        .then(response => response.json())
        .then((response) => {
          resArr.push(response[0][0]);
          buildUserList(userListArray, response[0][0], e[0]);
          for (let i = 1; i < min; i += 1) {
            fetch(myRequest[i])
              .then(res => res.json())
              .then((res) => {
                resArr.push(res[0][0]);
                buildUserList(userListArray, res[0][0], e[i]);
                return res;
              })
              .then(() => {
                if (i === min - 1) {
                  const articlesArr = resArrayToArticlesArray(resArr);
                  userActivityTimeline(articlesArr, commentTimelineSvg, e.slice(0, min));
                  userSimilarityGraph(userListArray, userSimilaritySvg, e.slice(0, min));
                }
              });
          }
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
        <div className="articleCell">
          <div
            className="opinionLeaderfilterBar"
            id="timeSlider"
            style={{ width: '100%', height: '25px', padding: '0px 10px' }}
          />
          <svg id="articleCell" width="100%" height="94%" />
        </div>
        <div className="selectedUserTable" style={{ maxHeight: '700px', overflowY: 'scroll' }} />
        <div
          className="commentTimeline"
          style={{
            // position: 'absolute',
            // top: '15px',
            // left: '15px',
            overflowY: 'scroll',
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
