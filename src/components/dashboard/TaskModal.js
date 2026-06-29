'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import styles from './TaskModal.module.css';

const presetColors = [
  '#38bdf8', '#a78bfa', '#fb7185', '#fbbf24',
  '#34d399', '#f472b6', '#60a5fa', '#f59e0b',
  '#10b981', '#8b5cf6', '#ec4899', '#6b7280'
];

const presetEmojis = [
  '📝', '🔐', '🎨', '🚀', '📚', '🧘', '🏃', '💻',
  '📅', '💡', '🎯', '🍕', '💪', '🔥', '🛒', '💵',
  '📣', '⚙️', '🎵', '✈️', '💼', '🏡', '🔋', '🏆'
];

export default function TaskModal({ isOpen, onClose, taskToEdit = null }) {
  const { addTask, updateTask } = useApp();

  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [category, setCategory] = useState(taskToEdit?.category || 'Work');
  const [priority, setPriority] = useState(taskToEdit?.priority || 'MEDIUM');
  
  // Marker state
  const [markerType, setMarkerType] = useState(taskToEdit?.marker?.type || 'EMOJI');
  const [markerValue, setMarkerValue] = useState(
    taskToEdit?.marker?.value || (taskToEdit?.marker?.type === 'COLOR' ? presetColors[0] : presetEmojis[0])
  );

  const [dueDate, setDueDate] = useState(
    taskToEdit?.dueDate || new Date().toISOString().split('T')[0]
  );
  const [dueTime, setDueTime] = useState(taskToEdit?.dueTime || '');

  // Subtasks state
  const [subtasks, setSubtasks] = useState(taskToEdit?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  if (!isOpen) return null;

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      { id: Date.now(), title: newSubtaskTitle.trim(), done: false }
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskData = {
      title: title.trim(),
      category,
      priority,
      marker: { type: markerType, value: markerValue },
      dueDate,
      dueTime,
      subtasks,
    };

    if (taskToEdit) {
      updateTask(taskToEdit.id, taskData);
    } else {
      addTask(taskData);
    }
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`glass-card ${styles.modal}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{taskToEdit ? 'Edit Task' : 'Create Task'}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Title */}
          <div className={styles.formGroup}>
            <label htmlFor="task-title" className={styles.label}>Task Title</label>
            <input
              id="task-title"
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
              required
              autoFocus
            />
          </div>

          <div className={styles.row}>
            {/* Category */}
            <div className={styles.formGroup}>
              <label htmlFor="task-category" className={styles.label}>Category</label>
              <select
                id="task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={styles.select}
              >
                <option value="Work">💼 Work</option>
                <option value="Study">📚 Study</option>
                <option value="Personal">🏡 Personal</option>
                <option value="Health">🧘 Health</option>
                <option value="Finance">💵 Finance</option>
              </select>
            </div>

            {/* Priority */}
            <div className={styles.formGroup}>
              <label htmlFor="task-priority" className={styles.label}>Priority</label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={styles.select}
              >
                <option value="HIGH">🔴 High</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="LOW">🔵 Low</option>
              </select>
            </div>
          </div>

          {/* Marker selector */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Identify Task By (Marker)</label>
            <div className={styles.markerTabs}>
              <button
                type="button"
                className={`${styles.markerTab} ${markerType === 'EMOJI' ? styles.activeTab : ''}`}
                onClick={() => {
                  setMarkerType('EMOJI');
                  setMarkerValue(presetEmojis[0]);
                }}
              >
                Emoji
              </button>
              <button
                type="button"
                className={`${styles.markerTab} ${markerType === 'COLOR' ? styles.activeTab : ''}`}
                onClick={() => {
                  setMarkerType('COLOR');
                  setMarkerValue(presetColors[0]);
                }}
              >
                Color Dot
              </button>
            </div>

            {/* Marker Options Selection Grid */}
            <div className={styles.markerContainer}>
              {markerType === 'EMOJI' ? (
                <div className={styles.emojiGrid}>
                  {presetEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={`${styles.emojiBtn} ${markerValue === emoji ? styles.selectedMarker : ''}`}
                      onClick={() => setMarkerValue(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.colorGrid}>
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`${styles.colorBtn} ${markerValue === color ? styles.selectedMarker : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setMarkerValue(color)}
                      aria-label={`Color ${color}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.row}>
            {/* Due Date */}
            <div className={styles.formGroup}>
              <label htmlFor="task-due-date" className={styles.label}>Due Date</label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={styles.input}
              />
            </div>

            {/* Due Time */}
            <div className={styles.formGroup}>
              <label htmlFor="task-due-time" className={styles.label}>Due Time</label>
              <input
                id="task-due-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          {/* Subtasks Section */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Subtasks</label>
            <div className={styles.subtaskInputRow}>
              <input
                type="text"
                placeholder="Add subtask..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className={styles.subtaskInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className={`btn btn-secondary ${styles.addSubtaskBtn}`}
              >
                +
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className={styles.subtaskList}>
                {subtasks.map((st) => (
                  <div key={st.id} className={styles.subtaskItem}>
                    <span className={styles.subtaskTitle}>{st.title}</span>
                    <button
                      type="button"
                      className={styles.removeSubtaskBtn}
                      onClick={() => handleRemoveSubtask(st.id)}
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className={styles.actions}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {taskToEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
