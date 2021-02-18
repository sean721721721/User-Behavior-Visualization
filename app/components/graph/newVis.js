/* eslint-disable no-undef */
/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
/* eslint-disable linebreak-style */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
import React, { Component } from 'react';
// import PropTypes from 'prop-types';
// import { connect } from 'react-redux';
// import { push } from 'react-router-redux';
import * as d3 from 'd3';
// eslint-disable-next-line import/no-unresolved
import { AuthorTable } from './opinionLeaderView/authorTable';
import UserBehavior from './userBehaviorView/uerBehavior';
import { treemap } from './opinionLeaderView/opinionleaderTreemap';
import { loading } from './loading';
// import request from 'request';

class Graph extends Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.state = {
      ...props,
    };
  }

  componentDidMount() {
    // console.log(this.props.name);
    // console.log('vis_DidMount');
  }

  // componentWillReceiveProps(nextProps) {
  //   const { word } = this.props;
  //   // console.log(nextProps.word, word);
  //   if (JSON.stringify(nextProps.word) !== JSON.stringify(word)) {
  //     console.log('componentWillReceiveProps');
  //     this.setState({ word: nextProps.word });
  //   }
  // }

  shouldComponentUpdate(nextProps, nextState) {
    const { set: thisSet } = this.props;
    const { set: nextSet } = nextProps;
    const { userData: thisUserData } = this.state;
    const { userData: nextUserData } = nextState;

    if (!thisSet && !nextSet) {
      console.log('No Update!');
      return false;
    }

    if (!thisSet && nextSet) {
      this.props = nextProps;
      console.log('update');
      this.drawwithlabels();
      return true;
    }

    if (thisSet.length !== nextSet.length || !thisSet.every((e, index) => e.id === nextSet[index].id)) {
      this.props = nextProps;
      console.log('Update');
      this.drawwithlabels();
      return true;
    }

    if (!thisUserData && nextUserData) {
      console.log('Update');
      return true;
    }
    if (thisUserData && nextUserData) {
      const thisBeginDate = JSON.stringify(thisUserData.beginDate);
      const nextBeginDate = JSON.stringify(nextUserData.beginDate);
      if (thisBeginDate !== nextBeginDate) {
        console.log('Update');
        return true;
      }

      const thisEndDate = JSON.stringify(thisUserData.endDate);
      const nextEndDate = JSON.stringify(nextUserData.endDate);
      if (thisEndDate !== nextEndDate) {
        console.log('Update');
        return true;
      }

      if (JSON.stringify(thisUserData.fixedUserArr) !== JSON.stringify(nextUserData.fixedUserArr)) {
        console.log('Update');
        return true;
      }
    }

    console.log('No Update!');
    return false;
  }

  drawwithlabels() {
    const refData = this.props;
    function handleSubmit(e, type = 1) {
      function getReqstr(id, begin, end) {
        const boardname = d3.select('#pagename1').attr('value');
        const beginDate = d3.select('#date1').attr('value');
        const endDate = d3.select('#date2').attr('value');
        const searchBegin = begin || beginDate;
        const searchEnd = end || endDate;
        const {
          menuprops: {
            initParameter: {
              var1: varname1, min1: minvar1, max1: maxvar1, posttype,
            },
            initPage1: {
              pagename: pagename1,
              contentfilter: keyword3,
            },
          },
        } = refData.opState;

        // make url string for request data
        const strminvar1 = `min${varname1}=${minvar1}` || '';
        const strmaxvar1 = `max${varname1}=${maxvar1}` || '';
        const strposttype = `posttype=${posttype}` || '';
        const strpage1 = `page1=${boardname}` || '';
        const strtime1 = `time1=${searchBegin}` || '';
        const strtime2 = `time2=${searchEnd}` || '';
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
      // e.preventDefault();
      const beginDate = type === 1 ? d3.select('#date1').attr('value') : d3.select('#userDate1').property('value');
      const endDate = type === 1 ? d3.select('#date2').attr('value') : d3.select('#userDate2').property('value');
      console.log(`beginDate: ${beginDate}, endDate: ${endDate}`);
      const myRequest = [];
      // split date into many pieces by one day
      const fixedUserArr = e.map(usr => usr.id || usr);
      const url = [];
      const betweenDate = (new Date(endDate) - new Date(beginDate)) / (1000 * 3600 * 24);
      for (let i = 0; i < betweenDate; i += 5) {
        const newBeginDate = new Date(beginDate);
        const newEndDate = new Date(beginDate);
        newBeginDate.setDate(newBeginDate.getDate() + i);
        newBeginDate.setHours(0, 0, 0);
        newEndDate.setDate(newEndDate.getDate() + (i + 5));
        newEndDate.setHours(23, 59, 59);
        if (new Date(newEndDate) > new Date(endDate)) url.push(encodeURI(getReqstr(fixedUserArr, newBeginDate, new Date(endDate))));
        else url.push(encodeURI(getReqstr(fixedUserArr, newBeginDate, newEndDate)));
      }
      url.forEach((u) => {
        myRequest.push(new Request(u, {
          method: 'get',
        }));
      });
      const userSimilaritySvg = d3.select('#timeLine');
      loading(0, myRequest.length, userSimilaritySvg);
      const resArr = { articles: [], userListArray: [] };

      function recursiveFetch(req, index) {
        fetch(req[index])
          .then(response => response.json())
          .then((response) => {
            // concat userlist because spliting user
            // resArr.userListArray = resArr.userListArray.concat(response.userListArray);

            // concat user repliedArticle because spliting date
            for (let i = 0; i < resArr.userListArray.length; i += 1) {
              const existedUser = resArr.userListArray[i];
              const responseUser = response.userListArray[i];
              existedUser.totalReplyCount += responseUser.totalReplyCount;
              existedUser.repliedArticle = existedUser.repliedArticle.concat(responseUser.repliedArticle);
              responseUser.titleWordScore.forEach((wordList) => {
                const wordScore = existedUser.titleWordScore.find(wl => wl.word === wordList.word);
                if (wordScore) {
                  wordScore.score += wordList.score;
                } else {
                  existedUser.titleWordScore.push(wordList);
                }
              });
            }
            // remove duplicated articles
            response.articles.forEach((a) => {
              if (!resArr.articles.some(_a => _a.article_id === a.article_id)) {
                resArr.articles.push(a);
              }
            });
            // remove messages which pushUserid is not included in request users
            resArr.articles.forEach((a) => {
              a.messages = a.messages.filter(mes => e.some(usr => usr.id === mes.push_userid));
            });
            loading((index + 1), myRequest.length, userSimilaritySvg);
            if (myRequest.length === index + 1) {
              resArr.userListArray.forEach((usr) => {
                usr.orig_group = e.find(u => u.id === usr.id).group;
              });
              const userIdArr = e.map(usr => usr.id);
              $this.setState({
                userData: {
                  beginDate,
                  endDate,
                  userListArray: resArr.userListArray,
                  fixedUserArr: userIdArr,
                  articles: resArr.articles,
                  submit: handleSubmit,
                },
              });
            }
            return response;
          })
          .then(() => {
            if (req.length > index + 1) recursiveFetch(req, index + 1);
          })
          .catch((err) => {
            console.log(err);
          });
      }
      const i = 0;
      fetch(myRequest[0])
        .then(response => response.json())
        .then((response) => {
          resArr.articles = response.articles;
          resArr.userListArray = response.userListArray;
          resArr.articles.forEach((a) => {
            a.messages = a.messages.filter(mes => e.some(usr => usr.id === mes.push_userid));
          });
          loading((i + 1), myRequest.length, userSimilaritySvg);
          if (myRequest.length === i + 1) {
            response.userListArray.forEach((usr) => {
              usr.orig_group = e.find(u => u.id === usr.id).group;
            });
            $this.setState({
              userData: {
                beginDate,
                endDate,
                userListArray: response.userListArray,
                fixedUserArr,
                articles: response.articles,
                submit: handleSubmit,
              },
            });
          }
          return response;
        })
        .then(() => {
          if (myRequest.length > i + 1) recursiveFetch(myRequest, i + 1);
        })
        .catch((err) => {
          userSimilaritySvg.append('text')
            .text(`${err}. Reduce the amount of users being queried`)
            .attr('x', 100)
            .attr('y', 200)
            .attr('font-size', 20)
            .attr('fill', 'red');
        });
    }
    console.log('draw');
    console.log('this.props', this.props);
    const $this = this;
    const { set: propsSet } = this.props;
    const set = JSON.parse(JSON.stringify(propsSet));
    const authorSet = set;
    const authorTable = d3.select('#authorList');
    AuthorTable(authorSet, authorTable, this, (n, index) => {
      const articleCellSvg = d3.select('#graph');
      treemap(n, articleCellSvg, handleSubmit);
    });
  }

  render() {
    console.log('render: ', this.state);
    const { userData } = this.state;
    const $this = this;
    return (
      <div className="graph" ref={this.myRef}>
        <div className="network">
          <div className="termMap">
            <div className="termMapFilter">
              <div style={{ marginLeft: '10px', alignSelf: 'center', fontSize: 'x-small' }}>
                <div style={{ display: 'flex' }}>
                  <fieldset style={{ display: 'flex' }}>
                    <label htmlFor="union">
                      union:
                      <input
                        checked
                        type="radio"
                        id="union"
                        name="set"
                        value="union"
                      />
                    </label>
                    <label htmlFor="intersection">
                      intersection:
                      <input
                        type="radio"
                        id="intersection"
                        name="set"
                        value="intersection"
                      />
                    </label>
                  </fieldset>
                  <fieldset>
                    <label htmlFor="intersection">
                        full cal:
                      <input
                        chekced
                        type="checkbox"
                        id="quickTest"
                        name="pageRank"
                        value="quickTest"
                      />
                    </label>
                  </fieldset>
                </div>
              </div>
            </div>
            <div className="treemap" style={{ position: 'relative' }}>
              <svg id="graph" width="100%" height="100%" style={{}} />
            </div>
          </div>
          <div className="selectedUserTable d-flex flex-column" />
          <div className="authorList" id="authorList" style={{ overflowY: 'scroll' }} />
          <div className="articleStatus">
            <svg id="articleStatus" viewBox="0 0 468 275" />
          </div>
        </div>
        <UserBehavior data={userData} />
      </div>
    );
  }
}

export default Graph;
