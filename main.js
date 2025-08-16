"use strict";

/**
 * FALLING CATCH — Vollständiges Grundspiel
 * - Schwierigkeitsstufen: easy, medium, hard, hardcore (Freischaltung)
 * - Editor mit Speicherslots: gute/böse Items + Hintergrund-Bild
 * - Statistiken + Bestwerte
 * - Persistenz per localStorage
 * - Keine Powerups
 */

/* ===================== Storage & Defaults ===================== */

const STORAGE_KEY = "falling_catch_v1";

const defaultData = () => ({
  totals: {
    totalPoints: 0,
    totalGames: 0,
    totalPlayTimeSec: 0,
  },
  best: {
    easy: 0,
    medium: 0,
    hard: 0,
    hardcore: 0,
  },
  // Editor: mehrere Slots; einer aktiv
  editor: {
    activeSlotId: "Standard",
    slots: {
      "Standard": makeDefaultSlot("Standard"),
    },
  },
  // Item-Statistiken je Slot
  stats: {
    // [slotId]: { goodCounts: number[], badCounts: number[] }
  },
});

function makeDefaultSlot(name) {
  return {
    id: name,
    name,
    goodImages: [
      svgDataUrlGood("#48d597"),
      svgDataUrlGood("#5ad8ff"),
      svgDataUrlGood("#ffd35a"),
    ],
    badImages: [
      svgDataUrlBad("#ff5c93"),
      svgDataUrlBad("#ff7b6b"),
    ],
    background: defaultBackground(),
  };
}

