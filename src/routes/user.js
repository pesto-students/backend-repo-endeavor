const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Endpoint to update user information using email
router.post('/update', async (req, res) => {
    const { email, mobile, city, type } = req.body;

    try {
        // Find user by email and update details
        const updatedUser = await User.findOneAndUpdate(
            { email },
            { $set: { mobile, city, type } },
            {
              new: true, // Return the updated document
              fields: { name: 1, mobile: 1, city: 1, email: 1, image: 1, type: 1 }, // Specify fields to include
            }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
