require('dotenv').config();

const config = {
    port: process.env.PORT || 3000,
    google_client_id: process.env.GOOGLE_CLIENT_ID,
    google_client_secret: process.env.GOOGLE_CLIENT_SECRET,
    backend_domain: process.env.BACKEND_DOMAIN || `http://localhost:${process.env.PORT || 3000}`,
    frontend_domain: process.env.FRONTEND_DOMAIN || "http://localhost:3000",
    frontend_on_login_redirect_path: process.env.FRONTEND_ON_LOGIN_REDIRECT_path || "/auth/callback",
    jwt_secret: process.env.JWT_SECRET || "jwt_secret",
    mongodb_uri: process.env.MONGODB_URI || "mongodb://localhost:27017",
    mongodb_database: process.env.MONGODB_DATABASE || "around",
    access_token_expiry: process.env.ACCESS_TOKEN_EXPIRY || "15m",
    refresh_token_expiry: process.env.REFRESH_TOKEN_EXPIRY || "2d"
}

// Filter cookie option
let isCookieOptionsValid = false
try {
    JSON.parse(process.env.COOKIE_OPTIONS_ACCESS_TOKEN);
    JSON.parse(process.env.COOKIE_OPTIONS_REFRESH_TOKEN);
    isCookieOptionsValid = true;
    console.log("Enabling cookie for the client");
} catch (err) {
    console.error("Incorrect cookie options provided")
} finally {
    if (isCookieOptionsValid) {
        config["cookie_options_access_token"] = process.env.COOKIE_OPTIONS_ACCESS_TOKEN;
        config["cookie_options_refresh_token"] = process.env.COOKIE_OPTIONS_REFRESH_TOKEN;
    }
    config["isCookieOptionsValid"] = process.env.COOKIE_OPTIONS_REFRESH_TOKEN;
}

module.exports = config;