function ensureCountsForSlot(state, slot) {
  const lenG = slot.goodImages.length;
  const lenB = slot.badImages.length;
  state.stats[slot.id] ??= { goodCounts: [], badCounts: [] };
  const s = state.stats[slot.id];
  while (s.goodCounts.length < lenG) s.goodCounts.push(0);
  while (s.badCounts.length < lenB) s.badCounts.push(0);
  // kürzen falls Images gelöscht
  s.goodCounts = s.goodCounts.slice(0, lenG);
  s.badCounts = s.badCounts.slice(0, lenB);
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultData();
  try {
    const parsed = JSON.parse(raw);
    // sanft migrieren
    if (!parsed.editor) parsed.editor = defaultData().editor;
    if (!parsed.stats) parsed.stats = {};
    return parsed;
  } catch {
    return defaultData();
  }
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ===================== SVG / Assets ===================== */

function svgDataUrlGood(color="#48d597"){
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='${color}' stop-opacity='1'/>
        <stop offset='100%' stop-color='${color}' stop-opacity='.75'/>
      </linearGradient>
    </defs>
    <circle cx='50' cy='50' r='44' fill='url(#g)'/>
    <path d='M28 52 l14 14 30-34' fill='none' stroke='#0b0' stroke-width='10' stroke-linecap='round' stroke-linejoin='round'/>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
function svgDataUrlBad(color="#ff5c93"){
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <defs>
      <radialGradient id='r' cx='.5' cy='.3' r='.8'>
        <stop offset='0%' stop-color='${color}' stop-opacity='1'/>
        <stop offset='100%' stop-color='${color}' stop-opacity='.7'/>
      </radialGradient>
    </defs>
    <rect x='8' y='8' width='84' height='84' rx='18' fill='url(#r)'/>
    <path d='M32 32 L68 68 M68 32 L32 68' stroke='#700' stroke-width='10' stroke-linecap='round'/>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
function defaultBackground(){
  // zartes Grid als DataURL
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'>
    <rect width='40' height='40' fill='rgba(255,255,255,0.015)'/>
    <path d='M0 0 H40 M0 0 V40' stroke='rgba(255,255,255,0.05)' stroke-width='1'/>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

/* ===================== Globals & Elements ===================== */

let state = loadState();

// Views & Nav
const viewHome   = el("#view-home");
const viewGame   = el("#view-game");
const viewStats  = el("#view-stats");
const viewEditor = el("#view-editor");

const btnNavHome  = el("#nav-home");
const btnNavStats = el("#nav-stats");
const btnNavEditor = el("#nav-editor");

// Home best values
const bestEls = {
  easy: el("#best-easy"),
  medium: el("#best-medium"),
  hard: el("#best-hard"),
  hardcore: el("#best-hardcore"),
};
const totalPointsEl = el("#total-points");
const progressTotalEl = el("#progress-total");
const btnHardcore = el("#btn-hardcore");

// Game HUD
const hudScore = el("#hud-score");
const hudLives = el("#hud-lives");
const hudMode  = el("#hud-mode");
const btnPause = el("#btn-pause");
const btnQuit  = el("#btn-quit");
const gameArea = el("#game-area");
const overlayPause = el("#overlay-pause");
const overlayOver  = el("#overlay-gameover");
const overScoreEl  = el("#over-score");
const btnResume = el("#btn-resume");
const btnExit   = el("#btn-exit");
const btnRetry  = el("#btn-retry");
const btnHome   = el("#btn-home");

// Stats view
const statTotalPts  = el("#stat-total-points");
const statTotalGames= el("#stat-total-games");
const statTotalTime = el("#stat-total-time");
const statBest = {
  easy: el("#stat-best-easy"),
  medium: el("#stat-best-medium"),
  hard: el("#stat-best-hard"),
  hardcore: el("#stat-best-hardcore"),
};
const thumbBestGood = el("#thumb-best-good");
const thumbBestBad  = el("#thumb-best-bad");
const btnResetStats = el("#btn-reset-stats");
const btnResetAll   = el("#btn-reset-all");

// Editor view
const slotSelect = el("#slot-select");
const slotNew    = el("#slot-new");
const slotRename = el("#slot-rename");
const slotDelete = el("#slot-delete");
const slotSave   = el("#slot-save");

const goodPreview = el("#good-preview");
const badPreview  = el("#bad-preview");
const bgPreview   = el("#bg-preview");

const goodUpload  = el("#good-upload");
const badUpload   = el("#bad-upload");
const bgUpload    = el("#bg-upload");

const goodReset   = el("#good-reset");
const badReset    = el("#bad-reset");
const bgReset     = el("#bg-reset");

// Mode buttons
$$(".mode-btn").forEach(b => b.addEventListener("click", () => startGame(b.dataset.mode)));

// Nav actions
btnNavHome.addEventListener("click", () => showView("home"));
btnNavStats.addEventListener("click", () => { renderStats(); showView("stats"); });
btnNavEditor.addEventListener("click", () => {
  if (btnNavEditor.disabled) return;
  loadEditorUI();
  showView("editor");
});

// Game controls
btnPause.addEventListener("click", togglePause);
btnQuit.addEventListener("click", endRoundConfirm);
btnResume.addEventListener("click", () => togglePause(false));
btnExit.addEventListener("click", endRoundConfirm);
btnRetry.addEventListener("click", () => {
  overlayOver.classList.add("hidden");
  startGame(currentMode);
});
btnHome.addEventListener("click", () => {
  overlayOver.classList.add("hidden");
  showView("home");
});

// Stats buttons
btnResetStats.addEventListener("click", () => {
  if (!confirm("Nur Statistiken (Punkte/Zeit/Bestwerte) zurücksetzen? Editor bleibt erhalten.")) return;
  state.totals = defaultData().totals;
  state.best = defaultData().best;
  saveState();
  hydrateHome();
  renderStats();
});
btnResetAll.addEventListener("click", () => {
  if (!confirm("Wirklich ALLES zurücksetzen? (Statistiken, Bestwerte, Editor-Slots)")) return;
  state = defaultData();
  saveState();
  hydrateHome();
  if (viewEditor.classList.contains("active")) loadEditorUI();
  renderStats();
});

// Editor events
slotNew.addEventListener("click", () => {
  const name = prompt("Name für neuen Slot:", "Mein Set");
  if (!name) return;
  if (state.editor.slots[name]) return alert("Name bereits vorhanden.");
  state.editor.slots[name] = makeDefaultSlot(name);
  state.editor.activeSlotId = name;
  ensureCountsForSlot(state, state.editor.slots[name]);
  saveState();
  loadEditorUI();
});
slotRename.addEventListener("click", () => {
  const oldId = state.editor.activeSlotId;
  const newName = prompt("Neuer Name:", oldId);
  if (!newName || newName === oldId) return;
  if (state.editor.slots[newName]) return alert("Name bereits vorhanden.");
  // umhängen
  state.editor.slots[newName] = { ...state.editor.slots[oldId], id: newName, name: newName };
  state.stats[newName] = state.stats[oldId] ?? { goodCounts: [], badCounts: [] };
  delete state.editor.slots[oldId];
  delete state.stats[oldId];
  state.editor.activeSlotId = newName;
  saveState();
  loadEditorUI();
});
slotDelete.addEventListener("click", () => {
  const id = state.editor.activeSlotId;
  if (id === "Standard") return alert("Der Standard-Slot kann nicht gelöscht werden.");
  if (!confirm(`Slot "${id}" löschen?`)) return;
  delete state.editor.slots[id];
  delete state.stats[id];
  state.editor.activeSlotId = "Standard";
  saveState();
  loadEditorUI();
});
slotSelect.addEventListener("change", () => {
  state.editor.activeSlotId = slotSelect.value;
  saveState();
  loadEditorUI();
});

goodUpload.addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  const imgs = await filesToDataURLs(files);
  currentSlot().goodImages.push(...imgs);
  ensureCountsForSlot(state, currentSlot());
  saveState();
  loadEditorUI();
  e.target.value = "";
});
badUpload.addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  const imgs = await filesToDataURLs(files);
  currentSlot().badImages.push(...imgs);
  ensureCountsForSlot(state, currentSlot());
  saveState();
  loadEditorUI();
  e.target.value = "";
});
bgUpload.addEventListener("change", async (e) => {
  const file = (e.target.files || [])[0];
  if (!file) return;
  const url = await fileToDataURL(file);
  currentSlot().background = url;
  saveState();
  loadEditorUI();
  e.target.value = "";
});

