const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let id1 = "";
let id2 = "";

suite('Functional Tests', function() {
  suite("POST /api/issues/{project} => object with issue data", function() {
    test("Every field filled in", function(done) {
      chai
        .request(server)
        .post("/api/issues/test")
        .send({
          issue_title: "Title",
          issue_text: "text",
          created_by: "Functional Test - Every field filled in",
          assigned_to: "Chai and Mocha",
          status_text: "In QA"
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, "Title");
          assert.equal(res.body.issue_text, "text");
          assert.equal(
            res.body.created_by,
            "Functional Test - Every field filled in"
          );
          assert.equal(res.body.assigned_to, "Chai and Mocha");
          assert.equal(res.body.status_text, "In QA");
          assert.equal(res.body.project, "test");
          id1 = res.body._id;
          console.log("id 1 has been set as " + id1);
          done();
        });
    });

    test("Required fields filled in", function(done) {
      chai
        .request(server)
        .post("/api/issues/test")
        .send({
          issue_title: "Title 2",
          issue_text: "text",
          created_by: "Functional Test - Every field filled in"
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, "Title 2");
          assert.equal(res.body.issue_text, "text");
          assert.equal(
            res.body.created_by,
            "Functional Test - Every field filled in"
          );
          assert.equal(res.body.assigned_to, "");
          assert.equal(res.body.status_text, "");
          assert.equal(res.body.project, "test");
          id2 = res.body._id;
          console.log("id 2 has been set as " + id2);
          done();
        })
    });

    test("Missing required fields", function(done) {
      chai
        .request(server)
        .post("/api/issues/test")
        .send({
          issue_title: "Title"
        })
        .end(function(err, res) {
          assert.equal(res.body.error, "required field(s) missing");
          done();
        });
    });
  })

  suite("PUT /api/issues/{project} => text", function() {
    test("missing _id", function(done) {
      chai
        .request(server)
        .put("/api/issues/test")
        .send({})
        .end(function(err, res) {
          assert.equal(res.body.error, "missing _id");
          done();
        });
    });

    test("no fields to update", function(done) {
      chai
        .request(server)
        .put("/api/issues/test")
        .send({
          _id: id1
        })
        .end(function(err, res) {
          assert.equal(res.body.error, "no update field(s) sent");
          done();
        });
    });

    test("One field to update", function(done) {
      chai
        .request(server)
        .put("/api/issues/test")
        .send({
          _id: id1,
          issue_text: "new text"
        })
        .end(function(err, res) {
          assert.equal(res.body.result, "successfully updated");
          done();
        });
    });

    test("Multiple fields to update", function(done) {
      chai
        .request(server)
        .put("/api/issues/test")
        .send({
          _id: id2,
          issue_title: "new title",
          issue_text: "new text"
        })
        .end(function(err, res) {
          assert.equal(res.body.result, "successfully updated");
          done();
        });
    });

    test("invalid _id", function(done) {
      chai
        .request(server)
        .put("/api/issues/test")
        .send({
          _id: "9137993956",
          issue_text: "new text"
        })
        .end(function(err, res) {
          assert.equal(res.body.error, "could not update");
          done();
        });
    });

  });

  suite(
    "GET /api/issues/{project} => Array of objects with issue data",
    function() {
      test("No filter", function(done) {
        chai
          .request(server)
          .get("/api/issues/test")
          .query({})
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.property(res.body[0], "issue_title");
            assert.property(res.body[0], "issue_text");
            assert.property(res.body[0], "created_on");
            assert.property(res.body[0], "updated_on");
            assert.property(res.body[0], "created_by");
            assert.property(res.body[0], "assigned_to");
            assert.property(res.body[0], "open");
            assert.property(res.body[0], "status_text");
            assert.property(res.body[0], "_id");
            done();
          });
      });

      test("One filter", function(done) {
        chai
          .request(server)
          .get("/api/issues/test")
          .query({ created_by: "Functional Test - Every field filled in" })
          .end(function(err, res) {
            res.body.forEach(issueResult => {
              assert.equal(
                issueResult.created_by,
                "Functional Test - Every field filled in"
              );
            });
            done();
          });
      });

      test("Multiple filters (test for multiple fields you know will be in the db for a return)", function(done) {
        chai
          .request(server)
          .get("/api/issues/test")
          .query({
            open: true,
            created_by: "Functional Test - Every field filled in"
          })
          .end(function(err, res) {
            res.body.forEach(issueResult => {
              assert.equal(issueResult.open, true);
              assert.equal(
                issueResult.created_by,
                "Functional Test - Every field filled in"
              );
            });
            done();
          });
      });
    }
  );

  suite("DELETE /api/issues/{project} => text", function() {
    test("missing _id", function(done) {
      chai
        .request(server)
        .delete("/api/issues/test")
        .send({})
        .end(function(err, res) {
          assert.equal(res.body.error, "missing _id");
          done();
        });
    });

    test("invalid _id", function(done) {
      chai
        .request(server)
        .delete("/api/issues/test")
        .send({
          _id: "9137993956"
        })
        .end(function(err, res) {
          assert.equal(res.body.error, "could not delete");
          done();
        });
    });

    test("Valid _id", function(done) {
      chai
        .request(server)
        .delete("/api/issues/test")
        .send({
          _id: id1
        })
        .end(function(err, res) {
          assert.equal(res.body.result, "successfully deleted");
        });
      chai
        .request(server)
        .delete("/api/issues/test")
        .send({
          _id: id2
        })
        .end(function(err, res) {
          assert.equal(res.body.result, "successfully deleted");
          done();
        });
    });
  });
});