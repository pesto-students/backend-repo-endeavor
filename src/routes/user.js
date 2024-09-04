const express = require('express');
const router = express.Router();
const User = require("../models/User");
const { projection } = require('../services/user');

// Read User
router.post('/search/:id', async (req, res) => {
    try {
        const user_id = req.params.id;

        const userProfile = await User.findById(user_id, projection);

        if (!userProfile) {
            return res.status(404).json({ message: 'Rating not found' });
        }

        res.status(200).json({ userProfile });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Endpoint to update an existing user
router.patch('/update/:userId', async (req, res) => {
    const { mobile, city, type } = req.body;
    const userId = req.params.userId
    const query = { _id: userId };
    const updateFields = { mobile, city, type };
    const projection = { name: 1, mobile: 1, city: 1, email: 1, image: 1, type: 1 };

    try {
        // Perform the update
        const updatedDocument = await User.findOneAndUpdate(
            query,
            { $set: updateFields },
            {
                new: true, // Return the updated document
                fields: projection, // Specify fields to include
            }
        );

        if (!updatedDocument) {
            return res.status(404).json({ message: `${collectionName} not found` });
        }

        res.json({ message: `User updated successfully`, document: updatedDocument });
    } catch (error) {
        console.error(`Error updating user, error:`, error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;