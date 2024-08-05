const express = require('express')
const app = express()
const authRouter = require('./routes/auth');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const passport = require('passport');
const cors = require('cors');

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from this origin
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Allow cookies to be sent
}));

// Connect to your MongoDB database
mongoose.connect('mongodb://localhost:27017/around');

const db = mongoose.connection;

db.on('error', (error) => {
  console.error('Connection error:', error);
  // You may want to handle this error and exit the process if a database connection is critical
  process.exit(1);
});
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Set up the session middleware
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    client: db.getClient(),
    collectionName: 'sessions'
  })
}));

app.use(passport.authenticate('session'));

// Debugging request handling
app.use((req, res, next) => {
  console.log(`Received request for ${req.url}`);
  next();
});

// Check if user is logged in
app.get('/api/v1/check-auth', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ loggedIn: true });
  } else {
    res.json({ loggedIn: false });
  }
});

app.use('/api/v1/auth', authRouter);

module.exports = app;