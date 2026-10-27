import http from 'k6/http';
import { check, sleep } from 'k6';

// 45-Second Fast Traffic Generator for live Grafana demonstration
export const options = {
  stages: [
    { duration: '10s', target: 25 }, // Fast ramp-up to 25 users
    { duration: '25s', target: 50 }, // Heavy traffic 50 users
    { duration: '10s', target: 0 },  // Quick ramp-down
  ],
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:5001';

export default function () {
  // Hit healthz and API root
  http.get(`${BASE_URL}/healthz`);
  http.get(`${BASE_URL}/`);

  // Hit tasks endpoint (even unauthenticated returns 401, which gives status code variety in Grafana!)
  http.get(`${BASE_URL}/api/tasks`);

  sleep(0.2);
}
