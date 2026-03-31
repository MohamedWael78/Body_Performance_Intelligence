/* ══════════════════════════════════════════════════════════════════════════════
   APEX · History & Compare Engine
   ══════════════════════════════════════════════════════════════════════════════ */

const StorageKey = "apex_history";

function getHistory() {
  const data = localStorage.getItem(StorageKey);
  return data ? JSON.parse(data) : [];
}

function saveToHistory(inputs, cls, probs, jump) {
  const h = getHistory();
  h.push({
    id: Date.now(),
    date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    inputs, cls, probs, jump
  });
  localStorage.setItem(StorageKey, JSON.stringify(h));
}

let selectedForCompare = [];

function openHistoryModal() {
  document.getElementById('history-modal').classList.add('show');
  renderHistoryList();
}

function closeHistoryModal() {
  document.getElementById('history-modal').classList.remove('show');
  selectedForCompare = [];
}

function renderHistoryList() {
  const list = document.getElementById('hi-list-container');
  const h = getHistory();
  
  if (h.length === 0) {
    list.innerHTML = '<div style="color:var(--text2);text-align:center;padding:20px;">No performance history found yet. Run an analysis!</div>';
    document.getElementById('trend-canv').style.display = 'none';
    return;
  }

  list.innerHTML = '';
  h.forEach((run, i) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.onclick = () => toggleCompareSelect(run.id, item);
    item.innerHTML = `
      <div>
        <div class="hi-date">${run.date}</div>
        <div style="font-size:12px;color:var(--text3);margin-top:4px;">BMI: ${calcBMI(run.inputs.weight_kg, run.inputs.height_cm).bmi}</div>
      </div>
      <div class="hi-stats">
        <div class="hi-jump">${run.jump} cm</div>
        <div class="hi-badge " style="background:var(--${run.cls === 'A'?'green':run.cls==='B'?'blue':run.cls==='C'?'gold':'red'})">${run.cls}</div>
      </div>
    `;
    list.appendChild(item);
  });

  drawTrendGraph(h);
}

function calcBMI(weight, height) {
  const hM = height / 100;
  const val = +(weight / (hM * hM)).toFixed(1);
  let status = "Normal";
  if(val < 18.5) status = "Underweight";
  else if(val > 25 && val < 30) status = "Overweight";
  else if(val >= 30) status = "Obese";
  return { bmi: val, status };
}

function toggleCompareSelect(id, el) {
  const idx = selectedForCompare.indexOf(id);
  if (idx > -1) {
    selectedForCompare.splice(idx, 1);
    el.classList.remove('selected');
  } else {
    if (selectedForCompare.length >= 2) return; // max 2
    selectedForCompare.push(id);
    el.classList.add('selected');
  }

  const btn = document.getElementById('btn-compare');
  if (selectedForCompare.length === 2) {
    btn.disabled = false;
    btn.textContent = "Compare Selected Runs";
  } else {
    btn.disabled = true;
    btn.textContent = "Select 2 runs to compare";
  }
}

function showComparison() {
  const h = getHistory();
  const run1 = h.find(r => r.id === selectedForCompare[0]);
  const run2 = h.find(r => r.id === selectedForCompare[1]);

  document.getElementById('history-list-view').style.display = 'none';
  const cv = document.getElementById('compare-view');
  cv.style.display = 'flex';

  document.getElementById('col1-date').textContent = run1.date;
  document.getElementById('col2-date').textContent = run2.date;

  const renderStats = (run) => `
    <div class="cc-row"><span class="cc-lbl">Class</span><span class="cc-val">${run.cls}</span></div>
    <div class="cc-row"><span class="cc-lbl">Jump</span><span class="cc-val">${run.jump} cm</span></div>
    <div class="cc-row"><span class="cc-lbl">Weight</span><span class="cc-val">${run.inputs.weight_kg} kg</span></div>
    <div class="cc-row"><span class="cc-lbl">Body Fat</span><span class="cc-val">${run.inputs.body_fat_pct}%</span></div>
    <div class="cc-row"><span class="cc-lbl">Situps</span><span class="cc-val">${run.inputs.sit_ups_counts}</span></div>
    <div class="cc-row"><span class="cc-lbl">Bend</span><span class="cc-val">${run.inputs.sit_and_bend_forward_cm} cm</span></div>
    <div class="cc-row"><span class="cc-lbl">Grip</span><span class="cc-val">${run.inputs.gripForce} kg</span></div>
  `;

  document.getElementById('col1-stats').innerHTML = renderStats(run1);
  document.getElementById('col2-stats').innerHTML = renderStats(run2);
}

function backToHistory() {
  document.getElementById('compare-view').style.display = 'none';
  document.getElementById('history-list-view').style.display = 'block';
  selectedForCompare = [];
  renderHistoryList();
}

function drawTrendGraph(h) {
  const canvas = document.getElementById('trend-canv');
  if (!canvas) return;
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);

  if (h.length < 2) return;

  const jumps = h.map(r => r.jump);
  const minJ = Math.min(...jumps) - 10;
  const maxJ = Math.max(...jumps) + 10;
  
  const stepX = W / (h.length - 1);

  ctx.beginPath();
  ctx.strokeStyle = '#00e5c8';
  ctx.lineWidth = 2;
  
  h.forEach((r, i) => {
    const x = i * stepX;
    const y = H - ((r.jump - minJ) / (maxJ - minJ)) * (H - 20) - 10;
    if(i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  });
  ctx.stroke();

  // Draw dots
  h.forEach((r, i) => {
    const x = i * stepX;
    const y = H - ((r.jump - minJ) / (maxJ - minJ)) * (H - 20) - 10;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI*2);
    ctx.fillStyle = '#141d2e';
    ctx.fill();
    ctx.stroke();
  });
}
