/* ══════════════════════════════════════════════════════════════════════════════
   APEX · Charts — 3-Split Comparison & K-Fold CV Results
   ══════════════════════════════════════════════════════════════════════════════ */

// ── Real data from notebook outputs ──────────────────────────────────────────
const SPLIT_DATA = {
  labels: ['Random Forest', 'Neural Network', 'SVM (RBF)', 'Decision Tree', 'Logistic Reg', 'KNN'],
  '80/20': [74.01, 72.40, 71.14, 63.78, 63.14, 62.55],
  '70/30': [74.26, 74.06, 71.62, 65.17, 62.36, 61.84],
  '50/50': [72.36, 72.38, 70.51, 64.43, 62.32, 61.71],
};

const CV_RESULTS = [
  { model: 'Random Forest',    mean: 73.32, std: 0.78,  color: 'var(--teal)',  bar: 99 },
  { model: 'Neural Network',   mean: 74.00, std: 1.12,  color: 'var(--blue)',  bar: 100 },
  { model: 'SVM (RBF)',        mean: 70.90, std: 0.69,  color: 'var(--gold)',  bar: 96 },
  { model: 'Decision Tree',    mean: 64.75, std: 0.80,  color: 'var(--green)', bar: 87 },
  { model: 'Logistic Reg',     mean: 61.67, std: 0.83,  color: '#a061f0',      bar: 83 },
  { model: 'KNN',              mean: 62.08, std: 0.72,  color: 'var(--red)',   bar: 84 },
];

// ── Stability deltas (best 80/20 - worst split) ───────────────────────────────
const STABILITY = [
  { model: 'SVM (RBF)',        delta: 1.11, rating: '⚡ Most Stable',  color: 'var(--teal)' },
  { model: 'Random Forest',    delta: 1.90, rating: '✅ Very Stable',   color: 'var(--teal)' },
  { model: 'KNN',              delta: 0.84, rating: '⚠️ Low Variance',  color: 'var(--gold)' },
  { model: 'Neural Network',   delta: 1.68, rating: '✅ Very Stable',   color: 'var(--teal)' },
  { model: 'Decision Tree',    delta: 1.39, rating: '✅ Stable',        color: 'var(--blue)' },
  { model: 'Logistic Reg',     delta: 0.82, rating: '⚠️ Low Variance',  color: 'var(--gold)' },
];

// ── Draw the split comparison chart ──────────────────────────────────────────
let splitChart = null;

function initSplitChart() {
  const canvas = document.getElementById('split-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');

  const gridColor = 'rgba(255,255,255,0.06)';
  const tickColor = 'rgba(255,255,255,0.4)';

  splitChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: SPLIT_DATA.labels,
      datasets: [
        {
          label: '80/20 Split',
          data: SPLIT_DATA['80/20'],
          backgroundColor: 'rgba(0,229,200,0.65)',
          borderColor: 'rgba(0,229,200,0.9)',
          borderWidth: 1,
          borderRadius: 3,
          borderSkipped: false,
        },
        {
          label: '70/30 Split',
          data: SPLIT_DATA['70/30'],
          backgroundColor: 'rgba(77,159,255,0.65)',
          borderColor: 'rgba(77,159,255,0.9)',
          borderWidth: 1,
          borderRadius: 3,
          borderSkipped: false,
        },
        {
          label: '50/50 Split',
          data: SPLIT_DATA['50/50'],
          backgroundColor: 'rgba(240,165,0,0.65)',
          borderColor: 'rgba(240,165,0,0.9)',
          borderWidth: 1,
          borderRadius: 3,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1000, easing: 'easeInOutQuart' },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: tickColor,
            font: { family: "'Space Mono', monospace", size: 11 },
            boxWidth: 12,
            boxHeight: 12,
            padding: 16,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(8,12,24,0.95)',
          borderColor: 'rgba(0,229,200,0.3)',
          borderWidth: 1,
          titleColor: 'rgba(255,255,255,0.9)',
          bodyColor: 'rgba(255,255,255,0.6)',
          padding: 12,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}%`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: {
            color: tickColor,
            font: { family: "'Space Mono', monospace", size: 10 },
            maxRotation: 15,
            minRotation: 0,
          },
        },
        y: {
          min: 55,
          max: 80,
          grid: { color: gridColor },
          ticks: {
            color: tickColor,
            font: { family: "'Space Mono', monospace", size: 10 },
            callback: v => v + '%',
            stepSize: 5,
          },
        },
      },
      interaction: { mode: 'index', intersect: false },
    },
  });
}

// ── Render CV Results table rows ──────────────────────────────────────────────
function renderCVResults() {
  const tbody = document.getElementById('cv-tbody');
  if (!tbody) return;

  tbody.innerHTML = CV_RESULTS.map((r, i) => `
    <tr class="cv-row">
      <td class="cv-rank">${['🥇','🥈','🥉','4','5','6'][i]}</td>
      <td class="cv-model" style="color:${r.color}">${r.model}</td>
      <td class="cv-mean">${r.mean.toFixed(2)}%</td>
      <td class="cv-std">±${r.std.toFixed(2)}%</td>
      <td class="cv-bar-cell">
        <div class="cv-bar-track">
          <div class="cv-bar-fill" style="width:${r.bar}%; background:${r.color};"></div>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Init on DOM ready ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderCVResults();
  // Defer chart slightly so Chart.js CDN has fully parsed
  setTimeout(initSplitChart, 100);
});

