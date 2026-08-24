/* MoveInReport — app logic. Vanilla JS, no dependencies, no server.
   Photos are compressed client-side and stored ONLY in this browser. */
'use strict';

/* PRO unlock codes. OWNER: change before promoting (see PAYMENTS.md). */
const PRO_CODES = ['MIR-PRO-1299-67E9-2B2C', 'MIR-PRO-1299-DEMO-BC3B-7415'];
const LS = { draft: 'mir_draft', pro: 'mir_pro', saved: 'mir_saved' };

const CONDITIONS = ['Good', 'Fair', 'Needs repair'];
const TEMPLATE = ['Living room', 'Kitchen', 'Bedroom 1', 'Bedroom 2', 'Bathroom 1', 'Hallway', 'Balcony/Patio', 'Entry door & locks', 'Windows & screens', 'Water heater', 'HVAC/AC unit', 'Electrical panel'];

let areas = [
  { name: 'Living room', cond: 'Good', notes: '', photos: [] },
  { name: 'Kitchen', cond: 'Good', notes: '', photos: [] }
];
let pro = localStorage.getItem(LS.pro) === '1';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ============ photos ============ */
function compress(file, cb) {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const MAX = 800;
    let { width, height } = img;
    if (width > MAX || height > MAX) {
      const k = Math.min(MAX / width, MAX / height);
      width = Math.round(width * k); height = Math.round(height * k);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
    try { cb(canvas.toDataURL('image/jpeg', 0.72)); }
    catch (e) { /* canvas unavailable (tainted) */ cb(null); }
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}

/* ============ editor ============ */
function renderAreas() {
  const wrap = $('areas');
  wrap.innerHTML = '';
  areas.forEach((a, i) => {
    const block = document.createElement('div');
    block.className = 'area-block';
    const condOpts = CONDITIONS.map(c => `<option ${c === a.cond ? 'selected' : ''}>${c}</option>`).join('');
    block.innerHTML =
      `<div class="area-head">` +
      `<label>Area / room<input value="${esc(a.name)}" data-i="${i}" data-f="name" placeholder="e.g. Kitchen"></label>` +
      `<label>Condition<select data-i="${i}" data-f="cond">${condOpts}</select></label>` +
      `<label class="cond-l">Photos<input type="file" accept="image/*" multiple class="photo-input" data-i="${i}" style="display:none"><button class="btn-small add-photo-btn" data-i="${i}" type="button">📷 Add</button></label>` +
      `<button class="row-x" data-i="${i}" title="Remove area">✕</button>` +
      `</div>` +
      `<textarea class="area-notes" data-i="${i}" data-f="notes" placeholder="Notes — walls, floor, fixtures, stains, existing damage...">${esc(a.notes)}</textarea>` +
      `<div class="photo-row" data-i="${i}">` +
      a.photos.map((p, pi) => `<div class="photo-thumb"><img src="${p}" alt=""><button class="photo-x" data-i="${i}" data-pi="${pi}" title="Remove photo">✕</button></div>`).join('') +
      `<button class="add-photo add-photo-btn" data-i="${i}" type="button">+ photo</button>` +
      `</div>`;
    wrap.appendChild(block);
  });
}

/* ============ preview ============ */
function render() {
  $('p_type').textContent = ($('insType').value || 'MOVE-IN').toUpperCase() + ($('unit').value ? ' — UNIT ' + $('unit').value : '');
  $('p_date').textContent = $('insDate').value || new Date().toISOString().slice(0, 10);
  $('p_unit').textContent = $('unit').value ? 'Unit: ' + $('unit').value : '';
  $('p_addr').textContent = $('insAddr').value || '—';
  $('p_ll').textContent = pro ? ($('landlord').value || '—') : ($('landlord').value || '—');
  $('p_tn').textContent = $('tenant').value || '—';

  const box = $('p_areas');
  box.innerHTML = '';
  const shown = areas.filter(a => a.name || a.notes || a.photos.length);
  if (!shown.length) box.innerHTML = '<div style="color:#667085;font-size:.8rem">Add areas on the left — they appear here.</div>';
  shown.forEach(a => {
    const condClass = a.cond === 'Good' ? 'cond-good' : a.cond === 'Fair' ? 'cond-fair' : 'cond-bad';
    const div = document.createElement('div');
    div.className = 'rd-area';
    div.innerHTML =
      `<div class="rd-area-name"><span>${esc(a.name || 'Unnamed area')}</span><span class="rd-cond ${condClass}">${esc(a.cond)}</span></div>` +
      (a.notes ? `<div class="rd-notes">${esc(a.notes)}</div>` : '') +
      (a.photos.length ? `<div class="rd-photos">${a.photos.map(p => `<img src="${p}" alt="">`).join('')}</div>` : '');
    box.appendChild(div);
  });
  $('p_foot').textContent = pro
    ? ($('landlord').value ? esc($('landlord').value) : 'Prepared with MoveInReport PRO')
    : 'Made with MoveInReport — free inspection report maker';
  saveDraft();
}

/* ============ persistence ============ */
function saveDraft() {
  try { localStorage.setItem(LS.draft, JSON.stringify({ meta: metaState(), areas })); }
  catch (e) {
    // quota (photos) → save without photos
    try { localStorage.setItem(LS.draft, JSON.stringify({ meta: metaState(), areas: areas.map(a => ({ ...a, photos: [] })) })); } catch (e2) {}
  }
}
function metaState() {
  return { t: $('insType').value, d: $('insDate').value, a: $('insAddr').value, l: $('landlord').value, n: $('tenant').value, u: $('unit').value };
}
function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(LS.draft) || 'null');
    if (!d) return;
    const m = d.meta || {};
    $('insType').value = m.t ?? 'Move-in'; $('insDate').value = m.d ?? '';
    $('insAddr').value = m.a ?? ''; $('landlord').value = m.l ?? '';
    $('tenant').value = m.n ?? ''; $('unit').value = m.u ?? '';
    if (Array.isArray(d.areas) && d.areas.length) areas = d.areas;
  } catch (e) {}
}

