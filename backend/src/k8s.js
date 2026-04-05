const k8s = require('@kubernetes/client-node');
const path = require('path');

const NAMESPACE = process.env.K8S_NAMESPACE || 'default';
const POD_SELECTOR = process.env.K8S_POD_SELECTOR || 'app=my-app';
const STABLE_DEPLOYMENT = process.env.K8S_STABLE_DEPLOYMENT || 'stable-deployment';
const CANARY_DEPLOYMENT = process.env.K8S_CANARY_DEPLOYMENT || 'canary-deployment';

function buildKubeConfig() {
  const kc = new k8s.KubeConfig();
  const kubeconfigPath = process.env.KUBECONFIG_PATH;

  if (kubeconfigPath) {
    kc.loadFromFile(kubeconfigPath);
  } else {
    // Falls back to ~/.kube/config automatically
    kc.loadFromDefault();
  }
  return kc;
}

let _coreApi = null;
let _appsApi = null;

function getCoreApi() {
  if (!_coreApi) {
    const kc = buildKubeConfig();
    _coreApi = kc.makeApiClient(k8s.CoreV1Api);
  }
  return _coreApi;
}

function getAppsApi() {
  if (!_appsApi) {
    const kc = buildKubeConfig();
    _appsApi = kc.makeApiClient(k8s.AppsV1Api);
  }
  return _appsApi;
}

/**
 * Fetch all pods matching the label selector, annotated with stable/canary type.
 */
async function getPods() {
  const coreApi = getCoreApi();

  const res = await coreApi.listNamespacedPod(
    NAMESPACE,
    undefined, // pretty
    undefined, // allowWatchBookmarks
    undefined, // _continue
    undefined, // fieldSelector
    POD_SELECTOR // labelSelector
  );

  return res.body.items.map((pod) => {
    const name = pod.metadata.name;
    const isCanary = name.startsWith(CANARY_DEPLOYMENT) ||
      (pod.metadata.labels && pod.metadata.labels['track'] === 'canary');

    const containerStatuses = pod.status.containerStatuses || [];
    const mainContainer = containerStatuses[0] || {};

    // Determine phase
    const phase = pod.status.phase || 'Unknown';
    const ready = mainContainer.ready ?? false;
    const restarts = mainContainer.restartCount ?? 0;

    // Compute age
    const createdAt = pod.metadata.creationTimestamp;
    const ageMs = createdAt ? Date.now() - new Date(createdAt).getTime() : 0;
    const ageMins = Math.floor(ageMs / 60000);
    const age = ageMins < 60
      ? `${ageMins}m`
      : ageMins < 1440
        ? `${Math.floor(ageMins / 60)}h`
        : `${Math.floor(ageMins / 1440)}d`;

    // Resource requests (from spec, not live usage — live needs metrics-server)
    const resources = pod.spec.containers[0]?.resources?.requests || {};

    return {
      id: name,
      type: isCanary ? 'canary' : 'stable',
      phase,
      ready,
      restarts,
      age,
      cpu: resources.cpu || '—',
      memory: resources.memory || '—',
      nodeName: pod.spec.nodeName || '—',
      podIP: pod.status.podIP || '—',
      image: pod.spec.containers[0]?.image || '—',
    };
  });
}

/**
 * Fetch Deployment details (replicas, images, conditions).
 */
async function getDeployments() {
  const appsApi = getAppsApi();

  const [stableRes, canaryRes] = await Promise.allSettled([
    appsApi.readNamespacedDeployment(STABLE_DEPLOYMENT, NAMESPACE),
    appsApi.readNamespacedDeployment(CANARY_DEPLOYMENT, NAMESPACE),
  ]);

  function parseDeployment(result, name) {
    if (result.status === 'rejected') {
      return { name, error: result.reason?.message || 'Not found' };
    }
    const d = result.value.body;
    return {
      name: d.metadata.name,
      namespace: d.metadata.namespace,
      replicas: d.spec.replicas,
      readyReplicas: d.status.readyReplicas ?? 0,
      availableReplicas: d.status.availableReplicas ?? 0,
      image: d.spec.template.spec.containers[0]?.image || '—',
      conditions: (d.status.conditions || []).map((c) => ({
        type: c.type,
        status: c.status,
        reason: c.reason,
        message: c.message,
      })),
      createdAt: d.metadata.creationTimestamp,
    };
  }

  return {
    stable: parseDeployment(stableRes, STABLE_DEPLOYMENT),
    canary: parseDeployment(canaryRes, CANARY_DEPLOYMENT),
  };
}

/**
 * Attempt to read NGINX Ingress canary-weight annotation.
 * Returns null if the Ingress isn't found or has no annotation.
 */
async function getCanaryWeight() {
  try {
    const networkApi = getCoreApi(); // reuse; we'll use the generic networking client
    const kc = buildKubeConfig();
    const networkingApi = kc.makeApiClient(k8s.NetworkingV1Api);

    const ingressList = await networkingApi.listNamespacedIngress(NAMESPACE);
    for (const ingress of ingressList.body.items) {
      const annotations = ingress.metadata.annotations || {};
      const isCanary = annotations['nginx.ingress.kubernetes.io/canary'] === 'true';
      if (isCanary) {
        const weight = parseInt(
          annotations['nginx.ingress.kubernetes.io/canary-weight'] || '0',
          10
        );
        return {
          ingressName: ingress.metadata.name,
          canaryWeight: weight,
          stableWeight: 100 - weight,
        };
      }
    }
    return null;
  } catch (err) {
    console.warn('[k8s] Could not read ingress:', err.message);
    return null;
  }
}

module.exports = { getPods, getDeployments, getCanaryWeight };
