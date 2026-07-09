const state = {
  catalog: {
    provinces: [],
    places: [],
    vehicleTypes: [],
    serviceProviders: [],
  },
  dashboard: { bookings: [], drivers: [], users: [] },
  user: null,
  token: localStorage.getItem('rwandaBookingToken') || '',
  authMode: 'login',
  map: null,
  provinceLayer: null,
  providerLayer: null,
  bookingLayer: null,
};

const els = {};

document.addEventListener('DOMContentLoaded', bootstrap);

function bootstrap() {
  cacheElements();
  bindEvents();

  Promise.all([loadCatalog(), restoreSession()])
    .then(refreshView)
    .catch((error) => showMessage(els.authMessage, error.message || 'Failed to initialize the booking platform.', 'error'));
}

function cacheElements() {
  els.authScreen = document.getElementById('authScreen');
  els.appScreen = document.getElementById('appScreen');
  els.statsGrid = document.getElementById('statsGrid');
  els.provinceCount = document.getElementById('provinceCount');
  els.providerCount = document.getElementById('providerCount');
  els.provinceCountApp = document.getElementById('provinceCountApp');
  els.customerCount = document.getElementById('customerCount');
  els.openLoginBtn = document.getElementById('openLoginBtn');
  els.openSignupBtn = document.getElementById('openSignupBtn');
  els.authForm = document.getElementById('authForm');
  els.authSubmit = document.getElementById('authSubmit');
  els.authMessage = document.getElementById('authMessage');
  els.authModeLogin = document.getElementById('loginTab');
  els.authModeSignup = document.getElementById('signupTab');
  els.authNameWrap = document.getElementById('authNameWrap');
  els.authPhoneWrap = document.getElementById('authPhoneWrap');
  els.authRoleWrap = document.getElementById('authRoleWrap');
  els.authName = document.getElementById('authName');
  els.authEmail = document.getElementById('authEmail');
  els.authPhone = document.getElementById('authPhone');
  els.authPassword = document.getElementById('authPassword');
  els.authRole = document.getElementById('authRole');
  els.sessionChip = document.getElementById('sessionChip');
  els.logoutBtn = document.getElementById('logoutBtn');
  els.bookingForm = document.getElementById('bookingForm');
  els.bookingSubmit = document.getElementById('bookingSubmit');
  els.bookingMessage = document.getElementById('bookingMessage');
  els.bookingState = document.getElementById('bookingState');
  els.pickupLocation = document.getElementById('pickupLocation');
  els.dropoffLocation = document.getElementById('dropoffLocation');
  els.vehicleType = document.getElementById('vehicleType');
  els.preferredDriverId = document.getElementById('preferredDriverId');
  els.passengerCount = document.getElementById('passengerCount');
  els.departureTime = document.getElementById('departureTime');
  els.contactPhone = document.getElementById('contactPhone');
  els.paymentMethod = document.getElementById('paymentMethod');
  els.pickupNote = document.getElementById('pickupNote');
  els.dropoffNote = document.getElementById('dropoffNote');
  els.provinceGrid = document.getElementById('provinceGrid');
  els.provinceGridCopy = document.getElementById('provinceGridCopy');
  els.providerGrid = document.getElementById('providerGrid');
  els.customerGrid = document.getElementById('customerGrid');
  els.bookingFeed = document.getElementById('bookingFeed');
}

function bindEvents() {
  els.openLoginBtn.addEventListener('click', () => openAuthForm('login'));
  els.openSignupBtn.addEventListener('click', () => openAuthForm('signup'));
  els.authModeLogin.addEventListener('click', () => setAuthMode('login'));
  els.authModeSignup.addEventListener('click', () => setAuthMode('signup'));
  els.authForm.addEventListener('submit', handleAuthSubmit);
  els.bookingForm.addEventListener('submit', handleBookingSubmit);
  els.vehicleType.addEventListener('change', () => populateProviderSelect());
  if (els.logoutBtn) {
    els.logoutBtn.addEventListener('click', logout);
  }
}

async function loadCatalog() {
  const catalog = await fetchJson('/api/catalog');
  state.catalog = catalog;

  populateLocationSelects();
  populateVehicleSelect();
  populateProviderSelect();
  renderProvinceCoverage();
}

async function restoreSession() {
  if (!state.token) {
    setAuthMode('login');
    setBookingAvailability(false);
    return;
  }

  try {
    const payload = await fetchJson('/api/me', {
      headers: authHeaders(),
    });
    state.user = payload.user;
    await refreshDashboardData();
    setAuthMode('login');
    setBookingAvailability(state.user.role === 'customer');
  } catch {
    logout(false);
  }
}

