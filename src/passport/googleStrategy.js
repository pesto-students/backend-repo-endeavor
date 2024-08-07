const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const config = require('../config/config');

// Configure Google OAuth2 Strategy
passport.use(new GoogleStrategy({
    clientID: config.google_client_id,
    clientSecret: config.google_client_secret,
    callbackURL: `${config.backend_domain}/api/v1/auth/oauth2/redirect/google`,
}, function verify(accessToken, refreshToken, profile, cb) {
    const user = profile._json
    return cb(null, user);
})
);

module.exports = passport;
