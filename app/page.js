'use client';

import { useEffect, useMemo, useState } from 'react';

const defaultChecklist = {
  coffee: false,
  eggs: false,
  electrolytes1: false,
  steakLunch: false,
  steakDinner: false,
  electrolytes2: false,
  mackerel: false,
  workout: false,
};

const targetWeights = [
  { week: 0, weight: 255 },
  { week: 2, weight: 245 },
  { week: 4, weight: 238 },
  { week: 6, weight: 230 },
  { week: 8, weight: 222 },
  { week: 10, weight: 215 },
  { week: 12, weight: 208 },
  { week: 16, weight: 195 },
  { week: 20, weight: 185 },
];

const milestones = [245, 225, 205, 190, 185];

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function interpolateGoal(currentWeek) {
  for (let i = 0; i < targetWeights.length - 1; i++) {
    const a = targetWeights[i];
    const b = targetWeights[i + 1];
    if (currentWeek >= a.week && currentWeek <= b.week) {
      const t = (currentWeek - a.week) / (b.week - a.week);
      return +(a.weight + (b.weight - a.weight) * t).toFixed(1);
    }
  }
  return 185;
}

function daysBetween(a, b) {
  const ms = 1000 * 60 * 60 * 24;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / ms);
}

function addDays(dateString, days) {
  const d = new Date(dateString);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function slopePerDay(history) {
  const rows = history
    .filter((h) => typeof h.weight === 'number' && !Number.isNaN(h.weight))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (rows.length < 2) return null;

  const firstDate = rows[0].date;
  const xs = rows.map((r) => daysBetween(firstDate, r.date));
  const ys = rows.map((r) => r.weight);

  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
  const sumXX = xs.reduce((acc, x) => acc + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;
  return (n * sumXY - sumX * sumY) / denom;
}

function prettyDate(dateString) {
  return new Date(dateString + 'T12:00:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    padding: '16px',
    fontFamily: 'Arial, sans-serif',
    color: '#0f172a',
  },
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
  },
  title: {
    fontSize: '32px',
    fontWeight: 800,
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#475569',
    marginBottom: '20px',
  },
  grid: {
    display: 'grid',
    gap: '16px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    marginBottom: '6px',
    fontWeight: 600,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    marginBottom: '12px',
    boxSizing: 'border-box',
  },
  buttonRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  button: {
    padding: '10px 14px',
    borderRadius: '12px',
    border: 'none',
    background: '#0f172a',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 700,
  },
  buttonSecondary: {
    padding: '10px 14px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#0f172a',
    cursor: 'pointer',
    fontWeight: 700,
  },
  stat: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '14px',
  },
  badge: {
    background: '#e2e8f0',
    borderRadius: '999px',
    padding: '4px 10px',
    fontWeight: 700,
    fontSize: '12px',
  },
  progressWrap: {
    background: '#e2e8f0',
    borderRadius: '999px',
    overflow: 'hidden',
    height: '12px',
    marginTop: '8px',
  },
  progressBar: (progress) => ({
    width: `${progress}%`,
    height: '100%',
    background: '#0f172a',
  }),
  checklistRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    marginBottom: '10px',
    background: '#fff',
  },
  small: {
    fontSize: '13px',
    color: '#475569',
  },
  statusBox: {
    background: '#f1f5f9',
    borderRadius: '12px',
    padding: '12px',
    fontWeight: 700,
    textAlign: 'center',
  },
  noteBox: {
    width: '100%',
    minHeight: '90px',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    boxSizing: 'border-box',
  },
  milestoneGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
    gap: '10px',
  },
  milestone: (hit) => ({
    border: '1px solid #cbd5e1',
    borderRadius: '12px',
    padding: '14px',
    textAlign: 'center',
    background: hit ? '#0f172a' : '#fff',
    color: hit ? '#fff' : '#0f172a',
    fontWeight: 700,
  }),
  savedDay: {
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '12px',
    background: '#fff',
  },
};

