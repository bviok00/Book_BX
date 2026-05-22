'use client';
// 범용 카드 컴포넌트 — 왓챠 스타일 포스터 카드 (hover glow + scale)

import { type ReactNode, type CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  hoverable?: boolean;
  glowing?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap: Record<string, string> = {
  none: '0',
  sm: '12px',
  md: '16px',
  lg: '24px',
};

export default function Card({
  children,
  className = '',
  style,
  onClick,
  hoverable = false,
  glowing = false,
  padding = 'md',
}: CardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`${glowing ? 'card-glow' : ''} ${onClick ? 'focus-ring' : ''} ${className}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-card)',
        padding: paddingMap[padding],
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all var(--transition-fast)',
        ...(hoverable && {
          // hover는 CSS :hover로 처리하기 어려우므로 onMouseEnter/Leave로 대체
        }),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── 포스터 카드: 책 표지 전용 (책 이미지 + 제목 오버레이) ──
interface PosterCardProps {
  coverUrl: string;
  title: string;
  author?: string;
  status?: string;
  dominantColor?: string;
  onClick?: () => void;
  aspectRatio?: string;
}

export function PosterCard({
  coverUrl,
  title,
  author,
  status,
  dominantColor,
  onClick,
  aspectRatio = '2/3',
}: PosterCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className="focus-ring card-glow"
      style={{
        position: 'relative',
        aspectRatio,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
        boxShadow: dominantColor
          ? `0 4px 20px ${dominantColor}33`
          : 'var(--shadow-md)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {/* 표지 이미지 */}
      <img
        src={coverUrl}
        alt={title}
        loading="lazy"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* 하단 그라데이션 오버레이 + 텍스트 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '24px 12px 12px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
        }}
      >
        <p
          className="line-clamp-2"
          style={{
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            lineHeight: 1.3,
          }}
        >
          {title}
        </p>
        {author && (
          <p
            className="line-clamp-1"
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '11px',
              marginTop: '2px',
            }}
          >
            {author}
          </p>
        )}
      </div>

      {/* 상태 뱃지 */}
      {status && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
          }}
        >
          <StatusDot status={status} />
        </div>
      )}
    </div>
  );
}

// 상태 인디케이터 점
function StatusDot({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    WANT_TO_READ: 'var(--status-want)',
    READING: 'var(--status-reading)',
    COMPLETED: 'var(--status-completed)',
    DROPPED: 'var(--status-dropped)',
  };

  return (
    <div
      style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: colorMap[status] || 'var(--text-tertiary)',
        boxShadow: `0 0 6px ${colorMap[status] || 'transparent'}`,
      }}
    />
  );
}
