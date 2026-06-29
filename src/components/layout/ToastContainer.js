'use client';

import { useApp } from '@/context/AppContext';
import ToastNotification from '@/components/layout/ToastNotification';

export default function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  return <ToastNotification toasts={toasts} onDismiss={dismissToast} />;
}
