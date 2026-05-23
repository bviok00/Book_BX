'use client';

import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import type { ContentItem } from '@/types/dashboard';

interface InsightDashboardProps {
  books: ContentItem[];
  movies: ContentItem[];
  animes: ContentItem[];
}

const STATUS_COLORS = {
  WANT_TO_READ: '#9b5de5',
  READING: '#f15bb5',
  WATCHING: '#f15bb5',
  WANT_TO_WATCH: '#9b5de5',
  COMPLETED: '#00bbf9',
  DROPPED: '#6c757d',
};

const TYPE_COLORS = {
  BOOK: '#e8c547',
  MOVIE: '#ff4d4d',
  ANIME: '#ffb6c1'
};

export default function InsightDashboard({ books, movies, animes }: InsightDashboardProps) {
  const totalContents = books.length + movies.length + animes.length;

  const typeData = useMemo(() => [
    { name: '도서', value: books.length, fill: TYPE_COLORS.BOOK },
    { name: '영화', value: movies.length, fill: TYPE_COLORS.MOVIE },
    { name: '애니', value: animes.length, fill: TYPE_COLORS.ANIME },
  ].filter(d => d.value > 0), [books, movies, animes]);

  const ratingData = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    [...books, ...movies, ...animes].forEach(item => {
      if (item.rating && item.rating >= 1 && item.rating <= 5) {
        counts[item.rating as keyof typeof counts]++;
      }
    });
    return Object.entries(counts).map(([rating, count]) => ({
      rating: `${rating}점`,
      count
    }));
  }, [books, movies, animes]);

  const statusData = useMemo(() => {
    const counts = { WANT: 0, IN_PROGRESS: 0, COMPLETED: 0, DROPPED: 0 };
    [...books, ...movies, ...animes].forEach(item => {
      if (item.status === 'WANT_TO_READ' || item.status === 'WANT_TO_WATCH') counts.WANT++;
      else if (item.status === 'READING' || item.status === 'WATCHING') counts.IN_PROGRESS++;
      else if (item.status === 'COMPLETED') counts.COMPLETED++;
      else if (item.status === 'DROPPED') counts.DROPPED++;
    });
    return [
      { name: '보고싶은/읽고싶은', value: counts.WANT, fill: STATUS_COLORS.WANT_TO_READ },
      { name: '진행중', value: counts.IN_PROGRESS, fill: STATUS_COLORS.READING },
      { name: '완료', value: counts.COMPLETED, fill: STATUS_COLORS.COMPLETED },
      { name: '중단', value: counts.DROPPED, fill: STATUS_COLORS.DROPPED },
    ].filter(d => d.value > 0);
  }, [books, movies, animes]);

  if (totalContents === 0) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        통계를 표시할 데이터가 없습니다. 먼저 서재에 콘텐츠를 추가해 보세요!
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800 }}>💡 내 서재 인사이트</h2>
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '4px 12px', borderRadius: '12px' }}>
          총 {totalContents}개 작품
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* 미디어 비중 파이 차트 */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-secondary)' }}>미디어별 비중</h3>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {typeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} stroke="rgba(255,255,255,0.1)" />)}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 진행 상태 도넛 차트 */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-secondary)' }}>진행 상태 요약</h3>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={0} outerRadius={80}>
                  {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} stroke="rgba(255,255,255,0.1)" />)}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 평점 분포 막대 차트 */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-secondary)' }}>평점 분포 (별점)</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="rating" stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-secondary)' }} />
                <YAxis allowDecimals={false} stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-secondary)' }} />
                <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }} />
                <Bar dataKey="count" name="작품 수" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