async function refreshDashboardData() {
  state.dashboard = await fetchJson('/api/dashboard');

  if (state.user?.role === 'driver') {
    const summary = await fetchJson('/api/driver/summary', { headers: authHeaders() });
    state.driverSummary = summary;
  } else if (state.user?.role === 'customer') {
    const result = await fetchJson('/api/bookings', { headers: authHeaders() });
    state.myBookings = result.bookings || [];
  } else {
    state.driverSummary = null;
    state.myBookings = [];
  }

  await loadCatalog();
}

function refreshView() {
  renderStats();
  renderSessionState();
  renderProviders();
  renderCustomers();
  renderBookings();
  updateMapLayers();
}

function renderStats() {
  const bookings = state.user?.role === 'driver'
    ? (state.driverSummary?.assignedBookings || []).length + (state.driverSummary?.pendingBookings || []).length
    : state.dashboard.bookings.length;
  const activeProviders = state.catalog.serviceProviders.filter((provider) => provider.status === 'available').length;
  const customerCount = state.dashboard.users.filter((user) => user.role === 'customer').length;
  const provinceTotal = String(state.catalog.provinces.length || 5);

  els.provinceCount.textContent = provinceTotal;
  if (els.provinceCountApp) {
    els.provinceCountApp.textContent = provinceTotal;
  }
  els.providerCount.textContent = String(state.catalog.serviceProviders.length || 0);
  if (els.customerCount) {
    els.customerCount.textContent = String(customerCount);
  }

  els.statsGrid.innerHTML = [
    statCard('Provinces', String(state.catalog.provinces.length || 5), 'All Rwanda provinces available for booking'),
    statCard('Providers', String(state.catalog.serviceProviders.length || 0), `${activeProviders} available service providers`),
    statCard('Vehicles', String(state.catalog.vehicleTypes.length || 0), 'Minibuses and buses in one place'),
    statCard('Bookings', String(bookings), state.user ? 'Live account data' : 'Public booking feed'),
  ].join('');
}

function renderSessionState() {
  const authenticated = Boolean(state.user);
  document.body.classList.toggle('is-guest', !authenticated);

  if (els.authScreen) {
    els.authScreen.classList.toggle('hidden', authenticated);
  }

  if (els.appScreen) {
    els.appScreen.classList.toggle('hidden', !authenticated);
  }

  if (!state.user) {
    if (els.logoutBtn) {
      els.logoutBtn.classList.add('hidden');
    }
    els.sessionChip.classList.add('hidden');
    els.bookingState.textContent = 'Guest';
    els.bookingState.className = 'status-pill dark';
    setBookingAvailability(false);
    showAuthForm(false);
    els.authMessage.textContent = 'Log in or sign up to continue into the booking workspace.';
    return;
  }

  if (els.logoutBtn) {
    els.logoutBtn.classList.remove('hidden');
  }
  els.sessionChip.classList.remove('hidden');
  els.sessionChip.textContent = `${state.user.name} · ${state.user.role === 'driver' ? 'Service provider' : 'Client'}`;
  els.bookingState.textContent = state.user.role === 'driver' ? 'Provider' : 'Client';
  els.bookingState.className = state.user.role === 'driver' ? 'status-pill dark' : 'status-pill';
  els.authMessage.textContent = `Signed in as ${state.user.role === 'driver' ? 'service provider' : 'client'}.`;
  setBookingAvailability(state.user.role === 'customer');

  if (state.user.phone) {
    els.contactPhone.value = state.user.phone;
  }

  ensureMap();
}

function renderProviders() {
  const providers = state.catalog.serviceProviders;
  const latestBookingByProvider = state.dashboard.bookings.reduce((latest, booking) => {
    const providerId = booking.driverId || booking.serviceProviderId;
    if (!providerId) {
      return latest;
    }
    if (!latest[providerId]) {
      latest[providerId] = booking;
    }
    return latest;
  }, {});

  els.providerGrid.innerHTML = providers.map((provider) => {
    const vehicleLabel = provider.vehicleType === 'bus' ? 'Bus' : 'Mini bus';
    const statusClass = provider.status === 'available' ? 'status-pill' : 'status-pill warn';
    const location = provider.currentLocation?.label || 'Rwanda';
    const linkedBooking = latestBookingByProvider[provider.id];
    return `
      <article class="booking-tile">
        <div class="tile-head">
          <strong>${escapeHtml(provider.name)}</strong>
          <span class="${statusClass}">${escapeHtml(provider.status)}</span>
        </div>
        <div class="tile-route">${escapeHtml(vehicleLabel)}</div>
        <p class="tile-meta">${escapeHtml(location)} · ${escapeHtml(provider.phone || 'No phone listed')}</p>
        <div class="tile-grid">
          <div><span>Role</span><strong>Service provider</strong></div>
          <div><span>Vehicle</span><strong>${escapeHtml(vehicleLabel)}</strong></div>
          <div><span>Latest client</span><strong>${escapeHtml(linkedBooking ? linkedBooking.customerName : 'No linked client yet')}</strong></div>
          <div><span>Route</span><strong>${escapeHtml(linkedBooking ? `${linkedBooking.pickup} → ${linkedBooking.dropoff}` : 'No trip assigned yet')}</strong></div>
        </div>
      </article>
    `;
  }).join('') || '<div class="empty-state">No service providers have been added yet.</div>';
}

