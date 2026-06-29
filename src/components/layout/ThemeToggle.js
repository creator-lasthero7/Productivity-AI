'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useApp();

  return (
    <button
      onClick={toggleTheme}
      className={styles.themeToggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className={`${styles.iconContainer} ${theme === 'light' ? styles.lightActive : ''}`}>
        <span className={styles.icon}>🌙</span>
        <span className={styles.icon}>☀️</span>
      </div>
    </button>
  );
}
