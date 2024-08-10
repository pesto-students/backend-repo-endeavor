const express = require('express')
const cors = require('cors');
const config = require('./config/config');
const connectToDatabase = require('./config/db');
const console_logging = require('./middleware/logging');
const passport = require('./passport');
const authRouter = require('./routes/auth');
const googleAuthRouter = require('./routes/googleAuth');
const userRouter = require('./routes/user');
const authenticateJWT = require('./middleware/authenticateJWT');

const app = express()

// CORS configuration
app.use(cors({
  origin: config.frontend_domain, // Allow requests from this origin
  methods: 'GET,POST',
  credentials: true, // Allow cookies to be sent
}));

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectToDatabase();

// Debugging request handling
app.use(console_logging);

// Initialize Passport
app.use(passport.initialize());

// Use the auth routers
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/auth', googleAuthRouter); 

// Use the user routers
app.use('/api/v1/users', authenticateJWT, userRouter);

module.exports = app;