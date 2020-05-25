const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const util = require('util');

// ========================================

function post_data(store) {
  let payload;
  switch (store.country) {
    case 'us':
      payload = `{"selectedService":"fetchlocation",\
"customerView":"desktop",\
"locale":"en_US",\
"selectedServiceValue":"${store.id}",\
"slId":"1241241241",\
"articles":[{"articleNo":"20011408","count":1}]}`;
      break;
    case 'ca':
      payload = `{"selectedService":"fetchlocation",\
"customerView":"desktop",\
"locale":"en_CA",\
"selectedServiceValue":"${store.id}",\
"slId":"1241241241",\
"articles":[{"articleNo":"30449908","count":1}]}`;
      break;
  }

  const hash = crypto.createHmac('sha1', 'G6XxMY7n')
                     .update(payload)
                     .digest('hex');
  return "payload=" + payload + "&hmac=" + hash;
}

function post4json(url, data, cb, e) {
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  };

  let req = https.request(url, options, (res) => {
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
      e(error);
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
        cb(parsedData);
      } catch (error) {
        e(error);
      }
    });
  }).on('error', e);

  req.write(data);

  req.end();
}

function read_json(json) {
  const legit_closed_1 =  {
                            status: "ERROR",
                            message: "The commission capacity of this store is exhausted for today",
                            code: 1470143968
                          };
  const legit_closed_2 =  {
                            status: 'ERROR',
                            message: 'Store has no available commissions',
                            code: 1410693100
                          };
  const legit_closed_3 =  {
                            status: "ERROR",
                            message: "Tried 100 without success. Probably you have no handover or collection capacity set. Store in Charge: ",
                            code: 0
                          };
  const legit_closed_4 =  {
                            status: 'ERROR',
                            message: 'No common capacity in configured time window',
                            code: 1472475118
                          }
  const legit_open_1 = {};

  if (util.isDeepStrictEqual(json, legit_closed_1)) return "closed";
  if (util.isDeepStrictEqual(json, legit_closed_2)) return "closed";
  if (json.status == legit_closed_3.status
      && json.message.startsWith(legit_closed_3.message)
      && json.code == legit_closed_3.code) return "closed";
  if (util.isDeepStrictEqual(json, legit_closed_4)) return "closed";
  if (json.status == "OK") return "open";

  return false;
}

function check_store(store, cb, e) {
  const url = `https://ww8.ikea.com/clickandcollect/${store.country}/receive/`;
  const data = post_data(store);
  post4json(url, data, (json) => {
    const store_status = read_json(json);
    if (store_status) cb(store_status);
    else {
      console.error(data);
      console.error(json);
      e(new Error(`Illegitimate JSON for ${store.name}`));
    }
  }, e);
}

// ========================================

// const test_stores = require('./data/ca-stores-list.json');

// const test_store = test_stores[0];

// check_store(test_store, (store_status) => {
//   console.log(`${new Date().toISOString()} | ${store_status.toUpperCase()}: ${test_store.name}, ${test_store.country}`);
// }, (error) => {
//   console.error(`${new Date().toISOString()} | ${error.message}`);
// });


// (function iter(i) {
//   const test_store = test_stores[i];
//   check_store(test_store, (store_status) => {
//     console.log(`${new Date().toISOString()} | ${store_status.toUpperCase()}: ${test_store.name}, ${test_store.country}`);
//   }, (error) => {
//     console.error(`${new Date().toISOString()} | ${error.message}`);
//   });
//   if (++i == test_stores.length) return;
//   setTimeout(iter, 1000, i);
// })(0);

// ========================================

if (fs.existsSync('./public/latest.json')) var latest = require('./public/latest.json');
else {
  var latest = [];
  load_stores_list('us');
  load_stores_list('ca');
}

function load_stores_list(country) {
  fs.readFile(`./data/${country}-stores-list.json`, 'utf8', (err, string) => {
    if (err) throw err;
    let stores = JSON.parse(string);
    for (const store of stores) {
      if (!latest.find(s => s.id == store.id)) {
        store.last_open = "";
        store.last_closed = "";
        latest.push(store);
      }
    }
    latest.sort((a, b) => { if (a.name < b.name) return -1; });
    latest.sort((a, b) => { if (a.state < b.state) return -1; });
    latest.sort((a, b) => { if (a.country < b.country) return -1; });
    console.log(`${new Date().toISOString()} | ${country} stores loaded: ${stores.length} stores`);
    output();
  });
}

function output() {
  fs.writeFile('./public/latest.json', JSON.stringify(latest, null, 2), (err) => {
    if (err) throw err;
  });
}

function update(store, status) {
  const now = new Date();

  if (status == 'open') store.last_open = now;
  else if (status == 'closed') store.last_closed = now;

  console.log(`${new Date().toISOString()} | ${status.toUpperCase()}: ${store.name}, ${store.state}, ${store.country}`);
  output();
}

fs.watch('./data/us-stores-list.json', (eventType, filename) => {
  if (eventType == 'change') load_stores_list('us');
});

fs.watch('./data/ca-stores-list.json', (eventType, filename) => {
  if (eventType == 'change') load_stores_list('ca');
});

// ========================================

(function iterate_stores(i) {
  const store = latest[i];
  if (store) check_store(store, (status) => {
    update(store, status);
  }, (error) => {
    console.error(`${new Date().toISOString()} | ${error.message}`);
  });
  if (++i > latest.length) i = 0;
  setTimeout(iterate_stores, 1000, i);
})(0);
