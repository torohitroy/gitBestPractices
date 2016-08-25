
var mysql = require('mysql');
var config = require('./index')()
var pool = mysql.createPool({
    connectionLimit: 50,
    queueLimit: 50,
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.pass,
    database : config.mysql.dbname,
    timezone : 'local'

});
module.exports = pool;