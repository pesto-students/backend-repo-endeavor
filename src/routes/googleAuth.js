const config = require('../config/config');
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { findOrCreateUser } = require('../services/user');

const router = express.Router();

// Endpoint to initiate Google login
router.get('/login/federated/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Endpoint for Google OAuth2 redirect
router.get('/oauth2/redirect/google', (req, res, next) => {
    passport.authenticate('google', async (err, user, info) => {
        if (err || !user) {
            // In case of failure, redirect to '/'
            return res.redirect(config.frontend_domain);
        }

        try {
            const userProfile = await findOrCreateUser(user);

            // Payload to be encoded into the token
            const payload = {
                id: user.sub,
                name: user.name
            };
            // Options for the token
            const options = {
                expiresIn: '1h', // Token expiration time (e.g., 1h, 2d)
            };
            // Generate JWT token
            const token = jwt.sign(payload, config.jwt_secret, options);

            // Encode user profile
            const encodedUserProfile = encodeURIComponent(JSON.stringify(userProfile));

            // Redirect to frontend with token and user profile
            return res.redirect(`${config.frontend_domain}${config.frontend_on_login_redirect_path}?token=${token}&user=${encodedUserProfile}`);
        } catch (error) {
            console.error('Error saving user:', error);
            return res.redirect(config.frontend_domain);
        }
    })(req, res, next);
});

module.exports = router;
