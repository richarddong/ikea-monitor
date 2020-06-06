const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbClient = new MongoClient(uri);

  try {
    await dbClient.connect();
    const db = dbClient.db('test');

    const subscribers = require('../temp/subscribers.json');

    const allUpdates = [];

    for (const email in subscribers) {
      const locationNames = Array.isArray(subscribers[email]) ? subscribers[email] : [subscribers[email]];
      for (const locationName of locationNames) {
        allUpdates.push(db.collection('locations')
                          .updateOne(
                            {name: locationName},
                            {
                              $addToSet: {subscribers: email.trim()}
                            }
                          )
        );
      }
    }

    console.log(allUpdates.length);
    await Promise.all(allUpdates);

  } catch (error) {
    console.error(error);
  } finally {
    await dbClient.close();
  }
}

main();
