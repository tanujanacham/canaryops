'use client';
import styles from './DeploymentCards.module.css';

function Condition({ type, status, reason }) {
  const ok = status === 'True';
  return (
    <div className={styles.cond}>
      <span className={styles.condDot} style={{ background: ok ? 'var(--green)' : 'var(--red)' }} />
      <span className={styles.condType}>{type}</span>
      {reason && <span className={styles.condReason}>{reason}</span>}
    </div>
  );
}

function DeployCard({ data, label, accent }) {
  if (!data) return (
    <div className={styles.card} style={{ borderColor: 'var(--bd-dim)' }}>
      <div className={styles.cardHead}>
        <span className={styles.cardLabel} style={{ color: accent }}>{label}</span>
      </div>
      <div className={styles.noData}>Not found in cluster</div>
    </div>
  );

  if (data.error) return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.cardLabel} style={{ color: accent }}>{label}</span>
        <span className={styles.cardName}>{data.name}</span>
      </div>
      <div className={styles.errMsg}>⚠ {data.error}</div>
    </div>
  );

  const ready = data.readyReplicas ?? 0;
  const total = data.replicas ?? 0;
  const healthy = ready === total && total > 0;

  return (
    <div className={styles.card} style={{ borderColor: `${accent}28` }}>
      <div className={styles.cardHead}>
        <span className={styles.cardLabel} style={{ color: accent }}>{label}</span>
        <span className={styles.cardName}>{data.name}</span>
        <span
          className={styles.cardStatus}
          style={{
            color: healthy ? 'var(--green)' : 'var(--red)',
            background: healthy ? 'var(--green-dim)' : 'var(--red-dim)',
            borderColor: healthy ? 'rgba(31,199,117,0.2)' : 'rgba(240,75,75,0.2)',
          }}
        >
          {healthy ? 'READY' : 'DEGRADED'}
        </span>
      </div>

      <div className={styles.replicaRow}>
        <div className={styles.replicaNum} style={{ color: accent }}>
          {ready}<span className={styles.replicaTotal}>/{total}</span>
        </div>
        <div className={styles.replicaLabel}>replicas ready</div>
      </div>

      {/* Replica bar */}
      <div className={styles.replicaBar}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={styles.replicaPip}
            style={{ background: i < ready ? accent : 'var(--elevated)', boxShadow: i < ready ? `0 0 6px ${accent}60` : 'none' }}
          />
        ))}
      </div>

      <div className={styles.meta}>
        <div className={styles.metaRow}>
          <span className={styles.metaKey}>image</span>
          <span className={styles.metaVal} title={data.image}>
            {data.image?.length > 40 ? '…' + data.image.slice(-38) : data.image}
          </span>
        </div>
        {data.createdAt && (
          <div className={styles.metaRow}>
            <span className={styles.metaKey}>created</span>
            <span className={styles.metaVal}>{new Date(data.createdAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {(data.conditions || []).length > 0 && (
        <div className={styles.conditions}>
          {data.conditions.map(c => (
            <Condition key={c.type} {...c} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DeploymentCards({ deployments }) {
  return (
    <div className={styles.wrap}>
      <DeployCard data={deployments?.stable} label="STABLE" accent="var(--green)" />
      <DeployCard data={deployments?.canary} label="CANARY" accent="var(--amber)" />
    </div>
  );
}
