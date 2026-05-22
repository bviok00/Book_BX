'use client';
// ZONE 3: 대시보드 메인 클라이언트 — Three-Track 뷰 전환 + 서재 렌더링

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Folder, ReadingSession } from '@/types';
import { PosterCard } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';

type ViewMode = 'grid' | 'list' | 'spine';

// 서버에서 JOIN된 user_books 타입 (books 테이블 포함)
interface UserBookRow {
  id: string;
  isbn: string;
  status: string;
  rating: number | null;
  dominant_color: string | null;
  sort_order: number;
  created_at: string;
  books: {
    isbn: string;
    title: string;
    author: string | null;
    cover_url: string;
    category: string | null;
  } | null;
}

interface DashboardClientProps {
  userBooks: UserBookRow[];
  folders: Folder[];
  readingSessions: ReadingSession[];
}

export default function DashboardClient({
  userBooks,
  folders,
  readingSessions,
}: DashboardClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status');
  const currentFolderId = searchParams.get('folderId');

  let filteredBooks = userBooks;
  
  if (currentStatus && currentStatus !== 'ALL') {
    filteredBooks = filteredBooks.filter((ub) => ub.status === currentStatus);
  }
  
  if (currentFolderId) {
    filteredBooks = filteredBooks.filter((ub) => ub.folder_id === currentFolderId);
  }

  const currentFolderName = folders.find(f => f.id === currentFolderId)?.name;

  // 상태별 그룹핑
  const readingBooks = filteredBooks.filter((ub) => ub.status === 'READING');
  const wantToReadBooks = filteredBooks.filter((ub) => ub.status === 'WANT_TO_READ');
  const completedBooks = filteredBooks.filter((ub) => ub.status === 'COMPLETED');
  const abandonedBooks = filteredBooks.filter((ub) => ub.status === 'ABANDONED');

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* 뷰 전환 스위치 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          {currentFolderName ? (
            <><span style={{ color: 'var(--accent)', marginRight: '8px' }}>📁</span>{currentFolderName}</>
          ) : (
            '내 서재'
          )}
          <span
            style={{
              fontSize: '14px',
              fontWeight: 400,
              color: 'var(--text-tertiary)',
              marginLeft: '8px',
            }}
          >
            {filteredBooks.length}권
          </span>
        </h1>

        <div
          style={{
            display: 'flex',
            gap: '4px',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
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
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
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

      {/* 빈 서재 안내 */}
      {filteredBooks.length === 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 24px',
            textAlign: 'center',
            gap: '16px',
          }}
        >
          <span style={{ fontSize: '64px' }}>📖</span>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            서재가 비어있습니다
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              maxWidth: '320px',
              lineHeight: 1.6,
            }}
          >
            상단 검색바에서 도서를 검색하여
            <br />
            서재에 추가해 보세요.
          </p>
        </div>
      )}

      {/* 뷰 렌더링 */}
      {viewMode === 'grid' && (
        <GridView 
          readingBooks={readingBooks} 
          wantToReadBooks={wantToReadBooks}
          completedBooks={completedBooks}
          abandonedBooks={abandonedBooks}
          router={router} 
        />
      )}
      {viewMode === 'list' && (
        <ListView books={filteredBooks} router={router} />
      )}
      {viewMode === 'spine' && (
        <SpineView books={filteredBooks} router={router} />
      )}
    </div>
  );
}

