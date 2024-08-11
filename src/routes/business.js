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

// Endpoint to search businesses with pagination, filter and sorting
router.post('/search', async (req, res) => {
    try {
        const { page = 1, limit = 10, filter, projection, sortBy } = req.body;

        // Calculate the number of documents to skip for pagination
        const skip = (page - 1) * limit;

        // Query to find businesses, sorted and paginated
        const businesses = await Business.find(filter, projection)
            .sort(sortBy)
            .skip(skip)
            .limit(parseInt(limit));

        // Count total documents for the filter
        const totalDocuments = await Business.countDocuments(filter);

        // Send response with businesses and pagination info
        res.status(200).json({
            totalPages: Math.ceil(totalDocuments / limit),
            currentPage: parseInt(page),
            businesses,
        });
    } catch (error) {
        console.error('Error searching businesses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
