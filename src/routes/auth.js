const config = require('../config/config');
var express = require('express');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oidc');

passport.use(new GoogleStrategy({
    clientID: config.google_client_id,
    clientSecret: config.google_client_secret,
    callbackURL: `${config.backend_domain}api/v1/auth/oauth2/redirect/google`,
    scope: ['profile']
}, function verify(issuer, profile, cb) {
    return cb(null, profile);
}));

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, { id: user.id, username: user.username, name: user.name });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

var router = express.Router();

router.get('/login/federated/google', passport.authenticate('google'));

router.get('/oauth2/redirect/google', (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
        if (err || !user) {
            // In case of failure, redirect to '/'
            return res.redirect(config.frontend_domain);
        }
        req.logIn(user, (err) => {
            if (err) {
                return res.redirect(config.frontend_domain);
            }
            // In case of success, redirect to '/dashboard'
            return res.redirect(`${config.frontend_domain}dashboard`);
        });
    })(req, res, next);
});

router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).send('Logout failed');
        }
        return res.status(200).send('Logout failed'); // Redirect to the desired page after logout
    });
});

module.exports = router;
