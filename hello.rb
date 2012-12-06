require 'rubygems'
require 'sinatra'
require 'mongo'
require 'json'

include Mongo


get '/' do
  host = ENV['VMC_APP_HOST']
  port = ENV['VMC_APP_PORT']
  time1 = Time.new
  timestring = time1.strftime("%m-%d-%y")
  dbhost = JSON.parse(ENV['VCAP_SERVICES'])['mongodb-2.0'].first['credentials']['hostname'] rescue 'localhost'
  dbport = JSON.parse( ENV['VCAP_SERVICES'] )['mongodb-2.0'].first['credentials']['port'] rescue 27017
  database = JSON.parse( ENV['VCAP_SERVICES'] )['mongodb-2.0'].first['credentials']['db'] rescue 'tutorial_db'
  username =  JSON.parse( ENV['VCAP_SERVICES'] )['mongodb-2.0'].first['credentials']['username'] rescue ''
  password = JSON.parse( ENV['VCAP_SERVICES'] )['mongodb-2.0'].first['credentials']['password'] rescue ''
  mongo_client = MongoClient.new(dbhost,dbport) rescue "connection failed"
  db = mongo_client.db("db")
  auth = db.authenticate(username, password)
  coll = db.collection("testcollection") rescue "coll not found"
  doc = {"ip" => request.ip, "date" => timestring} 
  id = coll.insert(doc)  # save visitor's IP

  collb = db.collection("testcollection1") rescue "collb not found"
  count = collb.find_one({"date"=>timestring}, :fields=>["date","count"]) 
  doc1 ={"date"=>timestring, "count"=>count.to_a.length==0 ? 1 : JSON.parse(count.to_json)["count"]+1}
  count.to_a.length==0 ? collb.insert(doc1) : collb.update({"date"=>timestring},doc1)  #save daily ip counter 

  rows=""
  #coll.find.each  { |row| rows = JSON.parse(row.to_json)["date"] + "   " + JSON.parse(row.to_json)["ip"]  + "<br>" + rows }
   collb.find.each { |row| rows = JSON.parse(row.to_json)["date"] + " = " + JSON.parse(row.to_json)["count"].inspect + "<br>" + rows }
     
  "<h1> Hello from the Cloud! connect to mongoDB @#{dbhost} </h1><h2>This request on #{timestring} from #{request.ip}</h2> <br> Request history: <br> #{rows}"

  
end