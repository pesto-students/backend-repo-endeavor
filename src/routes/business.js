const express = require('express');
const router = express.Router();
const Business = require('../models/Business');

// Endpoint to update business information using email
router.post('/insert', async (req, res) => {
    try {
        const businessData = req.body;
        let newBusiness = new Business(businessData);
        await newBusiness.save(); // Attempt to save the new business
        newBusiness = await Business.findById(newBusiness._id, {});
        res.status(201).json({ message: 'Business created successfully', business: newBusiness });
    } catch (error) {
        // Catch any errors that occur during the save operation
        console.error('Error creating business:', error);
        res.status(400).json({ error: error.message }); // Send an error response
    }
});

module.exports = router;
