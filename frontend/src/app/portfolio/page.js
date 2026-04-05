import Navbar from '@/components/shared/Navbar';
import Link from 'next/link';
import styles from './portfolio.module.css';

const stack = [
  { name: 'NGINX Ingress',    color: '#1fc775', desc: 'Weight-based traffic split via annotations'  },
  { name: 'GitHub Actions',   color: '#3ab5e5', desc: 'CI/CD pipeline + auto-rollback workflow'     },
  { name: 'CloudWatch',       color: '#f0a500', desc: 'Metric alarms drive rollback triggers'        },
  { name: 'AWS ECR',          color: '#9d6df5', desc: 'Docker image registry for both versions'      },
  { name: 'kubeadm',          color: '#f04b4b', desc: 'Self-managed K8s cluster bootstrapping'       },
  { name: 'AWS ALB',          color: '#3ab5e5', desc: 'External load balancer → cluster entry point' },
  { name: 'Next.js SSR',      color: '#f0a500', desc: 'Node.js app deployed as canary target'        },
  { name: 'Kubernetes',       color: '#326ce5', desc: 'Orchestrates stable + canary Deployments'     },
];

const steps = [
  { n:'01', title:'Developer Push',    body:'A git push or PR merge fires the GitHub Actions workflow.',                                         color:'#3ab5e5' },
  { n:'02', title:'Build & Push',      body:'Actions builds a new Docker image and pushes it to AWS ECR with a version tag.',                   color:'#9d6df5' },
  { n:'03', title:'Canary Deploy',     body:'The pipeline applies a new Deployment manifest at 10% traffic weight — stable remains untouched.', color:'#f0a500' },
  { n:'04', title:'Ingress Split',     body:'NGINX Ingress reads canary-weight annotation and routes traffic: 90% stable / 10% canary.',        color:'#1fc775' },
  { n:'05', title:'Alarm Watch',       body:'CloudWatch monitors error rate, P99 latency, and CPU on the canary target group.',                 color:'#f0a500' },
  { n:'06', title:'Promote / Rollback',body:'Healthy metrics → weight increments toward 100%. Breach → alarm fires, pipeline resets weight to 0.', color:'#f04b4b' },
];

const metrics = [
  { value:'10%',   label:'Initial canary weight',  note:'Safe blast-radius cap'          },
  { value:'<30s',  label:'Rollback time',           note:'Alarm → pipeline → weight=0'   },
  { value:'3',     label:'CloudWatch alarms',       note:'Error rate · Latency · CPU'     },
  { value:'0',     label:'Downtime on rollback',    note:'Stable always handles traffic'  },
];

