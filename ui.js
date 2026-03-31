/* ══════════════════════════════════════════════════════════════════════════════
   APEX · UI Controller — runPredict + DOM Updates
   ══════════════════════════════════════════════════════════════════════════════ */

async function runPredict() {
  const btn = document.querySelector('.predict-btn');
  btn.innerHTML = '<span class="spinner"></span> ANALYZING...';
  btn.disabled = true;

  try {
    const inputs = {
      age:       +document.getElementById('age').value,
      gender:    currentGender,
      height_cm: +document.getElementById('height').value,
      weight_kg: +document.getElementById('weight').value,
      body_fat_pct: +document.getElementById('fat').value,
      diastolic: +document.getElementById('diastolic').value,
      systolic:  +document.getElementById('systolic').value,
      gripForce: +document.getElementById('grip').value,
      sit_and_bend_forward_cm: +document.getElementById('bend').value,
      sit_ups_counts: +document.getElementById('situps').value,
      broad_jump_cm: +document.getElementById('jump').value,
    };

    // Validate BP
    if (inputs.systolic <= inputs.diastolic) {
      showToast('⚠ Systolic must exceed diastolic BP');
      btn.innerHTML = '⚡ ANALYZE PERFORMANCE';
      btn.disabled = false;
      return;
    }

    let cls, probs, jumpEst;
    try {
      // Phase 1 API integration
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      cls = data.predicted_class;
      probs = data.probabilities;
      jumpEst = data.predicted_broad_jump_cm;
    } catch (apiError) {
      console.warn("Backend API not reachable. Falling back to local JS model.", apiError);
      
      // Fallback to local JS stub functions
      const local = computeClass(inputs);
      cls = local.cls;
      probs = local.probs;
      jumpEst = estimateBroadJump(inputs);
    }

    // --- Update class card ---
    const card = document.getElementById('class-result-card');
    card.className = 'class-result-card class-' + cls;
    document.getElementById('placeholder-state').style.display = 'none';
    const body = document.getElementById('class-result-body');
    body.style.display = 'block';

    const badge = document.getElementById('class-badge');
    badge.className = 'class-badge-big ' + cls;
    badge.textContent = cls;

    document.getElementById('class-name').textContent = CLASS_INFO[cls].name;
    document.getElementById('class-desc').textContent = CLASS_INFO[cls].desc;

    // Prob bars
    ['A', 'B', 'C', 'D'].forEach(c => {
      const pct = Math.round(probs[c] * 100);
      document.getElementById('prob-' + c).style.width = pct + '%';
      document.getElementById('pct-' + c).textContent = pct + '%';
    });

    // Dual Regression Estimate
    const jumpEstRF = estimateBroadJump(inputs);
    const jumpEstLR = estimateJumpLR(inputs);

    // Age & Gender Adjusted Benchmark
    let baseJump = 260 - (inputs.age - 20) * 1.5;
    if (inputs.gender === 'F') baseJump -= 45;
    const benchMsg = `Age/Gender Benchmark (A-tier): ~${Math.max(100, Math.round(baseJump))} cm`;
    
    document.getElementById('jump-pred').innerHTML = jumpEstRF + ' <span class="unit">cm</span>';
    document.getElementById('jump-pred-lr').innerHTML = jumpEstLR + ' <span class="unit">cm</span>';
    document.getElementById('jump-bench').textContent = benchMsg;

    // Radar mapping for chart (requires original names)
    const radarInputs = {
      bend: inputs.sit_and_bend_forward_cm,
      situps: inputs.sit_ups_counts,
      jump: inputs.broad_jump_cm,
      grip: inputs.gripForce,
      fat: inputs.body_fat_pct,
      systolic: inputs.systolic
    };
    drawRadar(radarInputs, cls);

    // ── Professional Personalized Insights Engine ──
    const insights = generatePersonalizedInsights(inputs, cls, jumpEstRF);
    const tipsList = document.getElementById('tips-list');
    tipsList.innerHTML = '';
    insights.forEach((insight, i) => {
      const div = document.createElement('div');
      div.className = 'tip-item tip-animate';
      div.style.animationDelay = (i * 0.15) + 's';
      div.innerHTML = `<span class="tip-icon">${insight.icon}</span><span><strong style="color:var(--white)">${insight.title}:</strong> ${insight.text}</span>`;
      tipsList.appendChild(div);
    });

    // ── Exercise Plan Engine ──
    renderExercisePlan(cls);

    // Save to History (LocalStorage)
    if(typeof saveToHistory === 'function') {
      saveToHistory(inputs, cls, probs, jumpEst);
    }

    btn.innerHTML = '✓ ANALYSIS COMPLETE';
    btn.style.background = 'linear-gradient(135deg, var(--green), #009948)';
    showToast('✓ Performance Class ' + cls + ' · ' + jumpEstRF + ' cm jump');

    setTimeout(() => {
      btn.innerHTML = '⚡ ANALYZE PERFORMANCE';
      btn.style.background = '';
      btn.disabled = false;
    }, 2400);

  } catch (err) {
    showToast('⚠ API Error: ' + err.message);
    btn.innerHTML = '⚡ ANALYZE PERFORMANCE';
    btn.disabled = false;
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   APEX · Personalized Insights Engine
   Generates 4 professional, actionable insights based on user inputs & class.
   ══════════════════════════════════════════════════════════════════════════════ */

function generatePersonalizedInsights(inputs, cls, jumpEst) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const norm = (v, lo, hi) => clamp((v - lo) / (hi - lo), 0, 1);

  // ── Dataset-derived benchmarks ────────────────────────────────────────────
  const bmi = inputs.weight_kg / Math.pow(inputs.height_cm / 100, 2);
  const bmiCat = bmi < 18.5 ? 'underweight' : bmi < 25 ? 'normal' : bmi < 30 ? 'overweight' : 'obese';

  // Normalized feature scores (0 = worst, 1 = best)
  const scores = {
    flexibility:  norm(inputs.sit_and_bend_forward_cm, -25, 200),
    core:         norm(inputs.sit_ups_counts, 0, 80),
    explosive:    norm(inputs.broad_jump_cm, 50, 300),
    grip:         norm(inputs.gripForce, 0, 70),
    bodyComp:     norm(65 - inputs.body_fat_pct, 0, 62),   // inverted: lower fat = higher score
    cardio:       norm(130 - Math.abs(inputs.systolic - 115), 0, 130),
  };

  // Sort features by weakness
  const ranked = Object.entries(scores)
    .map(([k, v]) => ({ key: k, score: v }))
    .sort((a, b) => a.score - b.score);

  const weakest = ranked[0];
  const secondWeakest = ranked[1];
  const strongest = ranked[ranked.length - 1];

  const insights = [];

  // ── Insight 1: Primary Focus Area (weakest feature) ────────────────────
  const focusMap = {
    flexibility: {
      icon: '🧘',
      title: 'Flexibility Development',
      text: `Your sit-and-bend score of ${inputs.sit_and_bend_forward_cm} cm is ${inputs.sit_and_bend_forward_cm < 15 ? 'below the dataset median of 19.2 cm' : 'within an improvable range'}. As the single most influential predictor of performance class (permutation importance: 0.258), dedicating 10–15 minutes daily to dynamic stretching and yoga-based flexibility drills can yield significant classification improvement.`
    },
    core: {
      icon: '💪',
      title: 'Core Endurance Strategy',
      text: `With ${inputs.sit_ups_counts} sit-ups recorded, ${inputs.sit_ups_counts < 35 ? 'you fall below the dataset average of 35 reps' : 'there is still room for meaningful progression'}. Core endurance is the second-highest predictor of performance class. Consider a progressive overload programme adding 2–3 reps per week to drive measurable tier advancement.`
    },
    explosive: {
      icon: '🏃',
      title: 'Explosive Power Training',
      text: `Your broad jump input of ${inputs.broad_jump_cm} cm ${inputs.broad_jump_cm < 144 ? 'sits below the population mean of 143.6 cm' : 'shows a solid foundation'}. Incorporating plyometric box jumps, depth jumps, and unilateral leg exercises 2–3 times per week will enhance neuromuscular power output and improve your predicted jump distance of ${jumpEst} cm.`
    },
    grip: {
      icon: '🤝',
      title: 'Grip Strength Enhancement',
      text: `Your grip force of ${inputs.gripForce} kg ${inputs.gripForce < 37 ? 'falls below the dataset average of 36.8 kg' : 'is within a competitive range, though targetable'}. Grip strength is a reliable proxy for total-body muscular capacity. Integrate farmer carries, dead hangs, and wrist curl progressions into your routine to bolster this critical metric.`
    },
    bodyComp: {
      icon: '⚖️',
      title: 'Body Composition Optimization',
      text: `At ${inputs.body_fat_pct}% body fat (BMI: ${bmi.toFixed(1)}, classified as ${bmiCat}), ${inputs.body_fat_pct > 24 ? 'reducing body fat is your highest-impact lever for class improvement' : 'your body composition is manageable, but fine-tuning can further optimize performance'}. Body fat percentage is the strongest negative predictor in the model. A modest caloric deficit paired with resistance training can drive meaningful improvements.`
    },
    cardio: {
      icon: '❤️',
      title: 'Cardiovascular Conditioning',
      text: `Your systolic blood pressure of ${inputs.systolic} mmHg ${inputs.systolic > 130 ? 'is elevated above the healthy threshold' : 'is within a manageable range'}. While cardiovascular metrics have lower model importance, sustained zone-2 aerobic training (3–4 sessions per week) supports recovery, reduces resting BP, and creates a foundation for all other performance gains.`
    }
  };

  const primaryFocus = focusMap[weakest.key];
  insights.push(primaryFocus);

  // ── Insight 2: Class-Specific Strategic Recommendation ─────────────────
  const classStrategy = {
    A: {
      icon: '🔥',
      title: 'Elite Maintenance Protocol',
      text: `As a Class A performer, your focus should shift from development to preservation and periodisation. Implement deload weeks every 4–6 weeks, prioritise mobility and injury prevention, and consider sport-specific specialisation to maintain your elite positioning across all evaluated dimensions.`
    },
    B: {
      icon: '📈',
      title: 'Path to Elite Tier',
      text: `You are positioned in the above-average bracket, which means targeted improvements in your weakest area — ${focusMap[weakest.key].title.toLowerCase()} — can realistically push you into Class A. Establish a structured 8-week progressive programme with measurable weekly benchmarks to close this gap efficiently.`
    },
    C: {
      icon: '🎯',
      title: 'Structured Improvement Plan',
      text: `Class C indicates a balanced but underdeveloped profile. Your strongest attribute is ${strongest.key === 'bodyComp' ? 'body composition' : strongest.key} — leverage this as a motivational anchor while systematically addressing ${focusMap[weakest.key].title.toLowerCase()} and ${focusMap[secondWeakest.key].title.toLowerCase()} through a disciplined training schedule of at least 4 sessions per week.`
    },
    D: {
      icon: '🚀',
      title: 'Foundation Building Programme',
      text: `Class D represents an opportunity for rapid, visible improvement. Begin with 3 full-body compound sessions per week focused on progressive overload. Our model shows that even modest gains in flexibility (+5 cm) and sit-ups (+8 reps) can shift class predictions significantly — making early progress both achievable and rewarding.`
    }
  };
  insights.push(classStrategy[cls]);

  // ── Insight 3: Age & Gender Contextual Analysis ────────────────────────
  const ageContext = inputs.age < 25
    ? `At ${inputs.age} years old, you possess a significant physiological advantage in recovery capacity and neuromuscular adaptability.`
    : inputs.age < 40
    ? `At ${inputs.age}, you are within the peak performance window where consistent training yields the highest return on investment.`
    : inputs.age < 55
    ? `At ${inputs.age}, age-related decline in explosive power can be offset through targeted resistance training and flexibility work.`
    : `At ${inputs.age}, prioritising joint health, flexibility, and functional strength will maximise your quality of performance and longevity.`;

  const genderContext = inputs.gender === 'M'
    ? `Male participants in the dataset average 40.3 kg grip force and 37 sit-ups — ${inputs.gripForce >= 40 ? 'your grip strength meets or exceeds this benchmark' : 'targeted grip training can help you reach this benchmark'}.`
    : `Female participants in the dataset average 24.5 kg grip force and 33 sit-ups — ${inputs.gripForce >= 24.5 ? 'your grip strength meets or exceeds this benchmark, which is commendable' : 'focused upper-body and grip training can help bridge this gap'}.`;

  insights.push({
    icon: '👤',
    title: 'Demographic Performance Context',
    text: `${ageContext} ${genderContext}`
  });

  // ── Insight 4: Predictive Jump Analysis ────────────────────────────────
  let jumpBenchmark = { A: 230, B: 180, C: 148, D: 100 };
  const targetJump = jumpBenchmark[cls === 'D' ? 'C' : cls === 'C' ? 'B' : cls === 'B' ? 'A' : 'A'];
  const jumpGap = targetJump - jumpEst;

  insights.push({
    icon: '🏋️',
    title: 'Broad Jump Performance Analysis',
    text: jumpGap > 0
      ? `Your estimated broad jump of ${jumpEst} cm is ${jumpGap} cm below the next-tier benchmark of ~${targetJump} cm. The Random Forest regressor (R² = 0.7842, RMSE = 18.57 cm) indicates that improvements in sit-ups, grip force, and flexibility have the strongest positive impact on jump distance prediction. A structured plyometric programme can help close this gap.`
      : `Your estimated broad jump of ${jumpEst} cm meets or exceeds the benchmark for the next performance tier (~${targetJump} cm). This is an excellent indicator of explosive lower-body power. Continue to maintain this with regular jump-specific training and ensure adequate recovery between high-intensity sessions.`
  });

  return insights;
}

/* ══════════════════════════════════════════════════════════════════════════════
   APEX · Exercise Plan Engine
   Renders a structured 5-section training plan based on performance class.
   ══════════════════════════════════════════════════════════════════════════════ */

function renderExercisePlan(cls) {
  const plan = getExercisePlanData(cls);
  const card = document.getElementById('exercise-plan-card');
  const tag = document.getElementById('plan-class-tag');

  tag.textContent = cls;
  tag.className = 'class-tag ' + cls;

  document.querySelector('#plan-warmup .ps-content').innerHTML = `<ul>${plan.warmup.map(item => `<li>${item}</li>`).join('')}</ul>`;
  document.querySelector('#plan-main .ps-content').innerHTML = `<ul>${plan.main.map(item => `<li>${item}</li>`).join('')}</ul>`;
  document.querySelector('#plan-cooldown .ps-content').innerHTML = `<ul>${plan.cooldown.map(item => `<li>${item}</li>`).join('')}</ul>`;
  document.querySelector('#plan-schedule .ps-content').innerHTML = plan.schedule;
  document.querySelector('#plan-tip .ps-content').innerHTML = plan.tip;

  card.style.display = 'block';
}

function getExercisePlanData(cls) {
  const plans = {
    A: {
      warmup: [
        "10 min Dynamic stretching (Leg swings, Arm circles)",
        "5 min Light jogging with high knees",
        "3 sets of 10 Burpees to activate CNS"
      ],
      main: [
        "High-Intensity Interval Training (HIIT): 40s Work / 20s Rest",
        "Plyometric Circuit: Box Jumps, Depth Jumps, Broad Jumps (4 sets)",
        "Compound Lifts: Squats & Deadlifts @ 85% 1RM (5x5)",
        "Core: Weighted Planks and Hanging Leg Raises"
      ],
      cooldown: [
        "10 min Static stretching (Focus on Hip Flexors)",
        "Foam rolling: Hamstrings and Quads",
        "Diaphragmatic breathing (2 mins)"
      ],
      schedule: "<strong>Elite Periodisation:</strong> 5 days ON, 2 days OFF. Cycle intensity: 3 weeks Heavy, 1 week Deload.",
      tip: "<strong>Peak Maintenance:</strong> Prioritize neuro-recovery. Since your broad jump is elite, focus on unilateral stability to prevent injuries."
    },
    B: {
      warmup: [
        "8 min Dynamic stretching (Focused on lower back & hips)",
        "5 min Jump rope at moderate pace",
        "2 sets of 15 air squats"
      ],
      main: [
        "Functional Strength: Pull-ups, Push-ups, Dips (3 sets to failure)",
        "Moderate Plyometrics: Tuck jumps and Lateral bounds",
        "Endurance: 400m repeats x 5 (80% effort)",
        "Core: Russian twists and Mountain climbers"
      ],
      cooldown: [
        "8 min Full-body stretching",
        "Active mobility: Cat-Cow and Pigeon stretch",
        "Hydration: 500ml electrolyte mix"
      ],
      schedule: "<strong>Strength Focus:</strong> 4 days ON, 3 days OFF. Focus on sit-up volume and grip strength 2x per week.",
      tip: "<strong>The Jump Gap:</strong> Your explosive power is high. Focus on flexibility (sit-and-bend) to unlock more range of motion for your jump."
    },
    C: {
      warmup: [
        "10 min Brisk walk or light jog",
        "Joint rotations: Wrists, Ankles, Shoulders",
        "Arm swings and torso twists"
      ],
      main: [
        "Circuit Training: 3 rounds (20 reps each)",
        "Bodyweight Squats, Lunges, Knee Push-ups",
        "Sit-ups: 3 sets of 15 (Focus on form over speed)",
        "Cardio: 20 min steady-state jogging (Zone 2)"
      ],
      cooldown: [
        "10 min Static stretching (All major groups)",
        "Seated forward fold (Hold 30s x 3)",
        "Mindful meditation (3 mins)"
      ],
      schedule: "<strong>Consistency Rule:</strong> 3-4 days per week. Avoid skipping more than 2 days in a row.",
      tip: "<strong>Metric Wins:</strong> The model highlights your grip force as a lever. Use farmer's carries twice a week to boost this predictor."
    },
    D: {
      warmup: [
        "10 min Very light walking",
        "Dynamic mobility: Wall slides and shoulder rolls",
        "Leg swings (Hold onto a chair for balance)"
      ],
      main: [
        "Foundation Build: Seated leg extensions & curls",
        "Assisted squats (using a bench or chair)",
        "Wall push-ups: 3 sets of 10",
        "Core: Deadbugs and Bird-dogs (3 sets of 8)"
      ],
      cooldown: [
        "12 min Gentle stretching",
        "Calf stretches and neck rolls",
        "Hydration and post-workout protein"
      ],
      schedule: "<strong>Foundation Builder:</strong> 3 days ON, 4 days OFF (Recovery focus). Include daily 15-min mobility.",
      tip: "<strong>Body Comp Focus:</strong> Nutrition is your highest impact lever. Focus on consistent movement and calorie tracking to improve your class classification."
    }
  };
  return plans[cls];
}

/* ══════════════════════════════════════════════════════════════════════════════
   APEX · Sub-tab & Modal Logic
   ══════════════════════════════════════════════════════════════════════════════ */

function switchReportTab(tabId) {
  // Update Buttons
  document.querySelectorAll('.report-tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('onclick').includes(tabId)) btn.classList.add('active');
  });

  // Update Content
  document.querySelectorAll('.report-content-pane').forEach(pane => {
    pane.classList.remove('active');
  });
  const activePane = document.getElementById('report-' + tabId);
  activePane.classList.add('active');

  // Lazy Load Iframe
  const iframe = activePane.querySelector('iframe');
  if (iframe && !iframe.src) {
    iframe.src = iframe.getAttribute('data-src');
  }
}

