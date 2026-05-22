'use client';
// 완독 도서 카테고리 육각형 레이더 차트

import { useMemo, useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { RadarCategory } from '@/types';

interface CognitiveRadarProps {
  data: RadarCategory[]; // 서버나 부모에서 집계된 데이터 전달
}

// recharts는 클라이언트 사이드 전용이므로 hydration 미스매치 방지 필요
export default function CognitiveRadar({ data }: CognitiveRadarProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // 기본 카테고리 데이터 (데이터가 없을 때 표시할 빈 육각형)
  const defaultData = useMemo(() => [
    { category: '소설/문학', count: 0 },
    { category: '경제/경영', count: 0 },
    { category: '인문/철학', count: 0 },
    { category: '과학/IT', count: 0 },
    { category: '자기계발', count: 0 },
    { category: '예술/역사', count: 0 },
  ], []);

  const chartData = data && data.length >= 3 ? data : defaultData;

  if (!mounted) {
    return (
      <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-primary)', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>로딩 중...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-primary)', height: '300px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
        인지 레이더 (카테고리 분포)
      </h3>
      
      <div style={{ flex: 1, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="var(--border-secondary)" />
            <PolarAngleAxis 
              dataKey="category" 
              tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '12px' }}
              itemStyle={{ color: 'var(--accent)' }}
            />
            <Radar
              name="읽은 책"
              dataKey="count"
              stroke="var(--accent)"
              fill="var(--accent)"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
