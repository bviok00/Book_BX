'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTopTags } from '@/app/dashboard/movie-actions';
import { addBookToLibrary } from '@/app/dashboard/actions';
import { addMovieToLibrary } from '@/app/dashboard/movie-actions';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import HorizontalScroll from '@/components/ui/HorizontalScroll';
import { TMDB_IMAGE_BASE, TMDB_POSTER_SIZE } from '@/types/tmdb';

interface DiscoverySectionProps {
  existingIsbns: string[];
  existingTmdbIds: string[];
  existingAnilistIds?: string[];
  filterType?: 'BOOK' | 'MOVIE' | 'ANIME';
}

interface CurationItem {
  id: string;
  type: 'BOOK' | 'MOVIE' | 'ANIME';
  title: string;
  creator: string;
  posterUrl: string;
  originalData: any;
}

export default function DiscoverySection({ existingIsbns, existingTmdbIds, existingAnilistIds = [], filterType }: DiscoverySectionProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Record<string, CurationItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [previewItem, setPreviewItem] = useState<CurationItem | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function loadCuration() {
      setIsLoading(true);
      try {
        // limit을 20으로 늘려 더 다양한 태그 가져옴
        const tagRes = await getTopTags(20, filterType);
        if (tagRes.success && tagRes.data && tagRes.data.length > 0) {
          const topTags = tagRes.data;
          setTags(topTags);

          const newRecs: Record<string, CurationItem[]> = {};

          for (const tag of topTags) {
              // 필터에 따라 필요한 API만 요청
              const fetchBooks = !filterType || filterType === 'BOOK';
              const fetchMovies = !filterType || filterType === 'MOVIE';
              const fetchAnimes = !filterType || filterType === 'ANIME';

              const promises = [];
              if (fetchBooks) promises.push(fetch(`/api/aladin?query=${encodeURIComponent(tag)}&maxResults=20`).then(res => res.json()).catch(() => ({ success: false, data: { item: [] } })));
              if (fetchMovies) promises.push(fetch(`/api/tmdb?query=${encodeURIComponent(tag)}`).then(res => res.json()).catch(() => ({ success: false, data: { results: [] } })));
              if (fetchAnimes) promises.push(fetch(`/api/anilist?query=${encodeURIComponent(tag)}`).then(res => res.json()).catch(() => ({ success: false, data: { results: [] } })));

              const resps = await Promise.all(promises);
              
              let bookJson = { success: false, data: { item: [] } };
              let movieJson = { success: false, data: { results: [] } };
              let animeJson = { success: false, data: { results: [] } };

              let i = 0;
              if (fetchBooks) bookJson = resps[i++];
              if (fetchMovies) movieJson = resps[i++];
              if (fetchAnimes) animeJson = resps[i++];

            const items: CurationItem[] = [];

            if (bookJson.success && bookJson.data?.item) {
              bookJson.data.item.forEach((b: any) => {
                if (!existingIsbns.includes(b.isbn13 || b.isbn)) {
                  items.push({
                    id: `BOOK_${b.isbn13 || b.isbn}`,
                    type: 'BOOK',
                    title: b.title,
                    creator: b.author,
                    posterUrl: b.cover,
                    originalData: b
                  });
                }
              });
            }

            if (movieJson.success && movieJson.data?.results) {
              movieJson.data.results.slice(0, 15).forEach((m: any) => {
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

            if (animeJson.success && animeJson.data?.results) {
              animeJson.data.results.slice(0, 15).forEach((a: any) => {
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

            // 필터가 있으면 필터링 후 최대 15개 노출 (한 라인을 가득 채우도록)
            const filteredItems = filterType ? items.filter(i => i.type === filterType) : items;
            newRecs[tag] = filteredItems.slice(0, 15);
          }

          setRecommendations(newRecs);
        }
      } catch (error) {
        console.error('Curation load error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadCuration();
  }, [existingIsbns, existingTmdbIds, existingAnilistIds, filterType]);

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
          router.push(`/dashboard?tab=BOOK&bookStatus=WANT_TO_READ`);
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
          router.push(`/dashboard?tab=MOVIE&movieStatus=WANT_TO_WATCH`);
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
          router.push(`/dashboard?tab=ANIME&animeStatus=WANT_TO_WATCH`);
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

  if (tags.length === 0 || Object.values(recommendations).every(r => r.length === 0)) {
    return null; // 추천할 데이터가 없으면 숨김
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* ── 추천 리스트 ── */}
      {tags.map((tag) => {
        const curations = recommendations[tag] || [];
        if (curations.length === 0) return null;

        return (
          <section key={tag} id={`tag-section-${tag}`} style={{ scrollMarginTop: '80px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--accent)', marginRight: '8px' }}>#</span>
                {tag}
              </h3>
            </div>
              
              <HorizontalScroll>
                {curations.map(item => (
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
                      variant="secondary"
                      isLoading={addingId === item.id}
                      disabled={addingId !== null}
                      onClick={(e) => { e.stopPropagation(); handleAddAndNavigate(item); }}
                      style={{ width: '100%', fontSize: '12px', padding: '4px' }}
                    >
                      + 위시리스트 추가
                    </Button>
                  </div>
                ))}
              </HorizontalScroll>
            </section>
          );
        })}
    </div>

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
                  onClick={() => handleAddAndNavigate(previewItem)}
                >
                  + 위시리스트 추가
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
