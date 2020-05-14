module.exports = {
  buildUserList(userLists, articles, userId) {
  // console.log(articles, userId);
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