goodReset.addEventListener("click", () => {
  if (!confirm("Gute Items dieses Slots auf Standard zurücksetzen?")) return;
  const slot = currentSlot();
  slot.goodImages = makeDefaultSlot("tmp").goodImages;
  ensureCountsForSlot(state, slot);
  saveState();
  loadEditorUI();
});
badReset.addEventListener("click", () => {
  if (!confirm("Böse Items dieses Slots auf Standard zurücksetzen?")) return;
  const slot = currentSlot();
  slot.badImages = makeDefaultSlot("tmp").badImages;
  ensureCountsForSlot(state, slot);
  saveState();
  loadEditorUI();
});
bgReset.addEventListener("click", () => {
  if (!confirm("Hintergrund dieses Slots auf Standard zurücksetzen?")) return;
  currentSlot().background = defaultBackground();
  saveState();
  loadEditorUI();
});

slotSave.addEventListener("click", () => {
  alert("Gespeichert!");
  saveState();
});

/* ===================== UI Hydration ===================== */

function hydrateHome(){
  bestEls.easy.textContent = state.best.easy;
  bestEls.medium.textContent = state.best.medium;
  bestEls.hard.textContent = state.best.hard;
  bestEls.hardcore.textContent = state.best.hardcore;

  totalPointsEl.textContent = state.totals.totalPoints;
  const pct = Math.min(100, Math.round((state.totals.totalPoints / 500)*100));
  progressTotalEl.style.width = pct + "%";

  // Editor freigeschaltet?
  const editorUnlocked = state.totals.totalPoints >= 500;
  btnNavEditor.disabled = !editorUnlocked;
  btnNavEditor.dataset.locked = String(!editorUnlocked);
  btnNavEditor.textContent = editorUnlocked ? "Editor" : "Editor (500 Punkte)";

  // Hardcore freigeschaltet?
  const hcUnlocked = state.best.easy >= 100 && state.best.medium >= 100 && state.best.hard >= 100;
  btnHardcore.disabled = !hcUnlocked;
  btnHardcore.textContent = hcUnlocked ? "Hardcore" : "Hardcore (gesperrt)";
}

