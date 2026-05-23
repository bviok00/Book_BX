'use client';
// ZONE 3: 대시보드 메인 클라이언트 — 상단 탭(HOME/BOOK/MOVIE/INSIGHT) 완전 분할

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Folder, ReadingSession, ContentItem } from '@/types';
import { PosterCard } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import DiscoverySection from '@/components/dashboard/DiscoverySection';
import InsightDashboard from '@/components/dashboard/InsightDashboard';

type ViewMode = 'grid' | 'list' | 'spine';
type TabMode = 'HOME' | 'BOOK' | 'MOVIE' | 'ANIME' | 'INSIGHT';

interface DashboardClientProps {
  userBooks: any[];
  userMovies: any[];
  userAnimes?: any[];
  folders: Folder[];
  readingSessions: ReadingSession[];
}

export default function DashboardClient({
  userBooks,
  userMovies,
  userAnimes = [],
  folders,
  readingSessions,
}: DashboardClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = (searchParams.get('tab') as TabMode) || 'HOME';
  const bookStatus = searchParams.get('bookStatus');
  const movieStatus = searchParams.get('movieStatus');
  const animeStatus = searchParams.get('animeStatus');
  const bookFolderId = searchParams.get('bookFolderId');
  const movieFolderId = searchParams.get('movieFolderId');
  const animeFolderId = searchParams.get('animeFolderId');

  // 도서 콘텐츠 통합 포맷 변환
  const unifiedBooks: ContentItem[] = useMemo(() => {
    return userBooks.map(ub => ({
      type: 'BOOK' as const,
      id: ub.id,
      contentId: ub.isbn,
      title: ub.books?.title || '제목 없음',
      creator: ub.books?.author || null,
      posterUrl: ub.books?.cover_url || '',
      genre: ub.books?.category || null,
      status: ub.status,
      rating: ub.rating,
      dominantColor: ub.dominant_color,
      folderId: ub.folder_id,
      sortOrder: ub.sort_order,
      createdAt: ub.created_at,
      author: ub.books?.author,
      publisher: ub.books?.publisher,
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [userBooks]);

  // 영화 콘텐츠 통합 포맷 변환
  const unifiedMovies: ContentItem[] = useMemo(() => {
    return userMovies.map(um => ({
      type: 'MOVIE' as const,
      id: um.id,
      contentId: String(um.tmdb_id),
      title: um.movies?.title || '제목 없음',
      creator: um.movies?.director || null,
      posterUrl: um.movies?.poster_url || '',
      genre: um.movies?.genre || null,
      status: um.status,
      rating: um.rating,
      dominantColor: um.dominant_color,
      folderId: um.folder_id,
      sortOrder: um.sort_order,
      createdAt: um.created_at,
      progressPct: um.progress_pct,
      runtimeMin: um.movies?.runtime_min,
      backdropUrl: um.movies?.backdrop_url,
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [userMovies]);

  // 애니 콘텐츠 통합 포맷 변환
  const unifiedAnimes: ContentItem[] = useMemo(() => {
    return userAnimes.map(ua => ({
      type: 'ANIME' as const,
      id: ua.id,
      contentId: String(ua.anilist_id),
      title: ua.animes?.title || '제목 없음',
      creator: ua.animes?.director || null,
      posterUrl: ua.animes?.poster_url || '',
      genre: ua.animes?.genre || null,
      status: ua.status,
      rating: ua.rating,
      dominantColor: ua.dominant_color,
      folderId: ua.folder_id,
      sortOrder: ua.sort_order,
      createdAt: ua.created_at,
      progressPct: ua.progress_pct,
      runtimeMin: ua.animes?.runtime_min,
      backdropUrl: ua.animes?.backdrop_url,
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [userAnimes]);

  // 필터링 (도서)
  let filteredBooks = unifiedBooks;
  if (bookStatus && bookStatus !== 'ALL') {
    filteredBooks = filteredBooks.filter(c => c.status === bookStatus);
  }
  if (bookFolderId) {
    filteredBooks = filteredBooks.filter(c => c.folderId === bookFolderId);
  }

  // 필터링 (영화)
  let filteredMovies = unifiedMovies;
  if (movieStatus && movieStatus !== 'ALL') {
    filteredMovies = filteredMovies.filter(c => c.status === movieStatus);
  }
  if (movieFolderId) {
    filteredMovies = filteredMovies.filter(c => c.folderId === movieFolderId);
  }

  // 필터링 (애니)
  let filteredAnimes = unifiedAnimes;
  if (animeStatus && animeStatus !== 'ALL') {
    filteredAnimes = filteredAnimes.filter(c => c.status === animeStatus);
  }
  if (animeFolderId) {
    filteredAnimes = filteredAnimes.filter(c => c.folderId === animeFolderId);
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* ── 상단 컨트롤 ── */}
      {currentTab !== 'HOME' && currentTab !== 'INSIGHT' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)' }}>
              {([
                { key: 'grid' as ViewMode, icon: '☷', label: '그리드' },
                { key: 'list' as ViewMode, icon: '☰', label: '리스트' },
                { key: 'spine' as ViewMode, icon: '📚', label: '책등' },
              ]).map((v) => (
                <button
                  key={v.key}
                  onClick={() => setViewMode(v.key)}
                  title={v.label}
                  className="focus-ring"
                  style={{
                    padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontSize: '14px',
                    backgroundColor: viewMode === v.key ? 'var(--bg-card)' : 'transparent',
                    color: viewMode === v.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    boxShadow: viewMode === v.key ? 'var(--shadow-sm)' : 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {v.icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 본문 영역 ── */}
      {currentTab === 'HOME' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <DiscoverySection 
            existingIsbns={unifiedBooks.map(c => c.contentId)} 
            existingTmdbIds={unifiedMovies.map(c => c.contentId)}
            existingAnilistIds={unifiedAnimes.map(c => c.contentId)}
          />
        </div>
      )}

      {currentTab === 'BOOK' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {unifiedBooks.length > 0 && (
            <DiscoverySection 
              existingIsbns={unifiedBooks.map(c => c.contentId)} 
              existingTmdbIds={unifiedMovies.map(c => c.contentId)}
              existingAnilistIds={unifiedAnimes.map(c => c.contentId)}
              filterType="BOOK"
            />
          )}
          <div>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>📚 도서 컬렉션</h2>
              <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>{filteredBooks.length}개</span>
            </div>
            {filteredBooks.length === 0 ? (
              <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-tertiary)' }}>조건에 맞는 도서가 없습니다.</div>
            ) : (
              viewMode === 'grid' ? <GridView contents={filteredBooks} router={router} type="BOOK" /> :
              viewMode === 'list' ? <ListView contents={filteredBooks} router={router} /> :
              <SpineView contents={filteredBooks} router={router} />
            )}
          </div>
        </div>
      )}

      {currentTab === 'MOVIE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {unifiedMovies.length > 0 && (
            <DiscoverySection 
              existingIsbns={unifiedBooks.map(c => c.contentId)} 
              existingTmdbIds={unifiedMovies.map(c => c.contentId)}
              existingAnilistIds={unifiedAnimes.map(c => c.contentId)}
              filterType="MOVIE"
            />
          )}
          <div>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>🎬 영화 컬렉션</h2>
              <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>{filteredMovies.length}개</span>
            </div>
            {filteredMovies.length === 0 ? (
              <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-tertiary)' }}>조건에 맞는 영화가 없습니다.</div>
            ) : (
              viewMode === 'grid' ? <GridView contents={filteredMovies} router={router} type="MOVIE" /> :
              viewMode === 'list' ? <ListView contents={filteredMovies} router={router} /> :
              <SpineView contents={filteredMovies} router={router} />
            )}
          </div>
        </div>
      )}

      {currentTab === 'ANIME' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {unifiedAnimes.length > 0 && (
            <DiscoverySection 
              existingIsbns={unifiedBooks.map(c => c.contentId)} 
              existingTmdbIds={unifiedMovies.map(c => c.contentId)}
              existingAnilistIds={unifiedAnimes.map(c => c.contentId)}
              filterType="ANIME"
            />
          )}
          <div>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>🌸 애니 컬렉션</h2>
              <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>{filteredAnimes.length}개</span>
            </div>
            {filteredAnimes.length === 0 ? (
              <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-tertiary)' }}>조건에 맞는 애니메이션이 없습니다.</div>
            ) : (
              viewMode === 'grid' ? <GridView contents={filteredAnimes} router={router} type="ANIME" /> :
              viewMode === 'list' ? <ListView contents={filteredAnimes} router={router} /> :
              <SpineView contents={filteredAnimes} router={router} />
            )}
          </div>
        </div>
      )}

      {currentTab === 'INSIGHT' && (
        <InsightDashboard 
          books={unifiedBooks}
          movies={unifiedMovies}
          animes={unifiedAnimes}
        />
      )}

    </div>
  );
}

// ── 공통 카드 렌더러 ──
function renderContentGrid(title: string, icon: string, contents: ContentItem[], router: any) {
  if (contents.length === 0) return null;
  return (
    <section>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>
        {icon} {title} <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 400 }}>{contents.length}</span>
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px' }}>
        {contents.map((item) => (
          <div key={item.id} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify({ type: item.type.toLowerCase(), id: item.id }))}>
            <PosterCard
              type={item.type}
              coverUrl={item.posterUrl || ''}
              title={item.title}
              author={item.creator || undefined}
              status={item.status}
              dominantColor={item.dominantColor || undefined}
              progressPct={item.progressPct}
              rating={item.rating}
              onClick={() => router.push(`/dashboard/${item.type.toLowerCase()}/${item.id}`)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 그리드 뷰 ──
function GridView({ contents, router, type }: { contents: ContentItem[]; router: any; type: 'BOOK'|'MOVIE'|'ANIME' }) {
  const activeLabel = type === 'BOOK' ? '읽는 중' : '보는 중';
  const activeStatus = type === 'BOOK' ? 'READING' : 'WATCHING';
  const wantStatus = type === 'BOOK' ? 'WANT_TO_READ' : 'WANT_TO_WATCH';
  
  const activeContents = contents.filter(c => c.status === activeStatus);
  const wantContents = contents.filter(c => c.status === wantStatus);
  const completedContents = contents.filter(c => c.status === 'COMPLETED');
  const abandonedContents = contents.filter(c => c.status === 'DROPPED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {renderContentGrid(activeLabel, '🔥', activeContents, router)}
      {renderContentGrid('위시리스트', '💜', wantContents, router)}
      {renderContentGrid('완료됨', '✅', completedContents, router)}
      {renderContentGrid('중단', '⏹️', abandonedContents, router)}
    </div>
  );
}

// ── 리스트 뷰: 고밀도 테이블 ──
function ListView({ contents, router }: { contents: ContentItem[], router: any }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 100px 80px 100px', gap: '12px', padding: '8px 0', borderBottom: '1px solid var(--border-primary)', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
        <span /><span>제목</span><span>저자/감독</span><span>상태</span><span>평점</span>
      </div>
      {contents.map((item) => (
        <div
          key={item.id}
          draggable
          onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify({ type: item.type.toLowerCase(), id: item.id }))}
          style={{ display: 'grid', gridTemplateColumns: '48px 1fr 100px 80px 100px', gap: '12px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'grab', transition: 'background-color var(--transition-fast)' }}
          onClick={() => router.push(`/dashboard/${item.type.toLowerCase()}/${item.id}`)}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <img src={item.posterUrl || ''} alt={item.title} style={{ width: '36px', height: '52px', objectFit: 'cover', borderRadius: '4px' }} />
          <div><p className="line-clamp-1" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.type === 'MOVIE' ? '🎬' : '📚'} {item.title}</p></div>
          <span className="line-clamp-1" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.creator || '-'}</span>
          <StatusBadge status={item.status as import('@/types').BookStatus} size="sm" type={item.type} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.rating ? '★'.repeat(item.rating) : '-'}</span>
        </div>
      ))}
    </div>
  );
}

// ── 책등 뷰: 스파인 나열 ──
function SpineView({ contents, router }: { contents: ContentItem[], router: any }) {
  const completedContents = contents.filter((c) => c.status === 'COMPLETED');
  const otherContents = contents.filter((c) => c.status !== 'COMPLETED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <section>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>✅ 완료된 컬렉션 ({completedContents.length}개)</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', minHeight: '80px', alignItems: 'flex-end' }}>
          {completedContents.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify({ type: item.type.toLowerCase(), id: item.id }))}
              title={`${item.title} (${item.type === 'MOVIE' ? '영화' : '도서'})`}
              style={{ width: item.type === 'MOVIE' ? '30px' : '24px', height: `${60 + Math.random() * 30}px`, backgroundColor: item.dominantColor || 'var(--accent)', borderRadius: '2px', cursor: 'grab', transition: 'transform var(--transition-fast)', border: item.type === 'MOVIE' ? '1px solid rgba(0,0,0,0.2)' : 'none' }}
              onClick={() => router.push(`/dashboard/${item.type.toLowerCase()}/${item.id}`)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            />
          ))}
          {completedContents.length === 0 && <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>완독하거나 시청 완료한 콘텐츠가 쌓입니다.</span>}
        </div>
      </section>
      {otherContents.length > 0 && (
        <section>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>📖 진행/대기 중</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', minHeight: '60px', alignItems: 'flex-end' }}>
            {otherContents.map((item) => (
              <div key={item.id} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify({ type: item.type.toLowerCase(), id: item.id }))} title={item.title} style={{ width: item.type === 'MOVIE' ? '24px' : '20px', height: `${50 + Math.random() * 20}px`, backgroundColor: item.dominantColor || 'var(--text-tertiary)', borderRadius: '2px', cursor: 'grab', opacity: 0.6 }} onClick={() => router.push(`/dashboard/${item.type.toLowerCase()}/${item.id}`)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
