const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
// Make sure to set your OpenRouteService API key in .env as API_KEY=your_key_here
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

// Predefined city coordinates
const cities = {
  Kigali: { lat: -1.9706, lon: 30.1044 },
  Huye: { lat: -2.6078, lon: 29.7402 },
  Gitarama: { lat: -2.0744, lon: 29.7565 }
};

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

/**
 * POST /route
 * Expects: { start: "Kigali", end: "Huye" }
 * Returns: { distance, duration, cost }
 */
app.post('/route', async (req, res) => {
  try {
    const { start, end } = req.body;
    // Validate input
    if (!cities[start] || !cities[end]) {
      return res.status(400).json({ error: 'Invalid city selection.' });
    }
    if (start === end) {
      return res.status(400).json({ error: 'Start and end cities must be different.' });
    }
    // Prepare coordinates
    const startCoords = [cities[start].lon, cities[start].lat];
    const endCoords = [cities[end].lon, cities[end].lat];

    // Call OpenRouteService API
    const response = await axios.post(
      'https://api.openrouteservice.org/v2/directions/driving-car',
      {
        coordinates: [startCoords, endCoords]
      },
      {
        headers: {
          Authorization: API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract data
    const route = response.data.features[0];
    const distance = route.properties.summary.distance / 1000; // in km
    const duration = route.properties.summary.duration / 60; // in minutes
    // Simple cost estimate: 100 RWF per km
    const cost = Math.round(distance * 100);

    res.json({
      distance: distance.toFixed(2),
      duration: duration.toFixed(1),
      cost
    });
  } catch (err) {
    // Handle API or network errors
    if (err.response && err.response.data && err.response.data.error) {
      res.status(500).json({ error: 'API error: ' + err.response.data.error.message });
    } else {
      res.status(500).json({ error: 'Server error. Please try again later.' });
    }
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
