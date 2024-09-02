const express = require('express');
const Token = require('../models/Token');
const { clearClientCookies, addTokens, validateRefreshToken } = require('../services/token');

const router = express.Router();

// Endpoint for logout
router.post('/logout', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    const [validationResult, user_id, userProfile] = await validateRefreshToken(refreshToken);

    if (!validationResult) {
        clearClientCookies(res);
        return res.status(400).json({ error: 'Invalid or expired refresh token' });
    }

    try {
        await Token.findOneAndDelete({ user_id, token: refreshToken });

        clearClientCookies(res);
        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ error: 'An error occurred during logout' });
    }
});

// New endpoint for token refresh
router.post('/refresh-token', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    const [validationResult, user_id, userProfile] = await validateRefreshToken(refreshToken);

    if (!validationResult) {
        clearClientCookies(res);
        return res.status(400).json({ error: 'Invalid or expired refresh token' });
    }

    try {
        const result = await Token.findOneAndDelete({ user_id, token: refreshToken });

        if (!result) {
            clearClientCookies(res);
            return res.status(400).json({ error: 'Invalid refresh token or user id' });
        }

        await addTokens(res, userProfile);

        // Respond with a success message
        return res.status(200).json({ message: 'Token refreshed successfully' });
    } catch (error) {
        console.error('Error during token refresh:', error);
        return res.status(500).json({ error: 'An error occurred during token refresh' });
    }
});

module.exports = router;
