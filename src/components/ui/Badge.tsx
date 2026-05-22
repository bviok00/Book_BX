'use client';
// 독서 상태 뱃지 + 태그 뱃지 컴포넌트

import type { BookStatus } from '@/types';

interface StatusBadgeProps {
  status: BookStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<BookStatus, { label: string; className: string }> = {
  WANT_TO_READ: { label: '읽고 싶은', className: 'status-bg-want' },
  READING: { label: '읽는 중', className: 'status-bg-reading' },
  COMPLETED: { label: '완독', className: 'status-bg-completed' },
  DROPPED: { label: '중단', className: 'status-bg-dropped' },
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={config.className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        borderRadius: 'var(--radius-full)',
        fontSize: size === 'sm' ? '11px' : '13px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  );
}

// ── 개념 태그 뱃지 (글래스모피즘) ──
interface TagBadgeProps {
  name: string;
  onClick?: () => void;
  onRemove?: () => void;
  variant?: 'default' | 'glass';
}

export function TagBadge({
  name,
  onClick,
  onRemove,
  variant = 'default',
}: TagBadgeProps) {
  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={variant === 'glass' ? 'glass' : ''}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: '12px',
        fontWeight: 500,
        color: 'var(--accent)',
        backgroundColor: variant === 'glass' ? undefined : 'var(--accent-light)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all var(--transition-fast)',
        whiteSpace: 'nowrap',
      }}
    >
      #{name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`${name} 태그 제거`}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-tertiary)',
            fontSize: '14px',
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}
