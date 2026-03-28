// script.js for Public Transport Route Optimizer
// Handles form submission, fetches route, and displays results/errors

document.getElementById('routeForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const start = document.getElementById('start').value;
  const end = document.getElementById('end').value;
  const resultDiv = document.getElementById('result');
  const errorDiv = document.getElementById('error');
  resultDiv.innerHTML = '';
  errorDiv.textContent = '';

  // Input validation
  if (!start || !end) {
    errorDiv.textContent = 'Please select both start and end cities.';
    return;
  }
  if (start === end) {
    errorDiv.textContent = 'Start and end cities must be different.';
    return;
  }

  try {
    const response = await fetch('/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start, end })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Unknown error');
    }
    // Display route info
    resultDiv.innerHTML = `
      <h2>Route Info</h2>
      <p><strong>Distance:</strong> ${data.distance} km</p>
      <p><strong>Duration:</strong> ${data.duration} minutes</p>
      <p><strong>Estimated Cost:</strong> ${data.cost} RWF</p>
    `;
  } catch (err) {
    errorDiv.textContent = err.message || 'Failed to fetch route. Please try again.';
  }
});
