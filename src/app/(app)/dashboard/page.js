'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { useApp } from '@/context/AppContext';
import TaskModal from '@/components/dashboard/TaskModal';
import { DashboardSkeleton } from '@/components/layout/SkeletonLoader';
import styles from './dashboard.module.css';

/* ---- Helpers ---- */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}



export default function DashboardPage() {
  const { user, tasks, toggleTask, habits, goals, events, loading, preferences } = useApp();
  const [fabOpen, setFabOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [aiTip, setAiTip] = useState('✨ Analyzing your stats...');
  const [mounted, setMounted] = useState(false);

  // Filter tasks for today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.dueDate === todayStr || !t.dueDate);
  const completedCount = todayTasks.filter((t) => t.done).length;
  
  // Calculate best streak
  const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  
  // Calculate focus today (assume ~1.2 hrs per completed task)
  const focusToday = (completedCount * 1.2).toFixed(1);

  const fetchInsight = async () => {
    setAiTip('✨ Analyzing your stats...');
    try {
      const res = await fetch('/api/ai/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'dashboard',
          stats: {
            completedTasks: completedCount,
            activeGoals: goals.length,
            bestStreak,
            focusHours: focusToday
          }
        })
      });
      const data = await res.json();
      setAiTip(data.insight);
    } catch (err) {
      setAiTip('✨ Keep up the great work! You are making steady progress.');
    }
  };

  useEffect(() => {
    setMounted(true);
    if (!loading && preferences.aiDailyTips) {
      fetchInsight();
    }
  }, [loading, preferences.aiDailyTips]); // Only fetch when data has finished loading and insights are enabled

  if (!mounted) return null;
  
  if (loading) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <div className="page-content">
          <DashboardSkeleton />
        </div>
      </>
    );
  }



  return (
    <>
      <PageHeader
        title="Dashboard"
      />

      <div className={`page-content ${styles.dashboard}`}>
        {/* Greeting */}
        <section className={`${styles.greeting} page-enter`}>
          <h1>{getGreeting()}, {user?.name || 'Guest'} 👋</h1>
          <p className={styles.greetingSub}>
            You have <strong className="text-teal">{todayTasks.length - completedCount} tasks</strong> remaining today.
            Let&apos;s make it count!
          </p>
        </section>

        {/* AI Insight — only shown when enabled in Settings */}
        {preferences.aiDailyTips && (
          <section className={`glass-card ${styles.aiCard} page-enter`} style={{ animationDelay: '100ms' }}>
            <div className={styles.aiCardHeader}>
              <span className={styles.aiIcon}>✨</span>
              <span className={styles.aiLabel}>AI Insight</span>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: 'auto' }}
                onClick={fetchInsight}
              >
                ↻ Refresh
              </button>
            </div>
            <p className={styles.aiText}>{aiTip}</p>
          </section>
        )}

        {/* Stats Row */}
        <div className={`${styles.statsRow} stagger-children`}>
          <div className={`glass-card ${styles.statCard} animate-on-scroll visible`}>
            <div className={styles.statValue}>{completedCount}/{todayTasks.length}</div>
            <div className={styles.statLabel}>Tasks Done</div>
            <div className="progress-bar" style={{ marginTop: 'var(--space-3)' }}>
              <div className="progress-bar-fill" style={{ width: `${todayTasks.length > 0 ? (completedCount / todayTasks.length) * 100 : 0}%` }} />
            </div>
          </div>
          <div className={`glass-card ${styles.statCard} animate-on-scroll visible`}>
            <div className={styles.statValue}>
              <span className="text-amber">🔥</span> {bestStreak}
            </div>
            <div className={styles.statLabel}>Best Streak</div>
          </div>
          <div className={`glass-card ${styles.statCard} animate-on-scroll visible`}>
            <div className={styles.statValue}>{goals.length}</div>
            <div className={styles.statLabel}>Active Goals</div>
          </div>
          <div className={`glass-card ${styles.statCard} animate-on-scroll visible`}>
            <div className={styles.statValue}>{focusToday}h</div>
            <div className={styles.statLabel}>Focus Today</div>
          </div>
        </div>

        {/* Main Grid */}
        <div className={styles.mainGrid}>
          {/* Today's Tasks */}
          <section className={`glass-card ${styles.tasksCard} page-enter`} style={{ animationDelay: '200ms' }}>
            <div className={styles.cardHeader}>
              <h2>Today&apos;s Tasks</h2>
              <span className="badge badge-teal">{todayTasks.length - completedCount} remaining</span>
            </div>
            <div className={styles.taskList}>
              {todayTasks.length === 0 ? (
                <div style={{ padding: 'var(--space-8) 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No tasks for today. Click the floating action button to create one!
                </div>
              ) : (
                todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`${styles.taskItem} ${task.done ? styles.taskDone : ''}`}
                    onClick={() => toggleTask(task.id)}
                  >
                    <div className={styles.taskCheck}>
                      <div className={`${styles.checkbox} ${task.done ? styles.checked : ''}`}>
                        {task.done && '✓'}
                      </div>
                    </div>
                    <div className={styles.taskMarker}>
                      {task.marker.type === 'EMOJI' ? (
                        <span>{task.marker.value}</span>
                      ) : (
                        <span
                          className={styles.colorDot}
                          style={{ background: task.marker.value }}
                        />
                      )}
                    </div>
                    <div className={styles.taskInfo}>
                      <span className={styles.taskTitle}>{task.title}</span>
                      <span className={styles.taskTime}>{task.dueTime || 'All Day'}</span>
                    </div>
                    <span className={`badge ${
                      task.priority === 'HIGH' ? 'badge-rose' :
                      task.priority === 'MEDIUM' ? 'badge-amber' : 'badge-blue'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Right Column */}
          <div className={styles.rightCol}>
            {/* Habits */}
            {preferences.habitAlerts && (
              <section className={`glass-card page-enter`} style={{ animationDelay: '300ms' }}>
                <div className={styles.cardHeader}>
                  <h2>Habit Streaks</h2>
                  <span className="badge badge-amber">🔥 Active</span>
                </div>
                <div className={styles.habitList}>
                  {habits.length === 0 ? (
                    <div style={{ padding: 'var(--space-4) 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No habits set up yet.
                    </div>
                  ) : (
                    habits.map((habit) => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const doneToday = habit.history.includes(todayStr);
                      return (
                        <div key={habit.id} className={styles.habitItem}>
                          <span className={styles.habitEmoji}>{habit.emoji}</span>
                          <div className={styles.habitInfo}>
                            <span className={styles.habitName}>{habit.name}</span>
                            <div className="progress-bar" style={{ height: '4px' }}>
                              <div
                                className="progress-bar-fill"
                                style={{ width: `${(habit.completed / habit.target) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div className={styles.habitStreak}>
                            <span className={styles.streakNum}>{habit.streak}</span>
                            <span className={styles.streakLabel}>days</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            )}

            {/* Upcoming */}
            <section className={`glass-card page-enter`} style={{ animationDelay: '400ms' }}>
              <div className={styles.cardHeader}>
                <h2>Upcoming Meetings</h2>
                <span className="badge badge-purple">📅 Today</span>
              </div>
              <div className={styles.eventList}>
                {events.filter(e => e.date === todayStr).length === 0 ? (
                  <div style={{ padding: 'var(--space-4) 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No meetings scheduled for today.
                  </div>
                ) : (
                  events
                    .filter(e => e.date === todayStr)
                    .map((event) => (
                      <div key={event.id} className={styles.eventItem}>
                        <div className={styles.eventTime}>{event.time}</div>
                        <div className={`${styles.eventDot} ${styles[event.type]}`} />
                        <div className={styles.eventTitle}>{event.title}</div>
                      </div>
                    ))
                )}
              </div>
            </section>

            {/* Goals */}
            <section className={`glass-card page-enter`} style={{ animationDelay: '500ms' }}>
              <div className={styles.cardHeader}>
                <h2>Active Goals</h2>
              </div>
              <div className={styles.goalList}>
                {goals.length === 0 ? (
                  <div style={{ padding: 'var(--space-4) 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No active goals.
                  </div>
                ) : (
                  goals.map((goal) => (
                    <div key={goal.id} className={styles.goalItem}>
                      <span className={styles.goalEmoji}>{goal.emoji}</span>
                      <div className={goal.done ? `${styles.goalInfo} ${styles.goalDone}` : styles.goalInfo}>
                        <div className={styles.goalTop}>
                          <span className={styles.goalTitle}>{goal.title}</span>
                          <span className={styles.goalPct}>{goal.progress}%</span>
                        </div>
                        <div className="progress-bar" style={{ height: '4px' }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${goal.progress}%`,
                              background: goal.progress > 60 ? 'var(--gradient-teal)' : 'var(--gradient-purple)',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        className="fab"
        onClick={() => setFabOpen(!fabOpen)}
        aria-label="Quick add"
      >
        {fabOpen ? '✕' : '+'}
      </button>
      <div className={`fab-menu ${fabOpen ? 'open' : ''}`}>
        <div className="fab-menu-item">
          <span className="fab-menu-label" onClick={() => { setModalOpen(true); setFabOpen(false); }}>Add Task</span>
        </div>
      </div>

      {/* Task Modal */}
      {modalOpen && (
        <TaskModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