function hideSkeleton(iframe) {
  const loader = iframe.previousElementSibling;
  if (loader && loader.classList.contains('skeleton-loader')) {
    loader.style.opacity = '0';
    setTimeout(() => loader.style.display = 'none', 300);
  }
}

function expandViewer(frameId) {
  const frame = document.getElementById(frameId);
  if (frame.requestFullscreen) {
    frame.requestFullscreen();
  } else if (frame.webkitRequestFullscreen) { /* Safari */
    frame.webkitRequestFullscreen();
  } else if (frame.msRequestFullscreen) { /* IE11 */
    frame.msRequestFullscreen();
  }
}

// Model Modal logic
let modalCharts = [];

function openModelModal(modelId) {
  const modal = document.getElementById('details-modal');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('open'), 10);

  // Clear previous charts
  modalCharts.forEach(c => c.destroy());
  modalCharts = [];

  // Data mapping can be in charts.js, we call a helper
  if (typeof renderModalIntelligence === 'function') {
    const charts = renderModalIntelligence(modelId);
    modalCharts = charts;
  }
}

function closeModelModal() {
  const modal = document.getElementById('details-modal');
  modal.classList.remove('open');
  setTimeout(() => {
    modal.style.display = 'none';
    modalCharts.forEach(c => c.destroy());
    modalCharts = [];
  }, 400);
}

// Close on ESC or Backdrop
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModelModal();
});
document.getElementById('details-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('details-modal')) closeModelModal();
});
