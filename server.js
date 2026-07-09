const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || '';
const STORE_PATH = path.join(__dirname, 'data', 'state.json');
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

const PLACE_CATALOG = [
  { name: 'Kigali City', lat: -1.9441, lon: 30.0619, province: 'Kigali' },
  { name: 'Eastern Province', lat: -1.9487, lon: 30.4347, province: 'Eastern' },
  { name: 'Northern Province', lat: -1.4998, lon: 29.6333, province: 'Northern' },
  { name: 'Southern Province', lat: -2.3523, lon: 29.7507, province: 'Southern' },
  { name: 'Western Province', lat: -2.1543, lon: 29.3736, province: 'Western' },
  { name: 'Kigali', lat: -1.9441, lon: 30.0619 },
  { name: 'Nyamirambo', lat: -1.9704, lon: 30.0314 },
  { name: 'Remera', lat: -1.9508, lon: 30.1141 },
  { name: 'Kacyiru', lat: -1.9443, lon: 30.0826 },
  { name: 'Nyabugogo', lat: -1.9407, lon: 30.0422 },
  { name: 'Kimironko', lat: -1.9318, lon: 30.1262 },
  { name: 'Gikondo', lat: -1.9652, lon: 30.0734 },
  { name: 'Kanombe', lat: -1.9698, lon: 30.1706 },
  { name: 'Kicukiro', lat: -1.9761, lon: 30.1174 },
  { name: 'Gasabo', lat: -1.9167, lon: 30.0833 },
  { name: 'Nyarugenge', lat: -1.95, lon: 30.05 },
  { name: 'Muhanga', lat: -2.0797, lon: 29.7563 },
  { name: 'Musanze', lat: -1.4998, lon: 29.6333 },
  { name: 'Rubavu', lat: -1.6799, lon: 29.2572 },
  { name: 'Rusizi', lat: -2.4791, lon: 28.9077 },
  { name: 'Huye', lat: -2.596, lon: 29.7397 },
  { name: 'Nyanza', lat: -2.3523, lon: 29.7507 },
  { name: 'Rwamagana', lat: -1.9487, lon: 30.4347 },
  { name: 'Nyagatare', lat: -1.2928, lon: 30.331 },
  { name: 'Kayonza', lat: -1.8736, lon: 30.5797 },
  { name: 'Kibungo', lat: -2.1537, lon: 30.545 },
  { name: 'Byumba', lat: -1.5764, lon: 30.0658 },
  { name: 'Gicumbi', lat: -1.5736, lon: 30.0629 },
  { name: 'Gisenyi', lat: -1.7025, lon: 29.2564 },
  { name: 'Tumba', lat: -2.6037, lon: 29.7479 },
  { name: 'Nyamata', lat: -2.1407, lon: 30.0818 },
  { name: 'Bugesera', lat: -2.15, lon: 30.0833 },
  { name: 'Karongi', lat: -2.1543, lon: 29.3736 },
  { name: 'Rutsiro', lat: -1.9481, lon: 29.1759 },
  { name: 'Nyamagabe', lat: -2.4833, lon: 29.5167 },
  { name: 'Gisagara', lat: -2.6167, lon: 29.6167 },
  { name: 'Nyaruguru', lat: -2.65, lon: 29.0167 },
  { name: 'Burera', lat: -1.4925, lon: 29.7719 },
  { name: 'Gakenke', lat: -1.7061, lon: 29.7958 },
  { name: 'Rulindo', lat: -1.7372, lon: 30.1177 },
  { name: 'Ngororero', lat: -1.874, lon: 29.5247 },
  { name: 'Nyabihu', lat: -1.6734, lon: 29.3735 },
  { name: 'Gatuna', lat: -1.5422, lon: 30.1193 },
  { name: 'Rusumo', lat: -2.3513, lon: 30.77 },
  { name: 'Kigali International Airport', lat: -1.9684, lon: 30.1395 },
  { name: 'Nyabugogo Bus Park', lat: -1.9407, lon: 30.0422 },
  { name: 'Musanze Bus Park', lat: -1.5003, lon: 29.6339 },
  { name: 'Huye Bus Park', lat: -2.6008, lon: 29.7419 },
];

