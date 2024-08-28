const { getISTDate } = require('../utils/dateUtils');
const User = require('../models/User');

const projection = { name: 1, mobile: 1, city: 1, email: 1, image: 1, type: 1, rating: 1 };

const findOrCreateUser = async (user) => {
    try {
        // Search for the user by email
        let userProfile = await User.findOne({ email: user.email });

        if (!userProfile) {
            // If user doesn't exist, create a new one
            userProfile = new User(user);
            await userProfile.save();
        } else {
            // If user exists, update the last logged in time
            await User.updateOne(
                { email: userProfile.email },
                { $set: { last_logged_in_at: getISTDate() } }
            );
        }

        // Retrieve the user with the specified projection
        userProfile = await User.findOne({ email: userProfile.email }, projection);
        return userProfile; // Return the user profile
    } catch (error) {
        console.error('Error in findOrCreateUser:', error.message);
        throw new Error('Unable to process user login.');
    }
}

module.exports = {
    findOrCreateUser,
    projection
};