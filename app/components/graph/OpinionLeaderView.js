/* eslint-disable no-console */
/* eslint-disable prefer-const */
/* eslint-disable react/prop-types */
import React from 'react';
import * as d3 from 'd3';
// import { OpinionLeader } from './OpinionLeader';
import { treemap } from './opinionleaderTreemap';
// import { commentTimeline } from './commentTimeline';
// import { userActivityTimeline } from './userActivityTimeline';
import { userSimilarityGraph } from './userSimilarityGraph';
// import { userDailyActivity } from './userDailyActivity';
import { loading } from './loading';
// import WordTree from './wordTree';

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
    // console.log(data);
    let articleCellSvg = d3.select('#graph');
    let commentTimelineSvg = d3.select('#commentTimeline');
    let userSimilaritySvg = d3.select('#timeLine');
    // let userDailyActivitySvg = d3.select('#userDailyActivity');
    const boardname = d3.select('#pagename1').attr('value');
    const beginDate = d3.select('#date1').attr('value');
    const endDate = d3.select('#date2').attr('value');
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

      // const beginDate = d3.select('#date1').attr('value');
      // const endDate = d3.select('#date2').attr('value');
      // make url string for request data
      const strminvar1 = `min${varname1}=${minvar1}` || '';
      const strmaxvar1 = `max${varname1}=${maxvar1}` || '';
      const strposttype = `posttype=${posttype}` || '';
      const strpage1 = `page1=${boardname}` || '';
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
      console.log(articles, userId);
      const authorList = [];
      const articleList = [];
      let totalReplyCount = 0;
      articles.forEach((article) => {
        if (article.messages.some(e => e.push_userid === userId)) {
          const existedAuthor = authorList.find(e => e.author === article.author);
          const existedArticle = articleList.find(e => e.article_id === article.article_id);
          totalReplyCount += 1;
          const pushContent = article.messages.filter(e => e.push_userid === userId);
          if (existedAuthor) {
            existedAuthor.count += 1;
            existedAuthor.articles.push({
              article_title: article.article_title,
              push_content: pushContent,
            });
          } else {
            authorList.push({
              author: article.author,
              count: 1,
              articles: [{
                article_title: article.article_title,
                push_content: pushContent,
              }],
            });
          }
          if (!existedArticle) {
            articleList.push(article);
          }
        }
      });
      userLists.push({
        id: userId,
        reply: authorList,
        totalReplyCount,
        repliedArticle: articleList,
      });
    }

    function handleSubmit(e) {
      // e.preventDefault();
      console.log(e);
      const userNumsPerRequest = 200;
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
      loading(0, myRequest.length, userSimilaritySvg);
      const resArr = [];
      fetch(myRequest[0])
        .then(response => response.json())
        .then((response) => {
          console.log(response);
          resArr.push(response);
          loading(resArr.length, myRequest.length, userSimilaritySvg);
          // for (let j = 0; j < fixedUserArr[0].length; j += 1) {
          //   buildUserList(userListArray, response, fixedUserArr[0][j]);
          // }
          if (myRequest.length === 1) {
            // userActivityTimeline(response[0][0], commentTimelineSvg, fixedUserArr[0]);
            // userDailyActivity(response[0][0], fixedUserArr[0], commentTimelineSvg, beginDate, endDate);
            userSimilarityGraph(
              response.userListArray,
              userSimilaritySvg,
              fixedUserArr[0],
              response.articles,
              // response.similarity,
            );
          }
          for (let i = 1; i < myRequest.length; i += 1) {
            fetch(myRequest[i])
              .then(res => res.json())
              .then((res) => {
                resArr.push(res);
                loading(resArr.length, myRequest.length, userSimilaritySvg);
                // console.log(res[0][0]);
                console.log('build');
                for (let j = 0; j < fixedUserArr[i].length; j += 1) {
                  buildUserList(userListArray, res, fixedUserArr[i][j]);
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
                  // userActivityTimeline(articlesArr, commentTimelineSvg, usrArr);
                  // userDailyActivity(articlesArr, usrArr, commentTimelineSvg, beginDate, endDate);
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

    if (cellData.children) {
      // console.log(cellData);
      // if (data.$this.state.hover !== 1) {
      console.log('do OPView rendering');
      treemap(cellData.children,
        beforeThisDate, articleCellSvg, cellForceSimulation,
        totalAuthorInfluence, data.$this, optionsWord, handleSubmit);
      // OpinionLeader(cellData.nodes, cellData.links,
      //   beforeThisDate, articleCellSvg, cellForceSimulation,
      //   totalAuthorInfluence, data.$this, optionsWord, handleSubmit);
      // }
      // commentTimeline(cellData.nodes, commentTimelineSvg, data.$this);
    }

    const testUser = ['sasintw'];
    const testData = [
      {
        "_id": "5ce0cfe2d8cfd19b0acb337c",
        "article_id": "M.1555395713.A.27A",
        "article_title": "[新聞] 韓國瑜霸氣槓NCC：全國都該做中天電視台",
        "author": "avis9 (笑)",
        "board": "Gossiping",
        "content": " ",
        "date": "2019-04-16T06:21:51.000Z",
        "ip": "94.98.198.127",
        "message_count": {
          "_id": "5ce0cfe26e8ee31ef2327f64",
          "all": 724,
          "boo": 577,
          "count": -524,
          "neutral": 94,
          "push": 53
        },
        "messages": [
          {
            "_id": "5ce0cfe26e8ee31ef2328238",
            "push_content": "ㄏ",
            "push_ipdatetime": "04/16 14:22",
            "push_tag": "→",
            "push_userid": "rrr518"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328237",
            "push_content": "",
            "push_ipdatetime": "04/16 14:22",
            "push_tag": "噓",
            "push_userid": "XDDDD5566"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328236",
            "push_content": "垃圾",
            "push_ipdatetime": "04/16 14:22",
            "push_tag": "噓",
            "push_userid": "qhapaq"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328235",
            "push_content": "中夭灶神  不意外",
            "push_ipdatetime": "04/16 14:22",
            "push_tag": "噓",
            "push_userid": "highyes"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328234",
            "push_content": "這樣獨派就看不到自油三立",
            "push_ipdatetime": "04/16 14:22",
            "push_tag": "推",
            "push_userid": "jma306"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328233",
            "push_content": "鳳凰展翅",
            "push_ipdatetime": "04/16 14:22",
            "push_tag": "噓",
            "push_userid": "nawabonga"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328232",
            "push_content": "造神造起來",
            "push_ipdatetime": "04/16 14:22",
            "push_tag": "→",
            "push_userid": "zxc7895111"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328231",
            "push_content": "ZZZ",
            "push_ipdatetime": "04/16 14:22",
            "push_tag": "噓",
            "push_userid": "kyowinner"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328230",
            "push_content": "zzz",
            "push_ipdatetime": "04/16 14:22",
            "push_tag": "噓",
            "push_userid": "sassuck"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232822f",
            "push_content": "下賤政客 下賤媒體 ：）",
            "push_ipdatetime": "04/16 14:22",
            "push_tag": "噓",
            "push_userid": "rushingguy"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232822e",
            "push_content": "笑死XDDDD",
            "push_ipdatetime": "04/16 14:22",
            "push_tag": "推",
            "push_userid": "polanco"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232822d",
            "push_content": "呷賽",
            "push_ipdatetime": "04/16 14:22",
            "push_tag": "噓",
            "push_userid": "uelx"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232822c",
            "push_content": "人渣這種話你講的出來 去被車撞死吧",
            "push_ipdatetime": "04/16 14:22",
            "push_tag": "→",
            "push_userid": "qhapaq"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232822b",
            "push_content": "200萬噸文旦丟水庫",
            "push_ipdatetime": "04/16 14:22",
            "push_tag": "→",
            "push_userid": "nawabonga"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232822a",
            "push_content": "韓總去跟ATI說",
            "push_ipdatetime": "04/16 14:23",
            "push_tag": "推",
            "push_userid": "frankie30432"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328229",
            "push_content": "光頭要舔維尼老二自己去舔就好",
            "push_ipdatetime": "04/16 14:23",
            "push_tag": "噓",
            "push_userid": "orze04"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328228",
            "push_content": "這是利害關係人出來護航? 不能阻止別人把我捧上天",
            "push_ipdatetime": "04/16 14:23",
            "push_tag": "噓",
            "push_userid": "ColiColi"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328227",
            "push_content": "智障電視台",
            "push_ipdatetime": "04/16 14:23",
            "push_tag": "噓",
            "push_userid": "gx9900824"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328226",
            "push_content": "內文是“全國媒體” 標題很故意",
            "push_ipdatetime": "04/16 14:23",
            "push_tag": "噓",
            "push_userid": "darkholy"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328225",
            "push_content": "......",
            "push_ipdatetime": "04/16 14:23",
            "push_tag": "噓",
            "push_userid": "thenorth"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328224",
            "push_content": "高雄人去做就好",
            "push_ipdatetime": "04/16 14:23",
            "push_tag": "噓",
            "push_userid": "soarling"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328223",
            "push_content": "廢話，你團隊就中天出來的，又幫你造神一條龍，當然要好",
            "push_ipdatetime": "04/16 14:23",
            "push_tag": "推",
            "push_userid": "nildog"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328222",
            "push_content": "不忍噓智能障礙 給箭頭",
            "push_ipdatetime": "04/16 14:23",
            "push_tag": "→",
            "push_userid": "aclahm"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328221",
            "push_content": "弓三小................",
            "push_ipdatetime": "04/16 14:23",
            "push_tag": "噓",
            "push_userid": "Arad"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328220",
            "push_content": "好照顧一下...",
            "push_ipdatetime": "04/16 14:23",
            "push_tag": "→",
            "push_userid": "nildog"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232821f",
            "push_content": "貼圖的快來",
            "push_ipdatetime": "04/16 14:23",
            "push_tag": "→",
            "push_userid": "dai26"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232821e",
            "push_content": "這垃圾廢話真他媽多",
            "push_ipdatetime": "04/16 14:23",
            "push_tag": "噓",
            "push_userid": "JHGF2468A"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232821d",
            "push_content": "怎樣的人說怎樣的垃圾話",
            "push_ipdatetime": "04/16 14:23",
            "push_tag": "噓",
            "push_userid": "iamfake"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232821c",
            "push_content": "霸氣跟AIT說啊，嫩",
            "push_ipdatetime": "04/16 14:24",
            "push_tag": "噓",
            "push_userid": "pfw"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232821b",
            "push_content": "幹你娘勒",
            "push_ipdatetime": "04/16 14:24",
            "push_tag": "噓",
            "push_userid": "luckymore"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232821a",
            "push_content": "......",
            "push_ipdatetime": "04/16 14:24",
            "push_tag": "噓",
            "push_userid": "fakeshadow9"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328219",
            "push_content": "嘔嘔嘔",
            "push_ipdatetime": "04/16 14:24",
            "push_tag": "噓",
            "push_userid": "s155260"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328218",
            "push_content": "垃圾台還不趕快倒閉",
            "push_ipdatetime": "04/16 14:24",
            "push_tag": "噓",
            "push_userid": "bigsun0709"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328217",
            "push_content": "向邪門歪道說不",
            "push_ipdatetime": "04/16 14:24",
            "push_tag": "噓",
            "push_userid": "jj1313"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328216",
            "push_content": "工三小，幹",
            "push_ipdatetime": "04/16 14:24",
            "push_tag": "噓",
            "push_userid": "iversonpop"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328215",
            "push_content": "不演了 不演了 眾心歸位",
            "push_ipdatetime": "04/16 14:24",
            "push_tag": "推",
            "push_userid": "faker007"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328214",
            "push_content": "誰要做你專屬廣告台後盾 操",
            "push_ipdatetime": "04/16 14:24",
            "push_tag": "噓",
            "push_userid": "uf1276"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328213",
            "push_content": "...後盾？！ 假新聞要護啥啊",
            "push_ipdatetime": "04/16 14:24",
            "push_tag": "→",
            "push_userid": "father3409"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328212",
            "push_content": "Ait認證假新聞中心啊",
            "push_ipdatetime": "04/16 14:24",
            "push_tag": "噓",
            "push_userid": "gogoto990"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328211",
            "push_content": "https://i.imgur.com/tFCHG7p.jpg",
            "push_ipdatetime": "04/16 14:24",
            "push_tag": "推",
            "push_userid": "nathan2000"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328210",
            "push_content": "幹 我怎麼笑不出來",
            "push_ipdatetime": "04/16 14:24",
            "push_tag": "推",
            "push_userid": "wang1b"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232820f",
            "push_content": "狗報日常",
            "push_ipdatetime": "04/16 14:24",
            "push_tag": "噓",
            "push_userid": "einard666"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232820e",
            "push_content": "真他媽的無恥了",
            "push_ipdatetime": "04/16 14:24",
            "push_tag": "噓",
            "push_userid": "alpha008"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232820d",
            "push_content": "幹嘛做垃圾電視台後盾？",
            "push_ipdatetime": "04/16 14:24",
            "push_tag": "噓",
            "push_userid": "jab"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232820c",
            "push_content": "全國媒體一起播禿頭我直接砸電視",
            "push_ipdatetime": "04/16 14:25",
            "push_tag": "噓",
            "push_userid": "dlam002"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232820b",
            "push_content": "嘔嘔嘔嘔嘔嘔嘔嘔嘔",
            "push_ipdatetime": "04/16 14:25",
            "push_tag": "噓",
            "push_userid": "terry955048"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232820a",
            "push_content": "我才不要",
            "push_ipdatetime": "04/16 14:25",
            "push_tag": "→",
            "push_userid": "beyoursky"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328209",
            "push_content": "無恥到極點",
            "push_ipdatetime": "04/16 14:25",
            "push_tag": "噓",
            "push_userid": "Spinner3"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328208",
            "push_content": "經濟零分，政治也零分",
            "push_ipdatetime": "04/16 14:25",
            "push_tag": "噓",
            "push_userid": "Beccaria"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328207",
            "push_content": "低能兒一個",
            "push_ipdatetime": "04/16 14:25",
            "push_tag": "噓",
            "push_userid": "askaleroux"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328206",
            "push_content": "不當支那賤畜",
            "push_ipdatetime": "04/16 14:25",
            "push_tag": "噓",
            "push_userid": "linceass"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328205",
            "push_content": "ait認証的狗報                   不好意思 我比較信ait",
            "push_ipdatetime": "04/16 14:25",
            "push_tag": "→",
            "push_userid": "andytaso"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328204",
            "push_content": "水喔  韓總又秀一波下限  趕快垮臺吧",
            "push_ipdatetime": "04/16 14:25",
            "push_tag": "噓",
            "push_userid": "MASAGA"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328203",
            "push_content": "當政治人物還不懂得利益迴避我也是醉了XDD",
            "push_ipdatetime": "04/16 14:25",
            "push_tag": "→",
            "push_userid": "fujioqq"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328202",
            "push_content": "韓天新聞台 噁心",
            "push_ipdatetime": "04/16 14:25",
            "push_tag": "→",
            "push_userid": "linceass"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328201",
            "push_content": "低能韓 腦子空洞程度跟他頭一樣禿",
            "push_ipdatetime": "04/16 14:25",
            "push_tag": "噓",
            "push_userid": "cpaszx09"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328200",
            "push_content": "0老ㄙ勒",
            "push_ipdatetime": "04/16 14:25",
            "push_tag": "噓",
            "push_userid": "qooprincess"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281ff",
            "push_content": "垃圾黑道挺爛台 物以類聚",
            "push_ipdatetime": "04/16 14:26",
            "push_tag": "噓",
            "push_userid": "magecanby"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281fe",
            "push_content": "？？？",
            "push_ipdatetime": "04/16 14:26",
            "push_tag": "噓",
            "push_userid": "vios"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281fd",
            "push_content": "政治-100分",
            "push_ipdatetime": "04/16 14:26",
            "push_tag": "噓",
            "push_userid": "Sinkage"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281fc",
            "push_content": "中夭他媽的快倒一倒....",
            "push_ipdatetime": "04/16 14:26",
            "push_tag": "→",
            "push_userid": "jose777"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281fb",
            "push_content": "幹你娘",
            "push_ipdatetime": "04/16 14:26",
            "push_tag": "噓",
            "push_userid": "ilovelol"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281fa",
            "push_content": "拒絕韓國瑜台 一堆噁心垃圾新聞",
            "push_ipdatetime": "04/16 14:26",
            "push_tag": "推",
            "push_userid": "ronnyvvang"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281f9",
            "push_content": "魚幫水水幫魚，果然。",
            "push_ipdatetime": "04/16 14:26",
            "push_tag": "噓",
            "push_userid": "NohohonZoku"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281f8",
            "push_content": "供殺小",
            "push_ipdatetime": "04/16 14:26",
            "push_tag": "噓",
            "push_userid": "jonathan8032"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281f7",
            "push_content": "一丘之貉 自慰取暖 會幫中天講話的政客就是無恥",
            "push_ipdatetime": "04/16 14:26",
            "push_tag": "噓",
            "push_userid": "OnoderaHaru"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281f6",
            "push_content": "https://i.imgur.com/73MJ9qc.jpg",
            "push_ipdatetime": "04/16 14:26",
            "push_tag": "→",
            "push_userid": "Arad"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281f5",
            "push_content": "可以罷免了 自以為是韓天電視台市長？",
            "push_ipdatetime": "04/16 14:26",
            "push_tag": "噓",
            "push_userid": "a4302f"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281f4",
            "push_content": "全中華人民共和國嗎？",
            "push_ipdatetime": "04/16 14:26",
            "push_tag": "推",
            "push_userid": "yudofu"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281f3",
            "push_content": "韓國瑜罕見動怒???",
            "push_ipdatetime": "04/16 14:26",
            "push_tag": "噓",
            "push_userid": "darkkairi"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281f2",
            "push_content": "吃屎",
            "push_ipdatetime": "04/16 14:26",
            "push_tag": "噓",
            "push_userid": "henrysu1625"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281f1",
            "push_content": "顛倒是非？",
            "push_ipdatetime": "04/16 14:26",
            "push_tag": "噓",
            "push_userid": "jasonp92"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281f0",
            "push_content": "笑死，不愧是政黑的最愛",
            "push_ipdatetime": "04/16 14:26",
            "push_tag": "推",
            "push_userid": "Sougetu"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281ef",
            "push_content": "韓粉全是敗類",
            "push_ipdatetime": "04/16 14:26",
            "push_tag": "噓",
            "push_userid": "cheetahspeed"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281ee",
            "push_content": "沒人願意和無知電視台一起",
            "push_ipdatetime": "04/16 14:26",
            "push_tag": "噓",
            "push_userid": "tonyko13"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281ed",
            "push_content": "韓粉最愛電視台",
            "push_ipdatetime": "04/16 14:26",
            "push_tag": "→",
            "push_userid": "sinon0123"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281ec",
            "push_content": "太誇張了吧",
            "push_ipdatetime": "04/16 14:26",
            "push_tag": "噓",
            "push_userid": "pencil"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281eb",
            "push_content": "做你媽 幹 身為高雄人感到丟臉",
            "push_ipdatetime": "04/16 14:27",
            "push_tag": "噓",
            "push_userid": "idevil666"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281ea",
            "push_content": "超賭爛這廢咖 花三百萬公帑去國外秀下限",
            "push_ipdatetime": "04/16 14:27",
            "push_tag": "→",
            "push_userid": "magecanby"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281e9",
            "push_content": "噁心",
            "push_ipdatetime": "04/16 14:27",
            "push_tag": "噓",
            "push_userid": "chelseaty"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281e8",
            "push_content": "改 宗教賣藥醉酒唱歌台",
            "push_ipdatetime": "04/16 14:27",
            "push_tag": "噓",
            "push_userid": "agong"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281e7",
            "push_content": "不愧是政黑的最愛",
            "push_ipdatetime": "04/16 14:27",
            "push_tag": "→",
            "push_userid": "sinon0123"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281e6",
            "push_content": "滾",
            "push_ipdatetime": "04/16 14:27",
            "push_tag": "噓",
            "push_userid": "TDKnight"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281e5",
            "push_content": "郭台銘橋都快搭好了，草包就繼續胡言亂語吧",
            "push_ipdatetime": "04/16 14:27",
            "push_tag": "噓",
            "push_userid": "wjuiahb"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281e4",
            "push_content": "統媒 造神 專做假新聞的新聞台",
            "push_ipdatetime": "04/16 14:27",
            "push_tag": "噓",
            "push_userid": "sh780327"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281e3",
            "push_content": "不講這個我還沒這麼氣，幹",
            "push_ipdatetime": "04/16 14:28",
            "push_tag": "噓",
            "push_userid": "gerychen"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281e2",
            "push_content": "噁心至極!!!",
            "push_ipdatetime": "04/16 14:28",
            "push_tag": "噓",
            "push_userid": "beach73112"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281e1",
            "push_content": "腦殘沒藥醫",
            "push_ipdatetime": "04/16 14:28",
            "push_tag": "噓",
            "push_userid": "jezz9740"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281e0",
            "push_content": "今天中夭播出李扣分找大衣 優雅逛街 早餐吃草莓",
            "push_ipdatetime": "04/16 14:28",
            "push_tag": "→",
            "push_userid": "magecanby"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281df",
            "push_content": "嘔嘔嘔嘔嘔嘔",
            "push_ipdatetime": "04/16 14:28",
            "push_tag": "→",
            "push_userid": "magecanby"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281de",
            "push_content": "他到底還記得自己是高雄市長嗎??還是現在已經又再競選?",
            "push_ipdatetime": "04/16 14:29",
            "push_tag": "→",
            "push_userid": "lovejamwu"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281dd",
            "push_content": "幹，越來越好笑。高雄人請出來面對！！",
            "push_ipdatetime": "04/16 14:29",
            "push_tag": "→",
            "push_userid": "Alienpapa"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281dc",
            "push_content": "殺洨 當全台灣都白癡！",
            "push_ipdatetime": "04/16 14:29",
            "push_tag": "噓",
            "push_userid": "hogu134"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281db",
            "push_content": "國之將亡",
            "push_ipdatetime": "04/16 14:29",
            "push_tag": "推",
            "push_userid": "adamcha"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281da",
            "push_content": "草包電視台挺個屁",
            "push_ipdatetime": "04/16 14:29",
            "push_tag": "噓",
            "push_userid": "sinchung"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281d9",
            "push_content": "中國全國？",
            "push_ipdatetime": "04/16 14:29",
            "push_tag": "噓",
            "push_userid": "ekoj"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281d8",
            "push_content": "KKC最愛的中國國民黨韓國瑜",
            "push_ipdatetime": "04/16 14:29",
            "push_tag": "噓",
            "push_userid": "gh34163"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281d7",
            "push_content": "讓這下三濫囂張的智障韓粉們麻煩去自殺謝罪好嗎",
            "push_ipdatetime": "04/16 14:29",
            "push_tag": "噓",
            "push_userid": "sepzako"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281d6",
            "push_content": "ㄍㄋㄋ",
            "push_ipdatetime": "04/16 14:30",
            "push_tag": "噓",
            "push_userid": "dddc"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281d5",
            "push_content": "中夭",
            "push_ipdatetime": "04/16 14:30",
            "push_tag": "噓",
            "push_userid": "aqsss"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281d4",
            "push_content": "XD",
            "push_ipdatetime": "04/16 14:30",
            "push_tag": "噓",
            "push_userid": "HYUNGJIN"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281d3",
            "push_content": "這樣就對了，討厭韓的勢力即將被激起",
            "push_ipdatetime": "04/16 14:30",
            "push_tag": "噓",
            "push_userid": "burglur"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281d2",
            "push_content": "甲賽咖緊",
            "push_ipdatetime": "04/16 14:30",
            "push_tag": "噓",
            "push_userid": "jack21023"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281d1",
            "push_content": "翻譯：全部電視台都應該幫我造神",
            "push_ipdatetime": "04/16 14:30",
            "push_tag": "推",
            "push_userid": "etiennechiu"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281d0",
            "push_content": "令人作嘔",
            "push_ipdatetime": "04/16 14:30",
            "push_tag": "噓",
            "push_userid": "siza"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281cf",
            "push_content": "ㄊ",
            "push_ipdatetime": "04/16 14:30",
            "push_tag": "噓",
            "push_userid": "maxgackt"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281ce",
            "push_content": "禿驢再說啥呢",
            "push_ipdatetime": "04/16 14:30",
            "push_tag": "→",
            "push_userid": "maxgackt"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281cd",
            "push_content": "高雄人最愛",
            "push_ipdatetime": "04/16 14:31",
            "push_tag": "噓",
            "push_userid": "fabledqqman"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281cc",
            "push_content": "就算減國也要悍衛 才是真正自由民主",
            "push_ipdatetime": "04/16 14:31",
            "push_tag": "推",
            "push_userid": "skullno2"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281cb",
            "push_content": "9.2同溫層沒有了很不方便",
            "push_ipdatetime": "04/16 14:31",
            "push_tag": "噓",
            "push_userid": "keyman2"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281ca",
            "push_content": "^^",
            "push_ipdatetime": "04/16 14:31",
            "push_tag": "噓",
            "push_userid": "threebig"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281c9",
            "push_content": "很棒",
            "push_ipdatetime": "04/16 14:31",
            "push_tag": "噓",
            "push_userid": "chiao"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281c8",
            "push_content": "垃圾台報成這樣你好意思挺?忘了你們物以類聚",
            "push_ipdatetime": "04/16 14:31",
            "push_tag": "噓",
            "push_userid": "skiro"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281c7",
            "push_content": "垃圾",
            "push_ipdatetime": "04/16 14:32",
            "push_tag": "噓",
            "push_userid": "chu122408"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281c6",
            "push_content": "噁爆",
            "push_ipdatetime": "04/16 14:32",
            "push_tag": "噓",
            "push_userid": "bident"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281c5",
            "push_content": "無恥",
            "push_ipdatetime": "04/16 14:32",
            "push_tag": "噓",
            "push_userid": "akway"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281c4",
            "push_content": "幹你娘",
            "push_ipdatetime": "04/16 14:32",
            "push_tag": "噓",
            "push_userid": "sasori1027"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281c3",
            "push_content": "笑惹",
            "push_ipdatetime": "04/16 14:32",
            "push_tag": "→",
            "push_userid": "nextpage"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281c2",
            "push_content": "狗性顯露無遺",
            "push_ipdatetime": "04/16 14:32",
            "push_tag": "噓",
            "push_userid": "lenzi0"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281c1",
            "push_content": "https://youtu.be/z-vj2flsKmM",
            "push_ipdatetime": "04/16 14:32",
            "push_tag": "推",
            "push_userid": "DDRMIX"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281c0",
            "push_content": "https://youtu.be/3OvjGJEZKWo",
            "push_ipdatetime": "04/16 14:32",
            "push_tag": "→",
            "push_userid": "DDRMIX"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281bf",
            "push_content": "下流無恥",
            "push_ipdatetime": "04/16 14:33",
            "push_tag": "噓",
            "push_userid": "fenrisfang"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281be",
            "push_content": "中天之前每天都在播你 誰受得了",
            "push_ipdatetime": "04/16 14:33",
            "push_tag": "推",
            "push_userid": "obovqq"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281bd",
            "push_content": "幹 臉皮真的很厚內  還是怕妖中不能灶神後自己會掉下神壇",
            "push_ipdatetime": "04/16 14:33",
            "push_tag": "噓",
            "push_userid": "kamayer"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281bc",
            "push_content": "我覺得他從去美國這段開始說的話都是自爆耶,KMT不擔心嗎",
            "push_ipdatetime": "04/16 14:33",
            "push_tag": "→",
            "push_userid": "nextpage"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281bb",
            "push_content": "你他媽智障才做中天後盾",
            "push_ipdatetime": "04/16 14:33",
            "push_tag": "→",
            "push_userid": "lin821"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281ba",
            "push_content": "一堆假新聞跟造神新聞 噁心",
            "push_ipdatetime": "04/16 14:33",
            "push_tag": "噓",
            "push_userid": "czm0411"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281b9",
            "push_content": "幹",
            "push_ipdatetime": "04/16 14:33",
            "push_tag": "噓",
            "push_userid": "sunnybody907"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281b8",
            "push_content": "誰跟你全國 媽的只會民粹",
            "push_ipdatetime": "04/16 14:33",
            "push_tag": "推",
            "push_userid": "sunner717"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281b7",
            "push_content": "超噁想吐",
            "push_ipdatetime": "04/16 14:33",
            "push_tag": "噓",
            "push_userid": "magecanby"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281b6",
            "push_content": "不演了",
            "push_ipdatetime": "04/16 14:34",
            "push_tag": "噓",
            "push_userid": "fcuhua"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281b5",
            "push_content": "不要勒",
            "push_ipdatetime": "04/16 14:34",
            "push_tag": "噓",
            "push_userid": "jacky40383"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281b4",
            "push_content": "噁心嘔嘔嘔嘔",
            "push_ipdatetime": "04/16 14:34",
            "push_tag": "噓",
            "push_userid": "lurker777"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281b3",
            "push_content": "笑死XDD",
            "push_ipdatetime": "04/16 14:34",
            "push_tag": "噓",
            "push_userid": "rexagi1988"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281b2",
            "push_content": "唬爛市長+造謠電視台，上可捉太陽，下可穿地心了啦~",
            "push_ipdatetime": "04/16 14:34",
            "push_tag": "噓",
            "push_userid": "nildog"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281b1",
            "push_content": "......",
            "push_ipdatetime": "04/16 14:34",
            "push_tag": "→",
            "push_userid": "gohow"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281b0",
            "push_content": "智能障礙",
            "push_ipdatetime": "04/16 14:35",
            "push_tag": "噓",
            "push_userid": "karmakarma"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281af",
            "push_content": "AIT認證的假新聞來源！不過9.2水準就是這樣",
            "push_ipdatetime": "04/16 14:35",
            "push_tag": "→",
            "push_userid": "enigmabp"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281ae",
            "push_content": "這禿頭到底在供三小",
            "push_ipdatetime": "04/16 14:35",
            "push_tag": "噓",
            "push_userid": "senkawa"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281ad",
            "push_content": "笑下限還沒到",
            "push_ipdatetime": "04/16 14:36",
            "push_tag": "→",
            "push_userid": "agong"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281ac",
            "push_content": "禿頭龜",
            "push_ipdatetime": "04/16 14:36",
            "push_tag": "→",
            "push_userid": "bicedb"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281ab",
            "push_content": "垃圾",
            "push_ipdatetime": "04/16 14:36",
            "push_tag": "噓",
            "push_userid": "KTHID"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281aa",
            "push_content": "全國新聞台聯播姓韓的新聞好不好？",
            "push_ipdatetime": "04/16 14:36",
            "push_tag": "噓",
            "push_userid": "espresso1"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281a9",
            "push_content": "摳連",
            "push_ipdatetime": "04/16 14:36",
            "push_tag": "噓",
            "push_userid": "qers4609"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281a8",
            "push_content": "全國都該希望中夭倒台",
            "push_ipdatetime": "04/16 14:36",
            "push_tag": "噓",
            "push_userid": "new71050"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281a7",
            "push_content": "智障 24小時都播陰囊新聞",
            "push_ipdatetime": "04/16 14:36",
            "push_tag": "噓",
            "push_userid": "QUIBECK"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281a6",
            "push_content": "拉高雄人可以，別拉全國人下水",
            "push_ipdatetime": "04/16 14:37",
            "push_tag": "噓",
            "push_userid": "kavalan1979"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281a5",
            "push_content": "以前我只覺得韓導愛講大話 頂多只討厭喜韓兒…現在真",
            "push_ipdatetime": "04/16 14:37",
            "push_tag": "噓",
            "push_userid": "shhs1000246"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281a4",
            "push_content": "ＸＤ",
            "push_ipdatetime": "04/16 14:37",
            "push_tag": "噓",
            "push_userid": "rs332c123"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281a3",
            "push_content": "你他媽的智障才去當中夭後盾。造神假新聞台，沒品！",
            "push_ipdatetime": "04/16 14:37",
            "push_tag": "噓",
            "push_userid": "Playlemon"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281a2",
            "push_content": "的嘔嘔嘔嘔",
            "push_ipdatetime": "04/16 14:37",
            "push_tag": "→",
            "push_userid": "shhs1000246"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281a1",
            "push_content": "上次轉到真的嚇到…滿滿都韓…",
            "push_ipdatetime": "04/16 14:37",
            "push_tag": "噓",
            "push_userid": "eko112"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23281a0",
            "push_content": "我不想做台灣敵人的後盾",
            "push_ipdatetime": "04/16 14:37",
            "push_tag": "噓",
            "push_userid": "charlietk3"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232819f",
            "push_content": "XDD",
            "push_ipdatetime": "04/16 14:37",
            "push_tag": "噓",
            "push_userid": "asdeax08"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232819e",
            "push_content": "這種邏輯只有高雄仔選的出來",
            "push_ipdatetime": "04/16 14:37",
            "push_tag": "噓",
            "push_userid": "enemyli"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232819d",
            "push_content": "說真的 NCC只是錯在只罰中天而不罰綠媒 但不代表中天是對",
            "push_ipdatetime": "04/16 14:38",
            "push_tag": "推",
            "push_userid": "markoo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232819c",
            "push_content": "噁心",
            "push_ipdatetime": "04/16 14:38",
            "push_tag": "噓",
            "push_userid": "charitri"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232819b",
            "push_content": "高雄只是跳板",
            "push_ipdatetime": "04/16 14:38",
            "push_tag": "噓",
            "push_userid": "deitly"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232819a",
            "push_content": "我是希望韓國瑜不要最後走回傳統藍政客的老路",
            "push_ipdatetime": "04/16 14:38",
            "push_tag": "→",
            "push_userid": "markoo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328199",
            "push_content": "",
            "push_ipdatetime": "04/16 14:38",
            "push_tag": "噓",
            "push_userid": "onlyhuman"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328198",
            "push_content": "哈哈",
            "push_ipdatetime": "04/16 14:38",
            "push_tag": "→",
            "push_userid": "trolkin"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328197",
            "push_content": "吃屎",
            "push_ipdatetime": "04/16 14:38",
            "push_tag": "噓",
            "push_userid": "goldman0204"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328196",
            "push_content": "智障",
            "push_ipdatetime": "04/16 14:39",
            "push_tag": "噓",
            "push_userid": "Orzz"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328195",
            "push_content": "你們這些舔共垃圾有13億賤畜做後盾還不夠喔?",
            "push_ipdatetime": "04/16 14:39",
            "push_tag": "噓",
            "push_userid": "PePePeace"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328194",
            "push_content": "噓",
            "push_ipdatetime": "04/16 14:40",
            "push_tag": "噓",
            "push_userid": "ikoy"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328193",
            "push_content": "滾",
            "push_ipdatetime": "04/16 14:40",
            "push_tag": "噓",
            "push_userid": "lav1147"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328192",
            "push_content": "噗",
            "push_ipdatetime": "04/16 14:40",
            "push_tag": "噓",
            "push_userid": "sr77"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328191",
            "push_content": "是全國還是全中國?",
            "push_ipdatetime": "04/16 14:40",
            "push_tag": "推",
            "push_userid": "murray"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328190",
            "push_content": "韓天電視台",
            "push_ipdatetime": "04/16 14:40",
            "push_tag": "噓",
            "push_userid": "sinon0123"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232818f",
            "push_content": "靠北，高雄人快把你家市長領回去，好嗎?",
            "push_ipdatetime": "04/16 14:40",
            "push_tag": "噓",
            "push_userid": "oldlu2002"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232818e",
            "push_content": "工三小 垃圾媒體趕快滾啦幹",
            "push_ipdatetime": "04/16 14:41",
            "push_tag": "噓",
            "push_userid": "Diablue"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232818d",
            "push_content": "韓天吃幹吧凸",
            "push_ipdatetime": "04/16 14:41",
            "push_tag": "噓",
            "push_userid": "BigLarry"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232818c",
            "push_content": "幹你娘",
            "push_ipdatetime": "04/16 14:41",
            "push_tag": "噓",
            "push_userid": "oliver81405"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232818b",
            "push_content": "...",
            "push_ipdatetime": "04/16 14:41",
            "push_tag": "噓",
            "push_userid": "eeeeee51"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232818a",
            "push_content": "中共官媒被罰氣成這樣，死共匪",
            "push_ipdatetime": "04/16 14:41",
            "push_tag": "噓",
            "push_userid": "pajck"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328189",
            "push_content": "AIT vs 小丑魚",
            "push_ipdatetime": "04/16 14:42",
            "push_tag": "噓",
            "push_userid": "madaniel"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328188",
            "push_content": "嘔",
            "push_ipdatetime": "04/16 14:42",
            "push_tag": "噓",
            "push_userid": "dumdumdum"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328187",
            "push_content": "韓狗吃屎",
            "push_ipdatetime": "04/16 14:42",
            "push_tag": "噓",
            "push_userid": "AndyWT"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328186",
            "push_content": "白癡 低能兒",
            "push_ipdatetime": "04/16 14:42",
            "push_tag": "噓",
            "push_userid": "plbroum88"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328185",
            "push_content": "幹你娘",
            "push_ipdatetime": "04/16 14:42",
            "push_tag": "噓",
            "push_userid": "paulispig"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328184",
            "push_content": "哈，瞧韓總那嘴臉，不愧是流氓底的^.^",
            "push_ipdatetime": "04/16 14:42",
            "push_tag": "推",
            "push_userid": "DOOHDLIHC"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328183",
            "push_content": "，汪汪",
            "push_ipdatetime": "04/16 14:42",
            "push_tag": "→",
            "push_userid": "capazek"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328182",
            "push_content": "嘔嘔嘔嘔嘔",
            "push_ipdatetime": "04/16 14:42",
            "push_tag": "噓",
            "push_userid": "kochiyainori"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328181",
            "push_content": "挖靠 造神台韓國瑜挺耶  好棒喔",
            "push_ipdatetime": "04/16 14:43",
            "push_tag": "噓",
            "push_userid": "Scorpio777"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328180",
            "push_content": "有病就該看醫生",
            "push_ipdatetime": "04/16 14:43",
            "push_tag": "噓",
            "push_userid": "carlos5978"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232817f",
            "push_content": "韓天電視台",
            "push_ipdatetime": "04/16 14:43",
            "push_tag": "噓",
            "push_userid": "Fongin"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232817e",
            "push_content": "ㄏㄏ",
            "push_ipdatetime": "04/16 14:43",
            "push_tag": "噓",
            "push_userid": "cww7911"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232817d",
            "push_content": "每天都播韓國瑜，被開罰剛好，真當自己是神喔",
            "push_ipdatetime": "04/16 14:43",
            "push_tag": "噓",
            "push_userid": "Kennyq"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232817c",
            "push_content": "厲害了我的天",
            "push_ipdatetime": "04/16 14:43",
            "push_tag": "噓",
            "push_userid": "jybest"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232817b",
            "push_content": "攻殺笅幹你娘",
            "push_ipdatetime": "04/16 14:43",
            "push_tag": "噓",
            "push_userid": "qscgg"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232817a",
            "push_content": "高雄人站起來！趕緊替你們的主子說話！",
            "push_ipdatetime": "04/16 14:44",
            "push_tag": "噓",
            "push_userid": "qoosky"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328179",
            "push_content": "因為這台把你吹爆才這種嘴臉",
            "push_ipdatetime": "04/16 14:44",
            "push_tag": "噓",
            "push_userid": "charlietk3"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328178",
            "push_content": "垃圾韓",
            "push_ipdatetime": "04/16 14:44",
            "push_tag": "噓",
            "push_userid": "ks89213"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328177",
            "push_content": "賣國賊  越來越囂張欸  唉",
            "push_ipdatetime": "04/16 14:44",
            "push_tag": "→",
            "push_userid": "sm999222"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328176",
            "push_content": "再噓一次 爛人",
            "push_ipdatetime": "04/16 14:44",
            "push_tag": "噓",
            "push_userid": "plbroum88"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328175",
            "push_content": "白痴",
            "push_ipdatetime": "04/16 14:44",
            "push_tag": "噓",
            "push_userid": "asdf70044"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328174",
            "push_content": "中屎王子宣",
            "push_ipdatetime": "04/16 14:45",
            "push_tag": "噓",
            "push_userid": "jass87987"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328173",
            "push_content": "頗ㄏ",
            "push_ipdatetime": "04/16 14:45",
            "push_tag": "噓",
            "push_userid": "palo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328172",
            "push_content": "https://i.imgur.com/lmYjYpB.jpg",
            "push_ipdatetime": "04/16 14:45",
            "push_tag": "噓",
            "push_userid": "toyamaK52"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328171",
            "push_content": "幹～～～蠢到無醫",
            "push_ipdatetime": "04/16 14:45",
            "push_tag": "噓",
            "push_userid": "whizz"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328170",
            "push_content": "https://i.imgur.com/v2ctDPo.jpg",
            "push_ipdatetime": "04/16 14:45",
            "push_tag": "→",
            "push_userid": "toyamaK52"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232816f",
            "push_content": "發大財喔",
            "push_ipdatetime": "04/16 14:46",
            "push_tag": "噓",
            "push_userid": "e04bank"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232816e",
            "push_content": "垃圾",
            "push_ipdatetime": "04/16 14:46",
            "push_tag": "噓",
            "push_userid": "smonkey"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232816d",
            "push_content": "幹拎老母垃圾草包禿仔",
            "push_ipdatetime": "04/16 14:46",
            "push_tag": "噓",
            "push_userid": "drugash"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232816c",
            "push_content": "高雄人 出來面對！",
            "push_ipdatetime": "04/16 14:46",
            "push_tag": "噓",
            "push_userid": "jenhaoliao"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232816b",
            "push_content": "https://i.imgur.com/5sNG2tl.jpg",
            "push_ipdatetime": "04/16 14:46",
            "push_tag": "噓",
            "push_userid": "charlietk3"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232816a",
            "push_content": "z",
            "push_ipdatetime": "04/16 14:47",
            "push_tag": "噓",
            "push_userid": "Xinzey"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328169",
            "push_content": "造神一條龍服務",
            "push_ipdatetime": "04/16 14:47",
            "push_tag": "噓",
            "push_userid": "li118"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328168",
            "push_content": "呵呵",
            "push_ipdatetime": "04/16 14:47",
            "push_tag": "噓",
            "push_userid": "zxcbrian"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328167",
            "push_content": "偏不要",
            "push_ipdatetime": "04/16 14:47",
            "push_tag": "噓",
            "push_userid": "allenwu79"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328166",
            "push_content": "高雄人自己領回去",
            "push_ipdatetime": "04/16 14:47",
            "push_tag": "推",
            "push_userid": "kducky"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328165",
            "push_content": "笑高雄人還要被污辱三年",
            "push_ipdatetime": "04/16 14:47",
            "push_tag": "噓",
            "push_userid": "happy50601"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328164",
            "push_content": "翻譯：全國的電視要變成韓神電視台二十四小時讚頌它！",
            "push_ipdatetime": "04/16 14:47",
            "push_tag": "噓",
            "push_userid": "bugbook"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328163",
            "push_content": "用虛偽的大義綁架台灣人，嘴臉真噁心",
            "push_ipdatetime": "04/16 14:47",
            "push_tag": "→",
            "push_userid": "charlietk3"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328162",
            "push_content": "媽的智障",
            "push_ipdatetime": "04/16 14:47",
            "push_tag": "噓",
            "push_userid": "mjnaoki"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328161",
            "push_content": "毫無下限 高雄人選的",
            "push_ipdatetime": "04/16 14:47",
            "push_tag": "噓",
            "push_userid": "pslr1"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328160",
            "push_content": "綠吱 聽不下實話 開始圍攻了 XDDDDDDDDDDDDDDDDDDDD",
            "push_ipdatetime": "04/16 14:47",
            "push_tag": "推",
            "push_userid": "ILoveKMT"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232815f",
            "push_content": "哪天中天爆個「韓國瑜行能力超群,曾一晚戰10龍」就別",
            "push_ipdatetime": "04/16 14:48",
            "push_tag": "噓",
            "push_userid": "lineage610"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232815e",
            "push_content": "靠背新聞造假ncc迫害",
            "push_ipdatetime": "04/16 14:48",
            "push_tag": "→",
            "push_userid": "lineage610"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232815d",
            "push_content": "真的垃圾 要舔共自己移民",
            "push_ipdatetime": "04/16 14:48",
            "push_tag": "噓",
            "push_userid": "moccabranco"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232815c",
            "push_content": "幹你娘 低能",
            "push_ipdatetime": "04/16 14:48",
            "push_tag": "推",
            "push_userid": "bluenet"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232815b",
            "push_content": "韓天教主說話了!!!",
            "push_ipdatetime": "04/16 14:48",
            "push_tag": "噓",
            "push_userid": "lmc66"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232815a",
            "push_content": "噁心",
            "push_ipdatetime": "04/16 14:49",
            "push_tag": "噓",
            "push_userid": "bloodyiris"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328159",
            "push_content": "智障吧他",
            "push_ipdatetime": "04/16 14:49",
            "push_tag": "噓",
            "push_userid": "okgod"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328158",
            "push_content": "後你老母",
            "push_ipdatetime": "04/16 14:49",
            "push_tag": "噓",
            "push_userid": "didihouse"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328157",
            "push_content": "可憐 這種人居然得民心....。",
            "push_ipdatetime": "04/16 14:49",
            "push_tag": "噓",
            "push_userid": "orech2002"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328156",
            "push_content": "這咖誰選的？",
            "push_ipdatetime": "04/16 14:50",
            "push_tag": "推",
            "push_userid": "yaoa327"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328155",
            "push_content": "垃圾",
            "push_ipdatetime": "04/16 14:50",
            "push_tag": "噓",
            "push_userid": "remsuki"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328154",
            "push_content": "噁心",
            "push_ipdatetime": "04/16 14:50",
            "push_tag": "噓",
            "push_userid": "yihsuan1122"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328153",
            "push_content": "無恥政客 無恥電視臺",
            "push_ipdatetime": "04/16 14:50",
            "push_tag": "噓",
            "push_userid": "speed678"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328152",
            "push_content": "吃屎去吧",
            "push_ipdatetime": "04/16 14:50",
            "push_tag": "→",
            "push_userid": "WeAntiTVBS"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328151",
            "push_content": "噁",
            "push_ipdatetime": "04/16 14:50",
            "push_tag": "噓",
            "push_userid": "funkyfly"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328150",
            "push_content": "有人真的很loveKMT, 中天這種垃圾媒體就該抵制",
            "push_ipdatetime": "04/16 14:50",
            "push_tag": "噓",
            "push_userid": "jybest"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232814f",
            "push_content": "中肯 想被統的是該表態了",
            "push_ipdatetime": "04/16 14:51",
            "push_tag": "推",
            "push_userid": "garcia"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232814e",
            "push_content": "不做後盾很難造神，這樣hen不方便",
            "push_ipdatetime": "04/16 14:51",
            "push_tag": "→",
            "push_userid": "a594020419"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232814d",
            "push_content": "……",
            "push_ipdatetime": "04/16 14:51",
            "push_tag": "噓",
            "push_userid": "x36023x36023"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232814c",
            "push_content": "我不要",
            "push_ipdatetime": "04/16 14:51",
            "push_tag": "噓",
            "push_userid": "qazzaq3977"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232814b",
            "push_content": "幹你娘",
            "push_ipdatetime": "04/16 14:51",
            "push_tag": "噓",
            "push_userid": "rayxg"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232814a",
            "push_content": "我高雄人 很丟臉",
            "push_ipdatetime": "04/16 14:52",
            "push_tag": "噓",
            "push_userid": "Mnchi"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328149",
            "push_content": "無恥政客配這種電視台剛好",
            "push_ipdatetime": "04/16 14:52",
            "push_tag": "噓",
            "push_userid": "JeffMnO4"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328148",
            "push_content": "白癡，看到造自己神的垃圾媒體被罰森氣氣",
            "push_ipdatetime": "04/16 14:53",
            "push_tag": "噓",
            "push_userid": "YuzanJhang"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328147",
            "push_content": "會挺這電視台的都喜韓兒嗎？",
            "push_ipdatetime": "04/16 14:53",
            "push_tag": "噓",
            "push_userid": "Destiny00"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328146",
            "push_content": "執政的高雄市都還沒弄好沒成績，整天嘴砲最行",
            "push_ipdatetime": "04/16 14:53",
            "push_tag": "噓",
            "push_userid": "qwertsong"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328145",
            "push_content": "真的是誰不合你的意就批鬥誰耶",
            "push_ipdatetime": "04/16 14:54",
            "push_tag": "噓",
            "push_userid": "vegout"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328144",
            "push_content": "你的「國」是指中國嗎",
            "push_ipdatetime": "04/16 14:54",
            "push_tag": "噓",
            "push_userid": "Formosan"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328143",
            "push_content": "垃圾中夭",
            "push_ipdatetime": "04/16 14:55",
            "push_tag": "噓",
            "push_userid": "qqaazz16516"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328142",
            "push_content": "幹吃屎啦",
            "push_ipdatetime": "04/16 14:55",
            "push_tag": "噓",
            "push_userid": "abbby"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328141",
            "push_content": "全中國嗎",
            "push_ipdatetime": "04/16 14:55",
            "push_tag": "→",
            "push_userid": "kb1023"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328140",
            "push_content": "謝謝柯粉教訓民進黨  讓我們能有韓市長",
            "push_ipdatetime": "04/16 14:56",
            "push_tag": "推",
            "push_userid": "calvinhs"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232813f",
            "push_content": "個人專屬宗教台被處罰，韓神氣pupu",
            "push_ipdatetime": "04/16 14:57",
            "push_tag": "噓",
            "push_userid": "shotakun"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232813e",
            "push_content": "政治100分",
            "push_ipdatetime": "04/16 14:57",
            "push_tag": "→",
            "push_userid": "sangoking"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232813d",
            "push_content": "我頂",
            "push_ipdatetime": "04/16 14:57",
            "push_tag": "噓",
            "push_userid": "DUKEYANG"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232813c",
            "push_content": "誇張..",
            "push_ipdatetime": "04/16 14:58",
            "push_tag": "噓",
            "push_userid": "brad10607"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232813b",
            "push_content": "低能",
            "push_ipdatetime": "04/16 14:58",
            "push_tag": "推",
            "push_userid": "zani030"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232813a",
            "push_content": "他說的全國應該不包括我吧？",
            "push_ipdatetime": "04/16 14:58",
            "push_tag": "噓",
            "push_userid": "dgq75148"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328139",
            "push_content": "他說的全國不是我們這一國吧",
            "push_ipdatetime": "04/16 14:59",
            "push_tag": "噓",
            "push_userid": "st9061204"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328138",
            "push_content": "呵呵",
            "push_ipdatetime": "04/16 14:59",
            "push_tag": "噓",
            "push_userid": "bryantmonkey"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328137",
            "push_content": "白癡",
            "push_ipdatetime": "04/16 15:00",
            "push_tag": "→",
            "push_userid": "moonchaser"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328136",
            "push_content": "神經病",
            "push_ipdatetime": "04/16 15:00",
            "push_tag": "噓",
            "push_userid": "k145"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328135",
            "push_content": "腦殘",
            "push_ipdatetime": "04/16 15:00",
            "push_tag": "噓",
            "push_userid": "chsiung"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328134",
            "push_content": "抱歉",
            "push_ipdatetime": "04/16 15:00",
            "push_tag": "噓",
            "push_userid": "skingqq"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328133",
            "push_content": "我真心覺得把中天拆掉韓會瞬間暴斃",
            "push_ipdatetime": "04/16 15:01",
            "push_tag": "→",
            "push_userid": "flare5566"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328132",
            "push_content": "嘔嘔嘔韓天台",
            "push_ipdatetime": "04/16 15:01",
            "push_tag": "噓",
            "push_userid": "heavenkghs"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328131",
            "push_content": "無言",
            "push_ipdatetime": "04/16 15:02",
            "push_tag": "推",
            "push_userid": "cj100"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328130",
            "push_content": "北七",
            "push_ipdatetime": "04/16 15:02",
            "push_tag": "噓",
            "push_userid": "lovensr"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232812f",
            "push_content": "繼續啊",
            "push_ipdatetime": "04/16 15:02",
            "push_tag": "噓",
            "push_userid": "jack14002"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232812e",
            "push_content": "按到推 扯",
            "push_ipdatetime": "04/16 15:02",
            "push_tag": "→",
            "push_userid": "cj100"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232812d",
            "push_content": "做你媽",
            "push_ipdatetime": "04/16 15:02",
            "push_tag": "噓",
            "push_userid": "charlie50704"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232812c",
            "push_content": "垃圾中天",
            "push_ipdatetime": "04/16 15:03",
            "push_tag": "噓",
            "push_userid": "coretronic"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232812b",
            "push_content": "全國電視台都是我的籌安會",
            "push_ipdatetime": "04/16 15:04",
            "push_tag": "噓",
            "push_userid": "JASONGOAHEAD"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232812a",
            "push_content": "哪個全國? 中華人民共和國嗎\\?",
            "push_ipdatetime": "04/16 15:04",
            "push_tag": "推",
            "push_userid": "bg00004"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328129",
            "push_content": "垃圾滾啦幹",
            "push_ipdatetime": "04/16 15:06",
            "push_tag": "推",
            "push_userid": "x6073123"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328128",
            "push_content": "",
            "push_ipdatetime": "04/16 15:06",
            "push_tag": "噓",
            "push_userid": "JoeBorowski"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328127",
            "push_content": "補噓 幹",
            "push_ipdatetime": "04/16 15:06",
            "push_tag": "→",
            "push_userid": "x6073123"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328126",
            "push_content": "幹你娘機掰  垃圾黃復興出品你這種渣碎  操你媽",
            "push_ipdatetime": "04/16 15:06",
            "push_tag": "噓",
            "push_userid": "hophers"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328125",
            "push_content": "垃圾",
            "push_ipdatetime": "04/16 15:07",
            "push_tag": "噓",
            "push_userid": "alau"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328124",
            "push_content": "出手打人的謊話廢物大談愛與和平  幹你娘沒藥醫",
            "push_ipdatetime": "04/16 15:07",
            "push_tag": "→",
            "push_userid": "hophers"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328123",
            "push_content": "露餡啦",
            "push_ipdatetime": "04/16 15:08",
            "push_tag": "噓",
            "push_userid": "ggian123"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328122",
            "push_content": "你就是歪魔邪道",
            "push_ipdatetime": "04/16 15:08",
            "push_tag": "噓",
            "push_userid": "ja11s4o1n7"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328121",
            "push_content": "沒播韓導新聞的全都關台好了.....",
            "push_ipdatetime": "04/16 15:08",
            "push_tag": "噓",
            "push_userid": "knifeking"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328120",
            "push_content": "垃圾中天 垃圾韓",
            "push_ipdatetime": "04/16 15:09",
            "push_tag": "噓",
            "push_userid": "login"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232811f",
            "push_content": "9.2假綠粉這篇沒半個",
            "push_ipdatetime": "04/16 15:09",
            "push_tag": "噓",
            "push_userid": "axd1982"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232811e",
            "push_content": "整天說要與支那賤畜和平安定  女兒舔加拿大  禿頭舔美",
            "push_ipdatetime": "04/16 15:09",
            "push_tag": "噓",
            "push_userid": "hophers"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232811d",
            "push_content": "後你x",
            "push_ipdatetime": "04/16 15:09",
            "push_tag": "噓",
            "push_userid": "rockyegg"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232811c",
            "push_content": "幹你娘整天丟人現眼  支那賤畜也沒你下賤",
            "push_ipdatetime": "04/16 15:10",
            "push_tag": "→",
            "push_userid": "hophers"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232811b",
            "push_content": "好笑",
            "push_ipdatetime": "04/16 15:10",
            "push_tag": "噓",
            "push_userid": "imlaizz"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232811a",
            "push_content": "真的是垃圾賣國賊",
            "push_ipdatetime": "04/16 15:10",
            "push_tag": "噓",
            "push_userid": "bassline"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328119",
            "push_content": "台灣真的很悲哀，這種人到底在紅三小",
            "push_ipdatetime": "04/16 15:10",
            "push_tag": "噓",
            "push_userid": "itaichung"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328118",
            "push_content": "無恥",
            "push_ipdatetime": "04/16 15:10",
            "push_tag": "噓",
            "push_userid": "silverwolfEX"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328117",
            "push_content": "垃圾狗台",
            "push_ipdatetime": "04/16 15:10",
            "push_tag": "噓",
            "push_userid": "xinya707"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328116",
            "push_content": "KMT政客就是這種樣子",
            "push_ipdatetime": "04/16 15:10",
            "push_tag": "噓",
            "push_userid": "iMANIA"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328115",
            "push_content": "我為何要挺智障電視台",
            "push_ipdatetime": "04/16 15:11",
            "push_tag": "噓",
            "push_userid": "dasuperray"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328114",
            "push_content": "改成韓天宗教台就可以解套了",
            "push_ipdatetime": "04/16 15:11",
            "push_tag": "→",
            "push_userid": "imlaizz"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328113",
            "push_content": "......",
            "push_ipdatetime": "04/16 15:11",
            "push_tag": "噓",
            "push_userid": "Eivissa"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328112",
            "push_content": "這3小",
            "push_ipdatetime": "04/16 15:12",
            "push_tag": "噓",
            "push_userid": "junynyi"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328111",
            "push_content": "。。。。。。",
            "push_ipdatetime": "04/16 15:12",
            "push_tag": "→",
            "push_userid": "Qorqios"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328110",
            "push_content": "幹，看韓國瑜講幹話",
            "push_ipdatetime": "04/16 15:13",
            "push_tag": "噓",
            "push_userid": "SnakeO"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232810f",
            "push_content": "到底哪些白痴在挺他",
            "push_ipdatetime": "04/16 15:13",
            "push_tag": "噓",
            "push_userid": "tongzhou"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232810e",
            "push_content": "垃圾噁心～～～",
            "push_ipdatetime": "04/16 15:14",
            "push_tag": "噓",
            "push_userid": "UniversalGod"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232810d",
            "push_content": "",
            "push_ipdatetime": "04/16 15:15",
            "push_tag": "噓",
            "push_userid": "ppc"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232810c",
            "push_content": "這種貨色偏偏我親戚很愛…",
            "push_ipdatetime": "04/16 15:15",
            "push_tag": "噓",
            "push_userid": "PTTJim"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232810b",
            "push_content": "87啊",
            "push_ipdatetime": "04/16 15:15",
            "push_tag": "噓",
            "push_userid": "Monicayan02"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232810a",
            "push_content": "你的全國不是我的全國",
            "push_ipdatetime": "04/16 15:15",
            "push_tag": "噓",
            "push_userid": "transfixgod"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328109",
            "push_content": "越來越噁心了",
            "push_ipdatetime": "04/16 15:16",
            "push_tag": "噓",
            "push_userid": "vespar"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328108",
            "push_content": "...",
            "push_ipdatetime": "04/16 15:16",
            "push_tag": "噓",
            "push_userid": "kevin70"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328107",
            "push_content": "幹你媽！死共匪滾啦！",
            "push_ipdatetime": "04/16 15:16",
            "push_tag": "噓",
            "push_userid": "ccucwc"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328106",
            "push_content": "",
            "push_ipdatetime": "04/16 15:16",
            "push_tag": "噓",
            "push_userid": "Coffeewater"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328105",
            "push_content": "不演了  全身趴下來舔",
            "push_ipdatetime": "04/16 15:17",
            "push_tag": "噓",
            "push_userid": "tassadar1"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328104",
            "push_content": "垃圾快滾",
            "push_ipdatetime": "04/16 15:19",
            "push_tag": "噓",
            "push_userid": "thematic"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328103",
            "push_content": "假腥文整天造神的垃圾黴體沒什麼好說的",
            "push_ipdatetime": "04/16 15:19",
            "push_tag": "→",
            "push_userid": "leftwalk"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328102",
            "push_content": "胡言亂語",
            "push_ipdatetime": "04/16 15:20",
            "push_tag": "噓",
            "push_userid": "chxxyy1"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328101",
            "push_content": "共三小",
            "push_ipdatetime": "04/16 15:20",
            "push_tag": "噓",
            "push_userid": "yudeifish"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328100",
            "push_content": "有毛病嗎",
            "push_ipdatetime": "04/16 15:22",
            "push_tag": "噓",
            "push_userid": "countryair"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280ff",
            "push_content": "zzzzz",
            "push_ipdatetime": "04/16 15:22",
            "push_tag": "噓",
            "push_userid": "ffgghh2233"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280fe",
            "push_content": "？？？",
            "push_ipdatetime": "04/16 15:22",
            "push_tag": "噓",
            "push_userid": "cherish2010"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280fd",
            "push_content": "笑死",
            "push_ipdatetime": "04/16 15:23",
            "push_tag": "噓",
            "push_userid": "ly0925"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280fc",
            "push_content": "韓：舔共只能由我來舔！馬英九都不准舔！",
            "push_ipdatetime": "04/16 15:23",
            "push_tag": "噓",
            "push_userid": "lbowlbow"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280fb",
            "push_content": "ㄏㄏ",
            "push_ipdatetime": "04/16 15:23",
            "push_tag": "噓",
            "push_userid": "soapopera"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280fa",
            "push_content": "十禿九賊",
            "push_ipdatetime": "04/16 15:24",
            "push_tag": "噓",
            "push_userid": "G8DA"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280f9",
            "push_content": "垃圾閉嘴",
            "push_ipdatetime": "04/16 15:25",
            "push_tag": "噓",
            "push_userid": "OneDrive"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280f8",
            "push_content": "垃圾電視台 捧久了就當真了？",
            "push_ipdatetime": "04/16 15:25",
            "push_tag": "→",
            "push_userid": "smart1989"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280f7",
            "push_content": "腦袋裝屎",
            "push_ipdatetime": "04/16 15:25",
            "push_tag": "噓",
            "push_userid": "wison4451"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280f6",
            "push_content": "滾吧支那狗政客跟媒體",
            "push_ipdatetime": "04/16 15:26",
            "push_tag": "噓",
            "push_userid": "wayne723"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280f5",
            "push_content": "腦袋裝屎就閉嘴好嗎",
            "push_ipdatetime": "04/16 15:28",
            "push_tag": "噓",
            "push_userid": "TessaFan"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280f4",
            "push_content": "垃圾電視臺 這傢伙選上每天膨脹",
            "push_ipdatetime": "04/16 15:28",
            "push_tag": "噓",
            "push_userid": "acserro"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280f3",
            "push_content": "某些可悲臺灣人選出來的",
            "push_ipdatetime": "04/16 15:28",
            "push_tag": "噓",
            "push_userid": "EkkoCarriesU"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280f2",
            "push_content": "當垃圾後盾喔 哈哈哈",
            "push_ipdatetime": "04/16 15:29",
            "push_tag": "噓",
            "push_userid": "pokerhow"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280f1",
            "push_content": "霸你個懶叫 幹 垃圾",
            "push_ipdatetime": "04/16 15:29",
            "push_tag": "噓",
            "push_userid": "linbsing"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280f0",
            "push_content": "垃圾自己認證自己垃圾 結案",
            "push_ipdatetime": "04/16 15:30",
            "push_tag": "噓",
            "push_userid": "lpoijk"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280ef",
            "push_content": "智能障礙",
            "push_ipdatetime": "04/16 15:30",
            "push_tag": "噓",
            "push_userid": "jim924211"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280ee",
            "push_content": "沒救了",
            "push_ipdatetime": "04/16 15:31",
            "push_tag": "噓",
            "push_userid": "ilovebooks91"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280ed",
            "push_content": "https://imgur.com/7ZlgnGY  免洗舔共跳板幫",
            "push_ipdatetime": "04/16 15:31",
            "push_tag": "噓",
            "push_userid": "abc5555590"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280ec",
            "push_content": "做市長做到自己變囂張了",
            "push_ipdatetime": "04/16 15:32",
            "push_tag": "噓",
            "push_userid": "Cherng9527"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280eb",
            "push_content": ".....",
            "push_ipdatetime": "04/16 15:32",
            "push_tag": "噓",
            "push_userid": "allen556386"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280ea",
            "push_content": "無可救藥的敗類",
            "push_ipdatetime": "04/16 15:32",
            "push_tag": "噓",
            "push_userid": "staramit"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280e9",
            "push_content": "高雄要超過苗栗了嗎",
            "push_ipdatetime": "04/16 15:33",
            "push_tag": "噓",
            "push_userid": "sean324tw"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280e8",
            "push_content": "罰太輕了，蔡英文有魄力點好嗎",
            "push_ipdatetime": "04/16 15:34",
            "push_tag": "噓",
            "push_userid": "z1976"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280e7",
            "push_content": "果然ㄌㄙ才會挺ㄌㄙ",
            "push_ipdatetime": "04/16 15:35",
            "push_tag": "噓",
            "push_userid": "louis11811"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280e6",
            "push_content": "你B嘴",
            "push_ipdatetime": "04/16 15:35",
            "push_tag": "噓",
            "push_userid": "jet113102"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280e5",
            "push_content": "工三小",
            "push_ipdatetime": "04/16 15:36",
            "push_tag": "噓",
            "push_userid": "ask77887788"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280e4",
            "push_content": "政治100分 經濟0分",
            "push_ipdatetime": "04/16 15:36",
            "push_tag": "推",
            "push_userid": "centriole"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280e3",
            "push_content": "滾",
            "push_ipdatetime": "04/16 15:37",
            "push_tag": "噓",
            "push_userid": "mige1717"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280e2",
            "push_content": "此刻的韓導信心爆棚 當定台灣特首了",
            "push_ipdatetime": "04/16 15:37",
            "push_tag": "噓",
            "push_userid": "sulaman"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280e1",
            "push_content": "這男的真的噁心到不行，自戀到想吐",
            "push_ipdatetime": "04/16 15:38",
            "push_tag": "噓",
            "push_userid": "gfiba"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280e0",
            "push_content": "??",
            "push_ipdatetime": "04/16 15:38",
            "push_tag": "→",
            "push_userid": "zakk814"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280df",
            "push_content": "教主護自己的電視台, 人之常情。",
            "push_ipdatetime": "04/16 15:39",
            "push_tag": "噓",
            "push_userid": "Kunlin"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280de",
            "push_content": "???",
            "push_ipdatetime": "04/16 15:39",
            "push_tag": "噓",
            "push_userid": "cloudin"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280dd",
            "push_content": "?_?",
            "push_ipdatetime": "04/16 15:40",
            "push_tag": "噓",
            "push_userid": "nekomurasaki"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280dc",
            "push_content": "#1SeLNvrs (Gossiping)",
            "push_ipdatetime": "04/16 15:40",
            "push_tag": "噓",
            "push_userid": "pizzalot"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280db",
            "push_content": "太噁心了",
            "push_ipdatetime": "04/16 15:40",
            "push_tag": "噓",
            "push_userid": "deamer"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280da",
            "push_content": "神經病 （關電視）",
            "push_ipdatetime": "04/16 15:40",
            "push_tag": "噓",
            "push_userid": "sasintw"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280d9",
            "push_content": "低能兒",
            "push_ipdatetime": "04/16 15:41",
            "push_tag": "噓",
            "push_userid": "wryyyyyyyy"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280d8",
            "push_content": "洨",
            "push_ipdatetime": "04/16 15:41",
            "push_tag": "噓",
            "push_userid": "hlb5828"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280d7",
            "push_content": "扯爆了!!",
            "push_ipdatetime": "04/16 15:41",
            "push_tag": "噓",
            "push_userid": "pido"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280d6",
            "push_content": "？？？",
            "push_ipdatetime": "04/16 15:41",
            "push_tag": "噓",
            "push_userid": "iamzerogo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280d5",
            "push_content": "邪魔歪道自介？",
            "push_ipdatetime": "04/16 15:41",
            "push_tag": "噓",
            "push_userid": "st89702"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280d4",
            "push_content": "垃圾到爆",
            "push_ipdatetime": "04/16 15:42",
            "push_tag": "推",
            "push_userid": "ht40wm11"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280d3",
            "push_content": "全國都該信你垃圾國民黨算了",
            "push_ipdatetime": "04/16 15:42",
            "push_tag": "噓",
            "push_userid": "CAMPER0519"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280d2",
            "push_content": "笑死，造神電視台被罰剛好而已",
            "push_ipdatetime": "04/16 15:43",
            "push_tag": "噓",
            "push_userid": "okwep"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280d1",
            "push_content": "中天不是有中資就已經超過全台支援了嗎？",
            "push_ipdatetime": "04/16 15:43",
            "push_tag": "推",
            "push_userid": "fenderrb"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280d0",
            "push_content": "做你媽雞掰後盾啦",
            "push_ipdatetime": "04/16 15:43",
            "push_tag": "噓",
            "push_userid": "a8824031"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280cf",
            "push_content": "這個言論我還不噓個",
            "push_ipdatetime": "04/16 15:43",
            "push_tag": "噓",
            "push_userid": "charlie0228"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280ce",
            "push_content": "白癡",
            "push_ipdatetime": "04/16 15:44",
            "push_tag": "噓",
            "push_userid": "jobechi"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280cd",
            "push_content": "垃圾自己去互盾",
            "push_ipdatetime": "04/16 15:44",
            "push_tag": "噓",
            "push_userid": "cardcar"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280cc",
            "push_content": "這咖可以再誇張一點沒關係",
            "push_ipdatetime": "04/16 15:45",
            "push_tag": "噓",
            "push_userid": "Tamama05"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280cb",
            "push_content": "韓式 口味",
            "push_ipdatetime": "04/16 15:45",
            "push_tag": "噓",
            "push_userid": "polo5615"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280ca",
            "push_content": "韓到底是用什麼臉說這種鬼話",
            "push_ipdatetime": "04/16 15:45",
            "push_tag": "噓",
            "push_userid": "penny4419"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280c9",
            "push_content": "",
            "push_ipdatetime": "04/16 15:47",
            "push_tag": "噓",
            "push_userid": "shunchao"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280c8",
            "push_content": "垃圾支那人滾回中國辣操",
            "push_ipdatetime": "04/16 15:47",
            "push_tag": "噓",
            "push_userid": "philip09227"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280c7",
            "push_content": "嘔嘔嘔嘔嘔嘔嘔嘔",
            "push_ipdatetime": "04/16 15:47",
            "push_tag": "推",
            "push_userid": "koty6069"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280c6",
            "push_content": "我以為他知道自己是被捧起來的",
            "push_ipdatetime": "04/16 15:47",
            "push_tag": "噓",
            "push_userid": "kevin030899"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280c5",
            "push_content": "呵呵",
            "push_ipdatetime": "04/16 15:47",
            "push_tag": "噓",
            "push_userid": "liang94313"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280c4",
            "push_content": "結果捧久了還真的以為自己很屌",
            "push_ipdatetime": "04/16 15:48",
            "push_tag": "→",
            "push_userid": "kevin030899"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280c3",
            "push_content": "廢到笑",
            "push_ipdatetime": "04/16 15:48",
            "push_tag": "噓",
            "push_userid": "kkwow"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280c2",
            "push_content": "這腦子，我就放心了",
            "push_ipdatetime": "04/16 15:50",
            "push_tag": "噓",
            "push_userid": "george627"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280c1",
            "push_content": "乾脆改叫韓國瑜樂台好了",
            "push_ipdatetime": "04/16 15:51",
            "push_tag": "噓",
            "push_userid": "osk2"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280c0",
            "push_content": "你才邪魔歪道",
            "push_ipdatetime": "04/16 15:51",
            "push_tag": "噓",
            "push_userid": "naughtyds"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280bf",
            "push_content": "",
            "push_ipdatetime": "04/16 15:51",
            "push_tag": "噓",
            "push_userid": "mayegg"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280be",
            "push_content": "",
            "push_ipdatetime": "04/16 15:51",
            "push_tag": "噓",
            "push_userid": "Turboman"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280bd",
            "push_content": "低能",
            "push_ipdatetime": "04/16 15:51",
            "push_tag": "推",
            "push_userid": "monkey99"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280bc",
            "push_content": "根本不好笑 韓國瑜完全照著李毅那套在挑起社會對立",
            "push_ipdatetime": "04/16 15:51",
            "push_tag": "噓",
            "push_userid": "yaotz5065"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280bb",
            "push_content": "空洞腦的極致",
            "push_ipdatetime": "04/16 15:51",
            "push_tag": "噓",
            "push_userid": "twmarstw7758"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280ba",
            "push_content": "傻眼",
            "push_ipdatetime": "04/16 15:52",
            "push_tag": "噓",
            "push_userid": "axalex"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280b9",
            "push_content": "噁心中夭電視台",
            "push_ipdatetime": "04/16 15:52",
            "push_tag": "噓",
            "push_userid": "abc55643"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280b8",
            "push_content": "嘔嘔嘔 還是無法理解他為何當選",
            "push_ipdatetime": "04/16 15:53",
            "push_tag": "噓",
            "push_userid": "winnyshe"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280b7",
            "push_content": "...",
            "push_ipdatetime": "04/16 15:53",
            "push_tag": "噓",
            "push_userid": "superkb"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280b6",
            "push_content": "噁心",
            "push_ipdatetime": "04/16 15:53",
            "push_tag": "噓",
            "push_userid": "chitosalen"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280b5",
            "push_content": "wtf",
            "push_ipdatetime": "04/16 15:54",
            "push_tag": "噓",
            "push_userid": "adidascx"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280b4",
            "push_content": "靠么 看到備註還以為是Joke板",
            "push_ipdatetime": "04/16 15:54",
            "push_tag": "推",
            "push_userid": "siangkeith"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280b3",
            "push_content": "恬不知恥 噁心",
            "push_ipdatetime": "04/16 15:55",
            "push_tag": "推",
            "push_userid": "sunyubro"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280b2",
            "push_content": "好噁",
            "push_ipdatetime": "04/16 15:55",
            "push_tag": "噓",
            "push_userid": "lynn0819"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280b1",
            "push_content": "韓天電視臺",
            "push_ipdatetime": "04/16 15:55",
            "push_tag": "噓",
            "push_userid": "love464841"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280b0",
            "push_content": "不愧是韓天垃圾台",
            "push_ipdatetime": "04/16 15:56",
            "push_tag": "噓",
            "push_userid": "stexeric"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280af",
            "push_content": "垃圾",
            "push_ipdatetime": "04/16 15:56",
            "push_tag": "噓",
            "push_userid": "ajie128"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280ae",
            "push_content": "中夭舔的韓導我好爽 你們最好給我看中夭ㄛ",
            "push_ipdatetime": "04/16 15:56",
            "push_tag": "噓",
            "push_userid": "ash9911911"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280ad",
            "push_content": "別的新聞台沒犯錯幹嘛擔心",
            "push_ipdatetime": "04/16 15:56",
            "push_tag": "噓",
            "push_userid": "brucesuperQ"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280ac",
            "push_content": "不演了不演了",
            "push_ipdatetime": "04/16 15:57",
            "push_tag": "噓",
            "push_userid": "lifelikeplay"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280ab",
            "push_content": "唉 這種人卻享這樣的知名度",
            "push_ipdatetime": "04/16 15:57",
            "push_tag": "噓",
            "push_userid": "JoshuaAstray"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280aa",
            "push_content": "造謠不罰只有智障才覺得沒問題",
            "push_ipdatetime": "04/16 15:57",
            "push_tag": "噓",
            "push_userid": "pcpcpcpcpcpc"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280a9",
            "push_content": "這禿頭到底以為自己是誰阿？",
            "push_ipdatetime": "04/16 15:58",
            "push_tag": "→",
            "push_userid": "cutechken"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280a8",
            "push_content": "真心爛",
            "push_ipdatetime": "04/16 15:58",
            "push_tag": "噓",
            "push_userid": "aaayukiaaa"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280a7",
            "push_content": "邪門歪道哈哈哈哈哈",
            "push_ipdatetime": "04/16 15:58",
            "push_tag": "噓",
            "push_userid": "kaiyoung"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280a6",
            "push_content": "自己無腦不要拖其他人下水",
            "push_ipdatetime": "04/16 15:59",
            "push_tag": "噓",
            "push_userid": "amy6272000"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280a5",
            "push_content": "少一台造神很不方便",
            "push_ipdatetime": "04/16 16:00",
            "push_tag": "推",
            "push_userid": "aling1205"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280a4",
            "push_content": "到底是誰腦子有洞啊，天啊，選舉完整個現出原形",
            "push_ipdatetime": "04/16 16:00",
            "push_tag": "噓",
            "push_userid": "pinkcandy"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280a3",
            "push_content": "垃圾新高度",
            "push_ipdatetime": "04/16 16:01",
            "push_tag": "噓",
            "push_userid": "c58264cathy"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280a2",
            "push_content": "看破手腳",
            "push_ipdatetime": "04/16 16:01",
            "push_tag": "噓",
            "push_userid": "joy25881371"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280a1",
            "push_content": "是不是全台灣人都欠高雄 同一套東西",
            "push_ipdatetime": "04/16 16:02",
            "push_tag": "噓",
            "push_userid": "allenwu79"
          },
          {
            "_id": "5ce0cfe26e8ee31ef23280a0",
            "push_content": "當這裡北韓？",
            "push_ipdatetime": "04/16 16:02",
            "push_tag": "噓",
            "push_userid": "bFirefighter"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232809f",
            "push_content": "等初選後再黑你",
            "push_ipdatetime": "04/16 16:03",
            "push_tag": "噓",
            "push_userid": "gakkiaki"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232809e",
            "push_content": "邪門歪道就是你自己啦",
            "push_ipdatetime": "04/16 16:04",
            "push_tag": "噓",
            "push_userid": "phabit"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232809d",
            "push_content": "整天在練宵話",
            "push_ipdatetime": "04/16 16:04",
            "push_tag": "噓",
            "push_userid": "s8955439"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232809c",
            "push_content": "中屎真的很屎",
            "push_ipdatetime": "04/16 16:04",
            "push_tag": "→",
            "push_userid": "beatyuu"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232809b",
            "push_content": "禿",
            "push_ipdatetime": "04/16 16:04",
            "push_tag": "噓",
            "push_userid": "markchen0907"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232809a",
            "push_content": "哈哈哈  高雄人智商真棒",
            "push_ipdatetime": "04/16 16:04",
            "push_tag": "噓",
            "push_userid": "malaman"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328099",
            "push_content": "韓導電視台",
            "push_ipdatetime": "04/16 16:04",
            "push_tag": "噓",
            "push_userid": "abc55643"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328098",
            "push_content": "吃屎",
            "push_ipdatetime": "04/16 16:05",
            "push_tag": "噓",
            "push_userid": "leetinjun25"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328097",
            "push_content": "我吐了",
            "push_ipdatetime": "04/16 16:05",
            "push_tag": "噓",
            "push_userid": "demo68"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328096",
            "push_content": "太扯！！！！！",
            "push_ipdatetime": "04/16 16:06",
            "push_tag": "噓",
            "push_userid": "chenlin"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328095",
            "push_content": "韓流發威",
            "push_ipdatetime": "04/16 16:06",
            "push_tag": "噓",
            "push_userid": "maxpeopleup"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328094",
            "push_content": "？？？？？？？",
            "push_ipdatetime": "04/16 16:06",
            "push_tag": "噓",
            "push_userid": "senttreepay"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328093",
            "push_content": "垃圾中天",
            "push_ipdatetime": "04/16 16:06",
            "push_tag": "噓",
            "push_userid": "applepie0505"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328092",
            "push_content": "笑死",
            "push_ipdatetime": "04/16 16:06",
            "push_tag": "→",
            "push_userid": "conanhide"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328091",
            "push_content": "草包韓",
            "push_ipdatetime": "04/16 16:06",
            "push_tag": "噓",
            "push_userid": "lostsky93"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328090",
            "push_content": "智障",
            "push_ipdatetime": "04/16 16:06",
            "push_tag": "噓",
            "push_userid": "wulaw5566"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232808f",
            "push_content": "啊?",
            "push_ipdatetime": "04/16 16:07",
            "push_tag": "噓",
            "push_userid": "liker1412"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232808e",
            "push_content": "你以為你是總統?草包連高雄都顧不好了",
            "push_ipdatetime": "04/16 16:08",
            "push_tag": "噓",
            "push_userid": "k2890206"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232808d",
            "push_content": "再一次確定不同路了",
            "push_ipdatetime": "04/16 16:09",
            "push_tag": "噓",
            "push_userid": "lily7777"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232808c",
            "push_content": "奇怪，中時不是挺韓?",
            "push_ipdatetime": "04/16 16:09",
            "push_tag": "→",
            "push_userid": "hoks"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232808b",
            "push_content": "到底在幹嘛？",
            "push_ipdatetime": "04/16 16:09",
            "push_tag": "噓",
            "push_userid": "wk415937"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232808a",
            "push_content": "肏",
            "push_ipdatetime": "04/16 16:09",
            "push_tag": "噓",
            "push_userid": "gary2011"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328089",
            "push_content": "過頭了",
            "push_ipdatetime": "04/16 16:09",
            "push_tag": "噓",
            "push_userid": "falcon11"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328088",
            "push_content": "幹你娘機掰",
            "push_ipdatetime": "04/16 16:10",
            "push_tag": "噓",
            "push_userid": "cazy328"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328087",
            "push_content": "到底怎麼辦到的",
            "push_ipdatetime": "04/16 16:10",
            "push_tag": "噓",
            "push_userid": "wtmjs"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328086",
            "push_content": "垃圾中夭",
            "push_ipdatetime": "04/16 16:10",
            "push_tag": "→",
            "push_userid": "yahappy4u"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328085",
            "push_content": "垃圾中天",
            "push_ipdatetime": "04/16 16:11",
            "push_tag": "推",
            "push_userid": "tek1985"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328084",
            "push_content": "亂扯，哈哈哈！笑",
            "push_ipdatetime": "04/16 16:11",
            "push_tag": "噓",
            "push_userid": "gopoivvo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328083",
            "push_content": "北七低能舔共狗只會嘴炮還會做什麼",
            "push_ipdatetime": "04/16 16:11",
            "push_tag": "噓",
            "push_userid": "Yehpin2823"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328082",
            "push_content": "不要",
            "push_ipdatetime": "04/16 16:12",
            "push_tag": "噓",
            "push_userid": "mf99319"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328081",
            "push_content": "智障一個，滾去大陸",
            "push_ipdatetime": "04/16 16:12",
            "push_tag": "噓",
            "push_userid": "rabbit80891"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328080",
            "push_content": "媒體跟政治人物一個德性 呵呵",
            "push_ipdatetime": "04/16 16:12",
            "push_tag": "噓",
            "push_userid": "ArNan"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232807f",
            "push_content": "???????????????????????????????",
            "push_ipdatetime": "04/16 16:12",
            "push_tag": "噓",
            "push_userid": "andrew40907"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232807e",
            "push_content": "不演了喔 太快了吧",
            "push_ipdatetime": "04/16 16:12",
            "push_tag": "噓",
            "push_userid": "aegis123g"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232807d",
            "push_content": "到底是為中華民國還是中華人民共和國服務？呵呵",
            "push_ipdatetime": "04/16 16:13",
            "push_tag": "噓",
            "push_userid": "folkblues"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232807c",
            "push_content": "韓粉快帶走好嗎？越看越噁",
            "push_ipdatetime": "04/16 16:14",
            "push_tag": "推",
            "push_userid": "twmarstw7758"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232807b",
            "push_content": "垃圾挺垃圾 不意外",
            "push_ipdatetime": "04/16 16:14",
            "push_tag": "噓",
            "push_userid": "leo221"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232807a",
            "push_content": "替垃圾支那媒體護航的也是垃圾 都去死一死",
            "push_ipdatetime": "04/16 16:15",
            "push_tag": "噓",
            "push_userid": "Youmukon"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328079",
            "push_content": "下去啦，被AIT打臉的還不夠嗎",
            "push_ipdatetime": "04/16 16:15",
            "push_tag": "噓",
            "push_userid": "poweihsu"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328078",
            "push_content": "https://i.imgur.com/sQslt7G.jpg",
            "push_ipdatetime": "04/16 16:16",
            "push_tag": "噓",
            "push_userid": "fffogpug"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328077",
            "push_content": "韓天電視台",
            "push_ipdatetime": "04/16 16:16",
            "push_tag": "噓",
            "push_userid": "ahotsu"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328076",
            "push_content": "https://i.imgur.com/iYjdK7G.jpg",
            "push_ipdatetime": "04/16 16:17",
            "push_tag": "→",
            "push_userid": "fffogpug"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328075",
            "push_content": "爛電視台",
            "push_ipdatetime": "04/16 16:17",
            "push_tag": "噓",
            "push_userid": "wei75719"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328074",
            "push_content": "高雄選出了一個滯台舔共市長",
            "push_ipdatetime": "04/16 16:18",
            "push_tag": "噓",
            "push_userid": "wison4451"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328073",
            "push_content": "什麼屎? 喔 是中屎喔",
            "push_ipdatetime": "04/16 16:18",
            "push_tag": "噓",
            "push_userid": "hate56"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328072",
            "push_content": "台灣要變成北韓了是嗎?",
            "push_ipdatetime": "04/16 16:18",
            "push_tag": "推",
            "push_userid": "walkmancat"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328071",
            "push_content": "做你去死啦 做？",
            "push_ipdatetime": "04/16 16:19",
            "push_tag": "噓",
            "push_userid": "echoo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328070",
            "push_content": "XD",
            "push_ipdatetime": "04/16 16:19",
            "push_tag": "噓",
            "push_userid": "peterkuo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232806f",
            "push_content": "閉嘴",
            "push_ipdatetime": "04/16 16:19",
            "push_tag": "噓",
            "push_userid": "RealLeonard"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232806e",
            "push_content": "高雄人自己揀回去好嗎 丟臉死了 別放出來丟人",
            "push_ipdatetime": "04/16 16:20",
            "push_tag": "→",
            "push_userid": "fivetobacco"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232806d",
            "push_content": "我馬的夠了沒",
            "push_ipdatetime": "04/16 16:21",
            "push_tag": "噓",
            "push_userid": "liuliuqiuqiu"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232806c",
            "push_content": "這人把台灣人當白痴",
            "push_ipdatetime": "04/16 16:21",
            "push_tag": "噓",
            "push_userid": "billionaire"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232806b",
            "push_content": "8787878787",
            "push_ipdatetime": "04/16 16:22",
            "push_tag": "噓",
            "push_userid": "jim930823"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232806a",
            "push_content": "...........",
            "push_ipdatetime": "04/16 16:23",
            "push_tag": "噓",
            "push_userid": "saile60391"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328069",
            "push_content": "除了蘋果禁貼以外 中時系列也全面禁貼 才合理",
            "push_ipdatetime": "04/16 16:23",
            "push_tag": "→",
            "push_userid": "WeAntiTVBS"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328068",
            "push_content": "笑死",
            "push_ipdatetime": "04/16 16:24",
            "push_tag": "噓",
            "push_userid": "sweetie196"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328067",
            "push_content": "向邪魔歪道說不",
            "push_ipdatetime": "04/16 16:24",
            "push_tag": "噓",
            "push_userid": "Applications"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328066",
            "push_content": "Fuck you",
            "push_ipdatetime": "04/16 16:24",
            "push_tag": "噓",
            "push_userid": "killerjack"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328065",
            "push_content": "....",
            "push_ipdatetime": "04/16 16:24",
            "push_tag": "噓",
            "push_userid": "asady"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328064",
            "push_content": "中天的全國跟我的全國不一樣耶",
            "push_ipdatetime": "04/16 16:25",
            "push_tag": "噓",
            "push_userid": "TheAnswer"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328063",
            "push_content": "那後宮是要...",
            "push_ipdatetime": "04/16 16:26",
            "push_tag": "噓",
            "push_userid": "sorawang"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328062",
            "push_content": "87現形記",
            "push_ipdatetime": "04/16 16:26",
            "push_tag": "噓",
            "push_userid": "Shadow5566"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328061",
            "push_content": "這樣子的人能當地方首長 真的沒救了",
            "push_ipdatetime": "04/16 16:28",
            "push_tag": "噓",
            "push_userid": "a894392000"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328060",
            "push_content": "真敢講，高雄白日夢王",
            "push_ipdatetime": "04/16 16:28",
            "push_tag": "噓",
            "push_userid": "a856445"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232805f",
            "push_content": "滾",
            "push_ipdatetime": "04/16 16:30",
            "push_tag": "噓",
            "push_userid": "pingwawa"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232805e",
            "push_content": "智障韓天電視台",
            "push_ipdatetime": "04/16 16:31",
            "push_tag": "噓",
            "push_userid": "fallen01"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232805d",
            "push_content": "這不噓不行了",
            "push_ipdatetime": "04/16 16:31",
            "push_tag": "噓",
            "push_userid": "jellzoya"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232805c",
            "push_content": "現形啦！",
            "push_ipdatetime": "04/16 16:32",
            "push_tag": "噓",
            "push_userid": "LostSoul"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232805b",
            "push_content": "光這句話,全面反韓",
            "push_ipdatetime": "04/16 16:32",
            "push_tag": "噓",
            "push_userid": "LiangNight"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232805a",
            "push_content": "滾",
            "push_ipdatetime": "04/16 16:32",
            "push_tag": "噓",
            "push_userid": "hugowinner"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328059",
            "push_content": "工三小",
            "push_ipdatetime": "04/16 16:32",
            "push_tag": "噓",
            "push_userid": "Gottisttot"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328058",
            "push_content": "垃圾中夭",
            "push_ipdatetime": "04/16 16:34",
            "push_tag": "噓",
            "push_userid": "ProSider"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328057",
            "push_content": "韓導自從輔選澇賽後 戲導的很急喔 不知道在急什麼",
            "push_ipdatetime": "04/16 16:34",
            "push_tag": "噓",
            "push_userid": "Like5566Like"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328056",
            "push_content": "不能造神很快會被看破",
            "push_ipdatetime": "04/16 16:35",
            "push_tag": "噓",
            "push_userid": "tkuewaiting"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328055",
            "push_content": "嘔嘔",
            "push_ipdatetime": "04/16 16:35",
            "push_tag": "噓",
            "push_userid": "hotrain13"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328054",
            "push_content": "吃屎吧 甘0羊",
            "push_ipdatetime": "04/16 16:36",
            "push_tag": "噓",
            "push_userid": "dyrhue1126"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328053",
            "push_content": "全中華人民共和國嗎？",
            "push_ipdatetime": "04/16 16:37",
            "push_tag": "噓",
            "push_userid": "fnabeo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328052",
            "push_content": "又要把全台扯進來喔 煩不煩",
            "push_ipdatetime": "04/16 16:38",
            "push_tag": "→",
            "push_userid": "cstbb"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328051",
            "push_content": "工三小",
            "push_ipdatetime": "04/16 16:38",
            "push_tag": "噓",
            "push_userid": "ben870818"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328050",
            "push_content": "挺中天吃屎",
            "push_ipdatetime": "04/16 16:38",
            "push_tag": "噓",
            "push_userid": "nforcex"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232804f",
            "push_content": "韓粉和滯台支那人的最愛",
            "push_ipdatetime": "04/16 16:39",
            "push_tag": "噓",
            "push_userid": "singjin"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232804e",
            "push_content": "幹你娘韓國瑜,幹你娘中天",
            "push_ipdatetime": "04/16 16:39",
            "push_tag": "噓",
            "push_userid": "stone011013"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232804d",
            "push_content": "韓天台是要挺什麼？",
            "push_ipdatetime": "04/16 16:40",
            "push_tag": "噓",
            "push_userid": "matt1991"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232804c",
            "push_content": "草包",
            "push_ipdatetime": "04/16 16:40",
            "push_tag": "噓",
            "push_userid": "atlaswhz"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232804b",
            "push_content": "垃圾",
            "push_ipdatetime": "04/16 16:40",
            "push_tag": "噓",
            "push_userid": "GYdecision"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232804a",
            "push_content": "韓天造神台",
            "push_ipdatetime": "04/16 16:41",
            "push_tag": "噓",
            "push_userid": "aska521"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328049",
            "push_content": "全中國XD",
            "push_ipdatetime": "04/16 16:41",
            "push_tag": "推",
            "push_userid": "microtek1990"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328048",
            "push_content": "所以我說這些人怎麼不去死一死啊 LUL",
            "push_ipdatetime": "04/16 16:41",
            "push_tag": "噓",
            "push_userid": "MIOAAZO"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328047",
            "push_content": "馬的智障",
            "push_ipdatetime": "04/16 16:42",
            "push_tag": "噓",
            "push_userid": "WuArthur"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328046",
            "push_content": "垃圾電視台就該關台",
            "push_ipdatetime": "04/16 16:43",
            "push_tag": "噓",
            "push_userid": "kutsu"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328045",
            "push_content": "韓流發威 如日中天",
            "push_ipdatetime": "04/16 16:43",
            "push_tag": "推",
            "push_userid": "tomxyz"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328044",
            "push_content": "垃圾媒體只會造假",
            "push_ipdatetime": "04/16 16:43",
            "push_tag": "噓",
            "push_userid": "hugo11112"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328043",
            "push_content": "我恨不得中天快消失 還後盾咧",
            "push_ipdatetime": "04/16 16:44",
            "push_tag": "噓",
            "push_userid": "salvador1988"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328042",
            "push_content": "幹你媽",
            "push_ipdatetime": "04/16 16:44",
            "push_tag": "噓",
            "push_userid": "akane5499"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328041",
            "push_content": "你儂我儂，uccu",
            "push_ipdatetime": "04/16 16:44",
            "push_tag": "噓",
            "push_userid": "m84524"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328040",
            "push_content": "妳媽在飛",
            "push_ipdatetime": "04/16 16:44",
            "push_tag": "噓",
            "push_userid": "alexgame01"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232803f",
            "push_content": "人一韓 腦就殘",
            "push_ipdatetime": "04/16 16:45",
            "push_tag": "噓",
            "push_userid": "tenoopy"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232803e",
            "push_content": "看到這種新聞就知道罰對了！",
            "push_ipdatetime": "04/16 16:46",
            "push_tag": "噓",
            "push_userid": "fastenone"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232803d",
            "push_content": "幹你娘 韓粉中天賣國賊 認清了沒",
            "push_ipdatetime": "04/16 16:47",
            "push_tag": "噓",
            "push_userid": "KKB"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232803c",
            "push_content": "智障",
            "push_ipdatetime": "04/16 16:47",
            "push_tag": "噓",
            "push_userid": "nobodyman"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232803b",
            "push_content": "理由在哪？就偏頗的電視台啊",
            "push_ipdatetime": "04/16 16:47",
            "push_tag": "噓",
            "push_userid": "mmivmsn"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232803a",
            "push_content": "不要臉到這程度",
            "push_ipdatetime": "04/16 16:48",
            "push_tag": "→",
            "push_userid": "z87739"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328039",
            "push_content": "ait都不邀請中天了，在叫什麼",
            "push_ipdatetime": "04/16 16:49",
            "push_tag": "噓",
            "push_userid": "npn1992"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328038",
            "push_content": "中舔",
            "push_ipdatetime": "04/16 16:50",
            "push_tag": "噓",
            "push_userid": "dreamleo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328037",
            "push_content": "死製杖",
            "push_ipdatetime": "04/16 16:55",
            "push_tag": "噓",
            "push_userid": "toty1101"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328036",
            "push_content": "這就有點扯了。",
            "push_ipdatetime": "04/16 16:58",
            "push_tag": "噓",
            "push_userid": "wopqele"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328035",
            "push_content": "不要臉",
            "push_ipdatetime": "04/16 16:58",
            "push_tag": "噓",
            "push_userid": "DaDaGG"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328034",
            "push_content": "他是不是瘋了",
            "push_ipdatetime": "04/16 17:00",
            "push_tag": "噓",
            "push_userid": "bokaicyc"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328033",
            "push_content": "盾你媽 共產黨新聞趕快滾啦",
            "push_ipdatetime": "04/16 17:01",
            "push_tag": "噓",
            "push_userid": "guoren"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328032",
            "push_content": "放屁",
            "push_ipdatetime": "04/16 17:02",
            "push_tag": "噓",
            "push_userid": "sunny0107"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328031",
            "push_content": "白痴狗報",
            "push_ipdatetime": "04/16 17:02",
            "push_tag": "噓",
            "push_userid": "LordOfCS"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328030",
            "push_content": "垃圾啦",
            "push_ipdatetime": "04/16 17:02",
            "push_tag": "推",
            "push_userid": "stockings"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232802f",
            "push_content": "按錯噓回來",
            "push_ipdatetime": "04/16 17:03",
            "push_tag": "→",
            "push_userid": "stockings"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232802e",
            "push_content": "垃圾",
            "push_ipdatetime": "04/16 17:03",
            "push_tag": "→",
            "push_userid": "stockings"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232802d",
            "push_content": "可悲",
            "push_ipdatetime": "04/16 17:03",
            "push_tag": "噓",
            "push_userid": "effk"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232802c",
            "push_content": "人一藍 就腦殘",
            "push_ipdatetime": "04/16 17:03",
            "push_tag": "噓",
            "push_userid": "chinick1478"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232802b",
            "push_content": "繼續舔阿",
            "push_ipdatetime": "04/16 17:03",
            "push_tag": "噓",
            "push_userid": "talrusha"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232802a",
            "push_content": "投他的粉絲 哈哈哈呵呵呵呵",
            "push_ipdatetime": "04/16 17:04",
            "push_tag": "噓",
            "push_userid": "bor27907232"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328029",
            "push_content": "智障",
            "push_ipdatetime": "04/16 17:05",
            "push_tag": "→",
            "push_userid": "match123"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328028",
            "push_content": "到底?",
            "push_ipdatetime": "04/16 17:05",
            "push_tag": "噓",
            "push_userid": "aroundAutumn"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328027",
            "push_content": "黃復興弱智",
            "push_ipdatetime": "04/16 17:05",
            "push_tag": "噓",
            "push_userid": "goonholyup"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328026",
            "push_content": "可見韓導對新聞專業、言論自由的觀點，和中夭一樣低級",
            "push_ipdatetime": "04/16 17:06",
            "push_tag": "噓",
            "push_userid": "ARUSHI"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328025",
            "push_content": "是霸氣還87",
            "push_ipdatetime": "04/16 17:07",
            "push_tag": "噓",
            "push_userid": "dog990999"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328024",
            "push_content": "前鬼後鬼還我原型",
            "push_ipdatetime": "04/16 17:07",
            "push_tag": "噓",
            "push_userid": "elecAEM"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328023",
            "push_content": "這真的太扯！！",
            "push_ipdatetime": "04/16 17:10",
            "push_tag": "噓",
            "push_userid": "deepsoul"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328022",
            "push_content": "挺自家人很正常啊",
            "push_ipdatetime": "04/16 17:11",
            "push_tag": "噓",
            "push_userid": "DNSKHY"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328021",
            "push_content": "煽動群眾？",
            "push_ipdatetime": "04/16 17:13",
            "push_tag": "噓",
            "push_userid": "s5517821"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328020",
            "push_content": "被造神的既得利益者，不意外",
            "push_ipdatetime": "04/16 17:14",
            "push_tag": "噓",
            "push_userid": "a51078986"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232801f",
            "push_content": "共三小啊韓垃圾",
            "push_ipdatetime": "04/16 17:17",
            "push_tag": "→",
            "push_userid": "wendy85625"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232801e",
            "push_content": "智商堪憂",
            "push_ipdatetime": "04/16 17:17",
            "push_tag": "噓",
            "push_userid": "sin88bb"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232801d",
            "push_content": "背你妹",
            "push_ipdatetime": "04/16 17:19",
            "push_tag": "噓",
            "push_userid": "s125030"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232801c",
            "push_content": "好笑了   他是高雄人選的市長  怎麼是幫支那人服務呢",
            "push_ipdatetime": "04/16 17:20",
            "push_tag": "噓",
            "push_userid": "a904472000"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232801b",
            "push_content": "白癡",
            "push_ipdatetime": "04/16 17:20",
            "push_tag": "噓",
            "push_userid": "catbaby612"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232801a",
            "push_content": "有中國就夠了",
            "push_ipdatetime": "04/16 17:21",
            "push_tag": "噓",
            "push_userid": "zeroshin"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328019",
            "push_content": "還會相信韓導垃圾話的人可以自我了斷了 下夕下景",
            "push_ipdatetime": "04/16 17:22",
            "push_tag": "噓",
            "push_userid": "oxiz"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328018",
            "push_content": "笑死人，光這點就該噓爆你，噁心傢伙",
            "push_ipdatetime": "04/16 17:23",
            "push_tag": "噓",
            "push_userid": "iamtan"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328017",
            "push_content": "fxck",
            "push_ipdatetime": "04/16 17:23",
            "push_tag": "噓",
            "push_userid": "kuliao"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328016",
            "push_content": "吃屎吧草包",
            "push_ipdatetime": "04/16 17:23",
            "push_tag": "噓",
            "push_userid": "uuuu120"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328015",
            "push_content": "韓:全部的媒體都應該對我造神~~",
            "push_ipdatetime": "04/16 17:24",
            "push_tag": "→",
            "push_userid": "otld"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328014",
            "push_content": "語畢 哄堂大笑",
            "push_ipdatetime": "04/16 17:24",
            "push_tag": "推",
            "push_userid": "l1l"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328013",
            "push_content": "這麼噁心人的嗎 嘔嘔嘔嘔",
            "push_ipdatetime": "04/16 17:25",
            "push_tag": "噓",
            "push_userid": "cvb58129"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328012",
            "push_content": "",
            "push_ipdatetime": "04/16 17:26",
            "push_tag": "噓",
            "push_userid": "yoher"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328011",
            "push_content": "噗",
            "push_ipdatetime": "04/16 17:27",
            "push_tag": "噓",
            "push_userid": "iceman198410"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328010",
            "push_content": "草包",
            "push_ipdatetime": "04/16 17:28",
            "push_tag": "→",
            "push_userid": "bierut"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232800f",
            "push_content": "嘔嘔嘔嘔嘔嘔嘔",
            "push_ipdatetime": "04/16 17:28",
            "push_tag": "噓",
            "push_userid": "eeveelugia2"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232800e",
            "push_content": "哈哈哈哈哈哈哈",
            "push_ipdatetime": "04/16 17:29",
            "push_tag": "噓",
            "push_userid": "CelebiDee"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232800d",
            "push_content": "事實啊",
            "push_ipdatetime": "04/16 17:30",
            "push_tag": "推",
            "push_userid": "iphyf"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232800c",
            "push_content": "惦惦給人家當神捧就好，硬要出來給人嘴欸",
            "push_ipdatetime": "04/16 17:30",
            "push_tag": "噓",
            "push_userid": "bigicedMT"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232800b",
            "push_content": "才不想當中天的後盾勒！",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "噓",
            "push_userid": "drmactt"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232800a",
            "push_content": "zzzz這招是要用多久",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "噓",
            "push_userid": "denny5408"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328009",
            "push_content": "哈哈哈造神台是你專屬 這麼厚臉皮要全國挺草包 當人民",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "噓",
            "push_userid": "clamor88"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328008",
            "push_content": "傻的",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "→",
            "push_userid": "clamor88"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328007",
            "push_content": "全國都要幫你習下韓上啊",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "噓",
            "push_userid": "pimba17"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328006",
            "push_content": "呵呵呵",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "→",
            "push_userid": "jack0216"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328005",
            "push_content": "噁心到爆幹你娘",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "→",
            "push_userid": "jack0216"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328004",
            "push_content": "智障瑜下台好嗎",
            "push_ipdatetime": "04/16 17:35",
            "push_tag": "噓",
            "push_userid": "zzziyyyi"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328003",
            "push_content": "http://polonews.tw/2018/12/12/cti/  這種言論自由",
            "push_ipdatetime": "04/16 17:36",
            "push_tag": "推",
            "push_userid": "wtosister"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328002",
            "push_content": "XDDDDD",
            "push_ipdatetime": "04/16 17:36",
            "push_tag": "噓",
            "push_userid": "jjomj666"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328001",
            "push_content": "林老木的後盾",
            "push_ipdatetime": "04/16 17:40",
            "push_tag": "噓",
            "push_userid": "sai0613"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2328000",
            "push_content": "",
            "push_ipdatetime": "04/16 17:47",
            "push_tag": "噓",
            "push_userid": "LiaoKen02"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fff",
            "push_content": "為什麼不做公視後盾 很明顯了他們有利益關係",
            "push_ipdatetime": "04/16 17:47",
            "push_tag": "噓",
            "push_userid": "dsa66253"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327ffe",
            "push_content": "中國人嘴臉",
            "push_ipdatetime": "04/16 17:48",
            "push_tag": "噓",
            "push_userid": "artdeco1"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327ffd",
            "push_content": "好 算我一個",
            "push_ipdatetime": "04/16 17:49",
            "push_tag": "噓",
            "push_userid": "GFLR20"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327ffc",
            "push_content": "真愛開玩笑呢",
            "push_ipdatetime": "04/16 17:51",
            "push_tag": "→",
            "push_userid": "surreallin"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327ffb",
            "push_content": "噁心爛咖",
            "push_ipdatetime": "04/16 17:53",
            "push_tag": "噓",
            "push_userid": "yaieki"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327ffa",
            "push_content": "選這個人出來是對台灣民主最大的嘲笑",
            "push_ipdatetime": "04/16 17:53",
            "push_tag": "噓",
            "push_userid": "ceoho"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327ff9",
            "push_content": "沒中夭捧上天就只是個廢物",
            "push_ipdatetime": "04/16 17:56",
            "push_tag": "噓",
            "push_userid": "r123456988"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327ff8",
            "push_content": "死禿頭我操你媽",
            "push_ipdatetime": "04/16 17:56",
            "push_tag": "噓",
            "push_userid": "Chiachi"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327ff7",
            "push_content": "白痴",
            "push_ipdatetime": "04/16 17:56",
            "push_tag": "噓",
            "push_userid": "jason0829"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327ff6",
            "push_content": "憑什麼",
            "push_ipdatetime": "04/16 17:58",
            "push_tag": "噓",
            "push_userid": "id41030"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327ff5",
            "push_content": "低能垃圾到底鬧夠沒",
            "push_ipdatetime": "04/16 18:02",
            "push_tag": "噓",
            "push_userid": "f30607"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327ff4",
            "push_content": "噁心 嘔嘔嘔嘔嘔嘔嘔",
            "push_ipdatetime": "04/16 18:02",
            "push_tag": "噓",
            "push_userid": "s410027067"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327ff3",
            "push_content": "廢物",
            "push_ipdatetime": "04/16 18:02",
            "push_tag": "噓",
            "push_userid": "allen18880"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327ff2",
            "push_content": "嘔嘔嘔嘔嘔",
            "push_ipdatetime": "04/16 18:06",
            "push_tag": "噓",
            "push_userid": "a8662875"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327ff1",
            "push_content": "嘔嘔嘔嘔嘔",
            "push_ipdatetime": "04/16 18:07",
            "push_tag": "噓",
            "push_userid": "noseng"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327ff0",
            "push_content": "噁心",
            "push_ipdatetime": "04/16 18:10",
            "push_tag": "噓",
            "push_userid": "leobox"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fef",
            "push_content": "垃圾電視台+垃圾市長",
            "push_ipdatetime": "04/16 18:10",
            "push_tag": "推",
            "push_userid": "a1119151"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fee",
            "push_content": "全國都應該做NCC的後盾",
            "push_ipdatetime": "04/16 18:12",
            "push_tag": "噓",
            "push_userid": "wowrunrun"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fed",
            "push_content": "後你去死啦",
            "push_ipdatetime": "04/16 18:12",
            "push_tag": "噓",
            "push_userid": "joyceifan"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fec",
            "push_content": "噁心",
            "push_ipdatetime": "04/16 18:12",
            "push_tag": "噓",
            "push_userid": "ab761004"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327feb",
            "push_content": "下賤",
            "push_ipdatetime": "04/16 18:14",
            "push_tag": "→",
            "push_userid": "StarStar"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fea",
            "push_content": "……",
            "push_ipdatetime": "04/16 18:16",
            "push_tag": "噓",
            "push_userid": "NoNwYo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fe9",
            "push_content": "白癡",
            "push_ipdatetime": "04/16 18:16",
            "push_tag": "→",
            "push_userid": "sh0032385"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fe8",
            "push_content": "三小",
            "push_ipdatetime": "04/16 18:16",
            "push_tag": "噓",
            "push_userid": "camebson"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fe7",
            "push_content": "智障才做中天三立中時自由後盾zzzzz",
            "push_ipdatetime": "04/16 18:18",
            "push_tag": "噓",
            "push_userid": "h965715"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fe6",
            "push_content": "智商到底要多低才會支持這種咖小",
            "push_ipdatetime": "04/16 18:19",
            "push_tag": "→",
            "push_userid": "duoCindy"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fe5",
            "push_content": "好噁",
            "push_ipdatetime": "04/16 18:21",
            "push_tag": "噓",
            "push_userid": "xxx63261"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fe4",
            "push_content": "。",
            "push_ipdatetime": "04/16 18:21",
            "push_tag": "噓",
            "push_userid": "mayday10334"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fe3",
            "push_content": "呵呵呵呵",
            "push_ipdatetime": "04/16 18:23",
            "push_tag": "噓",
            "push_userid": "yangyang33"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fe2",
            "push_content": "含粉含起來",
            "push_ipdatetime": "04/16 18:24",
            "push_tag": "噓",
            "push_userid": "jerrycat0118"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fe1",
            "push_content": "笑了",
            "push_ipdatetime": "04/16 18:24",
            "push_tag": "噓",
            "push_userid": "abcd1111"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fe0",
            "push_content": "不同意，要斗內自個去",
            "push_ipdatetime": "04/16 18:28",
            "push_tag": "噓",
            "push_userid": "staffordan"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fdf",
            "push_content": "露出真面目",
            "push_ipdatetime": "04/16 18:34",
            "push_tag": "噓",
            "push_userid": "yubirch"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fde",
            "push_content": "要做自己做",
            "push_ipdatetime": "04/16 18:37",
            "push_tag": "→",
            "push_userid": "Campanella"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fdd",
            "push_content": "直銷口號作秀握手",
            "push_ipdatetime": "04/16 18:38",
            "push_tag": "噓",
            "push_userid": "wwman"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fdc",
            "push_content": "他想搞文革？",
            "push_ipdatetime": "04/16 18:39",
            "push_tag": "噓",
            "push_userid": "EratoPulim"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fdb",
            "push_content": "妖魔電視台",
            "push_ipdatetime": "04/16 18:39",
            "push_tag": "噓",
            "push_userid": "Beckhung"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fda",
            "push_content": "垃圾台",
            "push_ipdatetime": "04/16 18:43",
            "push_tag": "噓",
            "push_userid": "sr57664"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fd9",
            "push_content": "可憐 到底是誰拱他出來的",
            "push_ipdatetime": "04/16 18:45",
            "push_tag": "噓",
            "push_userid": "ironnash"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fd8",
            "push_content": "共匪支持共匪不意外",
            "push_ipdatetime": "04/16 18:46",
            "push_tag": "噓",
            "push_userid": "a02010"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fd7",
            "push_content": "垃圾",
            "push_ipdatetime": "04/16 18:46",
            "push_tag": "噓",
            "push_userid": "chunyi830222"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fd6",
            "push_content": "原來是知恩圖報的導演阿",
            "push_ipdatetime": "04/16 18:49",
            "push_tag": "噓",
            "push_userid": "JameerNe1son"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fd5",
            "push_content": "中資zzz",
            "push_ipdatetime": "04/16 18:53",
            "push_tag": "噓",
            "push_userid": "shaochilee"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fd4",
            "push_content": "垃圾宗教台",
            "push_ipdatetime": "04/16 18:55",
            "push_tag": "噓",
            "push_userid": "alunt00193"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fd3",
            "push_content": "垃圾白賊瑜挺造假白賊台",
            "push_ipdatetime": "04/16 18:57",
            "push_tag": "噓",
            "push_userid": "keigo0508"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fd2",
            "push_content": "最噁心的造神造假台",
            "push_ipdatetime": "04/16 18:59",
            "push_tag": "噓",
            "push_userid": "juicylove"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fd1",
            "push_content": "噁心",
            "push_ipdatetime": "04/16 18:59",
            "push_tag": "噓",
            "push_userid": "ppikachoutw"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fd0",
            "push_content": "馬的是不是腦袋壞了？",
            "push_ipdatetime": "04/16 19:07",
            "push_tag": "噓",
            "push_userid": "Craks"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fcf",
            "push_content": "免了，我向來不看宗教臺",
            "push_ipdatetime": "04/16 19:15",
            "push_tag": "推",
            "push_userid": "srxteam0935"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fce",
            "push_content": "專屬個人電視台、被罰當然要出面力挺！噁心",
            "push_ipdatetime": "04/16 19:16",
            "push_tag": "噓",
            "push_userid": "Lancelord"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fcd",
            "push_content": "....",
            "push_ipdatetime": "04/16 19:22",
            "push_tag": "噓",
            "push_userid": "andy188"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fcc",
            "push_content": "滾啦，這種宣傳策略只能騙韓粉吧",
            "push_ipdatetime": "04/16 19:24",
            "push_tag": "噓",
            "push_userid": "hui51032611"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fcb",
            "push_content": "噁...",
            "push_ipdatetime": "04/16 19:26",
            "push_tag": "噓",
            "push_userid": "yyhbala"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fca",
            "push_content": "讚 韓才是救世主",
            "push_ipdatetime": "04/16 19:26",
            "push_tag": "→",
            "push_userid": "aegiss"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fc9",
            "push_content": "傻眼",
            "push_ipdatetime": "04/16 19:30",
            "push_tag": "噓",
            "push_userid": "ArthurPeng"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fc8",
            "push_content": "假話講久了就變真的",
            "push_ipdatetime": "04/16 19:30",
            "push_tag": "噓",
            "push_userid": "kikukowa"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fc7",
            "push_content": "https://i.imgur.com/s9NbGW8.jpg",
            "push_ipdatetime": "04/16 19:31",
            "push_tag": "→",
            "push_userid": "labview"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fc6",
            "push_content": "噁",
            "push_ipdatetime": "04/16 19:33",
            "push_tag": "噓",
            "push_userid": "ambercky"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fc5",
            "push_content": "更可悲的是這種人居然是民調第一的總統候選人",
            "push_ipdatetime": "04/16 19:33",
            "push_tag": "噓",
            "push_userid": "yuhuilu"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fc4",
            "push_content": "ㄏㄏ",
            "push_ipdatetime": "04/16 19:35",
            "push_tag": "噓",
            "push_userid": "et6612"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fc3",
            "push_content": "韓天電視台我早就拒看了",
            "push_ipdatetime": "04/16 19:37",
            "push_tag": "噓",
            "push_userid": "gamble777"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fc2",
            "push_content": "中時電子報 王子瑄 記得哦",
            "push_ipdatetime": "04/16 19:38",
            "push_tag": "噓",
            "push_userid": "ssivart"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fc1",
            "push_content": "寧可吃屎",
            "push_ipdatetime": "04/16 19:44",
            "push_tag": "噓",
            "push_userid": "danny80060"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fc0",
            "push_content": "只有支那賤畜才會捧支那電視台",
            "push_ipdatetime": "04/16 19:48",
            "push_tag": "→",
            "push_userid": "deleteme"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fbf",
            "push_content": "公部門都挺國民黨不是",
            "push_ipdatetime": "04/16 19:54",
            "push_tag": "噓",
            "push_userid": "bw223731"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fbe",
            "push_content": "哪國？",
            "push_ipdatetime": "04/16 19:55",
            "push_tag": "噓",
            "push_userid": "glendawl"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fbd",
            "push_content": "電視台長生氣啦",
            "push_ipdatetime": "04/16 19:57",
            "push_tag": "推",
            "push_userid": "t755079ttt"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fbc",
            "push_content": "一丘之貉",
            "push_ipdatetime": "04/16 20:01",
            "push_tag": "噓",
            "push_userid": "gegula1128"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fbb",
            "push_content": "中屎",
            "push_ipdatetime": "04/16 20:03",
            "push_tag": "噓",
            "push_userid": "RiverMan1"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fba",
            "push_content": "守住中天 台灣的言論自由就安全了",
            "push_ipdatetime": "04/16 20:03",
            "push_tag": "噓",
            "push_userid": "james0318tw"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fb9",
            "push_content": "== 真當大家都傻了",
            "push_ipdatetime": "04/16 20:06",
            "push_tag": "推",
            "push_userid": "yoyi061"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fb8",
            "push_content": "台主生氣了",
            "push_ipdatetime": "04/16 20:18",
            "push_tag": "噓",
            "push_userid": "sagxian"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fb7",
            "push_content": "垃圾挺垃圾",
            "push_ipdatetime": "04/16 20:20",
            "push_tag": "→",
            "push_userid": "weitai1993"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fb6",
            "push_content": "真的！一天不看身體都會不舒服......",
            "push_ipdatetime": "04/16 20:21",
            "push_tag": "噓",
            "push_userid": "puszta"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fb5",
            "push_content": "幹，實在是噁心到爆",
            "push_ipdatetime": "04/16 20:26",
            "push_tag": "噓",
            "push_userid": "sintryhao"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fb4",
            "push_content": "睡導一開口就講幹話",
            "push_ipdatetime": "04/16 20:28",
            "push_tag": "噓",
            "push_userid": "King0615"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fb3",
            "push_content": "中天，中時都該倒一倒了......",
            "push_ipdatetime": "04/16 20:31",
            "push_tag": "噓",
            "push_userid": "SkyReaching"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fb2",
            "push_content": "有夠噁",
            "push_ipdatetime": "04/16 20:32",
            "push_tag": "噓",
            "push_userid": "RUSSIAN22"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fb1",
            "push_content": "垃圾噁心電視台 果然是沆瀣一氣",
            "push_ipdatetime": "04/16 20:42",
            "push_tag": "噓",
            "push_userid": "funky1987"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fb0",
            "push_content": "下地獄吧",
            "push_ipdatetime": "04/16 20:52",
            "push_tag": "噓",
            "push_userid": "navychu"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327faf",
            "push_content": "妖魔鬼怪  原形畢露  高雄人真的活該被人瞧不起",
            "push_ipdatetime": "04/16 20:53",
            "push_tag": "噓",
            "push_userid": "whitezealman"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fae",
            "push_content": "這真的是最沒營養的電視台",
            "push_ipdatetime": "04/16 20:54",
            "push_tag": "噓",
            "push_userid": "A81295"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fad",
            "push_content": "噁心極致",
            "push_ipdatetime": "04/16 21:00",
            "push_tag": "噓",
            "push_userid": "pia616"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fac",
            "push_content": "根本綜藝台",
            "push_ipdatetime": "04/16 21:04",
            "push_tag": "噓",
            "push_userid": "axced"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fab",
            "push_content": "北七",
            "push_ipdatetime": "04/16 21:14",
            "push_tag": "噓",
            "push_userid": "sam54824"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327faa",
            "push_content": "拿翹了，噁心",
            "push_ipdatetime": "04/16 21:21",
            "push_tag": "推",
            "push_userid": "souldrinking"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fa9",
            "push_content": "補噓",
            "push_ipdatetime": "04/16 21:21",
            "push_tag": "→",
            "push_userid": "souldrinking"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fa8",
            "push_content": "白癡 中夭電視台根本應該關台",
            "push_ipdatetime": "04/16 21:24",
            "push_tag": "噓",
            "push_userid": "sl300"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fa7",
            "push_content": "要吐了",
            "push_ipdatetime": "04/16 21:35",
            "push_tag": "噓",
            "push_userid": "govsswc"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fa6",
            "push_content": "甲賽",
            "push_ipdatetime": "04/16 21:39",
            "push_tag": "噓",
            "push_userid": "qaz79"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fa5",
            "push_content": "你自己弄間電台吧，乾，回去辦公",
            "push_ipdatetime": "04/16 21:44",
            "push_tag": "噓",
            "push_userid": "wulanlan"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fa4",
            "push_content": "拜託你 別回台灣了",
            "push_ipdatetime": "04/16 21:45",
            "push_tag": "→",
            "push_userid": "tetsu0401"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fa3",
            "push_content": "中夭要是做假新聞說你韓壞話，我看你會不會挺?",
            "push_ipdatetime": "04/16 21:54",
            "push_tag": "噓",
            "push_userid": "weichen5566"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fa2",
            "push_content": "這腦殘真他媽沒救",
            "push_ipdatetime": "04/16 21:56",
            "push_tag": "噓",
            "push_userid": "starguardian"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fa1",
            "push_content": "低能韓導",
            "push_ipdatetime": "04/16 21:56",
            "push_tag": "噓",
            "push_userid": "spt21ccc"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327fa0",
            "push_content": "不噓不行",
            "push_ipdatetime": "04/16 21:58",
            "push_tag": "噓",
            "push_userid": "bigg75cent"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f9f",
            "push_content": "就你的個人歌唱台牙",
            "push_ipdatetime": "04/16 22:04",
            "push_tag": "噓",
            "push_userid": "cclok922"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f9e",
            "push_content": "我真的看不下中天 也聽不下去韓的言論",
            "push_ipdatetime": "04/16 22:18",
            "push_tag": "噓",
            "push_userid": "steven7810"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f9d",
            "push_content": "低能",
            "push_ipdatetime": "04/16 22:20",
            "push_tag": "噓",
            "push_userid": "parislove3"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f9c",
            "push_content": "很好笑 你支那思維嗎？ 這裡台灣",
            "push_ipdatetime": "04/16 22:27",
            "push_tag": "噓",
            "push_userid": "jasmineapple"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f9b",
            "push_content": "什麼鬼？",
            "push_ipdatetime": "04/16 22:27",
            "push_tag": "噓",
            "push_userid": "tobeblack"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f9a",
            "push_content": "希望中天倒ㄧ倒",
            "push_ipdatetime": "04/16 22:35",
            "push_tag": "噓",
            "push_userid": "tatasui"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f99",
            "push_content": "ㄏㄏ",
            "push_ipdatetime": "04/16 22:39",
            "push_tag": "噓",
            "push_userid": "jennyengine"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f98",
            "push_content": "噁心的光頭",
            "push_ipdatetime": "04/16 22:41",
            "push_tag": "噓",
            "push_userid": "spursdog21"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f97",
            "push_content": "低能",
            "push_ipdatetime": "04/16 22:47",
            "push_tag": "噓",
            "push_userid": "ever1122"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f96",
            "push_content": "垃圾統派黨kmt黨員跟支持者全都是垃圾",
            "push_ipdatetime": "04/16 22:52",
            "push_tag": "噓",
            "push_userid": "wawolo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f95",
            "push_content": "噁心至極",
            "push_ipdatetime": "04/16 22:55",
            "push_tag": "噓",
            "push_userid": "sonico"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f94",
            "push_content": "閉嘴",
            "push_ipdatetime": "04/16 23:02",
            "push_tag": "噓",
            "push_userid": "iongjenq"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f93",
            "push_content": "智障",
            "push_ipdatetime": "04/16 23:05",
            "push_tag": "噓",
            "push_userid": "privatelife"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f92",
            "push_content": "媽  我在這~~~",
            "push_ipdatetime": "04/16 23:07",
            "push_tag": "噓",
            "push_userid": "littlepp205"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f91",
            "push_content": "滾 口號韓韓口號",
            "push_ipdatetime": "04/16 23:07",
            "push_tag": "噓",
            "push_userid": "kobedisel"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f90",
            "push_content": "你這個邪魔歪道 搞不出政績改攻擊政府轉移目標",
            "push_ipdatetime": "04/16 23:21",
            "push_tag": "噓",
            "push_userid": "fybluemoon"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f8f",
            "push_content": "噁",
            "push_ipdatetime": "04/16 23:23",
            "push_tag": "推",
            "push_userid": "webberhan"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f8e",
            "push_content": "推",
            "push_ipdatetime": "04/16 23:28",
            "push_tag": "噓",
            "push_userid": "O080"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f8d",
            "push_content": "幹零娘咧看那個破幹電視台報你他媽一堆沒營養的新聞 後",
            "push_ipdatetime": "04/16 23:31",
            "push_tag": "噓",
            "push_userid": "yeedalee"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f8c",
            "push_content": "盾你媽，幹",
            "push_ipdatetime": "04/16 23:31",
            "push_tag": "→",
            "push_userid": "yeedalee"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f8b",
            "push_content": "媽的！中天跟他女兒一樣噁爛",
            "push_ipdatetime": "04/16 23:35",
            "push_tag": "→",
            "push_userid": "linlos"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f8a",
            "push_content": "蒼蠅當然會說大便好吃",
            "push_ipdatetime": "04/16 23:41",
            "push_tag": "噓",
            "push_userid": "skylerlo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f89",
            "push_content": "哈哈哈哈哈",
            "push_ipdatetime": "04/16 23:43",
            "push_tag": "噓",
            "push_userid": "ScoTB"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f88",
            "push_content": "滾",
            "push_ipdatetime": "04/16 23:48",
            "push_tag": "噓",
            "push_userid": "Lambo38"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f87",
            "push_content": "噁心",
            "push_ipdatetime": "04/16 23:51",
            "push_tag": "噓",
            "push_userid": "selly50311"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f86",
            "push_content": "你為什麼不來含我老二",
            "push_ipdatetime": "04/16 23:55",
            "push_tag": "噓",
            "push_userid": "hope0963"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f85",
            "push_content": "扶植草包的電視台",
            "push_ipdatetime": "04/16 23:59",
            "push_tag": "→",
            "push_userid": "ahahatwbill"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f84",
            "push_content": "是非不分，領導能力堪憂",
            "push_ipdatetime": "04/17 00:01",
            "push_tag": "噓",
            "push_userid": "dogncat"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f83",
            "push_content": "媒體應該為中共服務。",
            "push_ipdatetime": "04/17 00:13",
            "push_tag": "→",
            "push_userid": "zingy"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f82",
            "push_content": "吃屎吧",
            "push_ipdatetime": "04/17 00:21",
            "push_tag": "噓",
            "push_userid": "puppylove99"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f81",
            "push_content": "傻眼",
            "push_ipdatetime": "04/17 00:31",
            "push_tag": "噓",
            "push_userid": "samino"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f80",
            "push_content": "不演了",
            "push_ipdatetime": "04/17 00:39",
            "push_tag": "噓",
            "push_userid": "bw3dsy426"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f7f",
            "push_content": "說啥",
            "push_ipdatetime": "04/17 00:48",
            "push_tag": "噓",
            "push_userid": "hbfu"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f7e",
            "push_content": "做夢啦",
            "push_ipdatetime": "04/17 00:49",
            "push_tag": "噓",
            "push_userid": "gospursgo21"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f7d",
            "push_content": "....",
            "push_ipdatetime": "04/17 01:04",
            "push_tag": "噓",
            "push_userid": "Holte"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f7c",
            "push_content": "到底要讓高雄人蒙羞多久啊  喜韓兒",
            "push_ipdatetime": "04/17 01:40",
            "push_tag": "噓",
            "push_userid": "linwayway"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f7b",
            "push_content": "中天是什麼？",
            "push_ipdatetime": "04/17 01:45",
            "push_tag": "→",
            "push_userid": "sonny0927"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f7a",
            "push_content": "笑死人",
            "push_ipdatetime": "04/17 02:00",
            "push_tag": "噓",
            "push_userid": "monkeysin"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f79",
            "push_content": "人渣",
            "push_ipdatetime": "04/17 02:21",
            "push_tag": "噓",
            "push_userid": "tk08280227"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f78",
            "push_content": "沒有了中天 你是勿阿魚",
            "push_ipdatetime": "04/17 02:58",
            "push_tag": "→",
            "push_userid": "RoxanneC"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f77",
            "push_content": "笑死人了哈哈哈哈哈哈哈",
            "push_ipdatetime": "04/17 04:23",
            "push_tag": "噓",
            "push_userid": "abccat0520"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f76",
            "push_content": "D能到不行",
            "push_ipdatetime": "04/17 04:24",
            "push_tag": "→",
            "push_userid": "abccat0520"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f75",
            "push_content": "他當然要護航啦 自己的宗教台耶哈哈哈",
            "push_ipdatetime": "04/17 04:37",
            "push_tag": "噓",
            "push_userid": "aaron68032"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f74",
            "push_content": "當你誰？",
            "push_ipdatetime": "04/17 04:55",
            "push_tag": "噓",
            "push_userid": "gbs182"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f73",
            "push_content": "NCC裡面都還是馬提名的吧 罵自己人??",
            "push_ipdatetime": "04/17 05:08",
            "push_tag": "→",
            "push_userid": "kohinata"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f72",
            "push_content": "這麼不要臉的話也說得出口...不愧是高雄人的愛",
            "push_ipdatetime": "04/17 05:30",
            "push_tag": "噓",
            "push_userid": "emohann"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f71",
            "push_content": "噁心",
            "push_ipdatetime": "04/17 07:40",
            "push_tag": "噓",
            "push_userid": "a884874"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f70",
            "push_content": "無恥",
            "push_ipdatetime": "04/17 08:08",
            "push_tag": "推",
            "push_userid": "mikearice"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f6f",
            "push_content": "他的意思是說：「公務員啊，命令執不執行，看你信仰喔！",
            "push_ipdatetime": "04/17 09:42",
            "push_tag": "噓",
            "push_userid": "winpig07"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f6e",
            "push_content": "拖拉帶過OK的」",
            "push_ipdatetime": "04/17 09:43",
            "push_tag": "→",
            "push_userid": "winpig07"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f6d",
            "push_content": "去死吧....",
            "push_ipdatetime": "04/17 10:15",
            "push_tag": "噓",
            "push_userid": "mmnnm"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f6c",
            "push_content": "無時無刻都是你的新聞真的很噁心",
            "push_ipdatetime": "04/17 10:50",
            "push_tag": "噓",
            "push_userid": "peanut7516"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f6b",
            "push_content": "後你媽機八",
            "push_ipdatetime": "04/17 11:12",
            "push_tag": "噓",
            "push_userid": "ly1752"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f6a",
            "push_content": "xDD",
            "push_ipdatetime": "04/17 11:59",
            "push_tag": "噓",
            "push_userid": "pillowkiller"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f69",
            "push_content": "垃圾",
            "push_ipdatetime": "04/17 13:16",
            "push_tag": "噓",
            "push_userid": "silentgiant"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f68",
            "push_content": "受不了",
            "push_ipdatetime": "04/17 19:46",
            "push_tag": "噓",
            "push_userid": "william0814"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f67",
            "push_content": "垃圾霉體配垃圾",
            "push_ipdatetime": "04/17 20:05",
            "push_tag": "噓",
            "push_userid": "mizuirosyo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f66",
            "push_content": "我笑了",
            "push_ipdatetime": "04/17 23:17",
            "push_tag": "噓",
            "push_userid": "jovina"
          },
          {
            "_id": "5ce0cfe26e8ee31ef2327f65",
            "push_content": "垃圾台",
            "push_ipdatetime": "04/18 12:42",
            "push_tag": "→",
            "push_userid": "cool911234"
          }
        ],
        "url": "https://www.ptt.cc/bbs/Gossiping/M.1555395713.A.27A.html",
        "__v": 0
      },
      {
        "_id": "5ce0cfe2d8cfd19b0acb345a",
        "article_id": "M.1555402968.A.AFE",
        "article_title": "[爆卦] 用韓導韓國瑜當招牌的攤販竟然換招牌啦?!",
        "author": "hahacha (快樂跳恰恰)",
        "board": "Gossiping",
        "content": " ",
        "date": "2019-04-16T08:22:46.000Z",
        "ip": "114.137.105.203",
        "message_count": {
          "_id": "5ce0cfe26e8ee31ef232a8c4",
          "all": 620,
          "boo": 59,
          "count": 379,
          "neutral": 123,
          "push": 438
        },
        "messages": [
          {
            "_id": "5ce0cfe26e8ee31ef232ab30",
            "push_content": "",
            "push_ipdatetime": "04/16 16:23",
            "push_tag": "噓",
            "push_userid": "jienr"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab2f",
            "push_content": "韓粉很急",
            "push_ipdatetime": "04/16 16:23",
            "push_tag": "推",
            "push_userid": "a35715987"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab2e",
            "push_content": "哪部",
            "push_ipdatetime": "04/16 16:23",
            "push_tag": "噓",
            "push_userid": "noodlesnice"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab2d",
            "push_content": "低端人口 吃屎吧",
            "push_ipdatetime": "04/16 16:23",
            "push_tag": "噓",
            "push_userid": "s820912gmail"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab2c",
            "push_content": "發大財",
            "push_ipdatetime": "04/16 16:23",
            "push_tag": "推",
            "push_userid": "thegreatlcx"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab2b",
            "push_content": "初選要跪了還有空打韓喔",
            "push_ipdatetime": "04/16 16:23",
            "push_tag": "噓",
            "push_userid": "kusowan"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab2a",
            "push_content": "樓下韓粉",
            "push_ipdatetime": "04/16 16:23",
            "push_tag": "→",
            "push_userid": "dvleo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab29",
            "push_content": "跟著郭董走蔥油餅",
            "push_ipdatetime": "04/16 16:24",
            "push_tag": "推",
            "push_userid": "pp9960"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab28",
            "push_content": "高調啦",
            "push_ipdatetime": "04/16 16:24",
            "push_tag": "推",
            "push_userid": "asile"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab27",
            "push_content": "switch 馬力歐的海報？",
            "push_ipdatetime": "04/16 16:24",
            "push_tag": "推",
            "push_userid": "a1122334424"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab26",
            "push_content": "合理懷疑含粉都發大財了不吃路邊攤才這樣",
            "push_ipdatetime": "04/16 16:24",
            "push_tag": "推",
            "push_userid": "lemon7242"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab25",
            "push_content": "推",
            "push_ipdatetime": "04/16 16:24",
            "push_tag": "推",
            "push_userid": "joy2001billy"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab24",
            "push_content": "瑪莉歐？可以用嗎？",
            "push_ipdatetime": "04/16 16:25",
            "push_tag": "推",
            "push_userid": "yannicklatte"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab23",
            "push_content": "造神結束",
            "push_ipdatetime": "04/16 16:25",
            "push_tag": "推",
            "push_userid": "PAULJOE"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab22",
            "push_content": "五毛好急阿~氣撲撲來噓ㄟ",
            "push_ipdatetime": "04/16 16:25",
            "push_tag": "推",
            "push_userid": "asile"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab21",
            "push_content": "都發財了當然退休收攤",
            "push_ipdatetime": "04/16 16:25",
            "push_tag": "→",
            "push_userid": "bigcho"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab20",
            "push_content": "推 有黑絲",
            "push_ipdatetime": "04/16 16:25",
            "push_tag": "推",
            "push_userid": "sorrywow"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab1f",
            "push_content": "賺大錢都移民了",
            "push_ipdatetime": "04/16 16:25",
            "push_tag": "推",
            "push_userid": "chengcti"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab1e",
            "push_content": "感覺沒人啊  韓流哩",
            "push_ipdatetime": "04/16 16:25",
            "push_tag": "→",
            "push_userid": "revise"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab1d",
            "push_content": "原來手速這麼快的一直都是喜韓兒",
            "push_ipdatetime": "04/16 16:25",
            "push_tag": "推",
            "push_userid": "rave16"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab1c",
            "push_content": "好啦 韓流退散了 這樣1450們 黨工們 有沒有很開心啊",
            "push_ipdatetime": "04/16 16:25",
            "push_tag": "噓",
            "push_userid": "yishiuelin"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab1b",
            "push_content": "哈哈哈哈哈 五毛賤畜全家都要死絕了啦",
            "push_ipdatetime": "04/16 16:26",
            "push_tag": "推",
            "push_userid": "GalLe5566"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab1a",
            "push_content": "光榮感你敢嘴",
            "push_ipdatetime": "04/16 16:26",
            "push_tag": "→",
            "push_userid": "sorenhuang"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab19",
            "push_content": "發大財不想賺不行嗎",
            "push_ipdatetime": "04/16 16:26",
            "push_tag": "推",
            "push_userid": "gn02022222"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab18",
            "push_content": "廠工準備",
            "push_ipdatetime": "04/16 16:26",
            "push_tag": "噓",
            "push_userid": "imsphzzz"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab17",
            "push_content": "改掛小央的x照",
            "push_ipdatetime": "04/16 16:26",
            "push_tag": "推",
            "push_userid": "machiusheng"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab16",
            "push_content": "看那些噓的速度讓我想到五毛",
            "push_ipdatetime": "04/16 16:26",
            "push_tag": "推",
            "push_userid": "d790929"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab15",
            "push_content": "半小時推爆",
            "push_ipdatetime": "04/16 16:26",
            "push_tag": "→",
            "push_userid": "imsphzzz"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab14",
            "push_content": "可能是都賺夠了去買店面開業了吧 打這個很無聊",
            "push_ipdatetime": "04/16 16:26",
            "push_tag": "噓",
            "push_userid": "Jason0813"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab13",
            "push_content": "民不聊生 怎麼買蔥油餅吃",
            "push_ipdatetime": "04/16 16:26",
            "push_tag": "→",
            "push_userid": "JudgmentLin"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab12",
            "push_content": "笑死 韓流退了 一堆五毛很生氣ㄉ噓欸",
            "push_ipdatetime": "04/16 16:26",
            "push_tag": "推",
            "push_userid": "livewild0327"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab11",
            "push_content": "廣告合約到了阿",
            "push_ipdatetime": "04/16 16:26",
            "push_tag": "推",
            "push_userid": "somefatguy"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab10",
            "push_content": "中夭: 大家幾個月內就發大財  不用做生意超爽",
            "push_ipdatetime": "04/16 16:26",
            "push_tag": "推",
            "push_userid": "birdjack"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab0f",
            "push_content": "韓粉開始流失了",
            "push_ipdatetime": "04/16 16:27",
            "push_tag": "推",
            "push_userid": "t30113011"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab0e",
            "push_content": "五毛別桑心啊，你們還有柯糞作伴",
            "push_ipdatetime": "04/16 16:27",
            "push_tag": "推",
            "push_userid": "cothade"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab0d",
            "push_content": "錢賺太多被嚇死所以先收起來",
            "push_ipdatetime": "04/16 16:27",
            "push_tag": "推",
            "push_userid": "OutBai"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab0c",
            "push_content": "就算這樣小英也選不上啦",
            "push_ipdatetime": "04/16 16:27",
            "push_tag": "→",
            "push_userid": "shadow0326"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab0b",
            "push_content": "這哪叫打啊，這是告訴大家沒商機了要換",
            "push_ipdatetime": "04/16 16:27",
            "push_tag": "推",
            "push_userid": "funccore"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab0a",
            "push_content": "這噓的速度 五毛們到底領多少錢呢",
            "push_ipdatetime": "04/16 16:27",
            "push_tag": "推",
            "push_userid": "matthew0129"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab09",
            "push_content": "原來是合約問題呀",
            "push_ipdatetime": "04/16 16:28",
            "push_tag": "推",
            "push_userid": "bluerain0958"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab08",
            "push_content": "喜韓兒也是會有醒來的一天吧",
            "push_ipdatetime": "04/16 16:28",
            "push_tag": "推",
            "push_userid": "zalora"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab07",
            "push_content": "韓瘤發灰",
            "push_ipdatetime": "04/16 16:28",
            "push_tag": "推",
            "push_userid": "Zein"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab06",
            "push_content": "沒關係韓導不管如何都不會發大財",
            "push_ipdatetime": "04/16 16:28",
            "push_tag": "推",
            "push_userid": "targoo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab05",
            "push_content": "賺夠了當然就收手",
            "push_ipdatetime": "04/16 16:28",
            "push_tag": "推",
            "push_userid": "iKelly"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab04",
            "push_content": "韓粉準備出征了!",
            "push_ipdatetime": "04/16 16:28",
            "push_tag": "推",
            "push_userid": "walkmancat"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab03",
            "push_content": "不靠我大韓導了嗎？",
            "push_ipdatetime": "04/16 16:28",
            "push_tag": "推",
            "push_userid": "wtosister"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab02",
            "push_content": "覺得丟臉吧！XDD",
            "push_ipdatetime": "04/16 16:28",
            "push_tag": "推",
            "push_userid": "qqqr"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab01",
            "push_content": "之後可能要改掛Terry蔥油餅",
            "push_ipdatetime": "04/16 16:28",
            "push_tag": "推",
            "push_userid": "icelandguard"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232ab00",
            "push_content": "發大財了",
            "push_ipdatetime": "04/16 16:28",
            "push_tag": "推",
            "push_userid": "VttONE"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaff",
            "push_content": "還盜圖",
            "push_ipdatetime": "04/16 16:28",
            "push_tag": "推",
            "push_userid": "kenny60710"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aafe",
            "push_content": "噓文衝第一才有好獎金",
            "push_ipdatetime": "04/16 16:29",
            "push_tag": "推",
            "push_userid": "gefroren"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aafd",
            "push_content": "仔細看新招牌，禿子長頭髮了耶",
            "push_ipdatetime": "04/16 16:29",
            "push_tag": "推",
            "push_userid": "wixin"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aafc",
            "push_content": "韓總帶領農業發大財 所以改行去種水果啦",
            "push_ipdatetime": "04/16 16:29",
            "push_tag": "推",
            "push_userid": "Spinner3"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aafb",
            "push_content": "知道丟臉了吧",
            "push_ipdatetime": "04/16 16:29",
            "push_tag": "推",
            "push_userid": "echoo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aafa",
            "push_content": "888888888",
            "push_ipdatetime": "04/16 16:29",
            "push_tag": "推",
            "push_userid": "YandereLove"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaf9",
            "push_content": "發財了要移民美國想清福了，懂？",
            "push_ipdatetime": "04/16 16:29",
            "push_tag": "推",
            "push_userid": "LordOfCS"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaf8",
            "push_content": "風潮已過",
            "push_ipdatetime": "04/16 16:29",
            "push_tag": "推",
            "push_userid": "werock"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaf7",
            "push_content": "不紅了....",
            "push_ipdatetime": "04/16 16:29",
            "push_tag": "推",
            "push_userid": "Capaneus"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaf6",
            "push_content": "下雨天布簾收起來而已啦",
            "push_ipdatetime": "04/16 16:29",
            "push_tag": "推",
            "push_userid": "linfon00"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaf5",
            "push_content": "賺翻 退休了",
            "push_ipdatetime": "04/16 16:30",
            "push_tag": "推",
            "push_userid": "Elmore"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaf4",
            "push_content": "恥力真強才敢用",
            "push_ipdatetime": "04/16 16:30",
            "push_tag": "→",
            "push_userid": "F5"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaf3",
            "push_content": "公關公司督割帳號推起來",
            "push_ipdatetime": "04/16 16:30",
            "push_tag": "噓",
            "push_userid": "imsphzzz"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaf2",
            "push_content": "長頭髮了",
            "push_ipdatetime": "04/16 16:30",
            "push_tag": "推",
            "push_userid": "oeas"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaf1",
            "push_content": "因為大家都知道沒競爭力的攤才會用這種方式行銷跟蹭人氣",
            "push_ipdatetime": "04/16 16:30",
            "push_tag": "推",
            "push_userid": "sasintw"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaf0",
            "push_content": "有貼韓的一律不光顧 反正他們發大財 沒差我的單",
            "push_ipdatetime": "04/16 16:30",
            "push_tag": "推",
            "push_userid": "glenmarlboro"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaef",
            "push_content": "都發大財了 現在出來擺攤只是交朋友",
            "push_ipdatetime": "04/16 16:30",
            "push_tag": "推",
            "push_userid": "z1976"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaee",
            "push_content": "還好還有救",
            "push_ipdatetime": "04/16 16:31",
            "push_tag": "推",
            "push_userid": "lacoaaa"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaed",
            "push_content": "喜韓兒不想天天都出門",
            "push_ipdatetime": "04/16 16:31",
            "push_tag": "推",
            "push_userid": "Moratti"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaec",
            "push_content": "路邊攤升級成飯店了啦",
            "push_ipdatetime": "04/16 16:31",
            "push_tag": "推",
            "push_userid": "cisyong"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaeb",
            "push_content": "喜韓兒搶第一~ya",
            "push_ipdatetime": "04/16 16:31",
            "push_tag": "推",
            "push_userid": "goldman0204"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaea",
            "push_content": "習下韓上囉",
            "push_ipdatetime": "04/16 16:31",
            "push_tag": "推",
            "push_userid": "sheng0321"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aae9",
            "push_content": "我覺得要推耶 店家自證智商 顧客便於閃避",
            "push_ipdatetime": "04/16 16:31",
            "push_tag": "推",
            "push_userid": "NgJovi"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aae8",
            "push_content": "還市長蔥油脂餅咧XD",
            "push_ipdatetime": "04/16 16:31",
            "push_tag": "推",
            "push_userid": "love1987817"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aae7",
            "push_content": "背主忘恩的店家？韓粉要進攻了？",
            "push_ipdatetime": "04/16 16:31",
            "push_tag": "→",
            "push_userid": "vesia"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aae6",
            "push_content": "喜韓兒要崩潰了啦",
            "push_ipdatetime": "04/16 16:31",
            "push_tag": "推",
            "push_userid": "b8350580"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aae5",
            "push_content": "年輕人看到韓導都避開了 偏偏韓粉很多住中國阿",
            "push_ipdatetime": "04/16 16:32",
            "push_tag": "→",
            "push_userid": "sasintw"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aae4",
            "push_content": "記者快來抄",
            "push_ipdatetime": "04/16 16:32",
            "push_tag": "推",
            "push_userid": "yiersan"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aae3",
            "push_content": "賺夠了,現在是出來交朋友.",
            "push_ipdatetime": "04/16 16:32",
            "push_tag": "推",
            "push_userid": "kiddcat"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aae2",
            "push_content": "哈哈哈",
            "push_ipdatetime": "04/16 16:32",
            "push_tag": "推",
            "push_userid": "lin5656"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aae1",
            "push_content": "退流行",
            "push_ipdatetime": "04/16 16:32",
            "push_tag": "推",
            "push_userid": "xindere"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aae0",
            "push_content": "叫你家蔡英文給我下台  別無恥搓賴",
            "push_ipdatetime": "04/16 16:32",
            "push_tag": "噓",
            "push_userid": "eddiego"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aadf",
            "push_content": "高調",
            "push_ipdatetime": "04/16 16:32",
            "push_tag": "推",
            "push_userid": "robotcl"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aade",
            "push_content": "覺得丟臉了 哈哈哈",
            "push_ipdatetime": "04/16 16:32",
            "push_tag": "→",
            "push_userid": "vizjeco"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aadd",
            "push_content": "看人，我大概不會買",
            "push_ipdatetime": "04/16 16:32",
            "push_tag": "推",
            "push_userid": "abucat"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aadc",
            "push_content": "五毛動作好快噓的好認真..是怕韓導的真相被戳破嗎?",
            "push_ipdatetime": "04/16 16:33",
            "push_tag": "推",
            "push_userid": "asile"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aadb",
            "push_content": "覺醒啦？",
            "push_ipdatetime": "04/16 16:33",
            "push_tag": "推",
            "push_userid": "remem"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aada",
            "push_content": "比馬迷扁迷弱",
            "push_ipdatetime": "04/16 16:33",
            "push_tag": "推",
            "push_userid": "jajoy"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aad9",
            "push_content": "哈哈哈 看到貼口號的就很好笑",
            "push_ipdatetime": "04/16 16:33",
            "push_tag": "推",
            "push_userid": "sshwann"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aad8",
            "push_content": "有夠智障的跟風仔 89萬人不一定因此支持 反韓的更不可能",
            "push_ipdatetime": "04/16 16:33",
            "push_tag": "推",
            "push_userid": "ahw12000"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aad7",
            "push_content": "很緊張ㄟ",
            "push_ipdatetime": "04/16 16:33",
            "push_tag": "→",
            "push_userid": "asile"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aad6",
            "push_content": "買 足足少了一堆客源",
            "push_ipdatetime": "04/16 16:33",
            "push_tag": "→",
            "push_userid": "ahw12000"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aad5",
            "push_content": "就一堆製杖跟風仔",
            "push_ipdatetime": "04/16 16:33",
            "push_tag": "推",
            "push_userid": "OutBai"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aad4",
            "push_content": "韓流發威 大家一起發大財囉",
            "push_ipdatetime": "04/16 16:33",
            "push_tag": "推",
            "push_userid": "ipl"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aad3",
            "push_content": "反正我死都不會去高雄 笑死",
            "push_ipdatetime": "04/16 16:33",
            "push_tag": "→",
            "push_userid": "vizjeco"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aad2",
            "push_content": "民不聊生啊 又老又窮",
            "push_ipdatetime": "04/16 16:33",
            "push_tag": "→",
            "push_userid": "linceass"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aad1",
            "push_content": "不意外 韓粉多 但討厭他的人也不少",
            "push_ipdatetime": "04/16 16:34",
            "push_tag": "推",
            "push_userid": "CMC677"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aad0",
            "push_content": "我是覺得很丟臉",
            "push_ipdatetime": "04/16 16:34",
            "push_tag": "推",
            "push_userid": "qaz13145204"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aacf",
            "push_content": "不要責怪想賺錢的小老百姓吧",
            "push_ipdatetime": "04/16 16:34",
            "push_tag": "推",
            "push_userid": "awoorog"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aace",
            "push_content": "喜韓兒要出征洗負評囉",
            "push_ipdatetime": "04/16 16:34",
            "push_tag": "推",
            "push_userid": "johnny9667"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aacd",
            "push_content": "不用說 一定是一天到晚被檢舉啊xd",
            "push_ipdatetime": "04/16 16:34",
            "push_tag": "噓",
            "push_userid": "abel0201"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aacc",
            "push_content": "好吃就會去買 不好吃 什麼神都救不了",
            "push_ipdatetime": "04/16 16:35",
            "push_tag": "→",
            "push_userid": "awoorog"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aacb",
            "push_content": "https://i.imgur.com/1wQhsGX.jpg",
            "push_ipdatetime": "04/16 16:35",
            "push_tag": "推",
            "push_userid": "esc5433"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaca",
            "push_content": "攤商也未必是韓粉，只是想賺韓粉錢，變來變去也還好",
            "push_ipdatetime": "04/16 16:35",
            "push_tag": "推",
            "push_userid": "iversonpop"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aac9",
            "push_content": "韓粉錢都賺到了當然換啊",
            "push_ipdatetime": "04/16 16:35",
            "push_tag": "推",
            "push_userid": "panda816"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aac8",
            "push_content": "一定是被廣大熱情高素質韓粉連番下架了啦",
            "push_ipdatetime": "04/16 16:35",
            "push_tag": "推",
            "push_userid": "Vedfolnir"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aac7",
            "push_content": "回家叫你家蔡英文別無恥搓賴   人家人氣比妳高太多了",
            "push_ipdatetime": "04/16 16:36",
            "push_tag": "噓",
            "push_userid": "eddiego"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aac6",
            "push_content": "要是我的話 就裝吸韓兒問她不放是不是看不起韓神XD",
            "push_ipdatetime": "04/16 16:36",
            "push_tag": "噓",
            "push_userid": "silentence"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aac5",
            "push_content": "韓現扣除韓粉外 目前給人仇恨值算很高欸",
            "push_ipdatetime": "04/16 16:36",
            "push_tag": "推",
            "push_userid": "love1987817"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aac4",
            "push_content": "東西好吃才是真的...這些都只是當初拱韓的噱頭",
            "push_ipdatetime": "04/16 16:36",
            "push_tag": "推",
            "push_userid": "aa01081008tw"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aac3",
            "push_content": "改風向太快了",
            "push_ipdatetime": "04/16 16:37",
            "push_tag": "推",
            "push_userid": "yfguk6685"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aac2",
            "push_content": "口味吃起來應該跟黃姓某麵包師傅差不多才需要這樣騙人氣",
            "push_ipdatetime": "04/16 16:37",
            "push_tag": "推",
            "push_userid": "alpha008"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aac1",
            "push_content": "掛個韓招牌就想要發大財..人生有這麼簡單就好了XD",
            "push_ipdatetime": "04/16 16:37",
            "push_tag": "→",
            "push_userid": "aa01081008tw"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aac0",
            "push_content": "用超級馬莉要版權吧？",
            "push_ipdatetime": "04/16 16:37",
            "push_tag": "→",
            "push_userid": "C32AMG"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aabf",
            "push_content": "笑死，一下就過氣了",
            "push_ipdatetime": "04/16 16:37",
            "push_tag": "推",
            "push_userid": "billionaire"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aabe",
            "push_content": "任天堂告下去",
            "push_ipdatetime": "04/16 16:37",
            "push_tag": "→",
            "push_userid": "nextbit"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aabd",
            "push_content": "發大財了所以有錢換招牌惹（誤）XDD",
            "push_ipdatetime": "04/16 16:38",
            "push_tag": "推",
            "push_userid": "cycutom"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aabc",
            "push_content": "韓總肉燥飯看起來滿好吃的",
            "push_ipdatetime": "04/16 16:38",
            "push_tag": "推",
            "push_userid": "jigsoso"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aabb",
            "push_content": "喜韓兒只會打嘴砲 被看破手腳了啦 XDD",
            "push_ipdatetime": "04/16 16:38",
            "push_tag": "推",
            "push_userid": "zardmih"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaba",
            "push_content": "那個肉燥飯看起來不錯",
            "push_ipdatetime": "04/16 16:38",
            "push_tag": "推",
            "push_userid": "Muqeem"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aab9",
            "push_content": "蔡英文別無恥搓賴  蔡英文別無恥搓賴  蔡英文別無恥搓賴",
            "push_ipdatetime": "04/16 16:38",
            "push_tag": "噓",
            "push_userid": "eddiego"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aab8",
            "push_content": "換什麼招牌？根本頭腦不清楚 沒有判斷力！",
            "push_ipdatetime": "04/16 16:38",
            "push_tag": "推",
            "push_userid": "Luchino"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aab7",
            "push_content": "文橫路也有一家賣啥鴨的，也是一個月倒！",
            "push_ipdatetime": "04/16 16:39",
            "push_tag": "推",
            "push_userid": "sue690226"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aab6",
            "push_content": "改賣冷凍肉包給韓粉吃了啦",
            "push_ipdatetime": "04/16 16:39",
            "push_tag": "推",
            "push_userid": "rumirumi"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aab5",
            "push_content": "韓流發威",
            "push_ipdatetime": "04/16 16:39",
            "push_tag": "推",
            "push_userid": "sam682097"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aab4",
            "push_content": "已經發大財不缺錢了~",
            "push_ipdatetime": "04/16 16:39",
            "push_tag": "推",
            "push_userid": "rafaj"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aab3",
            "push_content": "韓粉快去買啦...",
            "push_ipdatetime": "04/16 16:39",
            "push_tag": "推",
            "push_userid": "eric139"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aab2",
            "push_content": "我看到也是拒買",
            "push_ipdatetime": "04/16 16:40",
            "push_tag": "推",
            "push_userid": "terry1043"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aab1",
            "push_content": "叛徒！台獨份子！背骨仔！韓粉進攻啦！",
            "push_ipdatetime": "04/16 16:40",
            "push_tag": "推",
            "push_userid": "DDG114514"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aab0",
            "push_content": "哈哈哈哈哈哈哈",
            "push_ipdatetime": "04/16 16:40",
            "push_tag": "推",
            "push_userid": "elec1141"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaaf",
            "push_content": "都已經發大財了 挑豪宅中",
            "push_ipdatetime": "04/16 16:40",
            "push_tag": "→",
            "push_userid": "polo5615"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaae",
            "push_content": "還侵權任天堂",
            "push_ipdatetime": "04/16 16:41",
            "push_tag": "→",
            "push_userid": "terry1043"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaad",
            "push_content": "哈哈",
            "push_ipdatetime": "04/16 16:41",
            "push_tag": "→",
            "push_userid": "greedypeople"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaac",
            "push_content": "就賺夠了,響應韓導去種芭樂啦",
            "push_ipdatetime": "04/16 16:41",
            "push_tag": "推",
            "push_userid": "thehospital"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaab",
            "push_content": "被老任告了？？",
            "push_ipdatetime": "04/16 16:41",
            "push_tag": "→",
            "push_userid": "z32510z"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaaa",
            "push_content": "任何有韓國瑜的東西拒買",
            "push_ipdatetime": "04/16 16:41",
            "push_tag": "推",
            "push_userid": "skylion"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaa9",
            "push_content": "市長只顧玩 韓粉也心冷",
            "push_ipdatetime": "04/16 16:41",
            "push_tag": "噓",
            "push_userid": "sibom"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaa8",
            "push_content": "別這樣，一間店換好幾次名字，台灣人都這樣",
            "push_ipdatetime": "04/16 16:42",
            "push_tag": "推",
            "push_userid": "LeMirage2000"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaa7",
            "push_content": "爽啦韓粉崩潰哈哈",
            "push_ipdatetime": "04/16 16:42",
            "push_tag": "推",
            "push_userid": "goodzoro"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaa6",
            "push_content": "鐵定是賺大錢了",
            "push_ipdatetime": "04/16 16:42",
            "push_tag": "推",
            "push_userid": "andme"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaa5",
            "push_content": "真的想打韓國瑜這樣是沒用的 打不到痛點",
            "push_ipdatetime": "04/16 16:42",
            "push_tag": "推",
            "push_userid": "sammoon"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaa4",
            "push_content": "不要質疑你的特區首長！",
            "push_ipdatetime": "04/16 16:42",
            "push_tag": "推",
            "push_userid": "kentshi"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaa3",
            "push_content": "可以用馬力歐當招牌喔?",
            "push_ipdatetime": "04/16 16:42",
            "push_tag": "推",
            "push_userid": "mopigou"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaa2",
            "push_content": "做個小生意而已 別這樣 弱弱相殘",
            "push_ipdatetime": "04/16 16:42",
            "push_tag": "推",
            "push_userid": "Xceberus"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaa1",
            "push_content": "電視台請來的臨演吧",
            "push_ipdatetime": "04/16 16:42",
            "push_tag": "推",
            "push_userid": "pray"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aaa0",
            "push_content": "認真說，這種炒短線的攤販東西要好吃到哪也是有限",
            "push_ipdatetime": "04/16 16:43",
            "push_tag": "推",
            "push_userid": "bcw1218"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa9f",
            "push_content": "前幾樓XD",
            "push_ipdatetime": "04/16 16:43",
            "push_tag": "推",
            "push_userid": "microtek1990"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa9e",
            "push_content": "其實是賺飽了準備退休",
            "push_ipdatetime": "04/16 16:43",
            "push_tag": "→",
            "push_userid": "jerrysf2000"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa9d",
            "push_content": "市長一直玩 攤販心灰意冷",
            "push_ipdatetime": "04/16 16:43",
            "push_tag": "推",
            "push_userid": "allenwu79"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa9c",
            "push_content": "賺太多怕被錢壓死  所以只好委屈一點",
            "push_ipdatetime": "04/16 16:44",
            "push_tag": "推",
            "push_userid": "kslxd"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa9b",
            "push_content": "沒在打韓啊..我酸的是這些只想這走旁門的攤販XD",
            "push_ipdatetime": "04/16 16:44",
            "push_tag": "推",
            "push_userid": "aa01081008tw"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa9a",
            "push_content": "立倫，你不要鬧喔！",
            "push_ipdatetime": "04/16 16:44",
            "push_tag": "推",
            "push_userid": "histing"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa99",
            "push_content": "XDDDD",
            "push_ipdatetime": "04/16 16:45",
            "push_tag": "推",
            "push_userid": "stlevi811101"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa98",
            "push_content": "大概覺得種田比較賺就關店下田了吧",
            "push_ipdatetime": "04/16 16:45",
            "push_tag": "推",
            "push_userid": "cww7911"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa97",
            "push_content": "等等 問一下 蔥油餅一張70元算貴嗎.？？？",
            "push_ipdatetime": "04/16 16:45",
            "push_tag": "推",
            "push_userid": "awoorog"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa96",
            "push_content": "我也覺得韓流不正常,但你這樣是想逼死誰?這些只是在基層",
            "push_ipdatetime": "04/16 16:45",
            "push_tag": "噓",
            "push_userid": "ChenDotQ"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa95",
            "push_content": "爭扎的人們,多想一分鐘,其實你可以不用這樣幸災樂禍。這",
            "push_ipdatetime": "04/16 16:45",
            "push_tag": "→",
            "push_userid": "ChenDotQ"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa94",
            "push_content": "種行為並不會突顯你的公民素養。",
            "push_ipdatetime": "04/16 16:45",
            "push_tag": "→",
            "push_userid": "ChenDotQ"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa93",
            "push_content": "一張大張的70還好吧",
            "push_ipdatetime": "04/16 16:46",
            "push_tag": "→",
            "push_userid": "jim924211"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa92",
            "push_content": "該知道產品本質比炒短線重要了吧",
            "push_ipdatetime": "04/16 16:46",
            "push_tag": "推",
            "push_userid": "muzik"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa91",
            "push_content": "好貴喔 一張蔥油餅70",
            "push_ipdatetime": "04/16 16:46",
            "push_tag": "→",
            "push_userid": "vs98and99"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa90",
            "push_content": "瑪利歐已經侵權了吧",
            "push_ipdatetime": "04/16 16:46",
            "push_tag": "推",
            "push_userid": "gary0206"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa8f",
            "push_content": "沒有逼死誰吧？",
            "push_ipdatetime": "04/16 16:46",
            "push_tag": "推",
            "push_userid": "skylion"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa8e",
            "push_content": "明明就是改邪歸正 告訴大家可以解除封鎖 是好事吧",
            "push_ipdatetime": "04/16 16:47",
            "push_tag": "→",
            "push_userid": "skylion"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa8d",
            "push_content": "韓粉快進攻阿 打人你們最擅長的",
            "push_ipdatetime": "04/16 16:47",
            "push_tag": "推",
            "push_userid": "SupCat"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa8c",
            "push_content": "這樣會逼死誰???這不是他們的選擇嗎???",
            "push_ipdatetime": "04/16 16:47",
            "push_tag": "推",
            "push_userid": "piggreat"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa8b",
            "push_content": "太久沒吃蔥油餅 原來現在一張要七十了",
            "push_ipdatetime": "04/16 16:47",
            "push_tag": "推",
            "push_userid": "awoorog"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa8a",
            "push_content": "我還是不知道為什麼韓可以紅成這樣 選前除了跟世間一戰外他根",
            "push_ipdatetime": "04/16 16:47",
            "push_tag": "推",
            "push_userid": "hw1"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa89",
            "push_content": "本是個nobody",
            "push_ipdatetime": "04/16 16:48",
            "push_tag": "→",
            "push_userid": "hw1"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa88",
            "push_content": "太好了，我下次要故意繞過去開嘲諷",
            "push_ipdatetime": "04/16 16:48",
            "push_tag": "推",
            "push_userid": "blackbigbig"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa87",
            "push_content": "傻逼 賺飽了要移民中國了阿",
            "push_ipdatetime": "04/16 16:48",
            "push_tag": "推",
            "push_userid": "tnGG"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa86",
            "push_content": "發大財了",
            "push_ipdatetime": "04/16 16:48",
            "push_tag": "推",
            "push_userid": "as6354993"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa85",
            "push_content": "不會逼死誰吧？韓民調那麼高 發財都來不及了",
            "push_ipdatetime": "04/16 16:48",
            "push_tag": "推",
            "push_userid": "shown21"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa84",
            "push_content": "發財不吃路邊攤了",
            "push_ipdatetime": "04/16 16:48",
            "push_tag": "→",
            "push_userid": "c41231717"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa83",
            "push_content": "QQ",
            "push_ipdatetime": "04/16 16:49",
            "push_tag": "推",
            "push_userid": "sm999222"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa82",
            "push_content": "有人逼他們用那招牌嗎？用那招牌沒人買!!變別人逼死他??",
            "push_ipdatetime": "04/16 16:49",
            "push_tag": "→",
            "push_userid": "piggreat"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa81",
            "push_content": "民不聊生民心思變",
            "push_ipdatetime": "04/16 16:49",
            "push_tag": "推",
            "push_userid": "kevinpc"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa80",
            "push_content": "還有瑪麗歐是三小",
            "push_ipdatetime": "04/16 16:49",
            "push_tag": "推",
            "push_userid": "justastupid"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa7f",
            "push_content": "發大財",
            "push_ipdatetime": "04/16 16:50",
            "push_tag": "推",
            "push_userid": "Szss"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa7e",
            "push_content": "難道真的是南部柯粉沒柯可投就隨便拱一個疑似素人的來自慰",
            "push_ipdatetime": "04/16 16:50",
            "push_tag": "推",
            "push_userid": "hw1"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa7d",
            "push_content": "蔡英文別無恥搓賴  蔡英文別無恥搓賴  蔡英文別無恥搓賴",
            "push_ipdatetime": "04/16 16:50",
            "push_tag": "噓",
            "push_userid": "eddiego"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa7c",
            "push_content": "都發大財了 我還怕去嘲諷時被石油噴死呢XD",
            "push_ipdatetime": "04/16 16:51",
            "push_tag": "噓",
            "push_userid": "silentence"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa7b",
            "push_content": "XDDDDDDDDDDD這種請我吃  我都不要了~~",
            "push_ipdatetime": "04/16 16:51",
            "push_tag": "推",
            "push_userid": "STE23"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa7a",
            "push_content": "韓粉:響少賺點不行嗎?",
            "push_ipdatetime": "04/16 16:51",
            "push_tag": "推",
            "push_userid": "tarmogo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa79",
            "push_content": "自己選擇不用負責?",
            "push_ipdatetime": "04/16 16:52",
            "push_tag": "→",
            "push_userid": "chan324"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa78",
            "push_content": "樓下五毛裝賴粉",
            "push_ipdatetime": "04/16 16:52",
            "push_tag": "推",
            "push_userid": "ReliferK"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa77",
            "push_content": "這啥",
            "push_ipdatetime": "04/16 16:52",
            "push_tag": "噓",
            "push_userid": "boyd1014"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa76",
            "push_content": "誰跟你吃這些垃圾啊，死忠韓粉當然是吃冷凍包子啊",
            "push_ipdatetime": "04/16 16:52",
            "push_tag": "推",
            "push_userid": "a4786033"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa75",
            "push_content": "說好的發大財呢",
            "push_ipdatetime": "04/16 16:52",
            "push_tag": "推",
            "push_userid": "zombieguy"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa74",
            "push_content": "在高雄一張70!",
            "push_ipdatetime": "04/16 16:52",
            "push_tag": "推",
            "push_userid": "aqsss"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa73",
            "push_content": "韓流發揮  賺夠了，退休了  發大財",
            "push_ipdatetime": "04/16 16:52",
            "push_tag": "推",
            "push_userid": "auxiliary11"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa72",
            "push_content": "蔥油餅一張70?",
            "push_ipdatetime": "04/16 16:53",
            "push_tag": "推",
            "push_userid": "PePePeace"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa71",
            "push_content": "肉燥飯是\"快閃\"最後一日 不是最後一日做好嗎|||=.=",
            "push_ipdatetime": "04/16 16:53",
            "push_tag": "推",
            "push_userid": "ls4860"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa70",
            "push_content": "掙扎個屁 老子最愛在沒賺到錢的直銷人身後再補一腳",
            "push_ipdatetime": "04/16 16:53",
            "push_tag": "→",
            "push_userid": "silentence"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa6f",
            "push_content": "幹 是不能長頭髮喔",
            "push_ipdatetime": "04/16 16:54",
            "push_tag": "→",
            "push_userid": "Atwo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa6e",
            "push_content": "專做9.2的生意，想也知道來客數一定大減",
            "push_ipdatetime": "04/16 16:54",
            "push_tag": "→",
            "push_userid": "keyman2"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa6d",
            "push_content": "被韓粉買走了ㄅ",
            "push_ipdatetime": "04/16 16:54",
            "push_tag": "推",
            "push_userid": "ewjfd"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa6c",
            "push_content": "白痴韓粉快去教訓這叛徒假韓粉",
            "push_ipdatetime": "04/16 16:55",
            "push_tag": "推",
            "push_userid": "cheetahspeed"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa6b",
            "push_content": "屏東燈會也弄個光頭娃娃。沒人想靠近",
            "push_ipdatetime": "04/16 16:55",
            "push_tag": "推",
            "push_userid": "troubledanny"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa6a",
            "push_content": "9.2:你侮辱韓導 你廠工 你小牙籤",
            "push_ipdatetime": "04/16 16:56",
            "push_tag": "推",
            "push_userid": "steven0503"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa69",
            "push_content": "9.2就萬人響應沒人捧場啊 不然打扁麵包也不會這麼狼狽",
            "push_ipdatetime": "04/16 16:56",
            "push_tag": "推",
            "push_userid": "hw1"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa68",
            "push_content": "說不定是不好吃 和韓沒關係吧",
            "push_ipdatetime": "04/16 16:57",
            "push_tag": "推",
            "push_userid": "grugru"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa67",
            "push_content": "敢拿瑪利歐。看來是不知道任天堂法務戰無不勝就是了",
            "push_ipdatetime": "04/16 16:57",
            "push_tag": "噓",
            "push_userid": "anyne"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa66",
            "push_content": "哇靠蔥油餅要70 果真高雄發大財了",
            "push_ipdatetime": "04/16 16:58",
            "push_tag": "推",
            "push_userid": "BigAllen"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa65",
            "push_content": "等等 用馬利歐感覺比較危險",
            "push_ipdatetime": "04/16 16:59",
            "push_tag": "推",
            "push_userid": "mko00kimo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa64",
            "push_content": "笑死",
            "push_ipdatetime": "04/16 16:59",
            "push_tag": "推",
            "push_userid": "wccw010034"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa63",
            "push_content": "蔥油餅70 免發票 真他媽斂財",
            "push_ipdatetime": "04/16 17:00",
            "push_tag": "→",
            "push_userid": "ewjfd"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa62",
            "push_content": "放那個光頭娃娃 就像飄著ㄧ股臭酸味",
            "push_ipdatetime": "04/16 17:00",
            "push_tag": "推",
            "push_userid": "lin821"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa61",
            "push_content": "高雄人真他媽凱子",
            "push_ipdatetime": "04/16 17:00",
            "push_tag": "→",
            "push_userid": "ewjfd"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa60",
            "push_content": "任天堂或從中得利",
            "push_ipdatetime": "04/16 17:00",
            "push_tag": "→",
            "push_userid": "YdNic1412"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa5f",
            "push_content": "登入5百 發文個位數 八卦版發2爆2 不就是那種團體的人",
            "push_ipdatetime": "04/16 17:00",
            "push_tag": "→",
            "push_userid": "a71085"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa5e",
            "push_content": "智障韓粉崩潰",
            "push_ipdatetime": "04/16 17:01",
            "push_tag": "推",
            "push_userid": "jackie0804"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa5d",
            "push_content": "他拿的應該是馬力歐原廠的海報，不會有事吧？",
            "push_ipdatetime": "04/16 17:01",
            "push_tag": "推",
            "push_userid": "iso90024"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa5c",
            "push_content": "只會吹牛的爛貨",
            "push_ipdatetime": "04/16 17:01",
            "push_tag": "推",
            "push_userid": "taco13"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa5b",
            "push_content": "竟然選中國政黨當市長 腦殘高雄台中人",
            "push_ipdatetime": "04/16 17:02",
            "push_tag": "→",
            "push_userid": "ewjfd"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa5a",
            "push_content": "看了都沒胃口了",
            "push_ipdatetime": "04/16 17:03",
            "push_tag": "推",
            "push_userid": "mp4vu06"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa59",
            "push_content": "講白的，外地韓粉不來了",
            "push_ipdatetime": "04/16 17:03",
            "push_tag": "推",
            "push_userid": "lolovero"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa58",
            "push_content": "不演了",
            "push_ipdatetime": "04/16 17:03",
            "push_tag": "推",
            "push_userid": "cup000002001"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa57",
            "push_content": "之前掛韓導上中天的店家 還剩幾家活著",
            "push_ipdatetime": "04/16 17:03",
            "push_tag": "推",
            "push_userid": "s81048112"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa56",
            "push_content": "韓粉：自己不爭氣！",
            "push_ipdatetime": "04/16 17:04",
            "push_tag": "推",
            "push_userid": "liudwan"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa55",
            "push_content": "那個在義大的肉燥飯週六晚上經過跟本沒人吃",
            "push_ipdatetime": "04/16 17:04",
            "push_tag": "推",
            "push_userid": "MrKuo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa54",
            "push_content": "車上還是有圖案啊 喜韓兒是不可能清醒的",
            "push_ipdatetime": "04/16 17:04",
            "push_tag": "噓",
            "push_userid": "ewjfd"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa53",
            "push_content": "中夭敢不敢去採訪攤販們看過年後還有沒有發大財",
            "push_ipdatetime": "04/16 17:04",
            "push_tag": "推",
            "push_userid": "lolovero"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa52",
            "push_content": "車上的圖案都還在 哪有撤掉",
            "push_ipdatetime": "04/16 17:05",
            "push_tag": "→",
            "push_userid": "ewjfd"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa51",
            "push_content": "根本沒換啊",
            "push_ipdatetime": "04/16 17:05",
            "push_tag": "→",
            "push_userid": "ewjfd"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa50",
            "push_content": "因為韓粉改吃冷凍肉包，其他小吃不是冷凍的很難入口",
            "push_ipdatetime": "04/16 17:06",
            "push_tag": "推",
            "push_userid": "kevinpc"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa4f",
            "push_content": "現在攤販根本比以前慘多了，但是清不清醒還是未知，因",
            "push_ipdatetime": "04/16 17:06",
            "push_tag": "推",
            "push_userid": "lolovero"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa4e",
            "push_content": "樓上是不是看錯圖",
            "push_ipdatetime": "04/16 17:06",
            "push_tag": "推",
            "push_userid": "s81048112"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa4d",
            "push_content": "為韓粉會怪中央卡他",
            "push_ipdatetime": "04/16 17:06",
            "push_tag": "→",
            "push_userid": "lolovero"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa4c",
            "push_content": "都去吃冷凍包子了XDDDDDDDDDDDD 快笑死",
            "push_ipdatetime": "04/16 17:07",
            "push_tag": "→",
            "push_userid": "TDKnight"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa4b",
            "push_content": "跟拍扁麵包師一樣的 都想利用政治發財 結果也不看自己做出",
            "push_ipdatetime": "04/16 17:07",
            "push_tag": "推",
            "push_userid": "rbull"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa4a",
            "push_content": "kmt依然是以前那個kmt 哈哈",
            "push_ipdatetime": "04/16 17:07",
            "push_tag": "推",
            "push_userid": "biollante"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa49",
            "push_content": "韓粉都發財上高級餐廳好嗎",
            "push_ipdatetime": "04/16 17:08",
            "push_tag": "推",
            "push_userid": "fingers"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa48",
            "push_content": "做生意沒事政治化 狂熱的不去正常人也不去了",
            "push_ipdatetime": "04/16 17:08",
            "push_tag": "→",
            "push_userid": "dog990999"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa47",
            "push_content": "小丑瑜 呵",
            "push_ipdatetime": "04/16 17:08",
            "push_tag": "→",
            "push_userid": "cbr0627"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa46",
            "push_content": "人家生意太好不想做那麼累才換下來的，要你管喔？",
            "push_ipdatetime": "04/16 17:09",
            "push_tag": "推",
            "push_userid": "icpolonaise"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa45",
            "push_content": "不然你以為500塊能貼那個爛牌子多久",
            "push_ipdatetime": "04/16 17:11",
            "push_tag": "推",
            "push_userid": "chienyu2001"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa44",
            "push_content": "已經發大財 準備退休養老了啦",
            "push_ipdatetime": "04/16 17:13",
            "push_tag": "推",
            "push_userid": "NTJL"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa43",
            "push_content": "不跟風一下怎麼是台灣人",
            "push_ipdatetime": "04/16 17:13",
            "push_tag": "推",
            "push_userid": "Bouchard"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa42",
            "push_content": "XDDDDDDDD",
            "push_ipdatetime": "04/16 17:14",
            "push_tag": "推",
            "push_userid": "tw2000"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa41",
            "push_content": "半張35？一張70？ 哇靠...",
            "push_ipdatetime": "04/16 17:14",
            "push_tag": "推",
            "push_userid": "hiphopboy7"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa40",
            "push_content": "前面噓超快",
            "push_ipdatetime": "04/16 17:14",
            "push_tag": "推",
            "push_userid": "ethan30213"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa3f",
            "push_content": "前幾樓好誇張喔，太快了吧",
            "push_ipdatetime": "04/16 17:14",
            "push_tag": "推",
            "push_userid": "AmabaNatsuki"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa3e",
            "push_content": "不是賣芭樂還想賺錢啊 瞧不起禿頭？",
            "push_ipdatetime": "04/16 17:16",
            "push_tag": "噓",
            "push_userid": "enemyli"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa3d",
            "push_content": "千萬韓粉站出來",
            "push_ipdatetime": "04/16 17:16",
            "push_tag": "推",
            "push_userid": "Sashaaaa"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa3c",
            "push_content": "已經發大財退休了，不要亂講",
            "push_ipdatetime": "04/16 17:17",
            "push_tag": "推",
            "push_userid": "bbalabababa"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa3b",
            "push_content": "發現掛上韓國瑜的照片 也無法發大財?! XD",
            "push_ipdatetime": "04/16 17:17",
            "push_tag": "推",
            "push_userid": "hankhui3175"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa3a",
            "push_content": "哈哈",
            "push_ipdatetime": "04/16 17:17",
            "push_tag": "→",
            "push_userid": "akway"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa39",
            "push_content": "吃了沒發財吧",
            "push_ipdatetime": "04/16 17:17",
            "push_tag": "推",
            "push_userid": "ja11s4o1n7"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa38",
            "push_content": "韓粉操作失敗",
            "push_ipdatetime": "04/16 17:17",
            "push_tag": "→",
            "push_userid": "fxxkptt"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa37",
            "push_content": "被新台幣下架囉",
            "push_ipdatetime": "04/16 17:18",
            "push_tag": "推",
            "push_userid": "shawntwo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa36",
            "push_content": "韓總只會賣菜 還賣什麼小吃 去種田拉 朋友",
            "push_ipdatetime": "04/16 17:18",
            "push_tag": "推",
            "push_userid": "zxzxcv86520"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa35",
            "push_content": "別懷疑左營X榮路也有一家是一張70",
            "push_ipdatetime": "04/16 17:18",
            "push_tag": "推",
            "push_userid": "frank8979"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa34",
            "push_content": "35塊半張70塊一張？",
            "push_ipdatetime": "04/16 17:18",
            "push_tag": "噓",
            "push_userid": "lu41103"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa33",
            "push_content": "http://i.imgur.com/qJ6i8Cr.jpg",
            "push_ipdatetime": "04/16 17:18",
            "push_tag": "推",
            "push_userid": "whopeter"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa32",
            "push_content": "厂厂",
            "push_ipdatetime": "04/16 17:19",
            "push_tag": "推",
            "push_userid": "gemilay"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa31",
            "push_content": "#韓流發威",
            "push_ipdatetime": "04/16 17:20",
            "push_tag": "推",
            "push_userid": "streit"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa30",
            "push_content": "我看到有關的店都直接抵制",
            "push_ipdatetime": "04/16 17:21",
            "push_tag": "推",
            "push_userid": "Pscope"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa2f",
            "push_content": "感謝s81048112提醒 看錯圖 真的換掉了",
            "push_ipdatetime": "04/16 17:21",
            "push_tag": "→",
            "push_userid": "ewjfd"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa2e",
            "push_content": "做生意只想貼一時的網紅就別想長久",
            "push_ipdatetime": "04/16 17:21",
            "push_tag": "推",
            "push_userid": "clamor88"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa2d",
            "push_content": "價格是還好 我這邊半張40一張80",
            "push_ipdatetime": "04/16 17:21",
            "push_tag": "推",
            "push_userid": "hw1"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa2c",
            "push_content": "韓粉不吃了嗎？",
            "push_ipdatetime": "04/16 17:21",
            "push_tag": "推",
            "push_userid": "espresso1"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa2b",
            "push_content": "太棒了店家！自在認證，讓我們可以不買韓粉的垃圾食物",
            "push_ipdatetime": "04/16 17:23",
            "push_tag": "推",
            "push_userid": "huashih"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa2a",
            "push_content": "跟風仔還想賺啊",
            "push_ipdatetime": "04/16 17:24",
            "push_tag": "推",
            "push_userid": "chrisgod"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa29",
            "push_content": "數錢數到骨折，不想賺太多",
            "push_ipdatetime": "04/16 17:25",
            "push_tag": "推",
            "push_userid": "iamch"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa28",
            "push_content": "腦包",
            "push_ipdatetime": "04/16 17:26",
            "push_tag": "噓",
            "push_userid": "abc06292002"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa27",
            "push_content": "只想噓一群盜圖狗",
            "push_ipdatetime": "04/16 17:27",
            "push_tag": "噓",
            "push_userid": "Faicha"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa26",
            "push_content": "馬力歐有授權給他使用嗎",
            "push_ipdatetime": "04/16 17:27",
            "push_tag": "→",
            "push_userid": "bamm"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa25",
            "push_content": "吃了會失智正常人才不會去買…倒是智障喜韓兒都死哪去了？",
            "push_ipdatetime": "04/16 17:28",
            "push_tag": "推",
            "push_userid": "m4tl6"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa24",
            "push_content": "不支持同類嗎？",
            "push_ipdatetime": "04/16 17:28",
            "push_tag": "→",
            "push_userid": "m4tl6"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa23",
            "push_content": "都賺到退休金了誰還在那邊做?",
            "push_ipdatetime": "04/16 17:28",
            "push_tag": "推",
            "push_userid": "sshow0904"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa22",
            "push_content": "韓粉加油好嗎 照三餐挺不然神話會破滅",
            "push_ipdatetime": "04/16 17:28",
            "push_tag": "推",
            "push_userid": "yzkeroro"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa21",
            "push_content": "有韓国的都不買",
            "push_ipdatetime": "04/16 17:29",
            "push_tag": "推",
            "push_userid": "family112002"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa20",
            "push_content": "何必這樣，攤販辛苦，哪裡有錢哪裡去，討口飯吃而已，不",
            "push_ipdatetime": "04/16 17:29",
            "push_tag": "→",
            "push_userid": "k3341688"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa1f",
            "push_content": "用放大檢視",
            "push_ipdatetime": "04/16 17:29",
            "push_tag": "→",
            "push_userid": "k3341688"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa1e",
            "push_content": "蔥油餅那種25元的東西賣70 發大財了",
            "push_ipdatetime": "04/16 17:30",
            "push_tag": "推",
            "push_userid": "cheetahspeed"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa1d",
            "push_content": "還韓流勒 流感還差不多",
            "push_ipdatetime": "04/16 17:30",
            "push_tag": "推",
            "push_userid": "ES699AP"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa1c",
            "push_content": "哈哈哈哈",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "推",
            "push_userid": "qCqCQ"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa1b",
            "push_content": "綠口支吉娃娃真的什麼都能當爆卦",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "推",
            "push_userid": "PttWaHaha"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa1a",
            "push_content": "韓粉呢",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "推",
            "push_userid": "linear5566"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa19",
            "push_content": "韓粉的票勉強過半而已，做生意不能忽視另一半的銷售",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "→",
            "push_userid": "sligiho"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa18",
            "push_content": "70塊的是那種大張的蔥油薄餅啦",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "推",
            "push_userid": "w113353"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa17",
            "push_content": "難道是沒付版權費被吉了嗎",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "推",
            "push_userid": "lkk0752"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa16",
            "push_content": "笑死",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "推",
            "push_userid": "tsaodin0220"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa15",
            "push_content": "只想搞失智行銷的智障攤商倒了也是應該…同情？吃屎發大財",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "推",
            "push_userid": "m4tl6"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa14",
            "push_content": "去啦",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "→",
            "push_userid": "m4tl6"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa13",
            "push_content": "韓流發威",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "推",
            "push_userid": "jerycon0876"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa12",
            "push_content": "推",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "推",
            "push_userid": "lostman"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa11",
            "push_content": "放心  9.2韓藍教徒屎蛆會買爆的",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "推",
            "push_userid": "dtlove17"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa10",
            "push_content": "韓導討版權費了嗎？",
            "push_ipdatetime": "04/16 17:35",
            "push_tag": "推",
            "push_userid": "ajie128"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa0f",
            "push_content": "89萬垃圾韓粉再不用身家支持要跌落神壇啦",
            "push_ipdatetime": "04/16 17:35",
            "push_tag": "推",
            "push_userid": "cheetahspeed"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa0e",
            "push_content": "看破手腳了阿",
            "push_ipdatetime": "04/16 17:36",
            "push_tag": "推",
            "push_userid": "id41030"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa0d",
            "push_content": "哈哈前幾個五毛好急喔",
            "push_ipdatetime": "04/16 17:36",
            "push_tag": "推",
            "push_userid": "tsming"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa0c",
            "push_content": "推",
            "push_ipdatetime": "04/16 17:36",
            "push_tag": "推",
            "push_userid": "yang5115"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa0b",
            "push_content": "笑死",
            "push_ipdatetime": "04/16 17:37",
            "push_tag": "→",
            "push_userid": "neat"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa0a",
            "push_content": "XDD",
            "push_ipdatetime": "04/16 17:38",
            "push_tag": "→",
            "push_userid": "Loren9064"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa09",
            "push_content": "87",
            "push_ipdatetime": "04/16 17:38",
            "push_tag": "→",
            "push_userid": "coffee112"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa08",
            "push_content": "中天快直播",
            "push_ipdatetime": "04/16 17:39",
            "push_tag": "推",
            "push_userid": "Boris945"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa07",
            "push_content": "會相信韓禿發大財口號的腦袋不行阿",
            "push_ipdatetime": "04/16 17:40",
            "push_tag": "推",
            "push_userid": "fcshden"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa06",
            "push_content": "貨出去錢進來高雄發大財",
            "push_ipdatetime": "04/16 17:40",
            "push_tag": "推",
            "push_userid": "darktasi"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa05",
            "push_content": "笑死",
            "push_ipdatetime": "04/16 17:40",
            "push_tag": "→",
            "push_userid": "darktasi"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa04",
            "push_content": "那個鴨肉油飯其實還不錯吃 但就是量少又超貴！",
            "push_ipdatetime": "04/16 17:40",
            "push_tag": "推",
            "push_userid": "taleschia"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa03",
            "push_content": "韓流發大財 五毛崩潰噓起來",
            "push_ipdatetime": "04/16 17:40",
            "push_tag": "推",
            "push_userid": "meredith001"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa02",
            "push_content": "蠢蛋才掛政治人物 業績直接腰斬再微增",
            "push_ipdatetime": "04/16 17:41",
            "push_tag": "→",
            "push_userid": "laosoacj"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa01",
            "push_content": "一堆韓粉急了",
            "push_ipdatetime": "04/16 17:41",
            "push_tag": "推",
            "push_userid": "ihczfu"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232aa00",
            "push_content": "終於想清楚不想當腦殘了",
            "push_ipdatetime": "04/16 17:42",
            "push_tag": "推",
            "push_userid": "s8624032"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9ff",
            "push_content": "用照片不準阿,說不定下一張就排滿了",
            "push_ipdatetime": "04/16 17:42",
            "push_tag": "→",
            "push_userid": "mopigou"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9fe",
            "push_content": "補血",
            "push_ipdatetime": "04/16 17:43",
            "push_tag": "推",
            "push_userid": "bestboy168"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9fd",
            "push_content": "哈哈哈哈",
            "push_ipdatetime": "04/16 17:43",
            "push_tag": "推",
            "push_userid": "kate1104"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9fc",
            "push_content": "幹  晚餐吃蔥油餅好惹",
            "push_ipdatetime": "04/16 17:44",
            "push_tag": "推",
            "push_userid": "ppccfvy"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9fb",
            "push_content": "我家附近還有禿子捲餅 每天經過老闆都坐在門口發呆",
            "push_ipdatetime": "04/16 17:44",
            "push_tag": "推",
            "push_userid": "yaieki"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9fa",
            "push_content": "時間證明那是丟臉標語",
            "push_ipdatetime": "04/16 17:44",
            "push_tag": "推",
            "push_userid": "captain568"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9f9",
            "push_content": "XDD",
            "push_ipdatetime": "04/16 17:45",
            "push_tag": "推",
            "push_userid": "joe0528"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9f8",
            "push_content": "發大財",
            "push_ipdatetime": "04/16 17:46",
            "push_tag": "→",
            "push_userid": "a8824031"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9f7",
            "push_content": "絕不去吃 爛店幹!!!!",
            "push_ipdatetime": "04/16 17:47",
            "push_tag": "推",
            "push_userid": "omoi1988"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9f6",
            "push_content": "幾個月就發大財了，後半輩子不愁吃穿了",
            "push_ipdatetime": "04/16 17:48",
            "push_tag": "推",
            "push_userid": "vltw5v"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9f5",
            "push_content": "韓粉出征",
            "push_ipdatetime": "04/16 17:49",
            "push_tag": "→",
            "push_userid": "bobby94507"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9f4",
            "push_content": "禿頭還在啦 只是用SUPER MARIO有沒有侵權問題啊…",
            "push_ipdatetime": "04/16 17:49",
            "push_tag": "推",
            "push_userid": "Lomax"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9f3",
            "push_content": "羞恥…就算是寫其他人我也覺得一樣",
            "push_ipdatetime": "04/16 17:50",
            "push_tag": "→",
            "push_userid": "weselyong"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9f2",
            "push_content": "為什麼不能檢視？又沒人逼他用政治人物當招牌..",
            "push_ipdatetime": "04/16 17:50",
            "push_tag": "推",
            "push_userid": "LeonardoPika"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9f1",
            "push_content": "人家是發財退休了好ㄇ",
            "push_ipdatetime": "04/16 17:51",
            "push_tag": "推",
            "push_userid": "sismiku"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9f0",
            "push_content": "已經發大財了不是？現在只是加減賣而已",
            "push_ipdatetime": "04/16 17:51",
            "push_tag": "推",
            "push_userid": "winterjoker"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9ef",
            "push_content": "用瑪利歐，老任該做事了吧",
            "push_ipdatetime": "04/16 17:51",
            "push_tag": "推",
            "push_userid": "tin123210"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9ee",
            "push_content": "https://i.imgur.com/csp4A9u.jpg",
            "push_ipdatetime": "04/16 17:53",
            "push_tag": "推",
            "push_userid": "e124530245"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9ed",
            "push_content": "花蓮東大門夜市",
            "push_ipdatetime": "04/16 17:53",
            "push_tag": "→",
            "push_userid": "e124530245"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9ec",
            "push_content": "應該是發大財了，所以變的低調。 怕大家知道他錢太多",
            "push_ipdatetime": "04/16 17:53",
            "push_tag": "→",
            "push_userid": "Alienpapa"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9eb",
            "push_content": "。",
            "push_ipdatetime": "04/16 17:53",
            "push_tag": "→",
            "push_userid": "Alienpapa"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9ea",
            "push_content": "哈  屏東燈會我在現場  真的覺得買那攤很丟臉",
            "push_ipdatetime": "04/16 17:54",
            "push_tag": "推",
            "push_userid": "LionD"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9e9",
            "push_content": "信仰不足 下去吧",
            "push_ipdatetime": "04/16 17:54",
            "push_tag": "推",
            "push_userid": "gamut0202"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9e8",
            "push_content": "笑死人，民進黨搞了20年，低薪負債你們不說話，韓才幾個",
            "push_ipdatetime": "04/16 17:55",
            "push_tag": "推",
            "push_userid": "sligiho"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9e7",
            "push_content": "月你們跳出來，有事嗎？",
            "push_ipdatetime": "04/16 17:55",
            "push_tag": "→",
            "push_userid": "sligiho"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9e6",
            "push_content": "笑死，我也有記錄一家才做一個月就倒掉的店",
            "push_ipdatetime": "04/16 17:56",
            "push_tag": "推",
            "push_userid": "luke7212"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9e5",
            "push_content": "https://i.imgur.com/WZjZdYK.jpg",
            "push_ipdatetime": "04/16 17:57",
            "push_tag": "推",
            "push_userid": "ying567866"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9e4",
            "push_content": "前幾樓護駕有功",
            "push_ipdatetime": "04/16 17:57",
            "push_tag": "推",
            "push_userid": "rrazer"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9e3",
            "push_content": "原來DPP執政20年了XDDDDDDDDD",
            "push_ipdatetime": "04/16 17:57",
            "push_tag": "推",
            "push_userid": "Shinn826"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9e2",
            "push_content": "個人討厭韓  所以去夜市會避開有韓的攤子",
            "push_ipdatetime": "04/16 17:58",
            "push_tag": "推",
            "push_userid": "mrlinwng"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9e1",
            "push_content": "中資中媒強力帶風向。愛當中國人?連五毛都移民歐美去了",
            "push_ipdatetime": "04/16 17:58",
            "push_tag": "推",
            "push_userid": "garyhucc"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9e0",
            "push_content": "DPP執政高雄20年了啊！你26仔？",
            "push_ipdatetime": "04/16 17:59",
            "push_tag": "推",
            "push_userid": "sligiho"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9df",
            "push_content": "所有數據都顯示民進黨2000年執政後，台灣開始衰退，被南",
            "push_ipdatetime": "04/16 17:59",
            "push_tag": "→",
            "push_userid": "sligiho"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9de",
            "push_content": "韓反超",
            "push_ipdatetime": "04/16 17:59",
            "push_tag": "→",
            "push_userid": "sligiho"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9dd",
            "push_content": "攤商純吃韓粉或不討厭韓的客群定位吧",
            "push_ipdatetime": "04/16 17:59",
            "push_tag": "推",
            "push_userid": "mrlinwng"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9dc",
            "push_content": "ying567866的圖  哈哈",
            "push_ipdatetime": "04/16 18:00",
            "push_tag": "推",
            "push_userid": "dtlove17"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9db",
            "push_content": "多加個高雄比較好 差點誤會了",
            "push_ipdatetime": "04/16 18:00",
            "push_tag": "→",
            "push_userid": "Shinn826"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9da",
            "push_content": "http://i.imgur.com/eTK8Qpq.jpg",
            "push_ipdatetime": "04/16 18:00",
            "push_tag": "→",
            "push_userid": "sligiho"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9d9",
            "push_content": "掛含蛞蝓就是叫智障去買",
            "push_ipdatetime": "04/16 18:00",
            "push_tag": "推",
            "push_userid": "randolph80"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9d8",
            "push_content": "呵",
            "push_ipdatetime": "04/16 18:00",
            "push_tag": "推",
            "push_userid": "FiveSix911"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9d7",
            "push_content": "http://i.imgur.com/dj1qCOb.jpg",
            "push_ipdatetime": "04/16 18:00",
            "push_tag": "→",
            "push_userid": "sligiho"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9d6",
            "push_content": "2000年薪資開始凍漲",
            "push_ipdatetime": "04/16 18:00",
            "push_tag": "→",
            "push_userid": "sligiho"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9d5",
            "push_content": "",
            "push_ipdatetime": "04/16 18:00",
            "push_tag": "推",
            "push_userid": "findhksin"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9d4",
            "push_content": "在旁邊立牌  這家韓粉跟著秃子走   不知會不會被打",
            "push_ipdatetime": "04/16 18:01",
            "push_tag": "推",
            "push_userid": "tolajan"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9d3",
            "push_content": "前面好黑啊",
            "push_ipdatetime": "04/16 18:01",
            "push_tag": "推",
            "push_userid": "fragmentwing"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9d2",
            "push_content": "要不是民進黨把台灣搞到跳電，要是多幾個台積電等級的大",
            "push_ipdatetime": "04/16 18:01",
            "push_tag": "→",
            "push_userid": "sligiho"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9d1",
            "push_content": "產業，今天台灣還是屌打南韓，可惜沒電，沒辦法投資",
            "push_ipdatetime": "04/16 18:01",
            "push_tag": "→",
            "push_userid": "sligiho"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9d0",
            "push_content": "智障城市",
            "push_ipdatetime": "04/16 18:02",
            "push_tag": "推",
            "push_userid": "camebson"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9cf",
            "push_content": "垃圾瑞豐夜市還好幾攤 一定要讓牠們倒",
            "push_ipdatetime": "04/16 18:04",
            "push_tag": "推",
            "push_userid": "cheetahspeed"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9ce",
            "push_content": "之後會變拍扁麵包的下場嗎",
            "push_ipdatetime": "04/16 18:04",
            "push_tag": "推",
            "push_userid": "csyhri"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9cd",
            "push_content": "XDDD",
            "push_ipdatetime": "04/16 18:05",
            "push_tag": "推",
            "push_userid": "zxc1213"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9cc",
            "push_content": "笑死XD",
            "push_ipdatetime": "04/16 18:05",
            "push_tag": "推",
            "push_userid": "froken"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9cb",
            "push_content": "所以民進黨2000年執政開始跳電，無法投資，沒有新產業換",
            "push_ipdatetime": "04/16 18:06",
            "push_tag": "推",
            "push_userid": "sligiho"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9ca",
            "push_content": "誰執政都沒用，要是民進黨真的會治國，不會高雄20年了，",
            "push_ipdatetime": "04/16 18:06",
            "push_tag": "→",
            "push_userid": "sligiho"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9c9",
            "push_content": "除了舉債出來的美好，不會低薪負債人口流失",
            "push_ipdatetime": "04/16 18:06",
            "push_tag": "→",
            "push_userid": "sligiho"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9c8",
            "push_content": "六合夜市一堆不是？",
            "push_ipdatetime": "04/16 18:07",
            "push_tag": "推",
            "push_userid": "zuzuk"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9c7",
            "push_content": "應該是賺飽了  所以收起來",
            "push_ipdatetime": "04/16 18:07",
            "push_tag": "推",
            "push_userid": "vera0204"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9c6",
            "push_content": "跟著智障走（笑",
            "push_ipdatetime": "04/16 18:07",
            "push_tag": "推",
            "push_userid": "roy2142"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9c5",
            "push_content": "營利行為還用水管工 !?",
            "push_ipdatetime": "04/16 18:08",
            "push_tag": "推",
            "push_userid": "coldeden"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9c4",
            "push_content": "5毛崩潰",
            "push_ipdatetime": "04/16 18:08",
            "push_tag": "推",
            "push_userid": "ndtoseooqd"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9c3",
            "push_content": "推",
            "push_ipdatetime": "04/16 18:08",
            "push_tag": "推",
            "push_userid": "yangyang33"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9c2",
            "push_content": "終於看清了吧",
            "push_ipdatetime": "04/16 18:09",
            "push_tag": "推",
            "push_userid": "sogg"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9c1",
            "push_content": "在那邊消費別人 有點創意行不",
            "push_ipdatetime": "04/16 18:10",
            "push_tag": "推",
            "push_userid": "ginopun10477"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9c0",
            "push_content": "韓粉護航有用嗎？，還不趕快去買個夠，大家發大財",
            "push_ipdatetime": "04/16 18:10",
            "push_tag": "推",
            "push_userid": "espresso1"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9bf",
            "push_content": "別讓9.2韓藍教徒屎蛆不開心",
            "push_ipdatetime": "04/16 18:10",
            "push_tag": "推",
            "push_userid": "dtlove17"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9be",
            "push_content": "都挖石油發大財了 不當攤販很正常",
            "push_ipdatetime": "04/16 18:12",
            "push_tag": "推",
            "push_userid": "btmep"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9bd",
            "push_content": "因為丟臉，還有這種只有短期利益的考量，沒錢就是闢",
            "push_ipdatetime": "04/16 18:14",
            "push_tag": "推",
            "push_userid": "lost0816"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9bc",
            "push_content": "哈哈哈哈哈哈哈",
            "push_ipdatetime": "04/16 18:15",
            "push_tag": "→",
            "push_userid": "kentanoar"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9bb",
            "push_content": "賺夠了都改行了阿",
            "push_ipdatetime": "04/16 18:15",
            "push_tag": "→",
            "push_userid": "tina3"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9ba",
            "push_content": "海水退潮",
            "push_ipdatetime": "04/16 18:17",
            "push_tag": "推",
            "push_userid": "waveciou"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9b9",
            "push_content": "喜韓兒 五毛 柯糞 快來",
            "push_ipdatetime": "04/16 18:18",
            "push_tag": "推",
            "push_userid": "pjhs320279"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9b8",
            "push_content": "都發完財了提早退休不行喔？！",
            "push_ipdatetime": "04/16 18:18",
            "push_tag": "噓",
            "push_userid": "johnpotato"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9b7",
            "push_content": "過7",
            "push_ipdatetime": "04/16 18:18",
            "push_tag": "推",
            "push_userid": "peter510251"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9b6",
            "push_content": "喜韓兒",
            "push_ipdatetime": "04/16 18:19",
            "push_tag": "推",
            "push_userid": "mayday10334"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9b5",
            "push_content": "會用這種噱頭的本身就沒料難吃，才會借別人名氣拉抬",
            "push_ipdatetime": "04/16 18:19",
            "push_tag": "噓",
            "push_userid": "macocu"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9b4",
            "push_content": "吃了會變禿？！",
            "push_ipdatetime": "04/16 18:19",
            "push_tag": "噓",
            "push_userid": "OGC218"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9b3",
            "push_content": "夠無恥才敢吃",
            "push_ipdatetime": "04/16 18:20",
            "push_tag": "推",
            "push_userid": "sss1524"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9b2",
            "push_content": "先前不是說[肖像權]?",
            "push_ipdatetime": "04/16 18:21",
            "push_tag": "推",
            "push_userid": "bonte"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9b1",
            "push_content": "人家發財不做了啦",
            "push_ipdatetime": "04/16 18:21",
            "push_tag": "推",
            "push_userid": "keenzikun"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9b0",
            "push_content": "用了會被吉?",
            "push_ipdatetime": "04/16 18:21",
            "push_tag": "→",
            "push_userid": "bonte"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9af",
            "push_content": "濫用爆卦",
            "push_ipdatetime": "04/16 18:22",
            "push_tag": "噓",
            "push_userid": "aswq17558"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9ae",
            "push_content": "生意太好 忙不過來 不行喔",
            "push_ipdatetime": "04/16 18:23",
            "push_tag": "推",
            "push_userid": "window77"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9ad",
            "push_content": "換誰執政都沒用？換韓應該要有用吧，不然你選他幹嘛？",
            "push_ipdatetime": "04/16 18:23",
            "push_tag": "→",
            "push_userid": "Vedfolnir"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9ac",
            "push_content": "但目前看起來是真的沒屁用啦，蒙你所言，沒新產業就算",
            "push_ipdatetime": "04/16 18:23",
            "push_tag": "→",
            "push_userid": "Vedfolnir"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9ab",
            "push_content": "預算用完了不然你想怎樣",
            "push_ipdatetime": "04/16 18:23",
            "push_tag": "→",
            "push_userid": "RozenMaidenI"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9aa",
            "push_content": "了，還把主力放在佔比不到1%的農業上，ㄏㄏ",
            "push_ipdatetime": "04/16 18:23",
            "push_tag": "→",
            "push_userid": "Vedfolnir"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9a9",
            "push_content": "先噓版權",
            "push_ipdatetime": "04/16 18:23",
            "push_tag": "噓",
            "push_userid": "abc30918208"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9a8",
            "push_content": "",
            "push_ipdatetime": "04/16 18:24",
            "push_tag": "推",
            "push_userid": "antivenom"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9a7",
            "push_content": "去吃要很有勇氣",
            "push_ipdatetime": "04/16 18:25",
            "push_tag": "推",
            "push_userid": "jamespon1"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9a6",
            "push_content": "笑死哈哈",
            "push_ipdatetime": "04/16 18:27",
            "push_tag": "推",
            "push_userid": "kipi91718"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9a5",
            "push_content": "還好吧 選票那麼多",
            "push_ipdatetime": "04/16 18:28",
            "push_tag": "→",
            "push_userid": "rainbow321"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9a4",
            "push_content": "可悲",
            "push_ipdatetime": "04/16 18:28",
            "push_tag": "噓",
            "push_userid": "hlb5828"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9a3",
            "push_content": "支那賤畜怎麼都不捧場，不買舉報你們台獨喔",
            "push_ipdatetime": "04/16 18:28",
            "push_tag": "推",
            "push_userid": "deleteme"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9a2",
            "push_content": "智障韓粉",
            "push_ipdatetime": "04/16 18:28",
            "push_tag": "推",
            "push_userid": "cca1109"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9a1",
            "push_content": "韓粉護主心切",
            "push_ipdatetime": "04/16 18:31",
            "push_tag": "→",
            "push_userid": "MKIU"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a9a0",
            "push_content": "高雄人沒什麼資格吃飯",
            "push_ipdatetime": "04/16 18:32",
            "push_tag": "推",
            "push_userid": "clkdtm32"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a99f",
            "push_content": "1450真忙，左打韓導，右打賴神，腳踢郭董",
            "push_ipdatetime": "04/16 18:33",
            "push_tag": "噓",
            "push_userid": "s213092921"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a99e",
            "push_content": "早該看透了！ 韓只會來騙選票，不會做事的",
            "push_ipdatetime": "04/16 18:33",
            "push_tag": "噓",
            "push_userid": "abxyz4563"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a99d",
            "push_content": "綠色賤畜表示興奮，韓導終於過氣了！",
            "push_ipdatetime": "04/16 18:34",
            "push_tag": "→",
            "push_userid": "s213092921"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a99c",
            "push_content": "韓兒崩潰潮來了！",
            "push_ipdatetime": "04/16 18:35",
            "push_tag": "→",
            "push_userid": "david624"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a99b",
            "push_content": "不工作整天幻想發大財，餓死都不奇怪",
            "push_ipdatetime": "04/16 18:35",
            "push_tag": "→",
            "push_userid": "CyBw"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a99a",
            "push_content": "怎麼有吸韓兒不敢看馬英九那八年",
            "push_ipdatetime": "04/16 18:36",
            "push_tag": "推",
            "push_userid": "silentence"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a999",
            "push_content": "http://i.imgur.com/vzZCPx2.jpg   hahacha又是分身帳",
            "push_ipdatetime": "04/16 18:36",
            "push_tag": "噓",
            "push_userid": "s213092921"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a998",
            "push_content": "笑死",
            "push_ipdatetime": "04/16 18:36",
            "push_tag": "推",
            "push_userid": "arrc21"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a997",
            "push_content": "號啊嘻嘻",
            "push_ipdatetime": "04/16 18:36",
            "push_tag": "→",
            "push_userid": "s213092921"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a996",
            "push_content": "想知道中天這篇會怎麼凹",
            "push_ipdatetime": "04/16 18:37",
            "push_tag": "推",
            "push_userid": "vegout"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a995",
            "push_content": "那個瑪利歐可以順便檢舉一波",
            "push_ipdatetime": "04/16 18:37",
            "push_tag": "推",
            "push_userid": "q2520q"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a994",
            "push_content": "ncc別再罰中天了 讓他們報一下 做一些總統夢 韓粉笑你沒",
            "push_ipdatetime": "04/16 18:37",
            "push_tag": "推",
            "push_userid": "realbout"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a993",
            "push_content": "本版兩篇剛好都爆文你敢信？八成又是分身帶風向",
            "push_ipdatetime": "04/16 18:37",
            "push_tag": "→",
            "push_userid": "s213092921"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a992",
            "push_content": "有做夢的勇氣",
            "push_ipdatetime": "04/16 18:37",
            "push_tag": "→",
            "push_userid": "realbout"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a991",
            "push_content": "原來智障也會發現自己是智障",
            "push_ipdatetime": "04/16 18:37",
            "push_tag": "推",
            "push_userid": "Coffeewater"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a990",
            "push_content": "吃是最沒政治因素的東西了 說大話發大財那先餓死吧XX",
            "push_ipdatetime": "04/16 18:38",
            "push_tag": "→",
            "push_userid": "silentence"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a98f",
            "push_content": "哈哈哈",
            "push_ipdatetime": "04/16 18:39",
            "push_tag": "推",
            "push_userid": "userpeter"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a98e",
            "push_content": "會信韓導真的是智障",
            "push_ipdatetime": "04/16 18:39",
            "push_tag": "推",
            "push_userid": "Coffeewater"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a98d",
            "push_content": "夢幻韓總 泡影韓總",
            "push_ipdatetime": "04/16 18:39",
            "push_tag": "推",
            "push_userid": "jidytri815"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a98c",
            "push_content": "被騙久了總會醒",
            "push_ipdatetime": "04/16 18:39",
            "push_tag": "推",
            "push_userid": "adroddick"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a98b",
            "push_content": "終於懂發大財的人是官商不是洨老百姓了ㄅ",
            "push_ipdatetime": "04/16 18:39",
            "push_tag": "推",
            "push_userid": "m99601196"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a98a",
            "push_content": "哈哈哈哈哈",
            "push_ipdatetime": "04/16 18:40",
            "push_tag": "推",
            "push_userid": "leehej"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a989",
            "push_content": "攤販賺辛苦錢  嘲諷他們做啥",
            "push_ipdatetime": "04/16 18:40",
            "push_tag": "噓",
            "push_userid": "apc3350711"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a988",
            "push_content": "爽啊欠嘲諷啊",
            "push_ipdatetime": "04/16 18:42",
            "push_tag": "推",
            "push_userid": "TR104"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a987",
            "push_content": "賺飽了",
            "push_ipdatetime": "04/16 18:47",
            "push_tag": "推",
            "push_userid": "charmingpink"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a986",
            "push_content": "北漂都不敢回高雄，還期望發財勒",
            "push_ipdatetime": "04/16 18:47",
            "push_tag": "推",
            "push_userid": "olikm"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a985",
            "push_content": "笑死 五毛吹起來的 韓粉當真",
            "push_ipdatetime": "04/16 18:47",
            "push_tag": "→",
            "push_userid": "TWidpd"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a984",
            "push_content": "半張35還不發大財",
            "push_ipdatetime": "04/16 18:48",
            "push_tag": "推",
            "push_userid": "xeme1996"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a983",
            "push_content": "韓流發威",
            "push_ipdatetime": "04/16 18:49",
            "push_tag": "推",
            "push_userid": "kyouya"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a982",
            "push_content": "前幾樓好快",
            "push_ipdatetime": "04/16 18:49",
            "push_tag": "推",
            "push_userid": "leo125160909"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a981",
            "push_content": "wwwww",
            "push_ipdatetime": "04/16 18:50",
            "push_tag": "推",
            "push_userid": "exilianstar"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a980",
            "push_content": "哈哈！韓粉還不快買爆",
            "push_ipdatetime": "04/16 18:50",
            "push_tag": "推",
            "push_userid": "z8903"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a97f",
            "push_content": "賺夠準備移民了八ㄏㄏ",
            "push_ipdatetime": "04/16 18:51",
            "push_tag": "推",
            "push_userid": "atoiytoiy456"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a97e",
            "push_content": "發大財喔 呵",
            "push_ipdatetime": "04/16 18:53",
            "push_tag": "推",
            "push_userid": "visvim88"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a97d",
            "push_content": "全台首富 高雄發大財",
            "push_ipdatetime": "04/16 18:53",
            "push_tag": "推",
            "push_userid": "LoveStreet"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a97c",
            "push_content": "有韓粉支持還會倒喔哈哈哈",
            "push_ipdatetime": "04/16 18:54",
            "push_tag": "推",
            "push_userid": "SacrificesPi"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a97b",
            "push_content": "至少這些人換了一張叫改變的空頭支票啊 賺了啦",
            "push_ipdatetime": "04/16 18:56",
            "push_tag": "噓",
            "push_userid": "silentence"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a97a",
            "push_content": "身為高雄人 我們家是掛韓廣告的絕不光顧",
            "push_ipdatetime": "04/16 18:58",
            "push_tag": "推",
            "push_userid": "mobila"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a979",
            "push_content": "發大財啊",
            "push_ipdatetime": "04/16 19:00",
            "push_tag": "→",
            "push_userid": "leobox"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a978",
            "push_content": "感覺太LOW了...如果我要買東西會儘量避免",
            "push_ipdatetime": "04/16 19:00",
            "push_tag": "推",
            "push_userid": "momogo628"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a977",
            "push_content": "過年時，駁二有掛韓的攤販都沒人，甚至還有掛馬的哈哈哈哈",
            "push_ipdatetime": "04/16 19:04",
            "push_tag": "推",
            "push_userid": "r49"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a976",
            "push_content": "三立今晚新聞頭條",
            "push_ipdatetime": "04/16 19:07",
            "push_tag": "噓",
            "push_userid": "giaour"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a975",
            "push_content": "發大財了誰還要工作，在家享清福囉",
            "push_ipdatetime": "04/16 19:07",
            "push_tag": "推",
            "push_userid": "FLy60169"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a974",
            "push_content": "XDDDDD",
            "push_ipdatetime": "04/16 19:08",
            "push_tag": "推",
            "push_userid": "stw0975"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a973",
            "push_content": "哈哈",
            "push_ipdatetime": "04/16 19:09",
            "push_tag": "推",
            "push_userid": "kmhm"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a972",
            "push_content": "蔡導賴導感到欣慰",
            "push_ipdatetime": "04/16 19:10",
            "push_tag": "噓",
            "push_userid": "chen5512"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a971",
            "push_content": "韓粉不夠義氣",
            "push_ipdatetime": "04/16 19:10",
            "push_tag": "推",
            "push_userid": "indigostar"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a970",
            "push_content": "智障喜韓兒還不快買",
            "push_ipdatetime": "04/16 19:10",
            "push_tag": "推",
            "push_userid": "YAUN"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a96f",
            "push_content": "韓粉入坑快 退坑也要快點喔 加油",
            "push_ipdatetime": "04/16 19:12",
            "push_tag": "推",
            "push_userid": "freesf"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a96e",
            "push_content": "一張70賣給鬼喔 看到什麼禿頭什麼魚的就反胃",
            "push_ipdatetime": "04/16 19:12",
            "push_tag": "推",
            "push_userid": "lim98989"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a96d",
            "push_content": "這個炙燒韓國魚的老闆好像是台南人（？ 有什麼挑大師的名號",
            "push_ipdatetime": "04/16 19:14",
            "push_tag": "推",
            "push_userid": "r49"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a96c",
            "push_content": "該不會是放馬莉歐被老任",
            "push_ipdatetime": "04/16 19:14",
            "push_tag": "推",
            "push_userid": "kazenoryu"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a96b",
            "push_content": "還有一天到晚都鎖在中天的 也都不要去最好",
            "push_ipdatetime": "04/16 19:15",
            "push_tag": "推",
            "push_userid": "silentence"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a96a",
            "push_content": "「凡購買套餐送飲料一杯」還敢寫哦？套餐附飲料不是基本",
            "push_ipdatetime": "04/16 19:16",
            "push_tag": "→",
            "push_userid": "wanscur"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a969",
            "push_content": "騙肖 我家隔壁鴨肉活得好好的",
            "push_ipdatetime": "04/16 19:16",
            "push_tag": "噓",
            "push_userid": "tttonyyyy"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a968",
            "push_content": "？",
            "push_ipdatetime": "04/16 19:16",
            "push_tag": "→",
            "push_userid": "wanscur"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a967",
            "push_content": "韓粉：我們抵制不來買的顧客",
            "push_ipdatetime": "04/16 19:17",
            "push_tag": "推",
            "push_userid": "gvmlve"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a966",
            "push_content": "那種小吃套餐要120還沒飲料，活該倒閉",
            "push_ipdatetime": "04/16 19:18",
            "push_tag": "→",
            "push_userid": "JeffMnO4"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a965",
            "push_content": "可能改賣總統匆游餅",
            "push_ipdatetime": "04/16 19:19",
            "push_tag": "推",
            "push_userid": "applepies"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a964",
            "push_content": "黨工出差結束回台北了啦，靠北喔",
            "push_ipdatetime": "04/16 19:22",
            "push_tag": "噓",
            "push_userid": "maro1357"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a963",
            "push_content": "假新聞勿信",
            "push_ipdatetime": "04/16 19:26",
            "push_tag": "噓",
            "push_userid": "DurianLover"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a962",
            "push_content": "韓國魚那攤感覺就是被貪小便宜韓粉吃垮",
            "push_ipdatetime": "04/16 19:29",
            "push_tag": "推",
            "push_userid": "brian980466"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a961",
            "push_content": "是要回暖了嗎？",
            "push_ipdatetime": "04/16 19:30",
            "push_tag": "推",
            "push_userid": "c33uviiip0cp"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a960",
            "push_content": "可憐",
            "push_ipdatetime": "04/16 19:30",
            "push_tag": "推",
            "push_userid": "vicowin"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a95f",
            "push_content": "韓粉還不去消費 笑死",
            "push_ipdatetime": "04/16 19:34",
            "push_tag": "推",
            "push_userid": "ssivart"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a95e",
            "push_content": "QQ",
            "push_ipdatetime": "04/16 19:35",
            "push_tag": "推",
            "push_userid": "rpg666123"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a95d",
            "push_content": "選舉時說一碗魯肉飯一瓶礦泉水，結果居然是吃套餐",
            "push_ipdatetime": "04/16 19:35",
            "push_tag": "噓",
            "push_userid": "mengche"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a95c",
            "push_content": "ㄏㄏ",
            "push_ipdatetime": "04/16 19:35",
            "push_tag": "推",
            "push_userid": "Windcws9Z"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a95b",
            "push_content": "早變中國高雄首富了 不換招牌怕過勞沒命花 懂？",
            "push_ipdatetime": "04/16 19:36",
            "push_tag": "推",
            "push_userid": "wawolo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a95a",
            "push_content": "這種腦粉的攤子身為高雄人的我完全不會去消費~有夠丟臉",
            "push_ipdatetime": "04/16 19:39",
            "push_tag": "推",
            "push_userid": "wajolihi"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a959",
            "push_content": "！",
            "push_ipdatetime": "04/16 19:39",
            "push_tag": "→",
            "push_userid": "wajolihi"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a958",
            "push_content": "發財發到家裡沒地方裝錢了，懂？",
            "push_ipdatetime": "04/16 19:40",
            "push_tag": "推",
            "push_userid": "pulesiya"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a957",
            "push_content": "賺太多 人出去了",
            "push_ipdatetime": "04/16 19:40",
            "push_tag": "推",
            "push_userid": "AUwalker"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a956",
            "push_content": "幹你娘好醜",
            "push_ipdatetime": "04/16 19:41",
            "push_tag": "推",
            "push_userid": "dripcoffee"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a955",
            "push_content": "跟著傻禿走 這麼難聽也能寫在招牌",
            "push_ipdatetime": "04/16 19:44",
            "push_tag": "推",
            "push_userid": "Knudsen"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a954",
            "push_content": "前幾樓真的好快",
            "push_ipdatetime": "04/16 19:45",
            "push_tag": "推",
            "push_userid": "farnorth"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a953",
            "push_content": "韓流=智障",
            "push_ipdatetime": "04/16 19:46",
            "push_tag": "推",
            "push_userid": "lineshape"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a952",
            "push_content": "888888",
            "push_ipdatetime": "04/16 19:47",
            "push_tag": "→",
            "push_userid": "notneme159"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a951",
            "push_content": "UCCU",
            "push_ipdatetime": "04/16 19:48",
            "push_tag": "推",
            "push_userid": "mayfifth"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a950",
            "push_content": "商人發現沒商機 閃得比誰都快",
            "push_ipdatetime": "04/16 19:51",
            "push_tag": "推",
            "push_userid": "mogli"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a94f",
            "push_content": "應該發大財了才要收掉吧！高調叫中夭去平反一下！",
            "push_ipdatetime": "04/16 19:51",
            "push_tag": "推",
            "push_userid": "bbceery"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a94e",
            "push_content": "爆憨",
            "push_ipdatetime": "04/16 19:51",
            "push_tag": "推",
            "push_userid": "mosw"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a94d",
            "push_content": "笑死",
            "push_ipdatetime": "04/16 19:52",
            "push_tag": "推",
            "push_userid": "z71954011"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a94c",
            "push_content": "我看到那猥瑣的光頭logo就不會買了",
            "push_ipdatetime": "04/16 19:52",
            "push_tag": "推",
            "push_userid": "crazyhoho"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a94b",
            "push_content": "吃了變草包",
            "push_ipdatetime": "04/16 19:54",
            "push_tag": "噓",
            "push_userid": "haioshi"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a94a",
            "push_content": "活該去死",
            "push_ipdatetime": "04/16 19:55",
            "push_tag": "推",
            "push_userid": "x83187"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a949",
            "push_content": "半張35一張70喔 我在天龍國買 才半張30一張60",
            "push_ipdatetime": "04/16 19:57",
            "push_tag": "推",
            "push_userid": "mytoychiu"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a948",
            "push_content": "韓粉快進攻，抵制惹阿！",
            "push_ipdatetime": "04/16 19:58",
            "push_tag": "推",
            "push_userid": "paul5566"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a947",
            "push_content": "高雄人比智障的",
            "push_ipdatetime": "04/16 19:59",
            "push_tag": "推",
            "push_userid": "cool911234"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a946",
            "push_content": "滷肉飯70我還是去吃鬍鬚張吧",
            "push_ipdatetime": "04/16 19:59",
            "push_tag": "推",
            "push_userid": "Charley2309"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a945",
            "push_content": "老闆賺一番了",
            "push_ipdatetime": "04/16 20:00",
            "push_tag": "推",
            "push_userid": "jialin6666"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a944",
            "push_content": "可是你還在貼韓國瑜阿",
            "push_ipdatetime": "04/16 20:02",
            "push_tag": "推",
            "push_userid": "assman799"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a943",
            "push_content": "盜圖的喜韓兒  喜韓兒果然都是免費仔",
            "push_ipdatetime": "04/16 20:05",
            "push_tag": "推",
            "push_userid": "zz71"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a942",
            "push_content": "趕快來去任天堂檢舉  爽死你 哈哈哈",
            "push_ipdatetime": "04/16 20:07",
            "push_tag": "推",
            "push_userid": "ilpqvm"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a941",
            "push_content": "假新聞氾濫",
            "push_ipdatetime": "04/16 20:15",
            "push_tag": "噓",
            "push_userid": "DurianLover"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a940",
            "push_content": "發大財了，退休收攤合理",
            "push_ipdatetime": "04/16 20:15",
            "push_tag": "推",
            "push_userid": "super0949"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a93f",
            "push_content": "大家都發大財吃高級餐廳了，窮人才吃路邊攤",
            "push_ipdatetime": "04/16 20:16",
            "push_tag": "推",
            "push_userid": "chysh"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a93e",
            "push_content": "為什麼變馬力歐啦 笑死",
            "push_ipdatetime": "04/16 20:16",
            "push_tag": "→",
            "push_userid": "Pixis"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a93d",
            "push_content": "笑死",
            "push_ipdatetime": "04/16 20:17",
            "push_tag": "→",
            "push_userid": "a2603"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a93c",
            "push_content": "不就為了趕熱潮，過了就撤下很正常不是，這樣也能高潮",
            "push_ipdatetime": "04/16 20:18",
            "push_tag": "噓",
            "push_userid": "frankexs"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a93b",
            "push_content": "笑死",
            "push_ipdatetime": "04/16 20:19",
            "push_tag": "→",
            "push_userid": "weitai1993"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a93a",
            "push_content": "都說電視一堆韓。結果PTT也是一堆韓",
            "push_ipdatetime": "04/16 20:21",
            "push_tag": "→",
            "push_userid": "joky2001"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a939",
            "push_content": "很正常 見風轉舵",
            "push_ipdatetime": "04/16 20:21",
            "push_tag": "推",
            "push_userid": "smmaot"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a938",
            "push_content": "已經發大財不用做了",
            "push_ipdatetime": "04/16 20:22",
            "push_tag": "推",
            "push_userid": "DarkHolbach"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a937",
            "push_content": "我認真看了照片市長蔥油餅改成了好吃蔥油餅，真是可憐",
            "push_ipdatetime": "04/16 20:24",
            "push_tag": "推",
            "push_userid": "pipishan"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a936",
            "push_content": "哈哈哈可憐",
            "push_ipdatetime": "04/16 20:24",
            "push_tag": "推",
            "push_userid": "mooming"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a935",
            "push_content": "趕快新聞連播整天救救商家",
            "push_ipdatetime": "04/16 20:25",
            "push_tag": "推",
            "push_userid": "Stitchyu"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a934",
            "push_content": "賺夠了換老闆？還是韓總沒來代言？",
            "push_ipdatetime": "04/16 20:28",
            "push_tag": "推",
            "push_userid": "chuntin36"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a933",
            "push_content": "對比韓導後續一連串失序的行為，真的蠻丟臉的啊！",
            "push_ipdatetime": "04/16 20:29",
            "push_tag": "推",
            "push_userid": "SkyReaching"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a932",
            "push_content": "上次去旗津，店門有韓導旗子的真的沒人買",
            "push_ipdatetime": "04/16 20:32",
            "push_tag": "推",
            "push_userid": "vinsh"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a931",
            "push_content": "笑死 韓粉好急喔",
            "push_ipdatetime": "04/16 20:33",
            "push_tag": "推",
            "push_userid": "j10joey"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a930",
            "push_content": "馬力歐???",
            "push_ipdatetime": "04/16 20:35",
            "push_tag": "推",
            "push_userid": "suisp"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a92f",
            "push_content": "XD",
            "push_ipdatetime": "04/16 20:36",
            "push_tag": "推",
            "push_userid": "ooeamoo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a92e",
            "push_content": "好貴喔",
            "push_ipdatetime": "04/16 20:38",
            "push_tag": "推",
            "push_userid": "a060119"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a92d",
            "push_content": "好了啦",
            "push_ipdatetime": "04/16 20:39",
            "push_tag": "噓",
            "push_userid": "nksv526"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a92c",
            "push_content": "店名就先排除挺綠的那一半客人 味道又普通的話必倒",
            "push_ipdatetime": "04/16 20:43",
            "push_tag": "推",
            "push_userid": "srxteam0935"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a92b",
            "push_content": "中和這邊一張蔥油餅才50",
            "push_ipdatetime": "04/16 20:44",
            "push_tag": "推",
            "push_userid": "cutesnow"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a92a",
            "push_content": "韓漸漸被看破手腳，但為什麼民調有40％？難以理解",
            "push_ipdatetime": "04/16 20:45",
            "push_tag": "→",
            "push_userid": "cutesnow"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a929",
            "push_content": "http://i.imgur.com/g5lohti.jpg   這間不知能撐多久",
            "push_ipdatetime": "04/16 20:46",
            "push_tag": "推",
            "push_userid": "chrome"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a928",
            "push_content": "比蛋塔還快退燒 笑死",
            "push_ipdatetime": "04/16 20:49",
            "push_tag": "推",
            "push_userid": "C6H8O7"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a927",
            "push_content": "店名瞬間少一半綠的客人，這樣不倒才怪",
            "push_ipdatetime": "04/16 20:53",
            "push_tag": "推",
            "push_userid": "sligiho"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a926",
            "push_content": "蔥油餅70？ 不倒才怪",
            "push_ipdatetime": "04/16 20:53",
            "push_tag": "→",
            "push_userid": "u9912114"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a925",
            "push_content": "哀   就跟高雄的未來一樣  .......",
            "push_ipdatetime": "04/16 20:56",
            "push_tag": "推",
            "push_userid": "TheDragonBug"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a924",
            "push_content": "就民不聊生啊",
            "push_ipdatetime": "04/16 20:56",
            "push_tag": "推",
            "push_userid": "hoodoo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a923",
            "push_content": "中天快來抄",
            "push_ipdatetime": "04/16 21:01",
            "push_tag": "推",
            "push_userid": "saadafa"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a922",
            "push_content": "wwwww",
            "push_ipdatetime": "04/16 21:01",
            "push_tag": "推",
            "push_userid": "UrPlAmVes17"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a921",
            "push_content": "海水退了",
            "push_ipdatetime": "04/16 21:03",
            "push_tag": "推",
            "push_userid": "s98091028"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a920",
            "push_content": "真以為了不起，沾光就發大財啦",
            "push_ipdatetime": "04/16 21:06",
            "push_tag": "推",
            "push_userid": "espresso1"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a91f",
            "push_content": "XD",
            "push_ipdatetime": "04/16 21:08",
            "push_tag": "推",
            "push_userid": "giants406"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a91e",
            "push_content": "被韓粉知道又要被抵制了科科",
            "push_ipdatetime": "04/16 21:11",
            "push_tag": "推",
            "push_userid": "NmoG"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a91d",
            "push_content": "這個痛 高雄人感受最深刻",
            "push_ipdatetime": "04/16 21:12",
            "push_tag": "推",
            "push_userid": "luweilun"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a91c",
            "push_content": "正常啊不意外",
            "push_ipdatetime": "04/16 21:12",
            "push_tag": "推",
            "push_userid": "jack41402"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a91b",
            "push_content": "沒付錢了幹嘛幫你打廣告   ㄎㄎ",
            "push_ipdatetime": "04/16 21:15",
            "push_tag": "推",
            "push_userid": "h123734"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a91a",
            "push_content": "發大財",
            "push_ipdatetime": "04/16 21:15",
            "push_tag": "推",
            "push_userid": "homerunball"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a919",
            "push_content": "大家都收攤去種水果給韓導簽MOU了啦，沒事沒事",
            "push_ipdatetime": "04/16 21:15",
            "push_tag": "推",
            "push_userid": "citycaca"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a918",
            "push_content": "拒吃白賊魚2.0",
            "push_ipdatetime": "04/16 21:20",
            "push_tag": "噓",
            "push_userid": "fkt12"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a917",
            "push_content": "拿他當招牌全都拒買",
            "push_ipdatetime": "04/16 21:20",
            "push_tag": "推",
            "push_userid": "insist0511"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a916",
            "push_content": "發財到不用做惹 傻傻的你",
            "push_ipdatetime": "04/16 21:21",
            "push_tag": "推",
            "push_userid": "ted01234567"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a915",
            "push_content": "馬力歐應該侵權",
            "push_ipdatetime": "04/16 21:25",
            "push_tag": "噓",
            "push_userid": "dodo11060"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a914",
            "push_content": "發財了退休啦",
            "push_ipdatetime": "04/16 21:26",
            "push_tag": "推",
            "push_userid": "tmwolf"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a913",
            "push_content": "有沒有韓導被看破手腳，結果民調持續爬升的八卦？？",
            "push_ipdatetime": "04/16 21:28",
            "push_tag": "→",
            "push_userid": "s213092921"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a912",
            "push_content": "那個瑪莉歐這樣亂盜用圖片實在很不舒服",
            "push_ipdatetime": "04/16 21:30",
            "push_tag": "推",
            "push_userid": "ENCOREH33456"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a911",
            "push_content": "海水退了啊",
            "push_ipdatetime": "04/16 21:33",
            "push_tag": "推",
            "push_userid": "capazek"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a910",
            "push_content": "喊倒就走下神壇了！！",
            "push_ipdatetime": "04/16 21:33",
            "push_tag": "推",
            "push_userid": "kazamitaketo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a90f",
            "push_content": "肉燥飯套餐150",
            "push_ipdatetime": "04/16 21:35",
            "push_tag": "噓",
            "push_userid": "ENCOREH33456"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a90e",
            "push_content": "哭哭 票房毒藥",
            "push_ipdatetime": "04/16 21:45",
            "push_tag": "推",
            "push_userid": "s5517821"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a90d",
            "push_content": "顆顆 不意外 不過如果不是黨工 每天關注這種雞毛蒜皮的事情",
            "push_ipdatetime": "04/16 21:45",
            "push_tag": "推",
            "push_userid": "burly"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a90c",
            "push_content": "不累嗎？",
            "push_ipdatetime": "04/16 21:45",
            "push_tag": "→",
            "push_userid": "burly"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a90b",
            "push_content": "合約到期",
            "push_ipdatetime": "04/16 21:48",
            "push_tag": "推",
            "push_userid": "XDDDpupu5566"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a90a",
            "push_content": "東森還在每天韓總民調第一名",
            "push_ipdatetime": "04/16 21:50",
            "push_tag": "推",
            "push_userid": "panachiao"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a909",
            "push_content": "我發現 你是怎樣的人 你就會覺得韓國瑜是怎樣的人",
            "push_ipdatetime": "04/16 21:51",
            "push_tag": "推",
            "push_userid": "straggler7"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a908",
            "push_content": "已經發大財退休了",
            "push_ipdatetime": "04/16 22:01",
            "push_tag": "推",
            "push_userid": "q123038468"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a907",
            "push_content": "蔥油餅一張70 XDD",
            "push_ipdatetime": "04/16 22:05",
            "push_tag": "推",
            "push_userid": "Cybershit"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a906",
            "push_content": "ㄏ",
            "push_ipdatetime": "04/16 22:12",
            "push_tag": "→",
            "push_userid": "peter105096"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a905",
            "push_content": "哈哈哈",
            "push_ipdatetime": "04/16 22:13",
            "push_tag": "推",
            "push_userid": "silverwu"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a904",
            "push_content": "沒給錢 不給打廣告了？",
            "push_ipdatetime": "04/16 22:15",
            "push_tag": "推",
            "push_userid": "superbatman"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a903",
            "push_content": "嘻",
            "push_ipdatetime": "04/16 22:17",
            "push_tag": "→",
            "push_userid": "ya123yo"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a902",
            "push_content": "支那賤畜五毛崩潰狂噓",
            "push_ipdatetime": "04/16 22:21",
            "push_tag": "推",
            "push_userid": "songyy2003"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a901",
            "push_content": "發大財 高雄沒人吃小吃了啦",
            "push_ipdatetime": "04/16 22:26",
            "push_tag": "推",
            "push_userid": "EulerFormula"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a900",
            "push_content": "別為難小販了，人家也只是想搏點關注作生意，又沒害誰",
            "push_ipdatetime": "04/16 22:26",
            "push_tag": "推",
            "push_userid": "Tatsuya72"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8ff",
            "push_content": "韓粉要扣薪了",
            "push_ipdatetime": "04/16 22:29",
            "push_tag": "推",
            "push_userid": "thomaschion"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8fe",
            "push_content": "廢物草包 我如果是高雄人早就羞愧到自殺了",
            "push_ipdatetime": "04/16 22:31",
            "push_tag": "推",
            "push_userid": "mraznice"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8fd",
            "push_content": "笑死XDD",
            "push_ipdatetime": "04/16 22:34",
            "push_tag": "推",
            "push_userid": "gravity5678"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8fc",
            "push_content": "推",
            "push_ipdatetime": "04/16 22:35",
            "push_tag": "推",
            "push_userid": "spursdog21"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8fb",
            "push_content": "哈",
            "push_ipdatetime": "04/16 22:41",
            "push_tag": "→",
            "push_userid": "leongt"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8fa",
            "push_content": "瑪莉歐有買版權嗎？我看絕對沒有",
            "push_ipdatetime": "04/16 22:42",
            "push_tag": "噓",
            "push_userid": "barttien"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8f9",
            "push_content": "低能 笑死",
            "push_ipdatetime": "04/16 22:43",
            "push_tag": "推",
            "push_userid": "wildcat5566"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8f8",
            "push_content": "滷肉飯60? 當人家盤子嗎？",
            "push_ipdatetime": "04/16 22:52",
            "push_tag": "噓",
            "push_userid": "wenliao912"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8f7",
            "push_content": "不要玷汙我家老瑪 嘔嘔嘔",
            "push_ipdatetime": "04/16 23:01",
            "push_tag": "噓",
            "push_userid": "isaka"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8f6",
            "push_content": "推",
            "push_ipdatetime": "04/16 23:12",
            "push_tag": "推",
            "push_userid": "interrupt1"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8f5",
            "push_content": "看你的文把韓粉跟柯支持者放在一起就是不爽",
            "push_ipdatetime": "04/16 23:21",
            "push_tag": "噓",
            "push_userid": "harry881210"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8f4",
            "push_content": "魯肉飯60真的發大財",
            "push_ipdatetime": "04/16 23:26",
            "push_tag": "推",
            "push_userid": "Castle88654"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8f3",
            "push_content": "智障發威",
            "push_ipdatetime": "04/16 23:31",
            "push_tag": "推",
            "push_userid": "MARTINA3016"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8f2",
            "push_content": "媽的寧願去吃屎",
            "push_ipdatetime": "04/16 23:35",
            "push_tag": "噓",
            "push_userid": "j7419595"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8f1",
            "push_content": "笑死",
            "push_ipdatetime": "04/16 23:37",
            "push_tag": "推",
            "push_userid": "ymx3xc"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8f0",
            "push_content": "看到放中夭的餐廳都不想進去了",
            "push_ipdatetime": "04/16 23:37",
            "push_tag": "推",
            "push_userid": "DR1234"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8ef",
            "push_content": "黑心形象深植人民心中",
            "push_ipdatetime": "04/16 23:39",
            "push_tag": "推",
            "push_userid": "bightv19018"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8ee",
            "push_content": "攤販經濟崩盤後發現啥都救不起來",
            "push_ipdatetime": "04/16 23:48",
            "push_tag": "→",
            "push_userid": "bluu"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8ed",
            "push_content": "韓流發威發不停",
            "push_ipdatetime": "04/16 23:50",
            "push_tag": "推",
            "push_userid": "qooprincess"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8ec",
            "push_content": "截圖哥 心疼完tc 趕場心疼韓導啊www",
            "push_ipdatetime": "04/16 23:55",
            "push_tag": "推",
            "push_userid": "xiaoyao"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8eb",
            "push_content": "喜韓兒快滾去中國拱韓導逼宮習包子",
            "push_ipdatetime": "04/16 23:59",
            "push_tag": "→",
            "push_userid": "williamhyw"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8ea",
            "push_content": "最後一張是義大世界吧",
            "push_ipdatetime": "04/16 23:59",
            "push_tag": "推",
            "push_userid": "wlt"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8e9",
            "push_content": "最後一張快閃最後一日是甚麼意思？",
            "push_ipdatetime": "04/17 00:00",
            "push_tag": "推",
            "push_userid": "soyjay"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8e8",
            "push_content": "ㄎ",
            "push_ipdatetime": "04/17 00:06",
            "push_tag": "推",
            "push_userid": "abc53"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8e7",
            "push_content": "韓流發威 攤販紛紛收攤XD",
            "push_ipdatetime": "04/17 00:11",
            "push_tag": "推",
            "push_userid": "charles03292"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8e6",
            "push_content": "政黑畜生還不趕快去搶救 不是很秋？？",
            "push_ipdatetime": "04/17 00:11",
            "push_tag": "噓",
            "push_userid": "woodypei"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8e5",
            "push_content": "口號唬爛王:這是惡意中傷",
            "push_ipdatetime": "04/17 00:15",
            "push_tag": "推",
            "push_userid": "parkerlived"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8e4",
            "push_content": "希望三立去問他XXXD",
            "push_ipdatetime": "04/17 00:17",
            "push_tag": "→",
            "push_userid": "seedboxs"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8e3",
            "push_content": "好可悲",
            "push_ipdatetime": "04/17 00:19",
            "push_tag": "噓",
            "push_userid": "getlonely"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8e2",
            "push_content": "抱歉，真的反胃，那思想不是靠食物本身就想賺錢，跟去",
            "push_ipdatetime": "04/17 00:25",
            "push_tag": "噓",
            "push_userid": "khst3man"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8e1",
            "push_content": "中國舔共就想賺錢好像。",
            "push_ipdatetime": "04/17 00:25",
            "push_tag": "→",
            "push_userid": "khst3man"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8e0",
            "push_content": "韓粉只會吃屎啊食物當然不吃",
            "push_ipdatetime": "04/17 00:42",
            "push_tag": "推",
            "push_userid": "fizik"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8df",
            "push_content": "笑死，喜韓兒呢？？趕快去支持啊",
            "push_ipdatetime": "04/17 00:45",
            "push_tag": "推",
            "push_userid": "joe2233344"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8de",
            "push_content": "小賴不是已經說綠色有網軍？",
            "push_ipdatetime": "04/17 01:13",
            "push_tag": "噓",
            "push_userid": "chiayu0211"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8dd",
            "push_content": "韓粉真的自己無腦還要拖整個台灣下水",
            "push_ipdatetime": "04/17 01:16",
            "push_tag": "推",
            "push_userid": "a22328833"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8dc",
            "push_content": "高雄市長重選，垃圾媒體趕快滾去支那國",
            "push_ipdatetime": "04/17 01:44",
            "push_tag": "推",
            "push_userid": "lppllp123432"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8db",
            "push_content": "為什麼要造謠呢 韓粉都賺飽飽的好嗎",
            "push_ipdatetime": "04/17 02:00",
            "push_tag": "推",
            "push_userid": "NICKSHOW"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8da",
            "push_content": "＝＝＝三民自該做專訪了＝＝＝",
            "push_ipdatetime": "04/17 02:14",
            "push_tag": "推",
            "push_userid": "koreawargod"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8d9",
            "push_content": "被覺得丟臉的高雄人嫌礙眼了嗎?",
            "push_ipdatetime": "04/17 03:03",
            "push_tag": "推",
            "push_userid": "blackbob"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8d8",
            "push_content": "XDDD",
            "push_ipdatetime": "04/17 03:54",
            "push_tag": "推",
            "push_userid": "rainsmile"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8d7",
            "push_content": "真的賺太多 數錢數到手抽筋差點殘廢住院只好撤掉啦",
            "push_ipdatetime": "04/17 04:30",
            "push_tag": "推",
            "push_userid": "aaron68032"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8d6",
            "push_content": "呵呵",
            "push_ipdatetime": "04/17 04:37",
            "push_tag": "推",
            "push_userid": "fragment1000"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8d5",
            "push_content": "可是韓的票數 高雄柯粉貢獻很多阿  別切割",
            "push_ipdatetime": "04/17 05:06",
            "push_tag": "→",
            "push_userid": "kohinata"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8d4",
            "push_content": "Skr",
            "push_ipdatetime": "04/17 06:28",
            "push_tag": "推",
            "push_userid": "petero0oo00"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8d3",
            "push_content": "一堆人看到小吃店放中夭AVBS都不想進去消費了 你還在招牌",
            "push_ipdatetime": "04/17 06:34",
            "push_tag": "推",
            "push_userid": "zardmih"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8d2",
            "push_content": "上掛KOREAFISH那不是找死嗎 XDD",
            "push_ipdatetime": "04/17 06:34",
            "push_tag": "→",
            "push_userid": "zardmih"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8d1",
            "push_content": "發現沒幫助又不想打自己臉",
            "push_ipdatetime": "04/17 06:54",
            "push_tag": "推",
            "push_userid": "keepaflash"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8d0",
            "push_content": "任天堂有授權？",
            "push_ipdatetime": "04/17 07:22",
            "push_tag": "推",
            "push_userid": "jhshen15"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8cf",
            "push_content": "天氣越來越好了，韓流滾啦",
            "push_ipdatetime": "04/17 07:31",
            "push_tag": "→",
            "push_userid": "imtaku"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8ce",
            "push_content": "你該看眼科了 那禿子圖明明還在",
            "push_ipdatetime": "04/17 07:52",
            "push_tag": "噓",
            "push_userid": "webermist"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8cd",
            "push_content": "任天堂快來告",
            "push_ipdatetime": "04/17 08:28",
            "push_tag": "噓",
            "push_userid": "Marabuda"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8cc",
            "push_content": "這篇明顯在帶風向 雖說中舔很愛造神 但網友刻意拍這些",
            "push_ipdatetime": "04/17 09:19",
            "push_tag": "→",
            "push_userid": "wang460313"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8cb",
            "push_content": "照片 也是半斤八兩 一個誇張捧 一個盡力毀",
            "push_ipdatetime": "04/17 09:19",
            "push_tag": "→",
            "push_userid": "wang460313"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8ca",
            "push_content": "放MARIO來盈利可以嗎",
            "push_ipdatetime": "04/17 09:20",
            "push_tag": "→",
            "push_userid": "srena"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8c9",
            "push_content": "都發大財了",
            "push_ipdatetime": "04/17 09:54",
            "push_tag": "推",
            "push_userid": "ebeta"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8c8",
            "push_content": "發大財，都吃牛排大餐了",
            "push_ipdatetime": "04/17 11:07",
            "push_tag": "推",
            "push_userid": "sbilor"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8c7",
            "push_content": "肉燥飯在義大裡XDDDDD",
            "push_ipdatetime": "04/17 11:10",
            "push_tag": "推",
            "push_userid": "lliuooia"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8c6",
            "push_content": "垃圾五毛噓起來，不然會領不到薪水，好可憐...",
            "push_ipdatetime": "04/17 11:38",
            "push_tag": "推",
            "push_userid": "justhandsome"
          },
          {
            "_id": "5ce0cfe26e8ee31ef232a8c5",
            "push_content": "白癡才去買",
            "push_ipdatetime": "04/17 17:06",
            "push_tag": "推",
            "push_userid": "Mysex"
          }
        ],
        "url": "https://www.ptt.cc/bbs/Gossiping/M.1555402968.A.AFE.html",
        "__v": 0
      },
      {
        "_id": "5ce0cfe3d8cfd19b0acb34c8",
        "article_id": "M.1555406953.A.12B",
        "article_title": "[新聞] 郭董發飆》「我要告訴白宮，這就是民進黨！」追問被阻",
        "author": "tanted (為何世界會那麼不單純)",
        "board": "Gossiping",
        "content": " ",
        "date": "2019-04-16T09:29:08.000Z",
        "ip": "1.164.1.248",
        "message_count": {
          "_id": "5ce0cfe36e8ee31ef232c3ca",
          "all": 456,
          "boo": 189,
          "count": -65,
          "neutral": 143,
          "push": 124
        },
        "messages": [
          {
            "_id": "5ce0cfe36e8ee31ef232c592",
            "push_content": "都幾歲的人了那麼幼稚",
            "push_ipdatetime": "04/16 17:29",
            "push_tag": "→",
            "push_userid": "kent"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c591",
            "push_content": "哈哈",
            "push_ipdatetime": "04/16 17:29",
            "push_tag": "推",
            "push_userid": "VVizZ"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c590",
            "push_content": "？ 低能兒",
            "push_ipdatetime": "04/16 17:29",
            "push_tag": "→",
            "push_userid": "rushingguy"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c58f",
            "push_content": "低能兒",
            "push_ipdatetime": "04/16 17:29",
            "push_tag": "噓",
            "push_userid": "elec1141"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c58e",
            "push_content": "傲嬌什麼",
            "push_ipdatetime": "04/16 17:29",
            "push_tag": "→",
            "push_userid": "scum5566"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c58d",
            "push_content": "國小學生ㄇ",
            "push_ipdatetime": "04/16 17:29",
            "push_tag": "噓",
            "push_userid": "james732"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c58c",
            "push_content": "呃...只有我覺得還好沒必要這麼生氣嗎……",
            "push_ipdatetime": "04/16 17:29",
            "push_tag": "推",
            "push_userid": "early"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c58b",
            "push_content": "怕",
            "push_ipdatetime": "04/16 17:29",
            "push_tag": "推",
            "push_userid": "qazxc1156892"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c58a",
            "push_content": "三樓學屁？",
            "push_ipdatetime": "04/16 17:29",
            "push_tag": "→",
            "push_userid": "elec1141"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c589",
            "push_content": "寧王要發飆了",
            "push_ipdatetime": "04/16 17:30",
            "push_tag": "推",
            "push_userid": "pponywong"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c588",
            "push_content": "我要跟老師報告",
            "push_ipdatetime": "04/16 17:30",
            "push_tag": "推",
            "push_userid": "s1000650"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c587",
            "push_content": "怎不去找習大大哭訴？",
            "push_ipdatetime": "04/16 17:30",
            "push_tag": "噓",
            "push_userid": "LordOfCS"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c586",
            "push_content": "\"人家要告訴老師喇~~~~\"",
            "push_ipdatetime": "04/16 17:30",
            "push_tag": "→",
            "push_userid": "james732"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c585",
            "push_content": "不愧是有川普手機號碼跟握過川普手的男人！直上天庭",
            "push_ipdatetime": "04/16 17:30",
            "push_tag": "推",
            "push_userid": "yaritai"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c584",
            "push_content": "演技很粗糙的暴發戶。",
            "push_ipdatetime": "04/16 17:30",
            "push_tag": "→",
            "push_userid": "eippuy"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c583",
            "push_content": "白宮應該滿臉問號",
            "push_ipdatetime": "04/16 17:30",
            "push_tag": "推",
            "push_userid": "lin821"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c582",
            "push_content": "還以為要告訴的是習大大",
            "push_ipdatetime": "04/16 17:30",
            "push_tag": "→",
            "push_userid": "maybetodo"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c581",
            "push_content": "告闢告喔XDD",
            "push_ipdatetime": "04/16 17:30",
            "push_tag": "推",
            "push_userid": "beypola"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c580",
            "push_content": "孫權老年變老番顛，郭董保重",
            "push_ipdatetime": "04/16 17:30",
            "push_tag": "→",
            "push_userid": "kaiba541"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c57f",
            "push_content": "告上朝廷",
            "push_ipdatetime": "04/16 17:30",
            "push_tag": "→",
            "push_userid": "wondtty"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c57e",
            "push_content": "告訴白宮 然後呢????",
            "push_ipdatetime": "04/16 17:30",
            "push_tag": "→",
            "push_userid": "cpc21478"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c57d",
            "push_content": "啊不是說美國都賣舊武器?",
            "push_ipdatetime": "04/16 17:30",
            "push_tag": "→",
            "push_userid": "tkucuh"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c57c",
            "push_content": "神經病",
            "push_ipdatetime": "04/16 17:30",
            "push_tag": "噓",
            "push_userid": "bee12"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c57b",
            "push_content": "到底在幹嘛阿 XDDD",
            "push_ipdatetime": "04/16 17:30",
            "push_tag": "推",
            "push_userid": "lindx"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c57a",
            "push_content": "...到底為什麼要氣成這樣",
            "push_ipdatetime": "04/16 17:30",
            "push_tag": "推",
            "push_userid": "itsmyspirit"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c579",
            "push_content": "他以為是在鴻海會議室開會吧",
            "push_ipdatetime": "04/16 17:30",
            "push_tag": "→",
            "push_userid": "lwrwang"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c578",
            "push_content": "是不是中共叫他來鬧場的啊??",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "推",
            "push_userid": "leochang"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c577",
            "push_content": "我要跟老師講",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "噓",
            "push_userid": "sclbtlove"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c576",
            "push_content": "低能",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "→",
            "push_userid": "qqaazz16516"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c575",
            "push_content": "我要回家告訴我爸爸～～",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "噓",
            "push_userid": "pinknana"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c574",
            "push_content": "告訴白宮???",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "推",
            "push_userid": "kiddcat"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c573",
            "push_content": "這先生以為自己是哪位阿  全世界都是鴻海你管的？",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "噓",
            "push_userid": "Putrid"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c572",
            "push_content": "連會議上的洋人都看不過去，還想告洋狀，大老闆當太久都覺",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "→",
            "push_userid": "dlevel"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c571",
            "push_content": "低能兒",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "推",
            "push_userid": "toya123"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c570",
            "push_content": "白宮只看到你自以為老大吧 ㄏㄏ",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "→",
            "push_userid": "ash9911911"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c56f",
            "push_content": "他是不是老的出了問題了?",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "噓",
            "push_userid": "ewhurst"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c56e",
            "push_content": "這樣就發飆，那碰到世間會怎樣???",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "→",
            "push_userid": "leafall"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c56d",
            "push_content": "這是三小反應啊 被欺負了回家哭哭??",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "→",
            "push_userid": "otld"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c56c",
            "push_content": "有高度沒氣度也沒用……",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "→",
            "push_userid": "NohohonZoku"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c56b",
            "push_content": "小學生吵架喔",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "噓",
            "push_userid": "sasintw"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c56a",
            "push_content": "美國爸爸",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "推",
            "push_userid": "qazxc1156892"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c569",
            "push_content": "格調之差顯露無遺",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "推",
            "push_userid": "dy2012"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c568",
            "push_content": "粉碎",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "噓",
            "push_userid": "Sougetu"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c567",
            "push_content": "他在急什麼 我覺得不尋常..",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "→",
            "push_userid": "Arad"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c566",
            "push_content": "白癡喔 現在全世界都知道你EQ超爛超沒氣度",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "推",
            "push_userid": "degneva"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c565",
            "push_content": "得自己妙招連連",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "→",
            "push_userid": "dlevel"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c564",
            "push_content": "員工都不覺得 它們老闆 智商低落嗎 金摳連",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "推",
            "push_userid": "Primk"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c563",
            "push_content": "告御狀喔?",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "推",
            "push_userid": "TuDu"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c562",
            "push_content": "看到蕭美琴鄭麗君這些認真的政治人物被一群山炮霸凌真",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "推",
            "push_userid": "kreator666"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c561",
            "push_content": "我都不用告訴白宮 白宮就知道你是怎樣的三流咖洨",
            "push_ipdatetime": "04/16 17:31",
            "push_tag": "噓",
            "push_userid": "tysh710320"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c560",
            "push_content": "幼稚",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "→",
            "push_userid": "serenitymice"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c55f",
            "push_content": "不知道在演給誰看 XD",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "推",
            "push_userid": "rbull"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c55e",
            "push_content": "的賭爛 這就是台灣",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "→",
            "push_userid": "kreator666"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c55d",
            "push_content": "鍋董都這樣講了，只能叫大家支持民進黨了",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "推",
            "push_userid": "arumi416"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c55c",
            "push_content": "結果還沾沾自喜 哪招?",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "→",
            "push_userid": "degneva"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c55b",
            "push_content": "白宮明白了，這就是中國慣老闆",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "推",
            "push_userid": "wastetheone"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c55a",
            "push_content": "公投第９案：你是否同意政府維持禁止開放日本福島311核",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "推",
            "push_userid": "lain2002"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c559",
            "push_content": "郭：偶要跟把拔講，你綿都欺負偶~~~",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "推",
            "push_userid": "sleepyrat"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c558",
            "push_content": "你最好出來選 我絕對不會投你",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "噓",
            "push_userid": "ohkzq3w2"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c557",
            "push_content": "小心我告老師喔",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "噓",
            "push_userid": "friendly4713"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c556",
            "push_content": "災相關地區農產品及食品進口？",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "→",
            "push_userid": "lain2002"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c555",
            "push_content": "這文章看起來就像是收了郭董的錢寫出來的",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "推",
            "push_userid": "whiteseyes"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c554",
            "push_content": "寧王XD",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "推",
            "push_userid": "Spinner3"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c553",
            "push_content": "慣老闆的噁心嘴臉",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "噓",
            "push_userid": "a710689"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c552",
            "push_content": "川普問號????",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "→",
            "push_userid": "ohya111326"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c551",
            "push_content": "智障喔，中二病發做嗎？",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "噓",
            "push_userid": "yuchihsu"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c550",
            "push_content": "馬的 有點小錢態度就可以這麼囂張跋扈？",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "推",
            "push_userid": "yaritai"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c54f",
            "push_content": "演給誰看+1",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "推",
            "push_userid": "cycutom"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c54e",
            "push_content": "根本小朋友XDDDDDD",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "推",
            "push_userid": "Afro5566"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c54d",
            "push_content": "我只看到老9.2在那邊丟臉",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "噓",
            "push_userid": "Asclepius"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c54c",
            "push_content": "很會演!",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "噓",
            "push_userid": "cloudeda"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c54b",
            "push_content": "今天我看到一個巨嬰的誕生……嘻嘻",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "推",
            "push_userid": "abain521"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c54a",
            "push_content": "779萬民意你敢嘴？",
            "push_ipdatetime": "04/16 17:32",
            "push_tag": "→",
            "push_userid": "lain2002"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c549",
            "push_content": "看不看他跟一言堂啥關係？不知所云",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "→",
            "push_userid": "processer"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c548",
            "push_content": "登能兒",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "推",
            "push_userid": "qaz223gy"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c547",
            "push_content": "老9.2,水準在哪不用多說了",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "噓",
            "push_userid": "kenbo"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c546",
            "push_content": "而且郭董自認代表中華民國??",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "→",
            "push_userid": "otld"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c545",
            "push_content": "完了 郭董要跟川普告狀了 蔡英文GG",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "→",
            "push_userid": "Atwo"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c544",
            "push_content": "我要跟你媽講",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "噓",
            "push_userid": "fingers"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c543",
            "push_content": "我要報告老師",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "→",
            "push_userid": "sorenhuang"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c542",
            "push_content": "偶要跟川拔拔講，泥門都七護偶",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "→",
            "push_userid": "gm0081"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c541",
            "push_content": "跟白宮告狀?",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "推",
            "push_userid": "ghostl40809"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c540",
            "push_content": "人家要去告老師 哼哼",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "推",
            "push_userid": "hjk56789"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c53f",
            "push_content": "啥前因後果都沒寫  就把蕭美琴塑造成壞人一樣",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "→",
            "push_userid": "whiteseyes"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c53e",
            "push_content": "演哪一齣？白宮會覺得回答問題不看提問者比較嚴重 還是和習",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "噓",
            "push_userid": "excia"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c53d",
            "push_content": "原來白宮比你更不懂民進黨  呵呵",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "推",
            "push_userid": "felix1017"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c53c",
            "push_content": "笑死 這麼想要反民進黨的票？",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "推",
            "push_userid": "iamjojo"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c53b",
            "push_content": "近平站在一起比較嚴重？",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "→",
            "push_userid": "excia"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c53a",
            "push_content": "笑死人了，當首富這種氣度",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "噓",
            "push_userid": "SuckCopy"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c539",
            "push_content": "巨嬰？",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "推",
            "push_userid": "tim2468x"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c538",
            "push_content": "沒事在爆什麼氣 莫名其妙",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "→",
            "push_userid": "fuhaho"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c537",
            "push_content": "神經病 當股東會喔？",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "噓",
            "push_userid": "vanilla1365"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c536",
            "push_content": "玻璃心老屁孩",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "噓",
            "push_userid": "sangoking"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c535",
            "push_content": "笑了 先跟川普交代你的投資好嗎XD",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "推",
            "push_userid": "silentence"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c534",
            "push_content": "結果在場美國人挺蕭美琴 不挺你耶",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "噓",
            "push_userid": "glenmarlboro"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c533",
            "push_content": "快去說叫白宮支持你選總統江西商人",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "推",
            "push_userid": "dorydoze"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c532",
            "push_content": "笑死 老闆當久了 以為每個人都你小弟喔",
            "push_ipdatetime": "04/16 17:33",
            "push_tag": "噓",
            "push_userid": "tongzhou"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c531",
            "push_content": "問題是美國看郭董應該也只是個鉅額投資的商人吧",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "→",
            "push_userid": "icecold52"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c530",
            "push_content": "還敢說跟paul ryan關係很好，威斯康辛的投資進度勒？",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "→",
            "push_userid": "processer"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c52f",
            "push_content": "智障9.2",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "推",
            "push_userid": "oliver81405"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c52e",
            "push_content": "演技太粗糙",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "噓",
            "push_userid": "dongyen"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c52d",
            "push_content": "你郭董今晚就坐私人飛機去告白宮御狀阿",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "→",
            "push_userid": "cul287"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c52c",
            "push_content": "笑死  所以郭=中華民國",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "推",
            "push_userid": "goldseed"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c52b",
            "push_content": "郭以為是員工在跟他報告嗎 垃圾人一個",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "→",
            "push_userid": "a710689"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c52a",
            "push_content": "這三小",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "噓",
            "push_userid": "piliwu"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c529",
            "push_content": "也沒看幫蕭美琴護航的是什麼來頭",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "→",
            "push_userid": "gm0081"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c528",
            "push_content": "又是國內自慰中華民國",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "推",
            "push_userid": "s81048112"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c527",
            "push_content": "幹  這咖太廢了吧",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "噓",
            "push_userid": "demitri"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c526",
            "push_content": "去跟中國習爺爺告狀比較有效",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "噓",
            "push_userid": "coyoteY"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c525",
            "push_content": "這種人當上總統大概就是第二個習近平吧",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "→",
            "push_userid": "EggAcme"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c524",
            "push_content": "郭董 霸氣 就是要嗆下去綠黨",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "推",
            "push_userid": "otsuka123"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c523",
            "push_content": "原本以為只是土財主 沒想到還是小學生程度的土財主",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "→",
            "push_userid": "tsmcprince"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c522",
            "push_content": "應該不是在氣沒看他，而是氣蕭沒正面回答，不過到底",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "推",
            "push_userid": "yuriforever"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c521",
            "push_content": "盡量選他喔  台灣人有得受了",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "推",
            "push_userid": "jorden"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c520",
            "push_content": "對比之下郭董既清高又正氣  憤而離席不屑與奸人同席",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "→",
            "push_userid": "whiteseyes"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c51f",
            "push_content": "明天奪命書生就要上門了",
            "push_ipdatetime": "04/16 17:34",
            "push_tag": "推",
            "push_userid": "itrs821"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c51e",
            "push_content": "為什麼可以這麼氣？？？",
            "push_ipdatetime": "04/16 17:35",
            "push_tag": "→",
            "push_userid": "yuriforever"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c51d",
            "push_content": "北七",
            "push_ipdatetime": "04/16 17:35",
            "push_tag": "噓",
            "push_userid": "p72910"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c51c",
            "push_content": "郭台銘是白癡吧 川普政府代表團就在台灣",
            "push_ipdatetime": "04/16 17:35",
            "push_tag": "推",
            "push_userid": "langeo"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c51b",
            "push_content": "郭董說中華民國了 微勃要被封帳號了 XD",
            "push_ipdatetime": "04/16 17:35",
            "push_tag": "推",
            "push_userid": "cawba"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c51a",
            "push_content": "ㄏㄏ",
            "push_ipdatetime": "04/16 17:35",
            "push_tag": "推",
            "push_userid": "iWatch2"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c519",
            "push_content": "你是大老闆沒錯，但她不是你員工...",
            "push_ipdatetime": "04/16 17:35",
            "push_tag": "推",
            "push_userid": "LargeLanPa"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c518",
            "push_content": "為了舔共屌，嘻嘻",
            "push_ipdatetime": "04/16 17:35",
            "push_tag": "推",
            "push_userid": "newking761"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c517",
            "push_content": "我要跟老師講",
            "push_ipdatetime": "04/16 17:35",
            "push_tag": "→",
            "push_userid": "p72910"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c516",
            "push_content": "噁心的中國嘴臉，這裡是民主社會，沒在吃郭這套",
            "push_ipdatetime": "04/16 17:35",
            "push_tag": "噓",
            "push_userid": "yuchihsu"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c515",
            "push_content": "果然是巨嬰，我要告老師喔！",
            "push_ipdatetime": "04/16 17:35",
            "push_tag": "噓",
            "push_userid": "yannicklatte"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c514",
            "push_content": "都當大老闆了 還那麼低能",
            "push_ipdatetime": "04/16 17:35",
            "push_tag": "推",
            "push_userid": "zz71"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c513",
            "push_content": "自己丟人現眼，還說要告訴白宮民進黨的樣子？民進黨",
            "push_ipdatetime": "04/16 17:35",
            "push_tag": "噓",
            "push_userid": "WeGoYuSheng"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c512",
            "push_content": "但他的確是目前能直通白宮的人",
            "push_ipdatetime": "04/16 17:35",
            "push_tag": "推",
            "push_userid": "kenro"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c511",
            "push_content": "的樣子就是被你們這副德性的人霸凌啊，不能就事論事",
            "push_ipdatetime": "04/16 17:35",
            "push_tag": "→",
            "push_userid": "WeGoYuSheng"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c510",
            "push_content": "，做任何事你們都有屁放，跟中國共產黨比，你們這類",
            "push_ipdatetime": "04/16 17:35",
            "push_tag": "→",
            "push_userid": "WeGoYuSheng"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c50f",
            "push_content": "拜託…都幾歲人了，還是大老闆…",
            "push_ipdatetime": "04/16 17:35",
            "push_tag": "噓",
            "push_userid": "tatamishiau"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c50e",
            "push_content": "87",
            "push_ipdatetime": "04/16 17:35",
            "push_tag": "推",
            "push_userid": "CiaoMei"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c50d",
            "push_content": "郭台銘不愧是學店咖 想學川普卻只學到半根毛",
            "push_ipdatetime": "04/16 17:36",
            "push_tag": "→",
            "push_userid": "langeo"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c50c",
            "push_content": "首富了不起啊 法務很多了不起啊 你沒資格做民主政權的總統",
            "push_ipdatetime": "04/16 17:36",
            "push_tag": "→",
            "push_userid": "excia"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c50b",
            "push_content": "人是不是認為民進黨比較像敵人？",
            "push_ipdatetime": "04/16 17:36",
            "push_tag": "→",
            "push_userid": "WeGoYuSheng"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c50a",
            "push_content": "怎麼好像小學生想告狀給老師前說的話",
            "push_ipdatetime": "04/16 17:36",
            "push_tag": "→",
            "push_userid": "ringtweety"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c509",
            "push_content": "蕭美琴是民選立委  他可沒義務向郭董報告",
            "push_ipdatetime": "04/16 17:36",
            "push_tag": "→",
            "push_userid": "whiteseyes"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c508",
            "push_content": "當老闆 格調...",
            "push_ipdatetime": "04/16 17:36",
            "push_tag": "推",
            "push_userid": "sm999222"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c507",
            "push_content": "被美女無視氣噗噗喔",
            "push_ipdatetime": "04/16 17:36",
            "push_tag": "噓",
            "push_userid": "Yu"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c506",
            "push_content": "他不知道那個智庫是什麼嗎",
            "push_ipdatetime": "04/16 17:36",
            "push_tag": "推",
            "push_userid": "Nfox"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c505",
            "push_content": "標準的土豪",
            "push_ipdatetime": "04/16 17:36",
            "push_tag": "噓",
            "push_userid": "wolffast"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c504",
            "push_content": "明知故問… 對方就知道你用意 想大作文章 才打太極啊",
            "push_ipdatetime": "04/16 17:36",
            "push_tag": "噓",
            "push_userid": "BDG"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c503",
            "push_content": "ㄧ整個中國土豪的既視感",
            "push_ipdatetime": "04/16 17:36",
            "push_tag": "噓",
            "push_userid": "r5110ay"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c502",
            "push_content": "神經病",
            "push_ipdatetime": "04/16 17:36",
            "push_tag": "噓",
            "push_userid": "signm"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c501",
            "push_content": "這就是國民黨!!",
            "push_ipdatetime": "04/16 17:36",
            "push_tag": "→",
            "push_userid": "meredith001"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c500",
            "push_content": "............",
            "push_ipdatetime": "04/16 17:37",
            "push_tag": "→",
            "push_userid": "kuter"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4ff",
            "push_content": "這樣就生氣了？到底在氣啥？",
            "push_ipdatetime": "04/16 17:37",
            "push_tag": "→",
            "push_userid": "suyusian"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4fe",
            "push_content": "回去舔共產黨啦 民主不能當飯吃還想靠民選",
            "push_ipdatetime": "04/16 17:37",
            "push_tag": "噓",
            "push_userid": "dead11"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4fd",
            "push_content": "印太這種美國的場子也敢砸？？",
            "push_ipdatetime": "04/16 17:37",
            "push_tag": "→",
            "push_userid": "billionaire"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4fc",
            "push_content": "？？？？？到底在發什麼脾氣呀，笑死",
            "push_ipdatetime": "04/16 17:37",
            "push_tag": "推",
            "push_userid": "etiennechiu"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4fb",
            "push_content": "人家美國眾議員就在現場 你在演什麼啦",
            "push_ipdatetime": "04/16 17:37",
            "push_tag": "噓",
            "push_userid": "ekoj"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4fa",
            "push_content": "鬧什麼彆扭？幼稚",
            "push_ipdatetime": "04/16 17:37",
            "push_tag": "→",
            "push_userid": "lionadon"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4f9",
            "push_content": "傲慢的中國人慣老闆 還想選台灣總統 拱他的都智障嗎？",
            "push_ipdatetime": "04/16 17:37",
            "push_tag": "噓",
            "push_userid": "oxiz"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4f8",
            "push_content": "不面對郭=不面對中華民國，所以郭=中華民國，滿頭問號？",
            "push_ipdatetime": "04/16 17:37",
            "push_tag": "→",
            "push_userid": "c4peR"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4f7",
            "push_content": "笑死這句話留著問習包子",
            "push_ipdatetime": "04/16 17:37",
            "push_tag": "→",
            "push_userid": "kevinaa"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4f6",
            "push_content": "這新聞寫得滿清楚吧 他也只是故意明知故問",
            "push_ipdatetime": "04/16 17:37",
            "push_tag": "推",
            "push_userid": "seemoon2000"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4f5",
            "push_content": "夠玻璃心，很中國",
            "push_ipdatetime": "04/16 17:37",
            "push_tag": "噓",
            "push_userid": "folkblues"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4f4",
            "push_content": "為啥要看你？？？？",
            "push_ipdatetime": "04/16 17:38",
            "push_tag": "噓",
            "push_userid": "ericisfish"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4f3",
            "push_content": "....",
            "push_ipdatetime": "04/16 17:38",
            "push_tag": "噓",
            "push_userid": "zzxx1322"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4f2",
            "push_content": "郭台銘是支那授權來攪亂台灣選舉的 參加這目的就是來搗亂",
            "push_ipdatetime": "04/16 17:38",
            "push_tag": "推",
            "push_userid": "langeo"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4f1",
            "push_content": "告訴白宮wwwwwwwwwwwww",
            "push_ipdatetime": "04/16 17:38",
            "push_tag": "噓",
            "push_userid": "rabbit83035"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4f0",
            "push_content": "北七",
            "push_ipdatetime": "04/16 17:38",
            "push_tag": "噓",
            "push_userid": "yang5115"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4ef",
            "push_content": "蠻沒風度的",
            "push_ipdatetime": "04/16 17:38",
            "push_tag": "噓",
            "push_userid": "sazabik"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4ee",
            "push_content": "喔 好呀 坐等白宮新聞稿，請郭一定要去講 顆顆",
            "push_ipdatetime": "04/16 17:38",
            "push_tag": "推",
            "push_userid": "cubaba"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4ed",
            "push_content": "87",
            "push_ipdatetime": "04/16 17:38",
            "push_tag": "→",
            "push_userid": "yiersan"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4ec",
            "push_content": "郭整天講中華民國，戴國旗帽但中國那邊也沒人敢檢舉他",
            "push_ipdatetime": "04/16 17:38",
            "push_tag": "推",
            "push_userid": "kenro"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4eb",
            "push_content": "老屁孩 當場就被美國人罵了",
            "push_ipdatetime": "04/16 17:38",
            "push_tag": "噓",
            "push_userid": "demitri"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4ea",
            "push_content": "很久沒看新聞 這傢伙怎老這麼多?? 一臉老態",
            "push_ipdatetime": "04/16 17:38",
            "push_tag": "→",
            "push_userid": "peelgates"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4e9",
            "push_content": "郭董森氣氣了",
            "push_ipdatetime": "04/16 17:38",
            "push_tag": "噓",
            "push_userid": "pba"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4e8",
            "push_content": "某地方待久了也有了玻璃心？",
            "push_ipdatetime": "04/16 17:38",
            "push_tag": "推",
            "push_userid": "a4250588"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4e7",
            "push_content": "大家都知道是北京問題 問了他是要得到什答案",
            "push_ipdatetime": "04/16 17:38",
            "push_tag": "→",
            "push_userid": "seemoon2000"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4e6",
            "push_content": "坐等崩潰",
            "push_ipdatetime": "04/16 17:38",
            "push_tag": "推",
            "push_userid": "skyexers"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4e5",
            "push_content": "拜託郭董說到做到",
            "push_ipdatetime": "04/16 17:38",
            "push_tag": "推",
            "push_userid": "sleepyrat"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4e4",
            "push_content": "先去跟萊恩說吧 他代表川普政府",
            "push_ipdatetime": "04/16 17:38",
            "push_tag": "推",
            "push_userid": "kducky"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4e3",
            "push_content": "應該是因為沒掉到他的圈套所以7pupu吧。這種問題感",
            "push_ipdatetime": "04/16 17:38",
            "push_tag": "噓",
            "push_userid": "erickruklin"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4e2",
            "push_content": "中國待久了都自以為是皇帝了",
            "push_ipdatetime": "04/16 17:39",
            "push_tag": "推",
            "push_userid": "walkmancat"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4e1",
            "push_content": "有病是不是",
            "push_ipdatetime": "04/16 17:39",
            "push_tag": "噓",
            "push_userid": "ben840619"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4e0",
            "push_content": "看敘述就郭董自己在生氣，蠻好笑的",
            "push_ipdatetime": "04/16 17:39",
            "push_tag": "噓",
            "push_userid": "sacredshino"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4df",
            "push_content": "覺就是要引誘人家回答。如果中國不打壓吧啦吧啦。然",
            "push_ipdatetime": "04/16 17:39",
            "push_tag": "→",
            "push_userid": "erickruklin"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4de",
            "push_content": "不能好好說話嗎？？為什麼偏要像個幼稚園",
            "push_ipdatetime": "04/16 17:39",
            "push_tag": "噓",
            "push_userid": "etiennechiu"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4dd",
            "push_content": "巨嬰",
            "push_ipdatetime": "04/16 17:39",
            "push_tag": "噓",
            "push_userid": "leetinjun25"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4dc",
            "push_content": "妳不敢看中華民國嗎？這是什麼梗？",
            "push_ipdatetime": "04/16 17:39",
            "push_tag": "→",
            "push_userid": "u9005205"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4db",
            "push_content": "後他就可以接著說所以要跟中國搞好關係。不然這種低",
            "push_ipdatetime": "04/16 17:39",
            "push_tag": "→",
            "push_userid": "erickruklin"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4da",
            "push_content": "不當大老闆改行當演員了？ 演成這樣 也太好笑了",
            "push_ipdatetime": "04/16 17:39",
            "push_tag": "噓",
            "push_userid": "truevill"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4d9",
            "push_content": "本島裡大老闆的氣度我只從張忠謀身上看到而已",
            "push_ipdatetime": "04/16 17:39",
            "push_tag": "推",
            "push_userid": "night957"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4d8",
            "push_content": "能問題問小學生都知道答案。很難想像是從一個首富嘴",
            "push_ipdatetime": "04/16 17:39",
            "push_tag": "→",
            "push_userid": "erickruklin"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4d7",
            "push_content": "鴻海何時200元?",
            "push_ipdatetime": "04/16 17:39",
            "push_tag": "噓",
            "push_userid": "tetsuro"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4d6",
            "push_content": "裡出來",
            "push_ipdatetime": "04/16 17:39",
            "push_tag": "→",
            "push_userid": "erickruklin"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4d5",
            "push_content": "跟白宮告狀？？？",
            "push_ipdatetime": "04/16 17:39",
            "push_tag": "噓",
            "push_userid": "EDFR"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4d4",
            "push_content": "堂堂鴻海，真的丟臉",
            "push_ipdatetime": "04/16 17:39",
            "push_tag": "噓",
            "push_userid": "ryan0714123"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4d3",
            "push_content": "這傢伙當時該不會以為是在他的公司開會吧?",
            "push_ipdatetime": "04/16 17:39",
            "push_tag": "噓",
            "push_userid": "am3kfnm3"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4d2",
            "push_content": "本來霸氣十足  直到這句\"我要告訴白宮\" 整個弱掉",
            "push_ipdatetime": "04/16 17:39",
            "push_tag": "噓",
            "push_userid": "ERT312"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4d1",
            "push_content": "小學生告狀喔",
            "push_ipdatetime": "04/16 17:40",
            "push_tag": "噓",
            "push_userid": "yiclanyi"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4d0",
            "push_content": "他也是想要引誘回答吧呵呵",
            "push_ipdatetime": "04/16 17:40",
            "push_tag": "噓",
            "push_userid": "yeeandrew"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4cf",
            "push_content": "郭董問這問題幹嘛 台灣對國際受到阻礙一直都是中國擋的啊",
            "push_ipdatetime": "04/16 17:40",
            "push_tag": "噓",
            "push_userid": "otld"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4ce",
            "push_content": "揚言要告訴白宮，真的很像小朋友說：我要告老師www",
            "push_ipdatetime": "04/16 17:40",
            "push_tag": "→",
            "push_userid": "etiennechiu"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4cd",
            "push_content": "蛤？ 大發雷霆的點是？",
            "push_ipdatetime": "04/16 17:40",
            "push_tag": "噓",
            "push_userid": "SolomonTab"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4cc",
            "push_content": "神經病",
            "push_ipdatetime": "04/16 17:40",
            "push_tag": "→",
            "push_userid": "akway"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4cb",
            "push_content": "有人提到中華民國嗎？",
            "push_ipdatetime": "04/16 17:40",
            "push_tag": "推",
            "push_userid": "clala"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4ca",
            "push_content": "這就是政黑會捧的咖",
            "push_ipdatetime": "04/16 17:40",
            "push_tag": "噓",
            "push_userid": "airswalker"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4c9",
            "push_content": "郭董想要挖坑給人跳 人家不跳 在那邊氣pupu",
            "push_ipdatetime": "04/16 17:40",
            "push_tag": "→",
            "push_userid": "icecold52"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4c8",
            "push_content": "能參加那個會議的有哪個不知道是中國阻礙 他有什見解",
            "push_ipdatetime": "04/16 17:40",
            "push_tag": "推",
            "push_userid": "seemoon2000"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4c7",
            "push_content": "學店仔哪能和張忠謀比？",
            "push_ipdatetime": "04/16 17:40",
            "push_tag": "→",
            "push_userid": "eippuy"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4c6",
            "push_content": "怎麼有點不知所云？他怎麼了？",
            "push_ipdatetime": "04/16 17:40",
            "push_tag": "噓",
            "push_userid": "jeff52"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4c5",
            "push_content": "去啊 白癡",
            "push_ipdatetime": "04/16 17:41",
            "push_tag": "噓",
            "push_userid": "NewShiisDog"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4c4",
            "push_content": "可以直接說阿 陳唐山也知道才會這樣操駔",
            "push_ipdatetime": "04/16 17:41",
            "push_tag": "→",
            "push_userid": "seemoon2000"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4c3",
            "push_content": "告訴白宮? 你先交代騙那一大塊地怎麼跟川普交代吧",
            "push_ipdatetime": "04/16 17:41",
            "push_tag": "噓",
            "push_userid": "kira925"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4c2",
            "push_content": "越有錢越傲慢，東方人跟西方人果然不同",
            "push_ipdatetime": "04/16 17:41",
            "push_tag": "推",
            "push_userid": "rockhart"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4c1",
            "push_content": "丟臉",
            "push_ipdatetime": "04/16 17:41",
            "push_tag": "噓",
            "push_userid": "teremy"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4c0",
            "push_content": "去講啊 白癡",
            "push_ipdatetime": "04/16 17:41",
            "push_tag": "→",
            "push_userid": "ims531"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4bf",
            "push_content": "講這些你真的進白宮才會被洗臉吧",
            "push_ipdatetime": "04/16 17:41",
            "push_tag": "→",
            "push_userid": "kira925"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4be",
            "push_content": "痾，郭董有點故意喔",
            "push_ipdatetime": "04/16 17:42",
            "push_tag": "噓",
            "push_userid": "ebear"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4bd",
            "push_content": "低能幹",
            "push_ipdatetime": "04/16 17:42",
            "push_tag": "噓",
            "push_userid": "paulispig"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4bc",
            "push_content": "???",
            "push_ipdatetime": "04/16 17:42",
            "push_tag": "噓",
            "push_userid": "TravelFar"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4bb",
            "push_content": "讚",
            "push_ipdatetime": "04/16 17:42",
            "push_tag": "推",
            "push_userid": "oklagg"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4ba",
            "push_content": "拜託快去打電話 川普會順便問投資進度 XDD",
            "push_ipdatetime": "04/16 17:42",
            "push_tag": "→",
            "push_userid": "icecold52"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4b9",
            "push_content": "媽的小學生嗎",
            "push_ipdatetime": "04/16 17:42",
            "push_tag": "噓",
            "push_userid": "Zing119"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4b8",
            "push_content": "老實說  郭輸了面子也輸了裡子",
            "push_ipdatetime": "04/16 17:42",
            "push_tag": "推",
            "push_userid": "clala"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4b7",
            "push_content": "美國智庫不就回應他了 他是想聽到這答案嗎",
            "push_ipdatetime": "04/16 17:42",
            "push_tag": "→",
            "push_userid": "seemoon2000"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4b6",
            "push_content": "他道底知不知道在場的都是哪些人物？",
            "push_ipdatetime": "04/16 17:42",
            "push_tag": "→",
            "push_userid": "gm0081"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4b5",
            "push_content": "大格局郭董問個問題被洗臉想打小報告美國人不就在眼前",
            "push_ipdatetime": "04/16 17:42",
            "push_tag": "推",
            "push_userid": "SorrowWind"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4b4",
            "push_content": "郭董就是有其他人沒有的中美台關係",
            "push_ipdatetime": "04/16 17:42",
            "push_tag": "推",
            "push_userid": "jimhall"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4b3",
            "push_content": "了嗎",
            "push_ipdatetime": "04/16 17:42",
            "push_tag": "→",
            "push_userid": "SorrowWind"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4b2",
            "push_content": "我要告老師喔",
            "push_ipdatetime": "04/16 17:42",
            "push_tag": "噓",
            "push_userid": "jasontzymann"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4b1",
            "push_content": "這傢伙的樣子跟中國的暴發戶有何兩樣",
            "push_ipdatetime": "04/16 17:42",
            "push_tag": "噓",
            "push_userid": "louis13"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4b0",
            "push_content": "人家討論A 你自己跳進來嗆聲B 連美國人都看不下去",
            "push_ipdatetime": "04/16 17:42",
            "push_tag": "噓",
            "push_userid": "akway"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4af",
            "push_content": "^_<",
            "push_ipdatetime": "04/16 17:43",
            "push_tag": "噓",
            "push_userid": "EggAcme"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4ae",
            "push_content": "我想威斯康辛州的參眾議員們更願意跟你談一談開發計畫",
            "push_ipdatetime": "04/16 17:43",
            "push_tag": "→",
            "push_userid": "kira925"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4ad",
            "push_content": "蕭美琴也不是多大角色 老頭在哪爆怒超好笑",
            "push_ipdatetime": "04/16 17:43",
            "push_tag": "推",
            "push_userid": "kevinaa"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4ac",
            "push_content": "老屁孩",
            "push_ipdatetime": "04/16 17:43",
            "push_tag": "噓",
            "push_userid": "lasd"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4ab",
            "push_content": "以為是26廠工在工廠抽菸影片",
            "push_ipdatetime": "04/16 17:43",
            "push_tag": "→",
            "push_userid": "kevinaa"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4aa",
            "push_content": "森77了",
            "push_ipdatetime": "04/16 17:44",
            "push_tag": "噓",
            "push_userid": "intel9000i"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4a9",
            "push_content": "告洋狀喔",
            "push_ipdatetime": "04/16 17:44",
            "push_tag": "噓",
            "push_userid": "herikocat"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4a8",
            "push_content": "你要是敢嗆中共我就鼓掌",
            "push_ipdatetime": "04/16 17:44",
            "push_tag": "噓",
            "push_userid": "society"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4a7",
            "push_content": "https://youtu.be/abAS4qvAxTY",
            "push_ipdatetime": "04/16 17:44",
            "push_tag": "→",
            "push_userid": "billionaire"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4a6",
            "push_content": "侯～我要去跟老師霸告",
            "push_ipdatetime": "04/16 17:44",
            "push_tag": "推",
            "push_userid": "LII1201"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4a5",
            "push_content": "還是發動鴻海員工去白宮那狂問",
            "push_ipdatetime": "04/16 17:45",
            "push_tag": "→",
            "push_userid": "herikocat"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4a4",
            "push_content": "就硬要找個理由發飆啊，唐伯虎點秋香早就演過了",
            "push_ipdatetime": "04/16 17:45",
            "push_tag": "推",
            "push_userid": "tw2000"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4a3",
            "push_content": "我要去跟老私告狀",
            "push_ipdatetime": "04/16 17:45",
            "push_tag": "→",
            "push_userid": "chaunen"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4a2",
            "push_content": "http://i.imgur.com/f1GNQEt.gif",
            "push_ipdatetime": "04/16 17:45",
            "push_tag": "→",
            "push_userid": "tw2000"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4a1",
            "push_content": "我覺得應該也是在鋪梗 你看他一開始戴那頂車輪帽 接下來抗",
            "push_ipdatetime": "04/16 17:45",
            "push_tag": "推",
            "push_userid": "pslr1"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c4a0",
            "push_content": "故意搞事...",
            "push_ipdatetime": "04/16 17:45",
            "push_tag": "噓",
            "push_userid": "teremy"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c49f",
            "push_content": "wisconsin的不說 投資高雄的從馬英九那時吶~",
            "push_ipdatetime": "04/16 17:45",
            "push_tag": "推",
            "push_userid": "silentence"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c49e",
            "push_content": "議之類",
            "push_ipdatetime": "04/16 17:45",
            "push_tag": "→",
            "push_userid": "pslr1"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c49d",
            "push_content": "就是想嗆找理由而已，又不是多大的事鬧這麼難看",
            "push_ipdatetime": "04/16 17:45",
            "push_tag": "→",
            "push_userid": "society"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c49c",
            "push_content": "老年期荷爾蒙失調惹吧",
            "push_ipdatetime": "04/16 17:46",
            "push_tag": "噓",
            "push_userid": "Sousake"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c49b",
            "push_content": "不懂他氣的點是什麼?告訴白宮.民進黨的蕭沒正眼看他?",
            "push_ipdatetime": "04/16 17:46",
            "push_tag": "噓",
            "push_userid": "lovejamwu"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c49a",
            "push_content": "反觀張忠謀，那才是目前商人的典範...",
            "push_ipdatetime": "04/16 17:46",
            "push_tag": "推",
            "push_userid": "nildog"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c499",
            "push_content": "原來是寧王",
            "push_ipdatetime": "04/16 17:46",
            "push_tag": "→",
            "push_userid": "herikocat"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c498",
            "push_content": "藉機鬧場 塑造藍神形象",
            "push_ipdatetime": "04/16 17:46",
            "push_tag": "噓",
            "push_userid": "ss59418ss"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c497",
            "push_content": "如果郭選的上哈哈台灣哈哈",
            "push_ipdatetime": "04/16 17:46",
            "push_tag": "推",
            "push_userid": "jdnd96njudtr"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c496",
            "push_content": "0",
            "push_ipdatetime": "04/16 17:46",
            "push_tag": "噓",
            "push_userid": "cpc21478"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c495",
            "push_content": "如果問題很有深度 倒覺得還好 這題根本所有人知道",
            "push_ipdatetime": "04/16 17:46",
            "push_tag": "推",
            "push_userid": "seemoon2000"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c494",
            "push_content": "我要告上白宮 民進黨壞壞",
            "push_ipdatetime": "04/16 17:46",
            "push_tag": "噓",
            "push_userid": "paulispig"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c493",
            "push_content": "小學生喔XDDDDDD 人家要告訴老師啦",
            "push_ipdatetime": "04/16 17:46",
            "push_tag": "噓",
            "push_userid": "test1024"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c492",
            "push_content": "被燈光照射的台上看不清台下是很正常的吧??這也要生氣??",
            "push_ipdatetime": "04/16 17:46",
            "push_tag": "噓",
            "push_userid": "inlanyu"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c491",
            "push_content": "故意問了被打太極還生氣 是要去跟白宮說什拉...",
            "push_ipdatetime": "04/16 17:46",
            "push_tag": "→",
            "push_userid": "seemoon2000"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c490",
            "push_content": "腦羞成怒",
            "push_ipdatetime": "04/16 17:46",
            "push_tag": "噓",
            "push_userid": "eco100"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c48f",
            "push_content": "你這樣不行啦~這樣怎麼代表KMT？",
            "push_ipdatetime": "04/16 17:46",
            "push_tag": "推",
            "push_userid": "moonlind"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c48e",
            "push_content": "如果在中國面對某某書記，請問郭董敢發飆嗎？",
            "push_ipdatetime": "04/16 17:46",
            "push_tag": "噓",
            "push_userid": "lklk3711"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c48d",
            "push_content": "鴻海巨嬰老闆",
            "push_ipdatetime": "04/16 17:47",
            "push_tag": "推",
            "push_userid": "slamwater"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c48c",
            "push_content": "喜歡舔共又不敢大聲跟美國說",
            "push_ipdatetime": "04/16 17:47",
            "push_tag": "噓",
            "push_userid": "Musclefeng"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c48b",
            "push_content": "http://i.imgur.com/liZxdSZ.jpg",
            "push_ipdatetime": "04/16 17:47",
            "push_tag": "→",
            "push_userid": "tw2000"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c48a",
            "push_content": "巨嬰的我要告老師XDDDDDDD",
            "push_ipdatetime": "04/16 17:47",
            "push_tag": "噓",
            "push_userid": "charoro"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c489",
            "push_content": "都幾歲了還這麼害羞",
            "push_ipdatetime": "04/16 17:47",
            "push_tag": "噓",
            "push_userid": "shotakun"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c488",
            "push_content": "這個問題真不符合董事長的水準",
            "push_ipdatetime": "04/16 17:48",
            "push_tag": "推",
            "push_userid": "clala"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c487",
            "push_content": "郭董怎麼不去找世界警察中國告狀，跑到銀行告狀??",
            "push_ipdatetime": "04/16 17:48",
            "push_tag": "→",
            "push_userid": "Sousake"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c486",
            "push_content": "紅頂商人以為自己是個咖喔",
            "push_ipdatetime": "04/16 17:48",
            "push_tag": "噓",
            "push_userid": "smallpig402"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c485",
            "push_content": "發怒的理由好奇怪",
            "push_ipdatetime": "04/16 17:48",
            "push_tag": "→",
            "push_userid": "bill93557063"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c484",
            "push_content": "王永慶至少在對待員工還比你好",
            "push_ipdatetime": "04/16 17:49",
            "push_tag": "→",
            "push_userid": "smallpig402"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c483",
            "push_content": "郭也開始自導自演起來了啊",
            "push_ipdatetime": "04/16 17:49",
            "push_tag": "噓",
            "push_userid": "jonny1170"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c482",
            "push_content": "什麼樣的人經營什麼樣的公司",
            "push_ipdatetime": "04/16 17:49",
            "push_tag": "→",
            "push_userid": "smallpig402"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c481",
            "push_content": "除惹荷爾蒙失調，我真的想不到其它台階可以讓郭董下惹。",
            "push_ipdatetime": "04/16 17:49",
            "push_tag": "→",
            "push_userid": "Sousake"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c480",
            "push_content": "「我要告訴白宮這就是民進黨」XDDD",
            "push_ipdatetime": "04/16 17:49",
            "push_tag": "噓",
            "push_userid": "zombieguy"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c47f",
            "push_content": "真的很有事",
            "push_ipdatetime": "04/16 17:50",
            "push_tag": "噓",
            "push_userid": "iamtan"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c47e",
            "push_content": "你的公司通知我面試上了老子就是不爽去，怎樣",
            "push_ipdatetime": "04/16 17:50",
            "push_tag": "→",
            "push_userid": "smallpig402"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c47d",
            "push_content": "XD",
            "push_ipdatetime": "04/16 17:50",
            "push_tag": "推",
            "push_userid": "sux0116"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c47c",
            "push_content": "認真提有深度的問題質疑人 我會比較願意支持他",
            "push_ipdatetime": "04/16 17:50",
            "push_tag": "→",
            "push_userid": "seemoon2000"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c47b",
            "push_content": "[新聞] 郭台銘：國防靠美國靠不住 不該跟美買武器",
            "push_ipdatetime": "04/16 17:50",
            "push_tag": "推",
            "push_userid": "frozenmoon"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c47a",
            "push_content": "https://money.udn.com/money/story/7307/3756359",
            "push_ipdatetime": "04/16 17:51",
            "push_tag": "→",
            "push_userid": "frozenmoon"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c479",
            "push_content": "張忠謀真的好太多了",
            "push_ipdatetime": "04/16 17:51",
            "push_tag": "推",
            "push_userid": "walkmancat"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c478",
            "push_content": "他當商人那麼多年了 這問題有什好問的拉 還生氣咧",
            "push_ipdatetime": "04/16 17:51",
            "push_tag": "→",
            "push_userid": "seemoon2000"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c477",
            "push_content": "不知不覺居然笑了出來",
            "push_ipdatetime": "04/16 17:51",
            "push_tag": "噓",
            "push_userid": "pchuang"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c476",
            "push_content": "有必要搞得跟小學生一樣幼稚嗎 說不定生病了",
            "push_ipdatetime": "04/16 17:51",
            "push_tag": "→",
            "push_userid": "pencilx4"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c475",
            "push_content": "我只知道他講的這些話，白宮應該也會知道",
            "push_ipdatetime": "04/16 17:51",
            "push_tag": "→",
            "push_userid": "frozenmoon"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c474",
            "push_content": "所以說土豪就是土豪",
            "push_ipdatetime": "04/16 17:51",
            "push_tag": "→",
            "push_userid": "ppccfvy"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c473",
            "push_content": "可能是演給中國看.最近又是軍機又艦艇繞台.郭也來鬧",
            "push_ipdatetime": "04/16 17:51",
            "push_tag": "噓",
            "push_userid": "lovejamwu"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c472",
            "push_content": "失智或阿茲海默症前兆?",
            "push_ipdatetime": "04/16 17:52",
            "push_tag": "→",
            "push_userid": "pencilx4"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c471",
            "push_content": "不敢看你=不敢看中華民國？這麼偉大？",
            "push_ipdatetime": "04/16 17:52",
            "push_tag": "推",
            "push_userid": "Michaelpipen"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c470",
            "push_content": "我要跟老師說，民進黨修修臉",
            "push_ipdatetime": "04/16 17:52",
            "push_tag": "推",
            "push_userid": "lu82034"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c46f",
            "push_content": "原來我們上面是白宮，郭董腦袋真清楚，習大大在你後面他",
            "push_ipdatetime": "04/16 17:52",
            "push_tag": "推",
            "push_userid": "syk1104"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c46e",
            "push_content": "很火",
            "push_ipdatetime": "04/16 17:53",
            "push_tag": "→",
            "push_userid": "syk1104"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c46d",
            "push_content": "不是說民主不能當飯吃 是要去民主國家的白宮講什麼啦",
            "push_ipdatetime": "04/16 17:53",
            "push_tag": "推",
            "push_userid": "ewjfd"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c46c",
            "push_content": "居然是告訴白宮不是告訴習大大 這中國不發飆嗎?",
            "push_ipdatetime": "04/16 17:53",
            "push_tag": "推",
            "push_userid": "juncat"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c46b",
            "push_content": "去了中國以後整個人就變何老師了 可撥商人",
            "push_ipdatetime": "04/16 17:53",
            "push_tag": "推",
            "push_userid": "toya123"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c46a",
            "push_content": "去白宮說民主不能當飯吃",
            "push_ipdatetime": "04/16 17:53",
            "push_tag": "→",
            "push_userid": "ewjfd"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c469",
            "push_content": "好好地教訓白宮:「民主不能當飯吃啦」",
            "push_ipdatetime": "04/16 17:54",
            "push_tag": "→",
            "push_userid": "ewjfd"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c468",
            "push_content": "告御狀摟",
            "push_ipdatetime": "04/16 17:54",
            "push_tag": "推",
            "push_userid": "Rex729"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c467",
            "push_content": "去跟包子說",
            "push_ipdatetime": "04/16 17:54",
            "push_tag": "噓",
            "push_userid": "aqsss"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c466",
            "push_content": "怎麼跟銀行抗議?  不跟世界警察中國告狀嗎?",
            "push_ipdatetime": "04/16 17:54",
            "push_tag": "→",
            "push_userid": "Sousake"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c465",
            "push_content": "是哪裡有問題  看不懂在氣什麼",
            "push_ipdatetime": "04/16 17:54",
            "push_tag": "推",
            "push_userid": "cloudin"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c464",
            "push_content": "我告訴老師喔XD喜韓兒",
            "push_ipdatetime": "04/16 17:54",
            "push_tag": "推",
            "push_userid": "MASAMIFANS"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c463",
            "push_content": "中二",
            "push_ipdatetime": "04/16 17:54",
            "push_tag": "噓",
            "push_userid": "Roselle44"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c462",
            "push_content": "如果這是全場對話 的確沒必要只盯著郭台銘阿@@?",
            "push_ipdatetime": "04/16 17:55",
            "push_tag": "推",
            "push_userid": "markoo"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c461",
            "push_content": "尊重一下果凍很難嗎？問看看他的員工",
            "push_ipdatetime": "04/16 17:55",
            "push_tag": "噓",
            "push_userid": "mdforget"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c460",
            "push_content": "去講啊！錢多很了不起，快去",
            "push_ipdatetime": "04/16 17:55",
            "push_tag": "噓",
            "push_userid": "iamfake"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c45f",
            "push_content": "笑尿，這就是百萬人的統帥",
            "push_ipdatetime": "04/16 17:56",
            "push_tag": "→",
            "push_userid": "neuralandre"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c45e",
            "push_content": "我要告老師她沒注視我深情的雙眼",
            "push_ipdatetime": "04/16 17:57",
            "push_tag": "噓",
            "push_userid": "tetsuro"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c45d",
            "push_content": "白宮應該看不懂你在生氣三小吧@@",
            "push_ipdatetime": "04/16 17:58",
            "push_tag": "→",
            "push_userid": "jjez168"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c45c",
            "push_content": "超幼稚耶",
            "push_ipdatetime": "04/16 18:00",
            "push_tag": "推",
            "push_userid": "xup6lin"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c45b",
            "push_content": "民進黨下台就是 爽 內政亂七八糟只能跟美國取暖",
            "push_ipdatetime": "04/16 18:00",
            "push_tag": "推",
            "push_userid": "R3210"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c45a",
            "push_content": "在演什麼？",
            "push_ipdatetime": "04/16 18:01",
            "push_tag": "噓",
            "push_userid": "jeeffrey3688"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c459",
            "push_content": "告洋狀、告御狀這種思維就是專制時期的思想啊，經不起考驗",
            "push_ipdatetime": "04/16 18:01",
            "push_tag": "噓",
            "push_userid": "Voony"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c458",
            "push_content": "在場不就有白宮親近的人 ？",
            "push_ipdatetime": "04/16 18:02",
            "push_tag": "→",
            "push_userid": "dog990999"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c457",
            "push_content": "https://i.imgur.com/sjD5iZ7.gif",
            "push_ipdatetime": "04/16 18:03",
            "push_tag": "噓",
            "push_userid": "TomHolland"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c456",
            "push_content": "白宮應該會覺得沒看郭董一眼關他什麼事？",
            "push_ipdatetime": "04/16 18:03",
            "push_tag": "→",
            "push_userid": "bill93557063"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c455",
            "push_content": "今天有關他的新聞這樣看下來，感覺他不是真的認真要選總",
            "push_ipdatetime": "04/16 18:03",
            "push_tag": "推",
            "push_userid": "roundone"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c454",
            "push_content": "最好川普會鳥你這小屁事",
            "push_ipdatetime": "04/16 18:03",
            "push_tag": "噓",
            "push_userid": "harryami"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c453",
            "push_content": "統，不然不會新聞剛出來就鬧這種笑話。他要出來選有可能",
            "push_ipdatetime": "04/16 18:03",
            "push_tag": "→",
            "push_userid": "roundone"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c452",
            "push_content": "只是背後有什麼目的？",
            "push_ipdatetime": "04/16 18:03",
            "push_tag": "→",
            "push_userid": "roundone"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c451",
            "push_content": "而且他去跟川普告御狀，川普搞不好叫他先把威州的投資弄",
            "push_ipdatetime": "04/16 18:06",
            "push_tag": "→",
            "push_userid": "roundone"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c450",
            "push_content": "好再講，現在那投資搞成這樣根本是幫共和黨扣分",
            "push_ipdatetime": "04/16 18:06",
            "push_tag": "→",
            "push_userid": "roundone"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c44f",
            "push_content": "白宮：好 我們理解你的感受 不如先談談貴公司的在美",
            "push_ipdatetime": "04/16 18:07",
            "push_tag": "推",
            "push_userid": "silentence"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c44e",
            "push_content": "投資事項  相信會很愉快的☺☺☺☺",
            "push_ipdatetime": "04/16 18:07",
            "push_tag": "→",
            "push_userid": "silentence"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c44d",
            "push_content": "要演給維尼看啊，我有在做事優",
            "push_ipdatetime": "04/16 18:08",
            "push_tag": "推",
            "push_userid": "me410"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c44c",
            "push_content": "有話好好說 不要暴怒",
            "push_ipdatetime": "04/16 18:08",
            "push_tag": "噓",
            "push_userid": "andy1018"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c44b",
            "push_content": "聰明人都知道 這種二選一的根本挖坑題XD",
            "push_ipdatetime": "04/16 18:09",
            "push_tag": "→",
            "push_userid": "silentence"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c44a",
            "push_content": "哈哈 跟白宮打小報告是怎樣啊 美國人是你媽",
            "push_ipdatetime": "04/16 18:09",
            "push_tag": "→",
            "push_userid": "flare5566"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c449",
            "push_content": "動作很大",
            "push_ipdatetime": "04/16 18:09",
            "push_tag": "→",
            "push_userid": "triplee"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c448",
            "push_content": "蕭美琴沒看你 你要去告洋狀?  別搞笑了啦 郭董",
            "push_ipdatetime": "04/16 18:10",
            "push_tag": "噓",
            "push_userid": "PePePeace"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c447",
            "push_content": "都七老八十了 這舉動跟小學生要報告老師一樣XD",
            "push_ipdatetime": "04/16 18:12",
            "push_tag": "噓",
            "push_userid": "wagwag"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c446",
            "push_content": "晚節不保 唉",
            "push_ipdatetime": "04/16 18:12",
            "push_tag": "噓",
            "push_userid": "jeffu"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c445",
            "push_content": "為什麼台灣一堆4.5年級生在那邊敗台灣...",
            "push_ipdatetime": "04/16 18:14",
            "push_tag": "噓",
            "push_userid": "jokebbs"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c444",
            "push_content": "一個大老闆原來這麼中二 暸了",
            "push_ipdatetime": "04/16 18:15",
            "push_tag": "噓",
            "push_userid": "tenoopy"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c443",
            "push_content": "你沒看我眼睛，我要跟川普老師說!!",
            "push_ipdatetime": "04/16 18:16",
            "push_tag": "→",
            "push_userid": "prestonia"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c442",
            "push_content": "？？在幹嘛",
            "push_ipdatetime": "04/16 18:16",
            "push_tag": "噓",
            "push_userid": "anyweather"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c441",
            "push_content": "小劇場很多",
            "push_ipdatetime": "04/16 18:17",
            "push_tag": "推",
            "push_userid": "lolovero"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c440",
            "push_content": "幹 到底在演哪一齣",
            "push_ipdatetime": "04/16 18:18",
            "push_tag": "噓",
            "push_userid": "soarling"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c43f",
            "push_content": "土豪",
            "push_ipdatetime": "04/16 18:19",
            "push_tag": "噓",
            "push_userid": "yor"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c43e",
            "push_content": "先躺地上哭哭  要演演像一點",
            "push_ipdatetime": "04/16 18:19",
            "push_tag": "噓",
            "push_userid": "q65810"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c43d",
            "push_content": "好笑",
            "push_ipdatetime": "04/16 18:20",
            "push_tag": "噓",
            "push_userid": "fenrisfang"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c43c",
            "push_content": "中二病喔 去講阿",
            "push_ipdatetime": "04/16 18:20",
            "push_tag": "噓",
            "push_userid": "kipi91718"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c43b",
            "push_content": "立委眼神沒看你 就要跟白宮告狀喔?! XDDDDDD",
            "push_ipdatetime": "04/16 18:21",
            "push_tag": "噓",
            "push_userid": "hankhui3175"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c43a",
            "push_content": "帥 直達天聽",
            "push_ipdatetime": "04/16 18:21",
            "push_tag": "推",
            "push_userid": "jesiuty"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c439",
            "push_content": "真的很情緒化",
            "push_ipdatetime": "04/16 18:21",
            "push_tag": "推",
            "push_userid": "petesam"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c438",
            "push_content": "參加座談會就是想吵架",
            "push_ipdatetime": "04/16 18:22",
            "push_tag": "→",
            "push_userid": "petesam"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c437",
            "push_content": "去講啊 你誰啊",
            "push_ipdatetime": "04/16 18:23",
            "push_tag": "噓",
            "push_userid": "Simakui"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c436",
            "push_content": "唉",
            "push_ipdatetime": "04/16 18:24",
            "push_tag": "噓",
            "push_userid": "starericc"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c435",
            "push_content": "操 根本是演給中國看的",
            "push_ipdatetime": "04/16 18:25",
            "push_tag": "推",
            "push_userid": "boogieman"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c434",
            "push_content": "發飆的感覺莫名其妙",
            "push_ipdatetime": "04/16 18:25",
            "push_tag": "推",
            "push_userid": "gutalic"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c433",
            "push_content": "心理學--視覺優勢比率，這種從靈長類動物身上都有",
            "push_ipdatetime": "04/16 18:25",
            "push_tag": "→",
            "push_userid": "ranefany"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c432",
            "push_content": "林靜儀的FB被嗆爆了",
            "push_ipdatetime": "04/16 18:26",
            "push_tag": "推",
            "push_userid": "OGC218"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c431",
            "push_content": "出社會那麼久 地位跟錢都到一個坎站了 結果講話這個樣子 真",
            "push_ipdatetime": "04/16 18:28",
            "push_tag": "噓",
            "push_userid": "ziso"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c430",
            "push_content": "好笑xD",
            "push_ipdatetime": "04/16 18:28",
            "push_tag": "→",
            "push_userid": "ziso"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c42f",
            "push_content": "台灣的危機在於老人不放權",
            "push_ipdatetime": "04/16 18:28",
            "push_tag": "噓",
            "push_userid": "tetsuro"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c42e",
            "push_content": "有夠幼稚 論述論不贏戰態度",
            "push_ipdatetime": "04/16 18:29",
            "push_tag": "噓",
            "push_userid": "cppwu"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c42d",
            "push_content": "白宮：不爽不會滾回共產黨",
            "push_ipdatetime": "04/16 18:29",
            "push_tag": "→",
            "push_userid": "yolasiku"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c42c",
            "push_content": "所以他在氣什麼 看不懂",
            "push_ipdatetime": "04/16 18:29",
            "push_tag": "推",
            "push_userid": "sammoon"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c42b",
            "push_content": "【中國巨嬰大鬧瑞典】",
            "push_ipdatetime": "04/16 18:29",
            "push_tag": "→",
            "push_userid": "upup429"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c42a",
            "push_content": "感覺就是故意借題發揮",
            "push_ipdatetime": "04/16 18:30",
            "push_tag": "→",
            "push_userid": "Orzleader"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c429",
            "push_content": "巨嬰鬧笑話",
            "push_ipdatetime": "04/16 18:32",
            "push_tag": "噓",
            "push_userid": "Moratti"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c428",
            "push_content": "噁心支那人",
            "push_ipdatetime": "04/16 18:32",
            "push_tag": "噓",
            "push_userid": "bardah2c"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c427",
            "push_content": "老藍男",
            "push_ipdatetime": "04/16 18:33",
            "push_tag": "噓",
            "push_userid": "FJU597660557"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c426",
            "push_content": "支那人果然玻璃心",
            "push_ipdatetime": "04/16 18:34",
            "push_tag": "噓",
            "push_userid": "ManderLi"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c425",
            "push_content": "蔡英文 挫在等",
            "push_ipdatetime": "04/16 18:35",
            "push_tag": "推",
            "push_userid": "assman799"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c424",
            "push_content": "垃圾商人",
            "push_ipdatetime": "04/16 18:35",
            "push_tag": "→",
            "push_userid": "ilovelol"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c423",
            "push_content": "自大的老屁孩",
            "push_ipdatetime": "04/16 18:36",
            "push_tag": "噓",
            "push_userid": "pozx"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c422",
            "push_content": "????",
            "push_ipdatetime": "04/16 18:36",
            "push_tag": "噓",
            "push_userid": "showndam"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c421",
            "push_content": "我認同經濟跟政治會綁在一塊，但當政治干涉到主權還要拼",
            "push_ipdatetime": "04/16 18:37",
            "push_tag": "噓",
            "push_userid": "UenoJoe"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c420",
            "push_content": "經濟？",
            "push_ipdatetime": "04/16 18:37",
            "push_tag": "→",
            "push_userid": "UenoJoe"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c41f",
            "push_content": "我要告上朝廷！",
            "push_ipdatetime": "04/16 18:37",
            "push_tag": "推",
            "push_userid": "m791226"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c41e",
            "push_content": "沒中國，台灣一樣活得下去，也不會比較差啦。",
            "push_ipdatetime": "04/16 18:37",
            "push_tag": "→",
            "push_userid": "UenoJoe"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c41d",
            "push_content": "如果這是中共的論壇 郭台銘還敢大動作的抗議嗎？一個說民主",
            "push_ipdatetime": "04/16 18:39",
            "push_tag": "噓",
            "push_userid": "lowpk"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c41c",
            "push_content": "敢開芭樂票給川普的人就是這麼帶種 北京喜歡",
            "push_ipdatetime": "04/16 18:39",
            "push_tag": "→",
            "push_userid": "boogieman"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c41b",
            "push_content": "不能當飯吃的人怎麼如此的草莓啊....",
            "push_ipdatetime": "04/16 18:39",
            "push_tag": "→",
            "push_userid": "lowpk"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c41a",
            "push_content": "老番癲是嗎",
            "push_ipdatetime": "04/16 18:39",
            "push_tag": "→",
            "push_userid": "cathydiumin"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c419",
            "push_content": "演技太失敗",
            "push_ipdatetime": "04/16 18:41",
            "push_tag": "推",
            "push_userid": "stoneofsea"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c418",
            "push_content": "告訴白宮？ 小朋友生氣找老師的概念嗎？",
            "push_ipdatetime": "04/16 18:44",
            "push_tag": "噓",
            "push_userid": "scuxun"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c417",
            "push_content": "可憐！氣度超小。",
            "push_ipdatetime": "04/16 18:44",
            "push_tag": "噓",
            "push_userid": "cloudwolf"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c416",
            "push_content": "支持郭董",
            "push_ipdatetime": "04/16 18:49",
            "push_tag": "推",
            "push_userid": "jennyshe"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c415",
            "push_content": "下流老人",
            "push_ipdatetime": "04/16 18:50",
            "push_tag": "噓",
            "push_userid": "arsian"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c414",
            "push_content": "...... 我要告老師",
            "push_ipdatetime": "04/16 18:52",
            "push_tag": "噓",
            "push_userid": "hchs31705"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c413",
            "push_content": "自以為有幾個臭錢就怎樣？",
            "push_ipdatetime": "04/16 18:53",
            "push_tag": "噓",
            "push_userid": "prodd"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c412",
            "push_content": "向中國告狀",
            "push_ipdatetime": "04/16 19:01",
            "push_tag": "噓",
            "push_userid": "revera1992"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c411",
            "push_content": "幼稚",
            "push_ipdatetime": "04/16 19:01",
            "push_tag": "噓",
            "push_userid": "berserk"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c410",
            "push_content": "好喔 怕怕",
            "push_ipdatetime": "04/16 19:02",
            "push_tag": "噓",
            "push_userid": "C3X"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c40f",
            "push_content": "廠工崩潰",
            "push_ipdatetime": "04/16 19:02",
            "push_tag": "推",
            "push_userid": "KeynesGG"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c40e",
            "push_content": "在場應該就有白宮的人，真的丟臉，所謂的台灣首富是",
            "push_ipdatetime": "04/16 19:08",
            "push_tag": "噓",
            "push_userid": "mimimoumou"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c40d",
            "push_content": "這個樣子",
            "push_ipdatetime": "04/16 19:08",
            "push_tag": "→",
            "push_userid": "mimimoumou"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c40c",
            "push_content": "只是個老板，不是上帝，兇個屁",
            "push_ipdatetime": "04/16 19:10",
            "push_tag": "噓",
            "push_userid": "DickChen"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c40b",
            "push_content": "『老師，他給我打！』",
            "push_ipdatetime": "04/16 19:13",
            "push_tag": "→",
            "push_userid": "doubleperson"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c40a",
            "push_content": "美智庫的人說是你不對耶~ 兇什麼兇",
            "push_ipdatetime": "04/16 19:14",
            "push_tag": "噓",
            "push_userid": "laroserose"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c409",
            "push_content": "沒水準",
            "push_ipdatetime": "04/16 19:15",
            "push_tag": "噓",
            "push_userid": "abasqoo"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c408",
            "push_content": "哼！我要告老師！！！ㄌㄩㄝ～～～",
            "push_ipdatetime": "04/16 19:15",
            "push_tag": "推",
            "push_userid": "etiennechiu"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c407",
            "push_content": "不是要跟習維尼告狀嗎？",
            "push_ipdatetime": "04/16 19:17",
            "push_tag": "噓",
            "push_userid": "crazyqq"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c406",
            "push_content": "幼稚",
            "push_ipdatetime": "04/16 19:20",
            "push_tag": "→",
            "push_userid": "Purekim"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c405",
            "push_content": "白宮：huh???????",
            "push_ipdatetime": "04/16 19:22",
            "push_tag": "噓",
            "push_userid": "Blunt"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c404",
            "push_content": "哪來的智障？",
            "push_ipdatetime": "04/16 19:25",
            "push_tag": "噓",
            "push_userid": "lpoijk"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c403",
            "push_content": "再大牌也只是一票，再有錢死了也帶不走。",
            "push_ipdatetime": "04/16 19:25",
            "push_tag": "噓",
            "push_userid": "tonyhu"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c402",
            "push_content": "一開始就打算去亂的",
            "push_ipdatetime": "04/16 19:25",
            "push_tag": "噓",
            "push_userid": "Musclefeng"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c401",
            "push_content": "笑死 這種咖三也要選總統",
            "push_ipdatetime": "04/16 19:26",
            "push_tag": "推",
            "push_userid": "mazznia"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c400",
            "push_content": "今天是故意發飆造勢搏版面參選的吧",
            "push_ipdatetime": "04/16 19:26",
            "push_tag": "噓",
            "push_userid": "yoji520"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3ff",
            "push_content": "去白宮要先交代威州的廠啥時蓋好吧?? 還在那邊DPP",
            "push_ipdatetime": "04/16 19:27",
            "push_tag": "推",
            "push_userid": "Purekim"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3fe",
            "push_content": "DPP不EY",
            "push_ipdatetime": "04/16 19:28",
            "push_tag": "推",
            "push_userid": "jerrychuang"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3fd",
            "push_content": "老闆當慣了 以為每個人都要對他哈腰",
            "push_ipdatetime": "04/16 19:30",
            "push_tag": "噓",
            "push_userid": "Seifer601"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3fc",
            "push_content": "汪汪  汪汪汪",
            "push_ipdatetime": "04/16 19:32",
            "push_tag": "噓",
            "push_userid": "whitezealman"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3fb",
            "push_content": "87",
            "push_ipdatetime": "04/16 19:35",
            "push_tag": "噓",
            "push_userid": "Bluebear"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3fa",
            "push_content": "不懂在氣啥",
            "push_ipdatetime": "04/16 19:36",
            "push_tag": "噓",
            "push_userid": "codehard"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3f9",
            "push_content": "沒水準",
            "push_ipdatetime": "04/16 19:36",
            "push_tag": "噓",
            "push_userid": "ericisfish"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3f8",
            "push_content": "快去啊 不要只會嘴",
            "push_ipdatetime": "04/16 19:44",
            "push_tag": "噓",
            "push_userid": "Garigari4649"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3f7",
            "push_content": "什麼咖",
            "push_ipdatetime": "04/16 19:45",
            "push_tag": "噓",
            "push_userid": "glendawl"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3f6",
            "push_content": "他開會都這脾氣? 發飆搏版面為選舉?還是為了向誰表態?",
            "push_ipdatetime": "04/16 19:46",
            "push_tag": "噓",
            "push_userid": "Korsechi"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3f5",
            "push_content": "我要告訴白宮!!!",
            "push_ipdatetime": "04/16 19:47",
            "push_tag": "→",
            "push_userid": "vodkalime607"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3f4",
            "push_content": "剛看了影片，真的很好笑，莫名其妙氣成這樣",
            "push_ipdatetime": "04/16 19:48",
            "push_tag": "推",
            "push_userid": "etiennechiu"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3f3",
            "push_content": "拍蝦小 幹",
            "push_ipdatetime": "04/16 19:50",
            "push_tag": "噓",
            "push_userid": "yutinbabe"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3f2",
            "push_content": "為了不舔中生氣，結果要告狀找白宮",
            "push_ipdatetime": "04/16 20:07",
            "push_tag": "→",
            "push_userid": "kaede0711"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3f1",
            "push_content": "講錯了吧！應該要告訴「中南海」才是！",
            "push_ipdatetime": "04/16 20:08",
            "push_tag": "噓",
            "push_userid": "garone"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3f0",
            "push_content": "冠勞版",
            "push_ipdatetime": "04/16 20:10",
            "push_tag": "推",
            "push_userid": "holykaoo"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3ef",
            "push_content": "……看完只有無言",
            "push_ipdatetime": "04/16 20:13",
            "push_tag": "噓",
            "push_userid": "bmmbmmbmm"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3ee",
            "push_content": "這格局真的做小了",
            "push_ipdatetime": "04/16 20:14",
            "push_tag": "噓",
            "push_userid": "cvnn"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3ed",
            "push_content": "老年人就是會這麼番，失智症前兆",
            "push_ipdatetime": "04/16 20:26",
            "push_tag": "噓",
            "push_userid": "cutesnow"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3ec",
            "push_content": "去說阿...不如順便要白宮跟你說說KMT的歷史如何",
            "push_ipdatetime": "04/16 20:34",
            "push_tag": "噓",
            "push_userid": "LuckyQ"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3eb",
            "push_content": "去跟維尼哭哭啦",
            "push_ipdatetime": "04/16 20:36",
            "push_tag": "噓",
            "push_userid": "Sinkage"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3ea",
            "push_content": "…………",
            "push_ipdatetime": "04/16 20:43",
            "push_tag": "噓",
            "push_userid": "godzilla0918"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3e9",
            "push_content": "三小 自以為在敎訓員工？",
            "push_ipdatetime": "04/16 20:47",
            "push_tag": "噓",
            "push_userid": "jeff23031"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3e8",
            "push_content": "你屎定了！我要跟老師講！！！",
            "push_ipdatetime": "04/16 21:00",
            "push_tag": "噓",
            "push_userid": "f9968106"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3e7",
            "push_content": "這種高度的人 真的不該屈就台灣當總統啊!!!",
            "push_ipdatetime": "04/16 21:02",
            "push_tag": "推",
            "push_userid": "ping00000"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3e6",
            "push_content": "嗆中南海才對吧",
            "push_ipdatetime": "04/16 21:08",
            "push_tag": "噓",
            "push_userid": "Carrarese"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3e5",
            "push_content": "支那老人脾氣",
            "push_ipdatetime": "04/16 21:13",
            "push_tag": "噓",
            "push_userid": "LJL452"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3e4",
            "push_content": "以為其他人都你公司員工？台老男一堆耳根子硬自尊心又高的",
            "push_ipdatetime": "04/16 21:46",
            "push_tag": "噓",
            "push_userid": "urmfo"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3e3",
            "push_content": "只有我覺得他在學川普嗎...",
            "push_ipdatetime": "04/16 22:26",
            "push_tag": "推",
            "push_userid": "s5207yen"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3e2",
            "push_content": "https://tinyurl.com/y8yscdto",
            "push_ipdatetime": "04/16 22:28",
            "push_tag": "→",
            "push_userid": "QQdragon"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3e1",
            "push_content": "你已經告訴台灣，這就是郭董了。",
            "push_ipdatetime": "04/16 22:43",
            "push_tag": "噓",
            "push_userid": "meimei2016"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3e0",
            "push_content": "川普:說好的威斯康辛州工作機會呢?",
            "push_ipdatetime": "04/16 22:50",
            "push_tag": "→",
            "push_userid": "realsiway"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3df",
            "push_content": "老屁孩喔",
            "push_ipdatetime": "04/16 22:57",
            "push_tag": "噓",
            "push_userid": "eowa"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3de",
            "push_content": "智障巨嬰",
            "push_ipdatetime": "04/16 23:26",
            "push_tag": "噓",
            "push_userid": "f130097955"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3dd",
            "push_content": "很Low的人",
            "push_ipdatetime": "04/16 23:28",
            "push_tag": "噓",
            "push_userid": "HoshiRyou"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3dc",
            "push_content": "https://i.imgur.com/2Db2CZP.jpg",
            "push_ipdatetime": "04/16 23:41",
            "push_tag": "噓",
            "push_userid": "heinzblack"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3db",
            "push_content": "不曉得郭董敢不敢叫川董說話時眼睛看著他www",
            "push_ipdatetime": "04/17 00:00",
            "push_tag": "→",
            "push_userid": "henryyeh0731"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3da",
            "push_content": "有夠幼稚",
            "push_ipdatetime": "04/17 00:15",
            "push_tag": "噓",
            "push_userid": "nelso"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3d9",
            "push_content": "蕭好可憐 莫名其妙遇到",
            "push_ipdatetime": "04/17 00:38",
            "push_tag": "噓",
            "push_userid": "jajoy"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3d8",
            "push_content": "跟比爾蓋茲格調差超多 上次比爾蓋茲還在reddit上開q an",
            "push_ipdatetime": "04/17 01:35",
            "push_tag": "推",
            "push_userid": "s8018572"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3d7",
            "push_content": "d a好好跟別人溝通",
            "push_ipdatetime": "04/17 01:35",
            "push_tag": "→",
            "push_userid": "s8018572"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3d6",
            "push_content": "9.2腦殘無下限",
            "push_ipdatetime": "04/17 02:07",
            "push_tag": "噓",
            "push_userid": "qooprincess"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3d5",
            "push_content": "噁心的嘴臉",
            "push_ipdatetime": "04/17 02:19",
            "push_tag": "噓",
            "push_userid": "wubai51"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3d4",
            "push_content": "我要跟老師講！60路大人版，噁噁噁噁噁噁噁",
            "push_ipdatetime": "04/17 04:07",
            "push_tag": "→",
            "push_userid": "a0768"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3d3",
            "push_content": "找美國爸爸哦",
            "push_ipdatetime": "04/17 05:27",
            "push_tag": "→",
            "push_userid": "glass0520"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3d2",
            "push_content": "他以為他是什麼東西可以左右台米關係？",
            "push_ipdatetime": "04/17 05:58",
            "push_tag": "噓",
            "push_userid": "rayven"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3d1",
            "push_content": "超沒風度的  是不是有情緒控制的障礙",
            "push_ipdatetime": "04/17 06:09",
            "push_tag": "噓",
            "push_userid": "nightwing"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3d0",
            "push_content": "一堆噓狗好像很想領教鴻海法務的能耐??",
            "push_ipdatetime": "04/17 06:29",
            "push_tag": "推",
            "push_userid": "a09374567"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3cf",
            "push_content": "妳壞壞，我要去告老師",
            "push_ipdatetime": "04/17 09:00",
            "push_tag": "噓",
            "push_userid": "rock19981"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3ce",
            "push_content": "好幼稚",
            "push_ipdatetime": "04/17 09:50",
            "push_tag": "→",
            "push_userid": "godina339"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3cd",
            "push_content": "爸爸你看啦！民進黨壞壞～XDDDDDDD",
            "push_ipdatetime": "04/17 09:57",
            "push_tag": "噓",
            "push_userid": "okokurpig"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3cc",
            "push_content": "滾吧你...",
            "push_ipdatetime": "04/17 10:04",
            "push_tag": "噓",
            "push_userid": "mmnnm"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232c3cb",
            "push_content": "人家要跟老師告狀>< 你壞壞",
            "push_ipdatetime": "04/17 14:57",
            "push_tag": "→",
            "push_userid": "kosakichan"
          }
        ],
        "url": "https://www.ptt.cc/bbs/Gossiping/M.1555406953.A.12B.html",
        "__v": 0
      },
      {
        "_id": "5ce0cfe3d8cfd19b0acb352b",
        "article_id": "M.1555410445.A.B72",
        "article_title": "[新聞] 財產申報英賴比一比！蔡英文存款5406萬、",
        "author": "Damp (丹恩)",
        "board": "Gossiping",
        "content": " ",
        "date": "2019-04-16T10:27:23.000Z",
        "ip": "36.225.122.103",
        "message_count": {
          "_id": "5ce0cfe36e8ee31ef232d12b",
          "all": 37,
          "boo": 3,
          "count": 14,
          "neutral": 17,
          "push": 17
        },
        "messages": [
          {
            "_id": "5ce0cfe36e8ee31ef232d150",
            "push_content": "比這做什麼",
            "push_ipdatetime": "04/16 18:28",
            "push_tag": "→",
            "push_userid": "howard24"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d14f",
            "push_content": "賴真的如同謝龍介說的很乾淨，不歪哥。新潮流的孤鳥",
            "push_ipdatetime": "04/16 18:28",
            "push_tag": "推",
            "push_userid": "cores"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d14e",
            "push_content": "阿扁：那是有記錄的……",
            "push_ipdatetime": "04/16 18:28",
            "push_tag": "→",
            "push_userid": "highyes"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d14d",
            "push_content": "政治人物窮得很少吧 這大概也就小康而已",
            "push_ipdatetime": "04/16 18:28",
            "push_tag": "→",
            "push_userid": "seemoon2000"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d14c",
            "push_content": "賴貪的比較少",
            "push_ipdatetime": "04/16 18:29",
            "push_tag": "→",
            "push_userid": "abram"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d14b",
            "push_content": "千金大小姐",
            "push_ipdatetime": "04/16 18:29",
            "push_tag": "→",
            "push_userid": "force5566"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d14a",
            "push_content": "賴清德醫生出身的 不當政治人物也不會窮到哪去",
            "push_ipdatetime": "04/16 18:29",
            "push_tag": "→",
            "push_userid": "seemoon2000"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d149",
            "push_content": "去年申報3291萬餘元的有價證券，這回無申報。 變現了?",
            "push_ipdatetime": "04/16 18:30",
            "push_tag": "推",
            "push_userid": "y1896547"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d148",
            "push_content": "爆增十倍,完了,皇軍抓到小辮子,要鋪天蓋地進攻了",
            "push_ipdatetime": "04/16 18:30",
            "push_tag": "→",
            "push_userid": "frank01"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d147",
            "push_content": "小英家世背景 有錢很意外嗎",
            "push_ipdatetime": "04/16 18:30",
            "push_tag": "推",
            "push_userid": "PeterHenson"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d146",
            "push_content": "蔡民調輸慘才會一直打賴廢話一堆",
            "push_ipdatetime": "04/16 18:31",
            "push_tag": "→",
            "push_userid": "aneshsiao"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d145",
            "push_content": "3291萬證券變現剩2337萬存款...賠真大",
            "push_ipdatetime": "04/16 18:33",
            "push_tag": "推",
            "push_userid": "pickoff"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d144",
            "push_content": "賴真的靠自己 礦工之子",
            "push_ipdatetime": "04/16 18:34",
            "push_tag": "推",
            "push_userid": "Tchachavsky"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d143",
            "push_content": "蔡他爸當年修進口車多賺 美軍進口車都要給他爸修",
            "push_ipdatetime": "04/16 18:34",
            "push_tag": "推",
            "push_userid": "njxmzxc"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d142",
            "push_content": "蔡英文這輩子沒工作過吧 這麼有錢",
            "push_ipdatetime": "04/16 18:34",
            "push_tag": "→",
            "push_userid": "Tchachavsky"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d141",
            "push_content": "看起來就是把有價證券變現了，是在高潮什麼",
            "push_ipdatetime": "04/16 18:39",
            "push_tag": "→",
            "push_userid": "botnet"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d140",
            "push_content": "蔡英文這輩子沒工作過？那她現在在做什麼？",
            "push_ipdatetime": "04/16 18:42",
            "push_tag": "→",
            "push_userid": "zzff92"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d13f",
            "push_content": "樓樓上 可以騙一些沒仔細看的人阿",
            "push_ipdatetime": "04/16 18:42",
            "push_tag": "推",
            "push_userid": "sasintw"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d13e",
            "push_content": "原來在政大教書不算工作......",
            "push_ipdatetime": "04/16 18:43",
            "push_tag": "推",
            "push_userid": "hyscout"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d13d",
            "push_content": "政治界理科太太",
            "push_ipdatetime": "04/16 18:45",
            "push_tag": "噓",
            "push_userid": "ChenYenChou"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d13c",
            "push_content": "現在就是要洗賴接地氣比較親勞工的風向啦",
            "push_ipdatetime": "04/16 18:45",
            "push_tag": "推",
            "push_userid": "chinhan1216"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d13b",
            "push_content": "3291萬有價證券變現...是要拿來當競選經費嗎？",
            "push_ipdatetime": "04/16 18:48",
            "push_tag": "推",
            "push_userid": "uini"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d13a",
            "push_content": "10倍是在上色什麼？頗呵",
            "push_ipdatetime": "04/16 18:48",
            "push_tag": "→",
            "push_userid": "uini"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d139",
            "push_content": "賴親勞工? 哈哈哈哈哈",
            "push_ipdatetime": "04/16 18:53",
            "push_tag": "推",
            "push_userid": "Km60369"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d138",
            "push_content": "笑死，越窮越貪好嗎",
            "push_ipdatetime": "04/16 18:58",
            "push_tag": "推",
            "push_userid": "audi0909"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d137",
            "push_content": "英德真有錢，勞工連$6萬都沒有，資進黨還要修惡勞基法",
            "push_ipdatetime": "04/16 18:59",
            "push_tag": "噓",
            "push_userid": "a123454698"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d136",
            "push_content": "，覺青支持這種黨真棒",
            "push_ipdatetime": "04/16 18:59",
            "push_tag": "→",
            "push_userid": "a123454698"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d135",
            "push_content": "賴沒那麼少啦 台南高鐵當初他大力推動....",
            "push_ipdatetime": "04/16 18:59",
            "push_tag": "推",
            "push_userid": "Garbolin"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d134",
            "push_content": "有常識都知道政治人物帳面財產參考用",
            "push_ipdatetime": "04/16 19:06",
            "push_tag": "→",
            "push_userid": "juicylove"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d133",
            "push_content": "老實說這種不到一億的在台灣還稱不上有錢人",
            "push_ipdatetime": "04/16 19:07",
            "push_tag": "→",
            "push_userid": "juicylove"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d132",
            "push_content": "沒有億的都太少",
            "push_ipdatetime": "04/16 19:24",
            "push_tag": "推",
            "push_userid": "s58565254"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d131",
            "push_content": "韋：有紀錄的有多少？",
            "push_ipdatetime": "04/16 19:28",
            "push_tag": "推",
            "push_userid": "eric19860102"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d130",
            "push_content": "個人認為 賴是礦工家庭長大 家境小時候比較困苦",
            "push_ipdatetime": "04/16 19:30",
            "push_tag": "推",
            "push_userid": "dan5209"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d12f",
            "push_content": "這母豬這麼有錢..",
            "push_ipdatetime": "04/16 19:35",
            "push_tag": "噓",
            "push_userid": "MadeTW"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d12e",
            "push_content": "樓上這跟國民黨的比算零頭好嗎",
            "push_ipdatetime": "04/16 19:54",
            "push_tag": "推",
            "push_userid": "Nano"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d12d",
            "push_content": "TOYOTA CAMRY汽車...QQ",
            "push_ipdatetime": "04/16 20:16",
            "push_tag": "→",
            "push_userid": "loki94y"
          },
          {
            "_id": "5ce0cfe36e8ee31ef232d12c",
            "push_content": "https://tinyurl.com/y8yscdto",
            "push_ipdatetime": "04/16 22:33",
            "push_tag": "→",
            "push_userid": "QQdragon"
          }
        ],
        "url": "https://www.ptt.cc/bbs/Gossiping/M.1555410445.A.B72.html",
        "__v": 0
      }
    ]
    const testSimilarUser = ["sasintw", "ahw12000", "OutBai", "imsphzzz"];
    const testSimilarUserList = [
      {
        id: "sasintw",
        reply: [
          {author: 'a', count: 2, articles: [{article_title: '[QE] A',article_title: '[QE] B'}]},
          {author: 'b', count: 1, articles: [{article_title: '[QE] C'}]}
        ],
        totalReplyCount: 6,
        repliedArticle: [
          {
            article_id: 'a', article_title: '[QE] A', date: "2019-04-15T00:15:32.000Z", 
            messages:[
              {push_userid: 'imsphzzz',push_tag: '推',push_ipdatetime: "04/15 09:51"},
              {push_userid: 'OutBai',push_tag: '→', push_ipdatetime: "04/15 19:22"},
              {push_userid: 'sasintw', push_tag: '推',push_ipdatetime: "04/15 20:22"}
            ]
          },
          {
            article_id: 'b', article_title: '[QE] B', date: "2019-04-15T00:36:32.000Z", 
            messages:[
              {push_userid: 'sasintw',push_tag: '噓',push_ipdatetime: "04/15 09:51"},
              {push_userid: 'imsphzzz', push_tag: '→',push_ipdatetime: "04/15 19:22"}
            ],
          },
          {
            article_id: 'c', article_title: '[QE] C', date: "2019-04-15T00:42:00.000Z", 
            messages:[
              {push_userid: 'sasintw',push_tag: '推',push_ipdatetime: "04/15 09:51"},
              {push_userid: 'OutBai',push_tag: '→', push_ipdatetime: "04/15 19:22"}
            ],
          }
        ]
      },
      {
        id: "ahw12000",
        reply: [{author: 'b', count: 2,articles: [{article_title: 'D',article_title: 'E'}]}, {author: 'c', count: 1,articles: [{article_title: 'F'}]}],
        totalReplyCount: 64,
        repliedArticle: [
          {article_id: 'd', article_title: '[BO] D', date: "2019-04-15T01:02:06.000Z", messages:[{push_userid: 'ahw12000',push_tag: '推',push_ipdatetime: "04/15 09:51"},{push_userid: 'OutBai',push_tag: '噓', push_ipdatetime: "04/15 19:22"}],},
          {article_id: 'e', article_title: '[BO] E', date: "2019-04-15T01:55:20.000Z", messages:[{push_userid: 'ggggg',push_tag: '噓',push_ipdatetime: "04/15 09:51"},{push_userid: 'ahw12000', push_tag: '→',push_ipdatetime: "04/15 19:22"}],},
          {article_id: 'f', article_title: '[BO] F', date: "2019-04-15T02:13:24.000Z", messages:[{push_userid: 'imsphzzz', push_tag: '噓', push_ipdatetime: "04/15 19:11"},{push_userid: 'ahw12000',push_tag: '推', push_ipdatetime: "04/15 19:22"}],}]},
      {
        id: "OutBai",
        reply: [{author: 'a', count: 1,articles: [{article_title: 'A'}]}, {author: 'b', count: 2,articles: [{article_title: 'C',article_title: 'D'}]}],
        totalReplyCount: 24,
        repliedArticle: [
          {article_id: 'a', article_title: '[QE] A', date: "2019-04-15T00:15:32.000Z" , messages:[{push_userid: 'imsphzzz',push_tag: '推',push_ipdatetime: "04/15 09:51"},
          {push_userid: 'OutBai',push_tag: '→', push_ipdatetime: "04/15 19:22"},
          {push_userid: 'sasintw', push_tag: '推',push_ipdatetime: "04/15 20:22"}]},
          {article_id: 'c', article_title: '[QE] C', date: "2019-04-15T00:42:00.000Z", messages:[
            {push_userid: 'sasintw',push_tag: '推',push_ipdatetime: "04/15 09:51"},
            {push_userid: 'OutBai',push_tag: '→', push_ipdatetime: "04/15 19:22"}
          ],},
          {article_id: 'd', article_title: '[BO] D', date: "2019-04-15T01:02:06.000Z", messages:[{push_userid: 'ahw12000',push_tag: '推',push_ipdatetime: "04/15 09:51"},{push_userid: 'OutBai',push_tag: '噓', push_ipdatetime: "04/15 19:22"}],}]},
      {
        id: "imsphzzz",
        reply: [{author: 'a', count: 2,articles: [{article_title: 'A',article_title: 'B'}]}, {author: 'c', count: 1,articles: [{article_title: 'F'}]}],
        totalReplyCount: 88,
        repliedArticle: [
          {article_id: 'a', article_title: '[QE] A', date: "2019-04-15T00:15:32.000Z" , messages:[{push_userid: 'imsphzzz',push_tag: '推',push_ipdatetime: "04/15 09:51"},
          {push_userid: 'OutBai',push_tag: '→', push_ipdatetime: "04/15 19:22"},
          {push_userid: 'sasintw', push_tag: '推',push_ipdatetime: "04/15 20:22"}]},
          {article_id: 'b', article_title: '[QE] B', date: "2019-04-15T00:36:32.000Z" , messages:[
            {push_userid: 'sasintw',push_tag: '噓',push_ipdatetime: "04/15 09:51"},
            {push_userid: 'imsphzzz', push_tag: '→',push_ipdatetime: "04/15 19:22"}
          ],},
          {article_id: 'f', article_title: '[BO] F', date: "2019-04-15T02:13:24.000Z", messages:[{push_userid: 'imsphzzz', push_tag: '噓', push_ipdatetime: "04/15 19:11"},{push_userid: 'ahw12000',push_tag: '推', push_ipdatetime: "04/15 19:22"}],}]},
    ]
    const articleArr = [
      {
        article_id: 'a',
        article_title: '[QE] A',
        date: "2019-04-15T00:15:32.000Z" ,
        messages:[
          {push_userid: 'imsphzzz',push_tag: '推',push_ipdatetime: "04/15 09:51"},
          {push_userid: 'OutBai',push_tag: '→', push_ipdatetime: "04/15 19:22"},
          {push_userid: 'sasintw', push_tag: '推',push_ipdatetime: "04/15 20:22"}
        ],
        author:'a',
      },
      {
        article_id: 'b',
        article_title: '[QE] B',
        date: "2019-04-15T00:36:32.000Z" ,
        messages:[
          {push_userid: 'sasintw',push_tag: '噓',push_ipdatetime: "04/15 09:51"},
          {push_userid: 'imsphzzz', push_tag: '→',push_ipdatetime: "04/15 19:22"}
        ],
        author:'a',
      },
      {
        article_id: 'c',
        article_title: '[QE] C',
        date: "2019-04-15T00:42:00.000Z",
        messages:[
          {push_userid: 'sasintw',push_tag: '推',push_ipdatetime: "04/15 09:51"},
          {push_userid: 'OutBai',push_tag: '→', push_ipdatetime: "04/15 19:22"}
        ],
        author:'b',
      },
      {
        article_id: 'd',
        article_title: '[BO] D',
        date: "2019-04-15T01:02:06.000Z",
        messages:[{push_userid: 'ahw12000',push_tag: '推',push_ipdatetime: "04/15 09:51"},{push_userid: 'OutBai',push_tag: '噓', push_ipdatetime: "04/15 19:22"}],
        author:'b',
      },
      {
        article_id: 'e',
        article_title: '[BO] E',
        date: "2019-04-15T01:55:20.000Z",
        messages:[{push_userid: 'ggggg',push_tag: '噓',push_ipdatetime: "04/15 09:51"},{push_userid: 'ahw12000', push_tag: '→',push_ipdatetime: "04/15 19:22"}],
        author:'b'
      },
      {
        article_id: 'f',
        article_title: '[BO] F',
        date: "2019-04-15T02:13:24.000Z",
        messages:[{push_userid: 'imsphzzz', push_tag: '噓', push_ipdatetime: "04/15 19:11"},{push_userid: 'ahw12000',push_tag: '推', push_ipdatetime: "04/15 19:22"}],
        author:'c'},
    ];
    const similarity = [
      {
        "source": "sasintw",
        "target": "ahw12000",
        "value": 0,
        "weight": 0
      },
      {
        "source": "sasintw",
        "target": "OutBai",
        "value": 0.5,
        "weight": 5
      },
      {
        "source": "sasintw",
        "target": "imsphzzz",
        "value": 0.5,
        "weight": 5
      },
      {
        "source": "ahw12000",
        "target": "OutBai",
        "value": 0.2,
        "weight": 2
      },
      {
        "source": "ahw12000",
        "target": "imsphzzz",
        "value": 0.2,
        "weight": 2
      },
      {
        "source": "OutBai",
        "target": "imsphzzz",
        "value": 0.2,
        "weight": 2
      }
    ];
    userSimilarityGraph(testSimilarUserList, userSimilaritySvg, testSimilarUser, articleArr, 
      // similarity,
    );
    // userDailyActivity(testData, testUser, commentTimelineSvg, beginDate, endDate);

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
        <div className="heatMap" style={{ borderRight: '2px solid gray', overflow: 'scroll', maxHeight: '800px', minHeight: '400px' }}>
          <div className="option" style={{width: '100%', height: '60px', display: 'flex' }}/>
          <svg id="timeLine" width="100%" height="100%" />
        </div>
        <div className="contextDiv">
          <div className="option" style={{width: '100%', height: '50px', display: 'flex' }}/>
          <svg id="context" width="100%" height="100%" />
        </div>
        <div className="focusDiv">
          <svg id="focus" width="100%" height="100%" />
        </div>
        {/* <div className="selectedUserTable d-flex flex-column" style={{ margin: '20px 0px', maxHeight: '700px', minHeight: '400px' }} /> */}
        {/* <div
          className="commentTimeline"
          style={{
            // position: 'absolute',
            // top: '15px',
            // left: '15px',
            overflowY: 'scroll',
            minHeight: '0px',
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
        </div> */}
        {/* <WordTree word={word} optionsWord={optionsWord} /> */}
      </div>
    );
  }
}

export default OpinionLeaderView;