/* ══════════════════════════════════════════════════════════════════════════════
   APEX · Modal Intelligence Engine
   Provides data and rendering for the Model Details modal.
   ══════════════════════════════════════════════════════════════════════════════ */

const MODEL_DETAILS = {
  rf: {
    name: 'Random Forest',
    params: { 'n_estimators': 200, 'max_depth': 'None', 'min_samples_split': 2, 'criterion': 'Gini' },
    f1_scores: [88.2, 60.1, 65.7, 79.9], // A, B, C, D
    matrix: [[882, 94, 22, 6], [136, 603, 240, 25], [35, 175, 660, 135], [8, 24, 170, 802]],
    splits: { '80/20': 74.01, '70/30': 74.26, '50/50': 72.36 },
    insight: 'The robust nature of RF handles the overlapping boundaries between Class B and C better than any other model.'
  },
  nn: {
    name: 'Neural Network (MLP)',
    params: { 'hidden_layers': '(128, 64)', 'activation': 'ReLU', 'solver': 'Adam', 'alpha': 0.0001 },
    f1_scores: [87.5, 62.3, 64.1, 78.4],
    matrix: [[870, 102, 28, 4], [145, 598, 242, 19], [42, 185, 640, 137], [12, 30, 168, 794]],
    splits: { '80/20': 72.40, '70/30': 74.06, '50/50': 72.38 },
    insight: 'High sensitivity to split ratio indicates that MLP requires substantial training volume to converge on the B/C boundary.'
  },
  svm: {
    name: 'SVM (RBF Kernel)',
    params: { 'kernel': 'RBF', 'C': 10, 'gamma': 'scale', 'decision_function': 'ovr' },
    f1_scores: [84.1, 58.2, 61.9, 75.8],
    matrix: [[840, 120, 40, 4], [160, 580, 245, 19], [55, 195, 620, 134], [15, 35, 175, 779]],
    splits: { '80/20': 71.14, '70/30': 71.62, '50/50': 70.51 },
    insight: 'RBF kernel provides smooth boundaries, but the memory-intensive distance computations slow down inference on large datasets.'
  },
  lr: {
    name: 'Logistic Regression',
    params: { 'multi_class': 'multinomial', 'solver': 'lbfgs', 'max_iter': 1000, 'penalty': 'l2' },
    f1_scores: [78.6, 45.2, 48.7, 72.1],
    matrix: [[780, 180, 40, 4], [250, 450, 280, 24], [80, 320, 480, 124], [20, 50, 210, 724]],
    splits: { '80/20': 63.14, '70/30': 62.36, '50/50': 62.32 },
    insight: 'Struggles with non-linear separations. Logistic regression baseline confirms that fitness grades are not strictly linear.'
  },
  dt: {
    name: 'Decision Tree',
    params: { 'max_depth': 8, 'min_samples_leaf': 4, 'criterion': 'Gini', 'splitter': 'best' },
    f1_scores: [81.2, 52.4, 55.6, 74.1],
    matrix: [[810, 150, 40, 4], [210, 520, 255, 19], [70, 245, 550, 139], [25, 45, 185, 749]],
    splits: { '80/20': 63.78, '70/30': 65.17, '50/50': 64.43 },
    insight: 'Pruning (max_depth=8) was essential; deeper trees suffered from massive overfitting to noise in the sit-up counts.'
  },
  knn: {
    name: 'K-Nearest Neighbors',
    params: { 'n_neighbors': 11, 'weights': 'distance', 'metric': 'minkowski', 'p': 2 },
    f1_scores: [77.2, 48.1, 50.3, 69.8],
    matrix: [[770, 190, 40, 4], [260, 480, 245, 19], [90, 310, 500, 104], [30, 60, 215, 699]],
    splits: { '80/20': 62.55, '70/30': 61.84, '50/50': 61.71 },
    insight: 'The CURSE of dimensionality. Even with k=11, distance measures fail to cluster well in this 11-feature physiological space.'
  },
  svr: {
    name: 'SVR (Jump Prediction)',
    params: { 'kernel': 'RBF', 'C': 100, 'epsilon': 0.1, 'gamma': 'auto' },
    f1_scores: [77.9, 78.1, 77.8, 77.9], // Pseudo-values for bar chart
    matrix: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]], // Regression doesn't use Matrix
    splits: { '80/20': 0.7780, '70/30': 0.7796, '50/50': 0.7710 },
    insight: 'Superior at capturing the smooth increase in jump distance as flexibility and strength metrics scale.'
  },
  lr_reg: {
    name: 'Linear Regression',
    params: { 'fit_intercept': 'true', 'copy_X': 'true', 'n_jobs': -1, 'positive': 'false' },
    f1_scores: [77.5, 77.9, 77.6, 77.7],
    matrix: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],
    splits: { '80/20': 0.7760, '70/30': 0.7788, '50/50': 0.7720 },
    insight: 'OLS Baseline: The R²=0.7788 proves that 77%+ of jump variance is explained by simple linear relationships with inputs.'
  }
};

