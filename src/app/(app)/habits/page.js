'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { useApp } from '@/context/AppContext';
import styles from './habits.module.css';

const presetEmojis = ['🏃', '📚', '🧘', '💧', '🥗', '😴', '💪', '🚭', '🧹', '🎨', '📝', '🎸'];

export default function HabitsPage() {
  const { habits, addHabit, toggleHabit } = useApp();
  
  // Creation form state
  const [showCreator, setShowCreator] = useState(false);
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(presetEmojis[0]);
  const [target, setTarget] = useState(7); // default 7 days/week

  const handleCreateHabit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    addHabit({
      name: name.trim(),
      emoji: selectedEmoji,
      target: Number(target),
    });

    setName('');
    setShowCreator(false);
  };

  // Helper: Get dates for the last 7 days starting from today going backward
  const getLast7Days = () => {
    const list = [];
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push({
        dateStr: d.toISOString().split('T')[0],
        dayLetter: days[d.getDay()],
        dayNum: d.getDate(),
      });
    }
    return list;
  };

  const last7Days = getLast7Days();

  return (
    <>
      <PageHeader
        title="Habits"
        actions={
          <button
            className="btn btn-primary"
            onClick={() => setShowCreator(!showCreator)}
          >
            {showCreator ? 'Cancel' : '+ New Habit'}
          </button>
        }
      />

      <div className={`page-content ${styles.habitsPage}`}>
        {/* Creator Panel */}
        {showCreator && (
          <div className={`glass-card ${styles.creatorCard} page-enter`}>
            <h3>Create Habit Tracker</h3>
            <form onSubmit={handleCreateHabit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Habit Name</label>
                <input
                  type="text"
                  placeholder="e.g. Drink 3L Water, Meditate..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Weekly Target</label>
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className={styles.select}
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <option key={num} value={num}>
                        {num} day{num > 1 ? 's' : ''} a week
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Icon / Emoji</label>
                  <div className={styles.emojiList}>
                    {presetEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className={`${styles.emojiBtn} ${selectedEmoji === emoji ? styles.selectedEmoji : ''}`}
                        onClick={() => setSelectedEmoji(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowCreator(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Create Tracker 🔥
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Habits Grid */}
        {habits.length === 0 ? (
          <div className={`glass-card ${styles.emptyState} page-enter`}>
            <div className={styles.emptyIcon}>🔥</div>
            <h3>No Habits tracked yet</h3>
            <p>Establish healthy routines! Create your first habit tracker above.</p>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowCreator(true)}>
              Setup Habit
            </button>
          </div>
        ) : (
          <div className={`${styles.habitsGrid} stagger-children`}>
            {habits.map((habit, index) => {
              const todayStr = new Date().toISOString().split('T')[0];
              const completedToday = habit.history.includes(todayStr);

              return (
                <div
                  key={habit.id}
                  className={`glass-card ${styles.habitCard} page-enter`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.habitIconBg}>
                      <span className={styles.habitEmoji}>{habit.emoji}</span>
                    </div>
                    <div className={styles.habitHeaderInfo}>
                      <h3 className={styles.habitName}>{habit.name}</h3>
                      <span className={styles.habitGoal}>Goal: {habit.target}x / week</span>
                    </div>

                    <button
                      className={`${styles.checkoffBtn} ${completedToday ? styles.checkedBtn : ''}`}
                      onClick={() => toggleHabit(habit.id)}
                      aria-label={completedToday ? 'Unmark done' : 'Mark done'}
                    >
                      {completedToday ? '✓ Done' : '🔥 Complete'}
                    </button>
                  </div>

                  {/* Streak and Completion Status */}
                  <div className={styles.habitStatusRow}>
                    <div className={styles.streakCount}>
                      <span className={styles.fireIcon}>🔥</span>
                      <span className={styles.streakVal}>{habit.streak}</span>
                      <span className={styles.streakLabel}>day streak</span>
                    </div>
                    <div className={styles.weeklyProgressBadge}>
                      Completed: {habit.history.length} times
                    </div>
                  </div>

                  {/* 7-day mini tracker */}
                  <div className={styles.miniTrackerContainer}>
                    <div className={styles.miniTrackerTitle}>Last 7 Days</div>
                    <div className={styles.dotGrid}>
                      {last7Days.map((day) => {
                        const isDone = habit.history.includes(day.dateStr);
                        return (
                          <div key={day.dateStr} className={styles.dotWrapper}>
                            <div
                              className={`${styles.historyDot} ${isDone ? styles.dotCompleted : ''}`}
                              title={isDone ? `Completed on ${day.dateStr}` : `Missed on ${day.dateStr}`}
                            />
                            <span className={styles.dotLabel}>{day.dayLetter}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
