const https = require('https');
const querystring = require('querystring');
const fs = require('fs');
const crypto = require('crypto');

function post(data, callback, err) {
  let options = {
    hostname: 'ww8.ikea.com',
    path: '/clickandcollect/us/receive/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  let req = https.request(options, (res) => {
    const { statusCode } = res;
    const contentType = res.headers['content-type'];

    let error;
    if (statusCode !== 200) {
      error = new Error('Request Failed.\n' +
                        `Status Code: ${statusCode}`);
    } else if (!/^application\/json/.test(contentType)) {
      error = new Error('Invalid content-type.\n' +
                        `Expected application/json but received ${contentType}`);
    }
    if (error) {
      err(error);
      // Consume response data to free up memory
      res.resume();
      return;
    }

    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        const parsedData = JSON.parse(rawData);
        callback(parsedData);
      } catch (e) {
        err(e.message);
      }
    });
  }).on('error', err);

  req.write(data);

  req.end();
}

if (fs.existsSync('./public/latest.json')) var stores = require('./public/latest.json');
else var stores = require('./stores.json');

function post_data(store) {
  const payload = `{"selectedService":"fetchlocation",\
"customerView":"desktop",\
"locale":"en_US",\
"selectedServiceValue":"${store.id}",\
"slId":"1241241241",\
"articles":[{"articleNo":"20011408","count":1}]}`;
  const hash = crypto.createHmac('sha1', 'G6XxMY7n')
                     .update(payload)
                     .digest('hex');
  return "payload=" + payload + "&hmac=" + hash;
}

function export2file(){
  fs.writeFile('./public/latest.json', JSON.stringify(stores, null, 2), (err) => {
    if (err) throw err;
  });
}

function log_result(store, result) {
  let now = new Date();
  switch (result) {
    case 'OPEN':
      store.last_open = now;
      break;
    case 'CLOSED':
      store.last_closed = now;
      break;
  }
  export2file();
  return console.log(`${new Date().toISOString()} | ${result}: IKEA ${store.name}, ${store.state}`);
}

function check_store(store) {
  let data = post_data(store);
  post(data, (result) => {
    if (result.status == 'ERROR') log_result(store, 'CLOSED');
    else if (result.status == 'OK') log_result(store, 'OPEN');
    else log_result(store, 'ERROR');
    // setTimeout(check_store, 1000, store);
  }, (error) => {
    console.error(`${new Date().toISOString()} | ERROR: Failed to fetch ${store.name}, ${store.state}. ${error.message}`);
    // setTimeout(check_store, 1000, store);
  });

}

(function iterate_stores(i) {
  setTimeout(() => {
    check_store(stores[i]);
    if (!i--) i = stores.length - 1;
    iterate_stores(i);
  }, 1000);
})(stores.length - 1);


