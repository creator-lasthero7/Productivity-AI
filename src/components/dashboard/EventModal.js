'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import styles from './TaskModal.module.css';

export default function EventModal({ isOpen, onClose }) {
  const { addEvent } = useApp();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('12:00');
  const [type, setType] = useState('meeting'); // 'meeting', 'personal', 'work'

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const eventData = {
      id: Date.now(),
      title: title.trim(),
      date,
      time,
      type,
    };

    addEvent(eventData);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`glass-card animate-pop-in ${styles.modal}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Schedule Meeting</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="event-title" className={styles.label}>Meeting Title</label>
            <input
              id="event-title"
              type="text"
              placeholder="E.g., Client sync, Team standup..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
              required
              autoFocus
            />
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label htmlFor="event-date" className={styles.label}>Date</label>
              <input
                id="event-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="event-time" className={styles.label}>Time</label>
              <input
                id="event-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={styles.input}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="event-type" className={styles.label}>Type</label>
            <select
              id="event-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={styles.select}
            >
              <option value="meeting">Meeting</option>
              <option value="work">Work Event</option>
              <option value="personal">Personal Event</option>
            </select>
          </div>

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
              Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
