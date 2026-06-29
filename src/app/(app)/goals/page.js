'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { useApp } from '@/context/AppContext';
import styles from './goals.module.css';

const presetEmojis = ['🚀', '📖', '🏅', '💼', '🏡', '💵', '🎨', '🧠', '🎓', '✈️', '💻', '🩺'];

export default function GoalsPage() {
  const { goals, addGoal, toggleMilestone } = useApp();
  
  // Creation form state
  const [showCreator, setShowCreator] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Career');
  const [selectedEmoji, setSelectedEmoji] = useState(presetEmojis[0]);
  
  // Milestones local state for form
  const [milestones, setMilestones] = useState([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  const handleAddMilestone = (e) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;
    setMilestones([
      ...milestones,
      { id: Date.now() + Math.random(), title: newMilestoneTitle.trim(), done: false }
    ]);
    setNewMilestoneTitle('');
  };

  const handleRemoveMilestone = (id) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const handleCreateGoal = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    addGoal({
      title: title.trim(),
      category,
      emoji: selectedEmoji,
      milestones,
    });

    setTitle('');
    setMilestones([]);
    setShowCreator(false);
  };

  return (
    <>
      <PageHeader
        title="Goals"
        actions={
          <button
            className="btn btn-primary"
            onClick={() => setShowCreator(!showCreator)}
          >
            {showCreator ? 'Cancel' : '+ New Goal'}
          </button>
        }
      />

      <div className={`page-content ${styles.goalsPage}`}>
        {/* Creator Panel */}
        {showCreator && (
          <div className={`glass-card ${styles.creatorCard} page-enter`}>
            <h3>Set Productivity Goal</h3>
            <form onSubmit={handleCreateGoal} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Goal Title</label>
                <input
                  type="text"
                  placeholder="e.g. Master React, Save $10K, Run Half Marathon..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={styles.select}
                  >
                    <option value="Career">💼 Career</option>
                    <option value="Personal">🏡 Personal</option>
                    <option value="Fitness">🏋️ Fitness</option>
                    <option value="Finance">💵 Finance</option>
                    <option value="Education">🎓 Education</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Emoji Icon</label>
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

              {/* Milestones dynamic list inside goal creator */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Goal Milestones (Key Results)</label>
                <div className={styles.milestoneInputRow}>
                  <input
                    type="text"
                    placeholder="Add milestone step..."
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    className={styles.milestoneInput}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMilestone(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    className="btn btn-secondary"
                  >
                    +
                  </button>
                </div>

                {milestones.length > 0 && (
                  <div className={styles.creatorMilestonesList}>
                    {milestones.map((m) => (
                      <div key={m.id} className={styles.creatorMilestoneItem}>
                        <span>{m.title}</span>
                        <button
                          type="button"
                          className={styles.removeMilestoneBtn}
                          onClick={() => handleRemoveMilestone(m.id)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  Create Goal 🎯
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Goals Listing */}
        {goals.length === 0 ? (
          <div className={`glass-card ${styles.emptyState} page-enter`}>
            <div className={styles.emptyIcon}>🎯</div>
            <h3>No Goals set yet</h3>
            <p>Break down big ambitions! Design your first goal layout above.</p>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowCreator(true)}>
              Define Goal
            </button>
          </div>
        ) : (
          <div className={`${styles.goalsGrid} stagger-children`}>
            {goals.map((goal, index) => (
              <div
                key={goal.id}
                className={`glass-card ${styles.goalCard} page-enter`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.goalEmojiBg}>
                    <span className={styles.goalEmoji}>{goal.emoji}</span>
                  </div>
                  <div className={styles.goalHeaderInfo}>
                    <h3 className={styles.goalTitleText}>{goal.title}</h3>
                    <span className={`badge badge-purple ${styles.goalCategory}`}>{goal.category}</span>
                  </div>
                  <div className={styles.progressCircleContainer}>
                    <div className={styles.progressPercentage}>{goal.progress}%</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className={styles.progressBarWrapper}>
                  <div className="progress-bar" style={{ height: '6px' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${goal.progress}%`,
                        background: goal.progress === 100 ? 'var(--gradient-teal)' : 'var(--gradient-purple)',
                      }}
                    />
                  </div>
                </div>

                {/* Milestones Checklist */}
                {goal.milestones?.length > 0 && (
                  <div className={styles.milestonesSection}>
                    <div className={styles.milestonesHeader}>Milestones Tracker</div>
                    <div className={styles.milestonesList}>
                      {goal.milestones.map((m) => (
                        <div
                          key={m.id}
                          className={`${styles.milestoneItem} ${m.done ? styles.milestoneDone : ''}`}
                          onClick={() => toggleMilestone(goal.id, m.id)}
                        >
                          <div className={`${styles.milestoneCheckbox} ${m.done ? styles.milestoneChecked : ''}`}>
                            {m.done && '✓'}
                          </div>
                          <span className={styles.milestoneTitle}>{m.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
