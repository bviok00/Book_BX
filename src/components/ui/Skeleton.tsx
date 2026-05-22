'use client';
// 스켈레톤 로딩 컴포넌트 — 카드, 리스트, 텍스트 로딩 상태 표시

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

export default function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--radius-md)',
  className = '',
}: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--bg-secondary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, transparent, var(--border-subtle), transparent)',
          animation: 'shimmer 1.5s infinite',
        }}
      />
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

// ── 카드형 스켈레톤 (포스터 카드 로딩) ──
export function CardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Skeleton height="200px" borderRadius="var(--radius-md)" />
      <Skeleton width="80%" height="14px" />
      <Skeleton width="50%" height="12px" />
    </div>
  );
}

// ── 리스트 행 스켈레톤 ──
export function ListRowSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 0',
      }}
    >
      <Skeleton width="40px" height="56px" borderRadius="4px" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Skeleton width="60%" height="14px" />
        <Skeleton width="30%" height="12px" />
      </div>
      <Skeleton width="60px" height="24px" borderRadius="var(--radius-full)" />
    </div>
  );
}
