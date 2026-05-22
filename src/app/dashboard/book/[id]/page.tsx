import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BookDetailHero from '@/components/library/BookDetailHero';
import BookNotesFeed from '@/components/library/BookNotesFeed';
import BookTagsEditor from '@/components/library/BookTagsEditor';

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

  // 1. user_books 와 연관된 books 데이터 조인 (마이크로 메모 등)
  const [userBookRes, foldersRes] = await Promise.all([
    supabase
      .from('user_books')
      .select(`
        *,
        books (*),
        folders (id, name),
        book_tags (
          tags (id, name)
        ),
        granular_notes (
          *,
          note_tags (
            tags (id, name)
          )
        )
      `)
      .eq('id', userBookId)
      .eq('user_id', user.id)
      .single(),
    supabase.from('folders').select('*').eq('user_id', user.id).order('sort_order')
  ]);

  const { data: userBook, error } = userBookRes;
  const folders = foldersRes.data || [];

  if (error || !userBook || !userBook.books) {
    console.error('Book load error', error);
    return <div className="p-8 text-center text-[var(--text-secondary)]">도서를 찾을 수 없습니다.</div>;
  }

  const book = userBook.books;
  const notes = userBook.granular_notes || [];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* 왓챠 스타일 히어로 뷰 */}
      <BookDetailHero userBook={userBook} book={book} folders={folders} />

      {/* 컨텐츠 영역: 목차 & 마이크로 메모 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '32px', display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
        
        {/* 목차 및 도서 태그 */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column' }}>
          {/* 도서 태그 에디터 */}
          <BookTagsEditor userBookId={userBook.id} existingTags={userBook.book_tags || []} />

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
    </div>
  );
}
