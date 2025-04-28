// Import necessary packages
const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');  // Use bcryptjs instead of bcrypt
const dotenv = require('dotenv');
const serverless = require('serverless-http');

// Load environment variables from .env
dotenv.config();

// Initialize app
const app = express();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// User credentials
const USER_CREDENTIALS = {
  username: process.env.USERNAME,
  passwordHash: process.env.PASSWORD_HASH
};

// Views (index + login + admin must exist in /public or /views)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === USER_CREDENTIALS.username) {
    bcrypt.compare(password, USER_CREDENTIALS.passwordHash, (err, isMatch) => {  // Use bcryptjs compare method
      if (err) return res.status(500).json({ message: 'Error during login' });

      if (isMatch) {
        req.session.loggedIn = true;
        res.redirect('/admin');
      } else {
        res.status(401).json({ message: 'Invalid username or password' });
      }
    });
  } else {
    res.status(401).json({ message: 'Invalid username or password' });
  }
});

app.get('/admin', (req, res) => {
  if (req.session.loggedIn) {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  } else {
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send('Error logging out');
    res.redirect('/login');
  });
});

// Box data
let boxData = Array(784).fill(null).map((_, index) => ({
  id: index + 1,
  imageUrl: null,
  redirectUrl: null,
  isSold: false,
  row: Math.floor(index / 28) + 1,
  col: (index % 28) + 1
}));

app.get('/get-boxes', (req, res) => {
  res.json(boxData);
});

app.post('/update-box', (req, res) => {
  const { row, column, imageUrl, redirectUrl } = req.body;
  const boxIndex = (row - 1) * 28 + (column - 1);

  if (boxData[boxIndex]) {
    boxData[boxIndex].imageUrl = imageUrl;
    boxData[boxIndex].redirectUrl = redirectUrl;
    boxData[boxIndex].isSold = true;
    res.status(200).send({ message: `Box [${row}, ${column}] updated.` });
  } else {
    res.status(404).send({ message: 'Box not found.' });
  }
});

// Export for Vercel
module.exports = serverless(app);
