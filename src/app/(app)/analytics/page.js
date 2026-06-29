'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { useApp } from '@/context/AppContext';
import styles from './analytics.module.css';

export default function AnalyticsPage() {
  const { tasks, habits, goals, user, loading, preferences } = useApp();
  const [aiTip, setAiTip] = useState('✨ Analyzing your historical trends...');
  const [mounted, setMounted] = useState(false);

  // 1. Calculate KPIs
  const completedTasks = tasks.filter(t => t.done).length;
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const completedHabitsCount = habits.reduce((acc, h) => acc + h.history.length, 0);
  const averageHabitStreak = habits.length > 0 ? Math.round(habits.reduce((acc, h) => acc + h.streak, 0) / habits.length) : 0;
  const activeGoalsCount = goals.filter(g => g.progress < 100).length;
  const completedGoalsCount = goals.filter(g => g.progress === 100).length;
  
  const totalFocusHours = (completedTasks * 1.2).toFixed(1);

  useEffect(() => {
    setMounted(true);
    if (!loading && preferences.aiDailyTips) {
      const fetchInsight = async () => {
        try {
          const res = await fetch('/api/ai/insight', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'analytics',
              stats: { completedTasks, activeGoals: activeGoalsCount, bestStreak: averageHabitStreak, focusHours: totalFocusHours }
            })
          });
          const data = await res.json();
          setAiTip(data.insight);
        } catch (err) {
          setAiTip('✨ You are building great momentum. Consistency is key!');
        }
      };
      fetchInsight();
    }
  }, [loading, preferences.aiDailyTips]);

  // Export handlers
  const downloadJSON = () => {
    const reportData = {
      exportDate: new Date().toISOString(),
      user: user || { name: 'Guest User', email: 'guest@productivity.ai' },
      metrics: {
        taskCompletionRate,
        averageHabitStreak,
        activeGoalsCount,
        completedGoalsCount
      },
      data: {
        tasks,
        habits,
        goals
      }
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `productivity_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    window.print();
  };

  // 2. Bar Chart Data (Tasks completed per weekday)
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const completionData = last7Days.map(dateStr => {
    const d = new Date(dateStr);
    const dayName = daysOfWeek[d.getDay()];
    // If task has no dueDate, we only count it for today
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    const tasksOnDay = tasks.filter(t => t.dueDate === dateStr || (!t.dueDate && isToday));
    return {
      day: dayName,
      completed: tasksOnDay.filter(t => t.done).length,
      total: tasksOnDay.length > 0 ? tasksOnDay.length : 1
    };
  });

  const maxVal = Math.max(...completionData.map(d => d.total));
  const barChartHeight = 150;

  // 3. Category distribution (Donut chart representation)
  const categoryCounts = tasks.reduce((acc, task) => {
    const cat = task.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const totalCategories = Object.values(categoryCounts).reduce((a, b) => a + b, 0) || 1;
  
  // Only show real categories from actual user tasks — no fake placeholders
  const finalCategories = totalTasks > 0 ? Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    percentage: Math.round((count / totalCategories) * 100),
    count
  })) : [];

  return (
    <>
      <PageHeader 
        title="Analytics Insights" 
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button 
              onClick={downloadJSON} 
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', whiteSpace: 'nowrap' }}
            >
              📥 Export Data (JSON)
            </button>
            <button 
              onClick={downloadPDF} 
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', whiteSpace: 'nowrap' }}
            >
              📄 Download PDF Report
            </button>
          </div>
        }
      />

      <div className={`page-content ${styles.analyticsPage}`}>
        {/* KPI Grid */}
        <div className={`${styles.kpiRow} stagger-children`}>
          <div className={`glass-card ${styles.kpiCard} page-enter`}>
            <div className={styles.kpiIcon}>📊</div>
            <div className={styles.kpiVal}>{taskCompletionRate}%</div>
            <div className={styles.kpiLabel}>Task Completion Rate</div>
          </div>
          
          <div className={`glass-card ${styles.kpiCard} page-enter`}>
            <div className={styles.kpiIcon}>🔥</div>
            <div className={styles.kpiVal}>{averageHabitStreak} days</div>
            <div className={styles.kpiLabel}>Avg Habit Streak</div>
          </div>

          <div className={`glass-card ${styles.kpiCard} page-enter`}>
            <div className={styles.kpiIcon}>🎯</div>
            <div className={styles.kpiVal}>{activeGoalsCount} Active</div>
            <div className={styles.kpiLabel}>Goals in Progress</div>
          </div>

          <div className={`glass-card ${styles.kpiCard} page-enter`}>
            <div className={styles.kpiIcon}>⚡</div>
            <div className={styles.kpiVal}>{totalFocusHours} hrs</div>
            <div className={styles.kpiLabel}>Total Focus Time</div>
          </div>
        </div>

        {/* AI Insight Header - only shown when enabled in Settings */}
        {preferences.aiDailyTips && (
          <div className={`glass-card ${styles.aiInsightCard} page-enter`} style={{ animationDelay: '100ms' }}>
            <span className={styles.aiIcon}>✨</span>
            <p className={styles.aiText}>{aiTip}</p>
          </div>
        )}

        {/* Charts Row */}
        <div className={styles.chartsGrid}>
          {/* Weekly Task Bar Chart */}
          <div className={`glass-card ${styles.chartCard} page-enter`}>
            <h3 className={styles.chartTitle}>Weekly Task Completion Trends</h3>
            <div className={styles.barChartContainer}>
              <svg viewBox="0 0 500 200" className={styles.barChartSvg}>
                {/* Defs for gradients and glow filters */}
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(172, 80%, 55%)" />
                    <stop offset="100%" stopColor="hsl(195, 80%, 40%)" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Y Axis Grid lines */}
                {[0, 25, 50, 75, 100].map((pct, idx) => {
                  const yVal = 180 - (150 * pct) / 100;
                  return (
                    <g key={idx}>
                      <line x1="40" y1={yVal} x2="480" y2={yVal} className={styles.gridLine} />
                      <text x="15" y={yVal + 4} className={styles.axisLabel}>{pct}%</text>
                    </g>
                  );
                })}

                {/* Bars */}
                {completionData.map((data, idx) => {
                  const pct = data.total > 0 ? (data.completed / data.total) * 100 : 0;
                  const barH = (pct * 150) / 100;
                  const barW = 32;
                  const xVal = 65 + idx * 60;
                  const yVal = 180 - barH;

                  return (
                    <g key={idx}>
                      {/* Background Bar track */}
                      <rect
                        x={xVal}
                        y={30}
                        width={barW}
                        height={150}
                        rx="4"
                        className={styles.barTrack}
                      />
                      {/* Glowing Filled Bar */}
                      <rect
                        x={xVal}
                        y={yVal}
                        width={barW}
                        height={barH}
                        rx="4"
                        fill="url(#barGrad)"
                        filter="url(#glow)"
                        className={styles.glowingBar}
                      />
                      {/* Day Label */}
                      <text x={xVal + 16} y="195" textAnchor="middle" className={styles.axisLabel}>
                        {data.day}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Category Distribution Donut Chart */}
          <div className={`glass-card ${styles.chartCard} page-enter`}>
            <h3 className={styles.chartTitle}>Task Distribution by Category</h3>
            {finalCategories.length === 0 ? (
              <div style={{ padding: 'var(--space-8) 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📊</p>
                <p>No tasks yet. Create some tasks to see your category distribution here!</p>
              </div>
            ) : (
              <div className={styles.donutChartContainer}>
                <svg viewBox="0 0 200 200" className={styles.donutSvg}>
                  {/* Radial Donut ring utilizing stroke dash arrays */}
                  <circle
                    cx="100"
                    cy="100"
                    r="65"
                    className={styles.donutTrack}
                  />
                  
                  {/* Radial sectors representing categories */}
                  {finalCategories.map((cat, idx) => {
                    const radius = 65;
                    const circumference = 2 * Math.PI * radius;
                    const strokeLength = (cat.percentage / 100) * circumference;
                    const rotationAngle = finalCategories.slice(0, idx).reduce((acc, c) => acc + (c.percentage / 100) * 360, 0);

                    const strokeColors = [
                      'var(--accent-teal)',
                      'var(--accent-purple)',
                      'var(--accent-amber)',
                      'var(--accent-blue)',
                      'var(--accent-rose)'
                    ];

                    return (
                      <circle
                        key={idx}
                        cx="100"
                        cy="100"
                        r={radius}
                        fill="transparent"
                        stroke={strokeColors[idx % strokeColors.length]}
                        strokeWidth="14"
                        strokeDasharray={`${strokeLength} ${circumference}`}
                        strokeDashoffset="0"
                        transform={`rotate(${rotationAngle - 90} 100 100)`}
                        className={styles.donutSector}
                      />
                    );
                  })}
                </svg>

                {/* Legends */}
                <div className={styles.donutLegend}>
                  {finalCategories.map((cat, idx) => {
                    const colors = ['teal', 'purple', 'amber', 'blue', 'rose'];
                    const colClass = colors[idx % colors.length];

                    return (
                      <div key={idx} className={styles.legendItem}>
                        <span className={`${styles.legendDot} bg-${colClass}`} />
                        <span className={styles.legendName}>{cat.name}</span>
                        <span className={styles.legendPct}>{cat.percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendations Section */}
        <section className={`glass-card ${styles.aiAdviceCard} page-enter`}>
          <div className={styles.aiAdviceHeader}>
            <span className={styles.aiAdviceIcon}>✨</span>
            <h3>AI Analytics Insight</h3>
          </div>
          <div className={styles.aiAdviceBody}>
            <p>
              {aiTip}
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
