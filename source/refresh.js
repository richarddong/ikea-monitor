'use strict';

const { MongoClient } = require('mongodb');
const locations = require('./locations.js');

async function main() {
  const uri = 'mongodb+srv://test:HfQFZbFKhxxJxobh'
            + '@cluster0-mkbdv.mongodb.net/test'
            + '?retryWrites=true&w=majority'
            + '&useUnifiedTopology=true';
  const dbClient = new MongoClient(uri);

  try {
    await dbClient.connect();
    const db = dbClient.db("test");
    const dbResult = await Promise.all([ locations.refresh(db, 'us'),
                                         locations.refresh(db, 'ca') ]);
    console.log('All updated');
  } catch (error) {
    console.error(error);
  } finally {
    await dbClient.close();
  }
}

main();