// ── 공통 카드 렌더러 ──
function renderBookGrid(title: string, icon: string, books: UserBookRow[], router: any) {
  if (books.length === 0) return null;
  return (
    <section>
      <h2
        style={{
          fontSize: '15px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          marginBottom: '12px',
        }}
      >
        {icon} {title} <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 400 }}>{books.length}</span>
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '16px',
        }}
      >
        {books.map((ub) => (
          <div
            key={ub.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'book', id: ub.id }))}
          >
            <PosterCard
              coverUrl={ub.books?.cover_url || ''}
              title={ub.books?.title || ''}
              author={ub.books?.author || undefined}
              status={ub.status}
              dominantColor={ub.dominant_color || undefined}
              onClick={() => router.push(`/dashboard/book/${ub.id}`)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 그리드 뷰: 왓챠 스타일 포스터 카루셀 ──
function GridView({
  readingBooks,
  wantToReadBooks,
  completedBooks,
  abandonedBooks,
  router,
}: {
  readingBooks: UserBookRow[];
  wantToReadBooks: UserBookRow[];
  completedBooks: UserBookRow[];
  abandonedBooks: UserBookRow[];
  router: any;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {renderBookGrid('읽는 중', '📘', readingBooks, router)}
      {renderBookGrid('읽고 싶은', '💜', wantToReadBooks, router)}
      {renderBookGrid('완독', '✅', completedBooks, router)}
      {renderBookGrid('중단', '⏹️', abandonedBooks, router)}
    </div>
  );
}


// ── 리스트 뷰: 고밀도 테이블 ──
function ListView({ books, router }: { books: UserBookRow[], router: any }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* 테이블 헤더 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '48px 1fr 100px 80px 100px',
          gap: '12px',
          padding: '8px 0',
          borderBottom: '1px solid var(--border-primary)',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        <span />
        <span>제목</span>
        <span>저자</span>
        <span>상태</span>
        <span>평점</span>
      </div>

      {/* 테이블 행 */}
      {books.map((ub) => (
        <div
          key={ub.id}
          draggable
          onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'book', id: ub.id }))}
          style={{
            display: 'grid',
            gridTemplateColumns: '48px 1fr 100px 80px 100px',
            gap: '12px',
            alignItems: 'center',
            padding: '10px 0',
            borderBottom: '1px solid var(--border-subtle)',
            cursor: 'grab',
            transition: 'background-color var(--transition-fast)',
          }}
          onClick={() => router.push(`/dashboard/book/${ub.id}`)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <img
            src={ub.books?.cover_url || ''}
            alt={ub.books?.title || ''}
            style={{
              width: '36px',
              height: '52px',
              objectFit: 'cover',
              borderRadius: '4px',
            }}
          />
          <div>
            <p
              className="line-clamp-1"
              style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}
            >
              {ub.books?.title}
            </p>
          </div>
          <span
            className="line-clamp-1"
            style={{ fontSize: '13px', color: 'var(--text-secondary)' }}
          >
            {ub.books?.author || '-'}
          </span>
          <StatusBadge status={ub.status as import('@/types').BookStatus} size="sm" />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {ub.rating ? '★'.repeat(ub.rating) : '-'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── 책등 뷰: 스파인 나열 ──
function SpineView({ books, router }: { books: UserBookRow[], router: any }) {
  const completedBooks = books.filter((ub) => ub.status === 'COMPLETED');
  const otherBooks = books.filter((ub) => ub.status !== 'COMPLETED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 완독 책장 */}
      <section>
        <h2
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: '12px',
          }}
        >
          ✅ 완독 책장 ({completedBooks.length}권)
        </h2>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            minHeight: '80px',
            alignItems: 'flex-end',
          }}
        >
          {completedBooks.map((ub) => (
            <div
              key={ub.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'book', id: ub.id }))}
              title={ub.books?.title || ''}
              style={{
                width: '24px',
                height: `${60 + Math.random() * 30}px`,
                backgroundColor: ub.dominant_color || 'var(--accent)',
                borderRadius: '2px',
                cursor: 'grab',
                transition: 'transform var(--transition-fast)',
              }}
              onClick={() => router.push(`/dashboard/book/${ub.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            />
          ))}
          {completedBooks.length === 0 && (
            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
              완독한 책이 쌓일수록 책장이 채워집니다.
            </span>
          )}
        </div>
      </section>

      {/* 나머지 */}
      {otherBooks.length > 0 && (
        <section>
          <h2
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '12px',
            }}
          >
            📖 진행 중
          </h2>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              minHeight: '60px',
              alignItems: 'flex-end',
            }}
          >
            {otherBooks.map((ub) => (
              <div
                key={ub.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'book', id: ub.id }))}
                title={ub.books?.title || ''}
                style={{
                  width: '20px',
                  height: `${50 + Math.random() * 20}px`,
                  backgroundColor: ub.dominant_color || 'var(--text-tertiary)',
                  borderRadius: '2px',
                  cursor: 'grab',
                  opacity: 0.6,
                }}
                onClick={() => router.push(`/dashboard/book/${ub.id}`)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
