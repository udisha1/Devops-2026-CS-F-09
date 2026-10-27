/**
 * Node.js Traffic Generator for Taskflow
 * 
 * Generates continuous synthetic requests against the Taskflow API
 * so that Prometheus captures metrics and Grafana graphs light up with live data.
 * 
 * Usage:
 *   node monitoring/generate-traffic.js
 *   node monitoring/generate-traffic.js http://localhost:5000
 */

const TARGET_URL = process.argv[2] || process.env.TARGET_URL || 'http://localhost:5001';

console.log(`[Traffic Generator] Target API: ${TARGET_URL}`);
console.log(`[Traffic Generator] Simulating user traffic... Press Ctrl+C to stop.`);

let totalRequests = 0;
let errors = 0;

async function sendRequest(method, path, body = null, token = null) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = {
      method,
      headers,
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${TARGET_URL}${path}`, options);
    totalRequests++;
    return { status: res.status, ok: res.ok, data: await res.json().catch(() => ({})) };
  } catch (err) {
    errors++;
    return { status: 500, ok: false, error: err.message };
  }
}

async function simulateUserSession() {
  // 1. Health check
  await sendRequest('GET', '/healthz');

  // 2. Register / Login
  const uniqueId = Math.random().toString(36).substring(7);
  const email = `mock_${uniqueId}@example.com`;
  const password = 'password123';

  const regRes = await sendRequest('POST', '/api/auth/register', {
    name: `User_${uniqueId}`,
    email,
    password,
  });

  const token = regRes?.data?.token;

  if (token) {
    // 3. Query tasks
    await sendRequest('GET', '/api/tasks', null, token);

    // 4. Create tasks
    const priorities = ['High', 'Medium', 'Low'];
    const categories = ['Work', 'Study', 'Personal'];
    await sendRequest('POST', '/api/tasks', {
      title: `Task ${uniqueId}`,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      status: 'pending',
    }, token);

    // 5. Query today tasks
    await sendRequest('GET', '/api/tasks/today', null, token);
  } else {
    // Unauthenticated requests for status code variation (401s)
    await sendRequest('GET', '/api/tasks');
  }

  // Print progress every 15 requests
  if (totalRequests % 15 === 0) {
    console.log(`[Live Stats] Sent ${totalRequests} requests (${errors} connection errors)`);
  }
}

// Concurrently run 5 simulated virtual users in loops with jitter
const VIRTUAL_USERS = 5;
for (let i = 0; i < VIRTUAL_USERS; i++) {
  (async function loop() {
    while (true) {
      await simulateUserSession();
      // Sleep between 200ms and 800ms
      await new Promise((r) => setTimeout(r, Math.random() * 600 + 200));
    }
  })();
}
