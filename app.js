var express = require('express');
var path = require('path');
var mysql = require('mysql');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var sessions = require('client-sessions');
var routes = require('./routes/index');
var users = require('./routes/users');
var files = require('./routes/files');
var test = require('./routes/test');

var app = express();

app.locals.mysql_escape = mysql.escape;

app.locals.connection = mysql.createConnection({
    host:'localhost',
    port: 3306,
    user: 'root',
    password: 'tkdqhd1!',
    database: 'noticall_ad'
});

app.locals.connection.connect(function(err) {
    if (err) {
        console.error('Database connection error');
        console.error(err);
        throw err;
    }
    else {
        console.log("Database is connected... \n\n");
    }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sessions({
  cookieName: 'mySession', // cookie name dictates the key name added to the request object
  secret: 'testest', // should be a large unguessable string
  duration: 1000 * 60 * 60, // how long the session will stay valid in ms
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/files', files);
app.use('/test', test);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
