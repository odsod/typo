var jsesc = require('jsesc');
var fs = require('fs');

var file = fs.readFileSync(process.argv[2], 'utf-8');

console.log(jsesc(file));
