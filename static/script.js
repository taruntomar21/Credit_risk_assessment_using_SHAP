const form = document.getElementById('form');
const submitBtn = document.getElementById('submit');
const label = submitBtn.querySelector('.btn-label');
const panel = document.getElementById('result');
const arc = document.getElementById('arc');
const tick = document.getElementById('tick');
const pctEl = document.getElementById('pct');
const verdict = document.getElementById('verdict');
const detail = document.getElementById('detail');
const income = form.person_income, amount = form.loan_amnt, share = form.loan_percent_income;
 
// Loan share of income is derived, so users can't enter inconsistent values.
function updateShare() {
  const i = parseFloat(income.value), a = parseFloat(amount.value);
  share.value = i > 0 && a >= 0 ? (a / i).toFixed(2) : '';
}
income.addEventListener('input', updateShare);
amount.addEventListener('input', updateShare);
 
form.addEventListener('input', e => e.target.classList.remove('invalid'));
 
document.getElementById('sample').addEventListener('click', () => {
  const s = { person_age: 27, person_income: 58000, person_home_ownership: 'RENT', person_emp_length: 4,
    loan_intent: 'PERSONAL', loan_grade: 'B', loan_amnt: 12000, loan_int_rate: 11.5, cb_person_cred_hist_length: 5 };
  Object.entries(s).forEach(([k, v]) => form[k].value = v);
  form.cb_person_default_on_file.value = 'N';
  updateShare();
});
 
function countUp(target, ms = 1300) {
  const start = performance.now();
  (function frame(now) {
    const t = Math.min((now - start) / ms, 1);
    pctEl.textContent = (target * (1 - Math.pow(1 - t, 4))).toFixed(1);
    if (t < 1) requestAnimationFrame(frame);
  })(start);
}
 
function placeTick(threshold) {
  const a = Math.PI * (1 - threshold), c = 100;
  const pt = r => [c + r * Math.cos(a), c - r * Math.sin(a)];
  const [x1, y1] = pt(80), [x2, y2] = pt(104);
  tick.setAttribute('x1', x1); tick.setAttribute('y1', y1);
  tick.setAttribute('x2', x2); tick.setAttribute('y2', y2);
}
 
function show(state, p, text, sub) {
  panel.classList.remove('pop');
  panel.dataset.state = state;
  verdict.textContent = text;
  detail.textContent = sub;
  arc.style.strokeDashoffset = 100 - p * 100;
  if (state === 'low' || state === 'high') { countUp(p * 100); void panel.offsetWidth; panel.classList.add('pop'); }
  else pctEl.textContent = '--';
}
 
form.addEventListener('submit', async e => {
  e.preventDefault();
  let ok = true;
  [...form.elements].forEach(el => {
    if (el.name && el.type !== 'radio' && !el.readOnly && !el.checkValidity()) { el.classList.add('invalid'); ok = false; }
  });
  if (!ok || !share.value) { form.querySelector('.invalid')?.focus(); return; }
 
  const f = new FormData(form), num = k => parseFloat(f.get(k));
  const payload = {
    person_age: parseInt(f.get('person_age'), 10), person_income: num('person_income'),
    person_home_ownership: f.get('person_home_ownership'), person_emp_length: num('person_emp_length'),
    loan_intent: f.get('loan_intent'), loan_grade: f.get('loan_grade'), loan_amnt: num('loan_amnt'),
    loan_int_rate: num('loan_int_rate'), loan_percent_income: num('loan_percent_income'),
    cb_person_default_on_file: f.get('cb_person_default_on_file'),
    cb_person_cred_hist_length: parseInt(f.get('cb_person_cred_hist_length'), 10)
  };
 
  submitBtn.disabled = true; submitBtn.classList.add('loading'); label.textContent = 'Assessing';
  try {
    const res = await fetch('/predict', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) {
      const hint = res.status === 422 ? 'Some values were rejected. Check the form and try again.'
        : [404, 405].includes(res.status) ? 'The /predict endpoint was not found. Open the app from the FastAPI server URL, not as a local file.'
        : 'The model failed on the server. Check the server logs.';
      throw new Error(`${hint} (HTTP ${res.status})`);
    }
    const r = await res.json();
    const p = Math.min(Math.max(r.default_probability, 0), 1), th = r.threshold;
    placeTick(th);
    const high = r.default_prediction === 1;
    show(high ? 'high' : 'low', p,
      high ? 'High risk' : 'Low risk',
      `Decision threshold is ${(th * 100).toFixed(1)}%. This application ${high ? 'is above' : 'is below'} it.`);
  } catch (err) {
    show('error', 0, 'Could not assess', err.message || 'Check your connection and try again.');
  } finally {
    submitBtn.disabled = false; submitBtn.classList.remove('loading'); label.textContent = 'Assess risk';
  }
});