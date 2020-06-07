const { MongoClient } = require('mongodb');

async function subscribeAll(db) {
  console.log('Subscribe All: ', 'test@dong.st');
  const result = await db.collection('locations')
                          .updateMany(
                            {},
                            {
                              $addToSet: {subscribers: 'test@dong.st'}
                            }
                          );
  console.log(`${result.matchedCount} document(s) matched the query criteria.`);
  console.log(`${result.modifiedCount} document(s) was/were updated.`);
  return;
}

async function unsubscribeAll(db) {
  console.log('Unsubscribe All: ', 'test@dong.st');
  const result = await db.collection('locations')
                          .updateMany(
                            {},
                            {
                              $pull: {subscribers: 'test@dong.st'}
                            }
                          );
  console.log(`${result.matchedCount} document(s) matched the query criteria.`);
  console.log(`${result.modifiedCount} document(s) was/were updated.`);
  return;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbClient = new MongoClient(uri);

  try {
    await dbClient.connect();
    const db = dbClient.db('ikeaMonitor');


    await subscribeAll(db);
    // await unsubscribeAll(db);


  } catch (error) {
    console.error(error);
  } finally {
    await dbClient.close();
  }
}

main();
