// Import necessary packages
const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { VercelRequest, VercelResponse } = require('@vercel/node');

// Initialize the Express app
const app = express();
const port = process.env.PORT || 3000;

// Load environment variables
require('dotenv').config();

// Get user credentials from environment variables
const USER_CREDENTIALS = { 
  username: process.env.USERNAME, 
  passwordHash: process.env.PASSWORD_HASH 
};

// Middleware to serve static files and parse JSON
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,  // Secret from .env file
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',  // Secure cookies in production
    maxAge: 1000 * 60 * 60 * 24,  // 1 day expiration
  },
}));

// Serve the index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Login page route (serve a login page)
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Handle login form submission
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Validate the credentials
  if (username === USER_CREDENTIALS.username) {
    // Compare the entered password with the stored hashed password
    bcrypt.compare(password, USER_CREDENTIALS.passwordHash, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ message: 'Error logging in' });
      }

      if (isMatch) {
        req.session.loggedIn = true;  // Set session for logged-in user
        res.redirect('/admin');  // Redirect to the admin page
      } else {
        res.status(401).json({ message: 'Invalid username or password' });
      }
    });
  } else {
    res.status(401).json({ message: 'Invalid username or password' });
  }
});

// Admin page (only accessible after login)
app.get('/admin', (req, res) => {
  if (req.session.loggedIn) {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));  // Serve the admin page
  } else {
    res.redirect('/login');  // Redirect to login page if not logged in
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.redirect('/login');  // Redirect to login page after logout
  });
});

// Box Data Management
let boxData = Array(784).fill(null).map((_, index) => ({
  id: index + 1,
  imageUrl: null,
  redirectUrl: null,
  isSold: false,
  row: Math.floor(index / 28) + 1,  // Calculate row (1-based)
  col: (index % 28) + 1            // Calculate column (1-based)
}));

// Endpoint to fetch all box data
app.get('/get-boxes', (req, res) => {
  res.json(boxData);  // Send the box data as JSON
});

// Endpoint to update box data (for example: marking a box as sold)
app.post('/update-box', (req, res) => {
  const { row, column, imageUrl, redirectUrl } = req.body;
  const boxIndex = (row - 1) * 28 + (column - 1);

  if (boxData[boxIndex]) {
    boxData[boxIndex].imageUrl = imageUrl;
    boxData[boxIndex].redirectUrl = redirectUrl;
    boxData[boxIndex].isSold = true;
    res.status(200).send({ message: `Box [Row ${row}, Column ${column}] updated successfully!` });
  } else {
    res.status(404).send({ message: 'Box not found.' });
  }
});

// Export as serverless function (Vercel requires this)
module.exports = (req, res) => {
  app(req, res);
};
