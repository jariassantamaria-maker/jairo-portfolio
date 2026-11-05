/* Newly created portfolio demonstration. All events, sources and elapsed times are fictional. */
export const SOURCE_TYPES = Object.freeze([
  { key: 'attendance', label: 'Attendance export' },
  { key: 'platform-a', label: 'Platform A connection log' },
  { key: 'platform-b', label: 'Platform B connection log' },
  { key: 'handover', label: 'Handover note' }
].map(source => Object.freeze(source)));

export const EVIDENCE = Object.freeze([
  { id: 'E01', source: 'platform-a', minute: -2, actor: 'Participant', platform: 'A', type: 'join', detail: 'Participant joined Platform A.' },
  { id: 'E02', source: 'platform-b', minute: 0, actor: 'Facilitator', platform: 'B', type: 'join', detail: 'Facilitator joined Platform B.' },
  { id: 'E03', source: 'handover', minute: 0, actor: 'Coordinator', platform: 'B', type: 'handover', detail: 'A note requests a move to Platform B. Delivery and acknowledgment are not confirmed.' },
  { id: 'E04', source: 'platform-a', minute: 8, actor: 'Participant', platform: 'A', type: 'leave', detail: 'Participant left Platform A.' },
  { id: 'E05', source: 'platform-b', minute: 12, actor: 'Facilitator', platform: 'B', type: 'leave', detail: 'Facilitator left Platform B.' },
  { id: 'E06', source: 'attendance', minute: 30, actor: 'System', platform: 'A', type: 'attendance', detail: 'The fictional attendance export labels this sample session “No-show”.' }
].map(event => Object.freeze(event)));

export function getDefaultSelection() {
  return SOURCE_TYPES.map(source => source.key);
}

export function selectEvidence(selectedSources = getDefaultSelection(), evidence = EVIDENCE) {
  const valid = new Set(SOURCE_TYPES.map(source => source.key));
  const selected = new Set(Array.isArray(selectedSources) ? selectedSources.filter(key => valid.has(key)) : []);
  return evidence.map((event, index) => ({ event, index }))
    .filter(({ event }) => selected.has(event.source))
    .sort((a, b) => a.event.minute - b.event.minute || a.index - b.index)
    .map(({ event }) => ({ ...event }));
}

export function formatElapsedMinute(minute) {
  const sign = minute < 0 ? '−' : '+';
  return `T${sign}${String(Math.abs(minute)).padStart(2, '0')} min`;
}

function connectionInterval(events, actor, platform) {
  const relevant = events.filter(event => event.actor === actor && event.platform === platform && ['join', 'leave'].includes(event.type));
  if (!relevant.length) return { state: 'missing', ids: [] };
  const joins = relevant.filter(event => event.type === 'join');
  const leaves = relevant.filter(event => event.type === 'leave');
  if (joins.length !== 1 || leaves.length !== 1) return { state: 'incomplete', ids: relevant.map(event => event.id) };
  if (!Number.isFinite(joins[0].minute) || !Number.isFinite(leaves[0].minute) || leaves[0].minute <= joins[0].minute) {
    return { state: 'conflicting', ids: relevant.map(event => event.id) };
  }
  return { state: 'complete', start: joins[0].minute, end: leaves[0].minute, ids: relevant.map(event => event.id) };
}

const item = (text, citations = []) => ({ text, citations: [...new Set(citations)] });

