'use client';

import { useEffect, useMemo, useState } from 'react';

const defaultItems = [
  '8 AM Coffee',
  '10 AM Eggs',
  'Midday Electrolytes',
  '2 PM Sirloin',
  'Dinner Sirloin',
  'Evening Electrolytes',
  '8 PM Mackerel',
  'Workout',
];

const achievementRules = [
  { id: 'first-perfect', label: 'First Perfect Day', check: (s) => s.perfectDays >= 1 },
  { id: 'streak-7', label: '7 Day Streak', check: (s) => s.currentStreak >= 7 },
  { id: 'lost-10', label: 'First 10 Lost', check: (s) => s.totalLostNumber >= 10 },
  { id: 'week-perfect', label: 'Perfect Week', check: (s) => s.currentStreak >= 7 },
];

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getStoredValue(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  const value = window.localStorage.getItem(key);
  return value ?? fallback;
}

function daysBetween(a, b) {
  const ms = 1000 * 60 * 60 * 24;
  return Math.round((new Date(b) - new Date(a)) / ms);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function buildChecklist(items, existing = {}) {
  const next = {};
  items.forEach((label) => {
    const key = slugify(label);
    next[key] = existing[key] ?? false;
  });
  return next;
}

function keyToLabelMap(items) {
  const map = {};
  items.forEach((label) => {
    map[slugify(label)] = label;
  });
  return map;
}

function calculateCurrentStreak(history) {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  let count = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].allDone) count += 1;
    else break;
  }
  return count;
}

function calculateBestStreak(history) {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  let best = 0;
  let current = 0;
  for (const item of sorted) {
    if (item.allDone) {
      current += 1;
      if (current > best) best = current;
    } else {
      current = 0;
    }
  }
  return best;
}

function formatWeightChange(delta) {
  if (delta == null || Number.isNaN(delta)) return '--';
  const fixed = delta.toFixed(1);
  return delta > 0 ? `+${fixed}` : fixed;
}

