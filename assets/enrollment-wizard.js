/* New portfolio prototype: every queue, site and routing rule is fictional. */
export const INITIAL_STATE = Object.freeze({
  requestType: '', region: '', site: '', delivery: '', recordCheck: '', continuation: '',
  instructionsReviewed: false, exception: '', detailsChecked: false
});
export const FIELD_IDS = Object.freeze({
  requestType: 'request-type', region: 'region', site: 'site', delivery: 'delivery',
  recordCheck: 'record-check', continuation: 'continuation', instructionsReviewed: 'instructions-reviewed',
  exception: 'exception', detailsChecked: 'details-checked'
});
export const STEP_TITLES = Object.freeze(['Define the request', 'Follow the route', 'Review the checkpoints', 'Review the draft']);
const OPTIONS = Object.freeze({
  requestType: Object.freeze({ new: 'New enrollment', renewal: 'Renewal' }),
  region: Object.freeze({ north: 'Fictional North region', central: 'Fictional Central region', south: 'Fictional South region' }),
  site: Object.freeze({ 'demo-01': 'Demo Site 01', 'demo-02': 'Demo Site 02' }),
  delivery: Object.freeze({ 'self-paced': 'Self-paced', guided: 'Guided' }),
  recordCheck: Object.freeze({ matched: 'Fictional record matched', unresolved: 'Fictional record unresolved' }),
  continuation: Object.freeze({ same: 'Continue the same path', change: 'Request a path change' }),
  exception: Object.freeze({ none: 'No unresolved demo exception', review: 'Unresolved exception requires review' })
});
const QUEUES = Object.freeze({ north: 'Demo North queue', central: 'Demo Central queue', south: 'Demo South queue' });
const ERRORS = Object.freeze({
  requestType: 'Choose a request type.', region: 'Choose a fictional region.', site: 'Choose a fictional site.',
  delivery: 'Choose a delivery path.', recordCheck: 'Choose the fictional record status.',
  continuation: 'Choose the renewal continuation path.', instructionsReviewed: 'Mark the demo instructions as reviewed.',
  exception: 'Choose whether a demo exception needs review.', detailsChecked: 'Mark the demo details as checked.'
});
export function createInitialState() { return { ...INITIAL_STATE }; }
function hasOption(field, value) { return Object.hasOwn(OPTIONS[field], value); }
export function fieldsForStep(state, step) {
  state = state || INITIAL_STATE;
  if (step === 1) return ['requestType', 'region'];
  if (step === 2) return state.requestType === 'new' ? ['site', 'delivery'] : state.requestType === 'renewal' ? ['recordCheck', 'continuation'] : ['requestType'];
  if (step === 3) return ['instructionsReviewed', 'exception', 'detailsChecked'];
  return [];
}
export function validateStep(state, step) {
  const value = state || INITIAL_STATE;
  return fieldsForStep(value, step).filter(field =>
    field === 'instructionsReviewed' || field === 'detailsChecked'
      ? value[field] !== true : !hasOption(field, value[field])
  ).map(field => ({ field, id: FIELD_IDS[field], message: ERRORS[field] }));
}
export function validateWizard(state) {
  const issues = [1, 2, 3].flatMap(step => validateStep(state, step));
  return issues.filter((issue, index) => issues.findIndex(other => other.field === issue.field) === index);
}
/** Only active values participate in a draft; hidden branch values never leak into it. */
export function canonicalWizardState(state) {
  const value = state || INITIAL_STATE;
  const result = { requestType: value.requestType, region: value.region };
  if (value.requestType === 'new') Object.assign(result, { site: value.site, delivery: value.delivery });
  if (value.requestType === 'renewal') Object.assign(result, { recordCheck: value.recordCheck, continuation: value.continuation });
  return { ...result, instructionsReviewed: value.instructionsReviewed === true, exception: value.exception, detailsChecked: value.detailsChecked === true };
}
function routeForValidatedSelections(state) {
  const holds = [];
  if (state.requestType === 'renewal' && state.recordCheck === 'unresolved') holds.push('The fictional record remains unresolved.');
  if (state.requestType === 'renewal' && state.continuation === 'change') holds.push('A requested path change needs human review.');
  if (state.exception === 'review') holds.push('An unresolved demo exception needs review.');
  const baseRoute = state.requestType === 'renewal' ? 'Renewal review' : state.delivery === 'guided' ? 'Guided enrollment review' : 'Standard enrollment review';
  return {
    queue: QUEUES[state.region], baseRoute,
    route: holds.length ? 'Human review required — hold' : baseRoute,
    disposition: holds.length ? 'Human review required — hold' : state.requestType === 'new' ? 'Draft for enrollment review' : 'Draft for renewal review',
    hold: holds.length > 0, holdReasons: holds,
    nextStep: holds.length ? 'Hold the request for human review. No enrollment or system action is performed.' : 'Review this fictional draft before any further decision. No enrollment or system action is performed.'
  };
}
export function buildRoutePreview(state) {
  if (validateStep(state, 1).length) return 'Choose a request type and fictional region to see preliminary guidance.';
  if (validateStep(state, 2).length) return `Preliminary queue: ${QUEUES[state.region]}. Complete the ${state.requestType === 'new' ? 'fictional site and delivery' : 'record status and continuation'} selections to define the review path.`;
  const route = routeForValidatedSelections(state);
  return `Preliminary route: ${route.queue} → ${route.route}. Final checkpoint answers can require a hold. This is guidance for a fictional draft only.`;
}
export function buildWizardSummary(state) {
  if (validateWizard(state).length) return null;
  const values = canonicalWizardState(state);
  const route = routeForValidatedSelections(values);
  const items = [
    ['Request', OPTIONS.requestType[values.requestType]], ['Context', OPTIONS.region[values.region]],
    ...(values.requestType === 'new'
      ? [['Fictional site', OPTIONS.site[values.site]], ['Delivery path', OPTIONS.delivery[values.delivery]]]
      : [['Record check', OPTIONS.recordCheck[values.recordCheck]], ['Continuation', OPTIONS.continuation[values.continuation]]]),
    ['Demo queue', route.queue], ['Review path', route.route],
    ['Instructions', 'Demo instructions reviewed'], ['Details', 'Demo details checked'], ['Exception', OPTIONS.exception[values.exception]]
  ];
  return { ...route, items, values };
}
export function buildOperationalNote(state) {
  const summary = buildWizardSummary(state);
  if (!summary) return '';
  return [
    'PORTFOLIO DEMONSTRATION — DRAFT ONLY',
    'Prototype based on a proposal; original implementation is not claimed.',
    '', ...summary.items.map(([label, value]) => `${label}: ${value}`),
    `Draft disposition: ${summary.disposition}`,
    ...(summary.holdReasons.length ? ['', 'Reasons for human review:', ...summary.holdReasons.map(reason => `- ${reason}`)] : []),
    '', `Next step: ${summary.nextStep}`,
    'All queue names, sites and rules are fictional. No enrollment or system action performed.'
  ].join('\n');
}
function appendText(doc, parent, tag, text, className) {
  const node = doc.createElement(tag); node.textContent = text;
  if (className) node.className = className;
  parent.append(node); return node;
}
export function mountEnrollmentWizard(root, environment = {}) {
  if (!root || typeof root.getElementById !== 'function') return false;
  const ids = ['enrollment-wizard','wizard-progress','wizard-step-title','wizard-errors','wizard-back','wizard-next','wizard-reset','wizard-copy','wizard-note','wizard-summary','wizard-status'];
  const nodes = Object.fromEntries(ids.map(id => [id, root.getElementById(id)]));
  const fields = Object.fromEntries(Object.entries(FIELD_IDS).map(([key,id]) => [key, root.getElementById(id)]));
  if (Object.values(nodes).some(node => !node) || Object.values(fields).some(node => !node)) return false;
  const form = nodes['enrollment-wizard'];
  if (form.dataset.enrollmentInitialized === 'true') return true;
  const panels = Array.from(form.querySelectorAll('[data-wizard-step]'));
  const progress = Array.from(nodes['wizard-progress'].querySelectorAll('li'));
  const newFields = form.querySelector('[data-new-fields]');
  const renewalFields = form.querySelector('[data-renewal-fields]');
  if (panels.length !== 4 || new Set(panels.map(panel => Number(panel.dataset.wizardStep))).size !== 4 || panels.some(panel => ![1,2,3,4].includes(Number(panel.dataset.wizardStep))) || progress.length !== 4 || !newFields || !renewalFields) return false;
  const title = nodes['wizard-step-title'], errors = nodes['wizard-errors'], back = nodes['wizard-back'], next = nodes['wizard-next'];
  const reset = nodes['wizard-reset'], copy = nodes['wizard-copy'], note = nodes['wizard-note'], summary = nodes['wizard-summary'], status = nodes['wizard-status'];
  const preview = root.getElementById('wizard-route-preview');
  const errorNodes = {};
  for (const [key, control] of Object.entries(fields)) {
    const error = root.createElement('p'); error.id = `wizard-error-${FIELD_IDS[key]}`;
    error.className = 'wizard-field-error'; error.hidden = true;
    const host = control.closest?.('.wizard-field') || control.parentElement;
    if (!host) return false;
    host.append(error); errorNodes[key] = error;
  }
  form.dataset.enrollmentInitialized = 'true';
  form.noValidate = true; title.tabIndex = -1; note.readOnly = true;
  errors.setAttribute('role','alert'); status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
  let step = 1, reviewedFingerprint = null, reviewedNote = '', revision = 0;
  const readState = () => Object.fromEntries(Object.keys(FIELD_IDS).map(key => [key, key === 'instructionsReviewed' || key === 'detailsChecked' ? fields[key].checked === true : fields[key].value]));
  let observedState = readState();
  const fingerprint = () => JSON.stringify(canonicalWizardState(readState()));
  const syncBranches = () => {
    const state = readState(); newFields.hidden = state.requestType !== 'new'; renewalFields.hidden = state.requestType !== 'renewal';
    for (const key of ['site','delivery']) fields[key].disabled = state.requestType !== 'new';
    for (const key of ['recordCheck','continuation']) fields[key].disabled = state.requestType !== 'renewal';
    if (preview) preview.textContent = buildRoutePreview(state);
  };
  const clearErrors = () => {
    errors.replaceChildren(); errors.hidden = true;
    for (const [key, control] of Object.entries(fields)) {
      control.removeAttribute('aria-invalid');
      const description = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter(token => token && token !== errorNodes[key].id);
      if (description.length) control.setAttribute('aria-describedby', description.join(' ')); else control.removeAttribute('aria-describedby');
      errorNodes[key].textContent = ''; errorNodes[key].hidden = true;
    }
  };
  const invalidateReview = (message = '') => {
    revision += 1; reviewedFingerprint = null; reviewedNote = ''; note.value = ''; copy.disabled = true;
    summary.replaceChildren();
    appendText(root,summary,'p','Complete the steps to generate a current fictional draft.','wizard-summary-pending');
    if (message) status.textContent = message;
  };
  const showStep = (value, focus = true) => {
    step = value; syncBranches();
    for (const panel of panels) panel.hidden = Number(panel.dataset.wizardStep) !== step;
    progress.forEach((item,index) => {
      item.dataset.state = index + 1 === step ? 'current' : index + 1 < step ? 'complete' : 'upcoming';
      item.classList?.toggle('is-current',index + 1 === step); item.classList?.toggle('is-complete',index + 1 < step);
      if (index + 1 === step) item.setAttribute('aria-current','step'); else item.removeAttribute('aria-current');
    });
    title.textContent = `Step ${step} of 4 — ${STEP_TITLES[step - 1]}`;
    back.hidden = step === 1; back.disabled = step === 1;
    next.hidden = step === 4; next.disabled = false;
    next.textContent = step === 3 ? 'Generate draft summary →' : 'Continue →';
    copy.hidden = step !== 4; copy.disabled = step !== 4 || !reviewedFingerprint || reviewedFingerprint !== fingerprint();
    reset.disabled = false;
    if (focus) title.focus?.();
  };
  const showErrors = issues => {
    clearErrors(); errors.hidden = false;
    appendText(root,errors,'p',`Review ${issues.length === 1 ? 'the highlighted field' : 'the highlighted fields'} before continuing.`);
    const list = root.createElement('ul');
    for (const issue of issues) {
      appendText(root,list,'li',issue.message); const control = fields[issue.field], error = errorNodes[issue.field];
      error.textContent = issue.message; error.hidden = false; control.setAttribute('aria-invalid','true');
      const described = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
      if (!described.includes(error.id)) described.push(error.id);
      control.setAttribute('aria-describedby',described.join(' '));
    }
    errors.append(list); fields[issues[0].field].focus?.();
  };
  const renderSummary = () => {
    const state = readState(), result = buildWizardSummary(state);
    if (!result) { invalidateReview(); return false; }
    summary.replaceChildren();
    appendText(root,summary,'h4',result.disposition,'wizard-route-status');
    const list = root.createElement('dl'); list.className = 'wizard-summary-list';
    for (const [label,value] of result.items) { appendText(root,list,'dt',label); appendText(root,list,'dd',value); }
    summary.append(list);
    if (result.holdReasons.length) { const reasons=root.createElement('ul'); reasons.className='wizard-hold-reasons'; for(const reason of result.holdReasons)appendText(root,reasons,'li',reason); summary.append(reasons); }
    appendText(root,summary,'p',result.nextStep,'wizard-summary-boundary');
    appendText(root,summary,'p','Fictional prototype only. The draft does not confirm an enrollment or a renewal.','wizard-summary-boundary');
    reviewedNote = buildOperationalNote(state); note.value = reviewedNote; reviewedFingerprint = fingerprint();
    return true;
  };
  const advance = () => {
    if (step >= 4) return;
    let issues = validateStep(readState(),step);
    if (step === 3) issues = validateWizard(readState());
    if (issues.length) {
      const firstStep = issues[0].field === 'requestType' || issues[0].field === 'region' ? 1 : ['site','delivery','recordCheck','continuation'].includes(issues[0].field) ? 2 : 3;
      if (firstStep !== step) showStep(firstStep,false);
      showErrors(issues); return;
    }
    clearErrors(); if (step === 3 && !renderSummary()) return;
    showStep(step + 1); status.textContent = step === 4 ? 'Fictional draft generated. Review the summary before copying.' : `Step ${step} of 4. ${STEP_TITLES[step - 1]}.`;
  };
  const onEdit = event => {
    const key = Object.keys(fields).find(field => fields[field] === event.target);
    if (!key) return;
    const changedState = readState();
    // Select controls fire both input and change. Review gates are invalidated
    // only once for an actual value change, never merely by navigation/rendering.
    if (changedState[key] === observedState[key]) return;
    const upstream = ['requestType','region','site','delivery','recordCheck','continuation'].includes(key);
    const hadChecks = observedState.instructionsReviewed || observedState.detailsChecked || observedState.exception !== '';
    const hadDraft = !!reviewedFingerprint || !!reviewedNote;
    if (upstream) {
      fields.instructionsReviewed.checked = false;
      fields.detailsChecked.checked = false;
      fields.exception.value = '';
    }
    observedState = readState();
    const message = upstream && hadChecks
      ? 'Request context changed. Review and confirm the demo checkpoints again; any previous draft was cleared.'
      : hadDraft ? 'Answers changed. The previous draft was cleared; generate a new summary before copying.' : '';
    clearErrors(); invalidateReview(message); syncBranches();
  };
  const manualCopy = () => {
    let selected = false;
    try { note.focus?.(); if (typeof note.select === 'function') { note.select(); selected = true; } } catch { selected = false; }
    status.textContent = selected ? 'Automatic copying is unavailable. The draft is selected; copy it manually.' : 'Automatic copying is unavailable. Select the draft note and copy it manually.';
  };
  next.addEventListener('click',advance);
  back.addEventListener('click',() => { if(step > 1){ clearErrors(); showStep(step - 1); status.textContent=`Step ${step} of 4. Answers are preserved.`; } });
  reset.addEventListener('click',() => {
    const initial=createInitialState();
    for(const key of Object.keys(FIELD_IDS)){ if(key==='instructionsReviewed'||key==='detailsChecked')fields[key].checked=initial[key]; else fields[key].value=initial[key]; }
    observedState = readState();
    clearErrors(); invalidateReview(); showStep(1); status.textContent='Demo reset. No answers are stored or sent.';
  });
  form.addEventListener('input',onEdit); form.addEventListener('change',onEdit);
  form.addEventListener('submit',event => { event.preventDefault(); if(step < 4)advance(); });
  form.addEventListener('keydown',event => {
    if(event.key !== 'Enter' || event.isComposing || ['TEXTAREA','SELECT','BUTTON','A'].includes(event.target?.tagName))return;
    event.preventDefault(); if(step < 4)advance();
  });
  for(const edit of form.querySelectorAll('[data-wizard-edit]')) edit.addEventListener('click',() => {
    const target=Number(edit.dataset.wizardEdit);
    if(step !== 4 || ![1,2,3].includes(target))return;
    clearErrors(); invalidateReview('Editing answers. Generate a new summary before copying.'); showStep(target);
  });
  copy.addEventListener('click',async () => {
    if(step !== 4 || !reviewedFingerprint || reviewedFingerprint !== fingerprint() || !reviewedNote || note.value !== reviewedNote || validateWizard(readState()).length){
      invalidateReview('This draft is no longer current. Review the steps and generate a new summary before copying.'); return;
    }
    const currentRevision=revision, text=reviewedNote;
    copy.disabled=true; status.textContent='Copying the fictional draft note…';
    try {
      const clipboard=Object.hasOwn(environment,'clipboard') ? environment.clipboard : globalThis.navigator?.clipboard;
      if(!clipboard || typeof clipboard.writeText !== 'function')throw new Error('Clipboard unavailable');
      await clipboard.writeText(text);
      if(currentRevision===revision)status.textContent='Fictional draft note copied. No enrollment or system action was performed.';
    } catch { if(currentRevision===revision)manualCopy(); }
    finally { copy.disabled=step !== 4 || !reviewedFingerprint || reviewedFingerprint !== fingerprint(); }
  });
  clearErrors(); invalidateReview(); showStep(1,false); status.textContent='Fictional demonstration. Start with a request type and region.';
  return true;
}
if(typeof document !== 'undefined') {
  if(document.readyState === 'loading')document.addEventListener('DOMContentLoaded',()=>mountEnrollmentWizard(document),{once:true});
  else mountEnrollmentWizard(document);
}
