
if(process.env.VCAP_SERVICES){
  var env = JSON.parse(process.env.VCAP_SERVICES);
  var mongo = env['mongodb-2.0'][0]['credentials'];
}
else{
  var mongo = {
    "hostname":"localhost",
    "port":27017,
    "username":"",
    "password":"",
    "name":"",
    "db":"db"
  }
}

var generate_mongo_url = function(obj){
  obj.hostname = (obj.hostname || 'localhost');
  obj.port = (obj.port || 27017);
  obj.db = (obj.db || 'test');

  if(obj.username && obj.password){
    return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
  }
  else{
    return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
  }
}


var mongourl = generate_mongo_url(mongo);
var mapreducerow=[];

var record_visit = function(req, res){
  /* Connect to the DB and auth */
  require('mongodb').connect(mongourl, function(err, conn){
    var d = new Date();
    var dd = d.getDate();
    var mm = d.getMonth();
    var yy = d.getFullYear();
    var ts_str = mm + "-" + dd + "-" + yy;
    conn.collection('ips', function(err, coll){
      /* Simple object to insert: ip address and date */      
      object_to_insert = { 'ip': req.connection.remoteAddress, 'ts': ts_str, 'count': 1 };

      /* Insert the object then print in response */
      /* Note the _id has been created */
      coll.insert( object_to_insert, {safe:true}, function(err){
        // http header 
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.write("Hello world \n");
     
        // calls mapreduce
        coll.mapReduce(
                     mapFunction1,
                     reduceFunction1,
                     { out: "map_reduce_example" },callback
                    
                   );
        for(i=0; i<mapreducerow.length;i++){
          res.write(JSON.stringify(mapreducerow[i]) + "\n");
        }
        res.end();
      });


      
    });
  });
  
}

var callback = function(err, coll){
        coll.find({}, {limit:10, sort:[['_id','desc']]}, function(err, cursor){
            cursor.toArray(function(err, items){
                for(i=0; i<items.length;i++){
                    //res.write(JSON.stringify(items[i]) + "\n");
                    mapreducerow[i] = items[i];
                }
            });
        });
    };

var mapFunction1 = function() {
                       emit(this.ts, this.count);
                   };

var reduceFunction1 = function(keydate, count) {
                          return Array.sum(count);
                      };

var port = (process.env.VMC_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || 'localhost');
var http = require('http');

http.createServer(function (req, res) {

    record_visit(req, res);


}).listen(port, host);
