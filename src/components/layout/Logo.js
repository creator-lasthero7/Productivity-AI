import React from 'react';
import Image from 'next/image';
import logoImg from '../../../logo.png';

export default function Logo({ size = 32, className = '' }) {
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Image
        src={logoImg}
        alt="Productivity AI Logo"
        fill
        style={{ objectFit: 'contain' }}
        priority
      />
    </div>
  );
}
