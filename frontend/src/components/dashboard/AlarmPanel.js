'use client';
import styles from './AlarmPanel.module.css';

const STATE_MAP = {
  OK:                { color: 'var(--green)', bg: 'var(--green-dim)', border: 'rgba(31,199,117,0.2)', icon: '✓' },
  ALARM:             { color: 'var(--red)',   bg: 'var(--red-dim)',   border: 'rgba(240,75,75,0.2)',  icon: '⚠' },
  INSUFFICIENT_DATA: { color: 'var(--tx-mid)',bg: 'var(--elevated)',  border: 'var(--bd-dim)',         icon: '?' },
};

function AlarmRow({ alarm }) {
  const s = STATE_MAP[alarm.state] || STATE_MAP.INSUFFICIENT_DATA;
  const isAlarm = alarm.state === 'ALARM';

  return (
    <div className={`${styles.row} ${isAlarm ? styles.rowAlarm : ''}`}>
      <div className={styles.rowLeft}>
        <span className={styles.stateIcon} style={{ color: s.color, background: s.bg, borderColor: s.border }}>
          {isAlarm && <span className={styles.alertPulse} />}
          {s.icon}
        </span>
        <div>
          <div className={styles.alarmName}>{alarm.name}</div>
          <div className={styles.metric}>{alarm.namespace} · {alarm.metric}</div>
        </div>
      </div>
      <div className={styles.rowRight}>
        <div className={styles.threshold}>
          threshold: <span style={{ color: s.color }}>{alarm.threshold}</span>
        </div>
        <div className={styles.updated}>
          {alarm.updatedAt ? new Date(alarm.updatedAt).toLocaleTimeString() : '—'}
        </div>
      </div>
    </div>
  );
}

export default function AlarmPanel({ alarms, error }) {
  const firing = alarms.filter(a => a.state === 'ALARM').length;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>CLOUDWATCH ALARMS</span>
        {firing > 0 ? (
          <span className={styles.firingBadge}>🔴 {firing} FIRING</span>
        ) : (
          <span className={styles.okBadge}>✓ ALL OK</span>
        )}
      </div>

      {error ? (
        <div className={styles.err}>⚠ {error}</div>
      ) : alarms.length === 0 ? (
        <div className={styles.empty}>
          No alarms configured.<br />
          Set CW_ALARM_NAMES in your .env file.
        </div>
      ) : (
        <div className={styles.list}>
          {alarms.map(a => <AlarmRow key={a.name} alarm={a} />)}
        </div>
      )}

      {/* Reason for last alarm state */}
      {alarms.filter(a => a.state === 'ALARM').map(a => (
        <div key={a.name + '_reason'} className={styles.reason}>
          <span className={styles.reasonLabel}>REASON</span>
          <span className={styles.reasonText}>{a.stateReason}</span>
        </div>
      ))}
    </div>
  );
}
