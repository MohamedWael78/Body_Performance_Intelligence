/* ══════════════════════════════════════════════════════════════════════════════
   APEX · Radar Chart — Canvas Performance Profile
   ══════════════════════════════════════════════════════════════════════════════ */

function drawRadar(inputs, cls) {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2, cy = H / 2 + 10;
  const R = Math.min(W, H) * 0.36;

  const labels = ['Flexibility', 'Core', 'Explosive\nPower', 'Grip', 'Body\nComp', 'Cardio'];
  const normalize = v => Math.max(0, Math.min(1, v));

  const vals = [
    normalize((inputs.bend + 25) / 225),
    normalize(inputs.situps / 80),
    normalize((inputs.jump - 50) / 250),
    normalize(inputs.grip / 70),
    normalize(1 - (inputs.fat - 3) / 62),
    normalize(1 - Math.abs((inputs.systolic - 115) / 85)),
  ];

  const N = labels.length;
  const step = (Math.PI * 2) / N;
  const startAngle = -Math.PI / 2;

  const clsColors = { A: '#00e064', B: '#4d9fff', C: '#f0a500', D: '#ff4060' };
  const fillColor = clsColors[cls] || '#00e5c8';

  // Grid circles
  for (let r = 1; r <= 4; r++) {
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const a = startAngle + i * step;
      const rr = R * r / 4;
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#1e2d47';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Axes
  for (let i = 0; i < N; i++) {
    const a = startAngle + i * step;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.strokeStyle = '#1e2d47';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Data polygon
  ctx.beginPath();
  vals.forEach((v, i) => {
    const a = startAngle + i * step;
    const r = R * v;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = fillColor + '22';
  ctx.fill();
  ctx.strokeStyle = fillColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dots with glow
  vals.forEach((v, i) => {
    const a = startAngle + i * step;
    const r = R * v;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    // Glow
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = fillColor + '18';
    ctx.fill();
    // Dot
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
  });

  // Labels
  ctx.fillStyle = '#7a93b8';
  ctx.font = '10px "Space Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  labels.forEach((lbl, i) => {
    const a = startAngle + i * step;
    const offset = R + 22;
    const x = cx + Math.cos(a) * offset;
    const y = cy + Math.sin(a) * offset;
    const lines = lbl.split('\n');
    lines.forEach((line, li) => {
      ctx.fillText(line, x, y + li * 13 - (lines.length - 1) * 6.5);
    });
  });
}