const PROVINCES = [
  { name: 'Kigali City', center: { lat: -1.9441, lon: 30.0619 } },
  { name: 'Eastern Province', center: { lat: -1.9487, lon: 30.4347 } },
  { name: 'Northern Province', center: { lat: -1.4998, lon: 29.6333 } },
  { name: 'Southern Province', center: { lat: -2.3523, lon: 29.7507 } },
  { name: 'Western Province', center: { lat: -2.1543, lon: 29.3736 } },
];

const VEHICLE_TYPES = {
  bus: { label: 'Bus', baseFarePerKm: 120, capacity: 45, speedMultiplier: 0.95 },
  'mini-bus': { label: 'Mini bus', baseFarePerKm: 160, capacity: 18, speedMultiplier: 1.05 },
};

const DEFAULT_STORE = {
  users: [],
  sessions: [],
  bookings: [],
  drivers: [
    {
      id: 'driver-demo-1',
      name: 'Aline Mukamugema',
      email: 'driver1@demo.rw',
      phone: '+250788000001',
      role: 'driver',
      vehicleType: 'bus',
      status: 'available',
      currentLocation: { lat: -1.9441, lon: 30.0619, label: 'Kigali' },
      passwordSalt: 'demo-salt-1',
      passwordHash: hashPassword('driver123', 'demo-salt-1'),
    },
    {
      id: 'driver-demo-2',
      name: 'Jean Claude Niyonsenga',
      email: 'driver2@demo.rw',
      phone: '+250788000002',
      role: 'driver',
      vehicleType: 'mini-bus',
      status: 'available',
      currentLocation: { lat: -1.4998, lon: 29.6333, label: 'Musanze' },
      passwordSalt: 'demo-salt-2',
      passwordHash: hashPassword('driver123', 'demo-salt-2'),
    },
  ],
};

const PLACE_LOOKUP = new Map(PLACE_CATALOG.map((place) => [normalize(place.name), place]));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

ensureDataFile();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'rwanda-booking-platform' });
});

app.get('/cities', (req, res) => {
  res.json(PLACE_CATALOG.map((place) => place.name));
});

app.get('/api/places', (req, res) => {
  res.json({ places: PLACE_CATALOG.map((place) => place.name) });
});

app.get('/api/catalog', (req, res) => {
  const store = loadStore();
  res.json({
    provinces: PROVINCES,
    places: PLACE_CATALOG.map((place) => ({
      name: place.name,
      province: place.province || null,
      lat: place.lat,
      lon: place.lon,
    })),
    vehicleTypes: Object.entries(VEHICLE_TYPES).map(([id, config]) => ({
      id,
      label: config.label,
      capacity: config.capacity,
      farePerKm: config.baseFarePerKm,
    })),
    serviceProviders: store.drivers.map(sanitizeDriver),
  });
});

app.get('/api/dashboard', (req, res) => {
  const store = loadStore();
  res.json({
    bookings: store.bookings.slice(0, 12),
    users: store.users.map((user) => ({ id: user.id, name: user.name, role: user.role })),
    drivers: store.drivers.map(sanitizeDriver),
  });
});

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, phone, role = 'customer' } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const store = loadStore();
  const normalizedEmail = String(email).trim().toLowerCase();
  if (store.users.some((user) => user.email === normalizedEmail) || store.drivers.some((driver) => driver.email === normalizedEmail)) {
    return res.status(409).json({ error: 'An account already exists for that email.' });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const user = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    email: normalizedEmail,
    phone: phone ? String(phone).trim() : '',
    role: role === 'driver' ? 'driver' : 'customer',
    passwordSalt: salt,
    passwordHash: hashPassword(String(password), salt),
    createdAt: new Date().toISOString(),
  };

  if (user.role === 'driver') {
    store.drivers.push({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: 'driver',
      vehicleType: 'mini-bus',
      status: 'available',
      currentLocation: { lat: -1.9441, lon: 30.0619, label: 'Kigali' },
      passwordSalt: user.passwordSalt,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
    });
  } else {
    store.users.push(user);
  }

  const token = createSession(store, user.id);
  saveStore(store);

  res.status(201).json({ user: sanitizeAccount(user), token });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const store = loadStore();
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = store.users.find((entry) => entry.email === normalizedEmail)
    || store.drivers.find((entry) => entry.email === normalizedEmail);

  if (!user || !verifyPassword(String(password), user.passwordSalt, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = createSession(store, user.id);
  saveStore(store);

  res.json({ user: sanitizeAccount(user), token });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: sanitizeAccount(req.user) });
});

