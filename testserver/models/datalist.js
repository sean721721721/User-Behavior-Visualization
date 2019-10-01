/* eslint-disable */
let jb = require('./text.js');
const NS_PER_SEC = 1e9;

//for dbquery
let newualist = function newualist(files, ptt) {
    const time = process.hrtime();
    let userlist = [];
    let userobj = {};
    let filelength = files.length;
    console.log("file length: " + filelength)
    if (ptt) {
        files = jb.cut(files, function () {
            // console.log(files.length);
            for (let i = 0; i < filelength; i++) {
                let data = files[i];
                if (data.author !== null) {
                    // console.log(data.author);
                    let id = data.author.split(" (")[0];
                    let post = {};
                    post["article_id"] = data.article_id;
                    post["article_title"] = data.article_title;
                    post["author"] = data.author;
                    post["board"] = data.board;
                    post["content"] = data.content;
                    post["word"] = data.word;
                    post["date"] = data.date;
                    post["ip"] = data.ip;
                    post["url"] = data.url;
                    post["publish"] = true;
                    post["message_count"] = data.message_count;
                    post["pushing"] = [];
                    post["boo"] = [];
                    post["neutral"] = [];
                    if (userobj[id] !== undefined) {
                        userobj[id].posts.push(post);
                    } else {
                        let user = {};
                        user["id"] = id;
                        user["posts"] = [post];
                        userobj[id] = user;
                    }
                }
            }
            newmuserlist(files, userobj);
        });
    } else {
        files = jb.cut(files, function () {
            // list.push(data);
            //console.log(data.id)
            for (let i = 0; i < filelength; i++) {
                let data = files[i];
                if (data.reactions.list !== undefined) {
                    let reactionlength = data.reactions.list.length;
                    if (reactionlength !== 0) {
                        for (let k = 0; k < reactionlength; k++) {
                            let reaction = data.reactions.list[k];
                            let post = {};
                            post["id"] = data.id;
                            post["like"] = post_liketype(post, reaction);
                            post["commentcount"] = 0;
                            post["share"] = false;
                            post["clist"] = [];
                            post["word"] = data.word;
                            //console.log(post)
                            let user = {};
                            user["id"] = reaction.id;
                            user["name"] = reaction.name;
                            user["posts"] = [];
                            let fid = user.id;
                            if (userobj[fid] !== undefined) {
                                userobj[fid].posts.push(post);
                            } else {
                                user.posts.push(post);
                                //console.log(post)
                                //console.log(user.posts[0])
                                userobj[fid] = user;
                                //people++;
                                //console.log(user)
                                //console.log("---------------------")
                            }
                        }
                    }
                }
            }
            newcomment_countdb(files, userobj);
            newshare_db(files, userobj);
        });
    }
    console.log("userlist length: " + userlist.length)
    //console.log("people "+people)
    const diff = process.hrtime(time);
    console.log(`ualist() Benchmark took ${diff[0] * NS_PER_SEC + diff[1]} nanoseconds`);
    //console.log(userlist);
    return userobj;
}

function pushtype(post, message) {
    if (message.push_tag === "推") {
        if (!post["pushing"]) {
            //console.log('??')
            post["pushing"] = [];
        } else {
            //post["neutral"] = [];
            //post["boo"] = [];
        }
        post.pushing.push(message);
        //return 1;
    } else if (message.push_tag === "→") {
        if (!post["neutral"]) {
            post["neutral"] = [];
        } else {
            //post["push"] = [];
            //post["boo"] = [];
        }
        post.neutral.push(message);
        //return 2;
    } else if (message.push_tag === "噓") {
        if (!post["boo"]) {
            post["boo"] = [];
        } else {
            //post["push"] = [];
            //post["neutral"] = [];
        }
        post.boo.push(message);
        //return 3;
    }
    // console.log(post);
}

