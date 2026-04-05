/**
 * Mock Data Generator for CanaryOps Dashboard
 * Generates realistic synthetic data for a dynamic demo experience
 */

const DEPLOYMENTS = {
  stable: {
    name: 'nextjs-stable',
    namespace: 'canary-demo',
    replicas: 3,
    readyReplicas: 3,
    availableReplicas: 3,
    image: 'nextjs-app:v2.1.0',
    conditions: [
      { type: 'Progressing', status: 'True', reason: 'NewReplicaSetAvailable', message: 'ReplicaSet "nextjs-stable-5f8d9c" has successfully progressed.' },
      { type: 'Available', status: 'True', reason: 'MinimumReplicasAvailable', message: 'Deployment has minimum availability.' }
    ],
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() // 45 days ago
  },
  canary: {
    name: 'nextjs-canary',
    namespace: 'canary-demo',
    replicas: 1,
    readyReplicas: 1,
    availableReplicas: 1,
    image: 'nextjs-app:v2.2.0-rc1',
    conditions: [
      { type: 'Progressing', status: 'True', reason: 'NewReplicaSetAvailable', message: 'ReplicaSet "nextjs-canary-7a3b2f" has successfully progressed.' },
      { type: 'Available', status: 'True', reason: 'MinimumReplicasAvailable', message: 'Deployment has minimum availability.' }
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
  }
};

const ALARM_NAMES = [
  'CanaryErrorRate',
  'CanaryLatencyP99',
  'StableErrorRate',
  'StableLatencyP99',
  'CanaryMemoryUsage',
  'IngressRequestCount'
];

// Mock pod name generator
function generatePodName(type, index) {
  const deploymentName = type === 'canary' ? 'nextjs-canary' : 'nextjs-stable';
  const podIds = ['5f8d9c', '7a3b2f', 'b2c1d8', '9f4e2a'];
  return `${deploymentName}-${podIds[index % podIds.length]}-${Math.random().toString(36).substr(2, 5)}`;
}

// Generate mock pods with dynamic data
function generateMockPods() {
  const pods = [];
  
  // Stable pods (3-4)
  for (let i = 0; i < 3; i++) {
    const cpuValue = Math.floor(Math.random() * 40) + 10;
    const memValue = Math.floor(Math.random() * 100) + 200;
    pods.push({
      id: generatePodName('stable', i),
      type: 'stable',
      phase: 'Running',
      ready: true,
      restarts: Math.floor(Math.random() * 5),
      age: `${Math.floor(Math.random() * 30) + 5}d`,
      cpu: `${cpuValue}m`,
      cpuUsage: cpuValue,
      memory: `${memValue}Mi`,
      memoryUsage: memValue,
      nodeName: `node-${i % 3 + 1}`,
      podIP: `10.244.${i}.${Math.floor(Math.random() * 255) + 1}`,
      image: 'nextjs-app:v2.1.0'
    });
  }

  // Canary pods (1-2)
  for (let i = 0; i < 1; i++) {
    const cpuValue = Math.floor(Math.random() * 60) + 20;
    const memValue = Math.floor(Math.random() * 150) + 250;
    pods.push({
      id: generatePodName('canary', i),
      type: 'canary',
      phase: 'Running',
      ready: true,
      restarts: Math.floor(Math.random() * 2),
      age: `${Math.floor(Math.random() * 7) + 1}d`,
      cpu: `${cpuValue}m`,
      cpuUsage: cpuValue,
      memory: `${memValue}Mi`,
      memoryUsage: memValue,
      nodeName: `node-${(i + 2) % 3 + 1}`,
      podIP: `10.244.${i + 10}.${Math.floor(Math.random() * 255) + 1}`,
      image: 'nextjs-app:v2.2.0-rc1'
    });
  }

  // Occasionally add a pending pod for realism
  if (Math.random() > 0.85) {
    pods.push({
      id: generatePodName('stable', Math.floor(Math.random() * 10)),
      type: 'stable',
      phase: 'Pending',
      ready: false,
      restarts: 0,
      age: '1m',
      cpu: '0m',
      memory: '0Mi',
      nodeName: 'node-pending',
      podIP: '',
      image: 'nextjs-app:v2.1.0'
    });
  }

  return pods;
}

// Generate mock deployments
function generateMockDeployments() {
  return DEPLOYMENTS;
}

// Generate mock ingress/traffic weight
function generateMockIngress() {
  // Simulate gradual canary rollout with more frequent variations for the demo
  // We use seconds to make it change more often visually
  const seconds = Math.floor(Date.now() / 1000);
  const baseWeight = 20; // 20% base
  const oscillation = Math.sin(seconds / 30) * 15; // Oscillate between -15 and +15 every ~3 mins
  const jitter = Math.random() * 2;
  
  const canaryWeight = Math.round(Math.max(5, Math.min(95, baseWeight + oscillation + jitter)));

  return {
    ingressName: 'nextjs-ingress',
    canaryWeight,
    stableWeight: 100 - canaryWeight
  };
}

// Maintain some state for alarms so they don't flicker too much
let alarmStateCache = {};

// Generate mock alarms with dynamic states
function generateMockAlarms() {
  const states = ['OK', 'ALARM', 'INSUFFICIENT_DATA'];
  
  return ALARM_NAMES.map((name, index) => {
    // If we have a cached state, 90% chance to keep it
    if (alarmStateCache[name] && Math.random() < 0.9) {
      // Keep state
    } else {
      const alarmProbability = name.includes('CanaryError') ? 0.2 : 0.1;
      alarmStateCache[name] = Math.random() < alarmProbability ? 'ALARM' : 'OK';
    }

    const state = alarmStateCache[name];
    
    const alarmReasons = {
      'OK': 'Threshold not breached',
      'ALARM': 'Threshold exceeded',
      'INSUFFICIENT_DATA': 'Not enough data points'
    };

    return {
      name,
      description: `${name} alarm for canary release monitoring`,
      state,
      stateReason: alarmReasons[state],
      metric: name.replace('Canary', '').replace('Stable', '').replace('Ingress', ''),
      namespace: name.includes('Ingress') ? 'AWS/ApplicationELB' : 'AWS/ECS',
      threshold: 50 + Math.floor(Math.random() * 100),
      comparisonOperator: 'GreaterThanThreshold',
      period: 300,
      evaluationPeriods: 1,
      dimensions: [
        { name: 'LoadBalancer', value: 'app/nextjs-alb/1234567890abcdef' },
        { name: 'ServiceName', value: 'nextjs-service' }
      ],
      updatedAt: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
      alarmArn: `arn:aws:cloudwatch:us-east-1:123456789012:alarm:${name}`
    };
  });
}

// Generate mock alarm history
function generateMockAlarmHistory(hours = 24) {
  const history = {
    alarmsTriggered: Math.floor(Math.random() * 10) + 2,
    alarmHistoryItems: []
  };

  // Generate history entries for the past N hours
  const itemCount = Math.floor(Math.random() * 20) + 10;
  for (let i = 0; i < itemCount; i++) {
    const timestamp = new Date(Date.now() - Math.random() * hours * 60 * 60 * 1000);
    const randomAlarm = ALARM_NAMES[Math.floor(Math.random() * ALARM_NAMES.length)];
    const eventType = Math.random() > 0.5 ? 'StateUpdate' : 'ConfigurationUpdate';
    
    history.alarmHistoryItems.push({
      alarmName: randomAlarm,
      timestamp: timestamp.toISOString(),
      eventType,
      historySummary: eventType === 'StateUpdate' 
        ? `Alarm transitioned to ${Math.random() > 0.5 ? 'ALARM' : 'OK'}`
        : 'Alarm configuration updated'
    });
  }

  // Sort by timestamp desc
  history.alarmHistoryItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return history;
}

// Generate mock status (aggregate data)
function generateMockStatus() {
  const pods = generateMockPods();
  const ingress = generateMockIngress();
  const alarms = generateMockAlarms();
  
  const stablePods = pods.filter(p => p.type === 'stable' && p.phase === 'Running').length;
  const canaryPods = pods.filter(p => p.type === 'canary' && p.phase === 'Running').length;
  const totalPods = pods.length;
  const runningPods = pods.filter(p => p.phase === 'Running').length;
  
  const alarmingCount = alarms.filter(a => a.state === 'ALARM').length;
  const okCount = alarms.filter(a => a.state === 'OK').length;
  const insufficientCount = alarms.filter(a => a.state === 'INSUFFICIENT_DATA').length;
  
  const overallHealth = alarmingCount > 0 ? 'DEGRADED' : 'HEALTHY';

  return {
    overallHealth,
    cluster: {
      podsTotal: totalPods,
      podsRunning: runningPods,
      canaryPods,
      stablePods,
      namespace: 'canary-demo'
    },
    traffic: {
      canaryWeight: ingress.canaryWeight,
      stableWeight: ingress.stableWeight,
      ingressName: ingress.ingressName
    },
    alarms: {
      total: alarms.length,
      alarming: alarmingCount,
      ok: okCount,
      insufficient: insufficientCount
    }
  };
}

module.exports = {
  generateMockPods,
  generateMockDeployments,
  generateMockIngress,
  generateMockAlarms,
  generateMockAlarmHistory,
  generateMockStatus
};