function renderStats(){
  statTotalPts.textContent = state.totals.totalPoints;
  statTotalGames.textContent = state.totals.totalGames;
  statTotalTime.textContent = formatHMS(state.totals.totalPlayTimeSec);
  statBest.easy.textContent = state.best.easy;
  statBest.medium.textContent = state.best.medium;
  statBest.hard.textContent = state.best.hard;
  statBest.hardcore.textContent = state.best.hardcore;

  // häufigste Items (aktiver Slot)
  const slot = currentSlot();
  ensureCountsForSlot(state, slot);
  const s = state.stats[slot.id];

  const gIdx = indexOfMax(s.goodCounts);
  const bIdx = indexOfMax(s.badCounts);

  thumbBestGood.innerHTML = "";
  if (slot.goodImages[gIdx]) {
    const img = new Image();
    img.src = slot.goodImages[gIdx];
    thumbBestGood.appendChild(img);
  } else {
    thumbBestGood.textContent = "-";
  }

  thumbBestBad.innerHTML = "";
  if (slot.badImages[bIdx]) {
    const img = new Image();
    img.src = slot.badImages[bIdx];
    thumbBestBad.appendChild(img);
  } else {
    thumbBestBad.textContent = "-";
  }
}

function loadEditorUI(){
  // Slots select
  slotSelect.innerHTML = "";
  Object.values(state.editor.slots).forEach(slot => {
    const opt = document.createElement("option");
    opt.value = slot.id;
    opt.textContent = slot.name;
    if (slot.id === state.editor.activeSlotId) opt.selected = true;
    slotSelect.appendChild(opt);
  });

  // Previews
  const slot = currentSlot();
  ensureCountsForSlot(state, slot);

  goodPreview.innerHTML = "";
  slot.goodImages.forEach((src, i) => {
    goodPreview.appendChild(previewCell(src, () => {
      // löschen
      if (!confirm("Dieses Bild entfernen?")) return;
      slot.goodImages.splice(i,1);
      ensureCountsForSlot(state, slot);
      saveState(); loadEditorUI();
    }));
  });

  badPreview.innerHTML = "";
  slot.badImages.forEach((src, i) => {
    badPreview.appendChild(previewCell(src, () => {
      if (!confirm("Dieses Bild entfernen?")) return;
      slot.badImages.splice(i,1);
      ensureCountsForSlot(state, slot);
      saveState(); loadEditorUI();
    }));
  });

  bgPreview.innerHTML = "";
  bgPreview.appendChild(previewCell(slot.background, null, true));

  // Hintergrund im Spielbereich setzen (Live-Vorschau falls Editor offen)
  gameArea.style.backgroundImage = `url("${slot.background}")`;
  gameArea.style.backgroundSize = "auto";
}

/* ===================== Game Logic ===================== */

const MODES = {
  easy:   { lives:5, spawnMs:1000, speedMin:110, speedMax:220, badChance:0.15 },
  medium: { lives:3, spawnMs:800,  speedMin:160, speedMax:300, badChance:0.25 },
  hard:   { lives:2, spawnMs:620,  speedMin:230, speedMax:380, badChance:0.35 },
  hardcore:{lives:1, spawnMs:450,  speedMin:340, speedMax:560, badChance:0.55 },
};

let currentMode = null;
let running = false;
let paused  = false;
let score=0, lives=0;
let spawnTimer = 0;
let lastTs = 0;
let roundStartTs = 0;

const activeItems = new Set(); // {el, y, vy, type, idx}