function newmuserlist(files, userobj) {
    const time = process.hrtime();
    let filelength = files.length;
    //console.log(files[0]);
    // post
    for (let i = 0; i < filelength; i++) {
        data = files[i];
        if (data.messages !== undefined) {
            let messageslength = data.messages.length;
            if (messageslength !== 0) {
                // message in post
                for (let j = 0; j < messageslength; j++) {
                    let message = data.messages[j];
                    // find user in userobj then update
                    let id = message.push_userid;
                    if (userobj[id] !== undefined) { // insert message into user's posts obj
                        let findpost = false;
                        for (let p = 0; p < userobj[id].posts.length; p++) {
                            let thispost = userobj[id].posts[p];
                            let thispostid = thispost.article_id;
                            if (thispostid === data.article_id) {
                                pushtype(userobj[id].posts[p], message);
                                // console.log('here ', userlist[a].posts[p]);
                                p = userobj[id].posts.length;
                                findpost = true;
                            }
                        }
                        if (!findpost) {
                            post = {};
                            post["article_id"] = data.article_id;
                            post["article_title"] = data.article_title;
                            post["author"] = data.author;
                            post["board"] = data.board;
                            post["content"] = data.content;
                            post["word"] = data.word;
                            post["date"] = data.date;
                            post["ip"] = data.ip;
                            post["url"] = data.url;
                            post["publish"] = false;
                            post["message_count"] = data.message_count;
                            post["pushing"] = [];
                            post["boo"] = [];
                            post["neutral"] = [];
                            post.publish = false;
                            pushtype(post, message);
                            userobj[id].posts.push(post);
                        }
                    } else {
                        user = {};
                        user["id"] = message.push_userid;
                        user["posts"] = [];
                        post = {};
                        post["article_id"] = data.article_id;
                        post["article_title"] = data.article_title;
                        post["author"] = data.author;
                        post["board"] = data.board;
                        post["content"] = data.content;
                        post["word"] = data.word;
                        post["date"] = data.date;
                        post["ip"] = data.ip;
                        post["url"] = data.url;
                        post["publish"] = false;
                        post["message_count"] = data.message_count;
                        post["pushing"] = [];
                        post["boo"] = [];
                        post["neutral"] = [];
                        post.publish = false;
                        /*for (var p = 0; p < userlist[a].posts.length; p++) {
                            var thispost = userlist[a].posts[b];
                            var thispostid = thispost.article_id;
                            if (thispostid === data.article_id) {
                                pushtype(userlist[a].posts[p], message);
                                p=userlist[a].posts.length;
                                b=p;
                            }
                        }*/
                        pushtype(post, message);
                        user.posts.push(post);
                        userobj[id] = user;
                        //console.log(user, message);
                    }
                }
            }
        }
    }
    const diff = process.hrtime(time);
    console.log(`messaageuserlist() Benchmark took ${diff[0] * NS_PER_SEC + diff[1]} nanoseconds`);
    //console.log(userlist);
}

//check like type
function post_liketype(post, reaction) {
    if (reaction.type === "LIKE") {
        return 1;
    } else if (reaction.type === "LOVE") {
        return 2;
    } else if (reaction.type === "HAHA") {
        return 3;
    } else if (reaction.type === "WOW") {
        return 4;
    } else if (reaction.type === "SAD") {
        return 5;
    } else if (reaction.type === "ANGRY") {
        return 6;
    } else {
        return 7;
    }
}

//count comments for dbquery
function newcomment_countdb(files, userobj) {
    const time = process.hrtime();
    let filelength = files.length;
    for (let i = 0; i < filelength; i++) {
        let data = files[i];
        if (data.comments.context !== undefined) {
            let commentlength = data.comments.context.length;
            if (commentlength !== 0) {
                //console.log(userlist.length)
                for (let k = 0; k < commentlength; k++) {
                    let comment = data.comments.context[k];
                    newcommentcount(data, comment, userobj);
                    let subcommentlen = comment.length;
                    // for subcomment
                    for (let x = 0; x < subcommentlen; x++) {
                        let subcomment = comment[x];
                        newcommentcount(data, subcomment, userobj);
                    }
                }
            }
        }
    }
    const diff = process.hrtime(time);
    console.log(`newcomment_countdb() Benchmark took ${diff[0] * NS_PER_SEC + diff[1]} nanoseconds`);
    //console.log(userlist);
}

