// tests/2_functional-tests.js
const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server'); // Your app's server

chai.use(chaiHttp);

let testIssueId1;
let testIssueId2;
const testProject = 'apitest'; // Use a consistent project for tests

suite('Functional Tests', function() {

  suite('POST /api/issues/{project}', function() {
    
    test('Create an issue with every field', function(done) {
     chai.request(server)
      .post(`/api/issues/${testProject}`)
      .send({
        issue_title: 'Title 1',
        issue_text: 'text',
        created_by: 'Functional Test - Every field',
        assigned_to: 'Chai and Mocha',
        status_text: 'In QA'
      })
      .end(function(err, res){
        assert.equal(res.status, 200);
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
        assert.equal(res.body.issue_text, 'text');
        assert.equal(res.body.created_by, 'Functional Test - Every field');
        assert.equal(res.body.assigned_to, 'Chai and Mocha');
        assert.equal(res.body.status_text, 'In QA');
        assert.isTrue(res.body.open);
        testIssueId1 = res.body._id; // Save for later tests
        done();
      });
    });
    
    test('Create an issue with only required fields', function(done) {
      chai.request(server)
      .post(`/api/issues/${testProject}`)
      .send({
        issue_title: 'Title 2',
        issue_text: 'text',
        created_by: 'Functional Test - Required fields'
      })
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.body.issue_title, 'Title 2');
        assert.equal(res.body.issue_text, 'text');
        assert.equal(res.body.created_by, 'Functional Test - Required fields');
        assert.equal(res.body.assigned_to, '');
        assert.equal(res.body.status_text, '');
        assert.isTrue(res.body.open);
        testIssueId2 = res.body._id; // Save for later tests
        done();
      });
    });
    
    test('Create an issue with missing required fields', function(done) {
      chai.request(server)
      .post(`/api/issues/${testProject}`)
      .send({
        issue_title: 'Title 3'
        // Missing issue_text and created_by
      })
      .end(function(err, res){
        assert.equal(res.status, 200); // Server should respond with 200 even for app errors
        assert.deepEqual(res.body, { error: 'required field(s) missing' });
        done();
      });
    });
    
  });

  suite('GET /api/issues/{project}', function() {
    
    test('View issues on a project', function(done) {
      chai.request(server)
      .get(`/api/issues/${testProject}`)
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.operator(res.body.length, '>=', 2); // At least the two created above
        done();
      });
    });
    
    test('View issues on a project with one filter', function(done) {
      chai.request(server)
      .get(`/api/issues/${testProject}?open=true`)
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        res.body.forEach(issue => {
          assert.isTrue(issue.open);
        });
        done();
      });
    });
    
    test('View issues on a project with multiple filters', function(done) {
      chai.request(server)
      .get(`/api/issues/${testProject}?open=true&created_by=Functional Test - Every field`)
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        res.body.forEach(issue => {
          assert.isTrue(issue.open);
          assert.equal(issue.created_by, 'Functional Test - Every field');
        });
        done();
      });
    });
    
  });

  suite('PUT /api/issues/{project}', function() {
    
    test('Update one field on an issue', function(done) {
      chai.request(server)
      .put(`/api/issues/${testProject}`)
      .send({
        _id: testIssueId1,
        issue_text: 'Updated text for testIssueId1'
      })
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: 'successfully updated', '_id': testIssueId1 });
        done();
      });
    });
    
    test('Update multiple fields on an issue', function(done) {
      chai.request(server)
      .put(`/api/issues/${testProject}`)
      .send({
        _id: testIssueId2,
        issue_title: 'Updated Title 2',
        assigned_to: 'Tester X',
        open: 'false' // Send as string, API should handle conversion
      })
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: 'successfully updated', '_id': testIssueId2 });
        
        // Verify update
        chai.request(server)
          .get(`/api/issues/${testProject}?_id=${testIssueId2}`)
          .end(function(err, getRes) {
            assert.equal(getRes.body[0].issue_title, 'Updated Title 2');
            assert.equal(getRes.body[0].assigned_to, 'Tester X');
            assert.isFalse(getRes.body[0].open);
            done();
          });
      });
    });
    
    test('Update an issue with missing _id', function(done) {
      chai.request(server)
      .put(`/api/issues/${testProject}`)
      .send({
        issue_title: 'No ID update'
      })
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'missing _id' });
        done();
      });
    });
    
    test('Update an issue with no fields to update', function(done) {
      chai.request(server)
      .put(`/api/issues/${testProject}`)
      .send({
        _id: testIssueId1
        // No other fields
      })
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'no update field(s) sent', '_id': testIssueId1 });
        done();
      });
    });
    
    test('Update an issue with an invalid _id', function(done) {
      const invalidId = 'invalid123id';
      chai.request(server)
      .put(`/api/issues/${testProject}`)
      .send({
        _id: invalidId,
        issue_title: 'Update with invalid ID'
      })
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'could not update', '_id': invalidId });
        done();
      });
    });
    
  });

  suite('DELETE /api/issues/{project}', function() {
    
    test('Delete an issue', function(done) {
      chai.request(server)
      .delete(`/api/issues/${testProject}`)
      .send({
        _id: testIssueId1
      })
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: 'successfully deleted', '_id': testIssueId1 });
        done();
      });
    });
    
    test('Delete an issue with an invalid _id', function(done) {
      const invalidId = 'invalid123idfordelete';
      chai.request(server)
      .delete(`/api/issues/${testProject}`)
      .send({
        _id: invalidId
      })
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'could not delete', '_id': invalidId });
        done();
      });
    });
    
    test('Delete an issue with missing _id', function(done) {
      chai.request(server)
      .delete(`/api/issues/${testProject}`)
      .send({
        // Missing _id
      })
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'missing _id' });
        done();
      });
    });

    // Cleanup: Delete the second test issue
    teardown(function(done) {
      chai.request(server)
        .delete(`/api/issues/${testProject}`)
        .send({ _id: testIssueId2 })
        .end(function() {
          done(); // Don't care about the result, just cleaning up
        });
    });
    
  });

});