'use client';

import React from 'react';
import styles from './NotificationPanel.module.css';

export default function NotificationPanel({ isOpen, onClose, notifications = [], onClearAll, onMarkRead }) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`glass-card ${styles.panel}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Notifications</h2>
          <div className={styles.actions}>
            {notifications.length > 0 && (
              <button className={styles.clearBtn} onClick={onClearAll}>Clear All</button>
            )}
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        <div className={styles.list}>
          {notifications.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔔</div>
              <h3>All caught up</h3>
              <p>No new notifications at this time.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`${styles.item} ${n.read ? styles.readItem : ''} ${styles[n.type.toLowerCase()]}`}
                onClick={() => onMarkRead(n.id)}
              >
                <div className={styles.itemHeader}>
                  <span className={styles.itemIcon}>
                    {n.type === 'DEADLINE' ? '⏰' : n.type === 'TASK' ? '✅' : n.type === 'HABIT' ? '🔥' : '✨'}
                  </span>
                  <span className={styles.itemTitle}>{n.title}</span>
                  {!n.read && <span className={styles.unreadDot} />}
                </div>
                <div className={styles.itemText}>{n.text}</div>
                <div className={styles.itemTime}>{n.time || 'Just now'}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
