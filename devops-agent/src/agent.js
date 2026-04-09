require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const OpenAI = require('openai');
const { createLogger, format, transports } = require('winston');
const cors = require('cors');

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  defaultMeta: { service: 'devops-agent' },
  transports: [new transports.Console()],
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const SERVICES = {
  backend: process.env.BACKEND_URL || 'http://backend:3001',
  frontend: process.env.FRONTEND_URL || 'http://frontend:3000',
  loki: process.env.LOKI_URL || 'http://loki:3100',
  prometheus: process.env.PROMETHEUS_URL || 'http://prometheus:9090',
  nginx: process.env.NGINX_URL || 'http://nginx:80',
  grafana: process.env.GRAFANA_URL || 'http://grafana:3000',
  promtail: process.env.PROMTAIL_URL || 'http://promtail:9080',
};

// In-memory health state
const healthState = {};
const incidentHistory = [];

// ─── Health Check ────────────────────────────────────────────────────────────

async function checkServiceHealth(name, url) {
  const healthUrl = name === 'backend' ? `${url}/health`
    : name === 'frontend' ? `${url}/`
    : name === 'loki' ? `${url}/ready`
    : name === 'prometheus' ? `${url}/-/healthy`
    : name === 'nginx' ? `${url}/nginx-health`
    : name === 'grafana' ? `${url}/api/health`
    : name === 'promtail' ? `${url}/ready`
    : `${url}/`;

  try {
    const resp = await axios.get(healthUrl, { timeout: 5000 });
    healthState[name] = { status: 'healthy', lastChecked: new Date().toISOString(), statusCode: resp.status };
    return true;
  } catch (err) {
    const prev = healthState[name];
    healthState[name] = {
      status: 'unhealthy',
      lastChecked: new Date().toISOString(),
      error: err.message,
    };

    // Only trigger incident on newly unhealthy
    if (!prev || prev.status === 'healthy') {
      logger.warn(`Service ${name} became unhealthy`, { error: err.message });
      triggerIncident(name, err.message);
    }
    return false;
  }
}

// ─── Fetch Loki Logs ─────────────────────────────────────────────────────────

async function fetchRecentLogs(service, limit = 50) {
  try {
    const end = Math.floor(Date.now() / 1000);
    const start = end - 600; // last 10 min
    const query = encodeURIComponent(`{service="supachat-${service}"}`);
    const url = `${SERVICES.loki}/loki/api/v1/query_range?query=${query}&start=${start}000000000&end=${end}000000000&limit=${limit}`;
    const resp = await axios.get(url, { timeout: 8000 });
    const result = resp.data?.data?.result || [];
    const lines = result.flatMap(stream =>
      stream.values.map(([ts, line]) => `[${new Date(parseInt(ts) / 1e6).toISOString()}] ${line}`)
    );
    return lines.join('\n') || 'No logs found.';
  } catch (err) {
    return `Could not fetch logs: ${err.message}`;
  }
}

// ─── AI Incident Analysis ─────────────────────────────────────────────────────

async function triggerIncident(serviceName, errorMessage) {
  logger.info(`Triggering AI incident analysis for ${serviceName}`);
  const logs = await fetchRecentLogs(serviceName);

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a DevOps AI agent. Analyze service failures and provide concise Root Cause Analysis (RCA) with actionable remediation steps. Be specific and technical.`,
        },
        {
          role: 'user',
          content: `Service: ${serviceName}\nError: ${errorMessage}\n\nRecent logs:\n${logs.slice(0, 3000)}\n\nProvide:\n1. Root cause\n2. Impact\n3. Immediate remediation steps\n4. Prevention recommendations`,
        },
      ],
      temperature: 0.3,
      max_tokens: 600,
    });

    const analysis = response.choices[0].message.content;
    const incident = {
      id: Date.now().toString(),
      service: serviceName,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      analysis,
      logs: logs.slice(0, 1000),
    };

    incidentHistory.unshift(incident);
    if (incidentHistory.length > 20) incidentHistory.pop();

    logger.info(`Incident analysis complete for ${serviceName}`, { incidentId: incident.id });
  } catch (err) {
    logger.error('AI analysis failed', { error: err.message });
  }
}

// ─── Scheduled Health Checks ──────────────────────────────────────────────────

cron.schedule('*/60 * * * * *', async () => {
  logger.info('Running health checks');
  await Promise.all(Object.entries(SERVICES).map(([name, url]) => checkServiceHealth(name, url)));
});

// ─── API Endpoints ────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'devops-agent', uptime: process.uptime() });
});

app.get('/agent/status', (req, res) => {
  res.json({
    services: healthState,
    incidentCount: incidentHistory.length,
    timestamp: new Date().toISOString(),
  });
});

app.get('/agent/incidents', (req, res) => {
  res.json({ incidents: incidentHistory });
});

app.post('/agent/diagnose', async (req, res) => {
  const { service } = req.body;
  if (!service || !SERVICES[service]) {
    return res.status(400).json({ error: 'Invalid service name. Valid: ' + Object.keys(SERVICES).join(', ') });
  }

  const logs = await fetchRecentLogs(service);
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a DevOps expert. Analyze logs and provide diagnostic insights.' },
        { role: 'user', content: `Diagnose recent logs for service "${service}":\n\n${logs.slice(0, 3000)}` },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    res.json({
      service,
      diagnosis: response.choices[0].message.content,
      logsAnalyzed: logs.split('\n').length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: 'AI diagnosis failed: ' + err.message });
  }
});

app.get('/agent/logs/:service', async (req, res) => {
  const { service } = req.params;
  if (!SERVICES[service]) {
    return res.status(400).json({ error: 'Invalid service' });
  }
  const logs = await fetchRecentLogs(service);
  res.json({ service, logs, timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`DevOps Agent running on port ${PORT}`);
  // Run initial checks
  setTimeout(() => {
    Object.entries(SERVICES).forEach(([name, url]) => checkServiceHealth(name, url));
  }, 5000);
});
