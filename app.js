var express         = require('express');
var path            = require('path');
var logger          = require('morgan');
var cookieParser    = require('cookie-parser');
var bodyParser      = require('body-parser');
var request         = require('request');
var oauthserver     = require('node-oauth2-server');
var multer          = require('multer'); 
var mongoose        = require('mongoose');

// create an error with .status. we
// can then use the property in our
// custom error handler (Connect repects this prop as well)

function error(status, msg) {
  var err = new Error(msg);
  err.status = status;
  return err;
}

// creating an express app.
var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer()); // for parsing multipart/form-data
app.use(cookieParser());


/*
* Setting up the API-KEY authentication.
*
*/

// map of valid api keys, typically mapped to
// account info with some sort of database like redis.
// api keys do _not_ serve as authentication, merely to
// track API usage or help prevent malicious behavior etc.

/*
var apiKeys = [process.env.API_KEY];

console.log(apiKeys);

// here we validate the API key,

app.all('*', function(req, res, next) {


  var key = req.header('api_key');

  console.log(key);

  // key isn't present
  if (!key) return next(error(400, 'api key required'));

  // key is invalid
  if (!~apiKeys.indexOf(key)) return next(error(401, 'invalid api key'));

  // all good, store req.key for route access
  req.key = key;
  next();
});
*/


/*
* Setting up the mongoDB connections
*
*/ 
var uristring =  process.env.MONGOLAB_URI ||  
                 process.env.MONGOHQ_URL || 
                 'mongodb://localhost/plugged_db';

// Connecting to mongodb.
mongoose.connect(uristring, function(err, res) {
  if(err) {
    console.log('Error connecting to the database.' + err);
  } else {
    console.log('Connected to the database.');
  }
});



var routes = require('./routes/index');
var verify = require('./routes/verify');

app.use('/', routes);
app.use('/verify', verify);


// handling the authorization uses OAuth2.

var memorystore = require('./routes/model.js');

app.oauth = oauthserver({
  model: memorystore, // See below for specification
  grants: ['password'],
  debug: true
});

app.all('/oauth/token', app.oauth.grant());

// app.get('/', app.oauth.authorise(), function (req, res) {
//   res.send('Secret area');
// });

app.use(app.oauth.errorHandler());



// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = error(404, 'Not Found');
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
    var status = err.status || 500;
    res.send(error('Error occured', status))
});

module.exports = app;
