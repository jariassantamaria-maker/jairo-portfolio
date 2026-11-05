/* A self-contained portfolio demonstration. Every identifier and assignment is fictional. */

export const SAMPLE_RECORDS = Object.freeze([
  { requestId: 'DEMO-001', rawUnit: 'ALPHA-01' },
  { requestId: 'DEMO-002', rawUnit: ' beta-02 ' },
  { requestId: 'DEMO-003', rawUnit: 'UNIT: gamma-03' },
  { requestId: 'DEMO-004', rawUnit: 'SHARED-01' },
  { requestId: 'DEMO-005', rawUnit: 'UNKNOWN-99' },
  { requestId: 'DEMO-006', rawUnit: '' },
  { requestId: 'DEMO-007', rawUnit: 'ALPHA-01' },
  { requestId: 'DEMO-007', rawUnit: 'ALPHA-01' },
  { requestId: 'DEMO-008', rawUnit: 'BETA-02' },
  { requestId: 'DEMO-008', rawUnit: 'GAMMA-03' }
].map(record => Object.freeze(record)));

export const UNIT_DIRECTORY = Object.freeze([
  { code: 'ALPHA-01', assignment: 'Demo Operations A' },
  { code: 'BETA-02', assignment: 'Demo Operations B' },
  { code: 'GAMMA-03', assignment: 'Demo Support C' },
  { code: 'SHARED-01', assignment: 'Demo Operations D' },
  { code: 'SHARED-01', assignment: 'Demo Operations E' }
].map(entry => Object.freeze(entry)));

export const STATUS = Object.freeze({
  READY: 'Ready for reporting',
  STANDARDIZED: 'Standardized & matched',
  REVIEW: 'Needs review',
  DUPLICATE: 'Duplicate — excluded'
});

/**
 * Only declared transformations are permitted: trim surrounding whitespace,
 * remove an optional literal UNIT: prefix, and uppercase the captured code.
 * No fuzzy matching, internal-space repair or separator-based extraction.
 */
export function normalizeUnit(rawUnit) {
  if (rawUnit === null || rawUnit === undefined || rawUnit === '') {
    return { code: null, changed: false, issue: 'missing-unit' };
  }
  if (typeof rawUnit !== 'string') {
    return { code: null, changed: false, issue: 'invalid-unit' };
  }
  const trimmed = rawUnit.trim();
  if (!trimmed) return { code: null, changed: false, issue: 'missing-unit' };
  const match = /^(?:UNIT:\s*)?([A-Z]+-\d{2})$/i.exec(trimmed);
  if (!match) return { code: null, changed: false, issue: 'invalid-unit' };
  const code = match[1].toUpperCase();
  return { code, changed: code !== rawUnit, issue: null };
}

function requestKey(requestId) {
  return typeof requestId === 'string' ? requestId.trim() : '';
}

function payloadSignature(record, normalized) {
  // A valid standardized code defines the same payload. For invalid codes,
  // only a literally identical raw value counts as an identical repeat.
  return JSON.stringify(normalized.code === null
    ? ['raw', record.rawUnit === undefined ? null : record.rawUnit]
    : ['code', normalized.code]);
}

