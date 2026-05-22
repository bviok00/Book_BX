import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PosterCard } from '@/components/ui/Card';

export default async function TagDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: tagId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch tag info
  const { data: tag } = await supabase
    .from('tags')
    .select('name')
    .eq('id', tagId)
    .single();

  if (!tag) {
    return (
      <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>
        태그를 찾을 수 없습니다.
      </div>
    );
  }

  // Fetch books associated with this tag
  const { data: bookTags } = await supabase
    .from('book_tags')
    .select(`
      user_books (
        *,
        books (*)
      )
    `)
    .eq('tag_id', tagId);

  const books = bookTags?.map(bt => bt.user_books).filter(Boolean) || [];

  const readingBooks = books.filter((ub: any) => ub.status === 'READING');
  const wantToReadBooks = books.filter((ub: any) => ub.status === 'WANT_TO_READ');
  const completedBooks = books.filter((ub: any) => ub.status === 'COMPLETED');
  const abandonedBooks = books.filter((ub: any) => ub.status === 'ABANDONED');

  const renderBookGrid = (title: string, icon: string, groupBooks: any[]) => {
    if (groupBooks.length === 0) return null;
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
          {icon} {title} <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 400 }}>{groupBooks.length}</span>
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '16px',
          }}
        >
          {groupBooks.map((ub: any) => (
            <Link key={ub.id} href={`/dashboard/book/${ub.id}`} style={{ textDecoration: 'none' }}>
              <PosterCard
                coverUrl={ub.books?.cover_url || ''}
                title={ub.books?.title || ''}
                author={ub.books?.author || undefined}
                status={ub.status}
                dominantColor={ub.dominant_color || undefined}
              />
            </Link>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '16px',
            transition: 'background-color 0.2s',
          }}
          className="hover-bg"
        >
          ←
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
          <span style={{ color: 'var(--accent)', marginRight: '8px' }}>#</span>
          {tag.name}
        </h1>
        <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
          {books.length}권의 도서
        </span>
      </div>

      {books.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '15px' }}>
          이 태그가 달린 도서가 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {renderBookGrid('읽는 중', '📘', readingBooks)}
          {renderBookGrid('읽고 싶은', '💜', wantToReadBooks)}
          {renderBookGrid('완독', '✅', completedBooks)}
          {renderBookGrid('중단', '⏹️', abandonedBooks)}
        </div>
      )}
    </div>
  );
}
