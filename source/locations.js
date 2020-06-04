'use strict';

const https = require('https');
const caProvince = require('../data/ca-province.json');

/* async */ function getIkeaRaw(country) {
  if (country != 'us' && country != 'ca') {
    throw new Error(`Country expected 'us' or 'ca', got '${country}'`);
  }
  return new Promise(function(fulfill, reject) {
    https.get(`https://ww8.ikea.com/clickandcollect/${country}` +
              '/receive/listfetchlocations?version=2', (res) => {
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
          fulfill(parsedData);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function ikeaRaw2Locations(ikeaRaw, country) {
  const locations = [];
  switch (country) {
    case 'us':
      for (const id in ikeaRaw) {
        const rawLocation = ikeaRaw[id];
        const location = {};
        location.country = "us";
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
        location.country = "ca";
        location.state = state;
        location.name = name;
        location.isClosed = rawLocation.isClosed;
        location.closingTimes = rawLocation.closingTimes;
        location.id = id;
        locations.push(location);
      }
      break;
    default:
      throw new Error(`Country expected 'us' or 'ca', got '${country}'`);
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
                        .collection("locations")
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
  //     console.debug(`One document was inserted with the id ${result.upsertedId._id}`);
  // } else {
  //     console.debug(`${result.modifiedCount} document(s) was/were updated.`);
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
  const locations = await get(country);
  return upsertAll(db, locations);
}

exports.refresh = refresh;

// Debugging Code

// const { MongoClient } = require('mongodb');

// async function main() {
//   const uri = 'mongodb+srv://test:HfQFZbFKhxxJxobh'
//             + '@cluster0-mkbdv.mongodb.net/test'
//             + '?retryWrites=true&w=majority&ssl=true';
//   const dbClient = new MongoClient(uri);

//   try {
//     await dbClient.connect();
//     const db = dbClient.db("test");
//     const dbResult = await refresh(db, 'us');
//     console.debug('All updated');
//   } finally {
//     await dbClient.close();
//   }
// }

// main();
