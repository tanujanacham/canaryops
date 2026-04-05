# CanaryOps — K8s Canary Release Dashboard

A full-stack website with two sections:
- **Portfolio page** — project showcase for the Canary Release via K8s Ingress Weight Annotations project
- **Dashboard** — real-time monitoring of Kubernetes pod health and CloudWatch alarm status

---

## Project Structure

```
canaryops/
├── backend/          # Express API (Node.js)
│   ├── src/
│   │   ├── server.js       # API routes + caching
│   │   ├── k8s.js          # Kubernetes client (real cluster)
│   │   └── cloudwatch.js   # AWS CloudWatch client (real alarms)
│   ├── .env.example
│   └── package.json
│
└── frontend/         # Next.js app
    ├── src/
    │   ├── app/
    │   │   ├── portfolio/  # Project showcase page
    │   │   └── dashboard/  # Live monitoring dashboard
    │   ├── components/
    │   │   ├── shared/     # Navbar
    │   │   └── dashboard/  # All dashboard widgets
    │   └── lib/api.js      # API client
    └── package.json
```

---

## Prerequisites

- **Node.js** 18 or later
- A **kubeconfig** file pointing at your K8s cluster
- **AWS credentials** with `cloudwatch:DescribeAlarms` and `cloudwatch:DescribeAlarmHistory` permissions

---

## Setup

### 1. Backend

```bash
cd backend
npm install

# Copy and fill in your config
cp .env.example .env
nano .env
```

Key variables in `.env`:

| Variable | Description |
|---|---|
| `KUBECONFIG_PATH` | Full path to your kubeconfig file |
| `K8S_NAMESPACE` | Namespace where your pods live |
| `K8S_POD_SELECTOR` | Label selector, e.g. `app=my-nextjs-app` |
| `K8S_STABLE_DEPLOYMENT` | Name of the stable Deployment |
| `K8S_CANARY_DEPLOYMENT` | Name of the canary Deployment |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_REGION` | e.g. `us-east-1` |
| `CW_ALARM_NAMES` | Comma-separated alarm names, e.g. `CanaryErrorRate,CanaryLatencyP99` |

Start the backend:

```bash
npm run dev      # development (auto-restart)
# or
npm start        # production
```

The API runs at `http://localhost:4000`.

---

### 2. Frontend

```bash
cd frontend
npm install

# Optional: set API URL if backend is not on localhost:4000
echo "NEXT_PUBLIC_API=http://localhost:4000" > .env.local

npm run dev
```

Open `http://localhost:3000` — it redirects to the Portfolio page.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Backend health check |
| GET | `/api/status` | Aggregate: cluster + traffic + alarms |
| GET | `/api/pods` | All pods matching label selector |
| GET | `/api/deployments` | Stable + canary Deployment details |
| GET | `/api/ingress` | NGINX Ingress canary-weight annotation |
| GET | `/api/alarms` | Current CloudWatch alarm states |
| GET | `/api/alarm-history?hours=24` | Alarm state-change history |

---

## Dashboard Features

- **Status strip** — cluster health, traffic split, pod count, alarm summary
- **Traffic gauge** — live canary/stable split read from NGINX Ingress annotation
- **Deployment cards** — replica counts, images, K8s conditions for both deployments
- **Pod table** — all pods with phase, readiness, restarts, node, IP, CPU/memory requests
- **Alarm panel** — current CloudWatch alarm states with firing reason
- **Alarm history** — state-change log for the last 24 hours

Auto-refreshes every **15 seconds**.

---

## Deploying

The frontend and backend are independent — deploy them anywhere:

- **Frontend**: Vercel, Netlify, any Node host (`npm run build && npm start`)
- **Backend**: EC2, ECS, or any server that can reach your K8s API server and AWS

Set `NEXT_PUBLIC_API=https://your-backend-url` in the frontend environment, and `FRONTEND_URL=https://your-frontend-url` in the backend `.env`.

---

## Troubleshooting

**Pods not showing?**
- Check `K8S_POD_SELECTOR` matches your pod labels exactly (`kubectl get pods -l app=my-app`)
- Confirm `KUBECONFIG_PATH` points to a valid kubeconfig with cluster access

**Alarms not showing?**
- Verify `CW_ALARM_NAMES` matches alarm names exactly (case-sensitive)
- Confirm your IAM user/role has `cloudwatch:DescribeAlarms` permission

**CORS error in browser?**
- Set `FRONTEND_URL` in backend `.env` to match your exact frontend origin