app.get('/api/bookings', requireAuth, (req, res) => {
  const store = loadStore();
  const bookings = req.user.role === 'driver'
    ? store.bookings.filter((booking) => booking.status === 'pending' || booking.driverId === req.user.id)
    : store.bookings.filter((booking) => booking.customerId === req.user.id);

  res.json({ bookings });
});

app.get('/api/bookings/:id', requireAuth, (req, res) => {
  const store = loadStore();
  const booking = store.bookings.find((entry) => entry.id === req.params.id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  if (!canViewBooking(req.user, booking)) {
    return res.status(403).json({ error: 'You do not have access to this booking.' });
  }

  res.json({ booking });
});

app.post('/api/bookings', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Only customers can create bookings.' });
    }

    const {
      pickup,
      dropoff,
      passengerCount = 1,
      vehicleType = 'mini-bus',
      preferredDriverId = '',
      paymentMethod = 'mobile-money',
      departureTime = '',
      pickupNote = '',
      dropoffNote = '',
      contactPhone = '',
    } = req.body || {};

    if (!pickup || !dropoff) {
      return res.status(400).json({ error: 'Pickup and dropoff locations are required.' });
    }

    if (!VEHICLE_TYPES[vehicleType]) {
      return res.status(400).json({ error: 'Choose a valid vehicle type.' });
    }

    const passengers = Number(passengerCount);
    if (!Number.isFinite(passengers) || passengers < 1) {
      return res.status(400).json({ error: 'Passenger count must be at least 1.' });
    }

    const origin = await resolveLocation(pickup);
    const destination = await resolveLocation(dropoff);
    if (!origin || !destination) {
      return res.status(404).json({
        error: 'Could not resolve one of the locations. Use a Rwanda province, city, district, bus park, or a nearby area name.',
      });
    }

    const trip = await estimateTrip(origin, destination, vehicleType, departureTime, passengers);
    const store = loadStore();
    const preferredDriver = preferredDriverId
      ? store.drivers.find((driver) => driver.id === String(preferredDriverId))
      : null;

    if (preferredDriverId && !preferredDriver) {
      return res.status(404).json({ error: 'Selected service provider was not found.' });
    }

    if (preferredDriver && preferredDriver.vehicleType !== vehicleType) {
      return res.status(400).json({ error: 'Selected provider does not match the chosen vehicle type.' });
    }

    if (preferredDriver && preferredDriver.status !== 'available') {
      return res.status(409).json({ error: 'Selected provider is not available right now.' });
    }

    const booking = {
      id: crypto.randomUUID(),
      customerId: req.user.id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      contactPhone: contactPhone ? String(contactPhone).trim() : req.user.phone || '',
      pickup,
      dropoff,
      pickupNote: String(pickupNote || '').trim(),
      dropoffNote: String(dropoffNote || '').trim(),
      passengerCount: passengers,
      vehicleType,
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'pay-on-board' : 'online-ready',
      status: preferredDriver ? 'assigned' : 'pending',
      driverId: preferredDriver ? preferredDriver.id : null,
      driverName: preferredDriver ? preferredDriver.name : null,
      serviceProviderId: preferredDriver ? preferredDriver.id : null,
      serviceProviderName: preferredDriver ? preferredDriver.name : null,
      serviceProviderVehicleType: preferredDriver ? preferredDriver.vehicleType : vehicleType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pickupPoint: origin,
      dropoffPoint: destination,
      liveTraffic: trip.traffic,
      route: trip,
      paymentReference: createReference('PAY'),
      rejections: [],
      liveDriverLocation: null,
    };

    store.bookings.unshift(booking);
    if (preferredDriver) {
      preferredDriver.status = 'reserved';
    }
    saveStore(store);

    res.status(201).json({ booking });
  } catch (error) {
    handleError(res, error);
  }
});

