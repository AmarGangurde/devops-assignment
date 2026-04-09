const { Counter, Histogram } = require('prom-client');

const chatRequestsTotal = new Counter({
  name: 'supachat_chat_requests_total',
  help: 'Total number of chat requests',
  labelNames: ['status'],
});

const chatLatency = new Histogram({
  name: 'supachat_chat_duration_seconds',
  help: 'Duration of chat request processing',
  labelNames: ['status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
});

const httpRequestDuration = new Histogram({
  name: 'supachat_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

function requestMetrics(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode,
      },
      duration
    );
  });
  next();
}

module.exports = { chatRequestsTotal, chatLatency, requestMetrics };