// commentcount and adjust userlist object
function newcommentcount(data, comment, userobj) {
    let fid = comment.from.id;
    if (userobj[fid] !== undefined) {
        //console.log("find")
        let length = userobj[fid].posts.length;
        //console.log(length)
        let findpost = false;
        for (let b = 0; b < length; b++) {
            if (data.id === userobj[fid].posts[b].id) {
                findpost = true;
                //console.log("find")
                userobj[fid].posts[b].commentcount++;
                userobj[fid].posts[b].clist.push(comment);
                b = length;
            }
        }
        if (!findpost) {
            //console.log("no post!")
            let post = {
                "id": data.id,
                "like": 0,
                "commentcount": 1,
                "share": false,
                "clist": [comment],
            }
            userobj[fid].posts.push(post);
        }
    } else {
        //console.log("no user!")
        let post = {
            "id": data.id,
            "like": 0,
            "commentcount": 1,
            "share": false,
            "clist": [comment],
        }
        let user = {
            "id": comment.from.id,
            "name": comment.from.name,
            "posts": []
        }
        user.posts.push(post)
        userobj[fid] = user;
    }
}

//share check for dbquery
function newshare_db(files, userobj) {
    const time = process.hrtime();
    let filelength = files.length;
    for (let i = 0; i < filelength; i++) {
        let data = files[i];
        if (data.sharedposts) {
            let sharelength = data.sharedposts.data.length;
            if (sharelength !== 0) {
                for (let k = 0; k < sharelength; k++) {
                    let sharedpost = data.sharedposts.data[k];
                    let fid = sharedpost.from.id;
                    if (userobj[fid] !== undefined) {
                        //console.log("find")
                        let length = userobj[fid].posts.length;
                        //console.log(length)
                        let findpost = false;
                        for (let b = 0; b < length; b++) {
                            // console.log(userobj[fid].posts[b]);
                            if (data.id === userobj[fid].posts[b].id) {
                                findpost = true;
                                //console.log("find")
                                userobj[fid].posts[b].share = true;
                                b = length;
                            }
                        }
                        if (!findpost) {
                            //newshare_dbonsole.log("no post!")
                            let post = {
                                "id": data.id,
                                "like": 0,
                                "commentcount": 0,
                                "share": true,
                            }
                            userobj[fid].posts.push(post);
                        }
                    } else {
                        //console.log("no user!")
                        let post = {
                            "id": data.id,
                            "like": 0,
                            "commentcount": 0,
                            "share": true,
                        }
                        let user = {
                            "id": sharedpost.from.id,
                            "name": sharedpost.from.name,
                            "posts": [],
                        }
                        user.posts.push(post)
                        userobj[fid] = user;
                    }
                }
            }
        }
    }
    const diff = process.hrtime(time);
    console.log(`newshare_db() Benchmark took ${diff[0] * NS_PER_SEC + diff[1]} nanoseconds`);
}

