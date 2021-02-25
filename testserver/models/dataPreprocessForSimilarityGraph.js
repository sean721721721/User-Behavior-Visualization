/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
/* eslint-disable max-len */
// const jb = require('./text.js');

module.exports = {
  buildUserList(userLists, articles, userId) {
    userId.forEach(e => {
      userLists.push({
        id: e, totalReplyCount: 0, repliedArticle: [], reply: [], titleWordScore: [],
      });
    });
    const removeWords = ['新聞', '問卦', '爆卦', 'Re', '八卦'];
    articles.forEach(article => {
      const a = { ...article };
      article.messages.forEach(mes => {
        const existedUser = userLists.find(e => e.id === mes.push_userid);
        if (existedUser) {
          const mesLen = article.messages.filter(e => e.push_userid === existedUser.id).length;
          const score = 1 / mesLen;
          const existedArticle = existedUser.repliedArticle.find(e => e.article_id === article.article_id);
          existedUser.totalReplyCount += 1;
          if (!existedArticle) existedUser.repliedArticle.push(a);
        } else userLists.push({ id: mes.push_userid, repliedArticle: [a], totalReplyCount: 1 });
      });
    });
  },
  computeUserSimilarityByArticles(userAuthorRelationShipArr) {
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
  },
};
