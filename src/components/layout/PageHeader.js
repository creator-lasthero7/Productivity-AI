'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import NotificationPanel from '@/components/layout/NotificationPanel';

export default function PageHeader({ title, actions }) {
  const { notifications, clearNotifications, markNotificationRead } = useApp();
  const [panelOpen, setPanelOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 'var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <h1 className="page-title">{title}</h1>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {actions && <div className="page-actions">{actions}</div>}
        
        {/* Notification Bell Trigger */}
        <button 
          onClick={() => setPanelOpen(true)}
          className="glass-card"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-full)',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            fontSize: '1.1rem',
            transition: 'all var(--duration-fast) ease',
          }}
          title="Notifications"
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
            e.currentTarget.style.background = 'var(--glass-bg-hover)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--glass-border)';
            e.currentTarget.style.background = 'var(--glass-bg)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span>🔔</span>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              background: 'var(--accent-rose)',
              color: 'white',
              borderRadius: 'var(--radius-full)',
              minWidth: '16px',
              height: '16px',
              fontSize: '0.65rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 0 6px hsla(350, 80%, 60%, 0.6)'
            }}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <NotificationPanel 
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        notifications={notifications}
        onClearAll={clearNotifications}
        onMarkRead={markNotificationRead}
      />
    </header>
  );
}