function startGame(mode){
  // block falls Hardcore gesperrt
  if (mode === "hardcore") {
    const unlocked = state.best.easy >= 100 && state.best.medium >= 100 && state.best.hard >= 100;
    if (!unlocked) return alert("Hardcore ist noch gesperrt.");
  }
  currentMode = mode;
  score = 0;
  lives = MODES[mode].lives;
  running = true;
  paused = false;
  spawnTimer = 0;
  lastTs = performance.now();
  roundStartTs = Date.now();

  // Cleanup area
  activeItems.forEach(it => it.el.remove());
  activeItems.clear();
  overlayPause.classList.add("hidden");
  overlayOver.classList.add("hidden");

  // Hintergrund des aktiven Slots
  const slot = currentSlot();
  gameArea.style.backgroundImage = `url("${slot.background}")`;
  gameArea.style.backgroundSize = "auto";

  // HUD
  hudScore.textContent = "0";
  hudLives.textContent = String(lives);
  hudMode.textContent  = modeLabel(mode);

  showView("game");
  requestAnimationFrame(gameLoop);
}

function gameLoop(ts){
  if (!running) return;
  const dt = Math.min(50, ts - lastTs); // ms clamp
  lastTs = ts;

  if (!paused){
    // spawn
    spawnTimer += dt;
    const spawnMs = MODES[currentMode].spawnMs;
    while (spawnTimer >= spawnMs){
      spawnTimer -= spawnMs;
      spawnItem();
    }
    // move
    updateItems(dt);
  }

  requestAnimationFrame(gameLoop);
}

function spawnItem(){
  const { speedMin, speedMax, badChance } = MODES[currentMode];
  const slot = currentSlot();
  const W = gameArea.clientWidth, H = gameArea.clientHeight;

  // type
  const isBad = Math.random() < badChance;
  const imgs = isBad ? slot.badImages : slot.goodImages;
  if (!imgs.length) return; // falls leer

  const idx = Math.floor(Math.random()*imgs.length);
  const el = document.createElement("div");
  el.className = "item " + (isBad ? "bad":"good");
  el.style.left = Math.round(Math.random()*(W-56)) + "px";
  el.style.top = "-64px";

  const img = new Image();
  img.src = imgs[idx];
  el.appendChild(img);

  // Speed (px/sec)
  const vy = rand(speedMin, speedMax);

  // Click behavior
  el.addEventListener("click", (ev) => {
    if (!running || paused) return;
    ev.stopPropagation();
    if (isBad){
      // −1 Leben
      changeLives(-1);
      bumpBadCount(idx);
      removeItem(it);
    } else {
      // +1 Punkt
      score += 1;
      hudScore.textContent = String(score);
      bumpGoodCount(idx);
      removeItem(it);
    }
  });

  gameArea.appendChild(el);
  const it = { el, y: -64, vy, type: isBad ? "bad":"good", idx };
  activeItems.add(it);

  // Auto-remove safety after 15s
  setTimeout(() => { if (activeItems.has(it)) removeItem(it); }, 15000);
}

function updateItems(dt){
  const H = gameArea.clientHeight;
  const toRemove = [];
  activeItems.forEach(it => {
    it.y += it.vy * (dt/1000);
    it.el.style.transform = `translateY(${it.y}px)`;
    if (it.y + 56 >= H){ // Boden erreicht
      if (it.type === "good"){
        changeLives(-1);
      }
      toRemove.push(it);
    }
  });
  toRemove.forEach(removeItem);
}

function removeItem(it){
  activeItems.delete(it);
  if (it.el && it.el.parentNode) it.el.parentNode.removeChild(it.el);
}

function changeLives(delta){
  lives += delta;
  hudLives.textContent = String(lives);
  if (lives <= 0) endRound();
}