export default function Page() {
  const todayKey = getTodayKey();

  const [goalWeight, setGoalWeight] = useState('185');
  const [proteinTarget, setProteinTarget] = useState('160');
  const [pace, setPace] = useState('aggressive');
  const [weight, setWeight] = useState('');
  const [items, setItems] = useState(defaultItems);
  const [checklist, setChecklist] = useState(buildChecklist(defaultItems));
  const [history, setHistory] = useState([]);
  const [energy, setEnergy] = useState('good');
  const [strength, setStrength] = useState('stable');
  const [notes, setNotes] = useState('');
  const [newItem, setNewItem] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    setGoalWeight(getStoredValue('fls-goal-weight', '185'));
    setProteinTarget(getStoredValue('fls-protein-target', '160'));
    setPace(getStoredValue('fls-pace', 'aggressive'));
    setWeight(getStoredValue(`fls-weight-${todayKey}`, ''));

    const savedItems = getStoredValue('fls-items', null);
    const parsedItems = savedItems ? JSON.parse(savedItems) : defaultItems;
    setItems(parsedItems);

    const savedChecklist = getStoredValue(`fls-checklist-${todayKey}`, null);
    const parsedChecklist = savedChecklist ? JSON.parse(savedChecklist) : {};
    setChecklist(buildChecklist(parsedItems, parsedChecklist));

    const savedHistory = getStoredValue('fls-history', null);
    setHistory(savedHistory ? JSON.parse(savedHistory) : []);

    setEnergy(getStoredValue(`fls-energy-${todayKey}`, 'good'));
    setStrength(getStoredValue(`fls-strength-${todayKey}`, 'stable'));
    setNotes(getStoredValue(`fls-notes-${todayKey}`, ''));

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, [todayKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('fls-goal-weight', goalWeight);
    localStorage.setItem('fls-protein-target', proteinTarget);
    localStorage.setItem('fls-pace', pace);
    localStorage.setItem('fls-items', JSON.stringify(items));
    localStorage.setItem(`fls-weight-${todayKey}`, weight);
    localStorage.setItem(`fls-checklist-${todayKey}`, JSON.stringify(checklist));
    localStorage.setItem('fls-history', JSON.stringify(history));
    localStorage.setItem(`fls-energy-${todayKey}`, energy);
    localStorage.setItem(`fls-strength-${todayKey}`, strength);
    localStorage.setItem(`fls-notes-${todayKey}`, notes);
  }, [goalWeight, proteinTarget, pace, items, weight, checklist, history, energy, strength, notes, todayKey]);

  useEffect(() => {
    if (!notificationsEnabled || typeof window === 'undefined') return;
    const hour = new Date().getHours();
    const completed = Object.values(checklist).filter(Boolean).length;
    const total = Object.keys(checklist).length;

    if (hour >= 6 && hour < 10 && completed === 0) {
      const key = `notif-morning-${todayKey}`;
      if (!sessionStorage.getItem(key)) {
        new Notification('Start your day', { body: 'Lock in early. No excuses.' });
        sessionStorage.setItem(key, '1');
      }
    }

    if (hour >= 12 && hour < 16 && completed < Math.ceil(total / 2)) {
      const key = `notif-midday-${todayKey}`;
      if (!sessionStorage.getItem(key)) {
        new Notification('Midday check', { body: 'You are drifting. Get back on plan.' });
        sessionStorage.setItem(key, '1');
      }
    }

    if (hour >= 18 && completed < total) {
      const key = `notif-evening-${todayKey}`;
      if (!sessionStorage.getItem(key)) {
        new Notification('Finish your day', { body: 'Do not break the streak tonight.' });
        sessionStorage.setItem(key, '1');
      }
    }
  }, [notificationsEnabled, checklist, todayKey]);

  const labelsByKey = useMemo(() => keyToLabelMap(items), [items]);
  const completed = Object.values(checklist).filter(Boolean).length;
  const total = Object.keys(checklist).length;
  const completionPct = total ? Math.round((completed / total) * 100) : 0;
  const numericWeight = weight ? Number(weight) : null;
  const numericGoalWeight = goalWeight ? Number(goalWeight) : 185;
  const numericProteinTarget = proteinTarget ? Number(proteinTarget) : 160;

  const toggle = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addItem = () => {
    const clean = newItem.trim();
    if (!clean) return;
    if (items.some((item) => item.toLowerCase() === clean.toLowerCase())) {
      setNewItem('');
      return;
    }
    const nextItems = [...items, clean];
    setItems(nextItems);
    setChecklist((prev) => buildChecklist(nextItems, prev));
    setNewItem('');
  };

  const removeItem = (label) => {
    const nextItems = items.filter((item) => item !== label);
    const nextChecklist = buildChecklist(nextItems, checklist);
    setItems(nextItems);
    setChecklist(nextChecklist);
  };

  const requestNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setNotificationsEnabled(result === 'granted');
    if (result === 'granted') {
      new Notification('Notifications on', { body: 'Now the app can pressure you through the day.' });
    }
  };

  const saveDay = () => {
    const entry = {
      date: todayKey,
      weight: numericWeight,
      allDone: completed === total,
      completed,
      total,
      energy,
      strength,
      notes,
    };
    const withoutToday = history.filter((h) => h.date !== todayKey);
    setHistory([...withoutToday, entry]);
  };

  const sortedHistory = useMemo(() => [...history].sort((a, b) => a.date.localeCompare(b.date)), [history]);

  const weightEntries = useMemo(
    () => sortedHistory.filter((h) => h.weight != null && !Number.isNaN(h.weight)),
    [sortedHistory]
  );

  const latestWeight = weightEntries.at(-1)?.weight;
  const startWeight = weightEntries[0]?.weight;
  const totalLostNumber = latestWeight != null && startWeight != null ? +(startWeight - latestWeight).toFixed(1) : 0;
  const totalLost = latestWeight != null && startWeight != null ? totalLostNumber.toFixed(1) : '--';
  const nextMilestone = latestWeight ? [245, 225, 205, 190, numericGoalWeight].find((m) => latestWeight > m) ?? numericGoalWeight : '--';

  const slope = useMemo(() => {
    if (weightEntries.length < 2) return null;
    const firstDate = weightEntries[0].date;
    const xs = weightEntries.map((e) => daysBetween(firstDate, e.date));
    const ys = weightEntries.map((e) => e.weight);
    const n = xs.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
    const sumXX = xs.reduce((acc, x) => acc + x * x, 0);
    const denom = n * sumXX - sumX * sumX;
    if (denom === 0) return null;
    return (n * sumXY - sumX * sumY) / denom;
  }, [weightEntries]);

  const weeklyRate = slope != null ? Math.abs((slope * 7).toFixed(2)) : '--';

  const projectedDate = useMemo(() => {
    if (!slope || slope >= 0 || latestWeight == null) return null;
    const daysNeeded = Math.ceil((latestWeight - numericGoalWeight) / Math.abs(slope));
    if (!Number.isFinite(daysNeeded) || daysNeeded < 0) return null;
    return addDays(weightEntries.at(-1).date, daysNeeded);
  }, [slope, latestWeight, numericGoalWeight, weightEntries]);

  const targetWeeklyRate = pace === 'aggressive' ? 2 : pace === 'moderate' ? 1.25 : 0.75;
  const status = useMemo(() => {
    if (!weeklyRate || weeklyRate === '--') return '--';
    const rate = Number(weeklyRate);
    if (rate >= targetWeeklyRate + 0.5) return '🔥 Ahead';
    if (rate >= targetWeeklyRate - 0.25) return '✅ On Track';
    return '⚠️ Behind';
  }, [weeklyRate, targetWeeklyRate]);

  const firstTrackedDate = weightEntries[0]?.date || todayKey;
  const roadmapTarget = useMemo(() => {
    if (startWeight == null) return null;
    const elapsedDays = daysBetween(firstTrackedDate, todayKey);
    const targetLoss = (targetWeeklyRate / 7) * elapsedDays;
    return +(startWeight - targetLoss).toFixed(1);
  }, [startWeight, firstTrackedDate, todayKey, targetWeeklyRate]);

  const deltaVsPlan = latestWeight != null && roadmapTarget != null ? +(latestWeight - roadmapTarget).toFixed(1) : null;
  const plateau = useMemo(() => {
    if (weightEntries.length < 4) return false;
    const recent = weightEntries.slice(-7);
    if (recent.length < 4) return false;
    const min = Math.min(...recent.map((r) => r.weight));
    const max = Math.max(...recent.map((r) => r.weight));
    return max - min < 0.8;
  }, [weightEntries]);

  const currentStreak = calculateCurrentStreak(sortedHistory);
  const bestStreak = calculateBestStreak(sortedHistory);
  const perfectDays = sortedHistory.filter((h) => h.allDone).length;
  const yesterday = addDays(todayKey, -1);
  const todaySaved = sortedHistory.find((h) => h.date === todayKey);
  const yesterdaySaved = sortedHistory.find((h) => h.date === yesterday);
  const streakBreakRisk = currentStreak > 0 && !todaySaved?.allDone && completed < total;
  const brokeStreakToday = currentStreak === 0 && yesterdaySaved?.allDone && todaySaved && !todaySaved.allDone;

  const achieved = achievementRules.filter((rule) => rule.check({ perfectDays, currentStreak, bestStreak, totalLostNumber }));
  const xp = perfectDays * 10 + totalLostNumber * 2 + currentStreak * 3;
  const level = Math.max(1, Math.floor(xp / 50) + 1);

  const latestHistoryCards = useMemo(() => {
    return [...sortedHistory]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10)
      .map((entry, index, arr) => {
        const older = arr[index + 1];
        const weightDelta = entry.weight != null && older?.weight != null ? +(entry.weight - older.weight).toFixed(1) : null;
        const completion = entry.total ? Math.round((entry.completed / entry.total) * 100) : 0;
        return { ...entry, weightDelta, completion };
      });
  }, [sortedHistory]);

  const chartPoints = useMemo(() => {
    if (weightEntries.length === 0) return [];
    const max = Math.max(...weightEntries.map((e) => e.weight));
    const min = Math.min(...weightEntries.map((e) => e.weight));
    const range = Math.max(1, max - min);
    return weightEntries.map((entry, index) => {
      const x = weightEntries.length === 1 ? 0 : (index / (weightEntries.length - 1)) * 100;
      const y = ((max - entry.weight) / range) * 80 + 10;
      return { x, y, label: entry.date, weight: entry.weight };
    });
  }, [weightEntries]);

  const chartPolyline = chartPoints.map((p) => `${p.x},${90 - p.y}`).join(' ');

  const coachText = useMemo(() => {
    if (energy === 'low') return 'Energy is low. Fix sodium first. Stop looking for excuses.';
    if (strength === 'down') return 'Strength is down. Tighten up protein or add a little fuel around training.';
    if (plateau) return 'You are stalled. Reduce added fat slightly and tighten execution this week.';
    if (weeklyRate !== '--' && Number(weeklyRate) < targetWeeklyRate - 0.25) return 'Fat loss is slow. Pull back a little added fat and get serious.';
    if (weeklyRate !== '--' && Number(weeklyRate) > 4) return 'Loss is very fast. Add a little fat so you do not burn out.';
    if (completed < total) return 'Not done yet. Finish the checklist before you call today a win.';
    return 'Stick to the plan. No whining. No random changes.';
  }, [energy, strength, plateau, weeklyRate, targetWeeklyRate, completed, total]);

  const dailyMission = `Hit all ${total} checklist items, stay near ${numericProteinTarget}g protein, and execute your ${pace} pace.`;

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Don’t be a pussy</h1>
            <div style={styles.subTitle}>Execute. No excuses.</div>
          </div>
          <button style={styles.smallButton} onClick={requestNotifications}>
            {notificationsEnabled ? 'Notifications On' : 'Enable Notifications'}
          </button>
        </div>

        <div style={styles.card}>
          <div style={styles.missionBox}>🎯 Today’s mission: {dailyMission}</div>
          {streakBreakRisk && <div style={styles.dangerText}>🚨 You’re about to break your {currentStreak}-day streak.</div>}
          {brokeStreakToday && <div style={styles.breakBox}>❌ You broke it. Start again.</div>}
        </div>

        <div style={styles.grid2}>
          <div style={styles.card}>
            <h3>Setup</h3>
            <input
              placeholder="Enter weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              style={styles.input}
            />
            <div style={styles.grid2Compact}>
              <div>
                <label style={styles.label}>Goal Weight</label>
                <input value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} style={styles.input} />
              </div>
              <div>
                <label style={styles.label}>Protein Target</label>
                <input value={proteinTarget} onChange={(e) => setProteinTarget(e.target.value)} style={styles.input} />
              </div>
            </div>
            <div style={styles.row}>
              <label style={styles.label}>Pace</label>
              <select value={pace} onChange={(e) => setPace(e.target.value)} style={styles.input}>
                <option value="aggressive">Aggressive</option>
                <option value="moderate">Moderate</option>
                <option value="easy">Easy</option>
              </select>
            </div>
            <div style={styles.row}>
              <label style={styles.label}>Energy</label>
              <select value={energy} onChange={(e) => setEnergy(e.target.value)} style={styles.input}>
                <option value="great">Great</option>
                <option value="good">Good</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div style={styles.row}>
              <label style={styles.label}>Strength</label>
              <select value={strength} onChange={(e) => setStrength(e.target.value)} style={styles.input}>
                <option value="up">Up</option>
                <option value="stable">Stable</option>
                <option value="down">Down</option>
              </select>
            </div>
            <textarea
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={styles.textarea}
            />
            <button style={styles.button} onClick={saveDay}>Save Day</button>
          </div>

          <div style={styles.card}>
            <h3>Dashboard</h3>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}><div style={styles.statLabel}>Score</div><div style={styles.statValue}>{completed}/{total}</div></div>
              <div style={styles.statCard}><div style={styles.statLabel}>Current Streak</div><div style={styles.statValue}>{currentStreak}</div></div>
              <div style={styles.statCard}><div style={styles.statLabel}>Best Streak</div><div style={styles.statValue}>{bestStreak}</div></div>
              <div style={styles.statCard}><div style={styles.statLabel}>Level</div><div style={styles.statValue}>{level}</div></div>
            </div>
            <div style={styles.progressWrap}><div style={styles.progressBar(completionPct)} /></div>
            <div style={styles.statusBox}>
              {!weight && 'Enter your weight and face the truth.'}
              {weight && completed === total && '🔥 Locked in. Perfect execution.'}
              {weight && completed < total && '⚠️ Not finished. Execute the plan.'}
            </div>
            <div style={styles.inlineStatusRow}>
              <span style={styles.badge}>Status: {status}</span>
              <span style={styles.badge}>To Goal: {numericWeight != null ? (numericWeight - numericGoalWeight).toFixed(1) : '--'} lbs</span>
            </div>
            {plateau && <div style={styles.warnText}>⚠️ Plateau detected. Tighten up this week.</div>}
          </div>
        </div>

        <div style={styles.card}>
          <h3>Checklist</h3>
          <div style={styles.addRow}>
            <input
              placeholder="Add checklist item"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              style={styles.input}
            />
            <button style={styles.smallButton} onClick={addItem}>Add</button>
          </div>
          {Object.keys(checklist).map((key) => (
            <div key={key} style={styles.checklistRow}>
              <div style={styles.checkLeft}>
                <input type="checkbox" checked={checklist[key]} onChange={() => toggle(key)} />
                <span>{labelsByKey[key]}</span>
              </div>
              <button style={styles.deleteButton} onClick={() => removeItem(labelsByKey[key])}>Delete</button>
            </div>
          ))}
        </div>

        <div style={styles.grid2}>
          <div style={styles.card}>
            <h3>Weight Trend</h3>
            {chartPoints.length >= 2 ? (
              <svg viewBox="0 0 100 100" style={styles.chart}>
                <polyline fill="none" stroke="#00ffff" strokeWidth="2" points={chartPolyline} />
                {chartPoints.map((point) => (
                  <circle key={point.label} cx={point.x} cy={90 - point.y} r="1.8" fill="#ff00ff" />
                ))}
              </svg>
            ) : (
              <div style={styles.tiny}>Save at least 2 weigh-ins to see the trend.</div>
            )}
            <div style={styles.legendRow}>
              <span>Weekly Loss: {weeklyRate} lbs</span>
              <span>Total Lost: {totalLost} lbs</span>
            </div>
          </div>

          <div style={styles.card}>
            <h3>Prediction</h3>
            <div>Projected Goal Date: {projectedDate || '--'}</div>
            <div>Next Milestone: {nextMilestone}</div>
            <div>Roadmap Target: {roadmapTarget ?? '--'}</div>
            <div>Vs Plan: {deltaVsPlan != null ? formatWeightChange(deltaVsPlan) : '--'} lbs</div>
            <div>Target Weekly Pace: {targetWeeklyRate} lbs</div>
          </div>
        </div>

        <div style={styles.grid2}>
          <div style={styles.card}>
            <h3>Coach Brain</h3>
            <div style={styles.coachBox}>{coachText}</div>
          </div>

          <div style={styles.card}>
            <h3>Achievements</h3>
            <div style={styles.badgeWrap}>
              {achieved.length === 0 ? <span style={styles.tiny}>No badges yet. Earn them.</span> : achieved.map((a) => <span key={a.id} style={styles.badge}>{a.label}</span>)}
            </div>
            <div style={{ marginTop: '12px' }}>XP: {xp}</div>
            <div>Perfect Days: {perfectDays}</div>
          </div>
        </div>

        <div style={styles.card}>
          <h3>Saved-Day History</h3>
          <div style={styles.historyGrid}>
            {latestHistoryCards.length === 0 ? (
              <div style={styles.tiny}>No saved days yet. Save today and start your streak.</div>
            ) : (
              latestHistoryCards.map((entry) => (
                <div key={entry.date} style={styles.historyCard}>
                  <div style={styles.historyDate}>{entry.date}</div>
                  <div>Weight: {entry.weight ?? '--'} {entry.weightDelta != null ? `(${formatWeightChange(entry.weightDelta)})` : ''}</div>
                  <div>Completion: {entry.completion}%</div>
                  <div>{entry.allDone ? '🔥 Perfect day' : '⚠️ Missed day'}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at top, #1a0033, #000)',
    color: '#fff',
    padding: '20px',
    fontFamily: 'Courier New, monospace',
  },
  container: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    gap: '12px',
    flexWrap: 'wrap',
  },
  title: {
    textShadow: '0 0 10px #ff00ff, 0 0 20px #00ffff',
    marginBottom: '6px',
  },
  subTitle: {
    color: '#00ffff',
    marginBottom: '8px',
  },
  card: {
    border: '1px solid #ff00ff',
    padding: '15px',
    marginBottom: '15px',
    boxShadow: '0 0 10px #ff00ff',
    borderRadius: '12px',
    background: 'rgba(0,0,0,0.5)',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '15px',
  },
  grid2Compact: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    background: '#111',
    color: '#fff',
    border: '1px solid #00ffff',
    borderRadius: '8px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    minHeight: '80px',
    padding: '10px',
    marginBottom: '10px',
    background: '#111',
    color: '#fff',
    border: '1px solid #00ffff',
    borderRadius: '8px',
    boxSizing: 'border-box',
  },
  button: {
    background: '#ff00ff',
    color: '#000',
    padding: '10px 14px',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  smallButton: {
    background: '#00ffff',
    color: '#000',
    padding: '10px 14px',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    height: '42px',
  },
  deleteButton: {
    background: 'transparent',
    color: '#ff7a7a',
    padding: '6px 10px',
    border: '1px solid #ff7a7a',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  row: {
    marginBottom: '10px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    color: '#00ffff',
  },
  addRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '10px',
    alignItems: 'start',
  },
  checklistRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    gap: '10px',
  },
  checkLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
    marginBottom: '12px',
  },
  statCard: {
    border: '1px solid rgba(0,255,255,0.4)',
    borderRadius: '10px',
    padding: '10px',
    background: 'rgba(0,255,255,0.06)',
  },
  statLabel: {
    fontSize: '12px',
    color: '#00ffff',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 'bold',
  },
  progressWrap: {
    height: '12px',
    background: 'rgba(255,255,255,0.12)',
    borderRadius: '999px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  progressBar: (value) => ({
    height: '100%',
    width: `${value}%`,
    background: 'linear-gradient(90deg, #ff00ff, #00ffff)',
    boxShadow: '0 0 12px #ff00ff',
  }),
  statusBox: {
    border: '1px solid #00ffff',
    padding: '12px',
    borderRadius: '10px',
    marginBottom: '10px',
  },
  inlineStatusRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  badge: {
    display: 'inline-block',
    background: 'rgba(255,0,255,0.18)',
    border: '1px solid rgba(255,0,255,0.45)',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
  },
  badgeWrap: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  missionBox: {
    border: '1px solid #00ffff',
    borderRadius: '10px',
    padding: '12px',
    marginBottom: '10px',
    background: 'rgba(0,255,255,0.06)',
  },
  dangerText: {
    color: '#ff4d4d',
    textShadow: '0 0 8px #ff0000',
    fontWeight: 'bold',
  },
  warnText: {
    color: '#ffaa00',
    marginTop: '8px',
  },
  breakBox: {
    marginTop: '10px',
    border: '1px solid #ff4d4d',
    color: '#ffb4b4',
    padding: '12px',
    borderRadius: '10px',
    background: 'rgba(255,0,0,0.08)',
    fontWeight: 'bold',
  },
  coachBox: {
    border: '1px solid rgba(0,255,255,0.4)',
    borderRadius: '10px',
    padding: '12px',
    background: 'rgba(0,255,255,0.06)',
  },
  chart: {
    width: '100%',
    height: '180px',
    display: 'block',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '10px',
  },
  legendRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    flexWrap: 'wrap',
    marginTop: '10px',
  },
  historyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
  },
  historyCard: {
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '10px',
    background: 'rgba(255,255,255,0.04)',
  },
  historyDate: {
    fontWeight: 'bold',
    marginBottom: '6px',
  },
  tiny: {
    color: '#ccc',
    fontSize: '13px',
  },
};
