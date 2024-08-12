const axios = require('axios');
const { getISTDate } = require('../utils/dateUtils');
const config = require('../config/config');


const API_BASE_URL = `http://localhost:${config.port}`;
const projection = { name: 1, mobile: 1, city: 1, email: 1, image: 1, type: 1 };


// Function to search for a user within the same application
const searchUser = async (filter) => {
    const searchResponse = await axios.post(`${API_BASE_URL}/api/v1/search`, {
        collectionName: 'User',
        page: 1,
        limit: 10,
        filter: filter,
        projection,
        sortBy: { updated_at: -1, created_at: -1 }
    });
    return searchResponse.data.documents[0];
}

// Function to create a new user within the same application
const createUser = async (userData) => {
    const insertResponse = await axios.post(`${API_BASE_URL}/api/v1/insert`, {
        collectionName: 'User',
        data: userData,
        projection
    });
    return insertResponse.data.document;
}

// Function to update the user's last login time
const updateUserLoginTime = async (email) => {
    const updateResponse = await axios.patch(`${API_BASE_URL}/api/v1/update`, {
        collectionName: 'User',
        query: { email: email },
        updateFields: { last_logged_in_at: getISTDate() },
        projection: { name: 1, mobile: 1, city: 1, email: 1, image: 1, type: 1 }
    });
    return updateResponse.data.document;
}

const findOrCreateUser = async (user) => {
    try {
        // Search for the user by email
        const existingUser = await searchUser({ email: user.email });
        
        let userProfile;

        if (!existingUser) {
            // If user doesn't exist, create a new one
            userProfile = await createUser(user);
        } else {
            // If user exists, update the last logged in time
            userProfile = await updateUserLoginTime(existingUser.email);
        }

        return userProfile; // Return the user profile
    } catch (error) {
        console.error('Error in findOrCreateUser:', error.message);
        throw new Error('Unable to process user login.');
    }
}

module.exports = {
    searchUser,
    createUser,
    updateUserLoginTime,
    findOrCreateUser
};