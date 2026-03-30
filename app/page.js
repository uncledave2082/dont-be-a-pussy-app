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

const milestones = [245, 225, 205, 190, 185];

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

export default function Page() {
  const todayKey = getTodayKey();

  const [weight, setWeight] = useState('');
  const [items, setItems] = useState(defaultItems);
  const [checklist, setChecklist] = useState(buildChecklist(defaultItems));
  const [history, setHistory] = useState([]);
  const [energy, setEnergy] = useState('good');
  const [strength, setStrength] = useState('stable');
  const [notes, setNotes] = useState('');
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
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
  }, [todayKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('fls-items', JSON.stringify(items));
    localStorage.setItem(`fls-weight-${todayKey}`, weight);
    localStorage.setItem(`fls-checklist-${todayKey}`, JSON.stringify(checklist));
    localStorage.setItem('fls-history', JSON.stringify(history));
    localStorage.setItem(`fls-energy-${todayKey}`, energy);
    localStorage.setItem(`fls-strength-${todayKey}`, strength);
    localStorage.setItem(`fls-notes-${todayKey}`, notes);
  }, [items, weight, checklist, history, energy, strength, notes, todayKey]);

  const labelsByKey = useMemo(() => keyToLabelMap(items), [items]);
  const completed = Object.values(checklist).filter(Boolean).length;
  const total = Object.keys(checklist).length;

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

  const saveDay = () => {
    const entry = {
      date: todayKey,
      weight: weight ? Number(weight) : null,
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

  const weightEntries = useMemo(
    () => history.filter((h) => h.weight).sort((a, b) => a.date.localeCompare(b.date)),
    [history]
  );

  const latestWeight = weightEntries.at(-1)?.weight;
  const startWeight = weightEntries[0]?.weight;
  const totalLost = latestWeight && startWeight ? (startWeight - latestWeight).toFixed(1) : '--';

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
    if (!slope || slope >= 0 || !latestWeight) return null;
    const daysNeeded = Math.ceil((latestWeight - 185) / Math.abs(slope));
    return addDays(weightEntries.at(-1).date, daysNeeded);
  }, [slope, latestWeight, weightEntries]);

  const nextMilestone = latestWeight ? milestones.find((m) => latestWeight > m) : '--';

  const status = useMemo(() => {
    if (!weeklyRate || weeklyRate === '--') return '--';
    if (Number(weeklyRate) >= 2) return '🔥 Ahead';
    if (Number(weeklyRate) >= 1) return '✅ On Track';
    return '⚠️ Behind';
  }, [weeklyRate]);

  const coachText = useMemo(() => {
    if (energy === 'low') return 'Energy is low. Fix sodium first. Stop looking for excuses.';
    if (strength === 'down') return 'Strength is down. Tighten up protein or add a little fuel around training.';
    if (weeklyRate !== '--' && Number(weeklyRate) < 1) return 'Fat loss is slow. Pull back a little added fat and get serious.';
    if (weeklyRate !== '--' && Number(weeklyRate) > 4) return 'Loss is very fast. Add a little fat so you do not burn out.';
    return 'Stick to the plan. No whining. No random changes.';
  }, [energy, strength, weeklyRate]);

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Don’t be a pussy</h1>

        <div style={styles.card}>
          <input
            placeholder="Enter weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            style={styles.input}
          />

          <div style={styles.row}>Score: {completed}/{total}</div>

          <div style={styles.row}>
            <label>Energy</label>
            <select value={energy} onChange={(e) => setEnergy(e.target.value)} style={styles.input}>
              <option value="great">Great</option>
              <option value="good">Good</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div style={styles.row}>
            <label>Strength</label>
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

          <button style={styles.button} onClick={saveDay}>
            Save Day
          </button>
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
                <input
                  type="checkbox"
                  checked={checklist[key]}
                  onChange={() => toggle(key)}
                />
                <span>{labelsByKey[key]}</span>
              </div>
              <button style={styles.deleteButton} onClick={() => removeItem(labelsByKey[key])}>Delete</button>
            </div>
          ))}
        </div>

        <div style={styles.card}>
          <h3>Prediction</h3>
          <div>Weekly Loss: {weeklyRate} lbs</div>
          <div>Total Lost: {totalLost} lbs</div>
          <div>Next Milestone: {nextMilestone}</div>
          <div>Status: {status}</div>
          <div>Goal Date: {projectedDate || '--'}</div>
        </div>

        <div style={styles.card}>
          <h3>Coach Brain</h3>
          <div>{coachText}</div>
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
    maxWidth: '560px',
    margin: '0 auto',
  },
  title: {
    textShadow: '0 0 10px #ff00ff, 0 0 20px #00ffff',
  },
  card: {
    border: '1px solid #ff00ff',
    padding: '15px',
    marginBottom: '15px',
    boxShadow: '0 0 10px #ff00ff',
    borderRadius: '12px',
    background: 'rgba(0,0,0,0.5)',
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
};
