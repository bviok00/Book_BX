'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';

interface GenreRadarChartProps {
  data: { subject: string; A: number; fullMark: number }[];
  dominantColor?: string | null;
}

export default function GenreRadarChart({ data, dominantColor }: GenreRadarChartProps) {
  const [mounted, setMounted] = useState(false);
  const accent = dominantColor || '#e8375a'; // 왓챠 핑크톤 (디폴트)

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>로딩 중...</div>;
  }

  // 데이터가 3개 미만이면 레이더 차트가 예쁘게 그려지지 않으므로, 더미 데이터를 섞어줍니다.
  const chartData = data.length >= 3 ? data : [
    ...data,
    { subject: '소설/문학', A: Math.max(0, 3 - data.length), fullMark: 10 },
    { subject: '인문/사회', A: Math.max(0, 2 - data.length), fullMark: 10 },
    { subject: '경제/경영', A: Math.max(0, 1 - data.length), fullMark: 10 },
  ].slice(0, Math.max(data.length, 5)); // 최소 5각형 형태 유지

  return (
    <div style={{ width: '100%', height: '300px', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="var(--border-secondary)" strokeDasharray="3 3" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
          <Radar
            name="독서량"
            dataKey="A"
            stroke={accent}
            fill={accent}
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
