const client = require('prom-client');
const mongoose = require('mongoose');

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'taskflow-server',
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register, prefix: 'taskflow_' });

// HTTP Request Duration Histogram
const httpRequestDurationSeconds = new client.Histogram({
  name: 'taskflow_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 1.5, 2, 5, 10],
});
register.registerMetric(httpRequestDurationSeconds);

// HTTP Requests Total Counter
const httpRequestsTotal = new client.Counter({
  name: 'taskflow_http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestsTotal);

// Active Requests Gauge
const httpActiveRequests = new client.Gauge({
  name: 'taskflow_http_active_requests',
  help: 'Number of currently active HTTP requests',
  labelNames: ['method'],
});
register.registerMetric(httpActiveRequests);

// MongoDB Status Gauge
const mongoStatusGauge = new client.Gauge({
  name: 'taskflow_mongodb_connected',
  help: 'MongoDB connection status (1 = connected, 0 = disconnected)',
  collect() {
    const isReady = mongoose.connection.readyState === 1 ? 1 : 0;
    this.set(isReady);
  },
});
register.registerMetric(mongoStatusGauge);

// Helper to normalize path to avoid high cardinality metrics
function normalizePath(req) {
  if (req.baseUrl || req.path) {
    const path = (req.baseUrl || '') + (req.path || '');
    // Replace MongoDB ObjectIds (24 hex characters) with :id
    return path.replace(/[0-9a-fA-F]{24}/g, ':id') || '/';
  }
  return req.url ? req.url.split('?')[0] : '/';
}

// Middleware to measure request duration and counts
function metricsMiddleware(req, res, next) {
  // Ignore metrics endpoint scraping itself to avoid polluting stats
  if (req.path === '/metrics') {
    return next();
  }

  const endTimer = httpRequestDurationSeconds.startTimer();
  httpActiveRequests.inc({ method: req.method });

  res.on('finish', () => {
    httpActiveRequests.dec({ method: req.method });
    const route = normalizePath(req);
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode,
    };
    endTimer(labels);
    httpRequestsTotal.inc(labels);
  });

  next();
}

// Controller for /metrics endpoint
async function metricsEndpoint(req, res) {
  try {
    res.setHeader('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

module.exports = {
  metricsMiddleware,
  metricsEndpoint,
  register,
};
