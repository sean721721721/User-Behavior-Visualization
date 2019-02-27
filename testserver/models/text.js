/* eslint-disable */
var fs = require('fs');
var nodejieba = require("nodejieba");
const os = require('os');

//test
/*var path = "../data/saveposts_2014-03-01_2014-04-01_136845026417486_4-10-(17)-2017.json";
var data = JSON.parse(fs.readFileSync(path, 'UTF-8'));

var text = data.data[0].message;
console.log(text)

var result = nodejieba.cut(text);
//console.log(result);

result = nodejieba.cut(text, true);
//console.log(result);

result = nodejieba.cutHMM(text);
//console.log(result);

result = nodejieba.cutAll(text);
console.log(result);

result = nodejieba.cutForSearch(text);
//console.log(result);

result = nodejieba.tag(text);
//console.log(result);

var topN = 5;
result = nodejieba.extract(text, topN);
console.log(result);

result = nodejieba.cut("男默女泪");
//console.log(result);
nodejieba.insertWord("男默女泪");
result = nodejieba.cut("男默女泪");
//console.log(result);

result = nodejieba.cutSmall("南京市长江大桥", 3);
//console.log(result);*/

if (os.platform() === "linux") {
    nodejieba.load({
        dict: nodejieba.DEFAULT_DICT,
        hmmDict: nodejieba.DEFAULT_HMM_DICT,
        //userDict: "d:/project/server/big_dict.utf8", //windows
        userDict: "/home/sean/github/PageVis/controllers/big_dict.utf8", //linux        
        idfDict: nodejieba.DEFAULT_IDF_DICT,
        //stopWordDict: "d:/project/server/stop_dict.utf8" //windows
        stopWordDict: "/home/sean/github/PageVis/controllers/stop_dict.utf8" //linux    
    });
} else {
    nodejieba.load({
        dict: nodejieba.DEFAULT_DICT,
        hmmDict: nodejieba.DEFAULT_HMM_DICT,
        userDict: "F:/PageVis/PageVis/controllers/big_dict.utf8", //windows
        //userDict: "/Users/guojiankai/Project/server/big_dict.utf8", //mac        
        idfDict: nodejieba.DEFAULT_IDF_DICT,
        stopWordDict: "F:/PageVis/PageVis/controllers/stop_dict.utf8" //windows
        //stopWordDict: "/Users/guojiankai/Project/server/stop_dict.utf8" //mac    
    });
}

function filter(pattern ,str){
    let word = [];
    for (let i = 0; i < str.length; i++) {
        // console.log(str[i].word,pattern.test(str[i].word));
        if (pattern.test(str[i].word) !== true) {
            word.push(str[i]);
        }
    }
    return word;
}

var cut = function cut(posts, callback) {
    var data = posts;
    var result = [];
    //var test =[];
    var pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）&;|{}【】‘；：”“'。，、？ ↵「」]");
    var http = new RegExp(/http/);
    console.log(pattern);
    var p = 0,
        time = posts.length;
    for (var i = 0; i < data.length; i++) {

        if (data[i].message) {

            var temp = data[i].message;
            var str = "";
            for (var j = 0; j < temp.length; j++) {

                str += temp.substr(j, 1).replace(pattern, "");
            }
            //temp = temp.replace(/[\ |\~|\`|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?]/g,'');
            var message_length = str.length;
            str = nodejieba.extract(str, 50);
            //test.push(word[0]);
            /*result.push({
                "id": data[i].id,
                "object_id": data[i].object_id,
                "created_time": data[i].created_time,
                "type": data[i].type,
                "message": data[i].message,
                "from": data[i].from,
                "shares": data[i].shares,
                "likes": data[i].likes,
                "reactions": data[i].reactions,
                "comments": data[i].comments,
                "message_length": message_length,
                "word": word
            });*/
            var post = data[i];
            post.word = filter(http,str);;
            result.push(post);

            next();

        } else if (data[i].content) {
            var temp = data[i].content;
            var str = "";
            for (var j = 0; j < temp.length; j++) {

                str += temp.substr(j, 1).replace(pattern, "");
            }
            //temp = temp.replace(/[\ |\~|\`|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?]/g,'');
            var message_length = str.length;
            str = nodejieba.extract(str, 50);
            var post = data[i];
            post.word = filter(http,str);
            result.push(post);

            next();

        } else {
            next();
        }

    }

    function next() {
        p++;
        if (p === time) {
            final();
        }
    }

    function final() {
        console.log("cut the messages!!");
        //fs.writeFileSync("/Users/guojiankai/Project/server/test.json", JSON.stringify(test), 'utf8');
        callback(null, result);
    }
}

var exports = module.exports = {};
exports.cut = cut;