export default function Page() {
  const todayKey = getTodayKey();

  const [startDate, setStartDate] = useState(() => localStorage.getItem('fls-start-date') || todayKey);
  const [weight, setWeight] = useState(() => localStorage.getItem(`fls-weight-${todayKey}`) || '');
  const [checklist, setChecklist] = useState(() => {
    const saved = localStorage.getItem(`fls-checklist-${todayKey}`);
    return saved ? JSON.parse(saved) : defaultChecklist;
  });
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('fls-history');
    return saved ? JSON.parse(saved) : [];
  });
  const [energy, setEnergy] = useState(() => localStorage.getItem(`fls-energy-${todayKey}`) || 'good');
  const [strength, setStrength] = useState(() => localStorage.getItem(`fls-strength-${todayKey}`) || 'stable');
  const [notes, setNotes] = useState(() => localStorage.getItem(`fls-notes-${todayKey}`) || '');

  useEffect(() => {
    localStorage.setItem('fls-start-date', startDate);
  }, [startDate]);

  useEffect(() => {
    localStorage.setItem(`fls-checklist-${todayKey}`, JSON.stringify(checklist));
  }, [checklist, todayKey]);

  useEffect(() => {
    localStorage.setItem(`fls-weight-${todayKey}`, weight);
  }, [weight, todayKey]);

  useEffect(() => {
    localStorage.setItem(`fls-energy-${todayKey}`, energy);
  }, [energy, todayKey]);

  useEffect(() => {
    localStorage.setItem(`fls-strength-${todayKey}`, strength);
  }, [strength, todayKey]);

  useEffect(() => {
    localStorage.setItem(`fls-notes-${todayKey}`, notes);
  }, [notes, todayKey]);

  useEffect(() => {
    localStorage.setItem('fls-history', JSON.stringify(history));
  }, [history]);

  const totalItems = Object.keys(checklist).length;
  const completed = Object.values(checklist).filter(Boolean).length;
  const progress = Math.round((completed / totalItems) * 100);
  const allDone = completed === totalItems;

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => a.date.localeCompare(b.date)),
    [history]
  );

  const streak = useMemo(() => {
    let current = 0;
    for (let i = sortedHistory.length - 1; i >= 0; i--) {
      if (sortedHistory[i].allDone) current += 1;
      else break;
    }
    return current;
  }, [sortedHistory]);

  const weeksElapsed = useMemo(() => {
    const start = new Date(startDate);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    return Math.max(0, diffMs / (1000 * 60 * 60 * 24 * 7));
  }, [startDate]);

  const currentGoal = interpolateGoal(weeksElapsed);
  const numericWeight = weight ? Number(weight) : null;
  const toGoal = numericWeight ? (numericWeight - 185).toFixed(1) : '--';
  const deltaVsPlan = numericWeight ? (numericWeight - currentGoal).toFixed(1) : '--';

  const weightRows = useMemo(
    () => sortedHistory.filter((h) => typeof h.weight === 'number' && !Number.isNaN(h.weight)),
    [sortedHistory]
  );

  const latestWeight = weightRows.length ? weightRows[weightRows.length - 1].weight : null;
  const firstWeight = weightRows.length ? weightRows[0].weight : null;
  const totalLost = latestWeight != null && firstWeight != null ? +(firstWeight - latestWeight).toFixed(1) : null;
  const trend = slopePerDay(weightRows);
  const weeklyRate = trend != null ? +(-trend * 7).toFixed(2) : null;

  const projectedGoalDate = useMemo(() => {
    if (trend == null || trend >= 0 || latestWeight == null) return null;
    const daysNeeded = Math.ceil((latestWeight - 185) / Math.abs(trend));
    if (daysNeeded < 0 || !Number.isFinite(daysNeeded)) return null;
    return addDays(weightRows[weightRows.length - 1].date, daysNeeded);
  }, [trend, latestWeight, weightRows]);

  const nextMilestone = useMemo(() => {
    const current = numericWeight ?? latestWeight ?? 255;
    return milestones.find((m) => current > m) ?? 185;
  }, [numericWeight, latestWeight]);

  const smartStatus = useMemo(() => {
    if (!numericWeight) return 'Enter your weight and face the truth.';
    const delta = numericWeight - currentGoal;
    if (delta <= -2) return '🔥 Crushing it';
    if (delta <= 2) return '✅ No excuses';
    return '⚠️ Stop slipping';
  }, [numericWeight, currentGoal]);

  const weeklyChange = useMemo(() => {
    if (weightRows.length < 2) return null;
    const last = weightRows[weightRows.length - 1];
    const prior = [...weightRows]
      .reverse()
      .find((r) => daysBetween(r.date, last.date) >= 7);
    if (!prior) return null;
    return +(prior.weight - last.weight).toFixed(1);
  }, [weightRows]);

  const coachAdvice = useMemo(() => {
    if (energy === 'low') return 'Energy is low. Fix sodium first. Stop looking for excuses.';
    if (strength === 'down') return 'Strength is down. Tighten up protein or add a little fuel around training.';
    if (weeklyRate != null && weeklyRate < 1) return 'Fat loss is slow. Pull back a little added fat and get serious.';
    if (weeklyRate != null && weeklyRate > 4) return 'Loss is very fast. Add a little fat so you do not burn out.';
    return 'Stick to the plan. No whining. No random changes.';
  }, [energy, strength, weeklyRate]);

  const saveDay = () => {
    const entry = {
      date: todayKey,
      weight: numericWeight,
      score: completed,
      allDone,
      progress,
      energy,
      strength,
      notes,
    };
    const withoutToday = history.filter((h) => h.date !== todayKey);
    setHistory([...withoutToday, entry]);
  };

  const toggle = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetToday = () => {
    setChecklist(defaultChecklist);
    setWeight('');
    setEnergy('good');
    setStrength('stable');
    setNotes('');
  };

  const items = [
    { key: 'coffee', label: '8 AM Coffee' },
    { key: 'eggs', label: '10 AM Eggs' },
    { key: 'electrolytes1', label: 'Midday Electrolytes' },
    { key: 'steakLunch', label: '2 PM Sirloin' },
    { key: 'steakDinner', label: 'Dinner Sirloin' },
    { key: 'electrolytes2', label: 'Evening Electrolytes' },
    { key: 'mackerel', label: '8 PM Mackerel' },
    { key: 'workout', label: 'Workout' },
  ];

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.title}>Don’t be a pussy</div>
        <div style={styles.subtitle}>Aggressive fat loss tracker and daily accountability app.</div>

        <div style={{ ...styles.grid, marginBottom: '16px' }}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Daily setup</div>

            <label style={styles.label}>Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={styles.input}
            />

            <label style={styles.label}>Today’s weight</label>
            <input
              type="number"
              placeholder="255"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              style={styles.input}
            />

            <label style={styles.label}>Energy</label>
            <select value={energy} onChange={(e) => setEnergy(e.target.value)} style={styles.input}>
              <option value="great">Great</option>
              <option value="good">Good</option>
              <option value="low">Low</option>
            </select>

            <label style={styles.label}>Strength</label>
            <select value={strength} onChange={(e) => setStrength(e.target.value)} style={styles.input}>
              <option value="up">Up</option>
              <option value="stable">Stable</option>
              <option value="down">Down</option>
            </select>

            <div style={styles.buttonRow}>
              <button style={styles.button} onClick={saveDay}>Save today</button>
              <button style={styles.buttonSecondary} onClick={resetToday}>Reset today</button>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={styles.small}>Daily completion: {progress}%</div>
              <div style={styles.progressWrap}>
                <div style={styles.progressBar(progress)} />
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Live status</div>
            <div style={styles.stat}><span>Score</span><span style={styles.badge}>{completed}/8</span></div>
            <div style={styles.stat}><span>Streak</span><span style={styles.badge}>{streak} days</span></div>
            <div style={styles.stat}><span>To 185</span><span style={styles.badge}>{toGoal} lbs</span></div>
            <div style={styles.stat}><span>Next milestone</span><span style={styles.badge}>{nextMilestone}</span></div>
            <div style={styles.statusBox}>{smartStatus}</div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Prediction engine</div>
            <div style={styles.stat}><span>Weekly rate</span><strong>{weeklyRate != null ? `${weeklyRate} lbs` : '--'}</strong></div>
            <div style={styles.stat}><span>Total lost</span><strong>{totalLost != null ? `${totalLost} lbs` : '--'}</strong></div>
            <div style={styles.stat}><span>Week goal</span><strong>{currentGoal}</strong></div>
            <div style={styles.stat}><span>Vs plan</span><strong>{deltaVsPlan}</strong></div>
            <div style={{ ...styles.statusBox, marginTop: '12px' }}>
              Projected 185 date: {projectedGoalDate ? prettyDate(projectedGoalDate) : '--'}
            </div>
            <div style={{ marginTop: '12px' }} className="small">
              Last 7+ day change: <strong>{weeklyChange != null ? `${weeklyChange} lbs` : '--'}</strong>
            </div>
          </div>
        </div>

        <div style={{ ...styles.grid, marginBottom: '16px' }}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Daily checklist</div>
            {items.map((item) => (
              <div key={item.key} style={styles.checklistRow}>
                <span>{item.label}</span>
                <input
                  type="checkbox"
                  checked={checklist[item.key]}
                  onChange={() => toggle(item.key)}
                />
              </div>
            ))}
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Coach brain</div>
            <div style={styles.statusBox}>{coachAdvice}</div>

            <div style={{ marginTop: '14px' }}>
              <label style={styles.label}>Today’s notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Energy, cravings, workout notes..."
                style={styles.noteBox}
              />
            </div>

            <div style={{ marginTop: '14px' }}>
              <div style={styles.label}>Core rules</div>
              <div style={styles.small}>Energy low → sodium first.</div>
              <div style={styles.small}>Weight stalls 5–7 days → reduce added fat slightly.</div>
              <div style={styles.small}>Strength down → increase protein or fat slightly.</div>
              <div style={styles.small}>Loss too fast after week 2 → add a little fat.</div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Target roadmap</div>
            <div style={styles.milestoneGrid}>
              {milestones.map((m) => {
                const current = numericWeight ?? latestWeight ?? 255;
                const hit = current <= m;
                return (
                  <div key={m} style={styles.milestone(hit)}>
                    <div style={{ fontSize: '12px' }}>Milestone</div>
                    <div style={{ fontSize: '24px' }}>{m}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>Saved days</div>
          <div style={styles.grid}>
            {history.length === 0 ? (
              <div style={styles.small}>No saved days yet. Enter your weight and save the day.</div>
            ) : (
              [...history]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 12)
                .map((entry) => (
                  <div key={entry.date} style={styles.savedDay}>
                    <div style={{ fontWeight: 700, marginBottom: '8px' }}>{entry.date}</div>
                    <div style={styles.small}>Weight: {entry.weight ?? '--'}</div>
                    <div style={styles.small}>Score: {entry.score}/8</div>
                    <div style={styles.small}>Completion: {entry.progress}%</div>
                    <div style={styles.small}>Energy: {entry.energy ?? '--'}</div>
                    <div style={styles.small}>Strength: {entry.strength ?? '--'}</div>
                    <div style={{ marginTop: '8px', fontWeight: 700 }}>
                      {entry.allDone ? '🔥 No soft days' : '⚠️ Tighten it up'}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
