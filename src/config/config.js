require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    google_client_id: process.env.GOOGLE_CLIENT_ID,
    google_client_secret: process.env.GOOGLE_CLIENT_SECRET,
    backend_domain: process.env.BACKEND_DOMAIN || `http://localhost:${process.env.PORT || 3000}/`,
    frontend_domain: process.env.FRONTEND_DOMAIN || "http://localhost:3000/"
};