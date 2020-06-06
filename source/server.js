'use strict';

const { MongoClient } = require('mongodb');
const http = require('http');
const connect = require('connect');
const bodyParser = require('body-parser');
const serveStatic = require('serve-static');
const finalhandler = require('finalhandler');

const notification = require('./notification.js');

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbClient = new MongoClient(uri);

  try {
    await dbClient.connect();
    const db = dbClient.db('test');
    const app = connect();

    app.use('/latest.json', function (req, res) {
      res.setHeader('Content-Type', 'application/json; charset=UTF-8');
      db.collection('locations')
        .find({})
        .sort({country: 1, state: 1, name: 1})
        .project({subscribers: 0})
        .toArray((error, latest) => {
          res.end(JSON.stringify(latest, null, 2));
        });
    });

    app.use(bodyParser.urlencoded({extended: false}));

    app.use('/subscribe', function (req, res) {
      let storeNames;
      if (typeof req.body['storeNames[]'] == 'string') {
        storeNames = [req.body['storeNames[]']];
      } else {
        storeNames = req.body['storeNames[]'];
      }
      notification.subscribe(db, req.body.email, storeNames);
      res.end();
    });

    app.use('/unsubscribe_all', function (req, res) {
      notification.unsubscribeAll(db, req.body.email);
      res.end();
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