function renderCustomers() {
  const customers = state.dashboard.users.filter((user) => user.role === 'customer');
  const bookingCounts = state.dashboard.bookings.reduce((counts, booking) => {
    counts[booking.customerId] = (counts[booking.customerId] || 0) + 1;
    return counts;
  }, {});
  const latestBookingByCustomer = state.dashboard.bookings.reduce((latest, booking) => {
    if (!latest[booking.customerId]) {
      latest[booking.customerId] = booking;
    }
    return latest;
  }, {});

  els.customerGrid.innerHTML = customers.map((customer) => {
    const latestBooking = latestBookingByCustomer[customer.id];
    return `
      <article class="booking-tile">
        <div class="tile-head">
          <strong>${escapeHtml(customer.name)}</strong>
          <span class="status-pill">Client</span>
        </div>
        <p class="tile-meta">${escapeHtml(customer.email || 'No email listed')}</p>
        <div class="tile-grid">
          <div><span>Bookings</span><strong>${escapeHtml(String(bookingCounts[customer.id] || 0))}</strong></div>
          <div><span>Status</span><strong>${escapeHtml(latestBooking ? latestBooking.status : 'Ready')}</strong></div>
          <div><span>Latest route</span><strong>${escapeHtml(latestBooking ? `${latestBooking.pickup} → ${latestBooking.dropoff}` : 'No booking yet')}</strong></div>
          <div><span>Phone</span><strong>${escapeHtml(customer.phone || 'Not shared')}</strong></div>
          <div><span>Linked provider</span><strong>${escapeHtml(latestBooking ? (latestBooking.driverName || latestBooking.serviceProviderName || 'Auto assign pending') : 'No provider yet')}</strong></div>
          <div><span>Provider status</span><strong>${escapeHtml(latestBooking ? latestBooking.status : 'No trip assigned yet')}</strong></div>
        </div>
      </article>
    `;
  }).join('') || '<div class="empty-state">No customers are registered yet.</div>';
}

function renderBookings() {
  const bookings = state.user?.role === 'driver'
    ? [...(state.driverSummary?.pendingBookings || []), ...(state.driverSummary?.assignedBookings || [])]
    : state.user?.role === 'customer'
      ? state.myBookings
      : state.dashboard.bookings;

  els.bookingFeed.innerHTML = bookings.slice(0, 8).map((booking) => {
    const statusClass = booking.status === 'accepted'
      ? 'status-pill'
      : booking.status === 'assigned'
        ? 'status-pill dark'
        : 'status-pill warn';
    const route = `${booking.pickup} → ${booking.dropoff}`;
    const provider = booking.driverName || booking.serviceProviderName || 'Auto assigned';
    const customer = booking.customerName || 'Unknown client';
    return `
      <article class="booking-tile${booking.status === 'accepted' ? ' compact' : ''}">
        <div class="tile-head">
          <strong>${escapeHtml(route)}</strong>
          <span class="${statusClass}">${escapeHtml(booking.status)}</span>
        </div>
        <p class="tile-meta">${escapeHtml(customer)} linked to ${escapeHtml(provider)} · ${escapeHtml(booking.vehicleType === 'bus' ? 'Bus' : 'Mini bus')}</p>
        <div class="tile-grid">
          <div><span>Passengers</span><strong>${escapeHtml(String(booking.passengerCount || 1))}</strong></div>
          <div><span>Payment</span><strong>${escapeHtml(booking.paymentMethod || 'mobile-money')}</strong></div>
          <div><span>Created</span><strong>${escapeHtml(formatDate(booking.createdAt))}</strong></div>
          <div><span>Trip ref</span><strong>${escapeHtml((booking.paymentReference || booking.id || '').slice(0, 12))}</strong></div>
        </div>
      </article>
    `;
  }).join('') || '<div class="empty-state">Bookings will appear here once clients start booking trips.</div>';
}

