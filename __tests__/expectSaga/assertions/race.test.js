import { call, race, put, take } from 'redux-saga/effects';
import { expectSaga } from '../../../src';
import { delay } from '../../../src/utils/async';
import { errorRegex, unreachableError } from './_helper';

function quickFetchData() {
  return Promise.resolve({});
}

function slowFetchData() {
  return delay(500).then(() => ({}));
}

function* saga(fetchData) {
  const { success } = yield race({
    success: call(fetchData),
    cancel: take('CANCEL'),
  });

  yield put({ type: 'DONE', success: !!success });
}

test('race assertion passes', () => (
  expectSaga(saga, quickFetchData)
    .race({
      success: call(quickFetchData),
      cancel: take('CANCEL'),
    })
    .run()
));

test('success branch wins', () => (
  expectSaga(saga, quickFetchData)
    .put({ type: 'DONE', success: true })
    .run()
));

test('cancel branch wins', () => (
  expectSaga(saga, slowFetchData)
    .put({ type: 'DONE', success: false })
    .dispatch({ type: 'CANCEL' })
    .run()
));

test('race assertion fails with wrong cancel', () => (
  expectSaga(saga, quickFetchData)
    .race({
      success: call(quickFetchData),
      cancel: take('FOO'),
    })
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));

test('race assertion fails with wrong success', () => (
  expectSaga(saga, quickFetchData)
    .race({
      success: call(() => {}),
      cancel: take('CANCEL'),
    })
    .run()
    .then(unreachableError)
    .catch((e) => {
      expect(e.message).toMatch(errorRegex);
    })
));
