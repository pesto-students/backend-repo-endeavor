const express = require('express');
const authenticateJWT = require('../middleware/authenticateJWT');

const router = express.Router();

// Endpoint for logout
router.post('/logout', authenticateJWT, (req, res) => {
    return res.status(200).json({ message: 'Logout Successful' });
});

module.exports = router;
