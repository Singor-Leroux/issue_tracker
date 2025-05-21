'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');
require('dotenv').config();
const helmet      = require('helmet');
const mongoose    = require('mongoose');
const path        = require('path');

const apiRoutes         = require('./routes/api.js');




const app = express();


app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
  }
}));
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.hidePoweredBy());


app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function() {
  console.log("Successfully connected to MongoDB");
});


app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

app.route('/:project/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/issue.html');
  });


apiRoutes(app);



apiRoutes(app);


if (process.env.NODE_ENV !== 'test') {
  app.use(function(req, res, next) {
    res.status(404)
      .type('text')
      .send('Not Found');
  });
} else {
  
  app.use(function(req, res, next) {
    console.log(`[TEST ENV 404 REACHED] Path: ${req.originalUrl}`);
    res.status(404).json({ message: "Test environment: Route not found" }); 
  });
}


const port = process.env.PORT || 3000;



const listener = app.listen(port, function () {});

module.exports = app; 
module.exports.listener = listener; 