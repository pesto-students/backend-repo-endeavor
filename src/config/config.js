require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    google_client_id: process.env.GOOGLE_CLIENT_ID,
    google_client_secret: process.env.GOOGLE_CLIENT_SECRET,
    backend_domain: process.env.BACKEND_DOMAIN || `http://localhost:${process.env.PORT || 3000}`,
    frontend_domain: process.env.FRONTEND_DOMAIN || "http://localhost:3000",
    frontend_on_login_redirect_path: process.env.FRONTEND_ON_LOGIN_REDIRECT_path || "/auth/callback",
    jwt_secret: process.env.JWT_SECRET || "jwt_secret",
    mongodb_uri: process.env.MONGODB_URI || "mongodb://localhost:27017",
    mongodb_database: process.env.MONGODB_DATABASE || "around"
};