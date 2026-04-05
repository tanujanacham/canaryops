'use client';
import styles from './StatusStrip.module.css';

function Kpi({ label, value, sub, color, pulse }) {
  return (
    <div className={styles.kpi}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value} style={{ color }}>
        {pulse && <span className={styles.dot} style={{ background: color, boxShadow: `0 0 6px ${color}` }} />}
        {value}
      </div>
      {sub && <div className={styles.sub}>{sub}</div>}
    </div>
  );
}

export default function StatusStrip({ status, alarming, podCount }) {
  if (!status) return null;

  const health = status.overallHealth || 'UNKNOWN';
  const healthColor = health === 'HEALTHY' ? 'var(--green)' : health === 'DEGRADED' ? 'var(--red)' : 'var(--tx-mid)';

  const canary  = status.traffic?.canaryWeight  ?? '—';
  const stable  = status.traffic?.stableWeight  ?? '—';
  const podsRunning = status.cluster?.podsRunning ?? '—';
  const podsTotal   = status.cluster?.podsTotal   ?? '—';
  const ok      = status.alarms?.ok      ?? 0;
  const total   = status.alarms?.total   ?? 0;

  return (
    <div className={styles.strip}>
      <Kpi label="CLUSTER HEALTH"  value={health}                   color={healthColor}          pulse />
      <div className={styles.div} />
      <Kpi label="TRAFFIC SPLIT"   value={`${canary}% / ${stable}%`} color="var(--amber)"         sub="Canary / Stable" />
      <div className={styles.div} />
      <Kpi label="PODS"            value={`${podsRunning} / ${podsTotal}`} color="var(--green)"   sub="Running" />
      <div className={styles.div} />
      <Kpi label="CANARY PODS"     value={status.cluster?.canaryPods ?? '—'} color="var(--amber)" sub="in production ns" />
      <div className={styles.div} />
      <Kpi label="ALARMS"          value={alarming > 0 ? `${alarming} FIRING` : 'ALL CLEAR'} color={alarming > 0 ? 'var(--red)' : 'var(--green)'} pulse sub={`${ok}/${total} OK`} />
      <div className={styles.div} />
      <Kpi label="NAMESPACE"       value="production"               color="var(--sky)"            sub="K8s namespace" />
    </div>
  );
}
