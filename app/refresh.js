'use strict';

const { MongoClient } = require('mongodb');

const locations = require('./locations.js');
const availabilities = require('./availabilities.js');
const notification = require('./notification.js');

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbClient = new MongoClient(uri);

  try {
    await dbClient.connect();
    const db = dbClient.db('ikeaMonitor');

    locations.watch(db);
    availabilities.watch(db);
    // notification.watch(db);
  } catch (error) {
    console.error(error);
  }
}

main();
