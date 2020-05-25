var finalhandler = require('finalhandler')
var http = require('http')
var serveStatic = require('serve-static')

// Serve up public/ftp folder
var serve = serveStatic('public', { 'index': ['index.html', 'index.htm'] })

// Create server
var server = http.createServer(function onRequest (req, res) {
  serve(req, res, finalhandler(req, res))
})

// Listen
server.listen(80)


// var static = require('node-static');

// var file = new static.Server('./public', {cache: 30});

// require('http').createServer(function (request, response) {
//   request.addListener('end', function () {
//     file.serve(request, response);
//   }).resume();
// }).listen(80);

