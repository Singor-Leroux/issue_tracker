// test-runner.js
'use strict';
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('./server');
const runner = {
  run: function() {
    const tests = [];
    let error;
    let failures = 0;
    let i = 0;
    const testDir = './tests';
    
    // Configure chai
    chai.use(chaiHttp);
    
    // Run each test file
    require('fs').readdirSync(testDir).filter(function(file) {
      return file.endsWith('.js');
    }).forEach(function(file) {
      const test = require(testDir + '/' + file);
      if (test) {
        tests.push(test);
      }
    });
    
    // Run tests
    function runNextTest() {
      if (i >= tests.length) {
        // All tests complete
        console.log('All tests completed');
        if (failures > 0) {
          console.log('Some tests failed');
          process.exit(1);
        } else {
          console.log('All tests passed!');
          process.exit(0);
        }
        return;
      }
      
      const currentTest = tests[i++];
      console.log('Running test suite: ' + currentTest.name);
      
      try {
        currentTest(function() {
          console.log('Test suite completed');
          runNextTest();
        });
      } catch (e) {
        console.error('Test error:', e);
        failures++;
        runNextTest();
      }
    }
    
    // Start running tests
    runNextTest();
  }
};

module.exports = runner;