/** Summarize only selected records. A review never changes attendance or determines fault. */
export function buildEvidenceReview(selectedSources = getDefaultSelection(), evidence = EVIDENCE) {
  const selection = Array.isArray(selectedSources) ? selectedSources : [];
  const events = selectEvidence(selection, evidence);
  const base = {
    selectedSources: SOURCE_TYPES.filter(source => selection.includes(source.key)).map(source => source.key),
    evidenceIds: events.map(event => event.id),
    visibleCount: events.length,
    totalCount: evidence.length,
    facts: events.map(event => item(`${formatElapsedMinute(event.minute)}: ${event.detail}`, [event.id])),
    hypotheses: [],
    questions: []
  };
  if (!events.length) {
    return {
      ...base,
      statusCode: 'no-evidence',
      status: 'No evidence selected',
      summary: 'Select at least one fictional source before building a review. No attendance conclusion can be drawn from an empty packet.',
      questions: [item('Select a source and inspect its records to begin the review.')]
    };
  }

  const participant = connectionInterval(events, 'Participant', 'A');
  const facilitator = connectionInterval(events, 'Facilitator', 'B');
  const attendance = events.filter(event => event.type === 'attendance');
  const handover = events.filter(event => event.type === 'handover');
  const participantAttempt = events.filter(event => event.actor === 'Participant' && event.type === 'join');
  const intervalsComplete = participant.state === 'complete' && facilitator.state === 'complete';
  const overlap = intervalsComplete && Math.max(participant.start, facilitator.start) < Math.min(participant.end, facilitator.end);
  const chronologyConflict = [participant, facilitator].some(interval => interval.state === 'conflicting');
  const chronologyIncomplete = [participant, facilitator].some(interval => interval.state === 'incomplete');
  let statusCode = 'insufficient-evidence';
  let status = 'Insufficient evidence to assess the session';
  let summary = 'The selected packet does not establish what happened across the full session. Missing selected logs do not prove absence.';

  if (chronologyConflict) {
    statusCode = 'timeline-needs-review';
    status = 'Connection chronology needs review';
    summary = 'Selected join and leave records contain an inconsistent interval. Reconcile the timing before drawing a session conclusion.';
  } else if (attendance.length && participantAttempt.length) {
    statusCode = 'review-needed';
    status = 'Recorded attendance status needs review';
    summary = 'The selected export records “No-show”, while a selected connection log records a participant join. This supports reviewing the classification; it does not prove a completed session or authorize a correction.';
  } else if (overlap) {
    statusCode = 'limited-evidence';
    status = 'Cross-platform overlap observed';
    summary = 'The selected connection intervals overlap on different platforms. The packet does not include an attendance export, so no recorded attendance classification is assessed.';
  }

  if (overlap && !chronologyConflict) {
    base.hypotheses.push(item(
      handover.length
        ? 'A coordination gap during the requested platform transition could explain the separation. The selected records do not establish the cause or assign fault.'
        : 'A platform coordination gap is one possible explanation for the overlapping connections in different places. A transition instruction is not established by the selected records.',
      [...participant.ids, ...facilitator.ids, ...handover.map(event => event.id)]
    ));
  } else if (handover.length && !chronologyConflict) {
    base.hypotheses.push(item('The requested handover may not have reached everyone. This is an unverified possibility, not a finding about delivery or anyone’s conduct.', handover.map(event => event.id)));
  }

  if (chronologyConflict || chronologyIncomplete) {
    base.questions.push(item('Obtain complete connection intervals and reconcile inconsistent timing before comparing where the session took place.', [...participant.ids, ...facilitator.ids]));
  }
  if (!participantAttempt.length) {
    base.questions.push(item('Obtain participant connection evidence. Its absence from the selected packet does not establish that the participant was absent.'));
  }
  if (!intervalsComplete) {
    base.questions.push(item('Obtain the missing connection records before comparing the two actors’ locations across the session.'));
  }
  base.questions.push(item('Verify log completeness, identity correlation and whether event clocks share the same time reference.'));
  if (handover.length) base.questions.push(item('Confirm delivery and acknowledgment of the handover instruction.', handover.map(event => event.id)));
  if (attendance.length) base.questions.push(item('Check the applicable attendance definition and authorized review procedure before any status correction.', attendance.map(event => event.id)));
  if (overlap) base.questions.push(item('Review the invitation and transition instructions with the responsible team. Do not infer intent or fault from connection times.'));

  return { ...base, statusCode, status, summary };
}

export function serializeEvidenceCsv() {
  const quote = value => `"${String(value).replaceAll('"', '""')}"`;
  const rows = [
    ['event_id', 'source', 'elapsed_minutes', 'actor', 'platform', 'event', 'detail'],
    ...EVIDENCE.map(event => [event.id, event.source, event.minute, event.actor, event.platform, event.type, event.detail])
  ];
  return rows.map(row => row.map(quote).join(',')).join('\r\n') + '\r\n';
}

function appendText(doc, parent, tag, text, className) {
  const node = doc.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  parent.append(node);
  return node;
}

function renderTimeline(node, selectedSources) {
  const doc = node.ownerDocument;
  const events = selectEvidence(selectedSources);
  if (!events.length) {
    const empty = doc.createElement('p');
    empty.className = 'incident-pending';
    empty.textContent = 'No source is selected. The six fictional source records remain unchanged; selecting a source makes its events visible again.';
    node.replaceChildren(empty);
    return;
  }
  const list = doc.createElement('ol');
  list.className = 'incident-timeline-list';
  list.setAttribute('role', 'list');
  list.setAttribute('aria-label', 'Selected fictional evidence in elapsed-time order');
  for (const event of events) {
    const row = doc.createElement('li');
    row.className = 'incident-event';
    row.dataset.evidenceId = event.id;
    row.dataset.source = event.source;
    const meta = doc.createElement('div');
    meta.className = 'incident-event-meta';
    appendText(doc, meta, 'span', formatElapsedMinute(event.minute), 'incident-event-time');
    const label = SOURCE_TYPES.find(source => source.key === event.source)?.label || event.source;
    appendText(doc, meta, 'span', `${event.id} · ${label}`, 'incident-event-source');
    row.append(meta);
    appendText(doc, row, 'p', event.detail, 'incident-event-detail');
    list.append(row);
  }
  node.replaceChildren(list);
}

