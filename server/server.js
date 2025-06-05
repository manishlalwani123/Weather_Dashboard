// server/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');

const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/weatherApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API key for OpenWeatherMap
const WEATHER_API_KEY = 'fe6aded2146089c95df3995bb5c62561';

// Default route to login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Register a new user
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Let the User model handle password hashing
    const newUser = new User({ username, email, password });
    await newUser.save();

    res.status(201).json({ success: true, message: 'User registered successfully!' });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login user
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({ success: true, message: 'Login successful', username: user.username });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Fetch real-time weather data
app.get('/weather', async (req, res) => {
  const { city } = req.query;
  if (!city) {
    return res.status(400).json({ success: false, message: 'City is required' });
  }

  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${WEATHER_API_KEY}&units=metric`;

  try {
    const response = await axios.get(apiUrl);
    res.json({ success: true, data: response.data });
  } catch (err) {
    console.error('Error fetching weather data:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch weather data' });
  }
});

// Trigger AI model prediction using a Python script
app.post('/predict', (req, res) => {
  const { city } = req.body;
  if (!city) {
    return res.status(400).json({ success: false, message: 'City is required' });
  }

  const pythonProcess = spawn('python3', [path.join(__dirname, '../python/predict_weather.py'), city]);

  let output = '';
  pythonProcess.stdout.on('data', (data) => { output += data.toString(); });
  pythonProcess.stderr.on('data', (data) => { console.error('Python error:', data.toString()); });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).json({ success: false, message: 'Python script error' });
    }

    try {
      const predictions = JSON.parse(output);
      res.json({ success: true, predictions });
    } catch (e) {
      console.error('Invalid JSON from Python script:', e);
      res.status(500).json({ success: false, message: 'Invalid response from Python script' });
    }
  });
});

// Serve dashboard page
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
