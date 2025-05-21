'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');
require('dotenv').config();
const helmet      = require('helmet');
const mongoose    = require('mongoose');
const path        = require('path');

const apiRoutes         = require('./routes/api.js');
// const fccTestingRoutes  = require('./routes/fcctesting.js'); // Pour les tests FCC, si vous clonez leur dépôt
// const runner            = require('./test-runner'); // Pour les tests FCC

const app = express();

// Sécurité Helmet
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"], // 'unsafe-inline' est nécessaire pour les scripts inline dans les vues simples
    styleSrc: ["'self'", "'unsafe-inline'"],
  }
}));
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.hidePoweredBy());


app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); // Pour les tests FCC

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function() {
  console.log("Successfully connected to MongoDB");
});

// Pages d'index (Frontend simple)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

app.route('/:project/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/issue.html');
  });

// Routage de l'API
apiRoutes(app);

// Routage pour les tests FCC (si vous utilisez leur boilerplate)
// fccTestingRoutes(app); // Décommentez si vous avez fcctesting.js

// Gestionnaire 404 - doit être après toutes les autres routes
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const port = process.env.PORT || 3000;
// Démarrer le serveur et les tests (si NODE_ENV=test)
app.listen(port, function () {
  console.log("Listening on port " + port);
  if(process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run(); // Décommentez si vous avez test-runner.js du boilerplate FCC
      } catch(e) {
        let error = e;
          console.log('Tests are not valid:');
          console.log(error);
      }
    }, 1500);
  }
});

module.exports = app; // pour les tests