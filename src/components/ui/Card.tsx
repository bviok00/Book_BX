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

// ── 포스터 카드: 책/영화 표지 전용 (이미지 + 제목 오버레이 + 호버 액션) ──
interface PosterCardProps {
  type?: 'BOOK' | 'MOVIE';
  coverUrl: string;
  title: string;
  author?: string;
  status?: string;
  dominantColor?: string;
  progressPct?: number;
  onClick?: () => void;
  aspectRatio?: string;
  rating?: number | null;
}

export function PosterCard({
  type = 'BOOK',
  coverUrl,
  title,
  author,
  status,
  dominantColor,
  progressPct,
  onClick,
  aspectRatio = '2/3',
  rating,
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
      className="focus-ring card-glow poster-card-container"
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
        const overlay = e.currentTarget.querySelector('.hover-overlay') as HTMLElement;
        if (overlay) {
          overlay.style.opacity = '1';
          overlay.style.transform = 'translateY(0)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        const overlay = e.currentTarget.querySelector('.hover-overlay') as HTMLElement;
        if (overlay) {
          overlay.style.opacity = '0';
          overlay.style.transform = 'translateY(8px)';
        }
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
          padding: '32px 12px 12px', // hover overlay를 위해 여백 확보
          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
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
            }}
          >
            {author}
          </p>
        )}
        
        {/* 영화 시청 진행도 바 (Watcha Style) */}
        {type === 'MOVIE' && progressPct !== undefined && progressPct > 0 && (
          <div style={{ width: '100%', height: '3px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: 'var(--accent)', transition: 'width 0.3s ease' }} />
          </div>
        )}
      </div>

      {/* Hover Action Overlay */}
      <div
        className="hover-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          transform: 'translateY(8px)',
          transition: 'all 0.2s ease-out',
          backdropFilter: 'blur(2px)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          {rating ? (
            <span style={{ color: '#FFD700', fontSize: '14px', marginBottom: '4px' }}>
              {'★'.repeat(rating)}
            </span>
          ) : null}
          <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.5)', padding: '6px 12px', borderRadius: '20px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
            상세 보기
          </span>
        </div>
      </div>

      {/* 상태 뱃지 (도서만 표시하거나 상태값 있으면 표시) */}
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
    WANT_TO_WATCH: 'var(--status-want)',
    WATCHING: 'var(--status-reading)',
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
