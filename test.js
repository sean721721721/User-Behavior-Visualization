function reverse(str){
    let r = '';
    let l = str.length;
    for(let i=l-1;i>=0;i--){
        console.log(i);
        r+=str.charAt(i);
    }
    console.log(r);
    return r;
}
reverse('abc');

function subreverse(str){
    let a =str.split(' ');
    let r = '';
    console.log(a)
    for(let i=0,l=a.length;i<l;i++){
        r+=reverse(a[i]);
        if(i<l-1) r+=' ';
    }
    console.log(r);
    return r;
}
subreverse('abc def dwd');

function test2(num){
    let r=0;
    for(let i=0;i<num;i++){
        if(i%3!==0&&i%5!==0){
            r++;
        }
        if(i%15===0){
            r++;
        }
    }
    console.log(r);
    return r;
}
test2(15);


/*test 3
拿鉛筆： 袋子貼原子筆 = both || 袋子貼both = 原子筆
拿原子筆： 袋子貼鉛筆 = both || 袋子貼both = 鉛筆
你一定知道你拿的袋子是那一種 令兩一定錯 可以推論剩下哪個符合 
例如我是both 令兩個可能剩 鉛筆或原子筆 令兩個袋子可能貼both和鉛筆 那both就是
*/

/*test 4
服務生只退
*/