'use strict';

const { promisify } = require('util');
const sleep = promisify(setTimeout);

const crypto = require('crypto');
const https = require('https');
const util = require('util');

function webForm(location) {
  let payload = '';
  switch (location.country) {
    case 'us':
      payload = `{"selectedService":"fetchlocation",\
"customerView":"desktop",\
"locale":"en_US",\
"selectedServiceValue":"${location.id}",\
"slId":"1241241241",\
"articles":[{"articleNo":"20011408","count":1},\
{"articleNo":"30449908","count":1},\
{"articleNo":"40064702","count":1}]}`;
      break;
    case 'ca':
      payload = `{"selectedService":"fetchlocation",\
"customerView":"desktop",\
"locale":"en_CA",\
"selectedServiceValue":"${location.id}",\
"slId":"1241241241",\
"articles":[{"articleNo":"20011408","count":1},\
{"articleNo":"30449908","count":1},\
{"articleNo":"40064702","count":1}]}`;
      break;
  }

  const hash = crypto.createHmac('sha1', 'G6XxMY7n')
                     .update(payload)
                     .digest('hex');

  return 'payload=' + payload + '&hmac=' + hash;
}

async function getIkeaRaw(location) {
  return new Promise(function (resolve, reject) {
    const req = https.request({
        host: process.env.IKEA_HOST,
        port: 443,
        path: 'https://ww8.ikea.com/clickandcollect/'
              + `${location.country}/receive/`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Host': 'ww8.ikea.com'
        },
        timeout: 5000,
      }, (res) => {
        const { statusCode } = res;
        // const statusCode = 500;
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
            const now = new Date(res.headers['date']);
            resolve([parsedData, now]);
          } catch (error) {
            reject(error);
          }
        });
    }).on('error', reject)
      .on('timeout', () => {
        req.abort();
        reject(new Error('HTTP request timeout.'));
      });

    req.write(webForm(location));

    req.end();
  });
}

function ikeaRaw2Status (ikeaRaw) {
  const legitClosed1 =  {
    status: 'ERROR',
    message: 'The commission capacity of this store is exhausted for today',
    code: 1470143968
  };
  const legitClosed2 =  {
    status: 'ERROR',
    message: 'Store has no available commissions',
    code: 1410693100
  };
  const legitClosed3 =  {
    status: 'ERROR',
    message: 'Tried 100 without success. Probably you have no handover or \
collection capacity set. Store in Charge: ',
    code: 0
  };
  const legitClosed4 =  {
    status: 'ERROR',
    message: 'No common capacity in configured time window',
    code: 1472475118
  };
  if (util.isDeepStrictEqual(ikeaRaw, legitClosed1)) return 'closed';
  if (util.isDeepStrictEqual(ikeaRaw, legitClosed2)) return 'closed';
  if (ikeaRaw.status == legitClosed3.status
      && ikeaRaw.message.startsWith(legitClosed3.message)
      && ikeaRaw.code == legitClosed3.code) return 'closed';
  if (util.isDeepStrictEqual(ikeaRaw, legitClosed4)) return 'closed';
  if (ikeaRaw.status == 'OK') return 'open';
  console.warn(ikeaRaw);
  throw new Error('Unhandled form of raw JSON of availability from IKEA.');
}

async function get(location) {
  const [ikeaRaw, now] = await getIkeaRaw(location);
  const status = ikeaRaw2Status(ikeaRaw);
  return [status, now];
}

async function update(db, location) {
  const [status, now] = await get(location);
  location.lastUpdated = now;
  if (status == 'open') location.lastOpen = now;
  else if (status == 'closed') location.lastClosed = now;
  location.lastStatus = status;
  const result = await db
                        .collection('locations')
                        .updateOne({
                            country: location.country,
                            state: location.state,
                            name: location.name,
                            id: location.id
                          }, {
                            $set: location
                          });
  console.debug(`${result.matchedCount} document(s) matched the query criteria.`);
  if (result.upsertedCount > 0) {
    console.debug(`One document was inserted with the id ${result.upsertedId._id}`);
  } else {
    console.debug(`${result.modifiedCount} document(s) was/were updated.`);
  }
  return result;
}

async function watch(db) {
  while (true) {
    const allLocations = db.collection('locations')
                           .find({})
                           .sort({lastUpdated: 1});
    for await(const location of allLocations) {
      console.log(location.name);
      try {
        await update(db, location);
      } catch (error) {
        console.error(error.message);
        console.log(`Try ${location.name} later`);
      }
      await sleep(1000);
    }
  }
}

exports.watch = watch;

// // Debugging Code

// const { MongoClient } = require('mongodb');

// async function main() {
//   const uri = process.env.MONGODB_URI;
//   const dbClient = new MongoClient(uri);

//   try {
//     await dbClient.connect();
//     const db = dbClient.db('ikeaMonitor');
//     const cm = await db.collection('locations')
//         .findOne({
//             name: 'Burbank',
//             state: 'CA'
//         });
//     const result = await update(db, cm);
//     // console.log(result);
//   } catch (error) {
//     console.error(error);
//   } finally {
//     await dbClient.close();
//   }
// }

// main();