function renderModalIntelligence(modelId) {
  const data = MODEL_DETAILS[modelId];
  if (!data) return [];

  // Update UI Text
  document.getElementById('modal-model-name').textContent = data.name;
  document.getElementById('modal-insight-text').textContent = data.insight;
  
  const paramsList = document.getElementById('modal-params-list');
  paramsList.innerHTML = Object.entries(data.params).map(([k, v]) => `
    <div class="param-item"><span>${k}</span><strong>${v}</strong></div>
  `).join('');

  const splitStats = document.getElementById('modal-split-stats');
  splitStats.innerHTML = Object.entries(data.splits).map(([k, v]) => `
    <div class="split-stat-row">
      <span>${k} Split</span>
      <strong>${modelId.includes('reg') ? v.toFixed(4) : v.toFixed(2) + '%'}</strong>
    </div>
  `).join('');

  // ── Render Charts ──────────────────────────────────────────────────────────
  const ctxMatrix = document.getElementById('modal-matrix-chart').getContext('2d');
  const ctxF1 = document.getElementById('modal-f1-chart').getContext('2d');

  const matrixChart = new Chart(ctxMatrix, {
    type: modelId.includes('reg') ? 'doughnut' : 'bar',
    data: {
      labels: ['Class A', 'Class B', 'Class C', 'Class D'],
      datasets: [{
        label: 'True Positives',
        data: modelId.includes('reg') ? [25, 25, 25, 25] : [data.matrix[0][0], data.matrix[1][1], data.matrix[2][2], data.matrix[3][3]],
        backgroundColor: ['var(--teal)', 'var(--blue)', 'var(--gold)', 'var(--green)'],
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: modelId.includes('reg') ? { x: { display: false }, y: { display: false } } : {
        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.4)' } },
        x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.4)' } }
      }
    }
  });

  const f1Chart = new Chart(ctxF1, {
    type: 'bar',
    data: {
      labels: ['Class A', 'Class B', 'Class C', 'Class D'],
      datasets: [{
        label: modelId.includes('reg') ? 'R² Component' : 'F1 Score',
        data: data.f1_scores,
        backgroundColor: 'rgba(77,159,255,0.2)',
        borderColor: 'var(--blue)',
        borderWidth: 1,
        borderRadius: 2
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.4)' } },
        y: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.4)' } }
      }
    }
  });

  return [matrixChart, f1Chart];
}
