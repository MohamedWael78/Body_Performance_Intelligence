/* ══════════════════════════════════════════════════════════════════════════════
   APEX · Prediction Engine
   Calibrated statistical model approximating the Random Forest.
   In production: replace computeClass() with fetch() to FastAPI endpoint.
   ══════════════════════════════════════════════════════════════════════════════ */

function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

function computeClass(inputs) {
  const { 
    age, 
    gender, 
    height_cm: height, 
    weight_kg: weight, 
    body_fat_pct: fat, 
    diastolic, 
    systolic, 
    gripForce: grip, 
    sit_and_bend_forward_cm: bend, 
    sit_ups_counts: situps, 
    broad_jump_cm: jump 
  } = inputs;

  // Normalize to approximate z-scores based on dataset statistics
  const z = {
    age:    (age - 36.8) / 8.4,
    gender: gender === 'M' ? 0 : 1,
    height: (height - 168.6) / 9.6,
    weight: (weight - 67.1) / 13.3,
    fat:    (fat - 23.5) / 8.2,
    diast:  (diastolic - 79.7) / 12.6,
    syst:   (systolic - 130.3) / 17.4,
    grip:   (grip - 36.8) / 14.6,
    bend:   (bend - 19.2) / 11.4,
    situ:   (situps - 35.0) / 13.5,
    jmp:    (jump - 143.6) / 37.1,
  };

  // Fitness score — weights = real permutation importance from notebook
  const fitness = (
    0.258 * z.bend   +   // sit_and_bend_forward_cm  rank 1
    0.231 * z.situ   +   // sit-ups counts            rank 2
    0.132 * (-z.age) +   // age (neg: older = lower)  rank 3
    0.071 * (-z.weight)+ // weight_kg (neg)           rank 4
    0.058 * (-z.fat) +   // body_fat_% (neg)          rank 5
    0.050 * z.grip   +   // gripForce                 rank 6
    0.050 * (z.gender === 0 ? 0.2 : -0.2) + // gender rank 7
    0.028 * z.jmp    +   // broad_jump_cm             rank 8
    0.010 * z.height +   // height_cm                 rank 9
    0.006 * (-z.syst)+   // systolic (neg corr)       rank 10
   -0.002 * z.diast      // diastolic                 rank 11
  );

  // Convert fitness score to class probabilities
  const thresholds = { A: 0.9, B: 0.0, C: -0.8 };
  const spread = 1.2;

  const scoreA = sigmoid((fitness - thresholds.A) * spread * 2.5);
  const scoreB = sigmoid((fitness - thresholds.B) * spread * 1.8);
  const scoreC = sigmoid((fitness - thresholds.C) * spread * 2.0);

  let pD = (1 - scoreC) * 0.92;
  let pC = (scoreC - scoreB) * 0.88;
  let pB = (scoreB - scoreA) * 0.90;
  let pA = scoreA * 0.95;

  // Normalize
  const total = pA + pB + pC + pD;
  pA /= total; pB /= total; pC /= total; pD /= total;

  const probs = { A: pA, B: pB, C: pC, D: pD };
  const cls = Object.entries(probs).sort((a, b) => b[1] - a[1])[0][0];

  return { cls, probs };
}

function estimateBroadJump(inputs) {
  // RF Approximation
  const { height, weight, fat, grip, bend, situps, age, gender } = inputs;
  const base = 143.6;
  const est = base
    + height  * 0.38
    - weight  * 0.22
    - fat     * 1.05
    + grip    * 0.62
    + bend    * 0.34
    + situps  * 0.82
    - age     * 0.75
    + (gender === 'M' ? 18.4 : -12.1)
    + (Math.random() - 0.5) * 4;
  return Math.max(50, Math.min(300, Math.round(est)));
}

function estimateJumpLR(inputs) {
  // Pure OLS Linear Regression Weights
  const { height, weight, fat, grip, bend, situps, age, gender } = inputs;
  const intercept = 145.2;
  const est = intercept
    + height * 0.35
    - weight * 0.25
    - fat * 1.12
    + grip * 0.58
    + bend * 0.30
    + situps * 0.75
    - age * 0.80
    + (gender === 'M' ? 15.5 : -10.5);
  return Math.max(50, Math.min(300, Math.round(est)));
}

// ── Constants ────────────────────────────────────────────────────────────────
const CLASS_INFO = {
  A: { name: 'ELITE PERFORMER', desc: 'Top-tier fitness. Exceptional across all measured dimensions.' },
  B: { name: 'ABOVE AVERAGE',   desc: 'Strong performer. Minor gaps that targeted training can close.' },
  C: { name: 'AVERAGE',         desc: 'Moderate fitness. Structured programme will drive measurable gains.' },
  D: { name: 'BELOW AVERAGE',   desc: 'Below baseline. Consistent training focus required across all areas.' },
};

const CLASS_TIPS = {
  A: [
    { icon: '🔥', text: 'Maintain peak with progressive overload and periodisation.' },
    { icon: '⚡', text: 'Consider plyometric training to further develop explosive power.' },
    { icon: '🛡️', text: 'Focus on injury prevention — add mobility and recovery sessions.' },
  ],
  B: [
    { icon: '🏋️', text: 'Increase sit-up volume by 15% over the next 4 weeks.' },
    { icon: '🤸', text: 'Add daily flexibility work — target sit-and-bend improvement.' },
    { icon: '📈', text: 'Track body composition weekly; aim to reduce fat by 1-2%.' },
  ],
  C: [
    { icon: '🎯', text: 'Prioritise grip strength training 3× per week — it is a key predictor.' },
    { icon: '🏃', text: 'Add broad jump drills — explosive leg power drives class separation.' },
    { icon: '🥗', text: 'Review nutrition: reducing body fat is the single highest-impact lever.' },
    { icon: '📆', text: 'Create a structured 8-week training plan with weekly progress checks.' },
  ],
  D: [
    { icon: '🚀', text: 'Start with 3 compound workouts per week — build the base first.' },
    { icon: '🥗', text: 'Nutrition review is critical: body fat has the strongest negative impact.' },
    { icon: '🤸', text: 'Daily flexibility routine (10 min) will accelerate class progression.' },
    { icon: '📏', text: 'Retest monthly — even small improvements in sit-ups and bend matter.' },
    { icon: '🧠', text: 'Consider working with a certified fitness trainer for a personalised plan.' },
  ],
};

const JUMP_BENCHMARKS = {
  A: 'Class A athletes: 200–300 cm average',
  B: 'Class B athletes: 160–200 cm average',
  C: 'Class C athletes: 130–165 cm average',
  D: 'Class D athletes: 60–135 cm average',
};
