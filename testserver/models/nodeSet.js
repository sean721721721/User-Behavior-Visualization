/* eslint-disable no-use-before-define */
/* eslint-env node */
const nodejieba = require('nodejieba');
let jb = require('./text.js');

module.exports = {
  newSetNodes(list, date, word, post) {
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
