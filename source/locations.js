'use strict';

const { promisify } = require('util');
const sleep = promisify(setTimeout);

const https = require('https');
const caProvince = require('../data/ca-province.json');

async function getIkeaRaw(country) {
  return new Promise((resolve, reject) => {
    const req = https.get({
      host: process.env.IKEA_HOST,
      port: 443,
      path: `https://ww8.ikea.com/clickandcollect/${country}`
            + '/receive/listfetchlocations?version=2',
      headers: { 'Host': 'ww8.ikea.com' },
      timeout: 5000,
    }, (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];

      let error;
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n' +
                          `Status Code: ${statusCode}`);
      } else if (!/^application\/json/.test(contentType)) {
        error = new Error('Invalid content-type.\n' +
                          'Expected application/json but received ' +
                          contentType);
      }
      if (error) {
        // Consume response data to free up memory
        res.resume();
        reject(error);
        return;
      }

      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          resolve(parsedData);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject)
      .on('timeout', () => {
        req.abort();
        reject(new Error('HTTP request timeout'));
      });
  });
}

function ikeaRaw2Locations(ikeaRaw, country) {
  const locations = [];
  switch (country) {
    case 'us':
      for (const id in ikeaRaw) {
        const rawLocation = ikeaRaw[id];
        const location = {};
        location.country = 'us';
        location.state = rawLocation.name.slice(0, 2);
        location.name = rawLocation.name.slice(4).startsWith('IKEA ')
                      ? rawLocation.name.slice(9)
                      : rawLocation.name.slice(4);
        location.isClosed = rawLocation.isClosed;
        location.closingTimes = rawLocation.closingTimes;
        location.id = id;
        locations.push(location);
      }
      break;
    case 'ca':
      for (const id in ikeaRaw) {
        const rawLocation = ikeaRaw[id];
        if (!rawLocation.name.startsWith('IKEA ')) continue;
        const name = rawLocation.name
                       .slice(5, rawLocation.name.indexOf(' - '));
        const state = caProvince[name];
        const location = {};
        location.country = 'ca';
        location.state = state;
        location.name = name;
        location.isClosed = rawLocation.isClosed;
        location.closingTimes = rawLocation.closingTimes;
        location.id = id;
        locations.push(location);
      }
      break;
  }
  // locations.sort((a, b) => { if (a.name < b.name) return -1; });
  // locations.sort((a, b) => { if (a.state < b.state) return -1; });
  return locations;
}

async function get(country) {
  const ikeaRaw = await getIkeaRaw(country);
  const locations = ikeaRaw2Locations(ikeaRaw, country);
  return locations;
}

async function upsert(db, location) {
  const result = await db
                        .collection('locations')
                        .updateOne({
                            country: location.country,
                            state: location.state,
                            name: location.name,
                            id: location.id
                          }, {
                            $set: location
                          }, {
                            upsert: true
                          });
  // console.debug(location);
  // console.debug(`${result.matchedCount} document(s) matched the query criteria.`);
  // if (result.upsertedCount > 0) {
  //   console.debug(`One document was inserted with the id ${result.upsertedId._id}`);
  // } else {
  //   console.debug(`${result.modifiedCount} document(s) was/were updated.`);
  // }
  return result;
}

async function upsertAll(db, locations) {
  const updates = [];
  for (const location of locations) {
    updates.push(upsert(db, location));
  }
  return Promise.all(updates);
}

async function refresh(db, country) {
  if (country != 'us' && country != 'ca') {
    throw new Error(`Country expected 'us' or 'ca', got '${country}'`);
  }
  const locations = await get(country);
  return upsertAll(db, locations);
}

async function watch(db) {
  while (true) {
    try {
      await refresh(db, 'us');
      console.log('U.S. updated');
    } catch (error) {
      console.error(error.message);
      console.log(`Try U.S. later`);
    }
    await sleep(10000);
    try {
      await refresh(db, 'ca');
      console.log('Canada updated');
    } catch (error) {
      console.error(error.message);
      console.log(`Try Canada later`);
    }
    await sleep(10000);
  }
}

exports.watch = watch;

// // Debugging Code

// const { MongoClient } = require('mongodb');

// async function main() {
//   const uri = 'mongodb+srv://test:HfQFZbFKhxxJxobh'
//             + '@cluster0-mkbdv.mongodb.net/test'
//             + '?retryWrites=true&w=majority&ssl=true'
//             + '&useUnifiedTopology=true';
//   const dbClient = new MongoClient(uri);

//   try {
//     await dbClient.connect();
//     const db = dbClient.db('test');
//     await refresh(db, 'us');
//     await refresh(db, 'ca');
//     console.debug('All updated');
//   } catch (error) {
//     console.error(error);
//   } finally {
//     await dbClient.close();
//   }
// }

// main();
