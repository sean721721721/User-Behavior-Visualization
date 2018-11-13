// @flow
import React from 'react';
import PropTypes from 'prop-types';
import './bbs.css';

type PushProps = {};

function PushList({ props }: PushProps) {
  const list = props;
  let pushcount = 0;
  let arrowcount = 0;
  let boocount = 0;
  const pushs = list.map((push, i) => {
    const {
      pushtag, userid, pushcontent, datetime,
    } = push;
    const tag = push === '→' ? '箭頭' : pushtag;
    let typecount;
    switch (pushtag) {
      case '→':
        arrowcount += 1;
        typecount = arrowcount;
        break;
      case '推':
        pushcount += 1;
        typecount = pushcount;
        break;
      default:
        boocount += 1;
        typecount = boocount;
    }
    const divtitle = `${i.toString()}樓，第${typecount.toString()}${tag}`;
    const floor = `${i.toString()}樓`;
    return (
      <div className="push pwe-push-section-1" title={divtitle} key={i.toString()}>
        <span className="pwe-floor">{floor}</span>
        <span className="f1 h1 push-tag">{pushtag}</span>
        <span className="f3 h1 push-userid pwe-menu" data-userid="leopika">
          <span className="pwe-menu__trigger">{userid}</span>
        </span>
        <span className="f3 push-content">
:
          {pushcontent}
        </span>
        <span className="push-ipdatetime">{datetime}</span>
      </div>
    );
  });
  // const str = `推噓文統計：推=${pushcount}, 噓=${boocount}, →=${arrowcount}`;
  return (
    pushs
    // <div className="pwe-push-statistics">{str}</div>
  );
}

class Post extends React.Component {
  constructor(props) {
    super(props);
    this.state = props.postprops;
  }

  render() {
    const {
      author, board, title, time, content, href, push,
    } = this.state;
    return (
      <div id="main-container">
        <div id="main-content" className="bbs-screen bbs-content">
          <div className="article-metaline">
            <span className="article-meta-tag">作者</span>
            <span className="article-meta-value">{author}</span>
          </div>
          <div className="article-metaline-right">
            <span className="article-meta-tag">看板</span>
            <span className="article-meta-value">
              <a className="pwe-board" href="/bbs/MobileComm/index.html">
                {board}
              </a>
            </span>
          </div>
          <div className="article-metaline">
            <span className="article-meta-tag">標題</span>
            <span className="article-meta-value">{title}</span>
          </div>
          <div className="article-metaline">
            <span className="article-meta-tag">時間</span>
            <span className="article-meta-value">{time}</span>
          </div>
          <p>{content}</p>
          <span className="f2">※ 發信站: 批踢踢實業坊(ptt.cc), 來自: 36.237.159.224</span>
          <span className="f2">
            <p>※ 文章網址:</p>
            <a href={href} target="_blank" rel="noopener noreferrer">
              {href}
            </a>
          </span>
          <PushList props={push} />
          <div className="pwe-push-statistics">推噓文統計：推=137, 噓=2, →=134</div>
        </div>
      </div>
    );
  }
}

Post.defaultProps = {
  postprops: {
    author: 'Feishawn (亞魚兒)',
    board: 'MobileComm',
    title: '[LIVE] 小米Mix3發表會',
    time: 'Thu Oct 25 13:41:00 2018',
    content: `首先，先強調這是中國手機 對中國產品看到會頭痛四肢無力心臟不舒服的請盡快按下-- 直播連結:
            https://bit.ly/2Jdy6Nb 英文版論壇圖文直播: http://en.miui.com/thread-4139599-1-1.html
            B站: https://bit.ly/2SmFydc 優酷: https://bit.ly/2PpO4t0
            目前可以確定的就是滑蓋、前鏡頭2400萬畫素、無線充電更快(可能到10W?) 然後有960fps的慢動作
            (我對小米錄影不期不待就是了) 還有5G網路 --`,
    href: 'https://www.ptt.cc/bbs/MobileComm/M.1540446065.A.825.html',
    push: [
      {
        pushtag: '→',
        userid: 'leopika',
        pushcontent: '5g等高通下一代處理器出來才有吧',
        datetime: '10/25 13:41',
      },
      {
        pushtag: '推',
        userid: 'BenShiuan',
        pushcontent: '背後指紋，不知道有沒有螢幕下指紋的版本',
        datetime: '10/25 13:42',
      },
      {
        pushtag: '推',
        userid: 'abc0922001',
        pushcontent: '小米錄影的品質與收音，都是爛得厲害',
        datetime: '10/25 13:42',
      },
    ],
  },
};
Post.propTypes = {
  postprops: PropTypes.shape({
    author: PropTypes.string,
    board: PropTypes.string,
    title: PropTypes.string,
    time: PropTypes.string,
    content: PropTypes.string,
    href: PropTypes.string,
    push: PropTypes.arrayOf(PropTypes.shape({})),
  }),
};
/*
<div className="push pwe-push-section-1" title="1樓，第1箭頭">
            <span className="pwe-floor">1樓</span>
            <span className="f1 h1 push-tag">→</span>
            <span className="f3 h1 push-userid pwe-menu" data-userid="leopika">
              <span className="pwe-menu__trigger">leopika</span>
            </span>
            <span className="f3 push-content">: 5g等高通下一代處理器出來才有吧</span>
            <span className="push-ipdatetime"> 10/25 13:41</span>
          </div>
          <div className="push pwe-push-section-1" title="2樓，第1推">
            <span className="pwe-floor">2樓</span>
            <span className="f1 h1 push-tag">推</span>
            <span className="f3 h1 push-userid pwe-menu" data-userid="BenShiuan">
              <span className="pwe-menu__trigger">BenShiuan</span>
            </span>
            <span className="f3 push-content">: 背後指紋，不知道有沒有螢幕下指紋的版本</span>
            <span className="push-ipdatetime"> 10/25 13:42</span>
          </div>
          <div className="push pwe-push-section-1" title="3樓，第2推">
            <span className="pwe-floor">3樓</span>
            <span className="f1 h1 push-tag">推</span>
            <span className="f3 h1 push-userid pwe-menu" data-userid="abc0922001">
              <span className="pwe-menu__trigger">abc0922001</span>
            </span>
            <span className="f3 push-content">: 小米錄影的品質與收音，都是爛得厲害</span>
            <span className="push-ipdatetime"> 10/25 13:42</span>
          </div>
          <div className="pwe-push-statistics">推噓文統計：推=137, 噓=2, →=134</div>
          */

export default Post;
