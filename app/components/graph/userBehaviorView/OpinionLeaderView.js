/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable no-console */
/* eslint-disable prefer-const */
/* eslint-disable react/prop-types */
import React from 'react';
import * as d3 from 'd3';
// import { OpinionLeader } from './OpinionLeader';
import { treemap } from '../opinionLeaderView/opinionleaderTreemap';
// import { commentTimeline } from './commentTimeline';
// import { userActivityTimeline } from './userActivityTimeline';
import { userSimilarityGraph } from './userSimilarityGraph';
// import { userDailyActivity } from './userDailyActivity';
import { loading } from '../loading';
// import WordTree from './wordTree';

class OpinionLeaderView extends React.Component {
  componentDidUpdate() {
    const { data } = this.props;
    const userData = data || undefined;
    console.log(data);
    let articleCellSvg = d3.select('#graph');
    let commentTimelineSvg = d3.select('#commentTimeline');
    let userSimilaritySvg = d3.select('#timeLine');
    // let userDailyActivitySvg = d3.select('#userDailyActivity');
    const boardname = d3.select('#pagename1').attr('value');
    // const beginDate = d3.select('#date1').attr('value');
    // const endDate = d3.select('#date2').attr('value');
    if (userData) {
      console.log(userData);
      // userSimilarityGraph(testSimilarUserList, userSimilaritySvg, testSimilarUser, articleArr);
      // userData: {
      //   userListArray: response.userListArray,
      //   fixedUserArr,
      //   articles: response.articles,
      //   submit: handleSubmit,
      // },
      userSimilarityGraph(
        userData.userListArray,
        userSimilaritySvg,
        userData.fixedUserArr,
        userData.articles,
        userData.submit,
      );
      // if (data.$this.state.hover !== 1) {
      // console.log('do OPView rendering');
      // treemap(cellData.children,
      //   beforeThisDate, articleCellSvg, cellForceSimulation,
      //   totalAuthorInfluence, data.$this, optionsWord, handleSubmit);
      // OpinionLeader(cellData.nodes, cellData.links,
      //   beforeThisDate, articleCellSvg, cellForceSimulation,
      //   totalAuthorInfluence, data.$this, optionsWord, handleSubmit);
      // }
      // commentTimeline(cellData.nodes, commentTimelineSvg, data.$this);
    }

    const testSimilarUser = ['sasintw', 'ahw12000', 'OutBai', 'imsphzzz'];
    const testSimilarUserList = [
      {
        id: 'sasintw',
        reply: [
          { author: 'a', count: 2, articles: [{ article_title: '[QE] A' }, { article_title: '[QE] B' }] },
          { author: 'b', count: 1, articles: [{ article_title: '[QE] C' }] },
        ],
        totalReplyCount: 6,
        repliedArticle: [
          {
            article_id: 'a',
            article_title: '[QE] A',
            cuttedTitle: [{ word: 'a' }, { word: 'b' }],
            date: '2019-04-15T00:15:32.000Z',
            messages: [
              { push_userid: 'imsphzzz', push_tag: '推', push_ipdatetime: '04/15 09:51' },
              { push_userid: 'OutBai', push_tag: '→', push_ipdatetime: '04/15 19:22' },
              { push_userid: 'sasintw', push_tag: '推', push_ipdatetime: '04/15 20:22' },
            ],
          },
          {
            article_id: 'b',
            article_title: '[QE] B',
            cuttedTitle: [{ word: 'a' }, { word: 'b' }],
            date: '2019-04-15T00:36:32.000Z',
            messages: [
              { push_userid: 'sasintw', push_tag: '噓', push_ipdatetime: '04/15 09:51' },
              { push_userid: 'imsphzzz', push_tag: '→', push_ipdatetime: '04/15 19:22' },
            ],
          },
          {
            article_id: 'c',
            article_title: '[QE] C',
            cuttedTitle: [{ word: 'a' }, { word: 'b' }],
            date: '2019-04-15T00:42:00.000Z',
            messages: [
              { push_userid: 'sasintw', push_tag: '推', push_ipdatetime: '04/15 09:51' },
              { push_userid: 'OutBai', push_tag: '→', push_ipdatetime: '04/15 19:22' },
            ],
          },
        ],
      },
      {
        id: 'ahw12000',
        reply: [{ author: 'b', count: 2, articles: [{ article_title: 'D' }, { article_title: 'E' }] }, { author: 'c', count: 1, articles: [{ article_title: 'F' }] }],
        totalReplyCount: 64,
        repliedArticle: [
          {
            article_id: 'd', article_title: '[BO] D', cuttedTitle: [{ word: 'c' }, { word: 'd' }], date: '2019-04-15T01:02:06.000Z', messages: [{ push_userid: 'ahw12000', push_tag: '推', push_ipdatetime: '04/15 09:51' }, { push_userid: 'OutBai', push_tag: '噓', push_ipdatetime: '04/15 19:22' }],
          },
          {
            article_id: 'e', article_title: '[BO] E', cuttedTitle: [{ word: 'c' }, { word: 'd' }], date: '2019-04-15T01:55:20.000Z', messages: [{ push_userid: 'ggggg', push_tag: '噓', push_ipdatetime: '04/15 09:51' }, { push_userid: 'ahw12000', push_tag: '→', push_ipdatetime: '04/15 19:22' }],
          },
          {
            article_id: 'f', article_title: '[BO] F', cuttedTitle: [{ word: 'c' }, { word: 'd' }], date: '2019-04-15T02:13:24.000Z', messages: [{ push_userid: 'imsphzzz', push_tag: '噓', push_ipdatetime: '04/15 19:11' }, { push_userid: 'ahw12000', push_tag: '推', push_ipdatetime: '04/15 19:22' }],
          }],
      },
      {
        id: 'OutBai',
        reply: [{ author: 'a', count: 1, articles: [{ article_title: 'A' }] }, { author: 'b', count: 2, articles: [{ article_title: 'C' }, { article_title: 'D' }] }],
        totalReplyCount: 24,
        repliedArticle: [
          {
            article_id: 'a',
            article_title: '[QE] A',
            cuttedTitle: [{ word: 'a' }, { word: 'b' }],
            date: '2019-04-15T00:15:32.000Z',
            messages: [{ push_userid: 'imsphzzz', push_tag: '推', push_ipdatetime: '04/15 09:51' },
              { push_userid: 'OutBai', push_tag: '→', push_ipdatetime: '04/15 19:22' },
              { push_userid: 'sasintw', push_tag: '推', push_ipdatetime: '04/15 20:22' }],
          },
          {
            article_id: 'c',
            article_title: '[QE] C',
            cuttedTitle: [{ word: 'a' }, { word: 'b' }],
            date: '2019-04-15T00:42:00.000Z',
            messages: [
              { push_userid: 'sasintw', push_tag: '推', push_ipdatetime: '04/15 09:51' },
              { push_userid: 'OutBai', push_tag: '→', push_ipdatetime: '04/15 19:22' },
            ],
          },
          {
            article_id: 'd', article_title: '[BO] D', cuttedTitle: [{ word: 'c' }, { word: 'd' }], date: '2019-04-15T01:02:06.000Z', messages: [{ push_userid: 'ahw12000', push_tag: '推', push_ipdatetime: '04/15 09:51' }, { push_userid: 'OutBai', push_tag: '噓', push_ipdatetime: '04/15 19:22' }],
          }],
      },
      {
        id: 'imsphzzz',
        reply: [{ author: 'a', count: 2, articles: [{ article_title: 'A' }, { article_title: 'B' }] }, { author: 'c', count: 1, articles: [{ article_title: 'F' }] }],
        totalReplyCount: 88,
        repliedArticle: [
          {
            article_id: 'a',
            article_title: '[QE] A',
            cuttedTitle: [{ word: 'a' }, { word: 'b' }],
            date: '2019-04-15T00:15:32.000Z',
            messages: [{ push_userid: 'imsphzzz', push_tag: '推', push_ipdatetime: '04/15 09:51' },
              { push_userid: 'OutBai', push_tag: '→', push_ipdatetime: '04/15 19:22' },
              { push_userid: 'sasintw', push_tag: '推', push_ipdatetime: '04/15 20:22' }],
          },
          {
            article_id: 'b',
            article_title: '[QE] B',
            cuttedTitle: [{ word: 'a' }, { word: 'b' }],
            date: '2019-04-15T00:36:32.000Z',
            messages: [
              { push_userid: 'sasintw', push_tag: '噓', push_ipdatetime: '04/15 09:51' },
              { push_userid: 'imsphzzz', push_tag: '→', push_ipdatetime: '04/15 19:22' },
            ],
          },
          {
            article_id: 'f', article_title: '[BO] F', cuttedTitle: [{ word: 'c' }, { word: 'd' }], date: '2019-04-15T02:13:24.000Z', messages: [{ push_userid: 'imsphzzz', push_tag: '噓', push_ipdatetime: '04/15 19:11' }, { push_userid: 'ahw12000', push_tag: '推', push_ipdatetime: '04/15 19:22' }],
          }],
      },
    ];
    const articleArr = [
      {
        article_id: 'a',
        article_title: '[QE] A',
        date: '2019-04-15T00:15:32.000Z',
        messages: [
          { push_userid: 'imsphzzz', push_tag: '推', push_ipdatetime: '04/15 09:51' },
          { push_userid: 'OutBai', push_tag: '→', push_ipdatetime: '04/15 19:22' },
          { push_userid: 'sasintw', push_tag: '推', push_ipdatetime: '04/15 20:22' },
        ],
        author: 'a',
      },
      {
        article_id: 'b',
        article_title: '[QE] B',
        date: '2019-04-15T00:36:32.000Z',
        messages: [
          { push_userid: 'sasintw', push_tag: '噓', push_ipdatetime: '04/15 09:51' },
          { push_userid: 'imsphzzz', push_tag: '→', push_ipdatetime: '04/15 19:22' },
        ],
        author: 'a',
      },
      {
        article_id: 'c',
        article_title: '[QE] C',
        date: '2019-04-15T00:42:00.000Z',
        messages: [
          { push_userid: 'sasintw', push_tag: '推', push_ipdatetime: '04/15 09:51' },
          { push_userid: 'OutBai', push_tag: '→', push_ipdatetime: '04/15 19:22' },
        ],
        author: 'b',
      },
      {
        article_id: 'd',
        article_title: '[BO] D',
        date: '2019-04-15T01:02:06.000Z',
        messages: [{ push_userid: 'ahw12000', push_tag: '推', push_ipdatetime: '04/15 09:51' }, { push_userid: 'OutBai', push_tag: '噓', push_ipdatetime: '04/15 19:22' }],
        author: 'b',
      },
      {
        article_id: 'e',
        article_title: '[BO] E',
        date: '2019-04-15T01:55:20.000Z',
        messages: [{ push_userid: 'ggggg', push_tag: '噓', push_ipdatetime: '04/15 09:51' }, { push_userid: 'ahw12000', push_tag: '→', push_ipdatetime: '04/15 19:22' }],
        author: 'b',
      },
      {
        article_id: 'f',
        article_title: '[BO] F',
        date: '2019-04-15T02:13:24.000Z',
        messages: [{ push_userid: 'imsphzzz', push_tag: '噓', push_ipdatetime: '04/15 19:11' }, { push_userid: 'ahw12000', push_tag: '推', push_ipdatetime: '04/15 19:22' }],
        author: 'c',
      },
    ];

    if (!userData) {
      userSimilarityGraph(testSimilarUserList, userSimilaritySvg, testSimilarUser, articleArr,
        // similarity,
      );
    }
    // userDailyActivity(testData, testUser, commentTimelineSvg, beginDate, endDate);
  }

