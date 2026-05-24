'use client';

import { useState, useTransition, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createLoungePost, getMyLibraryItems } from '@/app/dashboard/lounge-actions';
import { updateMovieRating } from '@/app/dashboard/movie-actions';
import { updateBookRating } from '@/app/dashboard/actions';
import { updateAnimeRating } from '@/app/dashboard/anime-actions';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Modal from '@/components/ui/Modal';
import GlobalSelectModal from '@/components/library/GlobalSelectModal';

function LoungeWriteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [mediaType, setMediaType] = useState<'BOOK' | 'MOVIE' | 'ANIME' | ''>('');
  
  // 선택된 컨텐츠 메타데이터
  const [mediaId, setMediaId] = useState<string>('');
  const [posterUrl, setPosterUrl] = useState<string>('');
  const [contentTitle, setContentTitle] = useState<string>('');
  const [rating, setRating] = useState<number | undefined>(undefined);

  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 모달 상태
  const [isLibrarySearchOpen, setIsLibrarySearchOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  
  const [myItems, setMyItems] = useState<any[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  useEffect(() => {
    // 쿼리 파라미터에서 초기값 설정
    const typeParam = searchParams.get('type');
    const idParam = searchParams.get('id');
    const titleParam = searchParams.get('title');
    const posterParam = searchParams.get('poster');
    const ratingParam = searchParams.get('rating');

    if (typeParam === 'BOOK' || typeParam === 'MOVIE' || typeParam === 'ANIME') {
      setMediaType(typeParam);
    }
    if (idParam) setMediaId(idParam);
    if (titleParam) setContentTitle(titleParam);
    if (posterParam) setPosterUrl(posterParam);
    if (ratingParam) setRating(Number(ratingParam));
  }, [searchParams]);

  useEffect(() => {
    if (!isPreview && textareaRef.current) {
      textareaRef.current.style.height = '300px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.max(300, scrollHeight) + 'px';
    }
  }, [content, isPreview]);

  const loadMyLibrary = async () => {
    if (myItems.length > 0) return; // 이미 로드됨
    setIsLoadingItems(true);
    const res = await getMyLibraryItems();
    if (res.success && res.data) {
      setMyItems(res.data);
    }
    setIsLoadingItems(false);
  };

  const handleOpenLibrarySearch = () => {
    setIsLibrarySearchOpen(true);
    loadMyLibrary();
  };

  const handleOpenGlobalSearch = () => {
    setIsGlobalSearchOpen(true);
  };

  const handleSelectItem = (item: any) => {
    setMediaType(item.type);
    setMediaId(item.id);
    setContentTitle(item.title);
    setPosterUrl(item.posterUrl || '');
    setRating(item.rating);
    setIsLibrarySearchOpen(false);
  };

  const handleSelectGlobalItem = (data: { type: 'BOOK' | 'MOVIE' | 'ANIME', id: string, title: string, posterUrl: string }) => {
    setMediaType(data.type);
    setMediaId(data.id);
    setContentTitle(data.title);
    setPosterUrl(data.posterUrl);
    setRating(undefined); // 통합 검색은 아직 평가하지 않은 항목이므로 평점 없음
  };

  const handleClearSelection = () => {
    setMediaType('');
    setMediaId('');
    setContentTitle('');
    setPosterUrl('');
    setRating(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    startTransition(async () => {
      // 1. 내 라이브러리 항목(UUID)인 경우 별점 연동
      if (mediaId && mediaId.includes('-') && rating !== undefined) {
        try {
          if (mediaType === 'MOVIE') await updateMovieRating(mediaId, rating === 0 ? null : rating);
          else if (mediaType === 'BOOK') await updateBookRating(mediaId, rating === 0 ? null : rating);
          else if (mediaType === 'ANIME') await updateAnimeRating(mediaId, rating === 0 ? 0 : rating);
        } catch (e) {
          console.error('별점 연동 실패:', e);
        }
      }

      // 2. 라운지 포스트 생성
      const res = await createLoungePost({
        title,
        content,
        mediaType: mediaType || undefined,
        mediaId: mediaId || undefined,
        posterUrl: posterUrl || undefined,
        contentTitle: contentTitle || undefined,
        rating: rating !== undefined ? rating : undefined
      });
      
      if (res.success) {
        router.push(`/dashboard/lounge/${res.data}`);
      } else {
        alert(res.message);
      }
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* 연결된 컨텐츠 영역 */}
        <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>연결된 컨텐츠</span>
            {mediaId ? (
              <button type="button" onClick={handleClearSelection} style={{ fontSize: '12px', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>해제하기</button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={handleOpenGlobalSearch} style={{ fontSize: '13px', background: 'none', color: 'var(--accent)', border: '1px solid var(--accent)', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>통합 검색</button>
                <button type="button" onClick={handleOpenLibrarySearch} style={{ fontSize: '13px', background: 'var(--accent)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>내 라이브러리</button>
              </div>
            )}
          </div>

          {mediaId ? (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {posterUrl ? (
                <img src={posterUrl} alt={contentTitle} style={{ width: '48px', height: '72px', objectFit: 'cover', borderRadius: '4px' }} />
              ) : (
                <div style={{ width: '48px', height: '72px', background: 'var(--bg-card)', borderRadius: '4px' }} />
              )}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-secondary)', marginBottom: '4px', display: 'inline-block' }}>
                  {mediaType === 'MOVIE' ? '🎬 영화' : mediaType === 'BOOK' ? '📚 도서' : '🌸 애니'}
                </span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{contentTitle}</div>
                {rating !== undefined && rating !== null && <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>⭐️ {rating}점</div>}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', padding: '12px 0' }}>선택된 컨텐츠가 없습니다. 자유로운 주제의 일반 글로 작성됩니다.</div>
          )}
        </div>

        {/* 일반 글인 경우 미디어 타입만 강제 지정할수도 있도록 유지 */}
        {!mediaId && (
          <div style={{ display: 'flex', gap: '12px' }}>
            {(['', 'MOVIE', 'BOOK', 'ANIME'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setMediaType(type)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: type === mediaType ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                  background: type === mediaType ? 'var(--accent-light)' : 'transparent',
                  color: type === mediaType ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {type === '' ? '일반' : type === 'MOVIE' ? '🎬 영화' : type === 'BOOK' ? '📚 도서' : '🌸 애니'}
              </button>
            ))}
          </div>
        )}

        {/* 제목 입력 */}
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPending}
          style={{
            width: '100%',
            fontSize: '24px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '12px 0',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
        />

        {/* 에디터/미리보기 탭 */}
        <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
          <button
            type="button"
            onClick={() => setIsPreview(false)}
            style={{
              background: 'none', border: 'none', padding: 0,
              fontSize: '15px', fontWeight: !isPreview ? 700 : 500,
              color: !isPreview ? 'var(--text-primary)' : 'var(--text-tertiary)',
              cursor: 'pointer'
            }}
          >
            에디터
          </button>
          <button
            type="button"
            onClick={() => setIsPreview(true)}
            style={{
              background: 'none', border: 'none', padding: 0,
              fontSize: '15px', fontWeight: isPreview ? 700 : 500,
              color: isPreview ? 'var(--text-primary)' : 'var(--text-tertiary)',
              cursor: 'pointer'
            }}
          >
            미리보기
          </button>
        </div>

        {/* 본문 영역 */}
        {isPreview ? (
          <div className="markdown-body" style={{ minHeight: '300px', padding: '16px 0', color: 'var(--text-primary)', lineHeight: 1.8 }}>
            {content.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
              <div style={{ color: 'var(--text-tertiary)' }}>미리보기할 내용이 없습니다.</div>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            placeholder="마크다운(Markdown)을 지원합니다. 자유롭게 생각을 적어보세요!"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isPending}
            style={{
              width: '100%',
              minHeight: '300px',
              background: 'transparent',
              border: 'none',
              resize: 'none',
              color: 'var(--text-primary)',
              fontSize: '16px',
              lineHeight: 1.8,
              outline: 'none',
              padding: '16px 0'
            }}
          />
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          {/* 내 평점 입력 (컨텐츠가 선택된 경우에만 활성화하거나 자유롭게 냅두거나) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>내 평점</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(rating === star ? undefined : star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: rating && star <= rating ? '#FFD700' : 'var(--border-secondary)',
                    transition: 'color 0.2s, transform 0.1s',
                    padding: 0,
                    lineHeight: 1
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  ★
                </button>
              ))}
            </div>
            {rating && <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{rating}점</span>}
          </div>

          <button
            type="submit"
            disabled={isPending || !title.trim() || !content.trim()}
            style={{
              padding: '12px 32px',
              backgroundColor: 'var(--accent)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 700,
              border: 'none',
              borderRadius: 'var(--radius-full)',
              cursor: (isPending || !title.trim() || !content.trim()) ? 'not-allowed' : 'pointer',
              opacity: (isPending || !title.trim() || !content.trim()) ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
            className="hover-scale"
          >
            {isPending ? '게시 중...' : '게시하기'}
          </button>
        </div>
      </form>

      <GlobalSelectModal 
        isOpen={isGlobalSearchOpen} 
        onClose={() => setIsGlobalSearchOpen(false)} 
        onSelect={handleSelectGlobalItem} 
      />

      <Modal isOpen={isLibrarySearchOpen} onClose={() => setIsLibrarySearchOpen(false)} title="내 라이브러리에서 선택">
        <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
          {isLoadingItems ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>불러오는 중...</div>
          ) : myItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>라이브러리에 저장된 항목이 없습니다.</div>
          ) : (
            myItems.map(item => (
              <div 
                key={`${item.type}_${item.id}`} 
                className="hover-bg"
                style={{ display: 'flex', gap: '16px', padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                onClick={() => handleSelectItem(item)}
              >
                {item.posterUrl ? (
                  <img src={item.posterUrl} alt={item.title} style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                ) : (
                  <div style={{ width: '40px', height: '60px', background: 'var(--bg-secondary)', borderRadius: '4px' }} />
                )}
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)' }}>
                    {item.type === 'MOVIE' ? '🎬 영화' : item.type === 'BOOK' ? '📚 도서' : '🌸 애니'}
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>{item.title}</div>
                  {item.rating !== null && <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>⭐️ {item.rating}점</div>}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  );
}

export default function LoungeWritePage() {
  const router = useRouter();
  
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          새 라운지 글쓰기
        </h1>
        <button 
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
        >
          돌아가기
        </button>
      </div>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>로딩 중...</div>}>
        <LoungeWriteForm />
      </Suspense>
    </div>
  );
}
