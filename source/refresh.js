'use strict';

const { promisify } = require('util');
const sleep = promisify(setTimeout);

const { MongoClient } = require('mongodb');

const locations = require('./locations.js');
const availabilities = require('./availabilities.js');

async function refreshCountries(db) {
  while (true) {
    try {
      await locations.refresh(db, 'us');
      console.log('U.S. updated');
    } catch (error) {
      console.error(error);
      console.log(`Try U.S. later`);
    }
    try {
      await locations.refresh(db, 'ca');
      console.log('Canada updated');
    } catch (error) {
      console.error(error);
      console.log(`Try Canada later`);
    }
    await sleep(10000);
  }
}

async function refreshLocations(db) {
  while (true) {
    const allLocations = db.collection("locations")
                           .find({})
                           .sort({lastUpdated: 1});
    for await(const location of allLocations) {
      console.log(location.name);
      try {
        await availabilities.update(db, location);
      } catch (error) {
        console.error(error);
        console.log(`Try ${location.name} later`);
      }
      await sleep(1000);
    }
  }
}

async function main() {
  const uri = 'mongodb+srv://test:HfQFZbFKhxxJxobh'
            + '@cluster0-mkbdv.mongodb.net/test'
            + '?retryWrites=true&w=majority'
            + '&useUnifiedTopology=true';
  const dbClient = new MongoClient(uri);

  try {
    await dbClient.connect();
    const db = dbClient.db("test");

    await Promise.all([refreshCountries(db), refreshLocations(db)]);
  } catch (error) {
    console.error(error);
  } finally {
    await dbClient.close();
  }
}

main();
