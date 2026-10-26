// API Configuration for local dev, Docker, and Kubernetes
// If VITE_API_URL is provided at build/runtime, use it. Otherwise, use relative path ''
// which allows Nginx reverse proxy / Ingress to handle routing seamlessly.
const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined 
  ? import.meta.env.VITE_API_URL 
  : '';

export const API_URL = `${API_BASE_URL}/api/tasks`;
export const AUTH_URL = `${API_BASE_URL}/api/auth`;
export const FEYNMAN_URL = `${API_BASE_URL}/api/feynman`;
export const PARSE_TASK_URL = `${API_BASE_URL}/api/parse-task`;

export default {
  API_BASE_URL,
  API_URL,
  AUTH_URL,
  FEYNMAN_URL,
  PARSE_TASK_URL,
};