/* ============ PRO / saved reports ============ */
function applyPro() {
  $('proBadge').classList.toggle('hidden', !pro);
  $('tplBtn').classList.toggle('hidden', !pro);
  $('savedBtn').classList.toggle('hidden', !pro);
}
function getSaved() { try { return JSON.parse(localStorage.getItem(LS.saved) || '[]'); } catch (e) { return []; } }
function saveCurrentReport() {
  if (!pro) return;
  const name = ($('insAddr').value || 'Report') + ( $('unit').value ? ' ' + $('unit').value : '');
  const saved = getSaved().filter(r => !(r.name === name && r.at === undefined));
  try {
    saved.unshift({ name, at: new Date().toISOString(), meta: metaState(), areas });
    localStorage.setItem(LS.saved, JSON.stringify(saved.slice(0, 20)));
  } catch (e) { alert('Not enough storage for photos — save fewer photo-heavy reports.'); }
}
function renderSaved() {
  const list = getSaved();
  $('savedList').innerHTML = list.length
    ? list.map((r, i) => `<li><div><strong>${esc(r.name)}</strong><br><small>${(r.at || '').slice(0, 10)} · ${r.areas.length} areas</small></div><button data-si="${i}">Open</button></li>`).join('')
    : '<li style="color:#667085">No saved reports yet. Reports save when you press Print.</li>';
}

