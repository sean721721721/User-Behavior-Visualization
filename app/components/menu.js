// @flow
import React from 'react';
import TextareaAutosize from 'react-autosize-textarea';
import Card from './card';
import ParameterTab from './parameter';
import Page1 from './page';
import SubmitTab from './submit';
import DownloadtTab from './download';
import './bbs.css';

class Menu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
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
    };

    this.openTab = this.openTab.bind(this);
    this.handleCloseTab = this.handleCloseTab.bind(this);
  }

  openTab = (evt, tabName) => {
    switch (tabName) {
      case 'Parameters':
        this.setState(() => ({
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
        }));
        break;
      case 'Page1':
        this.setState(() => ({
          showParameter: false,
          showPage1: true,
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
        }));
        break;
      case 'Page2':
        this.setState(() => ({
          showParameter: false,
          showPage1: false,
          initPage1: {
            pagename1: 'Gossiping',
            since1: '2018-06-01',
            until1: '2018-06-10',
            wordfilter1: '丁守中',
            idfilter1: '',
            contentfilter1: '柯文哲',
          },
          showPage2: true,
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
        }));
        break;
      case 'Submit':
        this.setState(() => ({
          showParameter: false,
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
          showSubmit: true,
          showDownload: false,
        }));
        break;
      case 'Download':
        this.setState(() => ({
          showParameter: false,
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
          showDownload: true,
        }));
        break;
      default:
    }
  };

  handleCloseTab = () => {
    // e.preventDefault();
    console.log('close');
    this.setState(() => ({
      showParameter: false,
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
    }));
    // this.parentElement.style.display = 'none';
  };
  /*
  handleChange(state) {
    this.setState({
      showParameter: true,
      showPage1: false,
      showPage2: false,
      showSubmit: false,
      showDownload: false,
    });
  }
  */

  render() {
    const {
      showParameter,
      showPage1,
      initPage1,
      showPage2,
      initPage2,
      showSubmit,
      showDownload,
    } = this.state;

    return (
      <div className="box menu">
        <div className="tab">
          <button className="tablinks" type="button">
            <a href="/">Reset</a>
          </button>
          <button
            className="tablinks"
            type="button"
            onClick={(e) => {
              this.openTab(e, 'Parameters');
            }}
          >
            Parameters
          </button>
          <button
            className="tablinks"
            type="button"
            onClick={(e) => {
              this.openTab(e, 'Page1');
            }}
          >
            Page1
          </button>
          <button
            className="tablinks"
            type="button"
            onClick={(e) => {
              this.openTab(e, 'Page2');
            }}
          >
            Page2
          </button>
          <button
            className="tablinks"
            type="button"
            onClick={(e) => {
              this.openTab(e, 'Submit');
            }}
          >
            Submit
          </button>
          <button
            className="tablinks"
            type="button"
            onClick={(e) => {
              this.openTab(e, 'Download');
            }}
          >
            Download
          </button>
        </div>
        <ParameterTab show={showParameter} onChange={this.handleCloseTab} />
        <Page1 show={showPage1} init={initPage1} onChange={this.handleCloseTab} />
        <Page1 show={showPage2} init={initPage2} onChange={this.handleCloseTab} />
        <SubmitTab show={showSubmit} onChange={this.handleCloseTab} />
        <DownloadtTab show={showDownload} onChange={this.handleCloseTab} />
        <div className="grid1">
          <div className="grid2">
            <div className="box overview">
              <div id="template" className="slider__list" />
              <div id="over" />
              <div id="select" />
              <Card />
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
                    <a className="btn wide" href="/bbs/MobileComm/index.html">
                      下頁
                    </a>
                    <a className="btn wide" href="/bbs/MobileComm/index.html">
                      最新
                    </a>
                  </div>
                </div>
                <div className="r-list-container">
                  <div className="r-ent">
                    <div className="nrec">
                      <span className="h1 f1">爆</span>
                    </div>
                    <div className="title">
                      <a href="/bbs/MobileComm/M.1540446065.A.825.html">[LIVE] 小米Mix3發表會</a>
                    </div>
                    <div className="meta">
                      <div className="author pwe-menu">
                        <div className="pwe-menu">Feishawn</div>
                      </div>
                      <div className="article-Menu" />
                      <div className="data">10/25</div>
                      <div className="mark">M</div>
                    </div>
                  </div>
                </div>
              </div>
              <div id="detail" />
            </div>
          </div>
          <div className="box userview" id="table">
            <div id="userdeg">
              <div id="olbutton" />
            </div>
            <div id="main-container">
              <div id="main-content" className="bbs-screen bbs-content">
                <div className="article-metaline">
                  <span className="article-meta-tag">作者</span>
                  <span className="article-meta-value">Feishawn (亞魚兒)</span>
                </div>
                <div className="article-metaline-right">
                  <span className="article-meta-tag">看板</span>
                  <span className="article-meta-value">
                    <a className="pwe-board" href="/bbs/MobileComm/index.html">
                      MobileComm
                    </a>
                  </span>
                </div>
                <div className="article-metaline">
                  <span className="article-meta-tag">標題</span>
                  <span className="article-meta-value">[LIVE] 小米Mix3發表會</span>
                </div>
                <div className="article-metaline">
                  <span className="article-meta-tag">時間</span>
                  <span className="article-meta-value">Thu Oct 25 13:41:00 2018</span>
                </div>
                <p>
                  首先，先強調這是中國手機 對中國產品看到會頭痛四肢無力心臟不舒服的請盡快按下--
                  直播連結: https://bit.ly/2Jdy6Nb 英文版論壇圖文直播:
                  http://en.miui.com/thread-4139599-1-1.html B站: https://bit.ly/2SmFydc 優酷:
                  https://bit.ly/2PpO4t0
                  目前可以確定的就是滑蓋、前鏡頭2400萬畫素、無線充電更快(可能到10W?)
                  然後有960fps的慢動作 (我對小米錄影不期不待就是了) 還有5G網路 --
                </p>
                <span className="f2">※ 發信站: 批踢踢實業坊(ptt.cc), 來自: 36.237.159.224</span>
                <span className="f2">
                  <p>※ 文章網址:</p>
                  <a
                    href="https://www.ptt.cc/bbs/MobileComm/M.1540446065.A.825.html"
                    target="_blank"
                    rel="nofollow"
                  >
                    https://www.ptt.cc/bbs/MobileComm/M.1540446065.A.825.html
                  </a>
                </span>
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
              </div>
            </div>
            <div id="overlap" />
          </div>
        </div>
      </div>
    );
  }
}

export default Menu;
