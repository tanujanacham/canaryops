'use client';
import styles from './AlarmHistory.module.css';

const STATE_COLORS = {
  ALARM:             'var(--red)',
  OK:                'var(--green)',
  INSUFFICIENT_DATA: 'var(--tx-mid)',
};

function StateChip({ state }) {
  const color = STATE_COLORS[state] || 'var(--tx-mid)';
  return (
    <span className={styles.chip} style={{ color, borderColor: `${color}30`, background: `${color}12` }}>
      {state}
    </span>
  );
}

function Arrow() {
  return <span className={styles.arrow}>→</span>;
}

export default function AlarmHistory({ history, error }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>ALARM STATE HISTORY</span>
        <span className={styles.sub}>Last 24 hours</span>
      </div>

      {error ? (
        <div className={styles.err}>⚠ {error}</div>
      ) : history.length === 0 ? (
        <div className={styles.empty}>No state changes in the last 24 hours.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>TIME</th>
                <th>ALARM</th>
                <th>TRANSITION</th>
                <th>REASON</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i}>
                  <td className={styles.time}>
                    <div>{new Date(h.timestamp).toLocaleTimeString()}</div>
                    <div className={styles.date}>{new Date(h.timestamp).toLocaleDateString()}</div>
                  </td>
                  <td className={styles.alarmName}>{h.alarmName}</td>
                  <td className={styles.transition}>
                    <StateChip state={h.oldState} />
                    <Arrow />
                    <StateChip state={h.newState} />
                  </td>
                  <td className={styles.reason}>{h.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
