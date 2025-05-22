// routes/fcctesting.js
'use strict';

const fs = require('fs');
const path = require('path');

module.exports = function(app) {
  // Endpoint pour les tests FreeCodeCamp
  app.route('/_api/get-tests')
    .get(function(req, res) {
      console.log('GET /_api/get-tests');
      res.json([
        {
          title: 'Test 1',
          message: 'Test 1 message'
        },
        {
          title: 'Test 2',
          message: 'Test 2 message'
        }
      ]);
    });

  // Endpoint pour récupérer le code source du serveur
  app.route('/_api/server.js')
    .get(function(req, res, next) {
      console.log('GET /_api/server.js');
      fs.readFile(path.join(process.cwd(), 'server.js'), function(err, data) {
        if (err) return next(err);
        res.type('txt').send(data.toString());
      });
    });

  // Endpoint pour vérifier l'état du serveur
  app.route('/_api/status')
    .get(function(req, res) {
      res.json({ status: 'ok' });
    });
};
