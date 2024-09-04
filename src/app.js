const express = require('express')
const cors = require('cors');
const config = require('./config/config');
const connectToDatabase = require('./config/db');
const console_logging = require('./middleware/logging');
const passport = require('./passport');
const authRouter = require('./routes/auth');
const googleAuthRouter = require('./routes/googleAuth');
const businessRouter = require('./routes/business');
const userRouter = require('./routes/user');
const { router: ratingRouter } = require('./routes/rating');
const authenticateJWT = require('./middleware/authenticateJWT');
const cookieParser = require('cookie-parser');

const app = express()

// CORS configuration
app.use(cors({
  origin: config.frontend_domain, // Allow requests from this origin
  methods: 'GET,POST,PATCH,PUT,DELETE',
  credentials: true, // Allow cookies to be sent
}));

// Use cookie-parser middleware
app.use(cookieParser());

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectToDatabase();

// Debugging request handling
app.use(console_logging);

// Initialize Passport
app.use(passport.initialize());

// Test endpoint to check if the server is running (no authentication required)
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Server is listening and running fine!', 
    port: config.port 
  });
});

// Use the auth routers
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/auth', googleAuthRouter); 

app.use(authenticateJWT);

// Use business router
app.use('/api/v1/business', businessRouter);

// Use the user router
app.use('/api/v1/user', userRouter);

// Use the rating router
app.use('/api/v1/rating', ratingRouter);

module.exports = app;