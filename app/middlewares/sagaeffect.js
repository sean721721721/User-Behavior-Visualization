// @flow
import {
  call, put, select, takeEvery, takeLatest,
} from 'redux-saga/effects';
import '@babel/polyfill';
// import Api from './...';

function* watchAndLog() {
  yield takeEvery('*', function* logger(action) {
    const state = yield select();

    console.log('action', action);
    console.log('state after', state);
  });
}

// worker Saga: will be fired on USER_FETCH_REQUESTED actions
function* fetchCard(action) {
  try {
    const card = yield call(Api.fetchCard, action.payload.cardId);
    yield put({ type: 'CARD_FETCH_SUCCEEDED', card });
  } catch (e) {
    yield put({ type: 'CARD_FETCH_FAILED', message: e.message });
  }
}

/*
  Starts fetchUser on each dispatched `USER_FETCH_REQUESTED` action.
  Allows concurrent fetches of user.

function* mySaga() {
  yield takeEvery('USER_FETCH_REQUESTED', fetchCard);
}
*/

/*
  Alternatively you may use takeLatest.

  Does not allow concurrent fetches of user. If "USER_FETCH_REQUESTED" gets
  dispatched while a fetch is already pending, that pending fetch is cancelled
  and only the latest one will be run.
*/
function* rootSaga() {
  yield takeLatest('CARD_FETCH_REQUESTED', fetchCard);
  yield watchAndLog();
}
export default rootSaga;
