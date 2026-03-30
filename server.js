const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
 
dotenv.config();
 
const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
 
// ── Expanded city list (Rwanda) ─────────────────────────────────────────────
const cities = {
  Kigali:    { lat: -1.9706, lon: 30.1044 },
  Huye:      { lat: -2.6078, lon: 29.7402 },
  Gitarama:  { lat: -2.0744, lon: 29.7565 },
  Musanze:   { lat: -1.4998, lon: 29.6333 },
  Rubavu:    { lat: -1.6812, lon: 29.2556 },
  Nyagatare: { lat: -1.2977, lon: 30.3281 },
  Rwamagana: { lat: -1.9481, lon: 30.4349 },
  Muhanga:   { lat: -2.0833, lon: 29.7500 },
  Rusizi:    { lat: -2.4833, lon: 28.9000 },
  Nyamata:   { lat: -2.1481, lon: 30.0914 },
  Byumba:    { lat: -1.5764, lon: 30.0672 },
  Kibungo:   { lat: -2.1597, lon: 30.5436 },
};
 
// ── Valid transport profiles ────────────────────────────────────────────────
const VALID_PROFILES = {
  'driving-car':    { label: 'Car',     costPerKm: 100 },
  'cycling-regular':{ label: 'Bicycle', costPerKm: 20  },
  'foot-walking':   { label: 'Walking', costPerKm: 0   },
};
 
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
 
// ── Health check (required by HAProxy) ─────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'route-optimizer' });
});
 
// ── Expose city list to frontend ────────────────────────────────────────────
app.get('/cities', (req, res) => {
  res.json(Object.keys(cities));
});
 
/**
 * POST /route
 * Body: { start, end, profile }
 * Returns: { distance, duration, cost, profile }
 */
app.post('/route', async (req, res) => {
  try {
    const { start, end, profile = 'driving-car' } = req.body;
 
    // ── Validate inputs ──────────────────────────────────────────────────
    if (!cities[start] || !cities[end]) {
      return res.status(400).json({ error: 'Invalid city selection.' });
    }
    if (start === end) {
      return res.status(400).json({ error: 'Start and end cities must be different.' });
    }
    if (!VALID_PROFILES[profile]) {
      return res.status(400).json({ error: 'Invalid transport mode.' });
    }
 
    const startCoords = [cities[start].lon, cities[start].lat];
    const endCoords   = [cities[end].lon,   cities[end].lat];
 
    // ── Call OpenRouteService ────────────────────────────────────────────
    const response = await axios.post(
      `https://api.openrouteservice.org/v2/directions/${profile}`,
      { coordinates: [startCoords, endCoords] },
      {
        headers: {
          Authorization: API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 s timeout
      }
    );
 
    const route    = response.data.features[0];
    const distance = route.properties.summary.distance / 1000;       // km
    const duration = route.properties.summary.duration / 60;          // minutes
    const cost     = Math.round(distance * VALID_PROFILES[profile].costPerKm);
 
    res.json({
      distance: distance.toFixed(2),
      duration: duration.toFixed(1),
      cost,
      profile: VALID_PROFILES[profile].label,
      start,
      end,
    });
 
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Request timed out. Please try again.' });
    }
    if (err.response) {
      const status = err.response.status;
      if (status === 429) {
        return res.status(429).json({ error: 'API rate limit reached. Try again shortly.' });
      }
      if (status === 403) {
        return res.status(403).json({ error: 'Invalid API key.' });
      }
      if (status === 404) {
        return res.status(404).json({ error: 'No route found between these cities.' });
      }
      const msg = err.response.data?.error?.message || 'Routing API error.';
      return res.status(500).json({ error: msg });
    }
    console.error('Unexpected error:', err.message);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});
 
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
 