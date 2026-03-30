// script.js — Public Transport Route Optimizer
// Handles city loading, form submission, multi-mode results, and sorting.
 
// ── State ──────────────────────────────────────────────────────────────────
let allResults   = [];  // holds all fetched route results for sorting
let currentSort  = 'distance';
 
// ── Load cities from server ────────────────────────────────────────────────
async function loadCities() {
  try {
    const res    = await fetch('/cities');
    const cities = await res.json();
    const startEl = document.getElementById('start');
    const endEl   = document.getElementById('end');
 
    cities.forEach(city => {
      startEl.appendChild(new Option(city, city));
      endEl.appendChild(new Option(city, city));
    });
  } catch {
    showError('Could not load city list. Please refresh the page.');
  }
}
 
// ── Fetch a single route ───────────────────────────────────────────────────
async function fetchRoute(start, end, profile) {
  const res  = await fetch('/route', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ start, end, profile }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unknown error');
  return data;
}
 
// ── Form submit — fetch all 3 modes in parallel ───────────────────────────
document.getElementById('routeForm').addEventListener('submit', async function (e) {
  e.preventDefault();
 
  const start   = document.getElementById('start').value;
  const end     = document.getElementById('end').value;
  const profile = document.querySelector('input[name="profile"]:checked').value;
  const btn     = document.getElementById('submitBtn');
 
  clearError();
  hideResults();
 
  if (!start || !end) { showError('Please select both start and end cities.'); return; }
  if (start === end)  { showError('Start and end cities must be different.');  return; }
 
  btn.disabled    = true;
  btn.textContent = 'Calculating…';
 
  try {
    // Fetch the selected mode plus the other two for comparison
    const profiles = ['driving-car', 'cycling-regular', 'foot-walking'];
    const results  = await Promise.allSettled(
      profiles.map(p => fetchRoute(start, end, p))
    );
 
    allResults = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);
 
    if (allResults.length === 0) {
      throw new Error('Could not calculate any route between these cities.');
    }
 
    // Highlight the mode the user actually selected
    const primary = allResults.find(r =>
      r.profile === { 'driving-car': 'Car', 'cycling-regular': 'Bicycle', 'foot-walking': 'Walking' }[profile]
    ) || allResults[0];
 
    renderResults(currentSort, primary);
 
  } catch (err) {
    showError(err.message || 'Failed to fetch route. Please try again.');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Get Route';
  }
});
 
// ── Sort buttons ───────────────────────────────────────────────────────────
document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSort = btn.dataset.sort;
    renderResults(currentSort);
  });
});
 
// ── Render results table + highlighted card ────────────────────────────────
function renderResults(sortKey, highlight = null) {
  const sorted = [...allResults].sort((a, b) => {
    if (sortKey === 'cost')     return a.cost     - b.cost;
    if (sortKey === 'duration') return parseFloat(a.duration) - parseFloat(b.duration);
    return parseFloat(a.distance) - parseFloat(b.distance); // default: distance
  });
 
  const tbody = document.getElementById('resultsBody');
  tbody.innerHTML = sorted.map(r => `
    <tr class="${highlight && r.profile === highlight.profile ? 'row-highlight' : ''}">
      <td>${r.profile}</td>
      <td>${r.distance} km</td>
      <td>${r.duration} min</td>
      <td>${r.cost > 0 ? r.cost + ' RWF' : 'Free'}</td>
    </tr>
  `).join('');
 
  // Best option card (top result after sorting)
  const best = sorted[0];
  document.getElementById('resultCard').innerHTML = `
    <div class="card-label">Best by ${sortKey}</div>
    <div class="card-title">${best.start} → ${best.end}</div>
    <div class="card-stats">
      <div class="card-stat"><span class="stat-num">${best.distance}</span><span class="stat-unit">km</span></div>
      <div class="card-divider"></div>
      <div class="card-stat"><span class="stat-num">${best.duration}</span><span class="stat-unit">min</span></div>
      <div class="card-divider"></div>
      <div class="card-stat"><span class="stat-num">${best.cost > 0 ? best.cost : '–'}</span><span class="stat-unit">${best.cost > 0 ? 'RWF' : 'Free'}</span></div>
    </div>
    <div class="card-mode">via ${best.profile}</div>
  `;
 
  document.getElementById('result').classList.remove('hidden');
}
 
// ── Helpers ────────────────────────────────────────────────────────────────
function showError(msg) {
  const el = document.getElementById('error');
  el.textContent = msg;
  el.classList.remove('hidden');
}
 
function clearError() {
  const el = document.getElementById('error');
  el.textContent = '';
  el.classList.add('hidden');
}
 
function hideResults() {
  document.getElementById('result').classList.add('hidden');
}
 
// ── Init ───────────────────────────────────────────────────────────────────
loadCities();