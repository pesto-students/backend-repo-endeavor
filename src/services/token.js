const jwt = require('jsonwebtoken');
const config = require('../config/config');
const Token = require('../models/Token');
const User = require('../models/User');

// Function to generate JWT token
const generateToken = (user, exp) => {
    const payload = {
        _id: user._id,
        name: user.name
    };
    const options = {
        expiresIn: exp,
    };
    return jwt.sign(payload, config.jwt_secret, options);
}

const addTokens = async (res, userProfile) => {
    // Generate JWT token
    const accessToken = generateToken(userProfile, config.access_token_expiry);
    const refreshToken = generateToken(userProfile, config.refresh_token_expiry);

    // Set Cookie if available
    if (config.isCookieOptionsValid) { 
        addClientCookies(res, 'accessToken', accessToken, config.cookie_options_access_token);
        addClientCookies(res, 'refreshToken', refreshToken, config.cookie_options_refresh_token);
    }

    // Generate new token for the user
    const token = new Token({
        user_id: userProfile._id,
        token: refreshToken,
        type: 'refreshToken'
    });
    await token.save();

    return [accessToken, refreshToken];
}

const addClientCookies = (res, key, value, options) => {
    const cookie_options = JSON.parse(options);
    res.cookie(key, value, cookie_options);
}

const clearClientCookies = (res) => {
    if (config.isCookieOptionsValid) {
        // Clear the cookies from server end
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
    }
}

const getAccessAndRefreshToken = (req) => {
    if (config.isCookieOptionsValid) {
        let accessToken = req.cookies.accessToken;
        let refreshToken = req.cookies.refreshToken;
        return [accessToken, refreshToken];
    } else {
        let authHeader = req.headers.authorization;
        let accessToken = null;
        if (authHeader) {
            // Extract the token from the header (Assumes 'Bearer <token>')
            accessToken = authHeader.split(' ')[1];
        }

        let refreshToken = req.headers['refresh-token'];
        return [accessToken, refreshToken];
    }
}

const validateRefreshToken = async (refreshToken) => {
    if (!refreshToken) {
        return [false, null, null];
    }

    let user_id = null;
    let userProfile = null;
    
    // Verify refreshToken
    try {
        const decoded = jwt.verify(refreshToken, config.jwt_secret);
        user_id = decoded._id;
        userProfile = await User.findById(user_id);
        if (!user_id || !userProfile) {
            return [false, null, null];
        }
    } catch (error) {
        return [false, null, null];
    }

    return [true, user_id, userProfile];
}

module.exports = {
    generateToken,
    clearClientCookies,
    addTokens,
    getAccessAndRefreshToken,
    validateRefreshToken
};
