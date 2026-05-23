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

  // Fetch movies associated with this tag
  const { data: movieTags } = await supabase
    .from('movie_tags')
    .select(`
      user_movies (
        *,
        movies (*)
      )
    `)
    .eq('tag_id', tagId);

  // Fetch animes associated with this tag
  const { data: animeTags } = await supabase
    .from('anime_tags')
    .select(`
      user_animes (
        *,
        animes (*)
      )
    `)
    .eq('tag_id', tagId);

  const books = bookTags?.map(bt => ({ ...(bt.user_books as any), type: 'BOOK' })).filter(b => b.id) || [];
  const movies = movieTags?.map(mt => ({ ...(mt.user_movies as any), type: 'MOVIE' })).filter(m => m.id) || [];
  const animes = animeTags?.map(at => ({ ...(at.user_animes as any), type: 'ANIME' })).filter(a => a.id) || [];
  
  const contents = [...books, ...movies, ...animes];

  const activeContents = contents.filter(c => c.status === 'READING' || c.status === 'WATCHING');
  const wantContents = contents.filter(c => c.status === 'WANT_TO_READ' || c.status === 'WANT_TO_WATCH');
  const completedContents = contents.filter(c => c.status === 'COMPLETED');
  const droppedContents = contents.filter(c => c.status === 'DROPPED');

  const renderContentGrid = (title: string, icon: string, groupContents: any[]) => {
    if (groupContents.length === 0) return null;
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
          {icon} {title} <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 400 }}>{groupContents.length}</span>
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '16px',
          }}
        >
          {groupContents.map((c: any) => {
            const isBook = c.type === 'BOOK';
            const isMovie = c.type === 'MOVIE';
            const detailUrl = `/dashboard/${isBook ? 'book' : isMovie ? 'movie' : 'anime'}/${c.id}`;
            const coverUrl = isBook ? c.books?.cover_url : isMovie ? c.movies?.poster_url : c.animes?.poster_url;
            const itemTitle = isBook ? c.books?.title : isMovie ? c.movies?.title : c.animes?.title;
            const creator = isBook ? c.books?.author : isMovie ? c.movies?.director : c.animes?.director;

            return (
              <Link key={c.id} href={detailUrl} style={{ textDecoration: 'none' }}>
                <div style={{ position: 'relative' }}>
                  <PosterCard
                    coverUrl={coverUrl || ''}
                    title={itemTitle || ''}
                    author={creator || undefined}
                    status={c.status}
                    type={c.type}
                  />
                </div>
              </Link>
            );
          })}
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
          {contents.length}개의 작품
        </span>
      </div>

      {contents.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '15px' }}>
          이 태그가 달린 도서나 영화가 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {renderContentGrid('진행 중', '🔥', activeContents)}
          {renderContentGrid('위시리스트', '💜', wantContents)}
          {renderContentGrid('완료', '✅', completedContents)}
          {renderContentGrid('중단', '⏹️', droppedContents)}
        </div>
      )}
    </div>
  );
}
