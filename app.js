'use strict';
// Synthetic examples only. No requests, tracking, storage or external integrations.
const rows = [
  {region:'North', received:120, completed:100, onTime:92},
  {region:'Central', received:100, completed:80, onTime:64},
  {region:'South', received:80, completed:60, onTime:54}
];
const byId = id => document.getElementById(id);
const pct = (a,b) => b === 0 ? 0 : a / b * 100;
function renderKpi() {
  const selected = rows.filter(r => byId('region').value === 'all' || r.region === byId('region').value);
  const total = selected.reduce((a,r) => ({received:a.received+r.received, completed:a.completed+r.completed, onTime:a.onTime+r.onTime}), {received:0,completed:0,onTime:0});
  const rate = pct(total.onTime,total.completed);
  const target = Number(byId('target').value);
  byId('target-value').textContent = `${target}%`;
  byId('metrics').innerHTML = `<div><strong>${total.completed}</strong><span>Completed / ${total.received} received</span></div><div><strong>${rate.toFixed(1)}%</strong><span>On time / completed</span></div><div><strong>${pct(total.completed,total.received).toFixed(1)}%</strong><span>Completion rate</span></div>`;
  byId('chart').innerHTML = selected.map(r => `<div class="bar-row"><span>${r.region}</span><div class="bar-track"><div class="bar" style="width:${pct(r.onTime,r.completed)}%"></div></div><span>${pct(r.onTime,r.completed).toFixed(0)}%</span></div>`).join('');
  byId('chart').setAttribute('aria-label', 'Fictional on-time rates: '+selected.map(r=>`${r.region} ${pct(r.onTime,r.completed).toFixed(1)} percent`).join(', '));
  const gap = rate-target;
  byId('insight').textContent = `Fictional sample: ${Math.abs(gap).toFixed(1)} percentage points ${gap >= 0 ? 'at or above' : 'below'} the ${target}% on-time target. ${total.received-total.completed} pending requests are excluded from this metric. Changing a target does not change the underlying performance.`;
}
byId('region').addEventListener('change',renderKpi);
byId('target').addEventListener('input',renderKpi);
byId('reset-kpi').addEventListener('click',()=>{byId('region').value='all';byId('target').value=90;renderKpi();});
function routeScenario(mode,request,complete,sensitive) {
  if (sensitive) return {destination:'Human review queue',reason:'Sensitive decisions override automatic routing.',step:'Pause automatic processing and request a human review.'};
  if (!complete) return {destination:'Information needed',reason:'Required information is incomplete.',step:'Return a checklist of missing information before assignment.'};
  if (request==='technical') return {destination:'Technical support queue',reason:'A technical issue needs specialist review.',step:'Prepare a technical triage handoff.'};
  if (request==='billing') return {destination:'Billing review queue',reason:'A billing question requires the relevant specialist.',step:'Prepare a billing handoff; do not approve a payment.'};
  return mode==='enrollment' ? {destination:'Enrollment review',reason:'The sample request is complete and passes the demo checks.',step:'Show the review checkpoint and draft a standardized handoff.'} : {destination:'Enrollment inbox label',reason:'A complete enrollment request matches the example routing rule.',step:'Preview a label and suggested owner; no email is sent.'};
}
byId('workflow').addEventListener('submit',event=>{
  event.preventDefault();
  const mode=byId('mode').value, request=byId('request').value;
  const result=routeScenario(mode,request,byId('complete').value==='yes',byId('sensitive').checked);
  byId('route').replaceChildren();
  const title=document.createElement('strong');title.textContent=result.destination;
  const list=document.createElement('ol');
  [mode==='enrollment'?'Start enrollment concept':'Start inbox routing concept',result.reason,result.step].forEach(text=>{const li=document.createElement('li');li.textContent=text;list.append(li);});
  const note=document.createElement('p');note.className='fine';note.textContent='Simulation complete. No real request was processed.';
  byId('route').append(title,list,note);
});
byId('workflow').addEventListener('reset',()=>{byId('route').textContent='Choose a scenario, then run the simulation.';});
renderKpi();
