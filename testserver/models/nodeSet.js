/* eslint-disable no-use-before-define */
/* eslint-env node */
module.exports = {
  setNodes(list, date, word, post) {
    const linkThreshold = 0.1;
    const SetNumOfNodes = 200;
    const visprops = list;
    const startDate = new Date(date.$gte);
    const endDate = new Date(date.$lt);
    const timePeriod = endDate - startDate;
    const props = JSON.parse(JSON.stringify(visprops)); // clone props;
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
    mergeTermNodesWithUserCountEqualsOne();
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
      for (let i = 0; i < props.length - 1; i += 1) {
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
    }
    function removeTermNodesWithRemovedWords() {
      for (let i = 0; i < removeWords.length; i += 1) {
        const index = props.findIndex(prop => prop[0] === removeWords[i]);
        if (index !== -1) props.splice(index, 1);
      }
    }
    function computePropsUserList() {
      // console.log(props);
      for (let i = 0; i < props.length; i += 1) {
        if (props[i][1]) {
          props[i][1].forEach((userId) => {
            const existedUser = propsUserList.find(user => user.id === userId);
            if (existedUser) {
              existedUser.term.push(props[i][0]);
              existedUser.count += 1;
            } else {
              const count = post.filter(article => article.author === userId).length;
              propsUserList.push({
                id: userId,
                numOfUsr: 1,
                merge: 1,
                count: 1,
                postCount: count,
                term: [props[i][0]],
                responder: [],
              });
            }
          });
        }
      }
  
      post.forEach((article) => {
        const index = propsUserList.find(user => user.id === article.author);
        if (index) {
          const { push, boo, neutral } = article.message_count;
          const totalMessageCount = push + boo + neutral;
          index.responder.push({
            title: article.article_title,
            message: article.messages,
            message_count: [
              { type: 'push', count: article.message_count.push, radius: totalMessageCount },
              { type: 'boo', count: article.message_count.boo, radius: totalMessageCount },
              { type: 'neutral', count: article.message_count.neutral, radius: totalMessageCount },
            ],
          });
        }
      });
      // console.log(propsUserList);
    }
    function propsDataStructureBuild() {
      for (let i = 0; i < props.length; i += 1) {
        propsUserList.forEach((propsUser) => {
          const index = props[i][1].findIndex(user => user === propsUser.id);
          if (index !== -1) {
            props[i][1].splice(index, 1);
            props[i][1].push(propsUser);
          }
        });
      }
    }
    function mergeTermNodesWithUserCountEqualsOne() {
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
    }
    function setNodes() {
      for (let i = 0; i < Math.min(props.length, SetNumOfNodes); i += 1) {
        if (props[i][0] != null) {
          const existKey = set.nodes.find(ele => ele.titleTerm === props[i][0]);
          if (existKey === undefined) {
            if (!removeWords.includes(props[i][0])) {
              set.nodes.push({
                titleTerm: props[i][0],
                children: props[i][1],
                _children: [],
                articleIndex: props[i][2],
                date: props[i][3],
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
    }
    function computeNodesUserList() {
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
      // console.log(userList);
    }
    function computeNumOfUsersHaveSameTerm() {
      for (let i = 0; i < set.nodes.length - 1; i += 1) {
        for (let j = i + 1; j < set.nodes.length; j += 1) {
          let numOfSameUsers = 0;
          const largestNumOfSameUsers = 0;
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
    }
    function LinkTitleWordByArticleIndex() {
      let link_index = 0;
      for (let i = 0; i < set.nodes.length - 1; i += 1) {
        for (let j = i + 1; j < set.nodes.length; j += 1) {
          let count = 0;
          if (i !== j) {
            set.nodes[i].children.forEach((id1) => {
              if (set.nodes[j].children.includes(id1)) count += 1;
            });
            if (count !== 0) {
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
              link_index += 1;
            }
          }
        }
      }
    }
    function reduceLinksByThreshHold(threshold) {
      for (let i = 0; i < set.links.length; i += 1) {
        const { source, target } = set.links[i];
        const links_Strength = set.links[i].value;
        const source_Strength = set.nodes.find(_node => _node.titleTerm === source)
          .articleIndex.length;
        const target_Strength = set.nodes.find(_node => _node.titleTerm === target)
          .articleIndex.length;
        const link_threshold = (source_Strength + target_Strength) * threshold;
        if ((links_Strength * 2) < link_threshold || links_Strength === 1) {
          // console.log(link_threshold);
          // console.log(source, target);
          set.links.splice(i, 1);
          i -= 1;
        }
      }
    }
    return set;
  },
};
