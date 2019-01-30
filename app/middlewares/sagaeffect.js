// @flow
import {
  all, call, put, select, takeEvery, takeLatest, cancelled,
} from 'redux-saga/effects';
import '@babel/polyfill';
import {
  CARD_FETCH_SUCCEEDED,
  CARD_FETCH_FAILED,
  CARD_FETCH_REQUESTED,
  CARD_SAVE,
  CARD_SAVE_FAILED,
  CARD_SAVE_SUCCEEDED,
} from '../constants/action-types';
import {
  fetchSucceeded, fetchFailed, saveSucceeded, saveFailed,
} from '../actions';
import Api from './fetchapi';

function* saveCard() {
  try {
    const state = yield select();
    const {
      fetch: { cards },
    } = state;
    // console.log('save', cards);
    /* const res = yield fetch(req).then(statusHelper).then((response) => {
      response.json();
    }); */
    const res = yield call(Api.savecard, { card: cards });
    // console.log(res);
    if (res.isSave) {
      // yield call(saveFailed, res.lastUpdate);
      yield put({ type: CARD_SAVE_SUCCEEDED, lastUpdate: res.lastUpdate });
    } else {
      // yield call(saveFailed, 'isSave: false');
      yield put({ type: CARD_SAVE_FAILED, message: 'isSave: false' });
    }
  } catch (e) {
    // yield call(saveFailed, e.message);
    yield put({ type: CARD_SAVE_FAILED, message: e.message });
  } /* finally {
    if (yield cancelled()) {
    } */
}

// worker Saga: will be fired on USER_FETCH_REQUESTED actions
function* fetchCard() {
  try {
    const state = yield select();
    console.log(state);
    const { result: cards } = yield call(Api.getcard);
    // console.log('fetch', cards);
    // yield call(fetchSucceeded, cards);
    yield put({ type: CARD_FETCH_SUCCEEDED, cards });
  } catch (e) {
    // yield call(fetchFailed, e.message);
    yield put({ type: CARD_FETCH_FAILED, message: e.message });
  } /* finally {
    if (yield cancelled()) {
    } */
}

function* saveC() {
  yield takeLatest(CARD_SAVE, saveCard);
}

function* fetchC() {
  yield takeLatest(CARD_FETCH_REQUESTED, fetchCard);
}

function* watchAndLog() {
  yield takeEvery('*', function* logger(action) {
    const state = yield select();
    console.log('action', action);
    console.log('state after', state);
  });
}

/*
  Starts fetchUser on each dispatched `USER_FETCH_REQUESTED` action.
  Allows concurrent fetches of user.
*/
function* Sagas() {
  // yield fetchC();
  // yield saveC();
  // yield watchAndLog();
  yield all([fetchC(), saveC(), watchAndLog()]);
}

/*
  Alternatively you may use takeLatest.

  Does not allow concurrent fetches of user. If "USER_FETCH_REQUESTED" gets
  dispatched while a fetch is already pending, that pending fetch is cancelled
  and only the latest one will be run.

function* rootSaga() {
  yield takeLatest('CARD_FETCH_REQUESTED', fetchCard);
  yield watchAndLog();
}
*/

export default Sagas;
