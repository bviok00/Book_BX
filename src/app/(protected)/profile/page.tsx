import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Heatmap from '@/components/stats/Heatmap';
import DashboardShell from '@/components/dashboard/DashboardShell';
import ProfileForm from './ProfileForm';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import ReadingProgress from '@/components/profile/ReadingProgress';
import GenreRadarChart from '@/components/profile/GenreRadarChart';
import TagStarCluster from '@/components/profile/TagStarCluster';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. 프로필 정보 및 폴더 가져오기
  const [
    { data: profile },
    { data: folders }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
  ]);

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
        author,
        category
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

  // 4. 태그 데이터 가져오기 (성단 시각화용)
  const { data: tagsData } = await supabase
    .from('tags')
    .select('name')
    .eq('user_id', user.id)
    .limit(30);

  // 데이터 집계
  const completedBooks = userBooks?.filter(b => b.status === 'COMPLETED') || [];
  const completedCount = completedBooks.length;
  
  // 장르 통계 (레이더 차트)
  const genreCount: Record<string, number> = {};
  completedBooks.forEach(item => {
    // Supabase type might return an array for joined relations
    const bookData = Array.isArray(item.books) ? item.books[0] : item.books;
    const category = bookData?.category;
    if (category) {
      const mainGenre = category.split('>')[0].trim();
      genreCount[mainGenre] = (genreCount[mainGenre] || 0) + 1;
    }
  });
  const radarData = Object.entries(genreCount)
    .map(([subject, count]) => ({ subject, A: count, fullMark: Math.max(10, count + 2) }))
    .sort((a, b) => b.A - a.A);

  // 태그 더미 Weight 생성 (빈도수 대신 랜덤 부여 - 데모용)
  const tagCloudData = (tagsData || []).map(tag => ({
    name: tag.name,
    weight: Math.floor(Math.random() * 5) + 1
  }));

  // 대표 컬러 (최근 상호작용한 도서 기준)
  const recentBookWithColor = userBooks?.find(b => b.dominant_color);
  const dominantColor = recentBookWithColor?.dominant_color || '#e8375a';

  return (
    <DashboardShell user={user} profile={profile}>
      {/* 백그라운드 블러 효과 (몰입감 극대화) */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 50% 0%, ${dominantColor}1A 0%, transparent 70%)`,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn var(--transition-normal) ease-out', paddingBottom: '60px' }}>
        
        {/* 3-Zone Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-6 items-start">
          
          {/* ZONE A: 프로필 아이덴티티 */}
          <div className="glass-card" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(20,20,20,0.6)', backdropFilter: 'blur(16px)' }}>
            <ProfileAvatar 
              avatarUrl={profile?.avatar_url}
              displayName={profile?.display_name}
              email={user.email}
              dominantColor={dominantColor}
              completedCount={completedCount}
            />
          </div>

          {/* ZONE B: 독서 인사이트 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* 장르 레이더 차트 */}
              <div className="glass-card" style={{ padding: '24px', background: 'rgba(20,20,20,0.6)', backdropFilter: 'blur(16px)' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>나의 독서 취향</h2>
                <GenreRadarChart data={radarData} dominantColor={dominantColor} />
              </div>
              
              {/* 지식 성단 (태그 클라우드) */}
              <div className="glass-card" style={{ padding: '24px', background: 'rgba(20,20,20,0.6)', backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>지식 성단</h2>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <TagStarCluster tags={tagCloudData} dominantColor={dominantColor} />
                </div>
              </div>
            </div>

            {/* 연간 독서 잔디 */}
            <div className="glass-card" style={{ padding: '24px', background: 'rgba(20,20,20,0.6)', backdropFilter: 'blur(16px)', overflow: 'hidden' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>연간 독서 기록</h2>
              <Heatmap sessions={readingSessions || []} />
            </div>
            
            {/* 갤러리를 B구역 하단으로 배치 */}
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', paddingLeft: '8px' }}>
                📚 내 서재 갤러리 ({userBooks?.length || 0}권)
              </h2>
              {userBooks && userBooks.length > 0 ? (
                <div style={{
                  columnCount: 'auto',
                  columnWidth: '160px',
                  columnGap: '16px',
                }}>
                  {userBooks.map((item: any) => {
                    const book = Array.isArray(item.books) ? item.books[0] : item.books;
                    if (!book) return null;
                    return (
                      <Link href={`/dashboard/book/${item.id}`} key={item.id}>
                        <div 
                          style={{ breakInside: 'avoid', marginBottom: '16px', position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', cursor: 'pointer' }}
                          className="book-gallery-item focus-ring"
                        >
                          <img src={book.cover_url} alt={book.title} style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '24px 12px 12px', color: 'white' }}>
                            <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0 }} className="line-clamp-2">{book.title}</h3>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  서재에 책이 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* ZONE C: 설정 및 목표관리 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 프로그레스 바 */}
            <div className="glass-card" style={{ padding: '32px 24px', background: 'rgba(20,20,20,0.6)', backdropFilter: 'blur(16px)' }}>
              <ReadingProgress 
                completedCount={completedCount} 
                yearlyGoal={profile?.yearly_goal || 0} 
                dominantColor={dominantColor}
              />
            </div>

            {/* 계정 설정 */}
            <div className="glass-card" style={{ padding: '24px', background: 'rgba(20,20,20,0.6)', backdropFilter: 'blur(16px)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>계정 정보</h2>
              <ProfileForm user={user} profile={profile} />
            </div>
          </div>

        </div>
      </div>
    </DashboardShell>
  );
}
