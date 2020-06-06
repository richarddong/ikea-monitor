'use strict';

const email = require('./email.js');

async function subscribe(db, emailAddress, locationNames) {
  const updates = locationNames.map(locationName => {
    return  db.collection('locations')
              .updateOne(
                {name: locationName},
                {
                  $addToSet: {subscribers: emailAddress}
                }
              );
  });
  await Promise.all(updates);
  await email.send(emailAddress,
                   email.subscriptionConfirmationMsg(locationNames));
  return true;
}

async function unsubscribeAll(db, emailAddress) {
  return db.collection('locations')
           .updateMany(
            {},
            {
              $pull: {subscribers: emailAddress}
            }
           );
}

// async function subscriptionsOf(db, emailAddress) {
//   return db.collection('locations')
//            .find({subscribers: emailAddress})
//            .project({subscribers: 0})
//            .toArray();
// }

// async function subscribersOf(db, locationName) {
//   const location = await db.collection('locations')
//                            .findOne({name: locationName});
//   return location.subscribers;
// }

async function notify(db, location) {
  if (!location.subscribers || location.subscribers.length == 0) return;
  await db.collection('locations').updateOne({
    country: location.country,
    state: location.state,
    name: location.name,
    id: location.id
  }, {
    $set: {lastNotified: new Date()}
  });
  return email.send(location.subscribers,
                    email.notificationMsg(location.name));
}

async function watch(db) {
  const pipeline = [
    {
      '$match': {
        'operationType': 'update',
        'updateDescription.updatedFields.lastStatus': 'open'
      }
    }
  ];
  const stream = db.collection('locations')
                   .watch(pipeline, {fullDocument: 'updateLookup'});
  stream.on('change', (locationChangeStreamRes) => {
    notify(db, locationChangeStreamRes.fullDocument);
    console.log(locationChangeStreamRes);
  });
}

exports.subscribe = subscribe;
exports.unsubscribeAll = unsubscribeAll;
exports.watch = watch;

// // Debugging Code

// const { MongoClient } = require('mongodb');

// async function main() {
//   const uri = process.env.MONGODB_URI;
//   const dbClient = new MongoClient(uri);

//   try {
//     await dbClient.connect();
//     const db = dbClient.db('test');

//     // await subscribe(db, 'test@dong.st', ['Burbank', 'Costa Mesa']);
//     // await subscribe(db, 'test2@dong.st', ['Burbank', 'Carson']);
//     // await subscribe(db, 'test3@dong.st', ['Burbank', 'Carson']);
//     // await unsubscribeAll(db, 'test3@dong.st');
//     // console.log(await subscriptionsOf(db, 'test@dong.st'));
//     // console.log(await subscribersOf(db, 'Burbank'));
//     await watch(db);

//   } catch (error) {
//     console.error(error);
//   } finally {
//     // await dbClient.close();
//   }
// }

// main();
