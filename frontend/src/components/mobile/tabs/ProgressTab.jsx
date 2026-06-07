/**
 * ProgressTab.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full Progress Report for KLF Gym Member App.
 *
 * Inner tabs:
 *   Overview   – summary cards + mini heatmap + recent activity
 *   Weight     – body weight log, chart, goal, BMI
 *   Workouts   – monthly session count + week breakdown
 *   Records    – personal records (PRs) with add/edit
 *   Activity   – full chronological workout log with filtering
 *
 * All data is local state with TODO comments marking where Firebase/API calls go.
 * Import into MobileApp.jsx:
 *   import ProgressTab from './tabs/ProgressTab';
 *   // then in renderContent(): if (active === 'progress') return <ProgressTab />;
 */

import { useState, useMemo } from 'react';
import { C, T } from '../../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA  (replace each with a Firebase/API call)
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_WEIGHTS = [
  { date: '2026-02-10', kg: 76.5 },
  { date: '2026-02-17', kg: 75.8 },
  { date: '2026-02-24', kg: 75.0 },
  { date: '2026-03-03', kg: 74.2 },
  { date: '2026-03-10', kg: 73.5 },
  { date: '2026-03-17', kg: 72.8 },
  { date: '2026-03-19', kg: 72.2 },
];

const MOCK_GOAL_WEIGHT = 68;
const MOCK_HEIGHT_CM   = 170;

// Sessions per week for the last 8 weeks
const MOCK_WEEKLY_SESSIONS = [3, 4, 2, 5, 4, 3, 5, 4];

// Today's month sessions / target
const MOCK_SESSIONS_THIS_MONTH = 14;
const MOCK_SESSION_TARGET      = 20;

const MOCK_STREAK = 5; // consecutive days

const MOCK_PRS = [
  { id: 1, exercise: 'Bench Press',    value: 80,  unit: 'kg',   date: '2026-03-10', prev: 75  },
  { id: 2, exercise: 'Back Squat',     value: 100, unit: 'kg',   date: '2026-03-05', prev: 95  },
  { id: 3, exercise: 'Deadlift',       value: 120, unit: 'kg',   date: '2026-02-28', prev: 112 },
  { id: 4, exercise: 'Pull-ups',       value: 16,  unit: 'reps', date: '2026-03-12', prev: 12  },
  { id: 5, exercise: 'Overhead Press', value: 52,  unit: 'kg',   date: '2026-03-01', prev: 50  },
  { id: 6, exercise: '1-Mile Run',     value: 7.5, unit: 'min',  date: '2026-02-20', prev: 8.2 },
];

const MOCK_ACTIVITY = [
  { id: 1,  date: '2026-03-19', time: '6:02 AM', type: 'Morning Session', focus: 'Chest & Triceps',     duration: '1h 24m', calories: 420, notes: 'Hit new bench press PR! Felt strong.' },
  { id: 2,  date: '2026-03-17', time: '7:15 AM', type: 'Morning Session', focus: 'Back & Biceps',       duration: '58m',    calories: 310, notes: '' },
  { id: 3,  date: '2026-03-15', time: '5:30 PM', type: 'Evening Session', focus: 'Leg Day',             duration: '1h 10m', calories: 390, notes: 'Squats felt heavy, deload next week.' },
  { id: 4,  date: '2026-03-14', time: '6:00 AM', type: 'Morning Session', focus: 'Shoulders & Arms',    duration: '1h 02m', calories: 350, notes: '' },
  { id: 5,  date: '2026-03-12', time: '5:45 PM', type: 'Evening Session', focus: 'Pull Day',            duration: '45m',    calories: 270, notes: 'PR on pull-ups — 16 reps!' },
  { id: 6,  date: '2026-03-10', time: '6:00 AM', type: 'Morning Session', focus: 'Push Day',            duration: '1h 18m', calories: 410, notes: '' },
  { id: 7,  date: '2026-03-08', time: '8:00 AM', type: 'Morning Session', focus: 'Full Body',           duration: '1h 05m', calories: 360, notes: 'Great energy, tried drop sets.' },
  { id: 8,  date: '2026-03-05', time: '6:30 AM', type: 'Morning Session', focus: 'Leg Day',             duration: '1h 20m', calories: 400, notes: '100 kg squat new PR!' },
  { id: 9,  date: '2026-03-03', time: '5:00 PM', type: 'Evening Session', focus: 'Chest & Triceps',     duration: '55m',    calories: 305, notes: '' },
  { id: 10, date: '2026-03-01', time: '7:00 AM', type: 'Morning Session', focus: 'Shoulders & Arms',    duration: '1h 00m', calories: 330, notes: '' },
  { id: 11, date: '2026-02-28', time: '6:00 AM', type: 'Morning Session', focus: 'Deadlift Focus',      duration: '1h 30m', calories: 460, notes: '120 kg deadlift — new all-time PR!' },
  { id: 12, date: '2026-02-26', time: '5:30 PM', type: 'Evening Session', focus: 'Cardio',              duration: '40m',    calories: 280, notes: '1-mile run + intervals.' },
  { id: 13, date: '2026-02-24', time: '6:15 AM', type: 'Morning Session', focus: 'Back & Biceps',       duration: '1h 05m', calories: 345, notes: '' },
  { id: 14, date: '2026-02-20', time: '6:00 AM', type: 'Morning Session', focus: 'Cardio & Endurance',  duration: '50m',    calories: 300, notes: '1-mile PR at 7:30 min.' },
];

