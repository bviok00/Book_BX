'use client';

export function SkeletonCard({ aspectRatio = '2/3' }: { aspectRatio?: string }) {
  return (
    <div
      className="animate-pulse"
      style={{
        position: 'relative',
        aspectRatio,
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-secondary)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div 
        style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          padding: '16px 12px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.5))'
        }}
      >
        <div style={{ width: '70%', height: '14px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '4px', marginBottom: '8px' }} />
        <div style={{ width: '40%', height: '10px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
      </div>
    </div>
  );
}
