'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './ToastNotification.module.css';

function ToastItem({ notification, onDismiss, index }) {
  const [isExiting, setIsExiting] = useState(false);
  const DURATION = 8000; // 8 seconds auto-dismiss

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(notification.id), 400);
  }, [notification.id, onDismiss]);

  useEffect(() => {
    const timer = setTimeout(handleDismiss, DURATION);
    return () => clearTimeout(timer);
  }, [handleDismiss]);

  const urgencyClass = notification.type === 'SUCCESS'
    ? styles.success
    : notification.type === 'INFO'
    ? styles.info
    : notification.urgency === 'CRITICAL'
    ? styles.critical
    : notification.urgency === 'HIGH'
    ? styles.high
    : styles.approaching;

  const urgencyIcon = notification.type === 'SUCCESS'
    ? '✅'
    : notification.type === 'INFO'
    ? 'ℹ️'
    : notification.urgency === 'CRITICAL'
    ? '🚨'
    : notification.urgency === 'HIGH'
    ? '🔥'
    : '⏰';

  const titleText = notification.type === 'SUCCESS'
    ? 'Success'
    : notification.type === 'INFO'
    ? 'Notification'
    : 'Deadline Alert';

  return (
    <div
      className={`${styles.toast} ${urgencyClass} ${isExiting ? styles.exiting : ''}`}
      style={{ '--index': index }}
      onClick={handleDismiss}
    >
      <div className={styles.toastHeader}>
        <span className={styles.urgencyIcon}>{urgencyIcon}</span>
        <span className={styles.toastTitle}>{titleText}</span>
        <button className={styles.dismissBtn} onClick={(e) => { e.stopPropagation(); handleDismiss(); }} aria-label="Dismiss">✕</button>
      </div>
      <div className={styles.taskName}>{notification.title}</div>
      <div className={styles.toastMessage}>{notification.text}</div>
      
      {notification.type === 'DEADLINE' && (
        <div className={styles.toastMeta}>
          <span className={styles.timeLeft}>⏱ Due in {notification.timeLeft}</span>
          <span className={styles.priorityBadge} data-priority={notification.priority?.toLowerCase()}>
            {notification.priority}
          </span>
        </div>
      )}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ animationDuration: `${DURATION}ms` }} />
      </div>
    </div>
  );
}

export default function ToastNotification({ toasts = [], onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.slice(0, 4).map((toast, i) => (
        <ToastItem
          key={toast.id}
          notification={toast}
          onDismiss={onDismiss}
          index={i}
        />
      ))}
    </div>
  );
}
