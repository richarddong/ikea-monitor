'use strict';

const { promisify } = require('util');
const sleep = promisify(setTimeout);

const { MongoClient } = require('mongodb');

const locations = require('./locations.js');
const availabilities = require('./availabilities.js');
const notification = require('./notification.js');

async function main() {
  const uri = 'mongodb+srv://test:HfQFZbFKhxxJxobh'
            + '@cluster0-mkbdv.mongodb.net/test'
            + '?retryWrites=true&w=majority'
            + '&useUnifiedTopology=true';
  const dbClient = new MongoClient(uri);

  try {
    await dbClient.connect();
    const db = dbClient.db('test');

    await Promise.all([
      locations.watch(db),
      availabilities.watch(db),
      notification.watch(db),
    ]);
  } catch (error) {
    console.error(error);
  } finally {
    await dbClient.close();
  }
}

main();
