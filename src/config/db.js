const mongoose = require('mongoose');
const config = require('./config');

// Function to connect to MongoDB
function connectToDatabase() {
    mongoose.connect(`${config.mongodb_uri}/${config.mongodb_database}`);

    const db = mongoose.connection;

    db.on('error', (error) => {
        console.error('Connection error:', error);
        process.exit(1); // Exit process on failure
    });
    db.once('open', () => {
        console.log('Connected to MongoDB');
    });

    return db;
}

module.exports = connectToDatabase;