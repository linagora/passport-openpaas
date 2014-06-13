var vows = require('vows');
var assert = require('assert');
var util = require('util');
var openpaas = require('passport-openpaas');


vows.describe('passport-openpaas').addBatch({
  
  'module': {
    'should report a version': function (x) {
      assert.isString(openpaas.version);
    }
  }
  
}).export(module);