function renderProvinceCoverage() {
  const chips = state.catalog.provinces.map((province) => `
    <span class="province-chip">${escapeHtml(province.name)}</span>
  `).join('');

  els.provinceGrid.innerHTML = chips;
  if (els.provinceGridCopy) {
    els.provinceGridCopy.innerHTML = chips;
  }
}

function populateLocationSelects() {
  const options = state.catalog.places
    .map((place) => `<option value="${escapeHtml(place.name)}">${escapeHtml(place.name)}</option>`)
    .join('');

  els.pickupLocation.innerHTML = `<option value="">Choose pickup location</option>${options}`;
  els.dropoffLocation.innerHTML = `<option value="">Choose destination</option>${options}`;
}

function populateVehicleSelect() {
  const options = state.catalog.vehicleTypes.map((vehicle) => `
    <option value="${escapeHtml(vehicle.id)}">${escapeHtml(vehicle.label)} · ${vehicle.capacity} seats</option>
  `).join('');

  els.vehicleType.innerHTML = options;
  if (!els.vehicleType.value && state.catalog.vehicleTypes[0]) {
    els.vehicleType.value = state.catalog.vehicleTypes[0].id;
  }
}

function populateProviderSelect() {
  const vehicleType = els.vehicleType.value || 'mini-bus';
  const providers = state.catalog.serviceProviders.filter((provider) => provider.vehicleType === vehicleType && provider.status === 'available');

  const providerOptions = providers.map((provider) => `
    <option value="${escapeHtml(provider.id)}">${escapeHtml(provider.name)} · ${escapeHtml(provider.vehicleType === 'bus' ? 'Bus' : 'Mini bus')}</option>
  `).join('');

  els.preferredDriverId.innerHTML = `<option value="">Auto assign available provider</option>${providerOptions}`;
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const payload = {
    email: els.authEmail.value.trim(),
    password: els.authPassword.value,
  };

  if (!payload.email || !payload.password) {
    showMessage(els.authMessage, 'Email and password are required.', 'error');
    return;
  }

  if (state.authMode === 'signup') {
    payload.name = els.authName.value.trim();
    payload.phone = els.authPhone.value.trim();
    payload.role = els.authRole.value;
    if (!payload.name) {
      showMessage(els.authMessage, 'Full name is required for sign up.', 'error');
      return;
    }
  }

  const endpoint = state.authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
  try {
    const response = await fetchJson(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    state.token = response.token;
    state.user = response.user;
    localStorage.setItem('rwandaBookingToken', response.token);

    await refreshDashboardData();
    renderViewAfterAuth();
    showMessage(els.authMessage, state.authMode === 'login' ? 'Logged in successfully.' : 'Account created successfully.', 'success');
  } catch (error) {
    showMessage(els.authMessage, error.message || 'Authentication failed.', 'error');
  }
}

async function handleBookingSubmit(event) {
  event.preventDefault();

  if (!state.user) {
    showMessage(els.bookingMessage, 'Log in as a client before booking a trip.', 'error');
    return;
  }

  if (state.user.role !== 'customer') {
    showMessage(els.bookingMessage, 'Only clients can create bookings. Service providers can manage assignments after logging in.', 'error');
    return;
  }

  const payload = {
    pickup: els.pickupLocation.value,
    dropoff: els.dropoffLocation.value,
    passengerCount: Number(els.passengerCount.value || 1),
    vehicleType: els.vehicleType.value,
    preferredDriverId: els.preferredDriverId.value,
    paymentMethod: els.paymentMethod.value,
    departureTime: els.departureTime.value,
    pickupNote: els.pickupNote.value.trim(),
    dropoffNote: els.dropoffNote.value.trim(),
    contactPhone: els.contactPhone.value.trim(),
  };

  if (!payload.pickup || !payload.dropoff) {
    showMessage(els.bookingMessage, 'Choose both pickup and destination locations.', 'error');
    return;
  }

  try {
    const result = await fetchJson('/api/bookings', {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify(payload),
    });

    showMessage(els.bookingMessage, `Booking created for ${result.booking.pickup} → ${result.booking.dropoff}.`, 'success');
    els.bookingForm.reset();
    els.vehicleType.value = state.catalog.vehicleTypes[0]?.id || 'mini-bus';
    await refreshDashboardData();
    refreshView();
  } catch (error) {
    showMessage(els.bookingMessage, error.message || 'Could not create the booking.', 'error');
  }
}

function setAuthMode(mode) {
  state.authMode = mode;
  els.authModeLogin.classList.toggle('active', mode === 'login');
  els.authModeSignup.classList.toggle('active', mode === 'signup');
  els.authSubmit.textContent = mode === 'login' ? 'Log in' : 'Create account';
  els.authNameWrap.classList.toggle('hidden', mode === 'login');
  els.authPhoneWrap.classList.toggle('hidden', mode === 'login');
  els.authRoleWrap.classList.toggle('hidden', mode === 'login');
  els.authMessage.textContent = mode === 'login'
    ? 'Clients log in to book trips. Service providers log in to manage assignments.'
    : 'Create a client account or register as a service provider for minibuses or buses.';
}

function openAuthForm(mode) {
  setAuthMode(mode);
  showAuthForm(true);
}

function showAuthForm(visible) {
  if (!els.authForm) {
    return;
  }

  els.authForm.classList.toggle('hidden', !visible);
}

function setBookingAvailability(enabled) {
  els.bookingSubmit.disabled = !enabled;
  Array.from(els.bookingForm.querySelectorAll('input, select, button')).forEach((element) => {
    if (element.id === 'bookingSubmit') {
      element.disabled = !enabled;
      return;
    }
    if (element.tagName === 'BUTTON') {
      return;
    }
    element.disabled = !enabled;
  });

  if (enabled) {
    els.bookingMessage.textContent = '';
  } else {
    els.bookingMessage.textContent = 'Log in as a client to create a booking.';
  }
}

function renderViewAfterAuth() {
  renderStats();
  renderSessionState();
  showAuthForm(false);
  renderProviders();
  renderCustomers();
  renderBookings();
  updateMapLayers();
}

function logout(updateMessage = true) {
  state.user = null;
  state.token = '';
  state.driverSummary = null;
  state.myBookings = [];
  localStorage.removeItem('rwandaBookingToken');
  renderSessionState();
  refreshView();
  if (updateMessage) {
    showMessage(els.authMessage, 'Logged out.', 'success');
  }
}

function ensureMap() {
  if (!state.map) {
    initMap();
    return;
  }

  state.map.invalidateSize();
  updateMapLayers();
}

function initMap() {
  if (typeof L === 'undefined' || !document.getElementById('mapCanvas')) {
    return;
  }

  state.map = L.map('mapCanvas', { scrollWheelZoom: false }).setView([-1.94, 29.87], 8.3);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  }).addTo(state.map);

  state.provinceLayer = L.layerGroup().addTo(state.map);
  state.providerLayer = L.layerGroup().addTo(state.map);
  state.bookingLayer = L.layerGroup().addTo(state.map);

  updateMapLayers();
}