app.patch('/api/bookings/:id/respond', requireAuth, (req, res) => {
  const { decision } = req.body || {};
  if (req.user.role !== 'driver') {
    return res.status(403).json({ error: 'Only drivers can respond to bookings.' });
  }
  if (!['accept', 'reject'].includes(decision)) {
    return res.status(400).json({ error: 'Decision must be accept or reject.' });
  }

  const store = loadStore();
  const booking = store.bookings.find((entry) => entry.id === req.params.id);
  const driver = store.drivers.find((entry) => entry.id === req.user.id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }
  if (!driver) {
    return res.status(404).json({ error: 'Driver account not found.' });
  }

  if (decision === 'accept') {
    booking.status = 'accepted';
    booking.driverId = driver.id;
    booking.driverName = driver.name;
    driver.status = 'on-trip';
  } else {
    booking.status = 'pending';
    booking.driverId = null;
    booking.driverName = null;
    booking.rejections.push({ driverId: driver.id, driverName: driver.name, at: new Date().toISOString() });
    driver.status = 'available';
  }

  booking.updatedAt = new Date().toISOString();
  saveStore(store);
  res.json({ booking });
});

app.post('/api/drivers/:id/location', requireAuth, (req, res) => {
  const { lat, lon, label = '' } = req.body || {};
  if (req.user.role !== 'driver') {
    return res.status(403).json({ error: 'Only drivers can update their GPS location.' });
  }
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'You can only update your own driver record.' });
  }

  const store = loadStore();
  const driver = store.drivers.find((entry) => entry.id === req.user.id);
  if (!driver) {
    return res.status(404).json({ error: 'Driver not found.' });
  }

  driver.currentLocation = {
    lat: Number(lat),
    lon: Number(lon),
    label: String(label || '').trim(),
    updatedAt: new Date().toISOString(),
  };

  store.bookings
    .filter((booking) => booking.driverId === driver.id)
    .forEach((booking) => {
      booking.liveDriverLocation = driver.currentLocation;
      booking.updatedAt = new Date().toISOString();
    });

  saveStore(store);
  res.json({ driver: sanitizeDriver(driver) });
});

app.get('/api/driver/summary', requireAuth, (req, res) => {
  if (req.user.role !== 'driver') {
    return res.status(403).json({ error: 'Only drivers can view this summary.' });
  }

  const store = loadStore();
  const driverBookings = store.bookings.filter((booking) => booking.driverId === req.user.id || booking.status === 'pending');

  res.json({
    driver: sanitizeDriver(store.drivers.find((entry) => entry.id === req.user.id) || req.user),
    pendingBookings: driverBookings.filter((booking) => booking.status === 'pending'),
    assignedBookings: driverBookings.filter((booking) => booking.status === 'accepted' && booking.driverId === req.user.id),
    livePassengerCount: driverBookings
      .filter((booking) => booking.status === 'accepted' && booking.driverId === req.user.id)
      .reduce((sum, booking) => sum + Number(booking.passengerCount || 0), 0),
  });
});

