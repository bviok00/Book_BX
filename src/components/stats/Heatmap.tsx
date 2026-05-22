'use client';
// GitHub 잔디 스타일 1년 독서 히트맵 시각화

import { useMemo } from 'react';
import type { ReadingSession } from '@/types';

interface HeatmapProps {
  sessions: ReadingSession[];
  year?: number;
}

export default function Heatmap({ sessions, year = new Date().getFullYear() }: HeatmapProps) {
  // 1년치 데이터 그리드 생성 로직 (간소화)
  // 실제 구현에서는 날짜 배열을 만들고 sessions 데이터를 매핑하여 강도(intensity) 계산
  
  const intensityMap = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach(session => {
      // session_date 포맷: "YYYY-MM-DD"
      const current = map.get(session.session_date) || 0;
      map.set(session.session_date, current + session.duration_min);
    });
    return map;
  }, [sessions]);

  // 가상의 잔디 데이터 생성 (UI 시연용)
  const days = Array.from({ length: 365 }).map((_, i) => {
    const d = new Date(year, 0, 1);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const duration = intensityMap.get(dateStr) || 0;
    
    // 강도 레벨: 0(없음), 1(30분 미만), 2(1시간 미만), 3(2시간 미만), 4(2시간 이상)
    let level = 0;
    if (duration > 0) level = 1;
    if (duration >= 30) level = 2;
    if (duration >= 60) level = 3;
    if (duration >= 120) level = 4;

    return { date: dateStr, level, duration };
  });

  const levelColors = {
    0: 'var(--bg-secondary)', // 비어있음
    1: 'rgba(99, 102, 241, 0.3)', // 아주 연한 Accent
    2: 'rgba(99, 102, 241, 0.6)', // 연한 Accent
    3: 'rgba(99, 102, 241, 0.8)', // 중간 Accent
    4: 'var(--accent)',           // 진한 Accent
  };

  return (
    <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-primary)' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>
        연간 독서 히트맵 ({year})
      </h3>
      
      {/* 가로 스크롤 가능하게 처리 */}
      <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateRows: 'repeat(7, 12px)',
            gridAutoFlow: 'column',
            gap: '4px',
            width: 'max-content'
          }}
        >
          {days.map((day, i) => (
            <div
              key={i}
              title={`${day.date}: ${day.duration}분`}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                backgroundColor: levelColors[day.level as keyof typeof levelColors],
                cursor: 'pointer',
                transition: 'transform 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          ))}
        </div>
      </div>
      
      {/* 범례 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
        <span>Less</span>
        <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: levelColors[0] }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: levelColors[1] }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: levelColors[2] }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: levelColors[3] }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: levelColors[4] }} />
        <span>More</span>
      </div>
    </div>
  );
}