//slow code, need to improve
// let bindpostlist = function bindpostlist(qobj1, ptt) {
//     console.log('check377');
//     const time = process.hrtime();
//     function postobj(obj) {
//         for (prop in obj) {
//             if (prop.match(/^(id)$/)) {
//                 if (ptt) {
//                     obj[prop] = obj.article_id;
//                 } else {
//                     obj[prop] = obj.id;
//                 }
//             }
//         }
//         let posts = obj;
//         return posts;
//     }
//     let list = [];
//     let l1 = qobj1.length;
//     let pagea = [];
//     let test = [[],[]];
//     for (let i = 0; i < l1; i++) {
//         let post = postobj(qobj1[i]);
//         pagea.push(post);
//     }
//     list.push(pagea);
//     pagea = jb.cut(pagea, function () {
//         for(i=0;i<pagea.length;i++){
//             console.log('pagea:',pagea[i].word);
//             test[0][i] = pagea[i].word; 
//         }
//         // testlist.push(pagea);
//     });
//     // for return single page query faster
//     console.log("postlen: " + (list[0].length));
//     const diff = process.hrtime(time);
//     console.log(`bindpostlist() Benchmark took ${diff[0] * NS_PER_SEC + diff[1]} nanoseconds`);
//     return [list,test];
// }
let bindpostlist = function bindpostlist(qobj1, qobj2, ptt) {
    const time = process.hrtime();

    function postobj(obj) {
        for (prop in obj) {
            if (prop.match(/^(id)$/)) {
                if (ptt) {
                    obj[prop] = obj.article_id;
                } else {
                    obj[prop] = obj.id;
                }
            }
        }
        let posts = obj;
        return posts;
    }
    let list = [];
    let l1 = qobj1.length;
    let l2 = qobj2.length;
    let pagea = [];
    let pageb = [];
    let test = [[],[]];
    let titleTest = [[],[]];
    let message_count = [[],[]];
    for (let i = 0; i < l1; i++) {
        let post = postobj(qobj1[i]);
        pagea.push(post);
    }
    list.push(pagea);
    pagea = jb.cut(pagea, function () {
        for(i=0;i<pagea.length;i++){
            test[0][i] = pagea[i].word; 
            titleTest[0][i] = pagea[i].titleWord;
            // message_count[0][i] = pagea[i].message_count;
        }
    });
    // for return single page query faster
    if (qobj1 !== qobj2) {
        for (let i = 0; i < l2; i++) {
            let find = false;
            for (let j = 0; j < l1;) {
                if (qobj1[j].id !== qobj2[i].id) {
                    j++;
                } else {
                    find = true;
                    j = l1;
                }
                if (j === l1 && !find) {
                    let post = postobj(qobj2[i]);
                    pageb.push(post);
                }
            }
        }
        list.push(pageb);
        pageb = jb.cut(pageb, function () {
            for(i=0;i<pageb.length;i++){
                test[1][i] = pageb[i].word;
                titleTest[1][i] = pageb[i].titleWord;
            }
        });
    } else {
        list.push(pagea);
        for(i=0;i<pagea.length;i++){
            test[0][i] = pagea[i].word; 
            titleTest[0][i] = pagea[i].titleWord;
            }
        }   
    
    let termfreq = [];
    let titleCount = [];
    
    //termfrequency
    for(i=0;i<test.length;i++){
        termfreq.push(termfreqency(test[i]));
    }
    termfreq.push(test);
    
    //title term score
    /*for(i=0;i<titleTest.length;i++){ 
        titleCount.push(titleScore(titleTest[i], list[0][i].message_count));
    }*/

    //title terms relationshipt between userID
    for(i=0;i<titleTest.length;i++){ 
        titleCount.push(titleUser(titleTest[i], list[i]));
    }
    // console.log(titleTest);
    console.log("postlen: " + (list[0].length + list[1].length));
    const diff = process.hrtime(time);
    console.log(`bindpostlist() Benchmark took ${diff[0] * NS_PER_SEC + diff[1]} nanoseconds`);
    return [list,termfreq,titleCount];
}

//userId's relationship with title word
let titleUser = function titleUser(terms, posts){  

    let userlist = {};
    let i =0;
    let articleIndex = [];
    let articlePostTime = [];
    terms.forEach(function (term){
        if(term != null){
            let flag = 0;
            term.forEach(function(wordPair){
                if(wordPair.word == 'Re'){
                    flag = 1;
                }
                if(flag == 0){
                    if(!userlist.hasOwnProperty(wordPair.word)){
                        userlist[wordPair.word] = [posts[i].author];
                        articleIndex[wordPair.word] = [i];
                        articlePostTime[wordPair.word] = [posts[i].date];
                    }
                    else{
                        userlist[wordPair.word].push(posts[i].author);
                        articleIndex[wordPair.word].push(i);
                        articlePostTime[wordPair.word].push(posts[i].date);
                    }
                }
                flag = 0;
            })
        }
        i++;
    })

    let keysSorted = Object.keys(userlist).sort(function(a,b){
        return userlist[b].length - userlist[a].length;
    })

    let sortedUserList = [];
    for(let j=0;j<keysSorted.length;j++){
        sortedUserList.push([keysSorted[j], userlist[keysSorted[j]], articleIndex[keysSorted[j]], articlePostTime[keysSorted[j]]]);       
    }
    
    return sortedUserList;
}


