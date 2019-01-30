// @flow
// Inject fetch polyfill if fetch is unsuported
// if (!window.fetch) { const fetch = require('whatwg-fetch') }

function statusHelper(response) {
  if (response.status >= 200 && response.status < 300) {
    return Promise.resolve(response);
  }
  return Promise.reject(new Error(response.statusText));
}

const fetchApi = {
  getcard() {
    return fetch('/cardlist', {
      method: 'GET',
    })
      .then(statusHelper)
      .then(response => response.json())
      .catch(error => error)
      .then((data) => {
        console.log(data); // The data does log!
        return data;
      });
  },
  savecard(Data) {
    return fetch('/savecard', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Data,
      }),
    })
      .then(statusHelper)
      .then(response => response.json())
      .catch(error => error)
      .then((data) => {
        console.log(data); // The data does log!
        return data;
      });
  },
};

export default fetchApi;
