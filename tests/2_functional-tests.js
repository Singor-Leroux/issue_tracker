const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const serverApp = require('../server'); // Importera 'app' pour chai.request(serverApp)
const serverInstance = require('../server').listener; // Importera le 'listener' pour le fermer
const Issue = require('../models/issue'); // Pour nettoyer la DB

chai.use(chaiHttp);

let testIssueId1;
let testIssueId2;
// On peut définir un projet spécifique pour les tests pour éviter les conflits
const testProjectName = 'test-project-fcc';
const testProjectFiltersName = 'test-project-filters-fcc';
const mongoose = require('mongoose');

suite('Functional Tests', function() {
  
  suiteSetup(async function() {
    console.log('Setting up tests...');
    if (process.env.NODE_ENV === 'test') {
      // S'assurer que la connexion DB est établie avant de nettoyer
      // Mongoose gère la file d'attente des opérations, donc c'est généralement ok
      await Issue.deleteMany({ project_name: testProjectName });
      await Issue.deleteMany({ project_name: testProjectFiltersName });
      console.log('Test DB cleared for specified projects.');
    }
  });

  // Créer quelques tickets pour les tests de filtre pour testProjectFiltersName
  // Fait une seule fois avant les tests GET pour ce projet
  suite('Setup for GET filter tests', function() {
    setup(async function() { // Utiliser setup pour que ce soit fait avant chaque bloc de test GET si nécessaire, ou suiteSetup pour une fois
      if (process.env.NODE_ENV === 'test') {
          // S'assurer que la collection est vide avant d'insérer pour ce projet de filtre spécifique
          await Issue.deleteMany({ project_name: testProjectFiltersName });
          await Issue.insertMany([
              { project_name: testProjectFiltersName, issue_title: 'Filter Test 1', issue_text: 'text', created_by: 'Mocha', assigned_to: 'Chai', open: true, status_text: "pending" },
              { project_name: testProjectFiltersName, issue_title: 'Filter Test 2', issue_text: 'text', created_by: 'Mocha', assigned_to: 'Joe', open: false, status_text: 'Closed by test' },
              { project_name: testProjectFiltersName, issue_title: 'Filter Test 3', issue_text: 'another text', created_by: 'Jane', assigned_to: 'Chai', open: true }
          ]);
          console.log('Filter test issues created for', testProjectFiltersName);
      }
    });
  });


  suite('POST /api/issues/{project}', function() {
    test('Create an issue with every field', function(done) {
      chai.request(serverApp) // Utiliser serverApp (l'application Express)
        .post(`/api/issues/${testProjectName}`)
        .send({
          issue_title: 'Title 1',
          issue_text: 'Text 1',
          created_by: 'Functional Test - Every field',
          assigned_to: 'Chai',
          status_text: 'In QA'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.property(res.body, 'issue_title', 'Title 1');
          // ... (autres assertions)
          assert.equal(res.body.assigned_to, 'Chai');
          assert.equal(res.body.status_text, 'In QA');
          assert.isTrue(res.body.open);
          testIssueId1 = res.body._id;
          done();
        });
    });

    test('Create an issue with only required fields', function(done) {
      chai.request(serverApp)
        .post(`/api/issues/${testProjectName}`)
        .send({
          issue_title: 'Title 2',
          issue_text: 'Text 2',
          created_by: 'Functional Test - Required fields'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          // ... (assertions)
          assert.equal(res.body.assigned_to, '');
          assert.equal(res.body.status_text, '');
          testIssueId2 = res.body._id;
          done();
        });
    });

    test('Create an issue with missing required fields', function(done) {
      chai.request(serverApp)
        .post(`/api/issues/${testProjectName}`)
        .send({
          issue_title: 'Title 3'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'required field(s) missing' });
          done();
        });
    });
  });

  suite('GET /api/issues/{project}', function() {
    test('View issues on a project', function(done) {
      chai.request(serverApp)
        .get(`/api/issues/${testProjectFiltersName}`)
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.isAtLeast(res.body.length, 3, `Should have at least 3 issues for ${testProjectFiltersName}`);
          done();
        });
    });

    test('View issues on a project with one filter', function(done) {
      chai.request(serverApp)
        .get(`/api/issues/${testProjectFiltersName}?open=false`)
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.equal(res.body.length, 1);
          assert.equal(res.body[0].issue_title, 'Filter Test 2');
          assert.isFalse(res.body[0].open);
          done();
        });
    });

    test('View issues on a project with multiple filters', function(done) {
      chai.request(serverApp)
        .get(`/api/issues/${testProjectFiltersName}?open=true&assigned_to=Chai`)
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.equal(res.body.length, 2);
          res.body.forEach(issue => {
            assert.isTrue(issue.open);
            assert.equal(issue.assigned_to, 'Chai');
          });
          done();
        });
    });
  });

  suite('PUT /api/issues/{project}', function() {
    test('Update one field on an issue', function(done) {
      chai.request(serverApp)
        .put(`/api/issues/${testProjectName}`)
        .send({
          _id: testIssueId1,
          issue_text: 'Updated Text 1'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { result: 'successfully updated', '_id': testIssueId1 });
          done();
        });
    });

    test('Update multiple fields on an issue', function(done) {
      chai.request(serverApp)
        .put(`/api/issues/${testProjectName}`)
        .send({
          _id: testIssueId1,
          issue_title: 'Updated Title 1',
          assigned_to: 'Mocha',
          open: 'false' // Envoyé comme chaîne, sera converti en booléen par l'API
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { result: 'successfully updated', '_id': testIssueId1 });
          Issue.findById(testIssueId1).then(issue => { // Vérification optionnelle en DB
            assert.equal(issue.issue_title, 'Updated Title 1');
            assert.isFalse(issue.open);
            done();
          }).catch(done);
        });
    });

    test('Update an issue with missing _id', function(done) {
      chai.request(serverApp)
        .put(`/api/issues/${testProjectName}`)
        .send({ issue_title: 'This will fail' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'missing _id' });
          done();
        });
    });

    test('Update an issue with no fields to update', function(done) {
      chai.request(serverApp)
        .put(`/api/issues/${testProjectName}`)
        .send({ _id: testIssueId1 })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'no update field(s) sent', '_id': testIssueId1 });
          done();
        });
    });

    test('Update an issue with an invalid _id (format)', function(done) {
      const invalidId = 'invalidid123';
      chai.request(serverApp)
        .put(`/api/issues/${testProjectName}`)
        .send({ _id: invalidId, issue_title: 'This will also fail' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'could not update', '_id': invalidId });
          done();
        });
    });
    
    test('Update an issue with a non-existent valid _id', function(done) {
      const nonExistentValidId = '60c72b2f9b1e8b001c8e4d9a'; // Un ObjectId valide mais inexistant
      chai.request(serverApp)
        .put(`/api/issues/${testProjectName}`)
        .send({ _id: nonExistentValidId, issue_title: 'Trying to update non-existent' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'could not update', '_id': nonExistentValidId });
          done();
        });
    });
  });

  suite('DELETE /api/issues/{project}', function() {
    test('Delete an issue', function(done) {
      chai.request(serverApp)
        .delete(`/api/issues/${testProjectName}`)
        .send({ _id: testIssueId2 })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { result: 'successfully deleted', '_id': testIssueId2 });
          Issue.findById(testIssueId2).then(issue => { // Vérification optionnelle en DB
            assert.isNull(issue);
            done();
          }).catch(done);
        });
    });

    test('Delete an issue with an invalid _id (format)', function(done) {
      const invalidId = 'invalididfordelete';
      chai.request(serverApp)
        .delete(`/api/issues/${testProjectName}`)
        .send({ _id: invalidId })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'could not delete', '_id': invalidId });
          done();
        });
    });

    test('Delete an issue with missing _id', function(done) {
      chai.request(serverApp)
        .delete(`/api/issues/${testProjectName}`)
        .send({}) // _id est manquant
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'missing _id' });
          done();
        });
    });

    test('Delete a non-existent issue with a valid _id format', function(done) {
      const nonExistentValidId = '60c72b2f9b1e8b001c8e4d9b'; // Un ObjectId valide mais inexistant
      chai.request(serverApp)
        .delete(`/api/issues/${testProjectName}`)
        .send({ _id: nonExistentValidId })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'could not delete', '_id': nonExistentValidId });
          done();
        });
    });
  });

  // SuiteTeardown pour nettoyer la base de données et fermer le serveur
  suiteTeardown(function(done) { // Ajout de 'done' pour la fermeture asynchrone du serveur
    console.log('Tearing down tests...');
    if (process.env.NODE_ENV === 'test') {
      Promise.all([ // Attendre que les deux opérations de suppression soient terminées
        Issue.deleteMany({ project_name: testProjectName }),
        Issue.deleteMany({ project_name: testProjectFiltersName })
      ]).then(() => {
        console.log('Test database cleaned up for specified projects after all tests.');
        if (serverInstance && serverInstance.listening) { // Vérifier si le serveur écoute toujours
          serverInstance.close((err) => {
            if (err) {
              console.error('Error closing server during teardown:', err);
            } else {
              console.log('Server closed successfully after tests.');
            }
            done(); // Appeler done une fois le serveur fermé (ou en cas d'erreur)
          });
        } else {
          console.log('Server was not listening or already closed.');
          done(); // Appeler done si le serveur n'a pas besoin d'être fermé
        }
      }).catch(err => {
        console.error('Error cleaning up test database:', err);
        done(err); // Passer l'erreur à done
      });
    } else {
      done(); // Si pas en mode test, appeler done directement
    }
  });
});