/* ============ wire-up ============ */
document.addEventListener('DOMContentLoaded', () => {
  loadDraft();
  if (!$('insDate').value) $('insDate').value = new Date().toISOString().slice(0, 10);
  renderAreas();
  applyPro();

  ['insType','insDate','insAddr','landlord','tenant','unit'].forEach(id => $(id).addEventListener('input', render));

  // area edits (delegated)
  $('areas').addEventListener('input', e => {
    const t = e.target, i = +t.dataset.i, f = t.dataset.f;
    if (f === undefined || Number.isNaN(i)) return;
    if (f === 'name' || f === 'notes') areas[i][f] = t.value;
    else if (f === 'cond') areas[i].cond = t.value;
    render();
  });
  $('areas').addEventListener('change', e => {
    const t = e.target;
    if (t.classList.contains('photo-input')) {
      const i = +t.dataset.i;
      [...t.files].forEach(file => compress(file, data => {
        if (data) areas[i].photos.push(data);
        renderAreas(); render();
      }));
    }
  });
  $('areas').addEventListener('click', e => {
    const addBtn = e.target.closest('.add-photo-btn');
    if (addBtn) {
      const i = +addBtn.dataset.i;
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
      input.addEventListener('change', () => {
        [...input.files].forEach(file => compress(file, data => {
          if (data) areas[i].photos.push(data);
          renderAreas(); render();
        }));
      });
      input.click();
      return;
    }
    const px = e.target.closest('.photo-x');
    if (px) { areas[+px.dataset.i].photos.splice(+px.dataset.pi, 1); renderAreas(); render(); return; }
    if (e.target.classList.contains('row-x')) { areas.splice(+e.target.dataset.i, 1); renderAreas(); render(); }
  });

  $('addArea').addEventListener('click', () => { areas.push({ name: '', cond: 'Good', notes: '', photos: [] }); renderAreas(); render(); });
  $('tplBtn').addEventListener('click', () => {
    if (!confirm('Replace current areas with the standard apartment checklist?')) return;
    areas = TEMPLATE.map(n => ({ name: n, cond: 'Good', notes: '', photos: [] }));
    renderAreas(); render();
  });
  $('newBtn').addEventListener('click', () => {
    if (!confirm('Start a new report? Unsaved changes are kept in the draft until you replace it.')) return;
    areas = [{ name: '', cond: 'Good', notes: '', photos: [] }];
    $('insAddr').value = $('landlord').value = $('tenant').value = $('unit').value = '';
    renderAreas(); render();
  });
  $('printBtn').addEventListener('click', () => { saveCurrentReport(); window.print(); });

  // pay modal
  const openPay = () => { $('payModal').classList.remove('hidden'); $('codeMsg').textContent = ''; };
  $('proBtn').addEventListener('click', openPay);
  $('proBtn2').addEventListener('click', openPay);
  $('payClose').addEventListener('click', () => $('payModal').classList.add('hidden'));
  $('codeBtn').addEventListener('click', () => {
    const code = $('codeInput').value.trim().toUpperCase();
    if (PRO_CODES.map(c => c.toUpperCase()).includes(code)) {
      pro = true; localStorage.setItem(LS.pro, '1'); applyPro(); render();
      $('codeMsg').textContent = '✓ PRO unlocked — saved reports, templates and branding are active.';
      $('codeMsg').className = 'code-msg ok';
      setTimeout(() => $('payModal').classList.add('hidden'), 1500);
    } else {
      $('codeMsg').textContent = 'Invalid code — check the code from your payment receipt.';
      $('codeMsg').className = 'code-msg bad';
    }
  });
  $('codeInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('codeBtn').click(); });

  // saved modal
  $('savedBtn').addEventListener('click', () => { renderSaved(); $('savedModal').classList.remove('hidden'); });
  $('savedClose').addEventListener('click', () => $('savedModal').classList.add('hidden'));
  $('savedList').addEventListener('click', e => {
    const btn = e.target.closest('button[data-si]'); if (!btn) return;
    const r = getSaved()[+btn.dataset.si];
    if (!r) return;
    areas = r.areas.map(a => ({ ...a, photos: a.photos || [] }));
    const m = r.meta || {};
    $('insType').value = m.t ?? 'Move-in'; $('insDate').value = m.d ?? '';
    $('insAddr').value = m.a ?? ''; $('landlord').value = m.l ?? '';
    $('tenant').value = m.n ?? ''; $('unit').value = m.u ?? '';
    renderAreas(); render(); $('savedModal').classList.add('hidden');
  });

  document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.add('hidden'); }));

  render();
});
