var path = require('path')
var http = require('http')
var settings = require('./settings')

var multilevel = require('multilevel');
var net = require('net');
var level = require('level');

var args = require('minimist')(process.argv, {
  alias:{
    p:'port',
    d:'datafile'
  },
  default:{
    port:process.env.PORT || 80,
    datafile:process.env.DATAFILE || settings.defaultFilePath
  }
})

var db = level(settings.datafile);

net.createServer(function (con) {
  con.pipe(multilevel.server(db)).pipe(con);
}).listen(settings.port);
