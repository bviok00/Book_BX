'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { addBookToLibrary } from '@/app/dashboard/actions';
import { addMovieToLibrary } from '@/app/dashboard/movie-actions';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import HorizontalScroll from '@/components/ui/HorizontalScroll';
import { TMDB_IMAGE_BASE, TMDB_POSTER_SIZE } from '@/types/tmdb';
import type { ContentItem } from '@/types';

interface DiscoverySectionProps {
  existingIsbns: string[];
  existingTmdbIds: string[];
  existingAnilistIds?: string[];
  filterType?: 'BOOK' | 'MOVIE' | 'ANIME';
  baseItems?: ContentItem[];
}

interface CurationItem {
  id: string;
  type: 'BOOK' | 'MOVIE' | 'ANIME';
  title: string;
  creator: string;
  posterUrl: string;
  originalData: any;
}

export default function DiscoverySection({ existingIsbns, existingTmdbIds, existingAnilistIds = [], filterType, baseItems = [] }: DiscoverySectionProps) {
  const [baseTitleRecs, setBaseTitleRecs] = useState<Record<string, { title: string, items: CurationItem[] }>>({});
  const [globalRecs, setGlobalRecs] = useState<{ title: string, emoji: string, items: CurationItem[] }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewItem, setPreviewItem] = useState<CurationItem | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [localAddedIds, setLocalAddedIds] = useState<Set<string>>(new Set());
  const { showToast } = useToast();
  const router = useRouter();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    async function loadCuration() {
      if (hasLoadedRef.current) return;
      setIsLoading(true);
      hasLoadedRef.current = true;
      try {
        const { 
          getSimilarMovies, 
          getSimilarAnimes, 
          getSimilarBooks,
          getGlobalBooks,
          getGlobalMovies,
          getGlobalAnimes 
        } = await import('@/app/dashboard/similar-actions');
        
        // 1. 선호도 기반 후보 추출 (평점 4점 이상 우선, 부족하면 최근 다른 작품들로 충당하여 최소 3개)
        const highRated = baseItems.filter(item => item.rating && item.rating >= 4);
        const remaining = baseItems.filter(item => !(item.rating && item.rating >= 4));
        
        const shuffledHigh = [...highRated].sort(() => 0.5 - Math.random());
        const shuffledRemaining = [...remaining].sort(() => 0.5 - Math.random());
        
        const randomBases = [...shuffledHigh, ...shuffledRemaining].slice(0, 3);
        
        const newRecs: Record<string, { title: string, items: CurationItem[] }> = {};

        for (const base of randomBases) {
          const items: CurationItem[] = [];

          if (base.type === 'BOOK') {
            const res = await getSimilarBooks(base.contentId, base.genre || null, base.creator || null);
            if (res.success && res.data) {
              res.data.forEach((item: any) => {
                if (!existingIsbns.includes(item.isbn13 || item.isbn)) {
                  items.push({
                    id: `BOOK_${item.isbn13 || item.isbn}`,
                    type: 'BOOK',
                    title: item.title,
                    creator: item.author,
                    posterUrl: item.cover,
                    originalData: item
                  });
                }
              });
            }
          } else if (base.type === 'MOVIE') {
            const res = await getSimilarMovies(base.contentId);
            if (res.success && res.data) {
              res.data.forEach((m: any) => {
                if (!existingTmdbIds.includes(String(m.id))) {
                  items.push({
                    id: `MOVIE_${m.id}`,
                    type: 'MOVIE',
                    title: m.title,
                    creator: m.original_title,
                    posterUrl: m.poster_path ? `${TMDB_IMAGE_BASE}/${TMDB_POSTER_SIZE}${m.poster_path}` : '',
                    originalData: m
                  });
                }
              });
            }
          } else if (base.type === 'ANIME') {
            const res = await getSimilarAnimes(base.contentId);
            if (res.success && res.data) {
              res.data.forEach((a: any) => {
                if (!existingAnilistIds.includes(String(a.id))) {
                  items.push({
                    id: `ANIME_${a.id}`,
                    type: 'ANIME',
                    title: a.title?.romaji || a.title?.english || a.title?.native || 'Unknown',
                    creator: a.title?.native || '',
                    posterUrl: a.coverImage?.large || a.coverImage?.extraLarge || '',
                    originalData: a
                  });
                }
              });
            }
          }

          if (items.length > 0) {
            newRecs[base.id] = { title: base.title, items: items.slice(0, 15) };
          }
        }

        setBaseTitleRecs(newRecs);

        // 2. 글로벌 큐레이션 리스트 (베스트셀러, 실시간 인기 순위 등) 추가
        const loadedGlobal: { title: string, emoji: string, items: CurationItem[] }[] = [];

        if (filterType === 'BOOK') {
          // 베스트셀러
          const bestRes = await getGlobalBooks('Bestseller');
          if (bestRes.success && bestRes.data) {
            const items = bestRes.data
              .filter((item: any) => !existingIsbns.includes(item.isbn13 || item.isbn))
              .map((item: any) => ({
                id: `BOOK_BEST_${item.isbn13 || item.isbn}`,
                type: 'BOOK' as const,
                title: item.title,
                creator: item.author,
                posterUrl: item.cover,
                originalData: item
              }));
            if (items.length > 0) {
              loadedGlobal.push({
                title: '지금 서점가에서 가장 핫한 베스트셀러',
                emoji: '🏆',
                items: items.slice(0, 15)
              });
            }
          }

          // 주목할 만한 신간
          const newRes = await getGlobalBooks('ItemNewSpecial');
          if (newRes.success && newRes.data) {
            const items = newRes.data
              .filter((item: any) => !existingIsbns.includes(item.isbn13 || item.isbn))
              .map((item: any) => ({
                id: `BOOK_NEW_${item.isbn13 || item.isbn}`,
                type: 'BOOK' as const,
                title: item.title,
                creator: item.author,
                posterUrl: item.cover,
                originalData: item
              }));
            if (items.length > 0) {
              loadedGlobal.push({
                title: '독서 애호가들이 주목하는 화제의 신간',
                emoji: '✨',
                items: items.slice(0, 15)
              });
            }
          }
        } else if (filterType === 'MOVIE') {
          // 인기 영화
          const popRes = await getGlobalMovies('popular');
          if (popRes.success && popRes.data) {
            const items = popRes.data
              .filter((m: any) => !existingTmdbIds.includes(String(m.id)))
              .map((m: any) => ({
                id: `MOVIE_POP_${m.id}`,
                type: 'MOVIE' as const,
                title: m.title,
                creator: m.original_title,
                posterUrl: m.poster_path ? `${TMDB_IMAGE_BASE}/${TMDB_POSTER_SIZE}${m.poster_path}` : '',
                originalData: m
              }));
            if (items.length > 0) {
              loadedGlobal.push({
                title: '지금 트렌디하게 떠오르는 인기 영화',
                emoji: '🔥',
                items: items.slice(0, 15)
              });
            }
          }

          // 높은 평점
          const topRes = await getGlobalMovies('top_rated');
          if (topRes.success && topRes.data) {
            const items = topRes.data
              .filter((m: any) => !existingTmdbIds.includes(String(m.id)))
              .map((m: any) => ({
                id: `MOVIE_TOP_${m.id}`,
                type: 'MOVIE' as const,
                title: m.title,
                creator: m.original_title,
                posterUrl: m.poster_path ? `${TMDB_IMAGE_BASE}/${TMDB_POSTER_SIZE}${m.poster_path}` : '',
                originalData: m
              }));
            if (items.length > 0) {
              loadedGlobal.push({
                title: '누구나 인정하는 최고의 명작 영화 컬렉션',
                emoji: '⭐️',
                items: items.slice(0, 15)
              });
            }
          }
        } else if (filterType === 'ANIME') {
          // 인기 애니
          const popRes = await getGlobalAnimes('POPULARITY_DESC');
          if (popRes.success && popRes.data) {
            const items = popRes.data
              .filter((a: any) => !existingAnilistIds.includes(String(a.id)))
              .map((a: any) => ({
                id: `ANIME_POP_${a.id}`,
                type: 'ANIME' as const,
                title: a.title?.romaji || a.title?.english || a.title?.native || 'Unknown',
                creator: a.title?.native || '',
                posterUrl: a.coverImage?.large || a.coverImage?.extraLarge || '',
                originalData: a
              }));
            if (items.length > 0) {
              loadedGlobal.push({
                title: '이번 시즌 가장 핫한 인기 애니메이션',
                emoji: '⚡️',
                items: items.slice(0, 15)
              });
            }
          }

          // 명작 애니
          const topRes = await getGlobalAnimes('SCORE_DESC');
          if (topRes.success && topRes.data) {
            const items = topRes.data
              .filter((a: any) => !existingAnilistIds.includes(String(a.id)))
              .map((a: any) => ({
                id: `ANIME_TOP_${a.id}`,
                type: 'ANIME' as const,
                title: a.title?.romaji || a.title?.english || a.title?.native || 'Unknown',
                creator: a.title?.native || '',
                posterUrl: a.coverImage?.large || a.coverImage?.extraLarge || '',
                originalData: a
              }));
            if (items.length > 0) {
              loadedGlobal.push({
                title: '마니아들이 극찬한 최고의 평점 명작 애니',
                emoji: '🌟',
                items: items.slice(0, 15)
              });
            }
          }
        }

        setGlobalRecs(loadedGlobal);
      } catch (error) {
        console.error('Curation load error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (baseItems.length > 0 || filterType) {
      loadCuration();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, baseItems]);

  const handleAddAndNavigate = async (item: CurationItem) => {
    setAddingId(item.id);
    try {
      if (item.type === 'BOOK') {
        const b = item.originalData;
        const result = await addBookToLibrary(b.isbn13, {
          title: b.title,
          author: b.author,
          publisher: b.publisher,
          cover_url: b.cover,
          category: b.categoryName
        });
        if (result.success && result.data) {
          showToast(result.message, 'success');
          setLocalAddedIds(prev => new Set(prev).add(item.id));
        } else {
          showToast(result.message, 'error');
        }
      } else if (item.type === 'MOVIE') {
        const m = item.originalData;
        const { addMovieToLibrary } = await import('@/app/dashboard/movie-actions');
        const result = await addMovieToLibrary(m.id, {
          title: m.title,
          original_title: m.original_title,
          director: null,
          poster_url: item.posterUrl,
          backdrop_url: null,
          genre: null,
          release_date: m.release_date,
          runtime_min: null,
          overview: m.overview,
          metadata: { vote_average: m.vote_average }
        });
        if (result.success && result.data) {
          showToast(result.message, 'success');
          setLocalAddedIds(prev => new Set(prev).add(item.id));
        } else {
          showToast(result.message, 'error');
        }
      } else if (item.type === 'ANIME') {
        const a = item.originalData;
        const { addAnimeToLibrary } = await import('@/app/dashboard/anime-actions');
        const result = await addAnimeToLibrary(a.id, {
          title: a.title?.romaji || a.title?.english || a.title?.native || 'Unknown',
          original_title: a.title?.native,
          director: null,
          poster_url: item.posterUrl,
          backdrop_url: a.bannerImage,
          genre: a.genres?.join(', '),
          release_date: a.startDate?.year ? `${a.startDate.year}-${String(a.startDate.month || 1).padStart(2, '0')}-${String(a.startDate.day || 1).padStart(2, '0')}` : null,
          runtime_min: a.duration,
          overview: a.description,
          metadata: { episodes: a.episodes, averageScore: a.averageScore }
        });
        if (result.success && result.data) {
          showToast(result.message, 'success');
          setLocalAddedIds(prev => new Set(prev).add(item.id));
        } else {
          showToast(result.message, 'error');
        }
      }
    } catch (e) {
      showToast('추가 중 오류가 발생했습니다.', 'error');
    } finally {
      setAddingId(null);
      setPreviewItem(null);
    }
  };

  const handleGoToDetail = (item: CurationItem) => {
    if (item.type === 'BOOK') {
      const b = item.originalData;
      router.push(`/dashboard/book/${b.isbn13 || b.isbn}`);
    } else if (item.type === 'MOVIE') {
      const m = item.originalData;
      router.push(`/dashboard/movie/${m.id}`);
    } else if (item.type === 'ANIME') {
      const a = item.originalData;
      router.push(`/dashboard/anime/${a.id}`);
    }
  };

  const handleCardClick = (item: CurationItem) => {
    setPreviewItem(item);
  };

  if (isLoading) {
    return (
      <div style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        🔭 관심사 기반 콘텐츠를 발굴하는 중...
      </div>
    );
  }

  if (Object.keys(baseTitleRecs).length === 0 && globalRecs.length === 0) {
    return null; // 추천할 데이터가 없으면 숨김
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      
      {/* ── 글로벌 큐레이션 리스트 ── */}
      {globalRecs.map((section, idx) => {
        if (section.items.length === 0) return null;

        return (
          <section key={`global-${idx}`} style={{ scrollMarginTop: '80px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                <span style={{ fontSize: '20px', marginRight: '8px' }}>{section.emoji}</span>
                {section.title}
              </h3>
            </div>
              
            <HorizontalScroll>
              {section.items.map(item => (
                <div
                  key={item.id}
                  style={{
                    minWidth: '140px',
                    maxWidth: '140px',
                    flexShrink: 0,
                    scrollSnapAlign: 'start',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleCardClick(item)}
                  className="card-glow"
                >
                  <div style={{ position: 'relative', aspectRatio: '2/3', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--bg-card)' }}>
                    {item.posterUrl ? (
                      <img src={item.posterUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>No Image</div>
                    )}
                    <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: '#fff', fontWeight: 600 }}>
                      {item.type === 'BOOK' ? '도서' : item.type === 'MOVIE' ? '영화' : '애니'}
                    </div>
                  </div>
                  <div>
                    <p className="line-clamp-1" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</p>
                    <p className="line-clamp-1" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.creator}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={localAddedIds.has(item.id) ? "primary" : "secondary"}
                    isLoading={addingId === item.id}
                    disabled={addingId !== null || localAddedIds.has(item.id)}
                    onClick={(e) => { e.stopPropagation(); handleAddAndNavigate(item); }}
                    style={{ width: '100%', fontSize: '12px', padding: '4px' }}
                  >
                    {localAddedIds.has(item.id) ? '✔ 추가됨' : '+ 위시리스트 추가'}
                  </Button>
                </div>
              ))}
            </HorizontalScroll>
          </section>
        );
      })}

      {/* ── 개인화 추천 리스트 ── */}
      {Object.entries(baseTitleRecs).map(([baseId, { title, items }]) => {
        if (items.length === 0) return null;

        return (
          <section key={baseId} style={{ scrollMarginTop: '80px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                <span style={{ fontSize: '20px', marginRight: '8px' }}>🍿</span>
                <span style={{ color: 'var(--accent)' }}>[{title}]</span>을(를) 재밌게 본 당신에게
              </h3>
            </div>
              
            <HorizontalScroll>
              {items.map(item => (
                <div
                  key={item.id}
                  style={{
                    minWidth: '140px',
                    maxWidth: '140px',
                    flexShrink: 0,
                    scrollSnapAlign: 'start',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleCardClick(item)}
                  className="card-glow"
                >
                  <div style={{ position: 'relative', aspectRatio: '2/3', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--bg-card)' }}>
                    {item.posterUrl ? (
                      <img src={item.posterUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>No Image</div>
                    )}
                    <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: '#fff', fontWeight: 600 }}>
                      {item.type === 'BOOK' ? '도서' : item.type === 'MOVIE' ? '영화' : '애니'}
                    </div>
                  </div>
                  <div>
                    <p className="line-clamp-1" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</p>
                    <p className="line-clamp-1" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.creator}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={localAddedIds.has(item.id) ? "primary" : "secondary"}
                    isLoading={addingId === item.id}
                    disabled={addingId !== null || localAddedIds.has(item.id)}
                    onClick={(e) => { e.stopPropagation(); handleAddAndNavigate(item); }}
                    style={{ width: '100%', fontSize: '12px', padding: '4px' }}
                  >
                    {localAddedIds.has(item.id) ? '✔ 추가됨' : '+ 위시리스트 추가'}
                  </Button>
                </div>
              ))}
            </HorizontalScroll>
          </section>
        );
      })}


      {/* Preview Modal */}
      {previewItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }} onClick={() => setPreviewItem(null)}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            maxWidth: '600px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 24px 50px rgba(0,0,0,0.5)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ position: 'relative', width: '100%', height: '200px' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${previewItem.posterUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(40px) brightness(0.4)' }} />
              <div style={{ position: 'relative', display: 'flex', gap: '24px', padding: '24px', height: '100%' }}>
                <img src={previewItem.posterUrl} style={{ height: '100%', borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} />
                <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '12px', background: 'var(--accent)', padding: '2px 8px', borderRadius: '4px', width: 'fit-content', marginBottom: '8px', fontWeight: 600 }}>
                    {previewItem.type === 'BOOK' ? '도서 추천' : previewItem.type === 'MOVIE' ? '영화 추천' : '애니 추천'}
                  </div>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1.2, marginBottom: '4px' }}>{previewItem.title}</h2>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>{previewItem.creator}</p>
                </div>
              </div>
              <button onClick={() => setPreviewItem(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer', opacity: 0.5 }}>×</button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>소개</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, maxHeight: '150px', overflowY: 'auto' }}>
                  {previewItem.type === 'BOOK' 
                    ? (previewItem.originalData.description || '책 소개가 없습니다.')
                    : previewItem.type === 'MOVIE' 
                      ? (previewItem.originalData.overview || '영화 소개가 없습니다.')
                      : (previewItem.originalData.description || '애니메이션 소개가 없습니다.')}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Button 
                  size="lg" 
                  variant="primary" 
                  style={{ flex: 1, fontWeight: 700 }}
                  isLoading={addingId === previewItem.id}
                  disabled={addingId !== null || localAddedIds.has(previewItem.id)}
                  onClick={() => handleAddAndNavigate(previewItem)}
                >
                  {localAddedIds.has(previewItem.id) ? '✔ 추가됨' : '+ 위시리스트 추가'}
                </Button>
                <Button 
                  size="lg" 
                  variant="secondary" 
                  style={{ flex: 1, fontWeight: 700 }}
                  isLoading={false} // 위시리스트 추가와 별개이므로 로딩 표시 제거
                  onClick={() => handleGoToDetail(previewItem)}
                >
                  상세페이지로 이동
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
