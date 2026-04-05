import '../styles/globals.css';

export const metadata = {
  title: 'CanaryOps — K8s Canary Release Dashboard',
  description: 'Real-time Kubernetes pod health and CloudWatch alarm monitoring for canary deployments.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