  render() {
    const { data } = this.props;
    // const { word, optionsWord } = data;
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
        <div className="heatMap">
          <div className="optionDiv" style={{ width: '100%', display: 'grid' }}>
            <div className="row option d-flex justify-content-start" style={{ paddingLeft: '10px', width: '100%', display: 'inline' }} />
          </div>
          {/* <div className="option"/> */}
          <div className="timeline" style={{ width: '100%', display: 'grid' }}>
            {/* <svg id="timeLine" width="100%" height="100%" /> */}
            <svg id="timeLine" viewBox="0 0 826 755" />
          </div>
        </div>
        <div className="contextDiv" style={{ display: 'block' }}>
          <div className="row align-items-center p-0 col-sm" style={{ borderBottom: '2px solid slategray' }}>
            <div className="col-sm-4" style={{ padding: 0 }}><p id="value-range" /></div>
            <div className="col-sm-8" style={{ paddingLeft: '10px' }}><div id="slider-range" /></div>
          </div>
          {/* <div className="option " style={{width: '100%', height: '50px', display: 'block', borderBottom: '2px solid slategray' }}/> */}
          <div style={{ height: '100%' }}>
            {/* <svg id="context" width="100%" height="100%" /> */}
            <svg id="context" viewBox="0 0 500 1000" />
          </div>
        </div>
        {/* <div className="focusDiv">
          <svg id="focus" width="100%" height="100%" />
        </div> */}
        {/* <div className="selectedUserTable d-flex flex-column" style={{ margin: '20px 0px', maxHeight: '700px', minHeight: '400px' }} /> */}

        {/* <WordTree word={word} optionsWord={optionsWord} /> */}
      </div>
    );
  }
}

export default OpinionLeaderView;
