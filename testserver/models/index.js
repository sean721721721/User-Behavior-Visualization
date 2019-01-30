/* eslint-env node */
const model = function model(app) {
  const files = []; // ["post", "account"];
  files.forEach((file) => {
    require(`./${file}`)(app);
  });
};

module.exports = model;