let titleScore = function titleScore(terms, message_count){
    let titleScore = {};
    let i =0;

    terms.forEach(function (term){
        if(term != null){
            let flag = 0;
            term.forEach(function(wordPair){
                if(wordPair.word == 'Re'){
                    flag = 1;
                }
                if(flag == 0){
                    if(!titleScore.hasOwnProperty(wordPair.word)){
                        titleScore[wordPair.word] = message_count[i].push-message_count[i].boo;
                    }
                    else{
                        titleScore[wordPair.word] += (message_count[i].push-message_count[i].boo);
                    }
                }
            })
        }
        i++;
    })

    let sortable =[];
    for(let word in titleScore){
        sortable.push([word, titleScore[word]]);
    }
    sortable.sort(function(a,b){
        return b[1] - a[1];
    })
    return sortable;
}

let tf_idf = function tf_idf(terms){
    // console.log(terms);
    let postlen = terms.length;
    let postTermFreq = [];
    for(i=0;i<postlen;i++){
        let termfreq = {};
        for(j=0;j<terms[i].length;j++){
            if(!termfreq.hasOwnProperty(terms[i][j])){
                termfreq[terms[i][j]] = 1/terms[i].length;
            }else{
                termfreq[terms[i][j]] = termfreq[terms[i][j]] + 1;
            }
        }
        postTermFreq.push(termfreq);
    }
    console.log('Count Done!');
    for(i=0;i<postlen;i++){
        for(j=0;j<terms[i].length;j++){
            let D =0;
            for(k=0;k<postlen;k++){
                if(postTermFreq[k].hasOwnProperty(terms[i][j])){
                    D++;
                }
            }
            postTermFreq[i][terms[i][j]] = postTermFreq[i][terms[i][j]] * Math.log10(postlen / D);
        }
    }
    let sortable =[];
    for(i=0;i<postlen;i++){
        sortable.push([]);
        for(let word in postTermFreq[i]){
            sortable[i].push([word, postTermFreq[i][word]]);
        }
        sortable[i].sort(function(a,b){
            return b[1] - a[1];
        })
    }
    console.log('termfreq1: ',sortable);
    return postTermFreq;
}

let termfreqency = function termfreqency(terms){
    let termfreq = {};
    terms.forEach(function (term){
        if(term != null){
            term.forEach(function(wordPair){
                if(!termfreq.hasOwnProperty(wordPair.word)){
                    termfreq[wordPair.word] = 1;
                }
                else{
                    termfreq[wordPair.word]++;
                }
            })
        }
    })
    let sortable =[];
    for(let word in termfreq){
        sortable.push([word, termfreq[word]]);
    }
    sortable.sort(function(a,b){
        return b[1] - a[1];
    })
    //console.log('termfreq: ',termfreq);
    return sortable;
    
    //TF-IDF testing

    // console.log(terms);
    // let postlen = terms.length;
    // let termfreq = {};
    // for(i=0;i<postlen;i++){
    //     for(j=0;j<terms[i].length;j++){
    //         if(!termfreq.hasOwnProperty(terms[i][j])){
    //             termfreq[terms[i][j]] = 1;
    //         }else{
    //             termfreq[terms[i][j]]++;
    //         }
    //     }
    // }
    // let sortable =[];
    // for(let word in termfreq){
    //     sortable.push([word, termfreq[word]]);
    // }
    // sortable.sort(function(a,b){
    //     return b[1] - a[1];
    // })
    // // console.log('termfreq2: ',termfreq);
    // return sortable;
}
//bind two userlist
let binduserobj = function binduserobj(userobj1, userobj2, user, tuser) {
    const time = process.hrtime();
    let result = [];
    let l1 = user.length;
    let l2 = tuser.length;
    // for return single page query faster
    // if (user !== tuser) {
    for (let i = 0; i < l1; i++) {
        let id = user[i].id;
        if (userobj2[id] !== undefined) {
            user[i].posts = {
                "A": user[i].posts,
                "B": userobj2[id].posts,
            }
        } else {
            user[i].posts = {
                "A": user[i].posts,
                "B": [],
            }
        }
        result.push(user[i]);
    }
    for (let i = 0; i < l2; i++) {
        let id = tuser[i].id;
        if (userobj1[id] === undefined) {
            tuser[i].posts = {
                "A": [],
                "B": tuser[i].posts,
            }
            result.push(tuser[i]);
        }
    }
    /*} else {
        for (var i = 0; i < l1; i++) {
            user[i].posts = {
                "A": userlist1[i].posts,
                "B": userlist1[i].posts,
            }
            result.push(user[i]);
        }
    }*/
    console.log("user length: " + result.length);
    const diff = process.hrtime(time);
    console.log(`binduserobj() Benchmark took ${diff[0] * NS_PER_SEC + diff[1]} nanoseconds`);
    return result;
}

