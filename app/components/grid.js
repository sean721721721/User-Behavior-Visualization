// @flow
import React from 'react';
import TextareaAutosize from 'react-autosize-textarea';
import Menu from './menu';
import Card from './card';
import PostList from './postlist';
import Post from './post';
import './bbs.css';

class Grid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      /*
      error: null,
      isLoaded: false,
      items: [],
      */
      menuprops: {
        showParameter: true,
        showPage1: false,
        initPage1: {
          pagename1: 'Gossiping',
          since1: '2018-06-01',
          until1: '2018-06-10',
          wordfilter1: '丁守中',
          idfilter1: '',
          contentfilter1: '柯文哲',
        },
        showPage2: false,
        initPage2: {
          pagename1: 'Gossiping',
          since1: '2018-06-01',
          until1: '2018-06-10',
          wordfilter1: '柯文哲',
          idfilter1: '',
          contentfilter1: '丁守中',
        },
        showSubmit: false,
        showDownload: false,
      },
      cardprops: {
        time: '23 Oct 018',
        title: '柯P',
        description: '台北市長柯文哲在PTT上別稱',
        tags: ['人物', '政治', '台北'],
      },
      postlistprops: {
        list: [
          {
            count: '爆',
            href: '/bbs/MobileComm/M.1540446065.A.825.html',
            title: '[LIVE] 小米Mix3發表會',
            author: 'Feishawn',
            date: '10/25',
            mark: 'M',
          },
        ],
      },
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
  }
  /*
  componentDidMount() {
    fetch('https://api.example.com/items')
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            isLoaded: true,
            items: result.items,
          });
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            isLoaded: true,
            error,
          });
        },
      );
  }
  */

  render() {
    const {
      menuprops, cardprops, postlistprops, postprops,
    } = this.state;
    return (
      <div className="grid">
        <Menu menuprops={menuprops} />
        <div className="grid1">
          <div className="grid2">
            <div className="box overview">
              <div id="template" className="slider__list" />
              <div id="over" />
              <div id="select" />
              <Card cardprops={cardprops} />
            </div>
            <div className="box postview">
              <div id="page" />
              <TextareaAutosize
                defaultValue="Church-key flannel bicycle rights, tofu tacos before they sold out polaroid for free"
                theme={{
                  textarea: {
                    fontSize: '18px',
                    borderColor: 'green',
                  },
                }}
              />
            </div>
            <div className="box detailview">
              <div className="btn-postgroup" />
              <div className="btn-usergroup" />
              <PostList postlistprops={postlistprops} />
              <div id="detail" />
            </div>
          </div>
          <div className="box userview" id="table">
            <div id="userdeg">
              <div id="olbutton" />
            </div>
            <Post postprops={postprops} />
            <div id="overlap" />
          </div>
        </div>
      </div>
    );
  }
}

export default Grid;
