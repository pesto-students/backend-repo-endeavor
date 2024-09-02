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
    const accessToken = generateToken(userProfile, '15m');

    // Set the access token as an HTTP-only cookie
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: config.node_env === 'production', // Use 'secure' flag only in production
        maxAge: 15 * 60 * 1000 // 15 minutes in milliseconds
    });

    const refreshToken = generateToken(userProfile, '2d');

    // Set the refresh token as an HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: config.node_env === 'production', // Use 'secure' flag only in production
        maxAge: 2 * 24 * 60 * 60 * 1000 // 2 days in milliseconds
    });

    // Generate new token for the user
    const token = new Token({
        user_id: userProfile._id,
        token: refreshToken,
        type: 'refreshToken'
    });
    await token.save();
}

const clearClientCookies = (res) => {
    // Clear the cookies from server end
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
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
    validateRefreshToken
};