function endRound(){
  running = false;
  paused = false;

  // Clean items
  activeItems.forEach(it => it.el.remove());
  activeItems.clear();

  // Update totals
  state.totals.totalPoints += score;
  state.totals.totalGames += 1;
  const secs = Math.max(0, Math.round((Date.now() - roundStartTs)/1000));
  state.totals.totalPlayTimeSec += secs;

  // Best update
  if (score > (state.best[currentMode] ?? 0)) {
    state.best[currentMode] = score;
  }

  saveState();
  hydrateHome();
  renderStats();

  overScoreEl.textContent = String(score);
  overlayOver.classList.remove("hidden");
}

function endRoundConfirm(){
  if (!running) return showView("home");
  if (!confirm("Runde wirklich beenden? Fortschritt geht verloren.")) return;
  endRound();
}

function togglePause(force){
  if (!running) return;
  paused = (typeof force === "boolean") ? force : !paused;
  overlayPause.classList.toggle("hidden", !paused);
}

/* ===================== Helpers ===================== */

function modeLabel(m){
  return m === "easy" ? "Leicht" : m === "medium" ? "Mittel" : m === "hard" ? "Schwer" : "Hardcore";
}
function indexOfMax(arr){
  if (!arr || arr.length===0) return 0;
  let idx = 0, val = -Infinity;
  arr.forEach((v,i)=>{ if (v>val) { val=v; idx=i; }});
  return idx;
}
function formatHMS(total){
  const h = Math.floor(total/3600);
  const m = Math.floor((total%3600)/60);
  const s = total%60;
  const pad = (n)=> String(n).padStart(2,"0");
  return `${h}:${pad(m)}:${pad(s)}`;
}
function rand(a,b){ return a + Math.random()*(b-a); }

function $(sel, root=document){ return root.querySelector(sel); }
function $$(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
function el(sel){ return document.querySelector(sel); }

function showView(name){
  [viewHome, viewGame, viewStats, viewEditor].forEach(v => v.classList.remove("active"));
  if (name==="home") viewHome.classList.add("active");
  if (name==="game") viewGame.classList.add("active");
  if (name==="stats") viewStats.classList.add("active");
  if (name==="editor") viewEditor.classList.add("active");
}

function currentSlot(){
  const id = state.editor.activeSlotId;
  return state.editor.slots[id] ?? (state.editor.slots[id] = makeDefaultSlot(id));
}
function previewCell(src, onDelete, single=false){
  const cell = document.createElement("div");
  cell.className = "cell";
  const img = new Image();
  img.src = src;
  cell.appendChild(img);
  if (onDelete){
    const del = document.createElement("button");
    del.className = "del";
    del.textContent = "✕";
    del.addEventListener("click", (e)=>{ e.stopPropagation(); onDelete(); });
    cell.appendChild(del);
  }
  return cell;
}

async function fileToDataURL(file){
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}
async function filesToDataURLs(files){
  const out = [];
  for (const f of files) out.push(await fileToDataURL(f));
  return out;
}

function bumpGoodCount(idx){
  const slot = currentSlot();
  ensureCountsForSlot(state, slot);
  state.stats[slot.id].goodCounts[idx] = (state.stats[slot.id].goodCounts[idx] ?? 0) + 1;
}
function bumpBadCount(idx){
  const slot = currentSlot();
  ensureCountsForSlot(state, slot);
  state.stats[slot.id].badCounts[idx] = (state.stats[slot.id].badCounts[idx] ?? 0) + 1;
}

/* ===================== Init ===================== */

function init(){
  // ensure counts for active slot
  ensureCountsForSlot(state, currentSlot());
  hydrateHome();
  renderStats();
  loadEditorUI();
  showView("home");

  // Klick in leeren Bereich des Spiels macht nichts, aber verhindert selektion
  gameArea.addEventListener("mousedown", (e)=> e.preventDefault());
}
init();

// Warnung, wenn Editor gesperrt-Button
btnNavEditor.addEventListener("click", (e) => {
  if (btnNavEditor.disabled) {
    alert("Editor wird freigeschaltet, wenn du insgesamt 500 Punkte erreicht hast.");
  }
});
