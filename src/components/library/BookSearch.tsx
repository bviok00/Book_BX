'use client';
// 알라딘 도서 검색 모달 — 검색 후 1클릭 서재 추가

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { SearchInput } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { AladinBookItem, AladinSearchResponse, ActionResponse } from '@/types';
import { addBookToLibrary } from '@/app/dashboard/actions';
// color-thief는 브라우저 전용 (클라이언트 컴포넌트 내에서 동적 import 권장)
import { getColorSync } from 'colorthief';

interface BookSearchProps {
  isOpen: boolean;
  onClose: () => void;
  folderId?: string; // 특정 폴더에 추가할 경우
}

export default function BookSearch({ isOpen, onClose, folderId }: BookSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AladinBookItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingIsbn, setAddingIsbn] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`/api/aladin?query=${encodeURIComponent(searchQuery)}&maxResults=10`);
      const json = await res.json();
      
      if (json.success) {
        setResults((json.data as AladinSearchResponse).item || []);
      } else {
        showToast(json.message, 'error');
      }
    } catch (error) {
      showToast('검색 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 표지 이미지에서 dominant color 추출 (비동기)
  const extractDominantColor = (imageUrl: string): Promise<string | null> => {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          const color = getColorSync(img);
          resolve(color ? color.hex() : null);
        };
        img.onerror = () => resolve(null);
        // CORS 문제를 피하기 위해 프록시를 통해 이미지를 가져오거나 (이 앱에서는 next/image 활용 또는 그냥 img src로 해결되길 기대)
        img.src = imageUrl;
      } catch (e) {
        resolve(null);
      }
    });
  };

  const handleAddBook = async (book: AladinBookItem) => {
    setAddingIsbn(book.isbn13);
    
    try {
      // 1. 상세 API 호출하여 TOC 등 추가 정보 가져오기
      let tocData = null;
      try {
        const detailRes = await fetch(`/api/aladin/${book.isbn13}`);
        const detailJson = await detailRes.json();
        if (detailJson.success && detailJson.data?.subInfo?.toc) {
          // TOC 문자열 파싱 (실제로는 HTML이거나 단순 문자열일 수 있음, 우선 원시 텍스트 보관)
          tocData = { raw: detailJson.data.subInfo.toc };
        }
      } catch (e) {
        console.warn('TOC 패치 실패, 기본 정보로 추가 진행', e);
      }

      // 2. 서버 액션 호출하여 서재에 추가
      const result = await addBookToLibrary(
        book.isbn13,
        {
          title: book.title,
          author: book.author,
          publisher: book.publisher,
          cover_url: book.cover,
          category: book.categoryName,
          aladin_toc: tocData,
        },
        folderId
      );

      if (result.success) {
        showToast(result.message, 'success');
        // TODO: dominant color 업데이트는 백그라운드 태스크로 분리하거나, 여기서 추가 API 호출
        onClose();
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('서재 추가 중 오류가 발생했습니다.', 'error');
    } finally {
      setAddingIsbn(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="새로운 도서 탐색" maxWidth="700px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 검색창 */}
        <SearchInput
          placeholder="책 제목, 저자, ISBN 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onSearch={handleSearch}
          autoFocus
        />

        {/* 로딩 표시 */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>
            검색 중...
          </div>
        )}

        {/* 결과 목록 */}
        {!isLoading && results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
              {results.length}개의 검색 결과
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {results.map((book) => (
                <div
                  key={book.isbn13}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '12px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'border-color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <img
                    src={book.cover}
                    alt={book.title}
                    style={{ width: '60px', height: '88px', objectFit: 'cover', borderRadius: '4px', boxShadow: 'var(--shadow-sm)' }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {book.title}
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {book.author} · {book.publisher} ({book.pubDate})
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }} className="line-clamp-1">
                        {book.categoryName}
                      </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        size="sm"
                        isLoading={addingIsbn === book.isbn13}
                        disabled={addingIsbn !== null && addingIsbn !== book.isbn13}
                        onClick={() => handleAddBook(book)}
                      >
                        + 내 서재에 추가
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 결과 없음 */}
        {!isLoading && query && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>
            검색 결과가 없습니다.
          </div>
        )}
      </div>
    </Modal>
  );
}
