'use client';

interface ReadingProgressProps {
  completedCount: number;
  yearlyGoal: number;
  dominantColor?: string | null;
}

export default function ReadingProgress({ completedCount, yearlyGoal, dominantColor }: ReadingProgressProps) {
  const goal = yearlyGoal > 0 ? yearlyGoal : 24; // 기본값 24권
  const progressPercent = Math.min(100, Math.round((completedCount / goal) * 100));
  const accent = dominantColor || 'var(--accent)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
        올해의 독서 진척도
      </h3>
      
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontSize: '48px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
          {completedCount}
        </span>
        <span style={{ fontSize: '24px', fontWeight: 500, color: 'var(--text-tertiary)' }}>
          / {goal}권
        </span>
      </div>

      {/* 프로그레스 바 */}
      <div style={{ width: '100%', height: '12px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
        <div 
          style={{ 
            width: `${progressPercent}%`, 
            height: '100%', 
            backgroundColor: accent,
            borderRadius: 'var(--radius-full)',
            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: `0 0 10px ${accent}80`
          }} 
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-tertiary)' }}>
        <span>0%</span>
        <span style={{ fontWeight: 600, color: accent }}>{progressPercent}% 달성</span>
      </div>
    </div>
  );
}