//insert activity state
let overlap = function overlap(userlist, type) {
    const time = process.hrtime();
    let len = userlist.length;
    if (type === "all") {
        for (let i = 0; i < len; i++) {
            userlist[i]["activity"] = {
                "A": true,
                "B": true,
            }
        }
    } else {
        if (type === "like") {
            type = 1;
        }
        if (type === "love") {
            type = 2;
        }
        if (type === "haha") {
            type = 3;
        }
        if (type === "wow") {
            type = 4;
        }
        if (type === "sad") {
            type = 5;
        }
        if (type === "angry") {
            type = 6;
        }
        if (type === "other") {
            type = 7;
        }
        for (let i = 0; i < len; i++) {
            let pal = userlist[i].posts.A.length;
            for (let j = 0; j < pal; j++) {
                if (type === "comment") {
                    if (userlist[i].posts.A[j].commentcount != 0) {
                        userlist[i]["activity"] = {
                            "A": true,
                            "B": false,
                        }
                        j = pal;
                    }
                } else if (type === "share") {
                    if (userlist[i].posts.A[j].share === true) {
                        userlist[i]["activity"] = {
                            "A": true,
                            "B": false,
                        }
                        j = pal;
                    }
                } else {
                    if (userlist[i].posts.A[j].like === type) {
                        userlist[i]["activity"] = {
                            "A": true,
                            "B": false,
                        }
                        j = pal;
                    }
                }
            }
            let pbl = userlist[i].posts.B.length;
            for (let j = 0; j < pbl; j++) {
                if (userlist[i].activity) {
                    if (type === "comment") {
                        if (userlist[i].posts.B[j].commentcount != 0) {
                            userlist[i]["activity"].B = true;
                            j = pbl;
                        }
                    } else if (type === "share") {
                        if (userlist[i].posts.A[j].share === true) {
                            userlist[i]["activity"].B = true;
                            j = pbl;
                        }
                    } else {
                        if (userlist[i].posts.B[j].like === type) {
                            userlist[i]["activity"].B = true;
                            j = pbl;
                        }
                    }
                } else {
                    if (type === "comment") {
                        if (userlist[i].posts.B[j].commentcount != 0) {
                            userlist[i]["activity"] = {
                                "A": false,
                                "B": true,
                            }
                            j = pbl;
                        }
                    } else if (type === "share") {
                        if (userlist[i].posts.B[j].share === true) {
                            userlist[i]["activity"] = {
                                "A": false,
                                "B": true,
                            }
                            j = pbl;
                        }
                    } else {
                        if (userlist[i].posts.B[j].like === type) {
                            userlist[i]["activity"] = {
                                "A": false,
                                "B": true,
                            }
                            j = pbl;
                        }
                    }
                }
            }
        }
    }
    console.log("ol length: " + len);
    const diff = process.hrtime(time);
    console.log(`overlap() Benchmark took ${diff[0] * NS_PER_SEC + diff[1]} nanoseconds`);
    return userlist;
};

