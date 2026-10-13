import { validateRecord } from './records.js';
import { problem } from '../errors.js';

const columns = ['id', 'schemaVersion', 'createdAt', 'startedAt', 'endedAt', 'state', 'mode', 'probeCount', 'intervalMs', 'timeoutMs',
  'demoContract', 'faultType', 'delayMs', 'rateKiBps', 'recoveryWindowMs', 'recoverySuccessCount', 'removedAt', 'confirmedAt',
  'recoveryObserved', 'recoveryDurationMs', 'persistenceState', 'errorCode', 'errorMessage', 'evidenceReferences', 'phase',
  'probeStartedAt', 'elapsedMs', 'outcome', 'httpStatus', 'bytesReceived', 'successful', 'attemptCount', 'cancelledCount',
  'eligibleCount', 'successCount', 'failureCount', 'availability', 'meanElapsedMs', 'medianElapsedMs', 'p95ElapsedMs', 'meanThroughputKiBps'];

function cell(value) {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}

export function exportRecord(record, format) {
  if (!['json', 'csv'].includes(format)) throw problem('invalid_input', 400, 'Export format must be json or csv.');
  validateRecord(record);
  let content;
  if (format === 'json') content = JSON.stringify(record, null, 2);
  else {
    const { settings: s, recovery: r } = record;
    const error = record.error || record.persistence.error;
    const metadata = { id: record.id, schemaVersion: record.schemaVersion, createdAt: record.createdAt, startedAt: record.startedAt,
      endedAt: record.endedAt, state: record.state, ...s, faultType: s.fault.type, ...s.fault,
      removedAt: r.removedAt, confirmedAt: r.confirmedAt, recoveryObserved: r.observed, recoveryDurationMs: r.durationMs,
      persistenceState: record.persistence.state, errorCode: error?.code, errorMessage: error?.message,
      evidenceReferences: JSON.stringify(record.evidenceReferences) };
    const observations = record.observations.length ? record.observations : [null];
    content = columns.join(',') + '\r\n' + observations.map(item => {
      const summary = item ? record.summary[item.phase] : record.summary.baseline;
      const row = { ...metadata, ...summary, ...item, probeStartedAt: item?.startedAt, startedAt: record.startedAt };
      return columns.map(key => cell(row[key])).join(',');
    }).join('\r\n') + '\r\n';
  }
  return { content, contentType: format === 'json' ? 'application/json' : 'text/csv; charset=utf-8', filename: `faultnet-${record.id}.${format}` };
}
