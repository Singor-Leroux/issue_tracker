'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');
require('dotenv').config();
const helmet      = require('helmet');
const mongoose    = require('mongoose');
const path        = require('path');

const apiRoutes         = require('./routes/api.js');
// Les lignes pour fccTestingRoutes et runner devraient déjà être commentées/supprimées
// const fccTestingRoutes  = require('./routes/fcctesting.js');
// const runner            = require('./test-runner');

const app = express();

// Sécurité Helmet
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

// Gestionnaire 404 - doit être après toutes les autres routes
if (process.env.NODE_ENV !== 'test') {
  app.use(function(req, res, next) {
    res.status(404)
      .type('text')
      .send('Not Found'); // Ceci pourrait être la source de [Error: Not Found] si NODE_ENV n'est pas 'test'
  });
} else {
  // Gestionnaire 404 spécifique aux tests
  app.use(function(req, res, next) {
    console.log(`[TEST ENV 404 REACHED] Path: ${req.originalUrl}`);
    res.status(404).json({ message: "Test environment: Route not found" }); 
  });
}

const port = process.env.PORT || 3000;

// Démarrer le serveur
// Nous allons stocker l'instance du serveur (listener) pour pouvoir la fermer plus tard dans les tests
const listener = app.listen(port, function () {
  console.log("Listening on port " + port);
  // La logique "Running Tests..." est plus pertinente dans le script de test lui-même ou via le log de Mocha
  // if(process.env.NODE_ENV==='test') {
  //   console.log('Running Tests...');
  // }
});

module.exports = app; // pour les tests chai-http
module.exports.listener = listener; // Exportez le listener pour pouvoir le fermer