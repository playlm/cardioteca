/* Cardioteca — biblioteca personal de cardiología (Drive + YouTube + pendientes) */
(() => {
'use strict';

const CFG = window.CARDIOTECA || {};
const DEMO = new URLSearchParams(location.search).has('demo');
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DATA_NAME = 'cardioteca-datos.json';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const K = DEMO ? 'ctd_' : 'ct_';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const sleep = ms => new Promise(r => setTimeout(r, ms));

const LS = {
  get(k, d) { try { const v = localStorage.getItem(K + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(K + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(K + k); } catch {} }
};

/* ───────── iconos ───────── */
const I = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
  library: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10l2 2.5h6.5A1.5 1.5 0 0 1 20 8v10.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5Z"/>',
  folder: '<path d="M4 6.5A1.5 1.5 0 0 1 5.5 5H10l2 2.5h6.5A1.5 1.5 0 0 1 20 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5Z"/>',
  playFill: '<path d="M7 4.5v15l13-7.5Z" fill="currentColor" stroke="none"/>',
  play: '<rect x="3" y="5" width="18" height="14" rx="3.5"/><path d="m10.5 9.5 4 2.5-4 2.5Z" fill="currentColor"/>',
  tasks: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="m8.5 12.2 2.6 2.6 4.6-5.2"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  folderPlus: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10l2 2.5h6.5A1.5 1.5 0 0 1 20 8v10.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5Z"/><path d="M12 11v5M9.5 13.5h5"/>',
  upload: '<path d="M12 16V5"/><path d="m7.5 9.5 4.5-4.5 4.5 4.5"/><path d="M5 15.5v2A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5v-2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M5 7h14"/><path d="M9.5 7V5h5v2"/><path d="M7 7l.8 12h8.4L17 7"/>',
  edit: '<path d="m5 19 1-4L16.5 4.5a1.8 1.8 0 0 1 2.5 0l.5.5a1.8 1.8 0 0 1 0 2.5L9 18Z"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/>',
  external: '<path d="M14 5h5v5"/><path d="M19 5 11 13"/><path d="M17 14v4a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 5 18V9a1.5 1.5 0 0 1 1.5-1.5H10"/>',
  chevL: '<path d="m14.5 6-6 6 6 6"/>',
  chevR: '<path d="m9.5 6 6 6-6 6"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  download: '<path d="M12 5v11"/><path d="m7.5 11.5 4.5 4.5 4.5-4.5"/><path d="M5 19h14"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  drive: '<path d="m8 4 4 7-4 7"/><path d="M8 4h8l4 7"/><path d="M4 18h12l4-7"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/>'
};
const icon = (n, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${I[n]}</svg>`;

/* ───────── fechas ───────── */
const dkey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return dkey(d); };
const fmtLong = k => new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(fromKey(k));
const fmtShort = iso => { const d = new Date(iso); return isNaN(d) ? '' : new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' }).format(d); };
const fmtSize = b => { b = Number(b); if (!b) return ''; const u = ['B', 'KB', 'MB', 'GB']; let i = 0; while (b >= 1024 && i < 3) { b /= 1024; i++; } return `${b >= 10 || i === 0 ? Math.round(b) : b.toFixed(1)} ${u[i]}`; };
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; };

/* ───────── datos (pendientes + videos) ───────── */
let data = LS.get('data', null) || { v: 1, updatedAt: 0, videos: [], todos: {} };
data.videos ||= []; data.todos ||= {};

function touch() {
  data.updatedAt = Date.now();
  LS.set('data', data);
  scheduleSync();
}

/* ───────── estado de UI ───────── */
const ui = {
  view: 'inicio',
  today: dkey(),
  day: dkey(),
  tag: '',
  videoId: null,
  autoplay: false,
  lib: { path: [], items: [], loading: false, q: '', results: null, error: '' },
  recent: null,
  conn: DEMO ? 'on' : 'off',      // off | connecting | on | reconnect
  sync: DEMO ? 'demo' : 'local',  // local | saving | saved | error | demo
  user: DEMO ? { email: 'demo' } : null
};

/* ═════════════ Monitor de ECG ═════════════ */
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function ecg(p) {
  const g = (m, s, a) => a * Math.exp(-((p - m) ** 2) / (2 * s * s));
  return g(.15, .030, .13) + g(.295, .007, -.16) + g(.322, .009, 1) + g(.352, .009, -.30) + g(.58, .045, .24);
}
class Monitor {
  constructor(canvas) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.bpm = 62; this.speed = 130; this.x = 0; this.ys = []; this.phase0 = 0; this.last = 0; this.raf = 0;
    this.resize = this.resize.bind(this); this.frame = this.frame.bind(this);
    new ResizeObserver(this.resize).observe(canvas.parentElement || canvas);
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(this.raf), this.raf = 0; else this.start(); });
    this.resize(); this.start();
  }
  color() { return getComputedStyle(document.documentElement).getPropertyValue('--art').trim() || '#B3172B'; }
  resize() {
    const r = this.c.getBoundingClientRect(); if (!r.width) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.w = r.width; this.h = r.height;
    this.c.width = Math.round(r.width * dpr); this.c.height = Math.round(r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ys = []; this.x = 0; this.phase0 = 0;
    if (reduceMotion) { this.fill(); }
  }
  pxBeat() { return this.speed * 60 / this.bpm; }
  yAt(x) {
    const p = (((x - this.phase0) / this.pxBeat()) % 1 + 1) % 1;
    const amp = this.h * 0.36;
    return this.h * 0.58 - ecg(p) * amp + Math.sin(x * 0.05) * 0.25;
  }
  beat() { this.phase0 = this.x - this.pxBeat() * 0.1; }
  fill() { for (let x = 0; x < this.w; x += 1) this.ys[x] = this.yAt(x); this.x = this.w; this.draw(); }
  start() { if (reduceMotion || this.raf || document.hidden) return; this.last = performance.now(); this.raf = requestAnimationFrame(this.frame); }
  frame(t) {
    this.raf = requestAnimationFrame(this.frame);
    if (!this.w) { this.resize(); return; }
    const dt = Math.min((t - this.last) / 1000, .1); this.last = t;
    let nx = this.x + this.speed * dt;
    for (let x = Math.floor(this.x); x <= Math.floor(nx); x++) {
      if (x >= this.w) { this.phase0 -= this.w; this.ys = []; this.x = nx = 0; break; }
      this.ys[x] = this.yAt(x);
    }
    this.x = nx >= this.w ? 0 : nx;
    this.draw();
  }
  draw() {
    const { ctx, w, h } = this; if (!w) return;
    ctx.clearRect(0, 0, w, h);
    const col = this.color();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = col; ctx.lineWidth = h > 100 ? 2.4 : 1.8;
    const gap = reduceMotion ? 0 : 36;
    const head = this.x;
    let open = false; ctx.beginPath();
    for (let x = 0; x < w; x++) {
      const y = this.ys[x]; if (y === undefined) { open = false; continue; }
      const inGap = x > head && x < head + gap;
      if (inGap) { open = false; continue; }
      if (!open) { ctx.moveTo(x, y); open = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
    if (!reduceMotion && this.ys[Math.floor(head)] !== undefined) {
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(head, this.ys[Math.floor(head)], h > 100 ? 4 : 3, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    }
  }
  setBpm(b) { this.bpm = b; }
}
const monitors = [];
function beatAll() { monitors.forEach(m => m.beat()); }
function updateBpm() {
  const list = data.todos[ui.today] || [];
  const left = list.length ? list.filter(t => !t.done).length / list.length : 0.4;
  const bpm = Math.round(58 + left * 26);
  monitors.forEach(m => m.setBpm(bpm));
  const el = $('#bpmLabel'); if (el) el.textContent = `${bpm} lpm`;
}

/* ═════════════ Google: autenticación ═════════════ */
let tokenClient = null, token = null, tokenExp = 0, pendingAuth = null;
const stored = LS.get('token', null);
if (stored && stored.exp > Date.now()) { token = stored.t; tokenExp = stored.exp; }

function gsiReady() { return !!(window.google && google.accounts && google.accounts.oauth2); }
function initClient() {
  if (tokenClient || !CFG.CLIENT_ID || !gsiReady()) return !!tokenClient;
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CFG.CLIENT_ID, scope: SCOPE,
    callback: r => {
      const p = pendingAuth; pendingAuth = null;
      if (r.error) { p && p.reject(new Error(r.error)); return; }
      token = r.access_token; tokenExp = Date.now() + (Number(r.expires_in) - 120) * 1000;
      LS.set('token', { t: token, exp: tokenExp }); LS.set('connected', 1);
      p && p.resolve(token);
    },
    error_callback: e => { const p = pendingAuth; pendingAuth = null; p && p.reject(new Error(e.type || 'auth')); }
  });
  return true;
}
function getToken() {
  if (token && Date.now() < tokenExp) return Promise.resolve(token);
  if (pendingAuth) return pendingAuth.promise;
  if (!initClient()) return Promise.reject(new Error('Google no está listo'));
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  pendingAuth = { promise, resolve, reject };
  tokenClient.requestAccessToken({ prompt: '' });
  return promise;
}

/* ═════════════ Google Drive ═════════════ */
const Drive = {
  rootId: null, dataId: null,
  async api(path, { method = 'GET', params, body, raw, upload, headers = {} } = {}, retry = true) {
    const t = await getToken();
    const url = new URL((upload ? 'https://www.googleapis.com/upload/drive/v3/' : 'https://www.googleapis.com/drive/v3/') + path);
    Object.entries(params || {}).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
    const isJson = body && typeof body === 'object' && !(body instanceof Blob) && !(body instanceof FormData);
    const res = await fetch(url, {
      method, headers: { Authorization: `Bearer ${t}`, ...(isJson ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: isJson ? JSON.stringify(body) : body
    });
    if (res.status === 401 && retry) { token = null; LS.del('token'); return this.api(path, { method, params, body, raw, upload, headers }, false); }
    if (!res.ok) { let m = res.statusText; try { m = (await res.json()).error.message; } catch {} const e = new Error(m); e.status = res.status; throw e; }
    if (raw) return res;
    return res.status === 204 ? null : res.json();
  },
  async ensureRoot() {
    const cached = LS.get('root', null);
    if (cached) { try { const f = await this.api(`files/${cached}`, { params: { fields: 'id,trashed' } }); if (!f.trashed) return (this.rootId = cached); } catch {} }
    const name = CFG.ROOT_NAME || 'Cardioteca';
    const q = `name='${name}' and mimeType='${FOLDER_MIME}' and trashed=false and 'root' in parents`;
    const r = await this.api('files', { params: { q, fields: 'files(id)', pageSize: 5 } });
    let id = r.files[0]?.id;
    if (!id) id = (await this.api('files', { method: 'POST', params: { fields: 'id' }, body: { name, mimeType: FOLDER_MIME } })).id;
    LS.set('root', id); return (this.rootId = id);
  },
  async list(folderId) {
    let out = [], pageToken;
    do {
      const r = await this.api('files', { params: {
        q: `'${folderId}' in parents and trashed=false`, orderBy: 'folder,name_natural', pageSize: 200, pageToken,
        fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink)'
      } });
      out = out.concat(r.files); pageToken = r.nextPageToken;
    } while (pageToken);
    return out.filter(f => f.name !== DATA_NAME);
  },
  async search(q) {
    const s = q.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const r = await this.api('files', { params: { q: `name contains '${s}' and trashed=false`, orderBy: 'modifiedTime desc', pageSize: 60, fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,parents)' } });
    return r.files.filter(f => f.name !== DATA_NAME);
  },
  async recent(n = 6) {
    const r = await this.api('files', { params: { q: `trashed=false and mimeType!='${FOLDER_MIME}'`, orderBy: 'modifiedTime desc', pageSize: n + 3, fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink)' } });
    return r.files.filter(f => f.name !== DATA_NAME).slice(0, n);
  },
  mkdir(name, parent) { return this.api('files', { method: 'POST', params: { fields: 'id,name,mimeType,modifiedTime' }, body: { name, mimeType: FOLDER_MIME, parents: [parent] } }); },
  rename(id, name) { return this.api(`files/${id}`, { method: 'PATCH', params: { fields: 'id,name' }, body: { name } }); },
  trash(id) { return this.api(`files/${id}`, { method: 'PATCH', params: { fields: 'id' }, body: { trashed: true } }); },
  async upload(file, parent, onProgress) {
    const t = await getToken();
    const init = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,mimeType,size,modifiedTime,webViewLink', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': mimeOf(file), 'X-Upload-Content-Length': String(file.size) },
      body: JSON.stringify({ name: file.name, parents: [parent] })
    });
    if (!init.ok) throw new Error('No se pudo iniciar la subida');
    const loc = init.headers.get('Location');
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest(); x.open('PUT', loc);
      x.setRequestHeader('Content-Type', mimeOf(file));
      x.upload.onprogress = e => e.lengthComputable && onProgress(e.loaded / e.total);
      x.onload = () => x.status < 300 ? resolve(JSON.parse(x.responseText)) : reject(new Error('Error al subir ' + file.name));
      x.onerror = () => reject(new Error('Sin conexión al subir ' + file.name));
      x.send(file);
    });
  },
  async loadData() {
    const q = `name='${DATA_NAME}' and '${this.rootId}' in parents and trashed=false`;
    const r = await this.api('files', { params: { q, fields: 'files(id)', pageSize: 1 } });
    this.dataId = r.files[0]?.id || null;
    if (!this.dataId) return null;
    const res = await this.api(`files/${this.dataId}`, { params: { alt: 'media' }, raw: true });
    return res.json();
  },
  async saveData(obj) {
    const body = JSON.stringify(obj);
    if (this.dataId) return this.api(`files/${this.dataId}`, { method: 'PATCH', upload: true, params: { uploadType: 'media' }, body: new Blob([body], { type: 'application/json' }) });
    const b = 'ct' + uid();
    const meta = JSON.stringify({ name: DATA_NAME, parents: [this.rootId], mimeType: 'application/json' });
    const multi = new Blob([`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${b}--`]);
    const f = await this.api('files', { method: 'POST', upload: true, params: { uploadType: 'multipart', fields: 'id' }, headers: { 'Content-Type': `multipart/related; boundary=${b}` }, body: multi });
    this.dataId = f.id; return f;
  },
  async about() { try { return (await this.api('about', { params: { fields: 'user(displayName,emailAddress)' } })).user; } catch { return null; } }
};

/* Biblioteca de ejemplo para ?demo (solo memoria, nada se envía a Google) */
const Demo = (() => {
  const now = Date.now(), d = n => new Date(now - n * 864e5).toISOString();
  const nodes = {
    root: { id: 'root', name: 'Cardioteca' },
    a: { id: 'a', name: 'Electrocardiografía', mimeType: FOLDER_MIME, parent: 'root', modifiedTime: d(1) },
    b: { id: 'b', name: 'Insuficiencia cardíaca', mimeType: FOLDER_MIME, parent: 'root', modifiedTime: d(3) },
    c: { id: 'c', name: 'Arritmias', mimeType: FOLDER_MIME, parent: 'root', modifiedTime: d(6) },
    d: { id: 'd', name: 'Guías clínicas', mimeType: FOLDER_MIME, parent: 'root', modifiedTime: d(9) },
    f1: { id: 'f1', name: 'Lectura sistemática del ECG.pdf', mimeType: 'application/pdf', size: 4_820_000, parent: 'a', modifiedTime: d(1) },
    f2: { id: 'f2', name: 'Bloqueos de rama y hemibloqueos.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: 12_400_000, parent: 'a', modifiedTime: d(2) },
    f3: { id: 'f3', name: 'Resumen clase fibrilación auricular.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 350_000, parent: 'c', modifiedTime: d(4) },
    f4: { id: 'f4', name: 'Tratamiento de la insuficiencia cardíaca.pdf', mimeType: 'application/pdf', size: 2_100_000, parent: 'b', modifiedTime: d(3) },
    r1: { id: 'r1', name: 'Esquema de cardiopatías congénitas.pdf', mimeType: 'application/pdf', size: 1_300_000, parent: 'root', modifiedTime: d(0.2) }
  };
  const kids = id => Object.values(nodes).filter(n => n.parent === id);
  return {
    async list(id) { await sleep(120); return kids(id).sort((x, y) => (y.mimeType === FOLDER_MIME) - (x.mimeType === FOLDER_MIME) || x.name.localeCompare(y.name, 'es')); },
    async search(q) { return Object.values(nodes).filter(n => n.parent && n.name.toLowerCase().includes(q.toLowerCase())); },
    async recent(n) { return Object.values(nodes).filter(x => x.parent && x.mimeType !== FOLDER_MIME).sort((a, b) => b.modifiedTime.localeCompare(a.modifiedTime)).slice(0, n); },
    async mkdir(name, parent) { const id = uid(); return (nodes[id] = { id, name, mimeType: FOLDER_MIME, parent, modifiedTime: new Date().toISOString() }); },
    async rename(id, name) { nodes[id].name = name; },
    async trash(id) { delete nodes[id]; },
    async upload(file, parent, onP) { for (let i = 1; i <= 5; i++) { await sleep(120); onP(i / 5); } const id = uid(); return (nodes[id] = { id, name: file.name, mimeType: mimeOf(file), size: file.size, parent, modifiedTime: new Date().toISOString() }); }
  };
})();
const Lib = DEMO ? Demo : Drive;
function mimeOf(file) {
  if (file.type) return file.type;
  const e = file.name.split('.').pop().toLowerCase();
  return { pdf: 'application/pdf', ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }[e] || 'application/octet-stream';
}
const isFolder = f => f.mimeType === FOLDER_MIME;
function kindOf(f) {
  const m = f.mimeType || '', n = (f.name || '').toLowerCase();
  if (m === 'application/pdf') return ['pdf', 'PDF'];
  if (/presentation|powerpoint/.test(m) || /\.pptx?$/.test(n)) return ['ppt', 'PPT'];
  if (/wordprocessing|msword|document/.test(m) || /\.docx?$/.test(n)) return ['doc', 'DOC'];
  if (/spreadsheet|excel/.test(m) || /\.xlsx?$/.test(n)) return ['doc', 'XLS'];
  if (m.startsWith('image/')) return ['img', 'IMG'];
  if (m.startsWith('video/')) return ['vid', 'VID'];
  return ['', (n.split('.').pop() || 'ARCH').slice(0, 4).toUpperCase()];
}

/* ═════════════ Sincronización ═════════════ */
let syncTimer;
function driveReady() { return !DEMO && ui.conn === 'on' && !!Drive.rootId; }
function setSync(s) { ui.sync = s; renderSync(); }
function scheduleSync() {
  if (!driveReady()) return;
  setSync('saving'); clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => { try { await Drive.saveData(data); setSync('saved'); } catch (e) { console.error(e); setSync('error'); } }, 1200);
}
function renderSync() {
  const box = $('#syncBox'); if (!box) return;
  const m = { local: 'Guardado solo en este navegador', saving: 'Guardando en Drive…', saved: 'Guardado en tu Drive', error: 'No se pudo guardar en Drive', demo: 'Modo demo: nada se guarda en Drive' }[ui.sync];
  box.dataset.s = ui.sync; box.innerHTML = `<span class="sync__dot"></span><span>${m}</span>`;
  const b = $('#authBtn');
  if (DEMO) { b.hidden = true; return; }
  b.hidden = false;
  b.innerHTML = ui.conn === 'on' ? `${icon('drive')}<span>Drive conectado</span>` : ui.conn === 'connecting' ? 'Conectando…' : `${icon('drive')}<span>${ui.conn === 'reconnect' ? 'Reconectar Drive' : 'Conectar Drive'}</span>`;
  b.disabled = ui.conn === 'connecting';
  b.title = ui.conn === 'on' ? (ui.user?.emailAddress || 'Conectado') : '';
}

async function connect() {
  if (!CFG.CLIENT_ID) { toast('Falta configurar el Client ID de Google en config.js', 'error'); return; }
  ui.conn = 'connecting'; renderSync();
  try {
    await getToken();
    await Drive.ensureRoot();
    ui.conn = 'on';
    const remote = await Drive.loadData();
    if (remote && (remote.updatedAt || 0) > (data.updatedAt || 0)) { data = { ...{ videos: [], todos: {} }, ...remote }; LS.set('data', data); setSync('saved'); }
    else { await Drive.saveData(data); setSync('saved'); }
    Drive.about().then(u => { ui.user = u; renderSync(); });
    ui.lib = { path: [{ id: Drive.rootId, name: 'Biblioteca' }], items: [], loading: false, q: '', results: null, error: '' };
    ui.recent = null;
    render();
    if (ui.view === 'biblioteca') openFolder(Drive.rootId, 'Biblioteca', false);
  } catch (e) {
    console.error(e);
    ui.conn = LS.get('connected', 0) ? 'reconnect' : 'off'; renderSync();
    toast(e.message === 'popup_closed' ? 'Cerraste la ventana de Google antes de terminar' : 'No se pudo conectar con Google Drive', 'error');
  }
}

/* ═════════════ Utilidades de UI ═════════════ */
function toast(msg, kind = '') {
  const t = document.createElement('div'); t.className = 'toast'; t.dataset.k = kind; t.textContent = msg;
  $('#toasts').append(t); setTimeout(() => t.remove(), 3600);
}
const dlg = $('#dlg');
function openDialog(html, cls = '') { dlg.returnValue = ''; dlg.className = 'dlg ' + cls; dlg.innerHTML = html; if (!dlg.open) dlg.showModal(); }
function closeDialog() { if (dlg.open) dlg.close(); dlg.innerHTML = ''; }
dlg.addEventListener('click', e => { if (e.target === dlg) closeDialog(); });
dlg.addEventListener('close', () => setTimeout(() => { if (!dlg.open) dlg.innerHTML = ''; }, 60));
function askText({ title, label, value = '', ok = 'Guardar', hint = '' }) {
  return new Promise(res => {
    openDialog(`<form method="dialog" class="dlg__body"><h2>${esc(title)}</h2>${hint ? `<p>${esc(hint)}</p>` : ''}
      <label class="sr" for="dlgIn">${esc(label)}</label><input id="dlgIn" class="field" value="${esc(value)}" placeholder="${esc(label)}" autocomplete="off" required maxlength="200">
      <div class="dlg__actions"><button class="btn btn--primary" value="ok">${esc(ok)}</button><button class="btn btn--ghost" value="cancel" formnovalidate>Cancelar</button></div></form>`);
    const inp = $('#dlgIn', dlg); inp.focus(); inp.select();
    dlg.onclose = () => { const v = dlg.returnValue === 'ok' ? inp.value.trim() : null; dlg.onclose = null; res(v || null); };
  });
}
function askConfirm({ title, text, ok = 'Eliminar', danger = true }) {
  return new Promise(res => {
    openDialog(`<form method="dialog" class="dlg__body"><h2>${esc(title)}</h2><p>${esc(text)}</p>
      <div class="dlg__actions"><button class="btn btn--primary" value="ok">${esc(ok)}</button><button class="btn btn--ghost" value="cancel">Cancelar</button></div></form>`);
    dlg.onclose = () => { const v = dlg.returnValue === 'ok'; dlg.onclose = null; res(v); };
  });
}

/* ═════════════ Router y vistas ═════════════ */
const VIEWS = [
  { id: 'inicio', label: 'Inicio', icon: 'home' },
  { id: 'biblioteca', label: 'Biblioteca', icon: 'library' },
  { id: 'videos', label: 'Videos', icon: 'play' },
  { id: 'pendientes', label: 'Pendientes', icon: 'tasks' }
];
function pendingToday() { return (data.todos[ui.today] || []).filter(t => !t.done).length; }
function renderNav() {
  const n = pendingToday();
  $('#nav').innerHTML = VIEWS.map(v => `<a class="nav__link" href="#/${v.id}" ${v.id === ui.view ? 'aria-current="page"' : ''}>${icon(v.icon)}<span>${v.label}</span>${v.id === 'pendientes' && n ? `<span class="nav__badge" aria-label="${n} pendientes">${n}</span>` : ''}</a>`).join('');
}
function route() {
  const id = (location.hash.match(/^#\/(\w+)/) || [])[1];
  ui.view = VIEWS.some(v => v.id === id) ? id : 'inicio';
  ui.today = dkey();
  if (ui.view === 'pendientes' && !ui.dayTouched) ui.day = ui.today;
  render(); window.scrollTo(0, 0);
  if (ui.view === 'biblioteca' && canLib() && !ui.lib.path.length) openFolder(rootId(), 'Biblioteca', false);
}
const rootId = () => DEMO ? 'root' : Drive.rootId;
const canLib = () => DEMO || (ui.conn === 'on' && !!Drive.rootId);

function render() {
  renderNav(); renderSync(); updateBpm();
  const v = $('#view');
  const fn = { inicio: vInicio, biblioteca: vBiblioteca, videos: vVideos, pendientes: vPendientes }[ui.view];
  v.innerHTML = fn();
  if (ui.view === 'inicio') { mountHero(); loadRecent(); }
  if (ui.view === 'videos') { bindVideoAutoplayReset(); loadTopFolders(); }
  if (ui.view === 'biblioteca') ui.autoplay = false;
  bindPlayers();
}

/* — Inicio — */
let heroMon = null, heroCanvas = null;
function mountHero() {
  const slot = $('#heroSlot'); if (!slot) return;
  if (!heroCanvas) { heroCanvas = document.createElement('canvas'); heroCanvas.setAttribute('aria-hidden', 'true'); }
  slot.append(heroCanvas);
  if (!heroMon) { heroMon = new Monitor(heroCanvas); monitors.push(heroMon); updateBpm(); } else if (Math.abs(heroCanvas.getBoundingClientRect().width - heroMon.w) > 1) { heroMon.resize(); }
}
const connectCard = (title, text) => `<div class="cta-card"><div><h2>${title}</h2><p>${text}</p></div>
  <button class="btn" data-act="connect" type="button">${icon('drive')}<span>Conectar Google Drive</span></button></div>`;

function vInicio() {
  const list = data.todos[ui.today] || [];
  const left = list.filter(t => !t.done).length;
  const sub = !list.length ? 'Todavía no escribiste pendientes para hoy.' : left ? `Te quedan <b>${left}</b> de ${list.length} pendientes de hoy.` : `Completaste los <b>${list.length}</b> pendientes de hoy.`;
  const unseen = data.videos.filter(v => !v.watched).slice(0, 3);
  return `
  <section class="hero">
    <div class="hero__trace" id="heroSlot"></div>
    <h1>${greeting()}.</h1>
    <p>${esc(fmtLong(ui.today).replace(/^./, c => c.toUpperCase()))}. ${sub}</p>
  </section>
  ${!DEMO && ui.conn !== 'on' ? connectCard(ui.conn === 'reconnect' ? 'Vuelve a conectar tu Drive' : 'Conecta tu Google Drive', 'Tus carpetas, PDFs y presentaciones viven en tu propio Drive. Cardioteca solo ve lo que ella misma crea o sube.') : ''}
  <div class="home-grid">
    <section class="panel">
      <div class="panel__head"><h2>Pendientes de hoy</h2><a class="link" href="#/pendientes">Abrir lista</a></div>
      ${list.length ? `<ul class="tlist">${list.slice(0, 6).map(t => todoItem(t, true)).join('')}</ul>${list.length > 6 ? `<p class="empty">y ${list.length - 6} más…</p>` : ''}`
        : `<div class="empty"><strong>Día en blanco</strong>Escribe lo que necesitas hacer y márcalo al terminar.</div><a class="btn" href="#/pendientes">${icon('plus')}<span>Agregar pendientes</span></a>`}
    </section>
    <div class="home-col">
      <section class="panel">
        <div class="panel__head"><h2>Videos para retomar</h2><a class="link" href="#/videos">Ver todos</a></div>
        ${unseen.length ? `<div class="vmini">${unseen.map(v => `<button class="vmini__item" type="button" data-act="play-video" data-id="${v.id}"><img src="https://i.ytimg.com/vi/${esc(v.vid)}/mqdefault.jpg" alt="" loading="lazy"><span><b>${esc(v.title)}</b><small>${esc(v.tag || 'Sin tema')}</small></span></button>`).join('')}</div>`
          : `<div class="empty"><strong>Sin videos pendientes</strong>Guarda links de YouTube y se reproducen aquí mismo.</div>`}
      </section>
      <section class="panel">
        <div class="panel__head"><h2>Archivos recientes</h2><a class="link" href="#/biblioteca">Biblioteca</a></div>
        <div id="recentBox">${canLib() ? '<div class="skeleton"></div>' : '<div class="empty">Conecta tu Drive para ver aquí lo último que subas.</div>'}</div>
      </section>
    </div>
  </div>`;
}
async function loadRecent() {
  if (!canLib()) return;
  try {
    if (!ui.recent) ui.recent = await Lib.recent(5);
    const box = $('#recentBox'); if (!box) return;
    box.innerHTML = ui.recent.length ? `<div class="files">${ui.recent.map(f => fileRow(f, true)).join('')}</div>` : `<div class="empty"><strong>Aún no hay archivos</strong>Sube tu primer PDF o presentación desde la Biblioteca.</div>`;
  } catch (e) { const box = $('#recentBox'); if (box) box.innerHTML = `<div class="empty">No se pudieron cargar los archivos.</div>`; }
}

/* — Biblioteca — */
const SUGGESTED = ['Electrocardiografía', 'Cardiopatía isquémica', 'Insuficiencia cardíaca', 'Arritmias', 'Valvulopatías', 'Hipertensión y riesgo cardiovascular', 'Farmacología cardiovascular', 'Cardiopatías congénitas', 'Imagen cardiovascular', 'Guías clínicas', 'Casos clínicos'];

function fileRow(f, compact = false) {
  const [k, label] = kindOf(f);
  return `<div class="frow" data-id="${f.id}">
    <div class="ftype" data-k="${k}">${label}</div>
    <div style="min-width:0"><button class="frow__open" type="button" data-act="open-file" data-id="${f.id}" title="${esc(f.name)}"><span class="frow__name">${esc(f.name)}</span></button>${compact ? `<div class="frow__sub">${esc(fmtShort(f.modifiedTime))}</div>` : ''}</div>
    ${compact ? '<span></span><span></span>' : `<span class="frow__size">${fmtSize(f.size)}</span><span class="frow__date">${esc(fmtShort(f.modifiedTime))}</span>`}
    <div class="frow__actions">${compact ? '' : `<button class="icon-btn" type="button" data-act="rename" data-id="${f.id}" aria-label="Renombrar">${icon('edit')}</button><button class="icon-btn icon-btn--danger" type="button" data-act="trash" data-id="${f.id}" aria-label="Enviar a la papelera">${icon('trash')}</button>`}</div>
  </div>`;
}
function vBiblioteca() {
  if (!canLib()) {
    return `<header class="ph"><div><h1>Biblioteca</h1><p>Carpetas por tema, con tus PDFs y presentaciones a un clic.</p></div></header>
    ${connectCard('Tu biblioteca vive en Google Drive', 'Conéctalo una vez y Cardioteca crea su carpeta raíz. Nada se sube hasta que tú lo decidas.')}`;
  }
  const L = ui.lib, cur = L.path[L.path.length - 1] || { id: rootId(), name: 'Biblioteca' };
  const crumbs = L.path.map((p, i) => `<button type="button" data-act="crumb" data-i="${i}" ${i === L.path.length - 1 && !L.results ? 'aria-current="page"' : ''}>${esc(p.name)}</button>`).join('<span aria-hidden="true">/</span>');
  const items = L.results ?? L.items;
  if (!L.path.length) L.loading = true;
  const folders = items.filter(isFolder), files = items.filter(f => !isFolder(f));
  let body;
  if (L.loading) body = '<div class="files"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>';
  else if (L.error) body = `<div class="empty"><strong>No se pudo cargar</strong>${esc(L.error)}</div>`;
  else if (!items.length) body = L.results ? `<div class="empty"><strong>Sin resultados</strong>Prueba con otra palabra.</div>` :
    `<div class="empty"><strong>${L.path.length > 1 ? 'Esta carpeta está vacía' : 'Tu biblioteca está vacía'}</strong>Arrastra PDFs o presentaciones aquí, o usa el botón Subir.</div>
     ${L.path.length <= 1 ? `<button class="btn" type="button" data-act="suggest">${icon('folderPlus')}<span>Crear carpetas de cardiología</span></button>` : ''}`;
  else body = `${folders.length ? `<h2 class="sec-title">Carpetas</h2><div class="folders">${folders.map(f => `<div class="folder"><button class="folder__open" type="button" data-act="open-folder" data-id="${f.id}" aria-label="Abrir ${esc(f.name)}"></button><span class="folder__name">${esc(f.name)}</span><span class="folder__meta">${(n => n ? `<b class="folder__vids">${icon('playFill')}${n} ${n === 1 ? 'video' : 'videos'}</b>` : '')(data.videos.filter(v => v.folderId === f.id).length)}${esc(fmtShort(f.modifiedTime))}</span><span class="folder__tools"><button class="icon-btn" type="button" data-act="rename" data-id="${f.id}" aria-label="Renombrar">${icon('edit')}</button><button class="icon-btn icon-btn--danger" type="button" data-act="trash" data-id="${f.id}" aria-label="Enviar a la papelera">${icon('trash')}</button></span></div>`).join('')}</div>` : ''}
    ${files.length ? `<h2 class="sec-title">Archivos</h2><div class="files">${files.map(f => fileRow(f)).join('')}</div>` : ''}`;
  return `<header class="ph"><div><div class="crumbs">${crumbs}${L.results ? '<span aria-hidden="true">/</span><button type="button" aria-current="page">Búsqueda</button>' : ''}</div><h1>${esc(L.results ? 'Resultados' : cur.name)}</h1></div>
    <div class="ph__actions"><button class="btn" type="button" data-act="new-folder">${icon('folderPlus')}<span>Nueva carpeta</span></button><button class="btn btn--primary" type="button" data-act="pick-files">${icon('upload')}<span>Subir archivos</span></button></div></header>
    <form class="lib-tools" data-form="search" role="search"><label class="sr" for="q">Buscar en la biblioteca</label><input id="q" class="field" type="search" placeholder="Buscar por nombre en toda la biblioteca" value="${esc(L.q)}"><button class="btn" type="submit">${icon('search')}<span>Buscar</span></button></form>
    ${body}
    ${L.results || L.loading || L.error ? '' : folderVideos(cur)}`;
}
function folderVideos(cur) {
  const list = data.videos.filter(v => v.folderId === cur.id), pl = list.find(v => v.id === ui.videoId);
  return `<section class="fvid" aria-labelledby="fvidT">
    <div class="fvid__head"><h2 class="sec-title" id="fvidT">Videos de ${esc(cur.name)}</h2><span class="fvid__count">${list.length} ${list.length === 1 ? 'video' : 'videos'}</span></div>
    <form class="vadd vadd--folder" data-form="add-video"><input type="hidden" name="folderId" value="${esc(cur.id)}"><input type="hidden" name="folderName" value="${esc(cur.name)}"><label class="sr" for="fvUrl">Link de YouTube</label><input id="fvUrl" class="field" name="url" placeholder="Pega un link de YouTube para guardarlo en esta carpeta" required autocomplete="off"><button class="btn btn--primary" type="submit">${icon('plus')}<span>Guardar video aquí</span></button></form>
    ${pl ? stageHTML(pl) : ''}
    ${list.length ? `<div class="vgrid">${list.map(vCard).join('')}</div>` : `<div class="empty"><strong>Sin videos en esta carpeta</strong>Pega un link de YouTube arriba y quedará junto a tus PDFs y presentaciones de este tema.</div>`}
  </section>`;
}
async function openFolder(id, name, push = true) {
  const L = ui.lib;
  if (push) { const i = L.path.findIndex(p => p.id === id); if (i >= 0) L.path = L.path.slice(0, i + 1); else L.path.push({ id, name }); }
  else if (!L.path.length) L.path = [{ id, name }];
  L.loading = true; L.results = null; L.q = ''; L.error = ''; if (ui.view === 'biblioteca') render();
  try { L.items = await Lib.list(id); } catch (e) { L.error = e.message; L.items = []; }
  L.loading = false; if (ui.view === 'biblioteca') render();
}
const curFolder = () => (ui.lib.path[ui.lib.path.length - 1] || { id: rootId() }).id;
const findItem = id => [...ui.lib.items, ...(ui.lib.results || []), ...(ui.recent || [])].find(f => f.id === id);

async function doUpload(files) {
  files = [...files]; if (!files.length) return;
  if (!canLib()) { toast('Conecta tu Drive para subir archivos', 'error'); return; }
  const parent = curFolder(), panel = $('#uploadPanel');
  panel.hidden = false;
  panel.innerHTML = `<h3>Subiendo ${files.length} ${files.length === 1 ? 'archivo' : 'archivos'}</h3>${files.map((f, i) => `<div class="up"><span>${esc(f.name)}</span><div class="bar"><i id="up${i}" style="width:0"></i></div></div>`).join('')}`;
  let ok = 0;
  for (let i = 0; i < files.length; i++) {
    try { await Lib.upload(files[i], parent, p => { const b = $('#up' + i); if (b) b.style.width = Math.round(p * 100) + '%'; }); ok++; const b = $('#up' + i); if (b) { b.style.width = '100%'; b.parentElement.dataset.full = 1; } }
    catch (e) { toast(e.message, 'error'); }
  }
  setTimeout(() => { panel.hidden = true; }, 1200);
  ui.recent = null;
  if (ok) { toast(ok === 1 ? 'Archivo subido' : `${ok} archivos subidos`); await openFolder(parent, '', false); }
}
function openPreview(f) {
  const [, label] = kindOf(f), isG = DEMO;
  openDialog(`<div class="dlg__bar"><h2>${esc(f.name)}</h2>
    ${f.webViewLink ? `<a class="btn btn--sm" href="${esc(f.webViewLink)}" target="_blank" rel="noopener">${icon('external')}<span>Abrir en Drive</span></a>` : ''}
    ${!isG ? `<a class="btn btn--sm" href="https://drive.google.com/uc?export=download&id=${esc(f.id)}" target="_blank" rel="noopener">${icon('download')}<span>Descargar</span></a>` : ''}
    <button class="icon-btn" type="button" data-act="close-dlg" aria-label="Cerrar">${icon('x')}</button></div>
    ${isG ? `<div class="dlg__note">Aquí se mostraría la vista previa de ${esc(label)} desde tu Drive.<br>En el modo demo no hay archivos reales.</div>`
      : `<iframe class="dlg__frame" src="https://drive.google.com/file/d/${esc(f.id)}/preview" title="Vista previa de ${esc(f.name)}" allow="autoplay"></iframe>`}`, 'dlg--wide');
}
async function suggestFolders() {
  openDialog(`<form method="dialog" class="dlg__body"><h2>Carpetas de cardiología</h2><p>Elige las que quieras crear dentro de esta carpeta. Puedes cambiarlas o borrarlas después.</p>
    <div class="picklist">${SUGGESTED.map((n, i) => `<label class="pick"><input type="checkbox" name="f" value="${esc(n)}" ${i < 10 ? 'checked' : ''}><span>${esc(n)}</span></label>`).join('')}</div>
    <div class="dlg__actions"><button class="btn btn--primary" value="ok">Crear carpetas</button><button class="btn btn--ghost" value="cancel" formnovalidate>Cancelar</button></div></form>`);
  let picked = []; $('form', dlg).addEventListener('submit', () => { picked = $$('input[name=f]:checked', dlg).map(i => i.value); });
  const names = await new Promise(res => { dlg.onclose = () => { const v = dlg.returnValue === 'ok' ? picked : []; dlg.onclose = null; res(v); }; });
  if (!names.length) return;
  const parent = curFolder(); toast('Creando carpetas…');
  for (const n of names) { try { await Lib.mkdir(n, parent); } catch (e) { toast(e.message, 'error'); break; } }
  await openFolder(parent, '', false); toast('Carpetas creadas');
}

/* — Videos — */
function ytId(input) {
  const s = (input || '').trim(); if (/^[\w-]{11}$/.test(s)) return { id: s, start: 0 };
  try {
    const u = new URL(/^https?:/i.test(s) ? s : 'https://' + s); let id = null;
    if (/youtu\.be$/.test(u.hostname)) id = u.pathname.slice(1, 12);
    else if (/youtube(-nocookie)?\.com$/.test(u.hostname)) id = u.searchParams.get('v') || (u.pathname.match(/\/(?:embed|shorts|live|v)\/([\w-]{11})/) || [])[1];
    if (!id || !/^[\w-]{11}$/.test(id)) return null;
    const t = u.searchParams.get('t') || u.searchParams.get('start') || '0';
    const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
    const start = m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0;
    return { id, start };
  } catch { return null; }
}
async function ytTitle(id) {
  const url = `https://www.youtube.com/watch?v=${id}`;
  for (const ep of [`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`, `https://noembed.com/embed?url=${encodeURIComponent(url)}`]) {
    try { const r = await fetch(ep); if (r.ok) { const j = await r.json(); if (j.title) return { title: j.title, author: j.author_name || '' }; } } catch {}
  }
  return { title: 'Video de YouTube', author: '' };
}
const topFolders = () => ui.topFolders || [];
function knownFolders() {
  const m = new Map();
  topFolders().forEach(f => m.set(f.id, f.name));
  ui.lib.path.forEach(p => p.id && p.name && m.set(p.id, p.name));
  data.videos.forEach(v => v.folderId && v.folderName && m.set(v.folderId, v.folderName));
  return [...m].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
async function loadTopFolders() {
  if (!canLib() || ui.topFolders) return;
  try { ui.topFolders = (await Lib.list(rootId())).filter(isFolder).map(f => ({ id: f.id, name: f.name })); } catch { ui.topFolders = []; }
  if (ui.view === 'videos' && !document.activeElement?.matches('input,textarea,select')) render();
}
const allTags = () => [...new Set(data.videos.map(v => v.tag).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
const foldersOpts = (sel) => knownFolders().map(f => `<option value="${esc(f.id)}" ${f.id === sel ? 'selected' : ''}>${esc(f.name)}</option>`).join('');
function stageHTML(cur) {
  if (!cur) return '';
  return `<section class="stage"><div class="player"><iframe data-vid="${esc(cur.vid)}" src="https://www.youtube-nocookie.com/embed/${esc(cur.vid)}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}${cur.start ? `&start=${cur.start}` : ''}${ui.autoplay ? '&autoplay=1' : ''}" title="${esc(cur.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
    <div class="stage__info"><h2>${esc(cur.title)}</h2>
      <div class="stage__folder"><label for="vFolder">Carpeta</label><select id="vFolder" class="field" data-field="folder" data-id="${cur.id}"><option value="">Sin carpeta</option>${foldersOpts(cur.folderId)}</select></div>
      <div class="stage__folder"><label for="vTag">Tema</label><input id="vTag" class="field" list="tagList" value="${esc(cur.tag || '')}" placeholder="Tema (ej. Arritmias)" data-field="tag" data-id="${cur.id}"></div>
      <div><label class="sr" for="vNote">Notas</label><textarea id="vNote" class="field" placeholder="Notas del video: minutos clave, ideas, dudas…" data-field="note" data-id="${cur.id}">${esc(cur.note || '')}</textarea></div>
      <div class="stage__row"><button class="btn" type="button" data-act="watched" data-id="${cur.id}" aria-pressed="${!!cur.watched}">${icon('check')}<span>${cur.watched ? 'Visto' : 'Marcar como visto'}</span></button>
      <button class="btn" type="button" data-act="rename-video" data-id="${cur.id}">${icon('edit')}<span>Cambiar título</span></button>
      <a class="btn" href="https://www.youtube.com/watch?v=${esc(cur.vid)}" target="_blank" rel="noopener">${icon('external')}<span>YouTube</span></a></div></div></section>`;
}
function vVideos() {
  const tags = allTags();
  const cur = data.videos.find(v => v.id === ui.videoId);
  const stage = stageHTML(cur);
  return `<header class="ph"><div><h1>Videos</h1><p>Guarda el link de un video de YouTube y míralo aquí mismo, junto a tus notas.</p></div></header>
  <form class="vadd vadd--3" data-form="add-video"><label class="sr" for="vUrl">Link de YouTube</label><input id="vUrl" class="field" name="url" placeholder="Pega un link de YouTube" required autocomplete="off">
    <label class="sr" for="vNewFolder">Carpeta</label><select id="vNewFolder" class="field" name="folderId"><option value="">Sin carpeta</option>${foldersOpts('')}</select><label class="sr" for="vNewTag">Tema</label><input id="vNewTag" class="field" name="tag" list="tagList" placeholder="Tema" autocomplete="off" value="${esc(ui.tag)}"><button class="btn btn--primary" type="submit">${icon('plus')}<span>Guardar video</span></button></form>
  <datalist id="tagList">${[...new Set([...tags, 'Electrocardiografía', 'Arritmias', 'Insuficiencia cardíaca', 'Cardiopatía isquémica', 'Valvulopatías', 'Farmacología', 'Casos clínicos'])].map(t => `<option value="${esc(t)}">`).join('')}</datalist>
  ${stage}
  <div id="vlist">${vList()}</div>`;
}
const vCard = v => `<div class="vwrap"><button class="vcard" type="button" data-act="play-video" data-id="${v.id}" aria-current="${v.id === ui.videoId}"><span class="vcard__thumb"><img src="https://i.ytimg.com/vi/${esc(v.vid)}/mqdefault.jpg" alt="" loading="lazy"><span class="vcard__play">${icon('playFill')}</span>${v.watched ? '<span class="vcard__seen">Visto</span>' : ''}</span><span class="vcard__title">${esc(v.title)}</span><span class="vcard__tag">${esc(v.tag || 'Sin tema')}</span>${folderBadge(v)}</button><button class="icon-btn icon-btn--danger vcard__x" type="button" data-act="del-video" data-id="${v.id}" aria-label="Quitar ${esc(v.title)}">${icon('x')}</button></div>`;
const folderBadge = v => v.folderName && v.folderName !== v.tag ? `<span class="vcard__folder">${icon('folder')}${esc(v.folderName)}</span>` : '';
function vList() {
  const tags = allTags(), list = data.videos.filter(v => !ui.tag || v.tag === ui.tag);
  return `${data.videos.length ? `<div class="vfilters" role="group" aria-label="Filtrar por tema"><button class="chip" type="button" data-act="tag" data-tag="" aria-pressed="${!ui.tag}">Todos (${data.videos.length})</button>${tags.map(t => `<button class="chip" type="button" data-act="tag" data-tag="${esc(t)}" aria-pressed="${ui.tag === t}">${esc(t)}</button>`).join('')}</div>
  <div class="vgrid">${list.map(vCard).join('')}</div>`
  : `<div class="empty"><strong>Aún no guardaste videos</strong>Pega un link de YouTube arriba. Se queda guardado y se reproduce sin salir de Cardioteca.</div>`}`;
}
/* avisa cuando el dueño del video bloquea la reproducción fuera de YouTube */
function bindPlayers() {
  $$('.player iframe[data-vid]').forEach(f => f.addEventListener('load', () => { try { f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*'); } catch {} }, { once: true }));
}
addEventListener('message', e => {
  if (!/(^|\.)youtube(-nocookie)?\.com$/.test((() => { try { return new URL(e.origin).hostname; } catch { return ''; } })())) return;
  let d; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch { return; }
  if (!d || d.event !== 'onError' || ![100, 101, 150].includes(d.info)) return;
  const f = $$('.player iframe[data-vid]').find(x => x.contentWindow === e.source); if (!f) return;
  const box = f.parentElement, id = f.dataset.vid;
  box.classList.add('player--blocked');
  box.innerHTML = d.info === 100
    ? `<div class="blocked"><strong>Este video ya no está disponible</strong><p>Pudo haber sido eliminado o puesto en privado por su autor.</p><a class="btn btn--primary" href="https://www.youtube.com/watch?v=${esc(id)}" target="_blank" rel="noopener">${icon('external')}<span>Intentar en YouTube</span></a></div>`
    : `<div class="blocked"><strong>El autor no permite verlo aquí</strong><p>Algunos videos, sobre todo de música y televisión, solo se reproducen en YouTube. Tu link sigue guardado.</p><a class="btn btn--primary" href="https://www.youtube.com/watch?v=${esc(id)}" target="_blank" rel="noopener">${icon('external')}<span>Mirar en YouTube</span></a></div>`;
});
function refreshVideos() { const l = $('#vlist'); if (l) l.innerHTML = vList(); else if (ui.view === 'biblioteca') render(); }
function bindVideoAutoplayReset() { ui.autoplay = false; }
async function addVideo(url, tag, folder) {
  const p = ytId(url); if (!p) { toast('Ese link no parece de YouTube', 'error'); return; }
  if (data.videos.some(v => v.vid === p.id)) { const ex = data.videos.find(v => v.vid === p.id); ui.videoId = ex.id; ui.autoplay = false;
    if (folder && ex.folderId !== folder.id) { ex.folderId = folder.id; ex.folderName = folder.name; if (!ex.tag) ex.tag = folder.name; touch(); toast('Video movido a ' + folder.name); } else toast('Ese video ya está guardado'); render(); return; }
  toast('Guardando video…');
  const meta = await ytTitle(p.id);
  const v = { id: uid(), vid: p.id, start: p.start, title: meta.title, tag: (tag || '').trim() || (folder ? folder.name : ''), folderId: folder ? folder.id : '', folderName: folder ? folder.name : '', note: '', watched: false, addedAt: Date.now() };
  data.videos.unshift(v); touch(); ui.videoId = v.id; ui.autoplay = false; render(); toast('Video guardado');
}

/* — Pendientes — */
function todoItem(t, mini = false) {
  return `<li class="titem" data-done="${t.done ? 1 : 0}" data-id="${t.id}"><button class="check" type="button" role="checkbox" aria-checked="${!!t.done}" aria-label="${esc(t.text)}" data-act="toggle" data-id="${t.id}">${icon('check')}</button>
  <span class="titem__text" ${mini ? '' : `data-act="edit-todo" data-id="${t.id}"`}>${esc(t.text)}</span>
  ${mini ? '' : `<span class="titem__actions"><button class="icon-btn" type="button" data-act="edit-todo" data-id="${t.id}" aria-label="Editar">${icon('edit')}</button><button class="icon-btn icon-btn--danger" type="button" data-act="del-todo" data-id="${t.id}" aria-label="Eliminar">${icon('trash')}</button></span>`}</li>`;
}
function dayStats(k) { const l = data.todos[k] || []; return { n: l.length, d: l.filter(t => t.done).length }; }
function vPendientes() {
  const k = ui.day, list = data.todos[k] || [], { n, d } = dayStats(k), isToday = k === ui.today;
  const label = isToday ? 'Hoy' : k === addDays(ui.today, -1) ? 'Ayer' : k === addDays(ui.today, 1) ? 'Mañana' : fmtLong(k);
  const prev = data.todos[addDays(k, -1)] || [], carry = prev.filter(t => !t.done && !list.some(x => x.text === t.text));
  const hist = Array.from({ length: 14 }, (_, i) => addDays(ui.today, i - 13));
  return `<header class="ph"><div><h1>Pendientes</h1><div class="datenav"><button class="icon-btn" type="button" data-act="day" data-n="-1" aria-label="Día anterior">${icon('chevL')}</button><span class="datenav__label">${esc(label)}</span><button class="icon-btn" type="button" data-act="day" data-n="1" aria-label="Día siguiente">${icon('chevR')}</button>${isToday ? '' : '<button class="btn btn--sm" type="button" data-act="day-today">Ir a hoy</button>'}</div>
    <p style="margin-top:6px">${esc(fmtLong(k).replace(/^./, c => c.toUpperCase()))}</p></div>
    <div class="score" aria-label="${d} de ${n} completados">${d}<small>/${n}</small></div></header>
  <div class="bar" data-full="${n && d === n ? 1 : 0}" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${d}"><i style="width:${n ? Math.round(d / n * 100) : 0}%"></i></div>
  <form class="tadd" data-form="add-todo"><label class="sr" for="tNew">Nuevo pendiente</label><input id="tNew" class="field" name="text" placeholder="¿Qué necesitas hacer ${isToday ? 'hoy' : 'ese día'}?" autocomplete="off" maxlength="200" required><button class="btn btn--primary" type="submit">${icon('plus')}<span>Añadir</span></button></form>
  ${list.length ? `<ul class="tlist">${list.map(t => todoItem(t)).join('')}</ul>` : `<div class="empty"><strong>Nada por aquí</strong>Escribe tu primer pendiente arriba y presiona Enter.</div>`}
  <div class="tfoot">${carry.length ? `<button class="btn" type="button" data-act="carry">${icon('plus')}<span>Traer ${carry.length} sin terminar del día anterior</span></button>` : ''}${d ? `<button class="btn btn--ghost" type="button" data-act="clear-done">Quitar completados</button>` : ''}</div>
  <section class="hist"><h2>Últimos 14 días</h2><div class="hist__row">${hist.map(h => { const s = dayStats(h), pct = s.n ? Math.max(8, Math.round(s.d / s.n * 100)) : 0; return `<button class="hist__col" type="button" data-act="goto" data-day="${h}" data-has="${s.n ? 1 : 0}" data-full="${s.n && s.d === s.n ? 1 : 0}" ${h === k ? 'aria-current="date"' : ''} title="${esc(fmtLong(h))}: ${s.d} de ${s.n}"><i style="height:${s.n ? pct : 4}%"></i><span>${fromKey(h).toLocaleDateString('es', { weekday: 'narrow' })}</span></button>`; }).join('')}</div></section>`;
}

/* ═════════════ Eventos ═════════════ */
const view = $('#view');
const actions = {
  connect: () => connect(),
  'close-dlg': () => closeDialog(),
  'open-folder': async el => { const f = findItem(el.dataset.id); if (f) { ui.lib.results = null; await openFolder(f.id, f.name); } },
  crumb: el => { const i = +el.dataset.i, p = ui.lib.path[i]; ui.lib.path = ui.lib.path.slice(0, i + 1); openFolder(p.id, p.name, false); },
  'open-file': el => { const f = findItem(el.dataset.id); if (f) openPreview(f); },
  'new-folder': async () => { const n = await askText({ title: 'Nueva carpeta', label: 'Nombre de la carpeta', ok: 'Crear' }); if (!n) return; try { await Lib.mkdir(n, curFolder()); toast('Carpeta creada'); await openFolder(curFolder(), '', false); } catch (e) { toast(e.message, 'error'); } },
  suggest: () => suggestFolders(),
  'pick-files': () => $('#filePick').click(),
  rename: async el => { const f = findItem(el.dataset.id); if (!f) return; const n = await askText({ title: 'Renombrar', label: 'Nuevo nombre', value: f.name }); if (!n || n === f.name) return; try { await Lib.rename(f.id, n); ui.recent = null; await openFolder(curFolder(), '', false); toast('Nombre actualizado'); } catch (e) { toast(e.message, 'error'); } },
  trash: async el => { const f = findItem(el.dataset.id); if (!f) return; if (!await askConfirm({ title: `¿Eliminar “${f.name}”?`, text: isFolder(f) ? 'La carpeta y todo lo que contiene irá a la papelera de Google Drive. Puedes recuperarla desde allí.' : 'Irá a la papelera de Google Drive. Puedes recuperarlo desde allí.', ok: 'Enviar a la papelera' })) return; try { await Lib.trash(f.id); ui.recent = null; await openFolder(curFolder(), '', false); toast('Enviado a la papelera'); } catch (e) { toast(e.message, 'error'); } },
  /* videos */
  'play-video': el => { ui.videoId = el.dataset.id; ui.autoplay = true; if (ui.view !== 'videos' && ui.view !== 'biblioteca') { location.hash = '#/videos'; } else { render(); $('.player')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } },
  tag: el => { ui.tag = el.dataset.tag; $('#vlist').innerHTML = vList(); },
  watched: el => { const v = data.videos.find(x => x.id === el.dataset.id); v.watched = !v.watched; touch(); el.setAttribute('aria-pressed', v.watched); $('span', el).textContent = v.watched ? 'Visto' : 'Marcar como visto'; refreshVideos(); },
  'rename-video': async el => { const v = data.videos.find(x => x.id === el.dataset.id); const n = await askText({ title: 'Cambiar título', label: 'Título', value: v.title }); if (n) { v.title = n; touch(); ui.autoplay = false; render(); } },
  'del-video': async el => { const v = data.videos.find(x => x.id === el.dataset.id); if (!await askConfirm({ title: '¿Quitar este video?', text: `“${v.title}” dejará de estar en tu lista. El video en YouTube no se borra.`, ok: 'Quitar' })) return; data.videos = data.videos.filter(x => x !== v); if (ui.videoId === v.id) ui.videoId = null; touch(); render(); },
  /* pendientes */
  toggle: el => { const l = data.todos[ui.view === 'inicio' ? ui.today : ui.day]; const t = l.find(x => x.id === el.dataset.id); t.done = !t.done; touch(); if (t.done) beatAll(); render(); },
  'del-todo': el => { const k = ui.day; data.todos[k] = data.todos[k].filter(x => x.id !== el.dataset.id); touch(); render(); },
  'edit-todo': el => {
    if (ui.view === 'inicio') return;
    const li = el.closest('.titem'), t = data.todos[ui.day].find(x => x.id === el.dataset.id), span = $('.titem__text', li);
    const inp = document.createElement('input'); inp.className = 'field titem__edit'; inp.value = t.text; inp.maxLength = 200; inp.setAttribute('aria-label', 'Editar pendiente');
    span.replaceWith(inp); inp.focus(); inp.select();
    let done = false; const end = save => { if (done) return; done = true; const v = inp.value.trim(); if (save && v) { t.text = v; touch(); } render(); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') end(true); if (e.key === 'Escape') end(false); }); inp.addEventListener('blur', () => end(true));
  },
  day: el => { ui.day = addDays(ui.day, +el.dataset.n); ui.dayTouched = true; render(); },
  'day-today': () => { ui.day = ui.today; ui.dayTouched = false; render(); },
  goto: el => { ui.day = el.dataset.day; ui.dayTouched = true; render(); },
  carry: () => { const prev = data.todos[addDays(ui.day, -1)] || []; const l = data.todos[ui.day] ||= []; prev.filter(t => !t.done && !l.some(x => x.text === t.text)).forEach(t => l.push({ id: uid(), text: t.text, done: false })); touch(); render(); },
  'clear-done': () => { data.todos[ui.day] = (data.todos[ui.day] || []).filter(t => !t.done); touch(); render(); }
};
view.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || !view.contains(el)) return;
  actions[el.dataset.act]?.(el);
});
dlg.addEventListener('click', e => { const el = e.target.closest('[data-act="close-dlg"]'); if (el) closeDialog(); });
view.addEventListener('submit', async e => {
  const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault();
  const kind = f.dataset.form, fd = new FormData(f);
  if (kind === 'add-todo') { const text = String(fd.get('text')).trim(); if (!text) return; (data.todos[ui.day] ||= []).push({ id: uid(), text, done: false }); touch(); render(); $('#tNew')?.focus(); }
  if (kind === 'add-video') { const btn = $('button[type=submit]', f); btn.disabled = true; const fid = String(fd.get('folderId') || ''), fname = String(fd.get('folderName') || '') || knownFolders().find(x => x.id === fid)?.name || '';
    await addVideo(String(fd.get('url')), String(fd.get('tag') || ''), fid ? { id: fid, name: fname } : null); }
  if (kind === 'search') {
    const q = String(fd.get('q') || $('#q').value).trim(), L = ui.lib; L.q = q;
    if (!q) { L.results = null; render(); return; }
    L.loading = true; render();
    try { L.results = await Lib.search(q); L.error = ''; } catch (err) { L.error = err.message; L.results = []; }
    L.loading = false; render(); $('#q')?.focus();
  }
});
view.addEventListener('change', e => {
  const t = e.target; if (!t.dataset.field) return;
  const v = data.videos.find(x => x.id === t.dataset.id); if (!v) return;
  if (t.dataset.field === 'folder') { const o = t.selectedOptions[0]; v.folderId = t.value; v.folderName = t.value ? o.textContent : ''; if (t.value && !v.tag) v.tag = v.folderName; touch(); render(); return; }
  v[t.dataset.field] = t.value.trim(); touch();
  if (t.dataset.field === 'tag') $('#vlist').innerHTML = vList();
});
/* subir archivos: input oculto + arrastrar y soltar */
const filePick = Object.assign(document.createElement('input'), { type: 'file', multiple: true, id: 'filePick', hidden: true });
document.body.append(filePick);
filePick.addEventListener('change', () => { doUpload(filePick.files); filePick.value = ''; });
const dz = document.createElement('div'); dz.className = 'dropzone-hint'; dz.innerHTML = '<div>Suelta para subir<small>Se guardarán en la carpeta que tienes abierta</small></div>'; document.body.append(dz);
let dragN = 0;
const hasFiles = e => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
addEventListener('dragenter', e => { if (ui.view !== 'biblioteca' || !canLib() || !hasFiles(e)) return; dragN++; dz.classList.add('is-on'); });
addEventListener('dragleave', () => { dragN = Math.max(0, dragN - 1); if (!dragN) dz.classList.remove('is-on'); });
addEventListener('dragover', e => { if (hasFiles(e)) e.preventDefault(); });
addEventListener('drop', e => { if (!hasFiles(e)) return; e.preventDefault(); dragN = 0; dz.classList.remove('is-on'); if (ui.view === 'biblioteca') doUpload(e.dataTransfer.files); });

/* tema */
function setTheme(t) {
  document.documentElement.dataset.theme = t; LS.set('theme', t);
  $('#themeBtn').innerHTML = icon(t === 'dark' ? 'sun' : 'moon');
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'dark' ? '#150C0F' : '#FBF3F1');
}
$('#themeBtn').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
$('#authBtn').addEventListener('click', () => { if (ui.conn !== 'on') connect(); });
setTheme(LS.get('theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

/* ═════════════ Arranque ═════════════ */
monitors.push(new Monitor($('#monSide')));
addEventListener('hashchange', route);
if (DEMO) {
  if (!Object.keys(data.todos).length) {
    data.todos[ui.today] = [{ id: uid(), text: 'Repasar la lectura sistemática del ECG', done: true }, { id: uid(), text: 'Resumen de insuficiencia cardíaca con fracción reducida', done: false }, { id: uid(), text: 'Subir diapositivas de arritmias a la carpeta', done: false }, { id: uid(), text: 'Ver el video de bloqueos AV', done: false }];
  }
}
route();

async function boot() {
  if (DEMO || !CFG.CLIENT_ID) return;
  if (!gsiReady()) { await new Promise(r => { addEventListener('gsi-ready', r, { once: true }); setTimeout(r, 6000); }); }
  if (!initClient()) return;
  if (token && Date.now() < tokenExp) { connect(); return; }      // token vigente: entra solo
  if (LS.get('connected', 0)) { ui.conn = 'reconnect'; render(); } // hace falta un clic (el navegador bloquea popups sin gesto)
}
boot();
setInterval(() => { if (dkey() !== ui.today) { ui.today = dkey(); render(); } }, 60000);
})();
