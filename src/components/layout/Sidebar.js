'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Logo from '@/components/layout/Logo';
import ThemeToggle from '@/components/layout/ThemeToggle';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/tasks', icon: '✅', label: 'Tasks' },
  { href: '/calendar', icon: '📅', label: 'Calendar' },
  { href: '/ai', icon: '🤖', label: 'AI Assistant' },
  { divider: true, label: 'Track' },
  { href: '/goals', icon: '🎯', label: 'Goals' },
  { href: '/habits', icon: '🔥', label: 'Habits' },
  { href: '/analytics', icon: '📊', label: 'Analytics' },
];

export default function Sidebar() {
  const { user, logoutUser } = useApp();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        className={styles.mobileToggle}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className={styles.overlay}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Logo size={28} />
            <span>ProductivityAI</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item, index) => {
            if (item.divider) {
              return (
                <div key={index} className="sidebar-section-label">
                  {item.label}
                </div>
              );
            }

            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span className="nav-item-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / User */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)', gap: 'var(--space-2)' }}>
            <Link href="/settings" className="nav-item" style={{ width: 'auto', flex: 1, padding: 'var(--space-2) var(--space-3)' }}>
              <span className="nav-item-icon">⚙️</span>
              <span>Settings</span>
            </Link>
            <ThemeToggle />
          </div>
          <div className="sidebar-user" onClick={logoutUser} title="Click to Log Out">
            <div className="sidebar-avatar">
              {getInitials(user?.name || 'Guest')}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'Guest User'}</div>
              <div className="sidebar-user-email">{user?.email || 'Log Out ➔'}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
