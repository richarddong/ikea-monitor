'use strict';

const { MongoClient } = require('mongodb');
const http = require('http');
const connect = require('connect');
const serveStatic = require('serve-static');
const finalhandler = require('finalhandler');

async function main() {
  const uri = 'mongodb+srv://test:HfQFZbFKhxxJxobh'
            + '@cluster0-mkbdv.mongodb.net/test'
            + '?retryWrites=true&w=majority'
            + '&useUnifiedTopology=true';
  const dbClient = new MongoClient(uri);

  try {
    await dbClient.connect();
    const db = dbClient.db("test");
    const app = connect();

    app.use('/latest.json', function (req, res) {
      res.setHeader('Content-Type', 'application/json; charset=UTF-8');
      db.collection("locations")
        .find({})
        .sort({country: 1, state: 1, name: -1})
        .toArray((error, latest) => {
          res.end(JSON.stringify(latest, null, 2));
        });
    });

    const serve = serveStatic('../public', {
      'index': ['index.html', 'index.htm'],
      'maxAge': '1m'
    });

    app.use(function (req, res) {
      serve(req, res, finalhandler(req, res));
    });

    http.createServer(app).listen(3000);

  } catch (error) {
    console.error(error);
  } finally {
    // await dbClient.close();
  }
}

main();
