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

const milestones = [245, 225, 205, 190, 185];

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

  const [startDate, setStartDate] = useState(todayKey);
  const [weight, setWeight] = useState('');
  const [checklist, setChecklist] = useState(defaultChecklist);
  const [history, setHistory] = useState([]);
  const [energy, setEnergy] = useState('good');
  const [strength, setStrength] = useState('stable');

  // ✅ Load from localStorage AFTER mount (fixes your error)
  useEffect(() => {
    setStartDate(getStoredValue('fls-start-date', todayKey));
    setWeight(getStoredValue(`fls-weight-${todayKey}`, ''));

    const savedChecklist = getStoredValue(`fls-checklist-${todayKey}`, null);
    setChecklist(savedChecklist ? JSON.parse(savedChecklist) : defaultChecklist);

    const savedHistory = getStoredValue('fls-history', null);
    setHistory(savedHistory ? JSON.parse(savedHistory) : []);
  }, [todayKey]);

  // ✅ Save to localStorage safely
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('fls-start-date', startDate);
    localStorage.setItem(`fls-weight-${todayKey}`, weight);
    localStorage.setItem(`fls-checklist-${todayKey}`, JSON.stringify(checklist));
    localStorage.setItem('fls-history', JSON.stringify(history));
  }, [startDate, weight, checklist, history, todayKey]);

  const totalItems = Object.keys(checklist).length;
  const completed = Object.values(checklist).filter(Boolean).length;
  const progress = Math.round((completed / totalItems) * 100);

  const streak = useMemo(() => {
    let count = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].allDone) count++;
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
      weight: weight ? Number(weight) : null,
      score: completed,
      allDone: completed === totalItems,
    };

    const withoutToday = history.filter((h) => h.date !== todayKey);
    setHistory([...withoutToday, entry]);
  };

  const reset = () => {
    setChecklist(defaultChecklist);
    setWeight('');
  };

  return (
    <main style={{ padding: 20, fontFamily: 'Arial' }}>
      <h1>Don’t be a pussy</h1>

      <input
        placeholder="Enter weight"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        style={{ padding: 10, marginBottom: 20 }}
      />

      <div>
        {Object.keys(checklist).map((key) => (
          <div key={key}>
            <label>
              <input
                type="checkbox"
                checked={checklist[key]}
                onChange={() => toggle(key)}
              />
              {key}
            </label>
          </div>
        ))}
      </div>

      <h2>Score: {completed}/{totalItems}</h2>
      <h3>Streak: {streak}</h3>

      <button onClick={saveDay}>Save Day</button>
      <button onClick={reset} style={{ marginLeft: 10 }}>
        Reset
      </button>
    </main>
  );
}
