require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getPods, getDeployments, getCanaryWeight } = require('./k8s');
const { getAlarms, getAlarmHistory } = require('./cloudwatch');
const {
  generateMockPods,
  generateMockDeployments,
  generateMockIngress,
  generateMockAlarms,
  generateMockAlarmHistory,
  generateMockStatus
} = require('./mockData');

const app = express();
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

// ── Simple in-memory response cache (TTL: 10s) ────────────────────────────
const cache = new Map();
function cached(key, ttlMs, fetchFn) {
  const now = Date.now();
  const entry = cache.get(key);
  if (entry && now - entry.ts < ttlMs) return Promise.resolve(entry.data);
  return fetchFn().then((data) => {
    cache.set(key, { data, ts: now });
    return data;
  });
}

// ── Health ─────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ── GET /api/pods ──────────────────────────────────────────────────────────
app.get('/api/pods', async (req, res) => {
  try {
    let pods;
    if (USE_MOCK_DATA) {
      pods = generateMockPods();
    } else {
      pods = await cached('pods', 10_000, getPods);
    }
    res.json({ pods, fetchedAt: new Date().toISOString(), isMockData: USE_MOCK_DATA });
  } catch (err) {
    console.error('[/api/pods]', err.message);
    // Fallback to mock data on error
    const pods = generateMockPods();
    res.json({ pods, fetchedAt: new Date().toISOString(), isMockData: true, error: err.message });
  }
});

// ── GET /api/deployments ───────────────────────────────────────────────────
app.get('/api/deployments', async (req, res) => {
  try {
    let deployments;
    if (USE_MOCK_DATA) {
      deployments = generateMockDeployments();
    } else {
      deployments = await cached('deployments', 10_000, getDeployments);
    }
    res.json({ deployments, fetchedAt: new Date().toISOString(), isMockData: USE_MOCK_DATA });
  } catch (err) {
    console.error('[/api/deployments]', err.message);
    // Fallback to mock data on error
    const deployments = generateMockDeployments();
    res.json({ deployments, fetchedAt: new Date().toISOString(), isMockData: true, error: err.message });
  }
});

// ── GET /api/ingress ───────────────────────────────────────────────────────
app.get('/api/ingress', async (req, res) => {
  try {
    let weight;
    if (USE_MOCK_DATA) {
      weight = generateMockIngress();
    } else {
      weight = await cached('ingress', 10_000, getCanaryWeight);
    }
    res.json({ ingress: weight, fetchedAt: new Date().toISOString(), isMockData: USE_MOCK_DATA });
  } catch (err) {
    console.error('[/api/ingress]', err.message);
    // Fallback to mock data on error
    const weight = generateMockIngress();
    res.json({ ingress: weight, fetchedAt: new Date().toISOString(), isMockData: true, error: err.message });
  }
});

// ── GET /api/alarms ────────────────────────────────────────────────────────
app.get('/api/alarms', async (req, res) => {
  try {
    let result;
    if (USE_MOCK_DATA) {
      result = { alarms: generateMockAlarms() };
    } else {
      result = await cached('alarms', 15_000, getAlarms);
    }
    res.json({ ...result, fetchedAt: new Date().toISOString(), isMockData: USE_MOCK_DATA });
  } catch (err) {
    console.error('[/api/alarms]', err.message);
    // Fallback to mock data on error
    const result = { alarms: generateMockAlarms() };
    res.json({ ...result, fetchedAt: new Date().toISOString(), isMockData: true, error: err.message });
  }
});

// ── GET /api/alarm-history ─────────────────────────────────────────────────
app.get('/api/alarm-history', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours || '24', 10);
    let result;
    if (USE_MOCK_DATA) {
      result = generateMockAlarmHistory(hours);
    } else {
      result = await cached(`alarm-history-${hours}`, 30_000, () => getAlarmHistory(hours));
    }
    res.json({ ...result, fetchedAt: new Date().toISOString(), isMockData: USE_MOCK_DATA });
  } catch (err) {
    console.error('[/api/alarm-history]', err.message);
    // Fallback to mock data on error
    const hours = parseInt(req.query.hours || '24', 10);
    const result = generateMockAlarmHistory(hours);
    res.json({ ...result, fetchedAt: new Date().toISOString(), isMockData: true, error: err.message });
  }
});

// ── GET /api/status (aggregate) ────────────────────────────────────────────
app.get('/api/status', async (req, res) => {
  try {
    if (USE_MOCK_DATA) {
      const status = generateMockStatus();
      return res.json({ ...status, fetchedAt: new Date().toISOString(), isMockData: true });
    }

    const [podsResult, deploymentsResult, ingressResult, alarmsResult] = await Promise.allSettled([
      cached('pods', 10_000, getPods),
      cached('deployments', 10_000, getDeployments),
      cached('ingress', 10_000, getCanaryWeight),
      cached('alarms', 15_000, getAlarms),
    ]);

    const pods     = podsResult.status === 'fulfilled'       ? podsResult.value       : [];
    const depls    = deploymentsResult.status === 'fulfilled' ? deploymentsResult.value : {};
    const ingress  = ingressResult.status === 'fulfilled'     ? ingressResult.value     : null;
    const alarmObj = alarmsResult.status === 'fulfilled'      ? alarmsResult.value      : { alarms: [] };

    const allAlarms = alarmObj.alarms || [];
    const alarming  = allAlarms.filter((a) => a.state === 'ALARM').length;

    res.json({
      cluster: {
        podsTotal:   pods.length,
        podsRunning: pods.filter((p) => p.phase === 'Running').length,
        canaryPods:  pods.filter((p) => p.type === 'canary').length,
        stablePods:  pods.filter((p) => p.type === 'stable').length,
      },
      traffic: ingress
        ? { canaryWeight: ingress.canaryWeight, stableWeight: ingress.stableWeight, ingressName: ingress.ingressName }
        : null,
      deployments: depls,
      alarms: {
        total:    allAlarms.length,
        alarming,
        ok:       allAlarms.filter((a) => a.state === 'OK').length,
        insufficient: allAlarms.filter((a) => a.state === 'INSUFFICIENT_DATA').length,
      },
      overallHealth: alarming > 0 ? 'DEGRADED' : 'HEALTHY',
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[/api/status]', err.message);
    // Fallback to mock data on error
    const status = generateMockStatus();
    res.json({ ...status, fetchedAt: new Date().toISOString(), isMockData: true, error: err.message });
  }
});

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀  CanaryOps API listening on http://localhost:${PORT}`);
  if (USE_MOCK_DATA) {
    console.log(`    📊 Mode: MOCK DATA (synthetic demo)`)
    console.log(`    ✨ Dashboard will show dynamic, realistic data`);
  } else {
    console.log(`    K8s namespace : ${process.env.K8S_NAMESPACE || 'default'}`);
    console.log(`    AWS region    : ${process.env.AWS_REGION || 'us-east-1'}`);
    console.log(`    Alarms        : ${process.env.CW_ALARM_NAMES || '(none configured)'}`);
  }
  console.log(`\n`);
});
