'use client';

import React from 'react';

// Reusable basic blocks
export function SkeletonLine({ width = '100%', height = '14px', margin = '0 0 var(--space-2) 0' }) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        margin,
        display: 'block'
      }}
    />
  );
}

export function SkeletonCircle({ size = '40px', margin = '0' }) {
  return (
    <div
      className="skeleton skeleton-circle"
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        margin,
        borderRadius: '50%'
      }}
    />
  );
}

export function SkeletonCard({ height = '150px', children }) {
  return (
    <div
      className="glass-card"
      style={{
        height,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'var(--space-5)',
        border: '1px solid var(--glass-border)',
        opacity: 0.7
      }}
    >
      {children || (
        <>
          <SkeletonLine width="40%" height="20px" margin="0 0 var(--space-4) 0" />
          <SkeletonLine width="90%" />
          <SkeletonLine width="75%" />
        </>
      )}
    </div>
  );
}

// Full Page Skeletons
export function DashboardSkeleton() {
  return (
    <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Greeting Skeleton */}
      <div>
        <SkeletonLine width="35%" height="32px" margin="0 0 var(--space-2) 0" />
        <SkeletonLine width="20%" height="16px" />
      </div>

      {/* AI Card Skeleton */}
      <SkeletonCard height="100px">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          <SkeletonCircle size="24px" />
          <SkeletonLine width="15%" height="16px" margin="0" />
        </div>
        <SkeletonLine width="80%" height="14px" margin="0" />
      </SkeletonCard>

      {/* Stats row skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} height="120px">
            <SkeletonLine width="30%" height="24px" margin="0 0 var(--space-2) 0" />
            <SkeletonLine width="60%" height="14px" margin="0 0 var(--space-3) 0" />
            <SkeletonLine width="100%" height="6px" margin="0" />
          </SkeletonCard>
        ))}
      </div>

      {/* Main Grid skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 'var(--space-6)' }}>
        <SkeletonCard height="350px" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <SkeletonCard key="h" height="160px" />
          <SkeletonCard key="u" height="160px" />
        </div>
      </div>
    </div>
  );
}

export function TasksSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Filters card skeleton */}
      <SkeletonCard height="120px">
        <SkeletonLine width="100%" height="36px" margin="0 0 var(--space-3) 0" />
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <SkeletonLine width="20%" height="24px" margin="0" />
          <SkeletonLine width="20%" height="24px" margin="0" />
          <SkeletonLine width="20%" height="24px" margin="0" />
        </div>
      </SkeletonCard>

      {/* Tasks listing skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="glass-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: 'var(--space-4) var(--space-5)',
              gap: 'var(--space-4)',
              border: '1px solid var(--glass-border)',
              opacity: 0.7
            }}
          >
            <SkeletonCircle size="20px" />
            <SkeletonLine width="15px" height="15px" margin="0" />
            <div style={{ flex: 1 }}>
              <SkeletonLine width="40%" height="16px" margin="0 0 var(--space-2) 0" />
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <SkeletonLine width="60px" height="10px" margin="0" />
                <SkeletonLine width="40px" height="10px" margin="0" />
              </div>
            </div>
            <SkeletonLine width="50px" height="20px" margin="0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <SkeletonCard height="80px" />
      <SkeletonCard height="450px">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'var(--space-2)', width: '100%', height: '100%' }}>
          {Array.from({ length: 28 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ borderRadius: 'var(--radius-md)', opacity: 0.2 }} />
          ))}
        </div>
      </SkeletonCard>
    </div>
  );
}
