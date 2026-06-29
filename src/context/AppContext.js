'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AppContext = createContext();

const DEADLINE_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function AppProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [goals, setGoals] = useState([]);
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [preferences, setPreferences] = useState({
    taskReminders: true,
    habitAlerts: true,
    aiDailyTips: true,
    voiceConfirmations: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Track which task IDs we've already alerted to avoid duplicate API calls
  const alertedTaskIds = useRef(new Set());

  // Fetch initial data from server APIs
  useEffect(() => {
    async function fetchData() {
      // 1. Initialize user first
      const savedUser = localStorage.getItem('prod_ai_user');
      const currentUser = savedUser ? JSON.parse(savedUser) : { name: 'Guest User', email: 'guest@productivity.ai' };
      setUser(currentUser);

      // 2. Load saved preferences
      const savedPrefs = localStorage.getItem('prod_ai_preferences');
      if (savedPrefs) {
        try { setPreferences(JSON.parse(savedPrefs)); } catch (e) { /* ignore */ }
      }

      const headers = { 'x-user-email': currentUser.email };

      try {
        // Parallel requests with user isolation header
        const [tasksRes, habitsRes, goalsRes, eventsRes] = await Promise.all([
          fetch('/api/tasks', { headers }),
          fetch('/api/habits', { headers }),
          fetch('/api/goals', { headers }),
          fetch('/api/events', { headers }),
        ]);

        if (tasksRes.ok) setTasks(await tasksRes.json());
        if (habitsRes.ok) setHabits(await habitsRes.json());
        if (goalsRes.ok) setGoals(await goalsRes.json());
        if (eventsRes.ok) setEvents(await eventsRes.json());
      } catch (err) {
        console.error('Failed to fetch backend data, falling back to local storage', err);
        const savedTasks = localStorage.getItem('prod_ai_tasks');
        const savedHabits = localStorage.getItem('prod_ai_habits');
        const savedGoals = localStorage.getItem('prod_ai_goals');
        const savedEvents = localStorage.getItem('prod_ai_events');

        if (savedTasks) setTasks(JSON.parse(savedTasks));
        if (savedHabits) setHabits(JSON.parse(savedHabits));
        if (savedGoals) setGoals(JSON.parse(savedGoals));
        if (savedEvents) setEvents(JSON.parse(savedEvents));
      } finally {
        const savedTheme = localStorage.getItem('prod_ai_theme');
        if (savedTheme) {
          setTheme(savedTheme);
          if (savedTheme === 'light') document.body.classList.add('light');
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
          setTheme('light');
          document.body.classList.add('light');
        }
        setLoading(false);
        setMounted(true);
      }
    }

    fetchData();
  }, []);

  const apiFetch = async (url, options = {}) => {
    const email = user?.email || 'guest@productivity.ai';
    const headers = {
      'Content-Type': 'application/json',
      'x-user-email': email,
      ...options.headers,
    };
    return fetch(url, { ...options, headers });
  };

  // ─── Notification Helpers ───

  const addNotification = useCallback((notification) => {
    const newNotif = {
      ...notification,
      id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      read: false,
      time: notification.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setNotifications((prev) => [newNotif, ...prev]);
    return newNotif;
  }, []);

  const addToast = useCallback((toast) => {
    setToasts((prev) => [...prev, toast]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── Deadline Watcher ───
  // Client-side pre-filter: only calls the API when there are actually urgent tasks.
  // This means if no tasks are due within 24 hours, zero API calls = zero cost.

  const checkDeadlines = useCallback(async () => {
    if (!user?.email || tasks.length === 0 || !preferences.taskReminders) return;

    // Client-side pre-filter: find tasks due within 24 hours
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const urgentTasks = tasks
      .map((task) => {
        let deadlineStr = task.dueDate;
        if (task.dueDate) {
          if (task.dueTime) {
            const timeParts = task.dueTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
            if (timeParts) {
              let hours = parseInt(timeParts[1], 10);
              const mins = timeParts[2];
              const ampm = timeParts[3];
              if (ampm) {
                if (ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
                if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
              }
              deadlineStr += `T${String(hours).padStart(2, '0')}:${mins}:00`;
            }
          } else {
            deadlineStr += 'T23:59:59';
          }
        }
        return { ...task, parsedDeadline: deadlineStr ? new Date(deadlineStr) : null };
      })
      .filter((task) => {
        if (task.done || !task.parsedDeadline) return false;
        if (alertedTaskIds.current.has(task.id)) return false;
        return task.parsedDeadline >= now && task.parsedDeadline <= in24Hours;
      })
      .sort((a, b) => {
        // 1. Sort by Priority (HIGH > MEDIUM > LOW)
        const priorities = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        const weightA = priorities[a.priority] || 0;
        const weightB = priorities[b.priority] || 0;
        
        if (weightA !== weightB) {
          return weightB - weightA;
        }
        
        // 2. Sort by nearest deadline
        return a.parsedDeadline.getTime() - b.parsedDeadline.getTime();
      });

    // No urgent tasks → skip API call entirely (zero cost)
    if (urgentTasks.length === 0) return;

    try {
      const res = await fetch('/api/ai/deadline-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          userName: user.name,
        }),
      });

      if (!res.ok) return;

      const data = await res.json();
      const alerts = data.alerts || [];

      if (alerts.length > 0) {
        // Mark these task IDs as alerted so we don't repeat
        alerts.forEach((alert) => {
          alertedTaskIds.current.add(alert.taskId);
        });

        // Add to notification panel
        alerts.forEach((alert) => {
          addNotification(alert);
        });

        // Show toast for the most urgent ones (max 3)
        alerts.slice(0, 3).forEach((alert, i) => {
          // Stagger toasts slightly
          setTimeout(() => {
            addToast(alert);
          }, i * 600);
        });
      }
    } catch (err) {
      console.error('Deadline check failed:', err);
    }
  }, [user, tasks, addNotification, addToast]);

  // Run deadline watcher on mount and every 5 minutes
  useEffect(() => {
    if (!mounted || loading) return;

    // Initial check after a short delay (let data load)
    const initialTimer = setTimeout(checkDeadlines, 3000);

    // Recurring check every 5 minutes
    const interval = setInterval(checkDeadlines, DEADLINE_CHECK_INTERVAL);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [mounted, loading, checkDeadlines]);

  // Tasks actions
  const addTask = async (task) => {
    try {
      const res = await apiFetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      if (res.ok) {
        const newTask = await res.json();
        setTasks((prev) => [newTask, ...prev]);
        return newTask;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateTask = async (id, updatedFields) => {
    try {
      const res = await apiFetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updatedFields }),
      });
      if (res.ok) {
        const updatedTask = await res.json();
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? updatedTask : t))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTask = async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newDone = !task.done;
    const updatedSubtasks = task.subtasks?.map(st => ({ ...st, done: newDone })) || [];
    
    await updateTask(id, { done: newDone, subtasks: updatedSubtasks });
  };

  const toggleSubtask = async (taskId, subtaskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, done: !st.done } : st
    );
    const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.done);
    
    await updateTask(taskId, {
      subtasks: updatedSubtasks,
      done: allDone ? true : task.done
    });
  };

  const deleteTask = async (id) => {
    try {
      const res = await apiFetch(`/api/tasks?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Habits actions
  const addHabit = async (habit) => {
    try {
      const res = await apiFetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habit),
      });
      if (res.ok) {
        const newHabit = await res.json();
        setHabits((prev) => [...prev, newHabit]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleHabit = async (id) => {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const isCompletedToday = habit.history.includes(todayStr);
    let newHistory;
    let newStreak = habit.streak;
    let newCompleted = habit.completed;

    if (isCompletedToday) {
      newHistory = habit.history.filter((d) => d !== todayStr);
      newStreak = Math.max(0, habit.streak - 1);
      newCompleted = Math.max(0, habit.completed - 1);
    } else {
      newHistory = [...habit.history, todayStr];
      newStreak = habit.streak + 1;
      newCompleted = habit.completed + 1;
    }

    try {
      const res = await apiFetch('/api/habits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          history: newHistory,
          streak: newStreak,
          completed: newCompleted
        }),
      });
      if (res.ok) {
        const updatedHabit = await res.json();
        setHabits((prev) =>
          prev.map((h) => (h.id === id ? updatedHabit : h))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Goals actions
  const addGoal = async (goal) => {
    try {
      const res = await apiFetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal),
      });
      if (res.ok) {
        const newGoal = await res.json();
        setGoals((prev) => [...prev, newGoal]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMilestone = async (goalId, milestoneId) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const updatedMilestones = goal.milestones.map((m) =>
      m.id === milestoneId ? { ...m, done: !m.done } : m
    );
    const doneCount = updatedMilestones.filter((m) => m.done).length;
    const newProgress = Math.round((doneCount / updatedMilestones.length) * 100) || 0;

    try {
      const res = await apiFetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: goalId,
          milestones: updatedMilestones,
          progress: newProgress,
          done: newProgress === 100
        }),
      });
      if (res.ok) {
        const updatedGoal = await res.json();
        setGoals((prev) =>
          prev.map((g) => (g.id === goalId ? updatedGoal : g))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Events actions
  const addEvent = async (event) => {
    try {
      const res = await apiFetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      if (res.ok) {
        const newEvent = await res.json();
        setEvents((prev) => [...prev, newEvent]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Auth actions
  const loginUser = (email, name) => {
    const newUser = { name: name || 'Guest User', email };
    setUser(newUser);
    localStorage.setItem('prod_ai_user', JSON.stringify(newUser));
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem('prod_ai_user');
    window.location.href = '/login';
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('prod_ai_theme', newTheme);
    if (newTheme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  };

  const clearNotifications = () => setNotifications([]);
  
  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const updatePreference = useCallback((key, value) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('prod_ai_preferences', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        tasks,
        habits,
        goals,
        events,
        user,
        loading,
        addTask,
        updateTask,
        toggleTask,
        toggleSubtask,
        deleteTask,
        addHabit,
        toggleHabit,
        addGoal,
        toggleMilestone,
        addEvent,
        loginUser,
        logoutUser,
        theme,
        toggleTheme,
        notifications,
        clearNotifications,
        markNotificationRead,
        addNotification,
        toasts,
        dismissToast,
        preferences,
        updatePreference,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
