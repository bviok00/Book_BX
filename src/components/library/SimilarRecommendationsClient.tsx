'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import HorizontalScroll from '@/components/ui/HorizontalScroll';
import { addBookToLibrary } from '@/app/dashboard/actions';
import { addMovieToLibrary } from '@/app/dashboard/movie-actions';
import type { CurationItem } from '@/types';

interface SimilarRecommendationsClientProps {
  title: string;
  items: CurationItem[];
}

export default function SimilarRecommendationsClient({ title, items }: SimilarRecommendationsClientProps) {
  const [previewItem, setPreviewItem] = useState<CurationItem | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const { showToast } = useToast();
  const router = useRouter();

  if (!items || items.length === 0) return null;

  const handleAddAndNavigate = async (item: CurationItem) => {
    setAddingId(item.id);
    try {
      if (item.type === 'BOOK') {
        const b = item.originalData;
        const result = await addBookToLibrary(b.isbn13 || b.isbn, {
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
      } else {
        const m = item.originalData;
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
      }
    } catch (e) {
      console.error(e);
      showToast('콘텐츠 추가 중 오류가 발생했습니다.', 'error');
    } finally {
      setAddingId(null);
    }
  };

  const handleGoToDetail = (item: CurationItem) => {
    if (item.type === 'BOOK') {
      const b = item.originalData;
      router.push(`/dashboard/book/${b.isbn13 || b.isbn}`);
    } else {
      const m = item.originalData;
      router.push(`/dashboard/movie/${m.id}`);
    }
  };

  return (
    <section style={{ marginTop: '48px', marginBottom: '48px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
        {title}
      </h3>
      
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
            onClick={() => setPreviewItem(item)}
            className="card-glow"
          >
            <div style={{ position: 'relative', aspectRatio: '2/3', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--bg-card)' }}>
              {item.posterUrl ? (
                <img src={item.posterUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>No Image</div>
              )}
              <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: '#fff', fontWeight: 600 }}>
                {item.type === 'BOOK' ? '도서' : '영화'}
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

      {/* Preview Modal */}
      {previewItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '24px'
        }} onClick={() => setPreviewItem(null)}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)', maxWidth: '600px', width: '100%',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 24px 50px rgba(0,0,0,0.5)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ position: 'relative', width: '100%', height: '200px' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${previewItem.posterUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(40px) brightness(0.4)' }} />
              <div style={{ position: 'relative', display: 'flex', gap: '24px', padding: '24px', height: '100%' }}>
                <img src={previewItem.posterUrl} style={{ height: '100%', borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} />
                <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '12px', background: 'var(--accent)', padding: '2px 8px', borderRadius: '4px', width: 'fit-content', marginBottom: '8px', fontWeight: 600 }}>
                    {previewItem.type === 'BOOK' ? '도서 추천' : '영화 추천'}
                  </div>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1.2, marginBottom: '4px' }}>{previewItem.title}</h2>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>{previewItem.creator}</p>
                </div>
              </div>
              <button onClick={() => setPreviewItem(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer', opacity: 0.5 }}>×</button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }} className="line-clamp-4">
                  {previewItem.originalData.overview || previewItem.originalData.description || '상세 설명이 없습니다.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Button 
                  size="lg" variant="primary" style={{ flex: 1, fontWeight: 700 }}
                  isLoading={addingId === previewItem.id}
                  onClick={() => handleAddAndNavigate(previewItem)}
                >
                  + 위시리스트 추가
                </Button>
                <Button 
                  size="lg" variant="secondary" style={{ flex: 1, fontWeight: 700 }}
                  isLoading={false}
                  onClick={() => handleGoToDetail(previewItem)}
                >
                  상세페이지로 이동
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
