import http from 'k6/http';
import { check, sleep } from 'k6';

// k6 Load Test Configuration
export const options = {
  stages: [
    { duration: '30s', target: 15 },  // Ramp-up to 15 concurrent users
    { duration: '1m',  target: 35 },  // Sustain steady load with 35 users
    { duration: '30s', target: 70 },  // Traffic spike up to 70 users
    { duration: '30s', target: 0 },   // Graceful cool-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'], // 95% of requests should complete under 1.5s
    http_req_failed: ['rate<0.10'],     // Less than 10% errors
  },
};

// Target backend URL: defaults to localhost:5001 for local host testing,
// or http://taskflow-server:5000 if running inside the Docker network.
const BASE_URL = __ENV.TARGET_URL || 'http://localhost:5001';

export default function () {
  // 1. Health & Status Check Endpoint
  const healthRes = http.get(`${BASE_URL}/healthz`);
  check(healthRes, {
    'healthz responded with 200': (r) => r.status === 200,
  });

  // 2. User Registration & Authentication Flow
  const uniqueId = `${__VU}_${__ITER}_${Date.now()}`;
  const userPayload = JSON.stringify({
    name: `LoadUser_${__VU}`,
    email: `loadtest_${uniqueId}@example.com`,
    password: 'password123',
  });

  const regRes = http.post(`${BASE_URL}/api/auth/register`, userPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  let token = null;
  if (regRes.status === 201) {
    try {
      token = regRes.json('token');
    } catch (e) {}
  }

  // 3. Authenticated Task Operations (if token acquired)
  if (token) {
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // Query tasks
    const getRes = http.get(`${BASE_URL}/api/tasks`, { headers: authHeaders });
    check(getRes, { 'GET /api/tasks succeeded': (r) => r.status === 200 });

    // Create a new task
    const priorities = ['High', 'Medium', 'Low'];
    const categories = ['Work', 'Study', 'Personal'];
    const selectedPriority = priorities[Math.floor(Math.random() * priorities.length)];
    const selectedCategory = categories[Math.floor(Math.random() * categories.length)];

    const taskPayload = JSON.stringify({
      title: `Simulated Task ${__ITER} from VU ${__VU}`,
      priority: selectedPriority,
      category: selectedCategory,
      status: 'pending',
    });

    const createRes = http.post(`${BASE_URL}/api/tasks`, taskPayload, { headers: authHeaders });
    check(createRes, { 'POST /api/tasks created': (r) => r.status === 201 });

    // Query today's tasks
    http.get(`${BASE_URL}/api/tasks/today`, { headers: authHeaders });
  } else {
    // Fallback: If DB is unreachable or auth skipped, hit root endpoint to generate traffic metrics
    http.get(`${BASE_URL}/`);
  }

  // Realistic human think time between 0.3s and 1.2s
  sleep(Math.random() * 0.9 + 0.3);
}
