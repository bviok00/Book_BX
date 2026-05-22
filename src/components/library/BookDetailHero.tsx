'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateBookStatus, updateBookRating } from '@/app/dashboard/actions';
import type { BookStatus } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';

export default function BookDetailHero({ userBook, book }: { userBook: any, book: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState<BookStatus>(userBook.status);
  const [optimisticRating, setOptimisticRating] = useState<number>(userBook.rating || 0);

  const handleStatusChange = (newStatus: BookStatus) => {
    setOptimisticStatus(newStatus);
    startTransition(async () => {
      await updateBookStatus(userBook.id, newStatus);
    });
  };

  const handleRatingChange = (newRating: number) => {
    setOptimisticRating(newRating);
    startTransition(async () => {
      await updateBookRating(userBook.id, newRating);
    });
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
          filter: 'blur(40px) brightness(0.3)',
          transform: 'scale(1.1)',
          zIndex: 0,
        }}
      />
      
      {/* 그라데이션 오버레이 */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, var(--bg-primary) 100%)',
          zIndex: 1,
        }}
      />

      {/* 뒤로가기 버튼 */}
      <button 
        onClick={() => router.push('/dashboard')}
        style={{
          position: 'absolute',
          top: '32px',
          left: '32px',
          zIndex: 10,
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          fontSize: '20px'
        }}
        className="hover-scale"
      >
        ←
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
          <StatusBadge status={optimisticStatus} size="sm" />
          <h1 style={{ fontSize: '36px', fontWeight: 800, marginTop: '12px', marginBottom: '8px', lineHeight: 1.2 }}>
            {book.title}
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', marginBottom: '24px' }}>
            {book.author} · {book.publisher}
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            {/* 상태 변경 버튼들 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['WANT_TO_READ', 'READING', 'COMPLETED'] as BookStatus[]).map((status) => (
                <button
                  key={status}
                  disabled={isPending}
                  onClick={() => handleStatusChange(status)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: optimisticStatus === status ? 'none' : '1px solid rgba(255,255,255,0.2)',
                    background: optimisticStatus === status ? 'var(--accent)' : 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backdropFilter: 'blur(5px)',
                    transition: 'all 0.2s',
                    opacity: isPending ? 0.7 : 1
                  }}
                  className="hover-scale"
                >
                  {status === 'WANT_TO_READ' ? '읽고 싶어요' : status === 'READING' ? '읽는 중' : '완독'}
                </button>
              ))}
            </div>

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
          </div>
        </div>

      </div>
    </div>
  );
}
