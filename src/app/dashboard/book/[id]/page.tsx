import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BookDetailHero from '@/components/library/BookDetailHero';
import BookNotesFeed from '@/components/library/BookNotesFeed';
import BookTagsEditor from '@/components/library/BookTagsEditor';
import SimilarRecommendationsClient from '@/components/library/SimilarRecommendationsClient';
import type { CurationItem } from '@/types';

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const userBookId = resolvedParams.id;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userBookId);
  
  let userBookQuery = supabase.from('user_books').select(`
    *,
    books (*),
    folders (id, name),
    book_tags (tags (id, name)),
    granular_notes (*, note_tags (tags (id, name)))
  `).eq('user_id', user.id);

  if (isUuid) {
    userBookQuery = userBookQuery.eq('id', userBookId);
  } else {
    userBookQuery = userBookQuery.eq('isbn', userBookId);
  }

  const [userBookRes, foldersRes] = await Promise.all([
    userBookQuery.single(),
    supabase.from('folders').select('*').eq('user_id', user.id).order('sort_order')
  ]);

  let userBook = userBookRes.data;
  let book = userBook?.books;
  let isReadOnly = false;

  // 서재에 없는 경우 알라딘 API에서 직접 가져오기 (읽기 전용 모드)
  if (!userBook && !isUuid) {
    isReadOnly = true;
    const ALADIN_TTB_KEY = process.env.ALADIN_TTB_KEY;
    if (ALADIN_TTB_KEY) {
      const url = new URL('http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx');
      url.searchParams.append('ttbkey', ALADIN_TTB_KEY);
      url.searchParams.append('itemIdType', 'ISBN13'); // or ISBN
      url.searchParams.append('ItemId', userBookId);
      url.searchParams.append('output', 'js');
      url.searchParams.append('Version', '20131101');
      url.searchParams.append('OptResult', 'ebookList,usedList,reviewList');
      
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        if (data.item && data.item.length > 0) {
          const b = data.item[0];
          book = {
            isbn: b.isbn13 || b.isbn,
            title: b.title,
            author: b.author,
            publisher: b.publisher,
            cover_url: b.cover,
            category: b.categoryName,
            aladin_toc: null
          };
          userBook = {
            id: 'readonly',
            user_id: user.id,
            isbn: b.isbn13 || b.isbn,
            status: 'NONE',
            rating: 0,
            granular_notes: [],
            book_tags: []
          };
        }
      }
    }
  }

  const folders = foldersRes.data || [];

  if (!userBook || !book) {
    return <div className="p-8 text-center text-[var(--text-secondary)]">도서를 찾을 수 없습니다.</div>;
  }

  const notes = userBook.granular_notes || [];

  // ── Aladin 비슷한 추천 작품 가져오기 ──
  let recommendedItems: CurationItem[] = [];
  try {
    const ALADIN_TTB_KEY = process.env.ALADIN_TTB_KEY;
    if (ALADIN_TTB_KEY) {
      
      const fetchAladin = async (query: string, searchTarget: string = 'Book') => {
        const url = new URL('http://www.aladin.co.kr/ttb/api/ItemSearch.aspx');
        url.searchParams.append('ttbkey', ALADIN_TTB_KEY);
        url.searchParams.append('Query', query);
        url.searchParams.append('QueryType', 'Keyword');
        url.searchParams.append('MaxResults', '15');
        url.searchParams.append('start', '1');
        url.searchParams.append('SearchTarget', searchTarget);
        url.searchParams.append('output', 'js');
        url.searchParams.append('Version', '20131101');
        url.searchParams.append('OptResult', 'ebookList,usedList,reviewList');
        
        const res = await fetch(url.toString());
        if (res.ok) {
          const json = await res.json();
          if (json.item && json.item.length > 0) {
            return json.item
              .filter((b: any) => b.isbn13 !== book.isbn && b.isbn !== book.isbn)
              .slice(0, 15)
              .map((b: any) => ({
                id: `BOOK_${b.isbn13 || b.isbn}`,
                type: 'BOOK',
                title: b.title,
                creator: b.author,
                posterUrl: b.cover,
                originalData: b
              }));
          }
        }
        return [];
      };

      // 1. 카테고리 기반 검색
      let keyword = '';
      if (book.category) {
        const parts = book.category.split('>');
        keyword = parts[parts.length - 1].trim();
      }
      
      if (keyword) {
        recommendedItems = await fetchAladin(keyword);
      }
      
      // 2. 결과가 없으면 작가 기반 검색
      if (recommendedItems.length === 0 && book.author) {
        const authorName = book.author.split('(')[0].split(',')[0].trim(); // "(지은이)", "외" 등 제거
        if (authorName) {
          recommendedItems = await fetchAladin(authorName);
        }
      }
      
      // 3. 그래도 없으면 베스트셀러 기본 키워드 검색
      if (recommendedItems.length === 0) {
        recommendedItems = await fetchAladin('베스트셀러');
      }
    }
  } catch (e) {
    console.error('Aladin Recommendations Error:', e);
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* 왓챠 스타일 히어로 뷰 */}
      {isReadOnly && (
        <div style={{ backgroundColor: 'rgba(232, 197, 71, 0.1)', border: '1px solid var(--accent)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: '4px' }}>읽기 전용 모드</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>이 도서는 아직 위시리스트에 없습니다. 노트와 태그를 작성하려면 서재에 추가해주세요.</p>
          </div>
        </div>
      )}

      <BookDetailHero userBook={userBook} book={book} folders={folders} isReadOnly={isReadOnly} />

      {/* 컨텐츠 영역: 목차 & 마이크로 메모 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '32px', display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
        
        {/* 목차 및 도서 태그 */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column' }}>
          
          {/* 알라딘 카테고리 (자동 태그) */}
          {book.category && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                도서 분류
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {book.category.split('>').map((cat: string, idx: number) => (
                  <span key={idx} style={{
                    fontSize: '11px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 500
                  }}>
                    {cat.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 도서 지식 성단 에디터 (사용자 태그) */}
          <BookTagsEditor userBookId={userBook.id} initialTags={userBook.book_tags?.map((bt: any) => bt.tags) || []} isReadOnly={isReadOnly} />

          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
            목차
          </h2>
          <div className="glass-card" style={{ padding: '24px', maxHeight: '600px', overflowY: 'auto' }}>
            {book.aladin_toc ? (
              <div 
                style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}
                dangerouslySetInnerHTML={{ __html: book.aladin_toc }}
              />
            ) : (
              <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', textAlign: 'center' }}>목차 정보가 제공되지 않는 도서입니다.</p>
            )}
          </div>
        </div>

        {/* 마이크로 메모 (왓챠 코멘트 스타일) */}
        <div style={{ flex: '1 1 400px' }}>
          <BookNotesFeed userBookId={userBook.id} notes={notes} user={user} />
        </div>
      </div>

      {/* ── 비슷한 추천 작품 ── */}
      {recommendedItems.length > 0 && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 48px', paddingBottom: '48px' }}>
          <SimilarRecommendationsClient title="이 책과 비슷한 추천 도서" items={recommendedItems} />
        </div>
      )}
    </div>
  );
}
