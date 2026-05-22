import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Heatmap from '@/components/stats/Heatmap';
import DashboardShell from '@/components/dashboard/DashboardShell';
import ProfileForm from './ProfileForm';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. 프로필 정보 가져오기
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 2. 유저의 도서 목록 가져오기 (상태별 분류 및 핀터레스트 스타일 책장용)
  const { data: userBooks } = await supabase
    .from('user_books')
    .select(`
      id,
      status,
      books (
        isbn,
        title,
        cover_url,
        author
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // 3. 독서 세션 가져오기 (히트맵용)
  const { data: readingSessions } = await supabase
    .from('reading_sessions')
    .select('*')
    .eq('user_id', user.id)
    .gte('session_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  return (
    <DashboardShell user={user} profile={profile}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn var(--transition-normal) ease-out' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '32px' }}>
          프로필 및 계정 설정
        </h1>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
          {/* 프로필 설정 패널 (좌측) */}
          <div style={{ flex: '1 1 350px', maxWidth: '400px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>계정 정보</h2>
              <ProfileForm user={user} profile={profile} />
            </div>
          </div>

          {/* 우측 영역: 갤러리를 원래대로 다시 우측으로 */}
          <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* 핀터레스트 스타일 서재 갤러리 */}
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
                📚 내 서재 갤러리 ({userBooks?.length || 0}권)
              </h2>

              {userBooks && userBooks.length > 0 ? (
                <div style={{
                  columnCount: 'auto',
                  columnWidth: '160px',
                  columnGap: '16px',
                }}>
                  {userBooks.map((item: any) => {
                    const book = item.books;
                    if (!book) return null;

                    return (
                      <div
                        key={item.id}
                        style={{
                          breakInside: 'avoid',
                          marginBottom: '16px',
                          position: 'relative',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          boxShadow: 'var(--shadow-sm)',
                          backgroundColor: 'var(--bg-secondary)',
                          cursor: 'pointer'
                        }}
                        className="book-gallery-item focus-ring"
                      >
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          style={{
                            width: '100%',
                            display: 'block',
                            objectFit: 'cover'
                          }}
                        />
                        {/* 호버 오버레이 */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                            padding: '24px 12px 12px',
                            color: 'white',
                            opacity: 0.9,
                          }}
                        >
                          <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, lineHeight: 1.2 }} className="line-clamp-2">
                            {book.title}
                          </h3>
                          <p style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
                            {item.status === 'READING' ? '📖 읽는 중' :
                              item.status === 'COMPLETED' ? '✅ 완독' :
                                item.status === 'WANT_TO_READ' ? '❤️ 읽고 싶음' : '보류'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  아직 서재에 책이 없습니다. 상단 검색을 통해 책을 추가해 보세요!
                </div>
              )}
            </div>

            {/* 잔디 심기 (히트맵) - 갤러리 아래로 */}
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <Heatmap sessions={readingSessions || []} />
            </div>

          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