//collect overlap results
let olresult = function olresult(ollist) {
    const time = process.hrtime();
    let result = [];
    let len = ollist.length;
    for (let i = 0; i < len; i++) {
        if (ollist[i].activity) {
            if ((ollist[i].activity.A === true) && (ollist[i].activity.B === true)) {
                result.push(ollist[i]);
            }
        }
    }
    console.log("fol length: " + result.length);
    const diff = process.hrtime(time);
    console.log(`olresult() Benchmark took ${diff[0] * NS_PER_SEC + diff[1]} nanoseconds`);
    return result;
}
//sort overlap degree
let sortdegree = function sortdegree(olrlist) {
    const time = process.hrtime();
    // console.log(olrlist);
    function getdeg(item) {
        let alen = item.posts.A.length;
        let blen = item.posts.B.length;
        let deg = alen + blen;
        return deg;
    }

    function pushlist(obj, item) {
        // console.log(item);
        let degA = item[0].posts.A.length;
        let degB = item[0].posts.B.length;
        let temp = [item];
        if (degA === 0 || degB === 0) { // if item's deg eqaul 0
            if (degA === 0) {
                obj.O.push([]);
                obj.A.push([]);
                obj.B.push(temp);
            } else {
                obj.O.push([]);
                obj.A.push(temp);
                obj.B.push([]);
            }
        } else {
            obj.O.push(temp);
            obj.A.push([]);
            obj.B.push([]);
        }
    }

    function sort(obj, item, index) {
        function makelist(list, post, ipost, i) {
            let degi = post.length;
            let a = 0;
            for (; a < degi;) { // compare list[i][0] and item's postsA
                for (let b = 0; b < deg; b++) {
                    if (post[a].id === ipost[b].id) {
                        a++;
                        b = deg;
                    } else {
                        if (b === deg - 1) {
                            a = degi + 1;
                        }
                    }
                }
            }
            if (a === degi) { // if eqaul
                if (list[i].length > 0) {
                    list[i].push(item);
                    //console.log(list[i].length);
                } else {
                    let temp = [list[i]];
                    temp.push(item);
                    list[i] = temp;
                }
                eqdeg = true;
            } else { // if not
                list.push([item]);
            }
        }
        let list = obj.O[index];
        let deg = item.posts.A.length;
        let degB = item.posts.B.length;
        let temp = [];
        let eqdeg = false;
        if (deg === 0) {
            list = obj.B[index];
        }
        if (degB === 0) { // if item's deg eqaul 0
            list = obj.A[index];
        }
        //console.log(list);
        let l = list.length;
        /*if (l > 0) { //if list is not empty
            for (var i = 0; i < l; i++) { // find whitch list[i]'s deg eqaul item's deg
                var degi = list[i][0].posts.A.length;
                if (deg === degi) { // if find
                    var post = list[i][0].posts.A;
                    var ipost = item.posts.A;
                    if (deg === 0) { // if item's deg eqaul 0
                        var deg = degB;
                        degi = list[i][0].posts.B.length;
                        post = list[i][0].posts.B;
                        ipost = item.posts.B;
                    }
                    for (var a = 0; a < degi;) { // compare list[i][0] and item 's postsA
                        for (var b = 0; b < deg; b++) {
                            if (post[a].id === ipost[b].id) {
                                a++;
                                b = deg;
                            } else {
                                if (b === deg - 1) {
                                    a = degi + 1;
                                }
                            }
                        }
                    }
                    if (a === degi) { // if eqaul
                        if (list[i].length > 0) {
                            list[i].push(item);
                            //console.log(list[i].length);
                        } else {
                            var temp = [list[i]];
                            temp.push(item);
                            list[i] = temp;
                        }
                        eqdeg = true;
                    } else { // if not
                        list.push([item]);
                    }
                    i = l;
                } else if (deg > degi) { // push item in list to creat new list[deg]
                    if (!eqdeg && i === (l - 1)) {
                        list.push([item]);
                    }
                } else { // insert item in specific list[i]
                    list.splice(i, 0, [item]);
                    i = l;
                }
            }
        } else { //if list is empty
            list.push([item]);
        }*/
        if (l > 0) { //if list is not empty
            for (let i = 0; i < l; i++) { // find whitch list[i]'s deg eqaul item's deg
                let degi = list[i][0].posts.A.length;
                let post = list[i][0].posts.A;
                let degib = list[i][0].posts.B.length;
                let ipost = item.posts.A;
                if (degi === 0) {
                    degi = degib;
                    post = list[i][0].posts.B;
                    ipost = item.posts.B;
                }
                if (deg === degi && degib !== 0) { // if find
                    //console.log(deg, list[i][0].posts.A.length, list[i][0].posts.B.length)
                    makelist(list, post, ipost, i);
                    i = l;
                } else if (deg > degi) { // push item in list to creat new list[deg]
                    if (!eqdeg && i === (l - 1)) {
                        list.push([item]);
                    }
                } else { // insert item in new list[i]
                    //console.log(deg, list[i][0].posts.A.length, list[i][0].posts.B.length)
                    list.splice(i, 0, [item]);
                    i = l;
                }
            }
        } else { //if list is empty
            list.push([item]);
        }
    }

    function makeaddr(sortobj) {
        function addr(data) {
            let il = data.length
            for (let i = 0; i < il; i++) {
                let jl = data[i].length;
                for (let j = 0; j < jl; j++) {
                    let kl = data[i][j].length;
                    for (let k = 0; k < kl; k++) {
                        data[i][j][k].addr = i + ',' + j + ',' + k;
                    }
                }
            }
        }
        addr(sortobj.A);
        addr(sortobj.B);
        addr(sortobj.O);
        return sortobj;
    }
    //var sortlist = [];
    let sortobj = {};
    sortobj.A = [];
    sortobj.B = [];
    sortobj.O = [];
    let degree = [];
    let len = olrlist.length;
    for (let i = 0; i < len; i++) {
        let deg = getdeg(olrlist[i]);
        let finddeg = false;
        let l = degree.length;
        if (l > 0) {
            for (let d = 0; d < l; d++) {
                if (degree[d] === deg) {
                    finddeg = true;
                    //sortlist[d].push(olrlist[i]);
                    sort(sortobj, olrlist[i], d);
                    d = l;
                } else if (degree[d] < deg) {
                    // degree
                    if (!finddeg && d === l - 1) {
                        degree.push(deg);
                        pushlist(sortobj, [olrlist[i]]);
                    }
                } else {
                    //console.log(d + " : " + l + " | " + degree[d] + ">" + deg);
                    degree.splice(d, 0, deg);
                    //console.log(degree);
                    let list = [olrlist[i]];
                    //console.log(list);
                    let degA = list[0].posts.A.length;
                    let degB = list[0].posts.B.length;
                    if (degA === 0 || degB === 0) { // if item's deg eqaul 0
                        if (deg === 0) {
                            sortobj.O.splice(d, 0, []);
                            sortobj.A.splice(d, 0, []);
                            sortobj.B.splice(d, 0, [list]);
                        } else {
                            sortobj.O.splice(d, 0, []);
                            sortobj.A.splice(d, 0, [list]);
                            sortobj.B.splice(d, 0, []);
                        }
                    } else {
                        sortobj.O.splice(d, 0, [list]);
                        sortobj.A.splice(d, 0, []);
                        sortobj.B.splice(d, 0, []);
                    }
                    //console.log(getdeg(sortlist[d][0])+" "+deg);
                    d = l;
                }
            }
        } else {
            degree.push(deg);
            pushlist(sortobj, [olrlist[i]]);
            //console.log(degree);
        }
        //console.log(degree);
    }
    //console.log(degree.length === sortlist.length);
    makeaddr(sortobj);
    //console.log(sortobj);
    const diff = process.hrtime(time);
    console.log(`sortdegree() Benchmark took ${diff[0] * NS_PER_SEC + diff[1]} nanoseconds`);
    return sortobj;
}

var exports = module.exports = {};
exports.newualist = newualist;
exports.bindpostlist = bindpostlist;
exports.binduserobj = binduserobj;
exports.overlap = overlap;
exports.olresult = olresult;
exports.sortdegree = sortdegree;
//exports.user_list = user_list;
//exports.ualist = ualist;
//exports.post_type = post_type;
//exports.comment_count = comment_count;
//exports.binduserlist = binduserlist;