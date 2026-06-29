'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/layout/PageHeader';
import styles from './settings.module.css';

export default function SettingsPage() {
  const { user, loginUser, logoutUser, preferences, updatePreference } = useApp();
  const [profile, setProfile] = useState({
    name: 'Guest User',
    email: 'guest@productivity.ai',
    focusGoal: '4', // 4 hours
  });

  const [emailStatus, setEmailStatus] = useState({
    sending: false,
    message: '',
    type: '' // 'success' | 'error'
  });

  const [saved, setSaved] = useState(false);

  // Sync profile when context is loaded
  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        name: user.name || 'Guest User',
        email: user.email || 'guest@productivity.ai',
      }));
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleToggle = (key) => {
    updatePreference(key, !preferences[key]);
  };

  const handleSave = (e) => {
    e.preventDefault();
    loginUser(profile.email, profile.name);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestEmail = async () => {
    setEmailStatus({ sending: true, message: '', type: '' });
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, name: profile.name }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailStatus({
          sending: false,
          message: `⚡ Summary Digest sent! (${data.message})`,
          type: 'success'
        });
      } else {
        setEmailStatus({
          sending: false,
          message: `❌ Failed to send: ${data.error || 'Unknown error'}`,
          type: 'error'
        });
      }
    } catch (err) {
      setEmailStatus({
        sending: false,
        message: `❌ Failed to send. Please check server logs.`,
        type: 'error'
      });
    }
    // Auto clear status after 6 seconds
    setTimeout(() => setEmailStatus({ sending: false, message: '', type: '' }), 6000);
  };

  return (
    <>
      <PageHeader title="Settings" />

      <div className={`page-content ${styles.settingsPage}`}>
        <div className={styles.settingsGrid}>
          {/* Profile Card */}
          <div className={`glass-card ${styles.card} page-enter`}>
            <h3 className={styles.cardTitle}>User Profile</h3>
            <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Display Name</label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Daily Focus Goal (Hours)</label>
                <input
                  type="number"
                  name="focusGoal"
                  value={profile.focusGoal}
                  onChange={handleProfileChange}
                  className={styles.input}
                  min="1"
                  max="24"
                />
              </div>

              <button type="submit" className="btn btn-primary btn-sm align-self-start">
                Save Profile
              </button>
            </form>
          </div>

          {/* Preferences Card */}
          <div className={`glass-card ${styles.card} page-enter`} style={{ animationDelay: '100ms' }}>
            <h3 className={styles.cardTitle}>Notification Preferences</h3>
            <div className={styles.toggleList}>
              <div className={styles.toggleItem}>
                <div className={styles.toggleInfo}>
                  <div className={styles.toggleLabel}>Task Reminders</div>
                  <div className={styles.toggleSub}>Get alerted before tasks are due</div>
                </div>
                <button
                  type="button"
                  className={`${styles.toggleSwitch} ${preferences.taskReminders ? styles.toggleOn : ''}`}
                  onClick={() => handleToggle('taskReminders')}
                  aria-label="Toggle task reminders"
                />
              </div>

              <div className={styles.toggleItem}>
                <div className={styles.toggleInfo}>
                  <div className={styles.toggleLabel}>Habit Streaks</div>
                  <div className={styles.toggleSub}>Daily check-in reminders for streaks</div>
                </div>
                <button
                  type="button"
                  className={`${styles.toggleSwitch} ${preferences.habitAlerts ? styles.toggleOn : ''}`}
                  onClick={() => handleToggle('habitAlerts')}
                  aria-label="Toggle habit alerts"
                />
              </div>

              <div className={styles.toggleItem}>
                <div className={styles.toggleInfo}>
                  <div className={styles.toggleLabel}>AI Insights</div>
                  <div className={styles.toggleSub}>Receive personalized daily analytics tips</div>
                </div>
                <button
                  type="button"
                  className={`${styles.toggleSwitch} ${preferences.aiDailyTips ? styles.toggleOn : ''}`}
                  onClick={() => handleToggle('aiDailyTips')}
                  aria-label="Toggle AI insights"
                />
              </div>

              <div className={styles.toggleItem}>
                <div className={styles.toggleInfo}>
                  <div className={styles.toggleLabel}>AI Voice Feedback</div>
                  <div className={styles.toggleSub}>Enable speech synthesis feedback on commands</div>
                </div>
                <button
                  type="button"
                  className={`${styles.toggleSwitch} ${preferences.voiceConfirmations ? styles.toggleOn : ''}`}
                  onClick={() => handleToggle('voiceConfirmations')}
                  aria-label="Toggle voice confirmations"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Email Alerts Integration Card */}
        <div className={`glass-card ${styles.card} page-enter`} style={{ animationDelay: '200ms', marginTop: 'var(--space-6)' }}>
          <h3 className={styles.cardTitle}>Gmail Alerts & Reports</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
            ProductivityAI compiles your active checklists, remaining tasks, and streak progress into a newsletter summary. Use the button below to dispatch a test email alerts summary to your profile address.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              onClick={handleTestEmail} 
              disabled={emailStatus.sending}
              className="btn btn-secondary btn-sm"
              style={{ padding: 'var(--space-2) var(--space-4)' }}
            >
              {emailStatus.sending ? '🔄 Sending Digest...' : '📧 Send Test Digest to Gmail'}
            </button>
            
            {emailStatus.message && (
              <span style={{ 
                fontSize: '0.85rem', 
                color: emailStatus.type === 'success' ? 'var(--accent-teal)' : 'var(--accent-rose)',
                fontWeight: '500'
              }}>
                {emailStatus.message}
              </span>
            )}
          </div>
        </div>

        {/* Logout Card */}
        <div className={`glass-card ${styles.card} page-enter`} style={{ animationDelay: '300ms', marginTop: 'var(--space-6)' }}>
          <h3 className={styles.cardTitle}>Account</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
            Signed in as <strong style={{ color: 'var(--text-primary)' }}>{user?.email || 'guest@productivity.ai'}</strong>
          </p>
          <button 
            type="button" 
            onClick={logoutUser}
            className={`btn ${styles.logoutBtn}`}
          >
            🚪 Sign Out
          </button>
        </div>

        {saved && (
          <div className={styles.toast}>
            ✨ Settings saved successfully!
          </div>
        )}
      </div>
    </>
  );
}
