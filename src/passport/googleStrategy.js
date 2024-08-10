const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const config = require('../config/config');

// Configure Google OAuth2 Strategy
passport.use(new GoogleStrategy({
    clientID: config.google_client_id,
    clientSecret: config.google_client_secret,
    callbackURL: `${config.backend_domain}/api/v1/auth/oauth2/redirect/google`,
}, function verify(accessToken, refreshToken, profile, cb) {
    const user = {
        "name": profile._json.name,
        "mobile": null,
        "city": null,
        "email": profile._json.email,
        "image": profile._json.picture,
        "type": null
    }
    return cb(null, user);
})
);

module.exports = passport;
