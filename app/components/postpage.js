// @flow
import React from 'react';
import PropTypes from 'prop-types';
import List from './postlist';
import Button from './Button';
import './bbs.css';

class PostPage extends React.Component {
  constructor(props) {
    super(props);
    //
    this.state = props;
  }

  render() {
    const {
      postlistprops: { list }, downloadprops,
      onChange, nextPage,
    } = this.props;
    return (
      <div id="main-container">
        <div className="action-bar">
          <div className="btn-group btn-group-dir">
            <a className="btn-selected" href="/bbs/MobileComm/index.html">
              看板
            </a>
          </div>
          <div className="btn-group btn-group-paging">
            <a className="btn wide" href="/bbs/MobileComm/index.html">
              最舊
            </a>
            <a className="btn wide" href="/bbs/MobileComm/index.html">
              上頁
            </a>
            <Button classname="btn wide" action={nextPage} title="下頁" type="button" />
            <a className="btn wide" href="/bbs/MobileComm/index.html">
              下頁
            </a>
            <a className="btn wide" href="/bbs/MobileComm/index.html">
              最新
            </a>
          </div>
        </div>
        <div className="r-list-container">
          <List list={list} downloadprops={downloadprops} onChange={onChange} />
        </div>
      </div>
    );
  }
}

PostPage.defaultProps = {
  postlistprops: {
    list: [
      {
        article_id: 'M.1527976238.A.08A',
        article_title: 'Re: [新聞] 製造還債假象 丁守中:柯文哲早把市府老本',
        author: 'LewisRong (陳金鋒世代)',
        board: 'Gossiping',
        content:
          '"其實我個人還蠻期待電視直播辯論那天 就目前看起來丁所有的政見都比勝文還慘 勝文可以說他沒經驗 不苦民所苦 丁當了20幾年臺北市立委政見還腦弱成這樣 每發表一個話題都在為自己扣分 每個政見都好空洞 覺得辯論那天丁應該會被幹爆 : 1.媒體來源: : Yahoo奇摩新聞 : 2.完整新聞標題: : 製造還債假象 丁守中:柯文哲早把市府老本花光 : 3.完整新聞內文: : 台北市長柯文哲今天發了一篇臉書，說他上任以來還了將近540億元，讓台北市政府正式脫 : 離千億債務俱樂部。 : 但事實是這樣的嗎？先不論在柯文哲任內，包括很多前瞻建設，例如台北環狀捷運，北環、 : 南環等公共建設，柯市府都不做，拿去還債，導致市政問題積重難返。從他每年的預算書更 : 可以發現，柯文哲的預算年年透支，事實上，柯市府全沒有還債能力，只是透過前人留下來 : 的老本製造還債假象 : 例如郝龍斌市長任內留下231億的歲計賸餘，也就是市府歷年預算執行後所累積的積蓄，提 : 供給未來年度支出、債務還本的資金調度，等於是市府的儲蓄金。柯文哲年年打腫臉充 : 胖子，不但今年總預算透支98億，再加上債務還本100億，下個年度的賸餘款將所剩無幾。 : 柯文哲不惜把前幾任市長留下來的家產敗光，為自己塑造還債市長的形象，卻讓未來新上任 : 的市長沒有儲蓄金可以用。另一層次的財政收入美化，則來自法令修改而超收稅額。舉例來 : 說，前年重新評定公告地價，臺北市平均漲幅達3成，地價稅收入大增74億。不然以柯P的花 : 錢習慣，市府早就捉襟見肘。 : 柯文哲今年為了選舉，預算比收入超支達98億，到底哪裡省錢？市民應該要看清柯文哲的手 : 法，莫被美化過後的數字蒙蔽了雙眼。 : 4.完整新聞連結 (或短網址): : http://tinyurl.com/yb5moee9 : 5.備註: : 還以為柯屁真的那麼厲害 原來是個超級敗家子 把馬郝市長存的錢全都敗光光 中華隊只要有祂在 不管落後幾分都會覺得還有無窮的希望 不動四番 陳金鋒的歷史地位無可取代"',
        date: '2018-06-02T21:50:34.000Z',
        ip: '123.193.214.39',
        message_count: {
          all: 14,
          boo: 0,
          count: 3,
          neutral: 11,
          push: 3,
          id_: '5b3f1f486e37944c1945c018',
        },
        messages: [
          {
            push_content: '他有很多同溫層',
            push_ipdatetime: '06/03 05:54',
            push_tag: '→',
            push_userid: 'letgo999',
            _id: '5b3f1f486e37944c1945c026',
          },
        ],
        url: 'https://www.ptt.cc/bbs/Gossiping/M.1527976238.A.08A.html',
        __v: 0,
        _id: '5b3f1f486e37944c1945c017',
      },
    ],
    next: '',
  },
  postprops: {
    author: 'Feishawn (亞魚兒)',
    board: 'MobileComm',
    article_title: '[LIVE] 小米Mix3發表會',
    date: 'Thu Oct 25 13:41:00 2018',
    content: `首先，先強調這是中國手機 對中國產品看到會頭痛四肢無力心臟不舒服的請盡快按下-- 直播連結:
            https://bit.ly/2Jdy6Nb 英文版論壇圖文直播: http://en.miui.com/thread-4139599-1-1.html
            B站: https://bit.ly/2SmFydc 優酷: https://bit.ly/2PpO4t0
            目前可以確定的就是滑蓋、前鏡頭2400萬畫素、無線充電更快(可能到10W?) 然後有960fps的慢動作
            (我對小米錄影不期不待就是了) 還有5G網路 --`,
    url: 'https://www.ptt.cc/bbs/MobileComm/M.1540446065.A.825.html',
    messages: [
      {
        push_tag: '→',
        push_userid: 'leopika',
        push_content: '5g等高通下一代處理器出來才有吧',
        push_ipdatetime: '10/25 13:41',
      },
      {
        push_tag: '推',
        push_userid: 'BenShiuan',
        push_content: '背後指紋，不知道有沒有螢幕下指紋的版本',
        push_ipdatetime: '10/25 13:42',
      },
      {
        push_tag: '推',
        push_userid: 'abc0922001',
        push_content: '小米錄影的品質與收音，都是爛得厲害',
        push_ipdatetime: '10/25 13:42',
      },
    ],
  },
};
PostPage.propTypes = {
  postlistprops: PropTypes.shape({
    list: PropTypes.arrayOf(
      PropTypes.shape({
        article_id: PropTypes.string,
        article_title: PropTypes.string,
        author: PropTypes.string,
        board: PropTypes.string,
        content: PropTypes.string,
        date: PropTypes.string,
        ip: PropTypes.string,
        message_count: PropTypes.shape({
          all: PropTypes.number,
          boo: PropTypes.number,
          count: PropTypes.number,
          neutral: PropTypes.number,
          push: PropTypes.number,
          id_: PropTypes.string,
        }),
        messages: PropTypes.arrayOf(
          PropTypes.shape({
            push_content: PropTypes.string,
            push_ipdatetime: PropTypes.string,
            push_tag: PropTypes.string,
            push_userid: PropTypes.string,
            _id: PropTypes.string,
          }),
        ),
        url: PropTypes.string,
        __v: PropTypes.number,
        _id: PropTypes.string,
      }),
    ),
    next: PropTypes.string.isRequired,
  }),
  postprops: PropTypes.shape({
    author: PropTypes.string,
    board: PropTypes.string,
    article_title: PropTypes.string,
    date: PropTypes.string,
    content: PropTypes.string,
    url: PropTypes.string,
    messages: PropTypes.arrayOf(
      PropTypes.shape({
        push_tag: PropTypes.string,
        push_userid: PropTypes.string,
        push_content: PropTypes.string,
        push_ipdatetime: PropTypes.string,
      }),
    ),
  }),
  downloadprops: PropTypes.shape({
    article_id: PropTypes.bool,
    article_title: PropTypes.bool,
    author: PropTypes.bool,
    board: PropTypes.bool,
    content: PropTypes.bool,
    date: PropTypes.bool,
    ip: PropTypes.bool,
    message_count: PropTypes.shape({
      all: PropTypes.bool,
      boo: PropTypes.bool,
      count: PropTypes.bool,
      neutral: PropTypes.bool,
      push: PropTypes.bool,
    }),
    messages: PropTypes.shape({
      push_content: PropTypes.bool,
      push_ipdatatime: PropTypes.bool,
      push_tag: PropTypes.bool,
      push_userid: PropTypes.bool,
    }),
    url: PropTypes.bool,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  nextPage: PropTypes.func.isRequired,
};

export default PostPage;
