var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var fs = require('fs');
var baseController = require('./controllers/BaseController');
var user = require('./controllers/UserController');
var common = require('./controllers/CommonController');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var multer = require('multer');
var errorHandler = require('errorhandler');
var routes = require('./routes/index');
var users = require('./routes/users');
var cron = require('./libcustom/cron');


// !! not sure if in use
var methodOverride = require('method-override');
var mailer = require('express-mailer');
var app = express();

// !! not sure if in use
var nodemailer = require('nodemailer');
var config = require('./config')();
var generic = require('./libcustom/generic');

var mysql = require('mysql');


var open = require('open');


mailer.extend(app, {
    from: config.email_details.from,
    transportMethod: config.email_details.transport_method, // default is SMTP. Accepts anything that nodemailer accepts 
    auth: {
        user: config.email_details.username,
        pass: config.email_details.password
    }
});

// add generic library to global space
global._generic = generic;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use(logger('dev'));
//app.use(bodyParser.json());
//app.use(express.bodyParser({limit: '6mb'}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

//app.use(bodyParser.urlencoded({extended: false}));
app.use(expressValidator({
    customValidators: {
        hasFriendList: function (value) {
            var $return = false;
            if (!value || !value.length)
                $return = false;
            value.forEach(function (val, i, arr) {
                if (!Array.isArray(val.location_id) || !val.friend_id) {
                    $return = false;
                } else {
                    if (arr.length == i + 1) {
                        $return = true;
                    }
                }
            });
            return $return;  
        }
    }
}));
//app.use(multer);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use(express.bodyParser());


/*var abc = function(req,res,next){
 console.log("hello in middleware")
 } */

/*app.use(abc,function(req,res,next){
 next();
 })*/

// custom validation for express validator
app.use(expressValidator({
    customValidators: {
        // Add your custom validations here
    }
}));


var attachDB = function (req, res, next) {
    /* test how to use middleware */

    var connection = mysql.createConnection({
        host: config.mysql.host,
        user: config.mysql.user,
        password: config.mysql.pass
    });
    connection.connect(function (err, db) {
        if (err) {
            console.error('error connecting: ' + err.stack);
        } else {
            connection.query('USE ' + config.mysql.dbname);
            req.db = connection;
            connection.query('SET time_zone = "Asia/Calcutta"', function (err, results, fields) {
                // connection.end();
            });
            console.log("Attached DB to req variable. Now moving for next middleware...\n");
            console.log("connection connect");
            next();
        }
    })
}

//    var requireLogin = function (req, res, next) {
//        common.checkIdandToken(req, res, next);
//    };

var beforeRender = function (req, res, next) {
    _generic.res = res;
    baseController.beforeRender(req, res, next);
};

app.use('/', routes);
app.use('/users', users);



// catch 404 and forward to error handler
app.use(function (err, req, res, next) {
    //console.log(err.status);return false;
    res.status(err.status || 500).json({ 'error': err.message });
    // var err = new Error('Not Found');
    // err.status = 404;
    // next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    console.log(err); return false;
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


//added by Sajan
/*process.on('uncaughtException', function (err) { 
    console.error(err); console.log("Node NOT Exiting..."); 
});*/
// });

module.exports = app;
