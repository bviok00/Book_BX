'use client';
// 토스트 알림 컴포넌트 — Server Action 결과 표시용

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* 토스트 컨테이너 */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  // 3초 후 자동 제거
  useEffect(() => {
    const timer = setTimeout(onRemove, 3000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const iconMap: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  const colorMap: Record<ToastType, string> = {
    success: '#10b981',
    error: '#ef4444',
    info: 'var(--accent)',
  };

  return (
    <div
      className="glass animate-slide-up"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        pointerEvents: 'auto',
        cursor: 'pointer',
        minWidth: '280px',
        maxWidth: '420px',
        borderLeft: `3px solid ${colorMap[toast.type]}`,
      }}
      onClick={onRemove}
    >
      <span
        style={{
          fontSize: '16px',
          color: colorMap[toast.type],
          fontWeight: 700,
        }}
      >
        {iconMap[toast.type]}
      </span>
      <span
        style={{
          fontSize: '13px',
          color: 'var(--text-primary)',
          lineHeight: 1.4,
        }}
      >
        {toast.message}
      </span>
    </div>
  );
}
