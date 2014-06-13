/**
 * Module dependencies.
 */
var util = require('util')
  , OAuth2Strategy = require('passport-oauth').OAuth2Strategy
  , InternalOAuthError = require('passport-oauth').InternalOAuthError;


/**
 * `Strategy` constructor.
 *
 * The openpaas authentication strategy authenticates requests by delegating to
 * openpaas using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your openpaas application's Client ID
 *   - `clientSecret`  your openpaas application's Client Secret
 *   - `callbackURL`   URL to which openpaas will redirect the user after granting authorization
 *   - `scope`         array of permission scopes to request.
 *
 * Examples:
 *
 *     passport.use(new OpenPaaSStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/openpaas/callback'
 *       },
 *       function(accessToken, refreshToken, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'http://openpaas.io/oauth/authorize';
  options.tokenURL = options.tokenURL || 'http://openpaas.io/oauth/access_token';
  options.profileURL = options.profileURL || 'http://openpaas.io/api/user';
  options.scopeSeparator = options.scopeSeparator || ',';
  
  OAuth2Strategy.call(this, options, verify);
  this.name = 'openpaas';
  this.options = options;
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);


/**
 * Retrieve user profile from OpenPaaS ESN.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `openpaas`
 *   - `id`               the user's ID
 *   - `username`         the user's username
 *   - `displayName`      the user's full name
 *   - `emails`           the user's email addresses
 *
 * @param {String} accessToken
 * @param {Function} done
 * @api protected
 */
Strategy.prototype.userProfile = function(accessToken, done) {
  
  // issue here, _oauth2.get sets the access_token as bearer token in both the request and as HTTP Header
  // the RFC specifies that the client MUST use only the token in one place
  // the passport-bearer module on the server send back an error!
  // use getProtectedResource which does not add the header
  this._oauth2.getProtectedResource(this.options.profileURL, accessToken, function (err, body, res) {
    if (err) { return done(new InternalOAuthError('failed to fetch user profile from OpenPaaS', err)); }
    
    try {
      var json = JSON.parse(body);
      var profile = { provider: 'openpaas' };
      profile.id = json._id;
      profile.displayName = (json.firstname || '') + ' ' + (json.lastname || '');
      profile.username = json.emails[0];
      profile.emails = [];
      json.emails.forEach(function(item) {
        profile.emails.push({value: item});
      });
      profile._raw = body;
      profile._json = json;
      done(null, profile);
    } catch(e) {
      done(e);
    }
  });
}


/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
