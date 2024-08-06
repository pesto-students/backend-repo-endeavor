const config = require('../config/config');
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: config.google_client_id,
    clientSecret: config.google_client_secret,
    callbackURL: `${config.backend_domain}api/v1/auth/oauth2/redirect/google`,
}, function verify(accessToken, refreshToken, profile, cb) {
    const user = profile._json
    return cb(null, user);
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

router.get('/login/federated/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

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
        req.session.destroy(); // Destroy session on logout
        return res.status(200).send('Logout Successful'); // Redirect to the desired page after logout
    });
});

module.exports = router;