export default function PortfolioPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>

        {/* ─── HERO ─── */}
        <section className={styles.hero}>
          <div className={styles.heroBgGrid} aria-hidden />
          <div className={styles.heroBgGlow} aria-hidden />

          <div className={styles.heroInner}>
            <p className={styles.heroEyebrow}>
              <span className={styles.eyebrowDot} />
              DEVOPS · KUBERNETES · CI/CD · AWS
            </p>

            <h1 className={styles.heroH1}>
              Canary Release<br/>
              <em className={styles.heroEm}>via K8s Ingress</em><br/>
              Weight Annotations
            </h1>

            <p className={styles.heroBody}>
              Zero-downtime progressive delivery using NGINX Ingress Controller on
              self-managed Kubernetes. GitHub Actions orchestrates canary ramp-up;
              CloudWatch alarms trigger automatic rollbacks in under 30 seconds.
            </p>

            <div className={styles.heroCTAs}>
              <Link href="/dashboard" className={styles.btnPrimary}>
                LIVE DASHBOARD →
              </Link>
              <a href="#flow" className={styles.btnGhost}>
                VIEW FLOW ↓
              </a>
            </div>
          </div>

          {/* Traffic split viz */}
          <div className={styles.heroViz} aria-hidden>
            <div className={styles.vizTitle}>CURRENT TRAFFIC SPLIT</div>
            <div className={styles.vizTrack}>
              <div className={styles.vizStable} style={{ width:'90%' }}>
                <span>STABLE v1</span>
                <span className={styles.vizPct}>90%</span>
              </div>
              <div className={styles.vizCanary} style={{ width:'10%' }}>
                <span className={styles.vizPct}>10%</span>
              </div>
            </div>
            <div className={styles.vizLegend}>
              <span className={styles.vizLegItem}><span style={{background:'var(--green)'}} className={styles.vizDot}/>Stable v1 — production</span>
              <span className={styles.vizLegItem}><span style={{background:'var(--amber)'}} className={styles.vizDot}/>Canary v2 — 10%</span>
            </div>

            <div className={styles.vizAnnotation}>
              <div className={styles.vizAnnoLabel}>NGINX INGRESS ANNOTATIONS</div>
              <code className={styles.vizCode}>
                nginx.ingress.kubernetes.io/canary: <span className={styles.codeVal}>&quot;true&quot;</span>{'\n'}
                nginx.ingress.kubernetes.io/canary-weight: <span className={styles.codeAmber}>&quot;10&quot;</span>
              </code>
            </div>
          </div>
        </section>

        {/* ─── KPI STRIP ─── */}
        <div className={styles.kpiStrip}>
          {metrics.map(m => (
            <div key={m.value} className={styles.kpiCard}>
              <div className={styles.kpiVal}>{m.value}</div>
              <div className={styles.kpiLabel}>{m.label}</div>
              <div className={styles.kpiNote}>{m.note}</div>
            </div>
          ))}
        </div>

        {/* ─── TECH STACK ─── */}
        <section className={styles.section}>
          <div className={styles.secHead}>
            <span className={styles.secTag}>§ 01</span>
            <h2 className={styles.secTitle}>Tech Stack</h2>
          </div>
          <div className={styles.stackGrid}>
            {stack.map(t => (
              <div key={t.name} className={styles.stackCard}>
                <div className={styles.stackDot} style={{ background: t.color, boxShadow: `0 0 10px ${t.color}60` }} />
                <div className={styles.stackName}>{t.name}</div>
                <div className={styles.stackDesc}>{t.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── PIPELINE FLOW ─── */}
        <section className={styles.section} id="flow">
          <div className={styles.secHead}>
            <span className={styles.secTag}>§ 02</span>
            <h2 className={styles.secTitle}>Pipeline Flow</h2>
          </div>
          <div className={styles.flowList}>
            {steps.map((s, i) => (
              <div key={s.n} className={styles.flowItem}>
                <div className={styles.flowLeft}>
                  <div className={styles.flowNum} style={{ color: s.color }}>{s.n}</div>
                  {i < steps.length - 1 && <div className={styles.flowLine} />}
                </div>
                <div className={styles.flowContent}>
                  <div className={styles.flowTitle} style={{ color: s.color }}>{s.title}</div>
                  <div className={styles.flowBody}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── ARCHITECTURE ─── */}
        <section className={styles.section}>
          <div className={styles.secHead}>
            <span className={styles.secTag}>§ 03</span>
            <h2 className={styles.secTitle}>Architecture</h2>
          </div>
          <div className={styles.arch}>
            {/* Top row */}
            <div className={styles.archRow}>
              <div className={`${styles.archNode} ${styles.nodeGray}`}>
                <div className={styles.nodeIcon}>👨‍💻</div>
                <div className={styles.nodeLabel}>Developer</div>
              </div>
              <div className={styles.archEdge}>push →</div>
              <div className={`${styles.archNode} ${styles.nodeGray}`}>
                <div className={styles.nodeIcon}>🐙</div>
                <div className={styles.nodeLabel}>GitHub</div>
                <div className={styles.nodeSub}>push / PR merge</div>
              </div>
            </div>
            <div className={styles.archDown}>↓</div>

            {/* CI/CD row */}
            <div className={styles.archRow}>
              <div className={`${styles.archNode} ${styles.nodeBlue}`} style={{flex:2}}>
                <div className={styles.nodeIcon}>⚙️</div>
                <div className={styles.nodeLabel}>GitHub Actions CI/CD</div>
                <div className={styles.nodeSub}>Build → Push → Deploy</div>
              </div>
              <div className={styles.archEdge}>→</div>
              <div className={`${styles.archNode} ${styles.nodeViolet}`}>
                <div className={styles.nodeIcon}>📦</div>
                <div className={styles.nodeLabel}>AWS ECR</div>
                <div className={styles.nodeSub}>Docker registry</div>
              </div>
            </div>
            <div className={styles.archDown}>↓</div>

            {/* K8s box */}
            <div className={styles.archK8sBox}>
              <span className={styles.archK8sLabel}>Self-managed Kubernetes (kubeadm)</span>

              <div className={`${styles.archNode} ${styles.nodeGreen}`} style={{alignSelf:'center', minWidth:240}}>
                <div className={styles.nodeIcon}>⚖️</div>
                <div className={styles.nodeLabel}>AWS ALB</div>
                <div className={styles.nodeSub}>User traffic ingress</div>
              </div>
              <div className={styles.archDown}>↓</div>

              <div className={`${styles.archNode} ${styles.nodeGreen}`} style={{alignSelf:'center', minWidth:280}}>
                <div className={styles.nodeIcon}>🌐</div>
                <div className={styles.nodeLabel}>NGINX Ingress Controller</div>
                <div className={styles.nodeSub}>Splits by weight annotation</div>
              </div>

              <div className={styles.archSplit}>
                <div className={styles.archSplitArm} style={{color:'var(--green)'}}>↙ 90%</div>
                <div className={styles.archSplitArm} style={{color:'var(--amber)'}}>10% ↘</div>
              </div>

              <div className={styles.archRow} style={{width:'100%', justifyContent:'center', gap:24}}>
                <div className={`${styles.archNode} ${styles.nodeGreen}`}>
                  <div className={styles.nodeIcon}>🟢</div>
                  <div className={styles.nodeLabel}>Stable v1</div>
                  <div className={styles.nodeSub}>production-ready</div>
                </div>
                <div className={`${styles.archNode} ${styles.nodeAmber}`}>
                  <div className={styles.nodeIcon}>🐦</div>
                  <div className={styles.nodeLabel}>Canary v2</div>
                  <div className={styles.nodeSub}>10% traffic</div>
                </div>
              </div>

              <div className={styles.archCW}>
                <div className={`${styles.archNode} ${styles.nodeOrange}`}>
                  <div className={styles.nodeIcon}>📊</div>
                  <div className={styles.nodeLabel}>CloudWatch</div>
                  <div className={styles.nodeSub}>alarm → rollback</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── ROLLBACK MECHANISM ─── */}
        <section className={styles.section}>
          <div className={styles.secHead}>
            <span className={styles.secTag}>§ 04</span>
            <h2 className={styles.secTitle}>Rollback Mechanism</h2>
          </div>
          <div className={styles.rollbackGrid}>
            {[
              { n:'1', title:'Alarm Breach',   desc:'CloudWatch detects error rate / P99 latency / CPU above threshold on canary.',         c:'#f04b4b' },
              { n:'2', title:'SNS → Actions',  desc:'Alarm publishes to SNS topic; the webhook re-triggers the GitHub Actions workflow.',  c:'#f0a500' },
              { n:'3', title:'Weight → 0',     desc:'Pipeline patches the NGINX Ingress annotation: canary-weight: "0" — instantly.',      c:'#3ab5e5' },
              { n:'4', title:'Pod Cleanup',    desc:'Canary Deployment scaled to 0 replicas. Stable absorbs 100% of traffic. Done.',       c:'#1fc775' },
            ].map(r => (
              <div key={r.n} className={styles.rbCard}>
                <div className={styles.rbNum} style={{ color:r.c, borderColor:`${r.c}40` }}>{r.n}</div>
                <div>
                  <div className={styles.rbTitle}>{r.title}</div>
                  <div className={styles.rbDesc}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FOOTER CTA ─── */}
        <section className={styles.footerCTA}>
          <h2 className={styles.footerH2}>See it live</h2>
          <p className={styles.footerSub}>The dashboard shows real pod health and CloudWatch alarm state from your cluster.</p>
          <Link href="/dashboard" className={styles.btnPrimary}>OPEN DASHBOARD →</Link>
        </section>

      </main>
    </>
  );
}