app.get('/api/traffic', async (req, res) => {
  try {
    const { pickup, dropoff, vehicleType = 'mini-bus', departureTime = '' } = req.query;
    if (!pickup || !dropoff) {
      return res.status(400).json({ error: 'pickup and dropoff are required.' });
    }

    const origin = await resolveLocation(pickup);
    const destination = await resolveLocation(dropoff);
    if (!origin || !destination) {
      return res.status(404).json({ error: 'Could not resolve one of the locations.' });
    }

    const trip = await estimateTrip(origin, destination, vehicleType, departureTime, 1);
    res.json({
      pickupPoint: origin,
      dropoffPoint: destination,
      traffic: trip.traffic,
      route: trip,
    });
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/api/resolve', async (req, res) => {
  try {
    const { place } = req.body || {};
    if (!place) {
      return res.status(400).json({ error: 'place is required.' });
    }

    const location = await resolveLocation(place);
    if (!location) {
      return res.status(404).json({ error: 'Place not found.' });
    }

    res.json({ place: location });
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/route', async (req, res) => {
  try {
    const { start, end, profile = 'mini-bus' } = req.body || {};
    const origin = await resolveLocation(start);
    const destination = await resolveLocation(end);

    if (!origin || !destination) {
      return res.status(404).json({ error: 'Could not resolve one of the locations.' });
    }

    const vehicleType = profile === 'bus' || profile === 'driving-car' ? 'bus' : 'mini-bus';
    const trip = await estimateTrip(origin, destination, vehicleType, '', 1);

    res.json({
      distance: trip.distanceKm.toFixed(2),
      duration: trip.adjustedDurationMin.toFixed(1),
      cost: trip.fare,
      profile: VEHICLE_TYPES[vehicleType].label,
      start: origin.name,
      end: destination.name,
      points: trip.points,
      trafficLevel: trip.traffic.label,
      routeStatus: trip.points ? 'live' : 'fallback',
    });
  } catch (error) {
    handleError(res, error);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

function ensureDataFile() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(STORE_PATH)) {
    saveStore(DEFAULT_STORE);
  }
}

function loadStore() {
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      drivers: Array.isArray(parsed.drivers) && parsed.drivers.length > 0 ? parsed.drivers : DEFAULT_STORE.drivers,
    };
  } catch {
    return {
      users: [],
      sessions: [],
      bookings: [],
      drivers: DEFAULT_STORE.drivers,
    };
  }
}

function saveStore(store) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function sanitizeAccount(account) {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    phone: account.phone || '',
    role: account.role,
  };
}

function sanitizeDriver(driver) {
  return {
    id: driver.id,
    name: driver.name,
    email: driver.email,
    phone: driver.phone || '',
    role: 'driver',
    vehicleType: driver.vehicleType,
    status: driver.status,
    currentLocation: driver.currentLocation || null,
  };
}

function createSession(store, userId) {
  const token = crypto.randomUUID();
  store.sessions = store.sessions.filter((session) => session.userId !== userId);
  store.sessions.push({ token, userId, createdAt: new Date().toISOString() });
  return token;
}

