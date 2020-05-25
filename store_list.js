const https = require('https');
const fs = require('fs');
const util = require('util');

function get_raw(country_id, cb) {
  https.get('https://ww8.ikea.com/clickandcollect/' + country_id + '/receive/listfetchlocations?version=2', (res) => {
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
      console.error(error.message);
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
      } catch (e) {
        console.error(e.message);
      }
    });
  }).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
  });
}

function get_us_stores(cb) {
  let stores = [];
  get_raw('us', (raw_stores) => {
    for (const id in raw_stores) {
      const raw_store = raw_stores[id];
      let store = {};
      // store.country = "United States";
      store.state = raw_store.name.slice(0, 2);
      store.name = raw_store.name.slice(4).startsWith('IKEA ') ? raw_store.name.slice(9) : raw_store.name.slice(4);
      store.isClosed = raw_store.isClosed;
      store.closingTimes = raw_store.closingTimes;
      store.id = id;
      stores.push(store);
    }
    stores.sort((a, b) => { if (a.name < b.name) return -1; });
    stores.sort((a, b) => { if (a.state < b.state) return -1; });
    cb(stores);
  });
}

(function watch_us_stores(last_stores) {
  get_us_stores((stores) => {
    if (!util.isDeepStrictEqual(stores, last_stores)) {
      console.log(new Date().toISOString() + " | " + stores.length + " stores in the U.S. UPDATED");
      fs.writeFileSync('./data/us-stores-list.json', JSON.stringify(stores, null, 2));
    } else {
      console.log(new Date().toISOString() + " | " + stores.length + " stores in the U.S.");
    }
    setTimeout(watch_us_stores, 10000, stores);
  });
})();


// var ca_stores = [];

// get_raw('ca', (raw_stores) => {
//   for (const id in raw_stores) {
//     const raw_store = raw_stores[id];
//     let store = {};
//     // store.state = raw_store.name.slice(0, 2);
//     store.name = raw_store.name.startsWith('IKEA ') ? raw_store.name.slice(5) : raw_store.name;
//     store.isClosed = raw_store.isClosed;
//     store.closingTimes = raw_store.closingTimes;
//     store.id = id;
//     ca_stores.push(store);
//   }
//   console.log(ca_stores);
// });

