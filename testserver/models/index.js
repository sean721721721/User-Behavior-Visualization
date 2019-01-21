/* eslint-disable */
module.exports = function (app) {
    var files = []; //["post", "account"];
    files.forEach(function (file) {
        require("./" + file)(app);
    });
};