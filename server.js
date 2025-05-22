'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');
require('dotenv').config();
const helmet      = require('helmet');
const mongoose    = require('mongoose');

const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected successfully');
    // Start tests if NODE_ENV is 'test'
    if (process.env.NODE_ENV === 'test') {
      console.log('Running Tests...');
      setTimeout(function () {
        try {
          runner.run();
        } catch (e) {
          console.log('Tests are not valid:', e);
        }
      }, 3500); // Increased timeout for DB connection
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));


app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Helmet security
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.hidePoweredBy()); // For FCC tests

//Sample front-end
app.route('/:project/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/issue.html');
  });

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);  
    
//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

module.exports = app; //for testing