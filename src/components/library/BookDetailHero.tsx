'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateBookStatus, updateBookRating, updateBookFolder, deleteUserBook } from '@/app/dashboard/actions';
import type { BookStatus } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';

export default function BookDetailHero({ userBook, book, folders = [], isReadOnly = false }: { userBook: any, book: any, folders?: any[], isReadOnly?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState<BookStatus>(userBook.status);
  const [optimisticRating, setOptimisticRating] = useState<number>(userBook.rating || 0);
  const [optimisticFolderId, setOptimisticFolderId] = useState<string | null>(userBook.folder_id || null);

  const handleStatusChange = (newStatus: BookStatus) => {
    if (optimisticStatus === newStatus) {
      if (window.confirm('현재 상태를 취소하고 서재에서 완전히 삭제하시겠습니까?')) {
        startTransition(async () => {
          const res = await deleteUserBook(userBook.id);
          if (res.success) {
            router.push('/dashboard?tab=BOOK');
          } else {
            alert(res.message);
          }
        });
      }
      return;
    }

    setOptimisticStatus(newStatus);
    startTransition(async () => {
      await updateBookStatus(userBook.id, newStatus);
    });
  };

  const handleRatingChange = (clickedRating: number) => {
    if (isReadOnly) return;
    const newRating = optimisticRating === clickedRating ? 0 : clickedRating;
    setOptimisticRating(newRating);
    startTransition(async () => {
      await updateBookRating(userBook.id, newRating === 0 ? null : newRating);
    });
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFolderId = e.target.value === 'none' ? null : e.target.value;
    setOptimisticFolderId(newFolderId);
    startTransition(async () => {
      await updateBookFolder(userBook.id, newFolderId);
    });
  };

  const handleDelete = () => {
    if (window.confirm('위시리스트(서재)에서 이 도서를 완전히 삭제하시겠습니까?')) {
      startTransition(async () => {
        const res = await deleteUserBook(userBook.id);
        if (res.success) {
          router.push('/dashboard');
        } else {
          alert(res.message);
        }
      });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '450px', display: 'flex', alignItems: 'center' }}>
      
      {/* 백그라운드 블러 효과 (왓챠 스타일) */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${book.cover_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(60px) brightness(0.25)',
          transform: 'scale(1.1)',
          zIndex: 0,
        }}
      />
      
      {/* 그라데이션 오버레이 (밀도 상승) */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: userBook.dominant_color 
            ? `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, ${userBook.dominant_color}33 50%, var(--bg-primary) 100%)`
            : 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, var(--bg-primary) 100%)',
          zIndex: 1,
        }}
      />

      {/* 뒤로가기 버튼 */}
      <button 
        onClick={() => router.push('/dashboard')}
        style={{ position: 'absolute', top: '32px', left: '32px', zIndex: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(10px)', fontSize: '20px' }}
        className="hover-scale"
      >
        ←
      </button>

      {/* 삭제 버튼 */}
      <button 
        onClick={handleDelete}
        disabled={isPending}
        style={{ position: 'absolute', top: '32px', right: '32px', zIndex: 10, background: 'rgba(255,50,50,0.2)', border: '1px solid rgba(255,50,50,0.4)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffaaaa', cursor: 'pointer', backdropFilter: 'blur(10px)', fontSize: '18px' }}
        className="hover-scale"
        title="서재에서 삭제"
      >
        🗑️
      </button>

      {/* 컨텐츠 컨테이너 */}
      <div 
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '64px 32px',
          display: 'flex',
          gap: '48px',
          width: '100%',
          alignItems: 'flex-end',
          flexWrap: 'wrap'
        }}
      >
        {/* 책 표지 (전경) */}
        <div style={{ flexShrink: 0 }}>
          <img 
            src={book.cover_url} 
            alt={book.title}
            style={{
              width: '220px',
              height: 'auto',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          />
        </div>

        {/* 책 정보 (제목, 저자, 버튼) */}
        <div style={{ flex: '1', minWidth: '300px', color: '#fff', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <StatusBadge status={optimisticStatus} size="sm" />
            {book.category && (
              <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                {book.category.split('>')[0]}
              </span>
            )}
            <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
              알라딘 평점 8.5
            </span>
            <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
              320 쪽
            </span>
            <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
              2023.10.15 출간
            </span>
          </div>

          <h1 style={{ fontSize: '36px', fontWeight: 800, marginTop: '4px', marginBottom: '8px', lineHeight: 1.2 }}>
            {book.title}
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginBottom: '32px' }}>
            {book.author} · {book.publisher}
          </p>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '32px', 
            width: 'fit-content' 
          }}>
            {/* 상태 변경 버튼들 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              
              {isReadOnly ? (
                <button 
                  onClick={() => {
                    startTransition(async () => {
                      const { addBookToLibrary } = await import('@/app/dashboard/actions');
                      const res = await addBookToLibrary(book.isbn, {
                        title: book.title,
                        author: book.author,
                        publisher: book.publisher,
                        cover_url: book.cover_url,
                        category: book.category,
                        aladin_toc: book.aladin_toc
                      });
                      if (res.success && res.data) {
                        router.refresh();
                      } else {
                        alert(res.message);
                      }
                    });
                  }}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: 'var(--accent)',
                    color: '#000',
                    fontWeight: 700,
                    cursor: isPending ? 'wait' : 'pointer',
                    opacity: isPending ? 0.7 : 1,
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  className="hover-scale"
                >
                  {isPending ? '추가 중...' : '+ 서재(위시리스트)에 추가'}
                </button>
              ) : (
                <>
                  {(['WANT_TO_READ', 'READING', 'COMPLETED'] as BookStatus[]).map((status) => (
                    <button
                      key={status}
                      disabled={isPending}
                      onClick={() => handleStatusChange(status)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 'var(--radius-md)',
                        border: optimisticStatus === status ? 'none' : '1px solid rgba(255,255,255,0.3)',
                        background: optimisticStatus === status ? 'var(--accent)' : 'transparent',
                        color: optimisticStatus === status ? '#fff' : 'rgba(255,255,255,0.8)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        backdropFilter: 'blur(5px)',
                        transition: 'all 0.2s',
                        opacity: isPending ? 0.7 : 1,
                        whiteSpace: 'nowrap'
                      }}
                      className="hover-scale"
                    >
                      {status === 'WANT_TO_READ' ? '위시리스트' : status === 'READING' ? '읽는 중' : '완독'}
                    </button>
                  ))}

                  {/* 폴더 선택 드롭다운 */}
                  <select
                    value={optimisticFolderId || 'none'}
                    onChange={handleFolderChange}
                    disabled={isPending}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      background: 'rgba(0,0,0,0.4)',
                      color: 'rgba(255,255,255,0.9)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backdropFilter: 'blur(5px)',
                      transition: 'all 0.2s',
                      outline: 'none',
                      opacity: isPending ? 0.7 : 1
                    }}
                  >
                    <option value="none" style={{ background: '#1a1a1a', color: '#fff' }}>📁 폴더 미지정</option>
                    {folders.filter(f => f.media_type === 'BOOK').map(f => (
                      <option key={f.id} value={f.id} style={{ background: '#1a1a1a', color: '#fff' }}>{f.name}</option>
                    ))}
                    </select>

                    {/* 별점 평가 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>내 평가</span>
                      <div style={{ display: 'flex', gap: '4px', fontSize: '24px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            onClick={() => handleRatingChange(star)}
                            style={{
                              cursor: 'pointer',
                              color: star <= optimisticRating ? '#FFD700' : 'rgba(255,255,255,0.2)',
                              transition: 'color 0.2s',
                              textShadow: star <= optimisticRating ? '0 0 10px rgba(255,215,0,0.5)' : 'none'
                            }}
                            className="hover-scale"
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
