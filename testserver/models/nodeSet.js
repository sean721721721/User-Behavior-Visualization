/* eslint-disable no-use-before-define */
/* eslint-env node */
const nodejieba = require('nodejieba');
let jb = require('./text.js');

module.exports = {
  setNodes(list, date, word, post) {
    // console.log(list);
    // console.log(post);
    const copyPost = JSON.parse(JSON.stringify(post));
    for (let i = 0; i < copyPost.length; i += 1) {
      for (let j = 0; j < copyPost[i].messages.length; j += 1) {
        copyPost[i].messages[j].cutted_push_content = [];
      }
    }


    const NS_PER_SEC = 1e6;
    const linkThreshold = 0.01;
    const SetNumOfNodes = 200;
    const visprops = list;
    // const startDate = new Date(date.$gte);
    // const endDate = new Date(date.$lt);
    // const timePeriod = endDate - startDate;
    const props = JSON.parse(JSON.stringify(visprops)); // clone props;
    // props = [
    //   ['term',
    //     ['authors','authors'],
    //     ['articleIndex','articleIndex'],
    //     [
    //       {'article'},
    //       {'article'},
    //     ]
    //   ],
    //   ['term',
    //     ['authors','authors'],
    //     ['articleIndex','articleIndex'],
    //     [
    //       {'article'},
    //       {'article'},
    //     ]
    //   ]
    // ]
    // console.log(props);
    const set = { nodes: [], links: [] };
    const userList = [{ id: '', count: 0, term: [] }];
    const propsUserList = [{ id: '', count: 0, term: [] }];
    const initLinks = [];
    const removeWords = ['新聞', '八卦', '幹嘛', '問卦', '爆卦'];
    props.splice(SetNumOfNodes);
    mergeTermNodes();
    // console.log('mergeTermNodes done!');
    removeTermNodesWithRemovedWords();
    // console.log('removeTermNodesWithRemovedWords done!');

    for (let i = 0; i < props.length - 1; i += 1) {
      props[i][1] = [...new Set(props[i][1])];
      props[i][1].sort();
    }

    computePropsUserList();
    // console.log('computePropsUserList done!');
    propsDataStructureBuild();
    // console.log('propsDataStructureBuild done!');
    // mergeTermNodesWithUserCountEqualsOne();
    // console.log('mergeTermNodesWithUserCountEqualsOne done!');
    setNodes();
    // console.log('setNodes done!');

    for (let i = 0; i < set.nodes.length - 1; i += 1) {
      set.nodes[i].children.sort();
    }

    computeNodesUserList();
    // console.log('computeNodesUserList done!');
    computeNumOfUsersHaveSameTerm();
    // console.log('computeNumOfUsersHaveSameTerm done!');
    LinkTitleWordByArticleIndex();
    // console.log('LinkTitleWordByArticleIndex done!');
    reduceLinksByThreshHold(linkThreshold);
    // console.log('reduceLinksByThreshHold done!');
    function mergeTermNodes() {
      const time = process.hrtime();
      for (let i = 0; i < props.length - 1; i += 1) {
        // console.log(props[i][0]);
        for (let j = i + 1; j < props.length; j += 1) {
          let numOfSameUser = 0;
          for (let k = 0; k < props[i][1].length; k += 1) {
            const findTheSameUser = props[j][1].includes(props[i][1][k]);
            numOfSameUser = (findTheSameUser) ? numOfSameUser + 1 : numOfSameUser;
          }
          if (numOfSameUser === props[i][1].length && numOfSameUser === props[j][1].length) {
            const addingTerm = ` ${props[j][0]}`;
            props[i][0] += addingTerm;
            props.splice(j, 1);
            j -= 1;
          }
        }
      }
      const diff = process.hrtime(time);
      console.log(`mergeTermNodes() Benchmark took ${(diff[0] + diff[1]) / NS_PER_SEC} ms`);
    }
    function removeTermNodesWithRemovedWords() {
      const time = process.hrtime();
      for (let i = 0; i < removeWords.length; i += 1) {
        const index = props.findIndex(prop => prop[0] === removeWords[i]);
        if (index !== -1) props.splice(index, 1);
      }
      const diff = process.hrtime(time);
      console.log(`removeTermNodesWithRemovedWords() Benchmark took ${(diff[0] + diff[1]) / NS_PER_SEC} ms`);
    }
    function computePropsUserList() {
      let time = process.hrtime();
      // console.log(props);
      for (let i = 0; i < props.length; i += 1) {
        if (props[i][1]) { // userId
          // console.log(props[i][1]);
          let index = 0;
          props[i][1].forEach((userId) => {
            for (index; index < propsUserList.length; index += 1) {
              if (propsUserList[index].id === userId) {
                propsUserList[index].term.push(props[i][0]); // props[i][0] = term;
                propsUserList[index].count += 1;
                break;
              }
            }
            if (index === propsUserList.length) {
              index = 0;
              const count = copyPost.filter(article => article.author === userId).length;
              propsUserList.push({
                id: userId,
                numOfUsr: 1,
                merge: 1,
                count: 1,
                postCount: count,
                term: [props[i][0]],
                responder: [],
                titleTermArr: [],
              });
            }
          });
        }
      }
      let diff = process.hrtime(time);
      console.log(`computePropsUserList() Benchmark took ${(diff[0] + diff[1]) / NS_PER_SEC} ms`);
      time = process.hrtime();
      let articleMapToCuttedWordIndex = 0;
      for (let i = 0; i < copyPost.length; i += 1) {
        for (let j = 0; j < copyPost[i].messages.length; j += 1) {
          // console.log(copyPost[i].messages[j].push_content);
          const w = jb.simpleCut(copyPost[i].messages[j].push_content);
          // console.log('word: ', w);
          copyPost[i].messages[j].cutted_push_content = w;
          // console.log(copyPost[i].messages[j].cutted_push_content);
        }
      }
      // console.log(copyPost.messages[0].cutted_push_content);
      copyPost.forEach((article) => {
        // console.log(article.messages[0]);
        const index = propsUserList.find(user => user.id === article.author);
        if (index) {
          const { push, boo, neutral } = article.message_count;
          const totalMessageCount = push + boo + neutral;
          index.titleTermArr.push(word[articleMapToCuttedWordIndex]);
          index.responder.push({
            articleId: article.article_id,
            title: article.article_title,
            message: article.messages,
            url: article.url,
            author: index.id,
            message_count: [
              { type: 'push', count: article.message_count.push, radius: totalMessageCount },
              { type: 'boo', count: article.message_count.boo, radius: totalMessageCount },
              { type: 'neutral', count: article.message_count.neutral, radius: totalMessageCount },
            ],
            date: article.date,
          });
        }
        articleMapToCuttedWordIndex += 1;
      });
      // console.log(propsUserList);
      diff = process.hrtime(time);
      console.log(`computePropsUserList() Benchmark took ${(diff[0] + diff[1]) / NS_PER_SEC} ms`);
    }

    function propsDataStructureBuild() {
      const time = process.hrtime();
      for (let i = 0; i < props.length; i += 1) {
        propsUserList.forEach((propsUser) => {
          const index = props[i][1].findIndex(user => user === propsUser.id);
          if (index !== -1) {
            props[i][1].splice(index, 1);
            props[i][1].push(propsUser);
          }
        });
      }
      const diff = process.hrtime(time);
      console.log(`propsDataStructureBuild() Benchmark took ${(diff[0] + diff[1]) / NS_PER_SEC} ms`);
    }

    function mergeTermNodesWithUserCountEqualsOne() {
      const time = process.hrtime();
      const hasMergedId = [];
      for (let i = 0; i < props.length; i += 1) { // which title
        for (let j = 0; j < props[i][1].length - 1; j += 1) {
          for (let k = j + 1; k < props[i][1].length; k += 1) {
            let equal = 1;
            // console.log(props[i][1][j].id, props[i][1][k].id);
            if (props[i][1][j].count === props[i][1][k].count && props[i][1][j].term) {
              for (let l = 0; l < props[i][1][j].term.length; l += 1) {
                if (!props[i][1][k].term.includes(props[i][1][j].term[l])) {
                  // console.log(`${props[i][1][j].id} is not equal to ${props[i][1][k].id}`);
                  equal = 0;
                  break;
                }
              }
              if (equal === 1) {
                if (!hasMergedId.includes(props[i][1][k].id)) {
                  // console.log(`${props[i][1][j].id} is equal to ${props[i][1][k].id}`);
                  props[i][1][j].id += props[i][1][k].id;
                  hasMergedId.push(props[i][1][k].id);
                  props[i][1][j].responder = props[i][1][j].responder
                    .concat(props[i][1][k].responder);
                  props[i][1][j].merge = 2;
                  props[i][1][j].numOfUsr += 1;
                  // console.log(props[i][1][j].postCount, props[i][1][k].postCount);
                  props[i][1][j].postCount += props[i][1][k].postCount;
                  // console.log(props[i][1][j].responder, props[i][1][k].responder);
                }
                props[i][1].splice(k, 1);
                k -= 1;
              }
            }
          }
        }
      }
      const diff = process.hrtime(time);
      console.log(`mergeTermNodesWithUserCountEqualsOne() Benchmark took ${(diff[0] + diff[1]) / NS_PER_SEC} ms`);
    }
    function setNodes() {
      const time = process.hrtime();
      for (let i = 0; i < Math.min(props.length, SetNumOfNodes); i += 1) {
        // console.log(props[i][2]);
        // console.log(props[i][1].length);
        if (props[i][0] != null) {
          // console.log(props[i][4]);
          // console.log(i);
          const existKey = set.nodes.find(ele => ele.titleTerm === props[i][0]);
          if (existKey === undefined) {
            if (!removeWords.includes(props[i][0])) {
              const messageCount = {
                all: 0, boo: 0, neutral: 0, push: 0,
              };
              let articleId = [];
              if (props[i][4].length > 1) {
                articleId = props[i][4].map(e => e.articleId);
                messageCount.all = props[i][4].reduce((sum, { messageCount: { all } }) => sum + all, 0);
                messageCount.boo = props[i][4].reduce((sum, { messageCount: { boo } }) => sum + boo, 0);
                messageCount.neutral = props[i][4].reduce((sum, { messageCount: { neutral } }) => sum + neutral, 0);
                messageCount.push = props[i][4].reduce((sum, { messageCount: { push } }) => sum + push, 0);
              } else {
                articleId.push(props[i][4][0].articleId);
                messageCount.all = props[i][4][0].messageCount.all;
                messageCount.boo = props[i][4][0].messageCount.boo;
                messageCount.neutral = props[i][4][0].messageCount.neutral;
                messageCount.push = props[i][4][0].messageCount.push;
              }

              const articles = [];
              // console.log(props[0][1][0]);
              //   console.log(messageCount);
              articleId.some((id) => {
                const firstRes = props[i][1].some((author) => {
                  const secondRes = author.responder.forEach((p) => {
                    if (p.articleId === id) {
                      const { message_count } = p;
                      const all = message_count[0].radius;
                      const size = (all / messageCount.all) * 50;
                      // console.log(message_count, all, size);
                      const temp = p;
                      temp.author = author.id;
                      temp.size = size;
                      temp.group = 3;
                      temp.message = p.message;
                      articles.push(p);
                      return true;
                    }
                  });
                  if (secondRes) return true;
                });
                if (firstRes) return true;
              });
              // console.log(articles);

              set.nodes.push({
                titleTerm: props[i][0],
                children: props[i][1],
                _children: [],
                articles,
                articleIndex: props[i][2],
                articleId,
                date: props[i][3],
                messageCount,
                community: [['', 0]],
                group: 1,
                tag: 0,
                show: 1,
                connected: -1,
                size: 5 + Math.log2(props[i][1].length),
              });
              props[i][1].forEach((titleTerm) => {
                const existId = set.nodes.find(ele => ele.titleTerm === titleTerm);
                if (existId === undefined) {
                  // if(id != null)
                  //   set.nodes.push({id: id, group: 2, tag: 0, size: 5});
                }
              });
            }
          }
        }
      }
      const diff = process.hrtime(time);
      console.log(`setNodes() Benchmark took ${(diff[0] + diff[1]) / NS_PER_SEC} ms`);
    }

    function computeNodesUserList() {
      const time = process.hrtime();
      for (let i = 0; i <= set.nodes.length; i += 1) {
        if (set.nodes[i]) {
          if (set.nodes[i].children) {
            set.nodes[i].children.forEach((userId) => {
              const existedUser = userList.find(x => x.id === userId);
              if (existedUser) {
                existedUser.term.push(set.nodes[i].titleTerm);
                existedUser.count += 1;
              } else {
                userList.push({ id: userId, count: 1, term: [set.nodes[i].titleTerm] });
              }
            });
          }
        }
      }
      const diff = process.hrtime(time);
      console.log(`computeNodesUserList() Benchmark took ${(diff[0] + diff[1]) / NS_PER_SEC} ms`);
      // console.log(userList);
    }
    function computeNumOfUsersHaveSameTerm() {
      const time = process.hrtime();
      for (let i = 0; i < set.nodes.length - 1; i += 1) {
        for (let j = i + 1; j < set.nodes.length; j += 1) {
          let numOfSameUsers = 0;
          //   const largestNumOfSameUsers = 0;
          // let term = '';
          for (let k = 0; k < set.nodes[i].children.length; k += 1) {
            const haveTheSameUsers = set.nodes[j].children.includes(set.nodes[i].children[k]);
            if (haveTheSameUsers) numOfSameUsers += 1;
          }
          if (numOfSameUsers > set.nodes[i].community[0][1]) {
            set.nodes[i].community[0][0] = set.nodes[j].titleTerm;
            set.nodes[i].community[0][1] = numOfSameUsers;
          } else if (numOfSameUsers === set.nodes[i].community[0][1]) {
            set.nodes[i].community.push([set.nodes[j].titleTerm, numOfSameUsers]);
          }
        }
      }
      const diff = process.hrtime(time);
      console.log(`computeNumOfUsersHaveSameTerm() Benchmark took ${(diff[0] + diff[1]) / NS_PER_SEC} ms`);
    }
    function LinkTitleWordByArticleIndex() {
      const time = process.hrtime();
      //   let linkIndex = 0;
      // for (let i = 0; i < set.nodes.length - 1; i += 1) {
      //   for (let j = i + 1; j < set.nodes.length; j += 1) {
      //     let count = 0;
      //     if (i !== j) {
      //       set.nodes[i].children.forEach((id1) => {
      //         if (set.nodes[j].children.includes(id1)) count += 1;
      //       });
      //       // if (count !== 0) {
      //       //   set.links.push({
      //       //     source: set.nodes[i].titleTerm,
      //       //     target: set.nodes[j].titleTerm,
      //       //     tag: 0,
      //       //     color: '#d9d9d9 ',
      //       //     value: count,
      //       //   });
      //       //   initLinks.push({
      //       //     source: {
      //       //       titleTerm: set.nodes[i].titleTerm,
      //       //       index: i,
      //       //     },
      //       //     target: {
      //       //       titleTerm: set.nodes[j].titleTerm,
      //       //       index: j,
      //       //     },
      //       //     tag: 0,
      //       //     value: count,
      //       //   });
      //       // //   linkIndex += 1;
      //       // }
      //       for (let k = 0; k < count; k += 1) {
      //         set.links.push({
      //           source: set.nodes[i].titleTerm,
      //           target: set.nodes[j].titleTerm,
      //           tag: 0,
      //           color: '#d9d9d9 ',
      //           value: count,
      //         });
      //         initLinks.push({
      //           source: {
      //             titleTerm: set.nodes[i].titleTerm,
      //             index: i,
      //           },
      //           target: {
      //             titleTerm: set.nodes[j].titleTerm,
      //             index: j,
      //           },
      //           tag: 0,
      //           value: count,
      //         });
      //       }
      //     }
      //   }
      // }
      for (let i = 0; i < set.nodes.length - 1; i += 1) {
        for (let j = i + 1; j < set.nodes.length; j += 1) {
          let count = 0;
          if (i !== j) {
            set.nodes[i].articleIndex.forEach((id1) => {
              if (set.nodes[j].articleIndex.includes(id1)) count += 1;
            });

            for (let k = 0; k < count; k += 1) {
              set.links.push({
                source: set.nodes[i].titleTerm,
                target: set.nodes[j].titleTerm,
                tag: 0,
                color: '#d9d9d9 ',
                value: count,
              });
              initLinks.push({
                source: {
                  titleTerm: set.nodes[i].titleTerm,
                  index: i,
                },
                target: {
                  titleTerm: set.nodes[j].titleTerm,
                  index: j,
                },
                tag: 0,
                value: count,
              });
            }
          }
        }
      }
      const diff = process.hrtime(time);
      console.log(`LinkTitleWordByArticleIndex() Benchmark took ${(diff[0] + diff[1]) / NS_PER_SEC} ms`);
    }

    function reduceLinksByThreshHold(threshold) {
      const time = process.hrtime();
      for (let i = 0; i < set.links.length; i += 1) {
        const { source, target } = set.links[i];
        const linksStrength = set.links[i].value;
        const sourceStrength = set.nodes.find(_node => _node.titleTerm === source)
          .articleIndex.length;
        const targetStrength = set.nodes.find(_node => _node.titleTerm === target)
          .articleIndex.length;
        const linkThre = (sourceStrength + targetStrength) * threshold;
        if ((linksStrength * 2) < linkThre || linksStrength === 1) {
          // console.log(link_threshold);
          // console.log(source, target);
          set.links.splice(i, 1);
          i -= 1;
        }
      }
      const diff = process.hrtime(time);
      console.log(`reduceLinksByThreshHold() Benchmark took ${(diff[0] + diff[1]) / NS_PER_SEC} ms`);
    }
    return [set, initLinks];
  },
};
