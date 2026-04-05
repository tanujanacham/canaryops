'use client';
import styles from './TrafficGauge.module.css';

export default function TrafficGauge({ ingress }) {
  const canary = ingress?.canaryWeight ?? null;
  const stable = ingress !== null && canary !== null ? 100 - canary : null;
  const noData = canary === null;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>TRAFFIC SPLIT</span>
        <span className={styles.badge}>NGINX INGRESS</span>
      </div>

      {noData ? (
        <div className={styles.noData}>
          <span className={styles.noDataIcon}>⚠</span>
          <span>No canary ingress detected</span>
          <span className={styles.noDataHint}>Ensure the canary ingress annotation exists in namespace</span>
        </div>
      ) : (
        <>
          {/* Visual bar */}
          <div className={styles.track}>
            <div className={styles.stableFill} style={{ width: `${stable}%` }} />
            <div className={styles.canaryFill} style={{ width: `${canary}%` }} />
          </div>

          {/* Numbers */}
          <div className={styles.row}>
            <div className={styles.side}>
              <div className={styles.sideDot} style={{ background: 'var(--green)' }} />
              <div>
                <div className={styles.sidePct} style={{ color: 'var(--green)' }}>{stable}%</div>
                <div className={styles.sideLabel}>Stable</div>
              </div>
            </div>
            <div className={styles.divider} />
            <div className={styles.side} style={{ textAlign: 'right', flexDirection: 'row-reverse' }}>
              <div className={styles.sideDot} style={{ background: 'var(--amber)' }} />
              <div>
                <div className={styles.sidePct} style={{ color: 'var(--amber)' }}>{canary}%</div>
                <div className={styles.sideLabel}>Canary</div>
              </div>
            </div>
          </div>

          {/* Ingress name + annotation */}
          {ingress?.ingressName && (
            <div className={styles.meta}>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>ingress</span>
                <span className={styles.metaVal}>{ingress.ingressName}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>canary-weight</span>
                <span className={styles.metaValAmber}>&quot;{canary}&quot;</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
