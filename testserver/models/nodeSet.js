/* eslint-disable no-use-before-define */
/* eslint-env node */

module.exports = {
  newSetNodes(post) {
    const copyPost = JSON.parse(JSON.stringify(post));
    const set = [];
    copyPost.forEach((article) => {
      const existedUser = set.find(e => e.id === article.author);
      if (existedUser) {
        existedUser.postCount += 1;
        existedUser.responder.push(article);
      } else {
        set.push({
          id: article.author,
          postCount: 1,
          responder: [article],
        });
      }
    });
    return [set];
  },
};
