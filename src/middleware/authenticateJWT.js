const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { clearClientCookies } = require('../services/token');

// Middleware to verify JWT token
const authenticateJWT = (req, res, next) => {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    // Scenario 1: Both Tokens Missing
    if ((!accessToken && !refreshToken)) {
        clearClientCookies(res);
        return res.status(400).json({ error: 'Session expired, please log in again.' });
    }

    // Scenario 2: Bad request -> accessToken is present but refreshToken is not
    if (accessToken && !refreshToken) {
        clearClientCookies(res);
        return res.status(400).json({ error: 'Bad request: Refresh token is required.' });
    }

    // Scenario 3: Validate refreshToken
    try {
        const decoded = jwt.verify(refreshToken, config.jwt_secret);
    } catch (error) {
        clearClientCookies(res);
        return res.status(400).json({ error: 'Invalid or expired refresh token.' });
    }

    // Scenario 4: accessToken is not present
    if (!accessToken) {
        return res.status(403).json({ error: 'Access token is missing' });
    }

    // Scenario 5: Validate accessToken
    try {
        const decoded = jwt.verify(accessToken, config.jwt_secret);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Access token expired', tokenExpired: true });
        }
        clearClientCookies(res);
        return res.status(400).json({ error: 'Invalid access token.' });
    }
}

module.exports = authenticateJWT;