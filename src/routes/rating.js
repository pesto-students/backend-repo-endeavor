const express = require('express');

// Models
const Rating = require('../models/Rating');
const User = require('../models/User');
const Business = require('../models/Business');
const { getISTDate } = require('../utils/dateUtils');

const router = express.Router();

// Helper function to update the rating and total rating for User and Business
const updateRating = async (entity, ratingDelta, totalRatingDelta) => {
    entity.total_rating += totalRatingDelta;
    entity.total_rated += ratingDelta;
    entity.rating = entity.total_rating / (entity.total_rated || 1);
    entity.updated_at = getISTDate();
    await entity.save();
};

// Create Rating
router.post('/new', async (req, res) => {
    try {
        const { user_id, business_id, rating } = req.body;

        const user = await User.findById(user_id);
        const business = await Business.findById(business_id);

        if (!user || !business) {
            return res.status(404).json({ message: 'User or Business not found' });
        }

        const newRating = new Rating({
            user_id,
            business_id,
            rating,
        });

        await newRating.save();

        const businessUser = await User.findOne({ email: business.user_id })

        // Update User and Business rating
        await updateRating(businessUser, 1, rating);
        await updateRating(business, 1, rating);

        res.status(201).json({rating: newRating});
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Read Rating
router.post('/search', async (req, res) => {
    try {
        const { user_id, business_id } = req.body;

        const rating = await Rating.findOne({ user_id, business_id });

        if (!rating) {
            return res.status(404).json({ message: 'Rating not found' });
        }

        res.status(200).json({ rating });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Rating
router.put('/update/:id', async (req, res) => {
    try {
        const { rating } = req.body;
        const ratingId = req.params.id;

        const existingRating = await Rating.findById(ratingId);

        if (!existingRating) {
            return res.status(404).json({ message: 'Rating not found' });
        }

        const business = await Business.findById(existingRating.business_id);
        const businessUser = await User.findOne({ email: business.user_id });

        const ratingDifference = rating - existingRating.rating;

        existingRating.rating = rating;
        existingRating.updated_at = getISTDate();

        await existingRating.save();

        // Update User and Business rating
        await updateRating(businessUser, 0, ratingDifference);
        await updateRating(business, 0, ratingDifference);

        res.status(200).json({ rating: existingRating });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete Rating
router.delete('/delete/:id', async (req, res) => {
    try {
        const ratingId = req.params.id;

        const existingRating = await Rating.findById(ratingId);

        if (!existingRating) {
            return res.status(404).json({ message: 'Rating not found' });
        }

        const business = await Business.findById(existingRating.business_id);
        const businessUser = await User.findOne({ email: business.user_id });

        const ratingValue = existingRating.rating;

        await Rating.findByIdAndDelete(ratingId);

        // Update User and Business rating
        await updateRating(businessUser, -1, -ratingValue);
        await updateRating(business, -1, -ratingValue);

        res.status(200).json({ message: 'Rating deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = {
    router,
    updateRating
};