/** Return new result objects; never mutate the source records or directory. */
export function validateRecords(records = SAMPLE_RECORDS, directory = UNIT_DIRECTORY) {
  const prepared = records.map((record, index) => ({
    record,
    index,
    key: requestKey(record.requestId),
    normalized: normalizeUnit(record.rawUnit)
  }));
  const groups = new Map();
  for (const row of prepared) {
    if (!row.key) continue;
    if (!groups.has(row.key)) groups.set(row.key, []);
    groups.get(row.key).push(row);
  }

  const assignments = new Map();
  for (const entry of directory) {
    if (!assignments.has(entry.code)) assignments.set(entry.code, new Set());
    assignments.get(entry.code).add(entry.assignment);
  }

  return prepared.map(row => {
    const result = {
      sourceRow: row.index + 1,
      requestId: row.record.requestId,
      rawUnit: row.record.rawUnit,
      normalizedUnit: row.normalized.code,
      assignment: null,
      status: STATUS.REVIEW,
      reasonCode: null,
      reason: '',
      readyForReporting: false,
      standardized: row.normalized.changed
    };
    const finish = (status, reasonCode, reason, assignment = null) => ({
      ...result,
      status,
      reasonCode,
      reason,
      assignment,
      readyForReporting: status === STATUS.READY || status === STATUS.STANDARDIZED
    });

    if (!row.key) {
      return finish(STATUS.REVIEW, 'missing-request', 'A request ID is required before a record can be counted.');
    }
    const group = groups.get(row.key);
    const signatures = new Set(group.map(item => payloadSignature(item.record, item.normalized)));
    if (signatures.size > 1) {
      return finish(STATUS.REVIEW, 'conflicting-request', 'This request ID has conflicting unit values. Hold every version for human review.');
    }
    if (group[0].index !== row.index) {
      return finish(STATUS.DUPLICATE, 'identical-duplicate', `Same request ID and standardized unit as source row ${group[0].index + 1}. Keep the first occurrence only.`);
    }
    if (row.normalized.issue === 'missing-unit') {
      return finish(STATUS.REVIEW, 'missing-unit', 'The source unit is blank. Request the missing information; do not infer a code.');
    }
    if (row.normalized.issue === 'invalid-unit') {
      return finish(STATUS.REVIEW, 'invalid-unit', 'The unit does not follow the declared code format. Do not guess or repair it.');
    }

    const candidates = assignments.get(row.normalized.code) || new Set();
    if (candidates.size === 0) {
      return finish(STATUS.REVIEW, 'unmatched-unit', 'No exact dictionary match exists. Leave the assignment unresolved.');
    }
    if (candidates.size > 1) {
      return finish(STATUS.REVIEW, 'ambiguous-unit', 'The dictionary contains more than one assignment for this exact code. Human review is required.');
    }
    const assignment = [...candidates][0];
    return row.normalized.changed
      ? finish(STATUS.STANDARDIZED, 'standardized', 'Declared formatting rules produced one exact dictionary match. The raw source is preserved.', assignment)
      : finish(STATUS.READY, 'ready', 'One exact dictionary match; no formatting change was needed.', assignment);
  });
}

export function summarizeValidation(results) {
  return results.reduce((counts, row) => {
    counts.total += 1;
    if (row.readyForReporting) counts.ready += 1;
    if (row.status === STATUS.STANDARDIZED) counts.standardized += 1;
    if (row.status === STATUS.REVIEW) counts.review += 1;
    if (row.status === STATUS.DUPLICATE) counts.duplicates += 1;
    return counts;
  }, { total: 0, ready: 0, standardized: 0, review: 0, duplicates: 0 });
}

export function serializeSampleCsv() {
  const quote = value => `"${String(value).replaceAll('"', '""')}"`;
  const lines = [
    ['request_id', 'raw_unit'],
    ...SAMPLE_RECORDS.map(row => [row.requestId, row.rawUnit])
  ];
  return lines.map(row => row.map(quote).join(',')).join('\r\n') + '\r\n';
}

function appendTextElement(doc, parent, tag, text, className) {
  const element = doc.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  parent.append(element);
  return element;
}

function renderRecords(node, results = null) {
  const doc = node.ownerDocument;
  const wrapper = doc.createElement('div');
  wrapper.className = 'integrity-table-wrap table-wrap';
  wrapper.tabIndex = 0;
  wrapper.setAttribute('role', 'region');
  wrapper.setAttribute('aria-label', 'Fictional source records and validation decisions');
  const table = doc.createElement('table');
  table.className = 'integrity-table';
  table.setAttribute('role', 'table');
  appendTextElement(doc, table, 'caption', results
    ? 'Fictional request records — validation results'
    : 'Fictional request records — unvalidated source');
  const head = doc.createElement('thead');
  const headingRow = doc.createElement('tr');
  const headings = ['Source row / request', 'Raw unit', 'Standardized unit', 'Assignment', 'Validation decision'];
  for (const title of headings) {
    const th = appendTextElement(doc, headingRow, 'th', title);
    th.scope = 'col';
  }
  head.append(headingRow);
  table.append(head);
  const body = doc.createElement('tbody');

  SAMPLE_RECORDS.forEach((source, index) => {
    const row = doc.createElement('tr');
    const result = results && results[index];
    const rowHeader = appendTextElement(doc, row, 'th', `${String(index + 1).padStart(2, '0')} · ${source.requestId}`);
    rowHeader.scope = 'row';
    rowHeader.dataset.label = headings[0];
    const raw = appendTextElement(doc, row, 'td', source.rawUnit ? `“${source.rawUnit}”` : '(blank)', 'integrity-raw');
    raw.dataset.label = headings[1];
    const normalized = appendTextElement(doc, row, 'td', result ? result.normalizedUnit || '—' : 'Not checked');
    normalized.dataset.label = headings[2];
    const assignment = appendTextElement(doc, row, 'td', result ? result.assignment || 'Unresolved / excluded' : 'Not checked');
    assignment.dataset.label = headings[3];
    const decision = doc.createElement('td');
    decision.dataset.label = headings[4];
    const label = result ? result.status : 'Source — not validated';
    const state = !result ? 'pending' : result.status === STATUS.REVIEW ? 'review' : result.status === STATUS.DUPLICATE ? 'duplicate' : 'ready';
    appendTextElement(doc, decision, 'span', label, `integrity-status integrity-status-${state}`);
    if (result) appendTextElement(doc, decision, 'span', result.reason, 'integrity-row-reason');
    row.append(decision);
    body.append(row);
  });
  table.append(body);
  wrapper.append(table);
  node.replaceChildren(wrapper);
}

