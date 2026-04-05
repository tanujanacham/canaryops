const {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetMetricStatisticsCommand,
  DescribeAlarmHistoryCommand,
} = require('@aws-sdk/client-cloudwatch');

const REGION = process.env.AWS_REGION || 'us-east-1';
const ALARM_NAMES = (process.env.CW_ALARM_NAMES || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function getClient() {
  // Credentials are picked up automatically from env vars:
  // AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN (optional)
  // OR from the IAM role if running on EC2/ECS/EKS
  return new CloudWatchClient({ region: REGION });
}

/**
 * Fetch current state of all configured alarms.
 */
async function getAlarms() {
  if (!ALARM_NAMES.length) {
    return { alarms: [], warning: 'No CW_ALARM_NAMES configured in .env' };
  }

  const client = getClient();
  const cmd = new DescribeAlarmsCommand({
    AlarmNames: ALARM_NAMES,
    AlarmTypes: ['MetricAlarm'],
  });

  const res = await client.send(cmd);

  const alarms = (res.MetricAlarms || []).map((a) => ({
    name: a.AlarmName,
    description: a.AlarmDescription || '',
    state: a.StateValue, // OK | ALARM | INSUFFICIENT_DATA
    stateReason: a.StateReason,
    metric: a.MetricName,
    namespace: a.Namespace,
    threshold: a.Threshold,
    comparisonOperator: a.ComparisonOperator,
    period: a.Period,
    evaluationPeriods: a.EvaluationPeriods,
    dimensions: (a.Dimensions || []).map((d) => ({ name: d.Name, value: d.Value })),
    updatedAt: a.StateUpdatedTimestamp,
    alarmArn: a.AlarmArn,
  }));

  // Any alarm names that weren't found
  const foundNames = alarms.map((a) => a.name);
  const missingNames = ALARM_NAMES.filter((n) => !foundNames.includes(n));

  return { alarms, missingAlarms: missingNames };
}

/**
 * Fetch recent state-change history for all configured alarms.
 * Looks back `lookbackHours` hours (default 24).
 */
async function getAlarmHistory(lookbackHours = 24) {
  if (!ALARM_NAMES.length) return { history: [] };

  const client = getClient();
  const startDate = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

  // Fetch history for all alarms in parallel
  const results = await Promise.allSettled(
    ALARM_NAMES.map((name) =>
      client.send(
        new DescribeAlarmHistoryCommand({
          AlarmName: name,
          HistoryItemType: 'StateUpdate',
          StartDate: startDate,
          EndDate: new Date(),
          ScanBy: 'TimestampDescending',
          MaxRecords: 20,
        })
      )
    )
  );

  const history = [];
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.warn(`[cloudwatch] History fetch failed for ${ALARM_NAMES[i]}:`, result.reason?.message);
      return;
    }
    (result.value.AlarmHistoryItems || []).forEach((item) => {
      let summary = {};
      try {
        summary = JSON.parse(item.HistorySummary || '{}');
      } catch (_) {}
      history.push({
        alarmName: item.AlarmName,
        timestamp: item.Timestamp,
        historyItemType: item.HistoryItemType,
        historySummary: item.HistorySummary,
        oldState: summary?.oldState?.stateValue || '—',
        newState: summary?.newState?.stateValue || '—',
        reason: summary?.newState?.stateReason || item.HistorySummary || '',
      });
    });
  });

  // Sort newest first
  history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return { history };
}

module.exports = { getAlarms, getAlarmHistory };
