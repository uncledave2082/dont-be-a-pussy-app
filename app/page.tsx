import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Flame, Target, Dumbbell, Fish, Coffee, Egg, Beef, Droplets, Bell, TrendingDown, Brain, Trophy } from 'lucide-react';

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

export default function FatLossSystemApp() {
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

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

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const totalItems = Object.keys(checklist).length;
  const completed = Object.values(checklist).filter(Boolean).length;
  const score = completed;
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

  const requestNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setNotificationsEnabled(result === 'granted');
    if (result === 'granted') {
      new Notification('Reminders enabled', {
        body: 'Use your phone calendar or alarms for scheduled meal reminders.',
      });
    }
  };

  const saveDay = () => {
    const entry = {
      date: todayKey,
      weight: numericWeight,
      score,
      allDone,
      progress,
      energy,
      strength,
      notes,
    };
    const withoutToday = history.filter((h) => h.date !== todayKey);
    setHistory([...withoutToday, entry]);
  };

  const toggle = (key) => setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));

  const resetToday = () => {
    setChecklist(defaultChecklist);
    setWeight('');
    setEnergy('good');
    setStrength('stable');
    setNotes('');
  };

  const formulaText = 'Score = completed boxes / 8. Perfect day = 8/8. To Goal = current weight - 185. Weekly rate = average daily loss x 7. Status compares current weight to projected roadmap by week.';

  const items = [
    { key: 'coffee', label: '8 AM Coffee', icon: Coffee },
    { key: 'eggs', label: '10 AM Eggs', icon: Egg },
    { key: 'electrolytes1', label: 'Midday Electrolytes', icon: Droplets },
    { key: 'steakLunch', label: '2 PM Sirloin', icon: Beef },
    { key: 'steakDinner', label: 'Dinner Sirloin', icon: Beef },
    { key: 'electrolytes2', label: 'Evening Electrolytes', icon: Droplets },
    { key: 'mackerel', label: '8 PM Mackerel', icon: Fish },
    { key: 'workout', label: 'Workout', icon: Dumbbell },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 lg:grid-cols-4">
          <Card className="rounded-2xl shadow-sm lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Target className="h-6 w-6" /> Don’t be a pussy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <div className="mb-2 text-sm font-medium">Start date</div>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <div className="mb-2 text-sm font-medium">Today’s weight</div>
                  <Input type="number" placeholder="255" value={weight} onChange={(e) => setWeight(e.target.value)} />
                </div>
                <div>
                  <div className="mb-2 text-sm font-medium">Energy</div>
                  <select className="w-full rounded-xl border bg-white p-2 text-sm" value={energy} onChange={(e) => setEnergy(e.target.value)}>
                    <option value="great">Great</option>
                    <option value="good">Good</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <div className="mb-2 text-sm font-medium">Strength</div>
                  <select className="w-full rounded-xl border bg-white p-2 text-sm" value={strength} onChange={(e) => setStrength(e.target.value)}>
                    <option value="up">Up</option>
                    <option value="stable">Stable</option>
                    <option value="down">Down</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Button onClick={saveDay} className="rounded-2xl">Save today</Button>
                <Button variant="outline" onClick={requestNotifications} className="rounded-2xl">
                  <Bell className="mr-2 h-4 w-4" /> {notificationsEnabled ? 'Notifications enabled' : 'Enable notifications'}
                </Button>
                <Button variant="outline" onClick={resetToday} className="rounded-2xl">Reset today</Button>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>Daily completion</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Flame className="h-5 w-5" /> Live status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Score</span>
                <Badge>{score}/8</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Streak</span>
                <Badge variant="secondary">{streak} days</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>To 185</span>
                <Badge variant="outline">{toGoal} lbs</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Next milestone</span>
                <Badge variant="outline">{nextMilestone}</Badge>
              </div>
              <div className="rounded-2xl bg-slate-100 p-3 text-center font-medium">{smartStatus}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="rounded-2xl shadow-sm xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5" /> Daily checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {items.map(({ key, label, icon: Icon }) => (
                  <label key={key} className="flex items-center justify-between rounded-2xl border bg-white p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-slate-500" />
                      <span className="font-medium">{label}</span>
                    </div>
                    <Checkbox checked={checklist[key]} onCheckedChange={() => toggle(key)} />
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingDown className="h-5 w-5" /> Prediction engine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border p-3">
                  <div className="text-slate-500">Weekly rate</div>
                  <div className="text-xl font-semibold">{weeklyRate != null ? `${weeklyRate} lbs` : '--'}</div>
                </div>
                <div className="rounded-2xl border p-3">
                  <div className="text-slate-500">Total lost</div>
                  <div className="text-xl font-semibold">{totalLost != null ? `${totalLost} lbs` : '--'}</div>
                </div>
                <div className="rounded-2xl border p-3">
                  <div className="text-slate-500">Week goal</div>
                  <div className="text-xl font-semibold">{currentGoal}</div>
                </div>
                <div className="rounded-2xl border p-3">
                  <div className="text-slate-500">Vs plan</div>
                  <div className="text-xl font-semibold">{deltaVsPlan}</div>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-100 p-4">
                <div className="font-medium">Projected 185 date</div>
                <div className="mt-1 text-lg font-semibold">{projectedGoalDate ? prettyDate(projectedGoalDate) : '--'}</div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="font-medium">Last 7+ day change</div>
                <div className="mt-1 text-lg font-semibold">{weeklyChange != null ? `${weeklyChange} lbs` : '--'}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5" /> Coach brain
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-2xl bg-slate-100 p-4 font-medium">{coachAdvice}</div>
              <div>
                <div className="mb-2 font-medium">Today’s notes</div>
                <textarea
                  className="min-h-28 w-full rounded-2xl border p-3 text-sm"
                  placeholder="Energy, cravings, workout notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div>
                <div className="mb-2 font-medium">Core rules</div>
                <div className="space-y-2 text-slate-700">
                  <div>Energy low → sodium first.</div>
                  <div>Weight stalls 5–7 days → reduce added fat slightly.</div>
                  <div>Strength down → increase protein or fat slightly.</div>
                  <div>Loss too fast after week 2 → add a little fat.</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5" /> Target roadmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {milestones.map((m) => {
                  const current = numericWeight ?? latestWeight ?? 255;
                  const hit = current <= m;
                  return (
                    <div key={m} className={`rounded-2xl border p-4 text-center ${hit ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                      <div className="text-sm">Milestone</div>
                      <div className="text-2xl font-bold">{m}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Formula</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-2xl bg-slate-100 p-4 font-mono text-xs leading-6">
                {formulaText}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {targetWeights.map((t) => (
                  <div key={t.week} className="rounded-xl border p-2">
                    Week {t.week}: <strong>{t.weight}</strong>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Saved days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {history.length === 0 ? (
                <div className="text-sm text-slate-500">No saved days yet. Enter your weight and save the day.</div>
              ) : (
                [...history]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 12)
                  .map((entry) => (
                    <div key={entry.date} className="rounded-2xl border p-4 text-sm">
                      <div className="font-semibold">{entry.date}</div>
                      <div>Weight: {entry.weight ?? '--'}</div>
                      <div>Score: {entry.score}/8</div>
                      <div>Completion: {entry.progress}%</div>
                      <div>Energy: {entry.energy ?? '--'}</div>
                      <div>Strength: {entry.strength ?? '--'}</div>
                      <div>{entry.allDone ? '🔥 No soft days' : '⚠️ Tighten it up'}</div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