function updateMapLayers() {
  if (!state.map) {
    return;
  }

  state.provinceLayer.clearLayers();
  state.providerLayer.clearLayers();
  state.bookingLayer.clearLayers();

  state.catalog.provinces.forEach((province) => {
    L.circleMarker([province.center.lat, province.center.lon], {
      radius: 10,
      color: '#0f5f4f',
      fillColor: '#11834f',
      fillOpacity: 0.35,
      weight: 2,
    })
      .bindPopup(`<strong>${escapeHtml(province.name)}</strong><br/>Province center`)
      .addTo(state.provinceLayer);
  });

  state.catalog.serviceProviders.forEach((provider) => {
    if (!provider.currentLocation) {
      return;
    }
    L.circleMarker([provider.currentLocation.lat, provider.currentLocation.lon], {
      radius: provider.vehicleType === 'bus' ? 9 : 7,
      color: provider.vehicleType === 'bus' ? '#233b8c' : '#c47f2c',
      fillColor: provider.vehicleType === 'bus' ? '#233b8c' : '#c47f2c',
      fillOpacity: 0.75,
      weight: 2,
    })
      .bindPopup(`<strong>${escapeHtml(provider.name)}</strong><br/>${escapeHtml(provider.vehicleType === 'bus' ? 'Bus' : 'Mini bus')} · ${escapeHtml(provider.status)}`)
      .addTo(state.providerLayer);
  });
}

function authHeaders() {
  return {
    Authorization: `Bearer ${state.token}`,
  };
}

function authJsonHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${state.token}`,
  };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed.');
  }

  return data;
}

function statCard(label, value, detail) {
  return `
    <article class="stat-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <p class="inline-note">${escapeHtml(detail)}</p>
    </article>
  `;
}

function showMessage(element, message, tone) {
  element.textContent = message;
  element.dataset.tone = tone || 'neutral';
}

function formatDate(value) {
  if (!value) {
    return 'Now';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Now';
  }

  return date.toLocaleDateString('en-RW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}