var http = require('http'),
    https = require('https'),
    path = require('path');

var staticFolder = path.join(__dirname, '../../static'),
    staticServer = new require('node-static').Server(staticFolder);

exports.listen = function(port, callback) {
  http.createServer(function(req, res) {
    if (/^\/github/.test(req.url)) {
      https.request({
        hostname: 'api.github.com',
        port: 443,
        path: req.url.replace(/^\/github/, ''),
        headers: { 'User-Agent': 'nodejs' }
      }, function(gitHubRes) {
        res.writeHead(gitHubRes.statusCode, gitHubRes.headers);
        gitHubRes.on('data', res.write.bind(res));
        gitHubRes.on('end', res.end.bind(res));
      }).end();
    } else {
      staticServer.serve(req, res);
    }
  }).listen(port, callback);
};