const FOCUS_TAGS = ['All Focus', 'Chest & Triceps', 'Back & Biceps', 'Leg Day', 'Shoulders & Arms', 'Cardio', 'Full Body'];

// ─────────────────────────────────────────────────────────────────────────────
// SHARED MICRO-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Dark card container */
function Card({ children, style = {} }) {
  return (
    <div style={{
      background:   C.bgSecondary,
      border:       `0.5px solid ${C.border}`,
      borderRadius: 14,
      padding:      14,
      marginBottom: 10,
      ...style,
    }}>
      {children}
    </div>
  );
}

/** Gold section heading */
function SectionHeading({ label, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ color: C.gold, fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
        {label}
      </span>
      {right}
    </div>
  );
}

/** Horizontal bar chart / sparkline */
function Sparkline({ data = [], color = C.gold, height = 48, showDots = false }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
      {data.map((v, i) => {
        const isLast = i === data.length - 1;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{
              width:        '100%',
              height:       `${Math.max(4, Math.round((v / max) * 100))}%`,
              background:   isLast ? color : `${color}55`,
              borderRadius: '3px 3px 0 0',
              transition:   'height 0.4s ease',
            }} />
          </div>
        );
      })}
    </div>
  );
}

/** Mini stat box */
function StatBox({ label, value, sub, color = C.gold, icon }) {
  return (
    <div style={{
      background:   C.bgTertiary || '#181818',
      border:       `0.5px solid ${C.border}`,
      borderRadius: 10,
      padding:      '11px 12px',
      flex:         1,
    }}>
      {icon && <div style={{ fontSize: 18, marginBottom: 5 }}>{icon}</div>}
      <div style={{ color, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ color: C.textPrimary, fontSize: 11, fontWeight: 500, marginTop: 3 }}>{label}</div>
      {sub && <div style={{ color: C.textMuted, fontSize: 10, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/** Reusable text input */
function TextInput({ value, onChange, placeholder, type = 'text', style = {} }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background:   '#0f0f0f',
        border:       `0.5px solid ${C.borderMid}`,
        color:        C.textPrimary,
        padding:      '9px 11px',
        borderRadius: 8,
        fontSize:     13,
        fontFamily:   T.body,
        outline:      'none',
        ...style,
      }}
    />
  );
}

/** Gold filled button */
function GoldBtn({ children, onClick, style = {}, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background:   disabled ? '#1e1e1e' : C.gold,
        color:        disabled ? C.textMuted : '#0a0a0a',
        border:       'none',
        padding:      '9px 16px',
        borderRadius: 8,
        fontSize:     13,
        fontWeight:   600,
        cursor:       disabled ? 'not-allowed' : 'pointer',
        fontFamily:   T.body,
        transition:   'all 0.15s',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** Ghost filter chip */
function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink:   0,
        padding:      '5px 12px',
        borderRadius: 999,
        fontSize:     11,
        fontWeight:   500,
        cursor:       'pointer',
        border:       `0.5px solid ${active ? C.gold : C.borderMid}`,
        background:   active ? C.goldBg : 'transparent',
        color:        active ? C.gold : C.textMuted,
        fontFamily:   T.body,
        whiteSpace:   'nowrap',
        transition:   'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

/** Progress bar */
function ProgressBar({ pct, color = C.gold, height = 6 }) {
  return (
    <div style={{ background: '#1e1e1e', height, borderRadius: height }}>
      <div style={{
        background:   color,
        height,
        borderRadius: height,
        width:        `${Math.min(100, Math.max(0, pct))}%`,
        transition:   'width 0.5s ease',
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────

function OverviewSection({ weights, weeklyData, sessions, sessionTarget, streak, activity, prs }) {
  const currentWeight = weights.at(-1)?.kg ?? 0;
  const startWeight   = weights[0]?.kg ?? currentWeight;
  const totalLost     = (startWeight - currentWeight).toFixed(1);
  const totalCalories = activity.reduce((s, a) => s + (a.calories || 0), 0);
  const sessionPct    = Math.round((sessions / sessionTarget) * 100);

  return (
    <>
      {/* Summary stats 2×2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <StatBox icon="🏋️" label="Sessions This Month" value={sessions}       sub={`${sessionPct}% of goal`} color={C.gold}   />
        <StatBox icon="🔥" label="Day Streak"           value={`${streak}d`}   sub="Keep it up!"             color="#ff8c00"  />
        <StatBox icon="⚖️" label="Total Lost"           value={`${totalLost > 0 ? '-' : '+'}${Math.abs(totalLost)}kg`} sub={`${weights[0]?.kg ?? '—'} → ${currentWeight} kg`} color={Number(totalLost) >= 0 ? C.green : C.red} />
        <StatBox icon="🔥" label="Total Calories"       value={`${totalCalories.toLocaleString()}`} sub="all sessions"  color="#ff6b35" />
      </div>

      {/* Monthly goal */}
      <Card>
        <SectionHeading label="Monthly Goal" right={<span style={{ color: C.textMuted, fontSize: 11 }}>{sessions} / {sessionTarget} sessions</span>} />
        <ProgressBar pct={sessionPct} />
        <div style={{ color: C.gold, fontSize: 11, textAlign: 'right', marginTop: 5 }}>{sessionPct}% complete</div>
      </Card>

      {/* Recent 3 sessions */}
      <Card style={{ marginBottom: 0 }}>
        <SectionHeading label="Recent Activity" />
        {activity.slice(0, 3).map((a, i) => (
          <div key={a.id} style={{
            display:      'flex',
            gap:          10,
            alignItems:   'center',
            padding:      '9px 0',
            borderBottom: i < 2 ? `0.5px solid ${C.border}` : 'none',
          }}>
            <div style={{
              width:          34,
              height:         34,
              flexShrink:     0,
              background:     a.type.includes('Morning') ? '#0f1a2a' : '#1a0f2a',
              borderRadius:   8,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       16,
            }}>
              {a.type.includes('Morning') ? '🌅' : '🌙'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.textPrimary, fontSize: 13, fontWeight: 500 }}>{a.focus}</div>
              <div style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>{a.date} · {a.time}</div>
            </div>
            <div style={{
              background:   C.goldBg,
              color:        C.gold,
              fontSize:     11,
              fontWeight:   600,
              padding:      '3px 8px',
              borderRadius: 6,
              whiteSpace:   'nowrap',
            }}>
              {a.duration}
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: WEIGHT TRACKER
// ─────────────────────────────────────────────────────────────────────────────

function WeightSection({ weights, setWeights, goalWeight, setGoalWeight, heightCm }) {
  const [adding,      setAdding]      = useState(false);
  const [newKg,       setNewKg]       = useState('');
  const [heightInput, setHeightInput] = useState(String(heightCm));
  const [height,      setHeight]      = useState(heightCm);
  const [editGoal,    setEditGoal]    = useState(false);
  const [goalInput,   setGoalInput]   = useState(String(goalWeight));
  const [showAll,     setShowAll]     = useState(false);

  const current  = weights.at(-1)?.kg ?? 0;
  const prev     = weights.at(-2)?.kg ?? current;
  const delta    = (current - prev).toFixed(1);
  const isDown   = Number(delta) < 0;
  const startKg  = weights[0]?.kg ?? current;
  const totalLost = (startKg - current).toFixed(1);

  // BMI
  const heightM = heightCm / 100;
  const bmi     = (current / (heightM * heightM)).toFixed(1);
  const bmiLabel = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
  const bmiColor = bmi < 18.5 ? C.blue : bmi < 25 ? C.green : bmi < 30 ? C.orange : C.red;

  const pctToGoal = current > goalWeight
    ? Math.max(0, Math.min(100, Math.round(((startKg - current) / (startKg - goalWeight)) * 100)))
    : 100;

  function logWeight() {
    const val = parseFloat(newKg);
    if (isNaN(val) || val < 20 || val > 350) return;
    const heightVal = parseFloat(heightInput);
    if (!isNaN(heightVal) && heightVal >= 80 && heightVal <= 250) {
      setHeight(heightVal);
    }
    const today = new Date().toISOString().split('T')[0];
    // TODO: await addDoc(collection(db, 'weightLogs'), { userId, kg: val, date: today });
    setWeights(prev => {
      const without = prev.filter(w => w.date !== today);
      return [...without, { date: today, kg: val }].sort((a, b) => a.date.localeCompare(b.date));
    });
    setNewKg(''); setAdding(false);
  }

  function saveGoal() {
    const val = parseFloat(goalInput);
    if (isNaN(val) || val < 20 || val > 350) return;
    // TODO: await updateDoc(doc(db, 'userGoals', userId), { goalWeight: val });
    setGoalWeight(val); setEditGoal(false);
  }

  const displayed = showAll ? weights : weights.slice(-7);

  return (
    <>
      {/* Current + goal */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ color: C.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Current Weight</div>
            <div style={{ color: C.gold, fontSize: 36, fontWeight: 700, lineHeight: 1, marginTop: 2 }}>
              {current} <span style={{ fontSize: 16, fontWeight: 400 }}>kg</span>
            </div>
            <div style={{ color: isDown ? C.green : C.red, fontSize: 12, marginTop: 4 }}>
              {isDown ? '▼' : '▲'} {Math.abs(delta)} kg since last log
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: C.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Goal Weight</div>
            {editGoal ? (
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <TextInput value={goalInput} onChange={setGoalInput} placeholder="kg" type="number" style={{ width: 60 }} />
                <GoldBtn onClick={saveGoal} style={{ padding: '6px 10px', fontSize: 12 }}>✓</GoldBtn>
              </div>
            ) : (
              <>
                <div style={{ color: C.textMuted, fontSize: 28, fontWeight: 600, marginTop: 2 }}>
                  {goalWeight} <span style={{ fontSize: 14, fontWeight: 400 }}>kg</span>
                </div>
                <button onClick={() => setEditGoal(true)} style={{
                  background: 'none', border: 'none', color: C.textMuted, fontSize: 11,
                  cursor: 'pointer', fontFamily: T.body, textDecoration: 'underline',
                }}>Edit goal</button>
              </>
            )}
          </div>
        </div>

        {/* Progress to goal */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ color: C.textMuted, fontSize: 11 }}>Progress to goal</span>
            <span style={{ color: C.gold, fontSize: 11, fontWeight: 600 }}>
              {current > goalWeight ? `${(current - goalWeight).toFixed(1)} kg to go` : '🎉 Goal reached!'}
            </span>
          </div>
          <ProgressBar pct={pctToGoal} />
          <div style={{ color: C.textMuted, fontSize: 10, marginTop: 4, textAlign: 'right' }}>{pctToGoal}%</div>
        </div>

        {/* Log button */}
        {adding ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <TextInput
              type="number"
              value={newKg}
              onChange={setNewKg}
              placeholder="Enter weight (kg)"
              style={{ flex: 1, minWidth: 120 }}
            />
            <TextInput
              type="number"
              value={heightInput}
              onChange={setHeightInput}
              placeholder="Height (cm)"
              style={{ width: 120 }}
            />
            <GoldBtn onClick={logWeight}>Log</GoldBtn>
            <button onClick={() => { setAdding(false); setNewKg(''); }} style={{
              background: 'none', border: `0.5px solid ${C.borderMid}`, color: C.textMuted,
              padding: '9px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: T.body, fontSize: 12,
            }}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} style={{
            marginTop: 12, width: '100%',
            background: C.goldBg, border: `0.5px solid rgba(240,192,64,0.35)`,
            color: C.gold, padding: '10px', borderRadius: 10,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: T.body,
          }}>
            + Log Today's Weight
          </button>
        )}
      </Card>

      {/* BMI card */}
      <Card>
        <SectionHeading label="Body Mass Index (BMI)" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
            background: `${bmiColor}22`,
            border: `2px solid ${bmiColor}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: bmiColor, fontSize: 20, fontWeight: 700 }}>{bmi}</span>
            <span style={{ color: bmiColor, fontSize: 9, fontWeight: 500 }}>BMI</span>
          </div>
          <div>
            <div style={{ color: bmiColor, fontSize: 16, fontWeight: 700 }}>{bmiLabel}</div>
            <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>Height: {height} cm</div>
            <div style={{ color: C.textMuted, fontSize: 12 }}>Weight: {current} kg</div>
          </div>
        </div>

        {/* BMI scale */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height: 8 }}>
            {[
              { label: 'Under', color: '#4a9af0', pct: 20 },
              { label: 'Normal', color: C.green,  pct: 30 },
              { label: 'Over',  color: C.orange,  pct: 25 },
              { label: 'Obese', color: C.red,     pct: 25 },
            ].map(s => (
              <div key={s.label} style={{ flex: s.pct, background: s.color }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            {['18.5', '25', '30'].map(v => (
              <span key={v} style={{ color: C.textMuted, fontSize: 9 }}>{v}</span>
            ))}
          </div>
        </div>
      </Card>

      {/* Weight history log */}
      <Card>
        <SectionHeading
          label="Weight History"
          right={
            <button onClick={() => setShowAll(s => !s)} style={{
              background: 'none', border: 'none', color: C.textMuted, fontSize: 11,
              cursor: 'pointer', fontFamily: T.body,
            }}>
              {showAll ? 'Show less' : `See all (${weights.length})`}
            </button>
          }
        />

        {/* Sparkline of last 7 */}
        <Sparkline data={weights.slice(-7).map(w => w.kg)} height={50} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, marginBottom: 14 }}>
          <span style={{ color: C.textMuted, fontSize: 10 }}>{weights.at(-7)?.date?.slice(5) || ''}</span>
          <span style={{ color: C.gold, fontSize: 10, fontWeight: 600 }}>Today</span>
        </div>

        {/* Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[...displayed].reverse().map((w, i) => {
            const prev2  = displayed[displayed.length - 2 - i];
            const wDelta = prev2 ? (w.kg - prev2.kg).toFixed(1) : null;
            return (
              <div key={w.date} style={{
                display:       'flex',
                justifyContent:'space-between',
                alignItems:    'center',
                padding:       '8px 0',
                borderBottom:  i < displayed.length - 1 ? `0.5px solid ${C.border}` : 'none',
              }}>
                <span style={{ color: C.textSecondary, fontSize: 13 }}>
                  {new Date(w.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {wDelta !== null && (
                    <span style={{ fontSize: 11, color: Number(wDelta) < 0 ? C.green : Number(wDelta) > 0 ? C.red : C.textMuted }}>
                      {Number(wDelta) < 0 ? '▼' : Number(wDelta) > 0 ? '▲' : '–'} {Math.abs(wDelta)}
                    </span>
                  )}
                  <span style={{ color: C.gold, fontWeight: 700, fontSize: 15 }}>{w.kg} kg</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: WORKOUT SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

function WorkoutsSection({ sessions, sessionTarget, weeklyData, activity }) {
  const pct = Math.round((sessions / sessionTarget) * 100);

  // Days of week breakdown from activity log
  const dayBreakdown = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0]; // Sun–Sat
    activity.forEach(a => { const d = new Date(a.date).getDay(); counts[d]++; });
    return counts;
  }, [activity]);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxDay    = Math.max(...dayBreakdown, 1);

  const totalDuration = useMemo(() => {
    let mins = 0;
    activity.forEach(a => {
      const m = a.duration.match(/(\d+)h\s*(\d+)?m?/);
      if (m) mins += (parseInt(m[1]) || 0) * 60 + (parseInt(m[2]) || 0);
      else { const mm = a.duration.match(/(\d+)m/); if (mm) mins += parseInt(mm[1]); }
    });
    return { h: Math.floor(mins / 60), m: mins % 60 };
  }, [activity]);

  const totalCals = activity.reduce((s, a) => s + (a.calories || 0), 0);

  return (
    <>
      {/* Monthly goal */}
      <Card>
        <SectionHeading label="Monthly Goal" right={<span style={{ color: C.textMuted, fontSize: 11 }}>{sessions} / {sessionTarget}</span>} />
        <ProgressBar pct={pct} height={8} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ color: C.textMuted, fontSize: 11 }}>{sessionTarget - sessions} sessions left</span>
          <span style={{ color: C.gold, fontSize: 11, fontWeight: 600 }}>{pct}%</span>
        </div>
      </Card>

      {/* All-time totals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div style={{ background: C.bgSecondary, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
          <div style={{ color: C.gold, fontSize: 20, fontWeight: 700 }}>{activity.length}</div>
          <div style={{ color: C.textMuted, fontSize: 10, marginTop: 3 }}>Total Sessions</div>
        </div>
        <div style={{ background: C.bgSecondary, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
          <div style={{ color: '#ff6b35', fontSize: 20, fontWeight: 700 }}>{totalDuration.h}h {totalDuration.m}m</div>
          <div style={{ color: C.textMuted, fontSize: 10, marginTop: 3 }}>Total Time</div>
        </div>
        <div style={{ background: C.bgSecondary, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
          <div style={{ color: C.orange, fontSize: 20, fontWeight: 700 }}>{(totalCals / 1000).toFixed(1)}k</div>
          <div style={{ color: C.textMuted, fontSize: 10, marginTop: 3 }}>Calories</div>
        </div>
      </div>

      {/* 8-week trend */}
      <Card>
        <SectionHeading label="8-Week Trend" right={<span style={{ color: C.textMuted, fontSize: 11 }}>sessions / week</span>} />
        <Sparkline data={weeklyData} height={70} />
        <div style={{ display: 'flex', gap: 0, marginTop: 6 }}>
          {weeklyData.map((v, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ color: C.textMuted, fontSize: 9 }}>W{i + 1}</div>
              <div style={{ color: i === weeklyData.length - 1 ? C.gold : C.textSecondary, fontSize: 10, fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Day-of-week breakdown */}
      <Card>
        <SectionHeading label="Favourite Training Days" />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
          {dayBreakdown.map((count, i) => {
            const isMax = count === maxDay && count > 0;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                {count > 0 && <span style={{ color: isMax ? C.gold : C.textMuted, fontSize: 10, fontWeight: 600 }}>{count}</span>}
                <div style={{
                  width:        '100%',
                  height:       `${Math.max(4, Math.round((count / maxDay) * 100))}%`,
                  background:   isMax ? C.gold : '#1e1e1e',
                  borderRadius: '3px 3px 0 0',
                  minHeight:    count === 0 ? 4 : undefined,
                  opacity:      count === 0 ? 0.3 : 1,
                }} />
                <span style={{ color: isMax ? C.gold : C.textMuted, fontSize: 10 }}>{dayLabels[i]}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: PERSONAL RECORDS
// ─────────────────────────────────────────────────────────────────────────────

function RecordsSection({ prs, setPRs }) {
  const [adding,    setAdding]    = useState(false);
  const [editing,   setEditing]   = useState(null); // id
  const [form,      setForm]      = useState({ exercise: '', value: '', unit: 'kg' });
  const [expanded,  setExpanded]  = useState(null);  // id for expanded view

  const UNITS = ['kg', 'lbs', 'reps', 'min', 'sec', 'm', 'km'];

  function savePR() {
    if (!form.exercise.trim() || !form.value) return;
    const today = new Date().toISOString().split('T')[0];
    if (editing !== null) {
      // TODO: await updateDoc(doc(db, 'personalRecords', editing), { value: Number(form.value), date: today });
      setPRs(prev => prev.map(r =>
        r.id === editing
          ? { ...r, exercise: form.exercise, prev: r.value, value: Number(form.value), unit: form.unit, date: today }
          : r
      ));
      setEditing(null);
    } else {
      // TODO: await addDoc(collection(db, 'personalRecords'), { ...form, value: Number(form.value), userId, date: today });
      setPRs(prev => [...prev, {
        id:       Date.now(),
        exercise: form.exercise,
        value:    Number(form.value),
        unit:     form.unit,
        date:     today,
        prev:     null,
      }]);
    }
    setForm({ exercise: '', value: '', unit: 'kg' }); setAdding(false);
  }

  function startEdit(pr) {
    setForm({ exercise: pr.exercise, value: String(pr.value), unit: pr.unit });
    setEditing(pr.id); setAdding(true);
  }

  function deletePR(id) {
    // TODO: await deleteDoc(doc(db, 'personalRecords', id));
    setPRs(prev => prev.filter(r => r.id !== id));
  }

  return (
    <>
      {/* Inline form */}
      {adding ? (
        <Card>
          <SectionHeading label={editing !== null ? 'Update Record' : 'New Personal Record'} />
          <TextInput
            value={form.exercise}
            onChange={v => setForm(f => ({ ...f, exercise: v }))}
            placeholder="Exercise name (e.g. Bench Press)"
            style={{ width: '100%', marginBottom: 8 }}
          />
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <TextInput
              type="number"
              value={form.value}
              onChange={v => setForm(f => ({ ...f, value: v }))}
              placeholder="Value"
              style={{ flex: 2 }}
            />
            <select
              value={form.unit}
              onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
              style={{
                flex: 1, background: '#0f0f0f', border: `0.5px solid ${C.borderMid}`,
                color: C.textPrimary, padding: '9px 8px', borderRadius: 8,
                fontSize: 13, fontFamily: T.body,
              }}
            >
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <GoldBtn onClick={savePR} style={{ flex: 1 }}>
              {editing !== null ? 'Update' : 'Save PR'}
            </GoldBtn>
            <button onClick={() => { setAdding(false); setEditing(null); setForm({ exercise: '', value: '', unit: 'kg' }); }}
              style={{
                flex: 1, background: 'none', border: `0.5px solid ${C.borderMid}`,
                color: C.textMuted, padding: '9px', borderRadius: 8,
                cursor: 'pointer', fontFamily: T.body, fontSize: 13,
              }}>
              Cancel
            </button>
          </div>
        </Card>
      ) : (
        <button onClick={() => setAdding(true)} style={{
          width: '100%', marginBottom: 10,
          background: C.goldBg, border: `0.5px solid rgba(240,192,64,0.35)`,
          color: C.gold, padding: '12px', borderRadius: 12,
          fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: T.body,
        }}>
          + Add Personal Record
        </button>
      )}

      {/* PRs list */}
      {prs.length === 0 ? (
        <Card>
          <div style={{ color: C.textMuted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
            No PRs yet. Hit the button above to log your first one! 💪
          </div>
        </Card>
      ) : (
        prs.map(pr => {
          const isExpanded = expanded === pr.id;
          const improved   = pr.prev !== null ? (pr.value - pr.prev) : null;
          const isImproved = improved !== null && pr.unit !== 'min' && pr.unit !== 'sec' ? improved > 0 : improved < 0;
          return (
            <div key={pr.id} style={{
              background:   C.bgSecondary,
              border:       `0.5px solid ${C.border}`,
              borderRadius: 12,
              padding:      12,
              marginBottom: 8,
              cursor:       'pointer',
              transition:   'border-color 0.2s',
            }}
              onClick={() => setExpanded(isExpanded ? null : pr.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Gold medal / badge */}
                <div style={{
                  width:          38,
                  height:         38,
                  flexShrink:     0,
                  background:     C.goldBg,
                  border:         `1px solid ${C.gold}`,
                  borderRadius:   8,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       18,
                }}>
                  🏅
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ color: C.textPrimary, fontWeight: 500, fontSize: 14 }}>{pr.exercise}</div>
                  <div style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>
                    {new Date(pr.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: C.gold, fontWeight: 700, fontSize: 20 }}>
                    {pr.value} <span style={{ fontSize: 12, fontWeight: 400, color: C.textMuted }}>{pr.unit}</span>
                  </div>
                  {improved !== null && (
                    <div style={{ color: isImproved ? C.green : C.red, fontSize: 11, marginTop: 2 }}>
                      {isImproved ? '▲' : '▼'} {Math.abs(improved)} {pr.unit}
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${C.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ color: C.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Previous PR</div>
                      <div style={{ color: C.textSecondary, fontSize: 15, fontWeight: 600, marginTop: 2 }}>
                        {pr.prev !== null ? `${pr.prev} ${pr.unit}` : '—'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: C.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Improvement</div>
                      <div style={{ color: isImproved ? C.green : C.red, fontSize: 15, fontWeight: 600, marginTop: 2 }}>
                        {improved !== null ? `${isImproved ? '+' : ''}${improved} ${pr.unit}` : 'First log'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={e => { e.stopPropagation(); startEdit(pr); }}
                      style={{
                        flex: 1, background: C.goldBg, border: `0.5px solid ${C.gold}`,
                        color: C.gold, padding: '8px', borderRadius: 8,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.body,
                      }}>
                      ✏️ Update PR
                    </button>
                    <button onClick={e => { e.stopPropagation(); deletePR(pr.id); }}
                      style={{
                        flex: 1, background: C.redBg, border: `0.5px solid ${C.redBorder}`,
                        color: C.red, padding: '8px', borderRadius: 8,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.body,
                      }}>
                      🗑 Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: ACTIVITY LOG
// ─────────────────────────────────────────────────────────────────────────────

function ActivitySection({ activity, setActivity }) {
  const [focusFilter, setFocusFilter] = useState('All Focus');
  const [expanded,   setExpanded]     = useState(null);
  const [addingLog,  setAddingLog]    = useState(false);
  const [logForm,    setLogForm]      = useState({
    date: new Date().toISOString().split('T')[0],
    time: '06:00 AM', type: 'Workout',
    focus: '', duration: '', calories: '', notes: '',
  });

  const FOCUS_OPTIONS = [
    'Chest & Triceps', 'Back & Biceps', 'Leg Day',
    'Shoulders & Arms', 'Full Body', 'Cardio', 'Deadlift Focus',
    'Push Day', 'Pull Day', 'Cardio & Endurance', 'Other',
  ];

  // Filter
  const filtered = useMemo(() => {
    return activity.filter(a => {
      const focusOk = focusFilter === 'All Focus' || a.focus?.includes(focusFilter.replace('All Focus', ''));
      return focusOk;
    });
  }, [activity, focusFilter]);

  function saveLog() {
    if (!logForm.focus || !logForm.duration) return;
    // TODO: await addDoc(collection(db, 'workoutLogs'), { ...logForm, userId, createdAt: serverTimestamp() });
    const newEntry = { id: Date.now(), ...logForm, calories: Number(logForm.calories) || 0 };
    setActivity(prev => [newEntry, ...prev].sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)));
    setLogForm({ date: new Date().toISOString().split('T')[0], time: '06:00 AM', type: 'Morning Session', focus: '', duration: '', calories: '', notes: '' });
    setAddingLog(false);
  }

  const typeColor = type => {
    if (type?.includes('Morning')) return { icon: '🌅', color: '#4a9af0', bg: '#0f1a2a' };
    if (type?.includes('Evening')) return { icon: '🌙', color: '#aa4af0', bg: '#1a0f2a' };
    return                                 { icon: '💪', color: C.gold,   bg: C.goldBg };
  };

  const inp = {
    background: '#0f0f0f', border: `0.5px solid ${C.borderMid}`, color: C.textPrimary,
    padding: '9px 11px', borderRadius: 8, fontSize: 13, fontFamily: T.body, outline: 'none',
  };

  return (
    <>
      {/* Add log form */}
      {addingLog ? (
        <Card>
          <SectionHeading label="Log a Workout" />
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 5 }}>Date</div>
              <input type="date" value={logForm.date} onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))} style={{ ...inp, width: '100%', colorScheme: 'dark' }} />
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 5 }}>Focus / Muscle Group</div>
            <select value={logForm.focus} onChange={e => setLogForm(f => ({ ...f, focus: e.target.value }))} style={{ ...inp, width: '100%' }}>
              <option value="">Select focus…</option>
              {FOCUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 5 }}>Duration</div>
              <TextInput value={logForm.duration} onChange={v => setLogForm(f => ({ ...f, duration: v }))} placeholder="e.g. 1h 20m" style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 5 }}>Calories (optional)</div>
              <TextInput type="number" value={logForm.calories} onChange={v => setLogForm(f => ({ ...f, calories: v }))} placeholder="kcal" style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 5 }}>Notes (optional)</div>
            <textarea
              value={logForm.notes}
              onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="How did it go? PRs, mood, observations…"
              rows={3}
              style={{ ...inp, width: '100%', resize: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <GoldBtn onClick={saveLog} style={{ flex: 1 }}>Save Workout</GoldBtn>
            <button onClick={() => setAddingLog(false)} style={{
              flex: 1, background: 'none', border: `0.5px solid ${C.borderMid}`,
              color: C.textMuted, padding: '9px', borderRadius: 8,
              cursor: 'pointer', fontFamily: T.body, fontSize: 13,
            }}>Cancel</button>
          </div>
        </Card>
      ) : (
        <button onClick={() => setAddingLog(true)} style={{
          width: '100%', marginBottom: 10,
          background: C.goldBg, border: `0.5px solid rgba(240,192,64,0.35)`,
          color: C.gold, padding: '12px', borderRadius: 12,
          fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: T.body,
        }}>
          + Log a Workout
        </button>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 10 }}>

      </div>

      {/* Summary bar */}
      <div style={{
        background: C.bgSecondary, border: `0.5px solid ${C.border}`,
        borderRadius: 10, padding: '10px 14px', marginBottom: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ color: C.textMuted, fontSize: 12 }}>{filtered.length} session{filtered.length !== 1 ? 's' : ''} found</span>
        <span style={{ color: C.gold, fontSize: 12, fontWeight: 600 }}>
          {filtered.reduce((s, a) => s + (a.calories || 0), 0).toLocaleString()} cal total
        </span>
      </div>

      {/* Log entries */}
      {filtered.length === 0 ? (
        <Card>
          <div style={{ color: C.textMuted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
            No sessions match this filter.
          </div>
        </Card>
      ) : (
        filtered.map((a, i) => {
          const tc        = typeColor(a.type);
          const isExpanded = expanded === a.id;
          return (
            <div
              key={a.id}
              onClick={() => setExpanded(isExpanded ? null : a.id)}
              style={{
                background:   C.bgSecondary,
                border:       `0.5px solid ${isExpanded ? C.gold : C.border}`,
                borderRadius: 12,
                padding:      12,
                marginBottom: 8,
                cursor:       'pointer',
                transition:   'border-color 0.2s',
              }}
            >
              {/* Collapsed row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38, height: 38, flexShrink: 0,
                  background: tc.bg, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>
                  {tc.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: C.textPrimary, fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.focus}
                  </div>
                  <div style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>
                    {new Date(a.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · {a.time}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                  <span style={{ background: tc.bg, color: tc.color, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6 }}>
                    {a.duration}
                  </span>
                  {a.calories > 0 && (
                    <span style={{ color: C.textMuted, fontSize: 10 }}>🔥 {a.calories} cal</span>
                  )}
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${C.border}` }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    <div style={{ flex: 1, background: '#0f0f0f', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ color: C.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Duration</div>
                      <div style={{ color: C.gold, fontSize: 16, fontWeight: 600, marginTop: 4 }}>{a.duration}</div>
                    </div>
                    <div style={{ flex: 1, background: '#0f0f0f', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ color: C.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Calories</div>
                      <div style={{ color: '#ff6b35', fontSize: 16, fontWeight: 600, marginTop: 4 }}>{a.calories > 0 ? `${a.calories} kcal` : '—'}</div>
                    </div>
                    <div style={{ flex: 1, background: '#0f0f0f', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ color: C.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Type</div>
                      <div style={{ color: tc.color, fontSize: 12, fontWeight: 600, marginTop: 4 }}>{a.type}</div>
                    </div>
                  </div>
                  {a.notes ? (
                    <div style={{ background: '#0f0f0f', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ color: C.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Notes</div>
                      <div style={{ color: C.textSecondary, fontSize: 13, lineHeight: 1.55 }}>{a.notes}</div>
                    </div>
                  ) : (
                    <div style={{ color: C.textMuted, fontSize: 12, fontStyle: 'italic' }}>No notes for this session.</div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
      <div style={{ height: 8 }} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT: ProgressTab
// ─────────────────────────────────────────────────────────────────────────────

const INNER_TABS = [
  { id: 'records',   label: 'Records'   },
  { id: 'activity',  label: 'Activity'  },
];

export default function ProgressTab() {
  const [activeTab, setActiveTab] = useState('records');

  // ── State — replace each with a Firebase listener / API call ──────────────
  // TODO: const { data: weights }  = useFirestoreCollection('weightLogs',  where('userId','==',uid), orderBy('date'));
  const [weights,      setWeights]      = useState(MOCK_WEIGHTS);
  const [goalWeight,   setGoalWeight]   = useState(MOCK_GOAL_WEIGHT);
  // TODO: const { data: prs }      = useFirestoreCollection('personalRecords', where('userId','==',uid));
  const [prs,          setPRs]          = useState(MOCK_PRS);
  // TODO: const { data: activity } = useFirestoreCollection('workoutLogs',   where('userId','==',uid), orderBy('date','desc'));
  const [activity,     setActivity]     = useState(MOCK_ACTIVITY);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bgPrimary }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        background:   C.bgPrimary,
        padding:      '14px 20px 0',
        borderBottom: `0.5px solid ${C.border}`,
        flexShrink:   0,
      }}>
        <div style={{ color: C.textPrimary, fontSize: 18, fontWeight: 600 }}>Progress Report</div>
        <div style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>Track your fitness journey</div>

        {/* Inner tab strip */}
        <div style={{
          display:    'flex',
          gap:        0,
          marginTop:  12,
          overflowX:  'auto',
        }}>
          {INNER_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex:         '0 0 auto',
                  padding:      '8px 16px',
                  fontSize:     12,
                  fontWeight:   isActive ? 600 : 500,
                  cursor:       'pointer',
                  background:   'transparent',
                  border:       'none',
                  borderBottom: `2px solid ${isActive ? C.gold : 'transparent'}`,
                  color:        isActive ? C.gold : C.textMuted,
                  fontFamily:   T.body,
                  transition:   'all 0.15s',
                  whiteSpace:   'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Scrollable content ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 0' }}>
        {activeTab === 'overview' && (
          <OverviewSection
            weights={weights}
            weeklyData={MOCK_WEEKLY_SESSIONS}
            sessions={MOCK_SESSIONS_THIS_MONTH}
            sessionTarget={MOCK_SESSION_TARGET}
            streak={MOCK_STREAK}
            activity={activity}
            prs={prs}
          />
        )}

        {activeTab === 'weight' && (
          <WeightSection
            weights={weights}
            setWeights={setWeights}
            goalWeight={goalWeight}
            setGoalWeight={setGoalWeight}
            heightCm={MOCK_HEIGHT_CM}
          />
        )}

        {activeTab === 'records' && (
          <RecordsSection prs={prs} setPRs={setPRs} />
        )}

        {activeTab === 'activity' && (
          <ActivitySection activity={activity} setActivity={setActivity} />
        )}

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}