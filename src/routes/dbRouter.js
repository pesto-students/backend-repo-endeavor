const express = require('express');
const router = express.Router();

// Assuming you have these models imported
const User = require('../models/User');
const Business = require('../models/Business');
const Rating = require('../models/Rating');

// Mapping of collection names to models
const models = {
    user: User,
    business: Business,
    rating: Rating,
};

// Search any collection with pagination, filter, and sorting
const searchApi = async (req, res) => {
    const { collectionName, page = 1, limit = 10, filter = {}, projection = {}, sortBy = {} } = req.body;

    try {
        // Validate if the requested collection exists in our models
        const Model = models[collectionName.toLowerCase()];
        if (!Model) {
            return res.status(400).json({ error: 'Invalid collection name' });
        }

        // Calculate the number of documents to skip for pagination
        const skip = (page - 1) * limit;

        // Query to find documents, sorted and paginated
        const documents = await Model.find(filter, projection)
            .sort(sortBy)
            .skip(skip)
            .limit(parseInt(limit));

        // Count total documents for the filter
        const totalDocuments = await Model.countDocuments(filter);

        // Send response with documents and pagination info
        res.status(200).json({
            totalPages: Math.ceil(totalDocuments / limit),
            currentPage: parseInt(page),
            documents,
        });
    } catch (error) {
        console.error(`Error searching ${collectionName}, error:`, error.message);
        res.status(500).json({ error: error.message });
    }
};

// Generalized insert Api
const insertApi = async (req, res) => {
    const { collectionName, data, projection = {} } = req.body;

    try {
        // Validate if the requested collection exists in our models
        const Model = models[collectionName.toLowerCase()];
        if (!Model) {
            return res.status(400).json({ error: 'Invalid collection name' });
        }

        // Create a new document instance with the provided data
        let newDocument = new Model(data);

        // Attempt to save the new document
        await newDocument.save();

        // Retrieve the saved document (if additional processing is needed)
        newDocument = await Model.findById(newDocument._id, projection);

        // Send a success response with the new document
        res.status(201).json({ message: `${collectionName} created successfully`, document: newDocument });
    } catch (error) {
        // Catch any errors that occur during the save operation
        console.error(`Error creating ${collectionName}, error:`, error.message);
        res.status(400).json({ error: error.message }); // Send an error response
    }
};

// Generalized partial update Api
const updateApi = async (req, res) => {
    const { collectionName, query, updateFields, projection } = req.body;

    try {
        // Validate if the requested collection exists in our models
        const Model = models[collectionName.toLowerCase()];
        if (!Model) {
            return res.status(400).json({ error: 'Invalid collection name' });
        }

        // Perform the update
        const updatedDocument = await Model.findOneAndUpdate(
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

        res.json({ message: `${collectionName} updated successfully`, document: updatedDocument });
    } catch (error) {
        console.error(`Error updating ${collectionName}, error:`, error.message);
        res.status(500).json({ error: error.message });
    }
};

router.post('/search', searchApi);
router.post('/insert', insertApi);
router.patch('/update', updateApi);

module.exports = {
    searchApi,
    insertApi,
    updateApi,
    dbRouter: router
};