function renderPending(node, selectedSources, changed = false) {
  const doc = node.ownerDocument;
  const visible = selectEvidence(selectedSources).length;
  const text = visible
    ? `${visible} of ${EVIDENCE.length} fictional events selected. ${changed ? 'Source selection changed; any previous review has been cleared. ' : ''}Build an evidence review to separate facts, hypotheses and open questions.`
    : 'No evidence selected. No review is available. Select one or more sources to continue.';
  const pending = doc.createElement('p');
  pending.className = 'incident-pending';
  pending.textContent = text;
  node.replaceChildren(pending);
}

function appendFindingColumn(doc, parent, heading, items, emptyText) {
  const column = doc.createElement('section');
  column.className = 'incident-review-column';
  appendText(doc, column, 'h4', heading);
  if (!items.length) appendText(doc, column, 'p', emptyText);
  else {
    const list = doc.createElement('ul');
    list.className = 'incident-review-list';
    list.setAttribute('role', 'list');
    for (const finding of items) {
      const li = doc.createElement('li');
      appendText(doc, li, 'span', finding.text);
      if (finding.citations.length) appendText(doc, li, 'span', ` ${finding.citations.map(id => `[${id}]`).join(' ')}`, 'incident-citation');
      list.append(li);
    }
    column.append(list);
  }
  parent.append(column);
}

function renderFindings(node, selectedSources) {
  const doc = node.ownerDocument;
  const review = buildEvidenceReview(selectedSources);
  const fragment = doc.createElement('div');
  appendText(doc, fragment, 'h3', review.status, 'incident-review-status');
  appendText(doc, fragment, 'p', `${review.visibleCount} selected fictional events. ${review.summary}`, 'incident-review-summary');
  const grid = doc.createElement('div');
  grid.className = 'incident-review-grid';
  appendFindingColumn(doc, grid, 'Facts in selected records', review.facts, 'No factual event is available in the selected packet.');
  appendFindingColumn(doc, grid, 'Hypotheses — not confirmed', review.hypotheses, 'No supported hypothesis is proposed from this selected packet.');
  appendFindingColumn(doc, grid, 'Open questions', review.questions, 'No questions have been generated.');
  fragment.append(grid);
  appendText(doc, fragment, 'p', 'Demonstration only. No attendance status is changed, no case is submitted and no person is assessed.', 'incident-review-boundary');
  node.replaceChildren(fragment);
}

export function mountIncidentDemo(root) {
  if (!root || typeof root.getElementById !== 'function') return false;
  const sources = root.getElementById('incident-sources');
  const timeline = root.getElementById('incident-timeline');
  const findings = root.getElementById('incident-findings');
  const review = root.getElementById('incident-review');
  const reset = root.getElementById('incident-reset');
  if (!sources || !timeline || !findings || !review || !reset) return false;
  if (timeline.dataset.incidentInitialized === 'true') return true;
  const inputs = Array.from(sources.querySelectorAll('input[type="checkbox"]'));
  const allowed = new Set(getDefaultSelection());
  if (inputs.length !== SOURCE_TYPES.length || inputs.some(input => !allowed.has(input.value)) || new Set(inputs.map(input => input.value)).size !== SOURCE_TYPES.length) return false;
  timeline.dataset.incidentInitialized = 'true';
  review.disabled = false;
  reset.disabled = false;
  review.setAttribute('aria-controls', 'incident-timeline incident-findings');
  reset.setAttribute('aria-controls', 'incident-timeline incident-findings');
  findings.setAttribute('role', 'status');
  findings.setAttribute('aria-live', 'polite');
  findings.setAttribute('aria-atomic', 'true');
  const selection = () => inputs.filter(input => input.checked).map(input => input.value);
  const showPending = changed => {
    renderTimeline(timeline, selection());
    renderPending(findings, selection(), changed);
  };
  sources.addEventListener('change', () => showPending(true));
  review.addEventListener('click', () => renderFindings(findings, selection()));
  reset.addEventListener('click', () => {
    const defaults = new Set(getDefaultSelection());
    for (const input of inputs) input.checked = defaults.has(input.value);
    showPending(false);
  });
  showPending(false);
  return true;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountIncidentDemo(document), { once: true });
  else mountIncidentDemo(document);
}
