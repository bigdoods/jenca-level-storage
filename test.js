var tape = require("tape")
var async = require("async")
var path = require("path")
var http = require("http")
var from2 = require("from2-string")
var hyperquest = require("hyperquest")
var hyperrequest = require("hyperrequest")
var concat = require("concat-stream")
var settings = require('./settings')
var rimraf = require('rimraf');

var multilevel = require('multilevel');
var net = require('net');
var level = require('level');


/*

  boot a test server for each test so the state from one
  does not affect another test

*/
function createServer(done){

  rimraf(settings.defaultFilePath, {}, function(){
    // start a leveldb instance
    var db_server = level(settings.defaultFilePath);

    var db_server_con = net.createServer(function (con) {
      con.pipe(multilevel.server(db_server)).pipe(con);
    }).listen(settings.leveldbPort, function(err){

      done(null, {db:db_server, con:db_server_con})
    });
  })
}


function createClient(done){

  var db_client = multilevel.client();
  var db_client_con = net.connect(settings.leveldbPort);
  db_client_con.pipe(db_client.createRpcStream()).pipe(db_client_con);

  done(null, {db:db_client, con:db_client_con})
}


tape("Store value", function (t) {

  var server;
  var client;

  var test_key = 'testing:some.sortof.key'
  var test_value = 'testing: value'

  async.series([
    // create the server
    function(next){
      createServer(function(err, s){
        if(err) return next(err)
        server = s
        next()
      })
    },

    // create the server
    function(next){
      createClient(function(err, c){
        if(err) return next(err)
        client = c
        next()
      })
    },

    // set a value
    function(next){
      client.db.put(test_key, test_value, function (err) {
        if (err) next(err.toString());

        next()
      })
    },

    // read the value
    function(next){
      client.db.get(test_key, function (err, value) {
        if (err) next(err.toString());

        t.equal(value, test_value, "saved value matches")

        next()
      })
    },




  ], function(err){
    if(err){
      t.error(err)
      client.db.close()
      server.db.close()
      server.con.close()
      t.end()
      return
    }
    client.db.close()
    server.db.close()
    server.con.close()
    t.end()
  })

})


// update value test
tape("Update value", function (t) {

  var server;
  var client;

  var test_key = 'testing:some.sortof.key'
  var test_value = 'testing: value'
  var test_value_modifier = 'modified'

  async.series([
    // create the server
    function(next){
      createServer(function(err, s){
        if(err) return next(err)
        server = s
        next()
      })
    },

    // create the server
    function(next){
      createClient(function(err, c){
        if(err) return next(err)
        client = c
        next()
      })
    },

    // set a value
    function(next){
      client.db.put(test_key, test_value, function (err) {
        if (err) next(err.toString());

        next()
      })
    },

    // reset a value
    function(next){
      client.db.put(test_key, test_value + test_value_modifier, function (err) {
        if (err) next(err.toString());

        next()
      })
    },

    // read the value
    function(next){
      client.db.get(test_key, function (err, value) {
        if (err) next(err.toString());

        t.equal(value, test_value + test_value_modifier, "updated value matches")

        next()
      })
    },




  ], function(err){
    if(err){
      t.error(err)
      client.db.close()
      server.db.close()
      server.con.close()
      t.end()
      return
    }
    client.db.close()
    server.db.close()
    server.con.close()
    t.end()
  })

})


// range test
tape("Range query", function (t) {

  var server;
  var client;

  var test_key = 'testing:some.sortof.key.'
  var test_value = 'testing: value'

  async.series([
    // create the server
    function(next){
      createServer(function(err, s){
        if(err) return next(err)
        server = s
        next()
      })
    },

    // create the server
    function(next){
      createClient(function(err, c){
        if(err) return next(err)
        client = c
        next()
      })
    },

    // set some values
    function(next){
      for(i=1;i<=10;i++)
        client.db.put(test_key+i, test_value, function (err) {
          if (err) next(err.toString());
        })

      next()
    },

    // read the values
    function(next){

      var found_values = {}
      var upper_limit = 5

      client.db.createReadStream({gte:test_key+upper_limit})
      .on('data', function (data) {
        found_values[data.key] = data.value
      })
      .on('error', function (err) {
        next(err)
      })
      .on('end', function () {
        console.dir(found_values)
        t.equal(Object.keys(found_values).length, upper_limit, upper_limit + " values found")
        next()
      })
    },




  ], function(err){
    if(err){
      t.error(err)
      //client.db.close()
      //server.db.close()
      //server.con.close()
      t.end()
      return
    }
    client.db.close()
    server.db.close()
    server.con.close()
    t.end()
  })

})


// delete test