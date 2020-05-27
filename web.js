var http = require('http');
var connect = require('connect');
var bodyParser = require('body-parser');
var serveStatic = require('serve-static');
var finalhandler = require('finalhandler');
var subscribe = require('./subscribe.js');

var app = connect();

app.use(bodyParser.urlencoded({extended: false}));

app.use('/subscribe', function (req, res) {
  subscribe.subscribe(req.body.email, req.body['store_names[]']);
  res.end();
});

app.use('/unsubscribe_all', function (req, res) {
  subscribe.unsubscribe_all(req.body.email);
  res.end();
});

// Serve up public/ftp folder
var serve = serveStatic('public', {
  'index': ['index.html', 'index.htm'],
  'maxAge': '1m'
});

app.use(function (req, res) {
  serve(req, res, finalhandler(req, res));
});

http.createServer(app).listen(3000);
