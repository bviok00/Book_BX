'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import type { ContentItem } from '@/types/dashboard';
import { getUserTags } from '@/app/dashboard/actions';
import PosterCard from './PosterCard';

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
  const router = useRouter();

  const allItems = useMemo(() => [...books, ...movies, ...animes], [books, movies, animes]);
  const totalContents = allItems.length;

  // 1. 스토리텔링 통계
  const topGenreInfo = useMemo(() => {
    const genreCounts: Record<string, number> = {};
    allItems.forEach(item => {
      if (item.genre) {
        item.genre.split(',').forEach(g => {
          const clean = g.trim();
          if (clean) genreCounts[clean] = (genreCounts[clean] || 0) + 1;
        });
      }
    });
    const sorted = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? { name: sorted[0][0], count: sorted[0][1] } : null;
  }, [allItems]);

  const totalHours = useMemo(() => {
    let mins = 0;
    [...movies, ...animes].forEach(item => {
      if (item.runtimeMin) mins += item.runtimeMin;
    });
    return Math.floor(mins / 60);
  }, [movies, animes]);

  const topGenres = useMemo(() => {
    const genreCounts: Record<string, number> = {};
    allItems.forEach(item => {
      if (item.genre) {
        item.genre.split(',').forEach(g => {
          const clean = g.trim();
          if (clean) genreCounts[clean] = (genreCounts[clean] || 0) + 1;
        });
      }
    });
    return Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));
  }, [allItems]);

  const topCreators = useMemo(() => {
    const counts: Record<string, number> = {};
    allItems.forEach(item => {
      if (item.creator) {
        const clean = item.creator.trim();
        if (clean && clean !== '알 수 없음') counts[clean] = (counts[clean] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [allItems]);

  // 2. 차트 데이터
  const typeData = useMemo(() => [
    { name: '도서', value: books.length, fill: TYPE_COLORS.BOOK },
    { name: '영화', value: movies.length, fill: TYPE_COLORS.MOVIE },
    { name: '애니', value: animes.length, fill: TYPE_COLORS.ANIME },
  ].filter(d => d.value > 0), [books, movies, animes]);

  const statusData = useMemo(() => {
    const counts = { WANT: 0, IN_PROGRESS: 0, COMPLETED: 0, DROPPED: 0 };
    allItems.forEach(item => {
      if (item.status === 'WANT_TO_READ' || item.status === 'WANT_TO_WATCH') counts.WANT++;
      else if (item.status === 'READING' || item.status === 'WATCHING') counts.IN_PROGRESS++;
      else if (item.status === 'COMPLETED') counts.COMPLETED++;
      else if (item.status === 'DROPPED') counts.DROPPED++;
    });
    return [
      { name: '대기중', value: counts.WANT, fill: STATUS_COLORS.WANT_TO_READ },
      { name: '진행중', value: counts.IN_PROGRESS, fill: STATUS_COLORS.READING },
      { name: '완료', value: counts.COMPLETED, fill: STATUS_COLORS.COMPLETED },
      { name: '중단', value: counts.DROPPED, fill: STATUS_COLORS.DROPPED },
    ].filter(d => d.value > 0);
  }, [allItems]);

  const ratingData = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allItems.forEach(item => {
      if (item.rating && item.rating >= 1 && item.rating <= 5) {
        counts[item.rating as keyof typeof counts]++;
      }
    });
    return Object.entries(counts).map(([rating, count]) => ({
      rating: `${rating}점`,
      count
    }));
  }, [allItems]);

  // 3. 명예의 전당 (5점 만점 작품들)
  const hallOfFame = useMemo(() => {
    return allItems
      .filter(item => item.rating === 5)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [allItems]);

  // 4. 활동 잔디 (최근 6개월)
  const activityMap = useMemo(() => {
    const map = new Map<string, number>();
    const today = new Date();
    // 180일치 데이터 초기화
    for (let i = 0; i < 180; i++) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      map.set(d.toISOString().split('T')[0], 0);
    }
    allItems.forEach(item => {
      const dateStr = new Date(item.createdAt).toISOString().split('T')[0];
      if (map.has(dateStr)) {
        map.set(dateStr, map.get(dateStr)! + 1);
      }
    });
    return Array.from(map.entries()).reverse();
  }, [allItems]);

  if (totalContents === 0) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        통계를 표시할 데이터가 없습니다. 먼저 서재에 콘텐츠를 추가해 보세요!
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '64px', animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* ── 1. 스토리텔링 요약 섹션 ── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        <div className="glass-card" style={{ padding: '32px 24px', textAlign: 'center', background: 'linear-gradient(145deg, rgba(99,102,241,0.05) 0%, transparent 100%)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🌌</div>
          <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.5px' }}>당신의 우주에는 현재</h3>
          <p style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>총 {totalContents}개의 별<span style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-secondary)' }}>이 빛납니다</span></p>
        </div>
        
        <div className="glass-card" style={{ padding: '32px 24px', textAlign: 'center', background: 'linear-gradient(145deg, rgba(241,91,181,0.05) 0%, transparent 100%)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>✨</div>
          <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.5px' }}>가장 많이 탐험한 은하계</h3>
          <p style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            {topGenreInfo ? `#${topGenreInfo.name}` : '기록 없음'}
            {topGenreInfo && <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '8px' }}>({topGenreInfo.count}작품)</span>}
          </p>
        </div>

        <div className="glass-card" style={{ padding: '32px 24px', textAlign: 'center', background: 'linear-gradient(145deg, rgba(0,187,249,0.05) 0%, transparent 100%)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏱️</div>
          <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.5px' }}>영상 미디어와 함께한 시간</h3>
          <p style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>총 {totalHours}시간<span style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-secondary)' }}>의 여정</span></p>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
        
        {/* ── 2. 취향 분석 레이더 (장르) ── */}
        <section className="glass-card" style={{ padding: '24px', minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎯 장르 취향 분석 <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-tertiary)' }}>(상위 6개 장르)</span>
          </h2>
          {topGenres.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
              데이터가 부족하여 취향을 분석할 수 없습니다.
            </div>
          ) : (
            <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={topGenres}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 13 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                  <Radar name="작품 수" dataKey="count" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.5} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* ── 3. 최애 창작자 랭킹 ── */}
        <section className="glass-card" style={{ padding: '24px', minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            👑 숨은 최애 창작자 <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-tertiary)' }}>(감독/작가)</span>
          </h2>
          {topCreators.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
              등록된 창작자 정보가 없습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
              {topCreators.map((creator, i) => {
                const maxCount = topCreators[0].count;
                const pct = (creator.count / maxCount) * 100;
                return (
                  <div key={creator.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ fontWeight: i === 0 ? 800 : 600, color: i === 0 ? 'var(--accent)' : 'var(--text-primary)' }}>{i + 1}. {creator.name}</span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{creator.count}작품</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: i === 0 ? 'var(--accent)' : 'var(--text-tertiary)', borderRadius: '4px', transition: 'width 1s ease-out' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── 3. 명예의 전당 (Top Picks) ── */}
      <section className="glass-card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🏆 명예의 전당 <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-tertiary)' }}>(5점 만점 인생작)</span>
        </h2>
        {hallOfFame.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            아직 5점 만점을 준 인생작이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px' }}>
            {hallOfFame.map(item => (
              <div key={item.id} onClick={() => router.push(`/dashboard/${item.type.toLowerCase()}/${item.id}`)} style={{ cursor: 'pointer' }} className="hover-scale">
                <img src={item.posterUrl || ''} alt={item.title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 4. 활동 잔디 & 기존 차트 ── */}
      <section className="glass-card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔥 탐사 궤적 <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-tertiary)' }}>(최근 6개월)</span>
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '48px' }}>
          {activityMap.map(([date, count]) => (
            <div
              key={date}
              title={`${date}: ${count}개 작품 추가`}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                backgroundColor: count === 0 ? 'var(--border-subtle)' :
                                count === 1 ? 'rgba(99, 102, 241, 0.4)' :
                                count <= 3 ? 'rgba(99, 102, 241, 0.7)' :
                                '#6366f1',
                transition: 'transform 0.1s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px', textAlign: 'center' }}>미디어 비중</h3>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5}>
                    {typeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} stroke="rgba(255,255,255,0.1)" />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px', textAlign: 'center' }}>상태 요약</h3>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={0} outerRadius={70}>
                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} stroke="rgba(255,255,255,0.1)" />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px', textAlign: 'center' }}>평점 분포</h3>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="rating" stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <YAxis allowDecimals={false} stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }} />
                  <Bar dataKey="count" name="작품 수" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
