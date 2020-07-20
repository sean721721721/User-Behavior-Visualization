/* eslint-disable max-len */
const jb = require('./text.js');

module.exports = {
  buildUserList(userLists, articles, userId) {
  // console.log(articles, userId);
    userId.forEach((e) => {
      userLists.push({
        id: e, totalReplyCount: 0, repliedArticle: [], reply: [], titleWordScore: [],
      });
    });
    const removeWords = ['新聞', '問卦', '爆卦', 'Re'];
    articles.forEach((article) => {
      let cuttedTitle = article.article_title ? jb.simpleCut(article.article_title) : [];
      cuttedTitle = cuttedTitle.filter((e) => {
        return !removeWords.includes(e.word);
      });
      const a = { ...article._doc, cuttedTitle };
      article.messages.forEach((mes) => {
        const existedUser = userLists.find(e => e.id === mes.push_userid);
        if (existedUser) {
          const mesLen = article.messages.filter(e => e.push_userid === existedUser.id).length;
          const pushTag = mes.push_tag;
          let score = 1 / mesLen;
          // calculate score push tag
          // if (pushTag === '推') score = 1 / mesLen;
          // else if (pushTag === '噓') score = -1 / mesLen;
          // else score = 0;
          
          cuttedTitle.forEach((e) => {

            const existedWord = existedUser.titleWordScore.find(w => w.word === e.word);
            if (existedWord) existedWord.score += score;
            else existedUser.titleWordScore.push({ word: e.word, score });
          });
          const existedArticle = existedUser.repliedArticle.find(e => e.article_id === article.article_id);
          existedUser.totalReplyCount += 1;
          if (!existedArticle) existedUser.repliedArticle.push(a);
        } else userLists.push({ id: mes.push_userid, repliedArticle: [a], totalReplyCount: 1 });
      });
    });
    userLists.forEach((usr) => {
      usr.titleWordScore.sort((a, b) => (a.score > b.score ? -1 : 1));
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
        // console.log(userAuthorRelationShipArr[i].id, userAuthorRelationShipArr[j].id, similarity);
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
