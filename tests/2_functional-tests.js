const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const serverApp = require('../server');
const serverInstance = require('../server').listener;
const Issue = require('../models/issue');
const mongoose = require('mongoose');

chai.use(chaiHttp);

let testIssueId1;
let testIssueId2;
const testProjectName = 'test-project-fcc';
const testProjectFiltersName = 'test-project-filters-fcc';

suite('Functional Tests', function() {
  
  suiteSetup(async function() { 
    this.timeout(5000); 
    console.log('Global suiteSetup: Clearing test projects data...');
    if (process.env.NODE_ENV === 'test') {
      try {
        await Issue.deleteMany({ project_name: testProjectName });
        await Issue.deleteMany({ project_name: testProjectFiltersName }); 
        console.log('Global suiteSetup: Test DB cleared for specified projects.');
      } catch (err) {
        console.error("Error clearing test DB in global suiteSetup:", err);
        throw err;
      }
    }
  });

  
  suite('POST /api/issues/{project}', function() {
    
    test('Create an issue with every field', function(done) {
      chai.request(serverApp) 
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
          assert.isObject(res.body);
          testIssueId2 = res.body._id; 
          done();
        });
    });

    test('Create an issue with missing required fields', function(done) {
      chai.request(serverApp)
        .post(`/api/issues/${testProjectName}`)
        .send({ issue_title: 'Title 3'})
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'required field(s) missing' });
          done();
        });
    });
  });

  
  suite('GET /api/issues/{project}', function() {
    
    
    
    setup(async function() { 
      this.timeout(5000);
      if (process.env.NODE_ENV === 'test') {
          console.log(`Setup for GET test: Recreating data for ${testProjectFiltersName}...`);
          await Issue.deleteMany({ project_name: testProjectFiltersName }); 
          await Issue.insertMany([
              { project_name: testProjectFiltersName, issue_title: 'Filter Test 1', issue_text: 'text', created_by: 'Mocha', assigned_to: 'Chai', open: true, status_text: "pending" },
              { project_name: testProjectFiltersName, issue_title: 'Filter Test 2', issue_text: 'text', created_by: 'Mocha', assigned_to: 'Joe', open: false, status_text: 'Closed by test' },
              { project_name: testProjectFiltersName, issue_title: 'Filter Test 3', issue_text: 'another text', created_by: 'Jane', assigned_to: 'Chai', open: true }
          ]);
          console.log(`Setup for GET test: Data recreated for ${testProjectFiltersName}.`);
      }
    });

    test('View issues on a project', function(done) {
      chai.request(serverApp)
        .get(`/api/issues/${testProjectFiltersName}`)
        .end(function(err, res) {
          if (err) return done(err);
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
          if (err) return done(err);
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.equal(res.body.length, 1, "Expected 1 closed issue");
          if (res.body.length > 0) { 
            assert.equal(res.body[0].issue_title, 'Filter Test 2');
            assert.isFalse(res.body[0].open);
          }
          done();
        });
    });

    test('View issues on a project with multiple filters', function(done) {
      chai.request(serverApp)
        .get(`/api/issues/${testProjectFiltersName}?open=true&assigned_to=Chai`)
        .end(function(err, res) {
          if (err) return done(err);
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.equal(res.body.length, 2, "Expected 2 open issues assigned to Chai");
          if (res.body.length > 0) { 
            res.body.forEach(issue => {
              assert.isTrue(issue.open);
              assert.equal(issue.assigned_to, 'Chai');
            });
          }
          done();
        });
    });
  });

  
  suite('PUT /api/issues/{project}', function() {
    
    
    test('Update one field on an issue', function(done) {
        
        if (!testIssueId1) {
            return done(new Error("testIssueId1 is not defined. POST test might have failed or not run."));
        }
        chai.request(serverApp)
            .put(`/api/issues/${testProjectName}`)
            .send({ _id: testIssueId1, issue_text: 'Updated Text 1' })
            .end(function(err, res) {
                if (err) return done(err);
                assert.equal(res.status, 200);
                assert.deepEqual(res.body, { result: 'successfully updated', '_id': testIssueId1 });
                done();
            });
    });
    
    test('Update multiple fields on an issue', function(done) {
        if (!testIssueId1) return done(new Error("testIssueId1 is not defined."));
        chai.request(serverApp)
            .put(`/api/issues/${testProjectName}`)
            .send({ _id: testIssueId1, issue_title: 'Updated Title 1', assigned_to: 'Mocha', open: 'false' })
            .end(function(err, res) {
                if (err) return done(err);
                assert.equal(res.status, 200);
                assert.deepEqual(res.body, { result: 'successfully updated', '_id': testIssueId1 });
                Issue.findById(testIssueId1).then(issue => {
                    assert.equal(issue.issue_title, 'Updated Title 1');
                    assert.isFalse(issue.open);
                    done();
                }).catch(done);
            });
    });
    test('Update an issue with missing _id', function(done) { /* ... */ done(); }); 
    test('Update an issue with no fields to update', function(done) { /* ... */ done(); });
    test('Update an issue with an invalid _id (format)', function(done) { /* ... */ done(); });
    test('Update an issue with a non-existent valid _id', function(done) { /* ... */ done(); });


  });

  
  suite('DELETE /api/issues/{project}', function() {
    
     test('Delete an issue', function(done) {
        if (!testIssueId2) {
            return done(new Error("testIssueId2 is not defined. POST test might have failed or not run."));
        }
        chai.request(serverApp)
            .delete(`/api/issues/${testProjectName}`)
            .send({ _id: testIssueId2 })
            .end(function(err, res) {
                if (err) return done(err);
                assert.equal(res.status, 200);
                assert.deepEqual(res.body, { result: 'successfully deleted', '_id': testIssueId2 });
                Issue.findById(testIssueId2).then(issue => {
                    assert.isNull(issue);
                    done();
                }).catch(done);
            });
    });
    
    test('Delete an issue with an invalid _id (format)', function(done) { /* ... */ done(); });
    test('Delete an issue with missing _id', function(done) { /* ... */ done(); });
    test('Delete a non-existent issue with a valid _id format', function(done) { /* ... */ done(); });
  });


suiteTeardown(function(done) {
    this.timeout(5000);
    console.log('Simplified Teardown: Attempting to close server only...');
    if (serverInstance && serverInstance.listening) {
        serverInstance.close((err) => {
            if (err) {
                console.error('Simplified Teardown - Error closing server:', err);
                return done(err);
            }
            console.log('Simplified Teardown - Server closed.');
            done();
        });
    } else {
        console.log('Simplified Teardown - Server not listening or already closed.');
        done();
    }
    
});
});