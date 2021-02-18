/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable max-len */
// @flow
import React from 'react';
import Lodash from 'lodash';
import { Provider } from 'react-redux';
import store from '../store/index';
import Menu from './menu';
import Loading from './loading';
import './style/bbs.css';
import Graph from './graph';

class Grid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      responseError: false,
      errorType: '',
      menuprops: {
        initParameter: {
          var1: 'reaction',
          min1: '0',
          max1: '',
          var2: 'comment',
          min2: '0',
          max2: '',
          posttype: 'PTT',
        },
        initPage1: {
          pagename: 'Gossiping',
          since: '2020-07-20',
          until: '2020-07-21',
          wordfilter: '吳益政',
          idfilter: '',
          contentfilter: '',
          authorfilter: '',
          commentfilter: 1,
        },
        submitType: 'All',
      },
      visprops: {
        list: [],
        date: [{ $gte: '', $lt: '' }],
        word: [['']],
      },
    };

    this.getFilename = this.getFilename.bind(this);
    this.getReqstr = this.getReqstr.bind(this);
    this.changeList = this.changeList.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleTab = this.handleTab.bind(this);
  }

  /*
  componentDidUpdate() {
    console.log(this.state);
    this.forceUpdate(console.log('update'));
  }
  */
  getFilename() {
    const {
      menuprops: {
        initPage1: { pagename: pagename1, since: date1, until: date2 },
      },
    } = this.state;

    const filename = `${pagename1}_${date1}_${date2}.csv`;
    return filename;
  }

  getReqstr() {
    const {
      menuprops: {
        initParameter: {
          var1: varname1, min1: minvar1, max1: maxvar1, posttype,
        },
        initPage1: {
          pagename: pagename1,
          since: date1,
          until: date2,
          wordfilter: keyword1,
          contentfilter: keyword3,
          idfilter: user1,
          authorfilter: author1,
          commentfilter: commentThreshold,
        },
        submitType: type,
      },
    } = this.state;

    // make url string for request data
    const strminvar1 = `min${varname1}=${minvar1}` || '';
    const strmaxvar1 = `max${varname1}=${maxvar1}` || '';
    const strposttype = `posttype=${posttype}` || '';
    const strpage1 = `page1=${pagename1}` || '';
    const strtime1 = `time1=${date1}` || '';
    const strtime2 = `time2=${date2}` || '';
    const struser1 = `user1=${user1}` || '';
    const strauthor1 = `author1=${author1}` || '';
    const strkeyword1 = `keyword1=${keyword1}` || '';
    const strkeyword3 = `keyword3=${keyword3}` || '';
    const strcommentThreshold = `commentThreshold=${commentThreshold}` || '';
    const strco = `co=${type}` || '';
    const searchurl = '/searching?';
    const str = `${searchurl + strminvar1}&${strmaxvar1}&${strposttype}&`
      + `${strpage1}&${strtime1}&${strtime2}&${strauthor1}&${struser1}&${strkeyword1}&${strkeyword3}&${strcommentThreshold}&${strco}`;
    return str;
  }

  setResponseError() {
    this.setState(prevState => ({ ...prevState, responseError: true }));
  }

  handleSubmit(e) {
    e.preventDefault();
    this.setState(prevState => ({
      ...prevState, isLoading: true, responseError: false, errorType: '',
    }));
    const url = encodeURI(this.getReqstr());
    const myRequest = new Request(url, {
      method: 'get',
    });
    fetch(myRequest)
      .then((response) => {
        if (response.status >= 200 && response.status < 300) {
          return response.json();
        }
        const error = new Error(response.statusText);
        error.response = response;
        throw error;
      })
      .then((res) => {
        console.log(res);
        // console.log('done!');
        if (res.title === 'search') {
          this.changeList(res, 0);
        } else {
          const error = {
            message: 'Fail to fetch',
          };
          throw error;
        }
        // data 才是實際的 JSON 資料
      })
      .catch((error) => {
        console.log('Error');
        this.setState(prevState => ({ ...prevState, responseError: true, errorType: error }));
        console.log(error);
      });
  }

  changeList(datalist, collection) {
    const { list, next, previous } = datalist;
    this.setState(prevState => ({
      isLoading: false,
      ...prevState,
      visprops: {
        set: list[collection + 1][0],
      },
    }));
    console.log('change');
    this.setState(prevState => ({ ...prevState, isLoading: false }));
  }

  // should change to <input>
  handleTab(e, tab) {
    console.log(e, tab);
    const { target } = e;
    const { name, value } = target;
    this.setState((prevState) => {
      const state = Lodash.cloneDeep(prevState);
      state.menuprops[tab][name] = value;
      return state;
    });
  }

  render() {
    const {
      isLoading, responseError, errorType, menuprops, visprops,
    } = this.state;
    return (
      <div className="container-fluid">
        <div className="navbar">
          <Menu
            menuprops={menuprops}
            onSubmit={this.handleSubmit}
            handlePT={e => this.handleTab(e, 'initParameter')}
            handlePT1={e => this.handleTab(e, 'initPage1')}
          />
        </div>
        <div className="grid">
          <Provider store={store}>
            <div className="grid1">
              <Loading isLoading={isLoading} responseError={responseError} errorType={errorType} />
              <Graph
                set={visprops.set}
                opState={this.state}
              />
            </div>
          </Provider>
        </div>
      </div>
    );
  }
}

export default Grid;
