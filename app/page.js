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

const labels = {
  coffee: '8 AM Coffee',
  eggs: '10 AM Eggs',
  electrolytes1: 'Midday Electrolytes',
  steakLunch: '2 PM Sirloin',
  steakDinner: 'Dinner Sirloin',
  electrolytes2: 'Evening Electrolytes',
  mackerel: '8 PM Mackerel',
  workout: 'Workout',
};

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getStoredValue(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  const value = window.localStorage.getItem(key);
  return value ?? fallback;
}

export default function Page() {
  const todayKey = getTodayKey();

  const [weight, setWeight] = useState('');
  const [checklist, setChecklist] = useState(defaultChecklist);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setWeight(getStoredValue(`fls-weight-${todayKey}`, ''));

    const savedChecklist = getStoredValue(`fls-checklist-${todayKey}`, null);
    setChecklist(savedChecklist ? JSON.parse(savedChecklist) : defaultChecklist);

    const savedHistory = getStoredValue('fls-history', null);
    setHistory(savedHistory ? JSON.parse(savedHistory) : []);
  }, [todayKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`fls-weight-${todayKey}`, weight);
    localStorage.setItem(`fls-checklist-${todayKey}`, JSON.stringify(checklist));
    localStorage.setItem('fls-history', JSON.stringify(history));
  }, [weight, checklist, history, todayKey]);

  const completed = Object.values(checklist).filter(Boolean).length;
  const total = Object.keys(checklist).length;
  const progress = Math.round((completed / total) * 100);

  const streak = useMemo(() => {
    const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
    let count = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].allDone) count++;
      else break;
    }
    return count;
  }, [history]);

  const toggle = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveDay = () => {
    const entry = {
      date: todayKey,
      score: completed,
      allDone: completed === total,
    };
    const withoutToday = history.filter((h) => h.date !== todayKey);
    setHistory([...withoutToday, entry]);
  };

  const hour = new Date().getHours();
  const missedToday = completed === 0;

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <div style={styles.header}>
          <div style={styles.title}>Don’t be a pussy</div>
          <div style={styles.subtitle}>Execute. No excuses.</div>
        </div>

        <div style={styles.card}>
          <input
            placeholder="Enter weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            style={styles.input}
          />

          <div style={styles.stats}>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Score</div>
              <div style={styles.statValue}>{completed}/{total}</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Streak</div>
              <div style={styles.statValue}>{streak}</div>
            </div>
          </div>

          <div style={styles.progressWrap}>
            <div style={styles.progressBar(progress)} />
          </div>

          <div style={styles.status}>
            {!weight && 'Enter your weight and face the truth.'}
            {weight && completed === total && '🔥 Perfect execution'}
            {weight && completed < total && '⚠️ Not finished. Execute.'}
          </div>

          {/* 🔥 Pressure system */}
          {completed < total && <div style={styles.warn}>⚠️ Finish the list</div>}
          {missedToday && <div style={styles.error}>❌ You did nothing</div>}
          {hour >= 18 && completed < total && <div style={styles.warn}>⏱ Finish your day</div>}
          {streak > 0 && completed < total && (
            <div style={styles.error}>🚨 About to break {streak}-day streak</div>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.sectionTitle}>Checklist</div>

          {Object.keys(checklist).map((key) => (
            <div key={key} style={styles.item}>
              <span>{labels[key]}</span>
              <input
                type="checkbox"
                checked={checklist[key]}
                onChange={() => toggle(key)}
              />
            </div>
          ))}

          <button style={styles.button} onClick={saveDay}>
            Save Day
          </button>
        </div>

      </div>
    </main>
  );
}

/* ---------- STYLES ---------- */

const styles = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at top, #1a0033, #000000)',
    color: '#fff',
    padding: '20px',
    fontFamily: 'Courier New, monospace',
  },
  container: {
    maxWidth: '500px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '20px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    textShadow: '0 0 10px #ff00ff, 0 0 20px #00ffff',
  },
  subtitle: {
    color: '#00ffff',
    fontSize: '14px',
  },
  card: {
    background: 'rgba(0,0,0,0.7)',
    border: '1px solid #ff00ff',
    padding: '16px',
    borderRadius: '16px',
    marginBottom: '16px',
    boxShadow: '0 0 15px #ff00ff',
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid #00ffff',
    background: '#000',
    color: '#00ffff',
    marginBottom: '12px',
  },
  stats: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  statBox: {
    textAlign: 'center',
  },
  statLabel: {
    fontSize: '12px',
    color: '#aaa',
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    textShadow: '0 0 8px #00ffff',
  },
  progressWrap: {
    height: '10px',
    background: '#111',
    borderRadius: '10px',
    marginBottom: '12px',
  },
  progressBar: (v) => ({
    width: `${v}%`,
    height: '100%',
    background: 'linear-gradient(90deg, #ff00ff, #00ffff)',
    boxShadow: '0 0 10px #ff00ff',
    borderRadius: '10px',
  }),
  status: {
    marginBottom: '10px',
  },
  warn: {
    color: '#ffaa00',
  },
  error: {
    color: '#ff4444',
    textShadow: '0 0 8px #ff0000',
  },
  sectionTitle: {
    marginBottom: '10px',
    color: '#00ffff',
    fontWeight: 'bold',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #222',
  },
  button: {
    width: '100%',
    marginTop: '15px',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    background: '#ff00ff',
    color: '#000',
    fontWeight: 'bold',
    fontSize: '16px',
    boxShadow: '0 0 12px #ff00ff',
  },
};
