var vows = require('vows');
var assert = require('assert');
var OpenPaaSStrategy = require('../lib/passport-openpaas/strategy');


vows.describe('OpenPaaSStrategy').addBatch({
  
  'strategy': {
    topic: function() {
      return new OpenPaaSStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});
    },
    
    'should be named openpaas': function (strategy) {
      assert.equal(strategy.name, 'openpaas');
    }
  },
  
  'strategy when loading user profile': {
    topic: function() {
      var strategy = new OpenPaaSStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});
      
      strategy._oauth2.getProtectedResource = function(url, accessToken, callback) {
        var body = '{ "_id": "123", "firstname": "foo", "lastname": "bar", "emails": ["foo@bar.com"] }';
        
        callback(null, body, undefined);
      };
      
      return strategy;
    },
    
    'when told to load user profile': {
      topic: function(strategy) {
        var self = this;
        function done(err, profile) {
          self.callback(err, profile);
        }
        
        process.nextTick(function () {
          strategy.userProfile('access-token', done);
        });
      },
      
      'should not error' : function(err, req) {
        assert.isNull(err);
      },
      'should load profile' : function(err, profile) {
        assert.equal(profile.provider, 'openpaas');
        assert.equal(profile.id, '123');
        assert.equal(profile.username, 'foo@bar.com');
        assert.equal(profile.displayName, 'foo bar');
      },
      'should set raw property' : function(err, profile) {
        assert.isString(profile._raw);
      },
      'should set json property' : function(err, profile) {
        assert.isObject(profile._json);
      }
    }
  },
  
  'strategy when loading user profile and encountering an error': {
    topic: function() {
      var strategy = new OpenPaaSStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});
      
      // mock
      strategy._oauth2.getProtectedResource = function(url, accessToken, callback) {
        callback(new Error('something-went-wrong'));
      };
      
      return strategy;
    },
    
    'when told to load user profile': {
      topic: function(strategy) {
        var self = this;
        function done(err, profile) {
          self.callback(err, profile);
        }
        
        process.nextTick(function () {
          strategy.userProfile('access-token', done);
        });
      },
      
      'should error' : function(err, req) {
        assert.isNotNull(err);
      },
      'should wrap error in InternalOAuthError' : function(err, req) {
        assert.equal(err.constructor.name, 'InternalOAuthError');
      },
      'should not load profile' : function(err, profile) {
        assert.isUndefined(profile);
      }
    }
  }
  
}).export(module);
