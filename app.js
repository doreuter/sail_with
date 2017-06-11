const express       = require('express'),
      config        = require('./server/config/config'),
      mongoose      = require('mongoose'),
      logger        = require('morgan'),
      passport      = require('passport'),
      path          = require('path'),
      favicon       = require('serve-favicon'),
      cookieParser  = require('cookie-parser'),
      bodyParser    = require('body-parser');

// Router
const router = require('./server/routes/index');

const indexPath = path.join(__dirname, 'public', 'index.html');

// express init
const app = express();

// view engine
app.set('view engine', 'ejs');
app.engine('.html', require('ejs').renderFile);

// uncomment after placing favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/public')));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// mongoose config
mongoose.Promise = global.Promise;
mongoose.connect(config.database);

router(app);

app.get('*', function (req, res) {
  res.sendFile(indexPath);
});

module.exports = app;
