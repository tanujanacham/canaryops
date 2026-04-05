'use client';
import styles from './PodTable.module.css';

const PHASE_COLORS = {
  Running:     { color: 'var(--green)',  bg: 'var(--green-dim)',  border: 'rgba(31,199,117,0.2)' },
  Pending:     { color: 'var(--amber)',  bg: 'var(--amber-dim)',  border: 'rgba(240,165,0,0.2)' },
  Terminating: { color: 'var(--red)',    bg: 'var(--red-dim)',    border: 'rgba(240,75,75,0.2)' },
  Failed:      { color: 'var(--red)',    bg: 'var(--red-dim)',    border: 'rgba(240,75,75,0.2)' },
  Succeeded:   { color: 'var(--sky)',    bg: 'var(--sky-dim)',    border: 'rgba(58,181,229,0.2)' },
  Unknown:     { color: 'var(--tx-mid)', bg: 'var(--elevated)',   border: 'var(--bd-dim)' },
};

function PhaseBadge({ phase, ready }) {
  const s = PHASE_COLORS[phase] || PHASE_COLORS.Unknown;
  return (
    <span
      className={styles.badge}
      style={{ color: s.color, background: s.bg, borderColor: s.border }}
    >
      {phase === 'Running' && (
        <span className={styles.badgeDot} style={{ background: s.color }} />
      )}
      {phase}
      {phase === 'Running' && (
        <span style={{ opacity: 0.6, marginLeft: 4 }}>{ready ? '· ready' : '· not ready'}</span>
      )}
    </span>
  );
}

function TypeBadge({ type }) {
  const isCanary = type === 'canary';
  return (
    <span
      className={styles.typeBadge}
      style={{
        color:       isCanary ? 'var(--amber)'  : 'var(--green)',
        background:  isCanary ? 'var(--amber-dim)' : 'var(--green-dim)',
        borderColor: isCanary ? 'rgba(240,165,0,0.2)' : 'rgba(31,199,117,0.2)',
      }}
    >
      {isCanary ? '🐦 CANARY' : '🟢 STABLE'}
    </span>
  );
}

function UsageBar({ value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={styles.usage}>
      <div className={styles.usageTrack}>
        <div className={styles.usageFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={styles.usageText}>{value}</span>
    </div>
  );
}

export default function PodTable({ pods, error }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>POD HEALTH</span>
        <span className={styles.count}>{pods.length} pod{pods.length !== 1 ? 's' : ''}</span>
      </div>

      {error ? (
        <div className={styles.err}>⚠ {error}</div>
      ) : pods.length === 0 ? (
        <div className={styles.empty}>No pods found matching the configured label selector.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>TYPE</th>
                <th>POD NAME</th>
                <th>STATUS</th>
                <th>CPU</th>
                <th>MEM</th>
                <th>RESTARTS</th>
                <th>AGE</th>
                <th>NODE</th>
                <th>IMAGE</th>
              </tr>
            </thead>
            <tbody>
              {pods.map((pod) => (
                <tr key={pod.id} className={pod.type === 'canary' ? styles.rowCanary : ''}>
                  <td><TypeBadge type={pod.type} /></td>
                  <td className={styles.podName} title={pod.id}>{pod.id.split('-').pop()}</td>
                  <td><PhaseBadge phase={pod.phase} ready={pod.ready} /></td>
                  <td className={styles.mono}>
                    <UsageBar value={pod.cpuUsage || 0} max={100} color="var(--sky)" />
                  </td>
                  <td className={styles.mono}>
                    <UsageBar value={pod.memoryUsage || 0} max={512} color="var(--amber)" />
                  </td>
                  <td className={styles.num} style={{ color: pod.restarts > 0 ? 'var(--amber)' : 'var(--tx-mid)' }}>
                    {pod.restarts}
                  </td>
                  <td className={styles.mono}>{pod.age}</td>
                  <td className={styles.mono}>{pod.nodeName}</td>
                  <td className={styles.image} title={pod.image}>
                    {pod.image?.length > 20 ? '…' + pod.image.split(':').pop() : pod.image}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
