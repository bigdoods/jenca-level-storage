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
    port:process.env.PORT || 3000,
    datafile:process.env.DATAFILE || '/tmp/leveldb'
  }
})

var db = level(args.datafile);

net.createServer(function (con) {
  con.pipe(multilevel.server(db)).pipe(con);
}).listen(args.port, function(err){
  if(err){
    console.error(err)
    process.exit(1)
  }
  else{
    console.log('server listening on: ' + args.port)
  }
});
