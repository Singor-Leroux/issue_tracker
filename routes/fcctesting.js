// routes/fcctesting.js
'use strict';

const fs = require('fs');

module.exports = function(app) {
  app.route('/_api/server.js')
    .get(function(req, res, next) {
      console.log('requested');
      fs.readFile(process.cwd() + '/server.js', function(err, data) {
        if(err) return next(err);
        res.send(data.toString());
      });
    });
};