function renderNotes(node, results = null) {
  const doc = node.ownerDocument;
  const list = doc.createElement('ul');
  list.className = 'integrity-note-list';
  if (!results) {
    appendTextElement(doc, list, 'li', 'This is a fixed, fictional source sample. No validation or assignment has been applied.');
    appendTextElement(doc, list, 'li', 'Run the declared rules to separate reporting-ready records, unresolved exceptions and identical duplicates.');
  } else {
    const counts = summarizeValidation(results);
    const count = code => results.filter(row => row.reasonCode === code).length;
    appendTextElement(doc, list, 'li', `${counts.ready} records have one exact assignment and can enter this demonstration’s reporting set. ${counts.standardized} of those records first needed declared formatting changes.`);
    appendTextElement(doc, list, 'li', `${count('ambiguous-unit')} ambiguous, ${count('unmatched-unit')} unknown and ${count('missing-unit')} blank unit records remain unresolved. The rules do not choose a likely assignment.`);
    appendTextElement(doc, list, 'li', `${counts.duplicates} identical repeat is excluded after keeping the first occurrence. ${count('conflicting-request')} rows with a conflicting request ID are all held for review.`);
    appendTextElement(doc, list, 'li', 'Raw values remain visible and unchanged. These counts describe this fictional sample, not historical business results.');
  }
  node.replaceChildren(list);
}

export function mountIntegrityDemo(root) {
  if (!root || typeof root.getElementById !== 'function') return false;
  const records = root.getElementById('integrity-records');
  const summary = root.getElementById('integrity-summary');
  const notes = root.getElementById('integrity-notes');
  const run = root.getElementById('integrity-run');
  const reset = root.getElementById('integrity-reset');
  if (!records || !summary || !notes || !run || !reset) return false;
  if (records.dataset.integrityInitialized === 'true') return true;
  records.dataset.integrityInitialized = 'true';
  run.disabled = false;
  reset.disabled = false;
  summary.setAttribute('role', 'status');
  summary.setAttribute('aria-live', 'polite');
  summary.setAttribute('aria-atomic', 'true');
  run.setAttribute('aria-controls', 'integrity-records integrity-summary integrity-notes');
  reset.setAttribute('aria-controls', 'integrity-records integrity-summary integrity-notes');

  const showSource = () => {
    renderRecords(records);
    renderNotes(notes);
    summary.textContent = `${SAMPLE_RECORDS.length} fictional source rows. No validation has been applied.`;
  };
  const showResults = () => {
    const results = validateRecords();
    const counts = summarizeValidation(results);
    renderRecords(records, results);
    renderNotes(notes, results);
    summary.textContent = `${counts.total} fictional rows reviewed: ${counts.ready} ready for reporting, ${counts.review} need review and ${counts.duplicates} duplicate excluded. These are demonstration counts only.`;
  };
  run.addEventListener('click', showResults);
  reset.addEventListener('click', showSource);
  showSource();
  return true;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mountIntegrityDemo(document), { once: true });
  } else {
    mountIntegrityDemo(document);
  }
}
