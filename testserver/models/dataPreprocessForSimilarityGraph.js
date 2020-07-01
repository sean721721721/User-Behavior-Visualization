/* eslint-disable max-len */
module.exports = {
  buildUserList(userLists, articles, userId) {
  // console.log(articles, userId);
    userId.forEach((e) => {
      userLists.push({
        id: e, totalReplyCount: 0, repliedArticle: [], reply: [],
      });
    });
    const authorList = [];
    const articleList = [];
    let totalReplyCount = 0;
    articles.forEach((article) => {
      article.messages.forEach((mes) => {
        const existedUser = userLists.find(e => e.id === mes.push_userid);
        if (existedUser) {
          const existedArticle = existedUser.repliedArticle.find(e => e.article_id === article.article_id);
          existedUser.totalReplyCount += 1;
          if (!existedArticle) {
            existedUser.repliedArticle.push(article);
          }
        } else {
          userLists.push({ id: mes.push_userid, repliedArticle: [article], totalReplyCount: 1 });
        }
      });
    });
    // userLists.forEach((usr) => {
    //   usr.repliedArticle.forEach((article) => {
    //     const existedAuthor = usr.reply.find(e => e.author === article.author);
    //     if (existedAuthor) {
    //       existedAuthor.count += 1;
    //       existedAuthor.articles.push({
    //         article_title: article.article_title,
    //       });
    //     } else {
    //       usr.reply.push({
    //         author: article.author,
    //         count: 1,
    //         articles: [{
    //           article_title: article.article_title,
    //         }],
    //       });
    //     }
    //   });
    // });
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
