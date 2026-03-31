/* ══════════════════════════════════════════════════════════════════════════════
   APEX · App Core — Navigation, Sliders, Gender, Toast
   ══════════════════════════════════════════════════════════════════════════════ */

// ── Navigation ───────────────────────────────────────────────────────────────
function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  if (btn) btn.classList.add('active');
}

// ── Slider Values ────────────────────────────────────────────────────────────
function updateVal(id, val) {
  document.getElementById(id + '-val').textContent = val;
  updateSliderGradient(id);

  if(id === 'height' || id === 'weight') {
    const w = +document.getElementById('weight').value;
    const h = +document.getElementById('height').value;
    if(typeof calcBMI === 'function') {
      const res = calcBMI(w, h);
      const badge = document.getElementById('bmi-display');
      if(badge) {
        badge.textContent = `BMI: ${res.bmi} (${res.status})`;
        badge.className = `bmi-badge ${res.status}`;
      }
    }
  }
}

function updateSliderGradient(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const min = +el.min, max = +el.max, val = +el.value;
  const pct = ((val - min) / (max - min)) * 100;
  el.style.background = `linear-gradient(90deg, var(--teal) ${pct}%, var(--border2) ${pct}%)`;
}

// ── Gender Toggle ────────────────────────────────────────────────────────────
let currentGender = 'M';
function setGender(g) {
  currentGender = g;
  document.getElementById('btn-M').classList.toggle('active', g === 'M');
  document.getElementById('btn-F').classList.toggle('active', g === 'F');
}

// ── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Initialize ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Init all slider gradients
  document.querySelectorAll('input[type="range"]').forEach(el => {
    updateSliderGradient(el.id);
  });

  // Draw initial radar
  if (typeof drawRadar === 'function') {
    drawRadar({ bend: 20, situps: 35, jump: 160, grip: 35, fat: 20, systolic: 120 }, 'B');
  }

  // Animate hero stats on load
  animateHeroStats();
});

// ── Hero Stat Counter Animation ──────────────────────────────────────────────
function animateHeroStats() {
  document.querySelectorAll('.hero-stat .val').forEach(el => {
    const text = el.textContent;
    const match = text.match(/[\d,.]+/);
    if (!match) return;

    const target = parseFloat(match[0].replace(/,/g, ''));
    const hasComma = match[0].includes(',');
    const prefix = text.substring(0, text.indexOf(match[0]));
    const suffix = text.substring(text.indexOf(match[0]) + match[0].length);
    const isDecimal = match[0].includes('.');
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = target * eased;

      let display;
      if (isDecimal) {
        const decimals = match[0].split('.')[1]?.length || 1;
        display = current.toFixed(decimals);
      } else {
        display = Math.round(current).toString();
        if (hasComma) display = Number(display).toLocaleString();
      }
      el.textContent = prefix + display + suffix;

      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

// ── Artifact Viewer Modal ───────────────────────────────────────────────────
function openArtifactModal(url) {
  const modal = document.getElementById('artifact-modal');
  const iframe = document.getElementById('artifact-iframe');
  
  // Set the iframe source to the Google Drive preview link
  iframe.src = url;
  
  // Display the modal
  modal.classList.add('active');
  
  // Prevent page scrolling while modal is active
  document.body.style.overflow = 'hidden';
}

function closeArtifactModal() {
  const modal = document.getElementById('artifact-modal');
  const iframe = document.getElementById('artifact-iframe');
  
  // Exit fullscreen if active
  if (document.fullscreenElement) {
    document.exitFullscreen();
  }
  modal.classList.remove('fullscreen');
  
  // Hide modal
  modal.classList.remove('active');
  
  // Clear the iframe src to stop playback/loading and free memory
  setTimeout(() => {
    iframe.src = '';
  }, 400); // wait for fade out animation
  
  // Restore page scrolling
  document.body.style.overflow = '';
}

// ── Artifact Fullscreen Toggle ──────────────────────────────────────────────
function toggleArtifactFullscreen() {
  const modal = document.getElementById('artifact-modal');
  const dialog = modal.querySelector('.artifact-dialog');
  const btn = document.getElementById('fullscreen-btn');
  
  if (!document.fullscreenElement) {
    // Enter fullscreen
    dialog.requestFullscreen().then(() => {
      modal.classList.add('fullscreen');
      btn.textContent = '⛶';
      btn.title = 'Exit Fullscreen';
    }).catch(() => {
      // Fallback: just maximize the dialog via CSS
      modal.classList.add('fullscreen');
      btn.textContent = '⛶';
      btn.title = 'Exit Fullscreen';
    });
  } else {
    // Exit fullscreen
    document.exitFullscreen();
    modal.classList.remove('fullscreen');
    btn.textContent = '⛶';
    btn.title = 'Toggle Fullscreen';
  }
}

// Listen for fullscreen change to sync UI state
document.addEventListener('fullscreenchange', () => {
  const modal = document.getElementById('artifact-modal');
  const btn = document.getElementById('fullscreen-btn');
  if (!document.fullscreenElement && modal) {
    modal.classList.remove('fullscreen');
    if (btn) {
      btn.textContent = '⛶';
      btn.title = 'Toggle Fullscreen';
    }
  }
});

// Close the modal when clicking outside the dialog area
document.addEventListener('click', function(event) {
  const modal = document.getElementById('artifact-modal');
  if (event.target === modal && modal.classList.contains('active')) {
    closeArtifactModal();
  }
});
