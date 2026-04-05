'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const path = usePathname();
  return (
    <nav className={styles.nav}>
      <Link href="/portfolio" className={styles.logo}>
        <span className={styles.logoMark}>◈</span>
        <span className={styles.logoName}>CANARY<span className={styles.logoOps}>OPS</span></span>
      </Link>

      <div className={styles.links}>
        <Link href="/portfolio" className={`${styles.link} ${path === '/portfolio' ? styles.active : ''}`}>
          <span className={styles.linkIdx}>01</span>PROJECT
        </Link>
        <Link href="/dashboard" className={`${styles.link} ${path === '/dashboard' ? styles.active : ''}`}>
          <span className={styles.linkIdx}>02</span>DASHBOARD
        </Link>
      </div>

      <div className={styles.right}>
        <span className={styles.pulse} />
        <span className={styles.liveLabel}>LIVE</span>
      </div>
    </nav>
  );
}
