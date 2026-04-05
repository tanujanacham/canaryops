'use client';
import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/shared/Navbar';
import { api } from '@/lib/api';
import styles from './dashboard.module.css';
import StatusStrip from '@/components/dashboard/StatusStrip';
import PodTable from '@/components/dashboard/PodTable';
import AlarmPanel from '@/components/dashboard/AlarmPanel';
import AlarmHistory from '@/components/dashboard/AlarmHistory';
import DeploymentCards from '@/components/dashboard/DeploymentCards';
import TrafficGauge from '@/components/dashboard/TrafficGauge';

const POLL_MS = 3_000;

export default function DashboardPage() {
  const [status,      setStatus]      = useState(null);
  const [pods,        setPods]        = useState([]);
  const [alarms,      setAlarms]      = useState([]);
  const [history,     setHistory]     = useState([]);
  const [deployments, setDeployments] = useState(null);
  const [ingress,     setIngress]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [errors,      setErrors]      = useState({});
  const [lastUpdate,  setLastUpdate]  = useState(null);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    const results = await Promise.allSettled([
      api.status(),
      api.pods(),
      api.alarms(),
      api.alarmHistory(24),
      api.deployments(),
      api.ingress(),
    ]);

    const errs = {};

    if (results[0].status === 'fulfilled') setStatus(results[0].value);
    else errs.status = results[0].reason?.message;

    if (results[1].status === 'fulfilled') setPods(results[1].value.pods || []);
    else errs.pods = results[1].reason?.message;

    if (results[2].status === 'fulfilled') setAlarms(results[2].value.alarms || []);
    else errs.alarms = results[2].reason?.message;

    if (results[3].status === 'fulfilled') setHistory(results[3].value.history || []);
    else errs.history = results[3].reason?.message;

    if (results[4].status === 'fulfilled') setDeployments(results[4].value.deployments);
    else errs.deployments = results[4].reason?.message;

    if (results[5].status === 'fulfilled') setIngress(results[5].value.ingress);
    else errs.ingress = results[5].reason?.message;

    setErrors(errs);
    setLastUpdate(new Date());
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(() => fetchAll(true), POLL_MS);
    return () => clearInterval(t);
  }, [fetchAll]);

  const hasError = Object.keys(errors).length > 0;
  const alarming = alarms.filter(a => a.state === 'ALARM').length;

  return (
    <>
      <Navbar />
      <main className={styles.page}>

        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.h1}>Canary Deployment Monitor</h1>
            <p className={styles.h1sub}>K8s cluster · CloudWatch · NGINX Ingress — auto-refreshes every {POLL_MS/1000}s</p>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.liveIndicator}>
              <span className={styles.liveDot} />
              LIVE
            </div>
            {lastUpdate && (
              <span className={styles.updatedAt}>
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <button className={styles.refreshBtn} onClick={() => fetchAll()}>
              ↻ REFRESH
            </button>
          </div>
        </header>

        {/* API error banner */}
        {hasError && (
          <div className={styles.errBanner}>
            <span className={styles.errIcon}>⚠</span>
            <div>
              <strong>Some data sources are unavailable.</strong>{' '}
              {errors.pods && <span>Pods: {errors.pods}. </span>}
              {errors.alarms && <span>Alarms: {errors.alarms}. </span>}
              {errors.deployments && <span>Deployments: {errors.deployments}. </span>}
              {!errors.pods && !errors.alarms && !errors.deployments && (
                <span>Partial data shown. Check backend logs for details.</span>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.skeletonGrid}>
            {[1,2,3,4,5,6].map(i => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : (
          <div className={styles.grid}>
            {/* Row 1 — status strip full width */}
            <div className={styles.fullWidth}>
              <StatusStrip status={status} alarming={alarming} podCount={pods.length} />
            </div>

            {/* Row 2 — traffic gauge + deployment cards */}
            <div className={styles.span1}>
              <TrafficGauge ingress={ingress} />
            </div>
            <div className={styles.span2}>
              <DeploymentCards deployments={deployments} />
            </div>

            {/* Row 3 — pod table full width */}
            <div className={styles.fullWidth}>
              <PodTable pods={pods} error={errors.pods} />
            </div>

            {/* Row 4 — alarms + alarm history */}
            <div className={styles.span1}>
              <AlarmPanel alarms={alarms} error={errors.alarms} />
            </div>
            <div className={styles.span2}>
              <AlarmHistory history={history} error={errors.history} />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
