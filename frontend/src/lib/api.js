const BASE = process.env.NEXT_PUBLIC_API || 'http://localhost:4000';

async function get(path) {
  const r = await fetch(`${BASE}${path}`, { cache: 'no-store' });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || `HTTP ${r.status}`), { detail: body.detail });
  }
  return r.json();
}

export const api = {
  status:       () => get('/api/status'),
  pods:         () => get('/api/pods'),
  deployments:  () => get('/api/deployments'),
  ingress:      () => get('/api/ingress'),
  alarms:       () => get('/api/alarms'),
  alarmHistory: (hours = 24) => get(`/api/alarm-history?hours=${hours}`),
};
