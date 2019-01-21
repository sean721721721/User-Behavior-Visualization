// @flow
import { createStore, compose, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import middleware from '../middlewares/sagamiddleware';
import rootReducer from '../reducers';

// store enhancers that applies the given middleware
const middlewares = Object.values(middleware).map(m => applyMiddleware(m));

// arrange all enhancers
const enableReduxDevTools = true;

// 過濾無效資料，類似 if(xxx) {...}
const enhancers = [...middlewares, enableReduxDevTools && composeWithDevTools()].filter(Boolean);

// mount it on the Store
const store = createStore(rootReducer, compose(...enhancers));

// render app common method
/*
const renderApp = (App, domId = 'app') => {
  ReactDOM.render(
    <AppContainer>
      <Provider store={appStore}>
        <ConnectedRouter history={appHistory}>
          <Route path="/" component={App} />
        </ConnectedRouter>
      </Provider>
    </AppContainer>,
    document.getElementById(domId),
  );
};

// render app router
renderApp(App);

// config hot reload
module.hot && module.hot.accept('./containers/App', () => renderApp(App));
*/
export default store;
