const { MongoClient } = require('mongodb');
const fs = require('fs');

const { promisify } = require('util');
const sleep = promisify(setTimeout);

function parse() {
  const lines = fs.readFileSync('./temp/recover.txt', 'utf8').split('\n');
  lines.pop();
  const parsed = [];
  for (const line of lines) {
    if (line.startsWith('Subscribe:  ')) {
      const emailAddress = line.slice(12, line.indexOf('[')-1);
      if (!emailAddress.match(/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i)) continue;
      // console.log(line.slice(line.indexOf('[')));
      const locationNames = JSON.parse(`{ "locationNames": ${line.replace(/\'/g, '"').slice(line.indexOf('['))} }`).locationNames;
      parsed.push({
        action: 'subscribe',
        emailAddress: emailAddress,
        locationNames: locationNames,
      });
    } else if (line.startsWith('Unsubscribe All:  ')) {
      const emailAddress = line.slice(18);
      if (!emailAddress.match(/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i)) continue;
      parsed.push({
        action: 'unsubscribe all',
        emailAddress: emailAddress,
      });
    } else {
      throw new Error('Invalid line');
    }
  };
  return parsed;
}

async function subscribe(db, emailAddress, locationNames) {
  console.log('Subscribe: ', emailAddress, locationNames);
  for (const locationName of locationNames) {
    console.log('Subscribe: ', emailAddress, locationName);
    const result = await db.collection('locations')
                            .updateOne(
                              {name: locationName},
                              {
                                $addToSet: {subscribers: emailAddress}
                              }
                            );
    console.log(`${result.matchedCount} document(s) matched the query criteria.`);
    console.log(`${result.modifiedCount} document(s) was/were updated.`);
  }
  return true;
}

async function unsubscribeAll(db, emailAddress) {
  console.log('Unsubscribe All: ', emailAddress);
  const result = await db.collection('locations')
                         .updateMany(
                          {},
                          {
                            $pull: {subscribers: emailAddress}
                          }
                         );
  console.log(`${result.matchedCount} document(s) matched the query criteria.`);
  console.log(`${result.modifiedCount} document(s) was/were updated.`);
  return true;
}


async function main() {
  const uri = process.env.MONGODB_URI;
  const dbClient = new MongoClient(uri);

  try {
    await dbClient.connect();
    const db = dbClient.db('ikeaMonitor');

    // const allSubscribers = await db.collection('locations').distinct('subscribers');

    // fs.writeFileSync('./temp/allSubscribers.txt', allSubscribers.join('\n'));

    // const parsed = parse();
    // for (const one of parsed) {
    //   if (one.action == 'subscribe') {
    //     await subscribe(db, one.emailAddress, one.locationNames);
    //   } else if (one.action == 'unsubscribe all') {
    //     await unsubscribeAll(db, one.emailAddress);
    //   } else {
    //     throw new Error('Invalid action');
    //   }
    //   await sleep(1000);
    // }

  } catch (error) {
    console.error(error);
  } finally {
    await dbClient.close();
  }
}

main();
// parse();
