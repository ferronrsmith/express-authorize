/**
 * Module dependencies.
 */

var Authorization = require('../')
  , bodyParser = require('body-parser')
  , express = require('express')
  , http = require('http')
  , methodOverride = require('method-override')
  , path = require('path')
  , session = require('express-session')

// Create a new express app
var app = express()

// Allow Header X-HTTP-Method-Override where modifying HTTP method is not possible
app.use(methodOverride('X-HTTP-Method-Override'))

// Body parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended : false
}))

// Sessions
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}))

// all environments
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Define Routes
app.get('/', function (req, res) {
  res.render('home', { authenticated: req.session.user ? true : false });
});

app.get('/login', function (req, res) {
  res.render('login', { });
});

app.post('/login', function (req, res) {
  req.session.user = {
    username: "root",
    permissions: [ 'account:view,edit', 'payment:view' ]
  };
  res.redirect('/');
});

app.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/');
});

// Initialize the authorizer
var authorizer = new Authorization({
  onDenied : function(req, res, next) {
    res.redirect('/login')
  }
})

// Session
app.get('/account', authorizer.isPermitted('account:view'), function (req, res) {
  res.render('assert', { });
});

app.get('/account/edit', authorizer.isPermitted('account:view', 'account:edit'), function (req, res) {
  res.render('assert', { });
});

app.get('/account/payment', authorizer.isPermitted('account:view', 'payment:view'), function (req, res) {
  res.render('assert', { });
});

// withSubject
var usr = {
  username : 'someotheruser',
  permissions : [
    'subject:yes'
  ]
}
app.get('/subject/yes', authorizer.withSubject(usr).isPermitted('subject:yes'), function (req, res) {
  res.render('assert', { });
});

app.get('/subject/no', authorizer.withSubject(usr).isPermitted('subject:no'), function (req, res) {
  res.render('assert', { });
});

// withPermissions
var perms = [
  'perm:yes'
]
app.get('/perm/yes', authorizer.withPermissions(perms).isPermitted('perm:yes'), function (req, res) {
  res.render('assert', { });
});

app.get('/perm/no', authorizer.withPermissions(perms).isPermitted('perm:no'), function (req, res) {
  res.render('assert', { });
});

app.use(function(err, req, res, next) {
  console.log(err)
  res.status(403).json(err.msg)
})

// Start Server
http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
