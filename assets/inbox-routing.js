/* Portfolio prototype. Every message, queue and rule below is fictional. */
const OPTIONS = Object.freeze({
  category: Object.freeze({ enrollment: 'Enrollment request', technical: 'Technical issue', billing: 'Billing question', unclear: 'Unclear or mixed request' }),
  requestStatus: Object.freeze({ new: 'New request', existing: 'Existing open request', closed: 'Previously closed request' }),
  recordMatch: Object.freeze({ matched: 'One fictional record matches', missing: 'No matching record', conflicting: 'Conflicting matches' }),
  information: Object.freeze({ complete: 'Required demo information is complete', missing: 'Required demo information is missing' })
});
export const ROUTING_RULES = Object.freeze([
  Object.freeze({ id: '01', label: 'Protect sensitive decisions', detail: 'A sensitive decision always goes to human review.' }),
  Object.freeze({ id: '02', label: 'Resolve conflicting matches', detail: 'Conflicting records require a person to resolve ownership.' }),
  Object.freeze({ id: '03', label: 'Check the information', detail: 'A missing record or missing required information pauses routing.' }),
  Object.freeze({ id: '04', label: 'Review closed requests', detail: 'A closed request is reviewed before any reopening decision.' }),
  Object.freeze({ id: '05', label: 'Clarify the request', detail: 'An unclear or mixed request needs classification review.' }),
  Object.freeze({ id: '06', label: 'Keep existing ownership', detail: 'A complete, clear, open request returns to its existing demo owner.' }),
  Object.freeze({ id: '07', label: 'Route a new request', detail: 'A complete, clear, new request follows its issue type.' })
]);
const scenario = (id, title, subject, body, facts) => Object.freeze({ id, title, subject, body, facts: Object.freeze(facts) });
export const INBOX_SAMPLES = Object.freeze([
  scenario('enrollment', '01 · A clear new request', 'New enrollment request · DEMO-101', 'Please review this new enrollment request. The fictional reference and required details are included.', { category: 'enrollment', requestStatus: 'new', recordMatch: 'matched', information: 'complete', sensitive: false }),
  scenario('existing', '02 · A follow-up with an owner', 'Update on an open technical request · DEMO-202', 'This is a follow-up to an existing technical request. The matching demo record already has an owner.', { category: 'technical', requestStatus: 'existing', recordMatch: 'matched', information: 'complete', sensitive: false }),
  scenario('missing', '03 · Missing information', 'Billing question · reference needed', 'Please review a billing question. The fictional reference is missing, so no single record can be matched.', { category: 'billing', requestStatus: 'new', recordMatch: 'missing', information: 'missing', sensitive: false }),
  scenario('conflict', '04 · Conflicting matches', 'Enrollment query · two possible records', 'The demo reference points to two records. Ownership must be clarified before a destination is suggested.', { category: 'enrollment', requestStatus: 'new', recordMatch: 'conflicting', information: 'complete', sensitive: false }),
  scenario('sensitive', '05 · A decision for a person', 'Exception request · DEMO-505', 'The sender asks for an exception to a previously closed request. This fictional scenario requires a sensitive decision.', { category: 'unclear', requestStatus: 'closed', recordMatch: 'matched', information: 'complete', sensitive: true })
]);
export function validateRoutingFacts(facts) {
  const value = facts || {};
  const issues = Object.keys(OPTIONS).filter(key => !Object.hasOwn(OPTIONS[key], value[key]));
  if (typeof value.sensitive !== 'boolean') issues.push('sensitive');
  return issues;
}
export function evaluateInboxRoute(facts) {
  const issues = validateRoutingFacts(facts);
  if (issues.length) return { valid: false, issues, trace: [] };
  const trace = [];
  const decide = (index, matched, reason) => {
    trace.push({ ...ROUTING_RULES[index], matched, reason });
    return matched;
  };
  const result = (queue, disposition, nextStep) => ({
    valid: true, queue, disposition, nextStep, rule: ROUTING_RULES[trace.length - 1], trace,
    facts: { category: facts.category, requestStatus: facts.requestStatus, recordMatch: facts.recordMatch, information: facts.information, sensitive: facts.sensitive }
  });
  if (decide(0, facts.sensitive, facts.sensitive ? 'A sensitive decision is flagged.' : 'No sensitive decision is flagged.'))
    return result('Demo human review', 'Hold for a person', 'Review the exception and determine the appropriate owner. Do not infer approval from this simulation.');
  if (decide(1, facts.recordMatch === 'conflicting', facts.recordMatch === 'conflicting' ? 'More than one fictional record could match.' : 'No conflicting record match is selected.'))
    return result('Demo ownership review', 'Hold for a person', 'Resolve the conflicting records and confirm one owner before proposing a destination.');
  const missing = facts.recordMatch === 'missing' || facts.information === 'missing';
  if (decide(2, missing, missing ? [facts.recordMatch === 'missing' ? 'No matching record is available.' : '', facts.information === 'missing' ? 'Required information is missing.' : ''].filter(Boolean).join(' ') : 'One record matches and the required information is complete.'))
    return result('Demo information review', 'Hold for missing information', 'Identify the missing information and confirm a single matching record before evaluating a destination again.');
  if (decide(3, facts.requestStatus === 'closed', facts.requestStatus === 'closed' ? 'The fictional request is marked closed.' : 'The request is not marked closed.'))
    return result('Demo closure review', 'Hold for a person', 'Review the closed record. Reopening or creating a new request requires a separate decision.');
  if (decide(4, facts.category === 'unclear', facts.category === 'unclear' ? 'The request type is unclear or mixed.' : 'One clear request type is selected.'))
    return result('Demo classification review', 'Hold for clarification', 'Clarify the primary request type before selecting a team.');
  if (decide(5, facts.requestStatus === 'existing', facts.requestStatus === 'existing' ? 'An existing open request has a matching demo owner.' : 'This is a new request with no existing owner to preserve.'))
    return result('Demo existing request owner', 'Suggested destination', 'Review the proposed handoff to the existing owner. No message or record is moved.');
  decide(6, true, `A new, complete request is classified as ${OPTIONS.category[facts.category].toLowerCase()}.`);
  return result({ enrollment: 'Demo enrollment review', technical: 'Demo technical review', billing: 'Demo billing review' }[facts.category], 'Suggested destination', 'Review the proposed destination and its supporting facts. No message is sent or assigned.');
}
export function describeRoutingFacts(facts) {
  if (validateRoutingFacts(facts).length) return [];
  return [...Object.entries(OPTIONS).map(([key, labels]) => [({category:'Request type', requestStatus:'Request status', recordMatch:'Record match', information:'Information'})[key], labels[facts[key]]]), ['Sensitive decision', facts.sensitive ? 'Human decision required' : 'Not flagged in this demo']];
}
function appendText(doc, parent, tag, value, className) {
  const node = doc.createElement(tag); node.textContent = value;
  if (className) node.className = className;
  parent.append(node); return node;
}
export function mountInboxRouting(doc) {
  if (!doc?.getElementById) return false;
  const ids = ['inbox-simulator','inbox-sample','inbox-subject','inbox-message','inbox-edited','inbox-result','inbox-status','inbox-run','inbox-reset'];
  const nodes = Object.fromEntries(ids.map(id => [id, doc.getElementById(id)]));
  const fields = Object.fromEntries(['category','requestStatus','recordMatch','information','sensitive'].map(key => [key, doc.getElementById(`inbox-${key}`)]));
  if (Object.values(nodes).some(node => !node) || Object.values(fields).some(node => !node)) return false;
  const form = nodes['inbox-simulator'];
  if (form.dataset.inboxInitialized === 'true') return true;
  form.dataset.inboxInitialized = 'true';
  const output = nodes['inbox-result'], status = nodes['inbox-status'];
  let selectedSample = INBOX_SAMPLES[0];
  const read = () => Object.fromEntries(Object.entries(fields).map(([key,node]) => [key, key === 'sensitive' ? node.checked === true : node.value]));
  const pending = (message) => {
    output.replaceChildren();
    appendText(doc, output, 'p', 'Choose a sample, adjust its routing facts and evaluate the scenario.', 'inbox-pending');
    status.textContent = message;
  };
  const syncModified = () => {
    const state = read();
    nodes['inbox-edited'].hidden = Object.keys(fields).every(key => state[key] === selectedSample.facts[key]);
  };
  const loadSample = (sample, announce = true) => {
    selectedSample = sample;
    nodes['inbox-sample'].value = sample.id;
    nodes['inbox-subject'].textContent = sample.subject;
    nodes['inbox-message'].textContent = sample.body;
    for (const [key,node] of Object.entries(fields)) { if (key === 'sensitive') node.checked = sample.facts[key]; else node.value = sample.facts[key]; }
    syncModified(); pending(announce ? 'Sample loaded. Evaluate it to see the proposed route.' : 'Fictional sample ready. No messages are connected.');
  };
  nodes['inbox-sample'].addEventListener('change', () => {
    const sample = INBOX_SAMPLES.find(item => item.id === nodes['inbox-sample'].value);
    if (sample) loadSample(sample);
    else pending('Choose one of the available fictional samples.');
  });
  const onEdit = event => {
    if (!Object.values(fields).includes(event.target)) return;
    syncModified(); pending('Routing facts changed. Evaluate again to see a current result.');
  };
  form.addEventListener('change', onEdit);
  form.addEventListener('input', onEdit);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const evaluated = evaluateInboxRoute(read());
    if (!evaluated.valid) {
      pending('Choose a valid value for each routing fact.'); fields[evaluated.issues[0]]?.focus(); return;
    }
    output.replaceChildren();
    appendText(doc, output, 'p', evaluated.disposition, 'inbox-result-eyebrow');
    const heading = appendText(doc, output, 'h3', evaluated.queue, 'inbox-result-title');
    heading.tabIndex = -1;
    appendText(doc, output, 'p', evaluated.nextStep, 'inbox-next-step');
    const columns = doc.createElement('div'); columns.className = 'inbox-result-columns';
    const reasoning = doc.createElement('div');
    appendText(doc, reasoning, 'h4', `Decision path · rule ${evaluated.rule.id} applies`);
    const trace = doc.createElement('ol'); trace.className = 'inbox-trace';
    for (const rule of evaluated.trace) {
      const item = doc.createElement('li'); item.className = rule.matched ? 'inbox-rule-applied' : '';
      appendText(doc, item, 'span', `${rule.id} · ${rule.matched ? 'Applied' : 'Continue'} — ${rule.label}`, 'inbox-rule-label');
      appendText(doc, item, 'p', rule.reason); trace.append(item);
    }
    reasoning.append(trace);
    const handoff = doc.createElement('div');
    appendText(doc, handoff, 'h4', 'Facts for the proposed handoff');
    const list = doc.createElement('dl'); list.className = 'inbox-handoff';
    for (const [label,value] of describeRoutingFacts(evaluated.facts)) { appendText(doc, list, 'dt', label); appendText(doc, list, 'dd', value); }
    handoff.append(list); columns.append(reasoning,handoff); output.append(columns);
    appendText(doc, output, 'p', 'Simulation only. No email was read, labeled, assigned or sent.', 'inbox-result-boundary');
    status.textContent = `Scenario evaluated. ${evaluated.disposition}. Rule ${evaluated.rule.id} applies.`;
    heading.focus();
  });
  nodes['inbox-reset'].addEventListener('click', () => { loadSample(INBOX_SAMPLES[0], false); status.textContent = 'Simulator reset to the first fictional sample.'; nodes['inbox-sample'].focus(); });
  nodes['inbox-run'].disabled = false; nodes['inbox-reset'].disabled = false;
  loadSample(INBOX_SAMPLES[0], false);
  return true;
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountInboxRouting(document), {once: true});
  else mountInboxRouting(document);
}
