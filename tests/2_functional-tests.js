const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server'); // Assurez-vous que server.js exporte l'app
const Issue = require('../models/issue'); // Pour nettoyer la DB

chai.use(chaiHttp);

let testIssueId1; // Pour stocker l'_id d'un ticket créé pour les tests PUT/DELETE
let testIssueId2;

suite('Functional Tests', function() {
  
  // Nettoyer la base de données de test avant et après les tests
  // Cela assure que les tests sont idempotents
  suiteSetup(async function() {
    if (process.env.NODE_ENV === 'test') {
      await Issue.deleteMany({ project_name: 'test-project' });
      await Issue.deleteMany({ project_name: 'test-project-filters' });
    }
  });

  suiteTeardown(async function() {
    if (process.env.NODE_ENV === 'test') {
      await Issue.deleteMany({ project_name: 'test-project' });
      await Issue.deleteMany({ project_name: 'test-project-filters' });
    }
  });


  suite('POST /api/issues/{project}', function() {
    test('Create an issue with every field', function(done) {
      chai.request(server)
        .post('/api/issues/test-project')
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
          assert.property(res.body, 'issue_title');
          assert.property(res.body, 'issue_text');
          assert.property(res.body, 'created_by');
          assert.property(res.body, 'assigned_to');
          assert.property(res.body, 'status_text');
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'updated_on');
          assert.property(res.body, 'open');
          assert.property(res.body, '_id');
          assert.equal(res.body.issue_title, 'Title 1');
          assert.equal(res.body.issue_text, 'Text 1');
          assert.equal(res.body.created_by, 'Functional Test - Every field');
          assert.equal(res.body.assigned_to, 'Chai');
          assert.equal(res.body.status_text, 'In QA');
          assert.isTrue(res.body.open);
          testIssueId1 = res.body._id; // Sauvegarder pour les tests suivants
          done();
        });
    });

    test('Create an issue with only required fields', function(done) {
      chai.request(server)
        .post('/api/issues/test-project')
        .send({
          issue_title: 'Title 2',
          issue_text: 'Text 2',
          created_by: 'Functional Test - Required fields'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.equal(res.body.issue_title, 'Title 2');
          assert.equal(res.body.issue_text, 'Text 2');
          assert.equal(res.body.created_by, 'Functional Test - Required fields');
          assert.equal(res.body.assigned_to, '');
          assert.equal(res.body.status_text, '');
          assert.isTrue(res.body.open);
          testIssueId2 = res.body._id; // Sauvegarder pour les tests suivants
          done();
        });
    });

    test('Create an issue with missing required fields', function(done) {
      chai.request(server)
        .post('/api/issues/test-project')
        .send({
          issue_title: 'Title 3'
          // issue_text and created_by are missing
        })
        .end(function(err, res) {
          assert.equal(res.status, 200); // L'API retourne 200 avec un objet d'erreur
          assert.deepEqual(res.body, { error: 'required field(s) missing' });
          done();
        });
    });
  });

  suite('GET /api/issues/{project}', function() {
    // Créer quelques tickets pour les tests de filtre
    suiteSetup(async function() {
        if (process.env.NODE_ENV === 'test') {
            await Issue.insertMany([
                { project_name: 'test-project-filters', issue_title: 'Filter Test 1', issue_text: 'text', created_by: 'Mocha', assigned_to: 'Chai', open: true },
                { project_name: 'test-project-filters', issue_title: 'Filter Test 2', issue_text: 'text', created_by: 'Mocha', assigned_to: 'Joe', open: false, status_text: 'Closed by test' },
                { project_name: 'test-project-filters', issue_title: 'Filter Test 3', issue_text: 'another text', created_by: 'Jane', assigned_to: 'Chai', open: true }
            ]);
        }
    });


    test('View issues on a project', function(done) {
      chai.request(server)
        .get('/api/issues/test-project-filters')
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.isAbove(res.body.length, 2, 'Should have at least 3 issues for test-project-filters');
          res.body.forEach(issue => {
            assert.property(issue, 'issue_title');
            assert.property(issue, 'issue_text');
            // ... autres vérifications de propriétés
          });
          done();
        });
    });

    test('View issues on a project with one filter', function(done) {
      chai.request(server)
        .get('/api/issues/test-project-filters?open=false')
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.equal(res.body.length, 1); // Un seul ticket doit être fermé
          assert.equal(res.body[0].issue_title, 'Filter Test 2');
          assert.isFalse(res.body[0].open);
          done();
        });
    });

    test('View issues on a project with multiple filters', function(done) {
      chai.request(server)
        .get('/api/issues/test-project-filters?open=true&assigned_to=Chai')
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.equal(res.body.length, 2); // Deux tickets ouverts assignés à Chai
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
      chai.request(server)
        .put('/api/issues/test-project')
        .send({
          _id: testIssueId1,
          issue_text: 'Updated Text 1'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { result: 'successfully updated', '_id': testIssueId1 });
          // Vérifier en base de données (optionnel mais bon pour la robustesse)
          Issue.findById(testIssueId1).then(issue => {
            assert.equal(issue.issue_text, 'Updated Text 1');
            done();
          }).catch(done);
        });
    });

    test('Update multiple fields on an issue', function(done) {
      chai.request(server)
        .put('/api/issues/test-project')
        .send({
          _id: testIssueId1,
          issue_title: 'Updated Title 1',
          assigned_to: 'Mocha',
          open: 'false' // Envoyé comme chaîne, sera converti en booléen
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { result: 'successfully updated', '_id': testIssueId1 });
          Issue.findById(testIssueId1).then(issue => {
            assert.equal(issue.issue_title, 'Updated Title 1');
            assert.equal(issue.assigned_to, 'Mocha');
            assert.isFalse(issue.open);
            done();
          }).catch(done);
        });
    });

    test('Update an issue with missing _id', function(done) {
      chai.request(server)
        .put('/api/issues/test-project')
        .send({
          issue_title: 'This will fail'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'missing _id' });
          done();
        });
    });

    test('Update an issue with no fields to update', function(done) {
      chai.request(server)
        .put('/api/issues/test-project')
        .send({
          _id: testIssueId1
          // Pas d'autres champs
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'no update field(s) sent', '_id': testIssueId1 });
          done();
        });
    });

    test('Update an issue with an invalid _id', function(done) {
      const invalidId = 'invalidid123';
      chai.request(server)
        .put('/api/issues/test-project')
        .send({
          _id: invalidId,
          issue_title: 'This will also fail'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'could not update', '_id': invalidId });
          done();
        });
    });

     test('Update an issue with a non-existent valid _id', function(done) {
      const nonExistentValidId = '60c72b2f9b1e8b001c8e4d9a'; // Un ObjectId valide mais probablement inexistant
      chai.request(server)
        .put('/api/issues/test-project')
        .send({
          _id: nonExistentValidId,
          issue_title: 'Trying to update non-existent'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'could not update', '_id': nonExistentValidId });
          done();
        });
    });
  });

  suite('DELETE /api/issues/{project}', function() {
    test('Delete an issue', function(done) {
      chai.request(server)
        .delete('/api/issues/test-project')
        .send({
          _id: testIssueId2 
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { result: 'successfully deleted', '_id': testIssueId2 });
          // Vérifier qu'il est bien supprimé
          Issue.findById(testIssueId2).then(issue => {
            assert.isNull(issue);
            done();
          }).catch(done);
        });
    });

    test('Delete an issue with an invalid _id', function(done) {
      const invalidId = 'invalididfordelete';
      chai.request(server)
        .delete('/api/issues/test-project')
        .send({
          _id: invalidId
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'could not delete', '_id': invalidId });
          done();
        });
    });

    test('Delete an issue with missing _id', function(done) {
      chai.request(server)
        .delete('/api/issues/test-project')
        .send({
          // _id est manquant
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'missing _id' });
          done();
        });
    });

    test('Delete a non-existent issue with a valid _id format', function(done) {
      const nonExistentValidId = '60c72b2f9b1e8b001c8e4d9b'; // Un ObjectId valide mais probablement inexistant
      chai.request(server)
        .delete('/api/issues/test-project')
        .send({
          _id: nonExistentValidId
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'could not delete', '_id': nonExistentValidId });
          done();
        });
    });
  });
});