function requireAuth(req, res, next) {
  const token = String(req.header('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return res.status(401).json({ error: 'Authorization token is required.' });
  }

  const store = loadStore();
  const session = store.sessions.find((entry) => entry.token === token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid.' });
  }

  const user = store.users.find((entry) => entry.id === session.userId)
    || store.drivers.find((entry) => entry.id === session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User account not found.' });
  }

  req.user = user;
  next();
}

function canViewBooking(user, booking) {
  if (user.role === 'driver') {
    return booking.status === 'pending' || booking.driverId === user.id;
  }

  return booking.customerId === user.id;
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(String(password), salt, 120000, 64, 'sha256').toString('hex');
}

function verifyPassword(password, salt, hash) {
  return hashPassword(password, salt) === hash;
}

function createReference(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function toRad(value) {
  return (Number(value) * Math.PI) / 180;
}

function haversineDistanceKm(start, end) {
  const earthRadiusKm = 6371;
  const dLat = toRad(end.lat - start.lat);
  const dLon = toRad(end.lon - start.lon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(start.lat)) * Math.cos(toRad(end.lat)) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function resolveLocation(query) {
  const normalized = normalize(query);
  if (PLACE_LOOKUP.has(normalized)) {
    const place = PLACE_LOOKUP.get(normalized);
    return { name: place.name, lat: place.lat, lon: place.lon, source: 'catalog' };
  }

  const response = await axios.get(NOMINATIM_URL, {
    params: {
      q: `${query}, Rwanda`,
      format: 'jsonv2',
      countrycodes: 'rw',
      limit: 1,
    },
    headers: {
      'User-Agent': 'RwandaBookingPlatform/1.0 (+https://example.local)',
      Accept: 'application/json',
    },
    timeout: 15000,
  });

  const hit = Array.isArray(response.data) ? response.data[0] : null;
  if (!hit) {
    return null;
  }

  return {
    name: hit.display_name,
    lat: Number(hit.lat),
    lon: Number(hit.lon),
    source: 'geocoder',
  };
}

async function estimateTrip(origin, destination, vehicleType, departureTime, passengerCount) {
  const vehicle = VEHICLE_TYPES[vehicleType] || VEHICLE_TYPES['mini-bus'];
  let route = null;

  if (API_KEY) {
    try {
      const response = await axios.get('https://graphhopper.com/api/1/route', {
        params: {
          point: [`${origin.lat},${origin.lon}`, `${destination.lat},${destination.lon}`],
          vehicle: 'car',
          locale: 'en',
          calc_points: true,
          points_encoded: false,
          key: API_KEY,
        },
        timeout: 15000,
      });

      const pathResult = response.data?.paths?.[0];
      if (pathResult) {
        route = {
          distanceKm: Number((pathResult.distance / 1000).toFixed(2)),
          durationMin: Number((pathResult.time / 60000).toFixed(1)),
          points: pathResult.points,
        };
      }
    } catch (error) {
      console.warn('GraphHopper unavailable, using fallback route calculation:', error.message);
    }
  }

  if (!route) {
    const straightLine = haversineDistanceKm(origin, destination);
    const roadFactor = 1.32;
    route = {
      distanceKm: Number((straightLine * roadFactor).toFixed(2)),
      durationMin: Number((((straightLine * roadFactor) / 35) * 60).toFixed(1)),
      points: {
        type: 'LineString',
        coordinates: [
          [origin.lon, origin.lat],
          [destination.lon, destination.lat],
        ],
      },
    };
  }

  const traffic = buildTrafficProfile(origin, destination, departureTime, route.distanceKm, vehicleType);
  const adjustedDurationMin = Number((route.durationMin * traffic.multiplier * vehicle.speedMultiplier).toFixed(1));
  const fare = Math.round((route.distanceKm * vehicle.baseFarePerKm + Number(passengerCount) * 250) * traffic.multiplier);

  return {
    origin,
    destination,
    distanceKm: route.distanceKm,
    baseDurationMin: route.durationMin,
    adjustedDurationMin,
    points: route.points,
    fare,
    traffic,
    vehicleType,
  };
}

function buildTrafficProfile(origin, destination, departureTime, distanceKm, vehicleType) {
  const departure = departureTime ? new Date(departureTime) : new Date();
  const hour = departure.getHours();
  let multiplier = 1.0;
  const notes = [];

  if (hour >= 6 && hour < 9) {
    multiplier += 0.25;
    notes.push('Morning commute');
  }
  if (hour >= 16 && hour <= 19) {
    multiplier += 0.3;
    notes.push('Evening commute');
  }
  if (distanceKm > 90) {
    multiplier += 0.08;
    notes.push('Long inter-district trip');
  }

  const hotSpots = ['kigali', 'nyamirambo', 'remera', 'nyabugogo', 'kimironko', 'kacyiru', 'gikondo'];
  const routeText = `${origin.name} ${destination.name}`.toLowerCase();
  if (hotSpots.some((spot) => routeText.includes(spot))) {
    multiplier += 0.18;
    notes.push('High-traffic Kigali corridor');
  }
  if (vehicleType === 'bus') {
    multiplier += 0.05;
    notes.push('Bus traffic sensitivity');
  }

  let label = 'Light';
  if (multiplier >= 1.45) {
    label = 'Heavy';
  } else if (multiplier >= 1.2) {
    label = 'Moderate';
  }

  return {
    label,
    multiplier: Number(multiplier.toFixed(2)),
    notes,
    updatedAt: new Date().toISOString(),
  };
}

function handleError(res, error) {
  if (error.code === 'ECONNABORTED') {
    return res.status(504).json({ error: 'Request timed out. Please try again.' });
  }

  if (error.response) {
    const status = error.response.status;
    if (status === 429) {
      return res.status(429).json({ error: 'A map service rate limit was reached. Try again shortly.' });
    }
    if (status === 403) {
      return res.status(403).json({ error: 'Map service rejected the request. Check your API key.' });
    }
  }

  console.error('Unexpected error:', error.message);
  return res.status(500).json({ error: 'Server error. Please try again later.' });
}