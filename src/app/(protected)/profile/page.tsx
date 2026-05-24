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

  // 2. 유저의 도서/영화/애니 목록 및 기타 데이터 가져오기
  const [
    { data: profile },
    { data: folders },
    { data: userBooks },
    { data: userMovies },
    { data: userAnimes },
    { data: readingSessions },
    { data: tagsData }
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('folders').select('*').eq('user_id', user.id).order('sort_order', { ascending: true }),
    supabase.from('user_books').select('id, status, dominant_color, books(isbn, title, cover_url, author, category)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('user_movies').select('status, movies(genre)').eq('user_id', user.id),
    supabase.from('user_animes').select('status, animes(genre)').eq('user_id', user.id),
    supabase.from('reading_sessions').select('*').eq('user_id', user.id).gte('session_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
    supabase.from('tags').select('name').eq('user_id', user.id).limit(30)
  ]);

  // 데이터 집계
  const completedBooks = userBooks?.filter(b => b.status === 'COMPLETED') || [];
  const completedMovies = userMovies?.filter(m => m.status === 'COMPLETED') || [];
  const completedAnimes = userAnimes?.filter(a => a.status === 'COMPLETED') || [];
  const completedCount = completedBooks.length + completedMovies.length + completedAnimes.length;
  
  // 장르 통계 (레이더 차트)
  const genreCount: Record<string, number> = {};
  
  // 도서 장르
  userBooks?.forEach(item => {
    if (item.status !== 'COMPLETED' && item.status !== 'READING') return;
    const bookData = Array.isArray(item.books) ? item.books[0] : item.books;
    const category = bookData?.category;
    if (category) {
      const mainGenre = category.split('>')[0].trim();
      genreCount[mainGenre] = (genreCount[mainGenre] || 0) + 1;
    }
  });

  // 영화 장르
  userMovies?.forEach(item => {
    if (item.status !== 'COMPLETED' && item.status !== 'WATCHING') return;
    const movieData = Array.isArray(item.movies) ? item.movies[0] : item.movies;
    const genre = movieData?.genre;
    if (genre) {
      genre.split(',').forEach((g: string) => {
        const clean = g.trim();
        if (clean) genreCount[clean] = (genreCount[clean] || 0) + 1;
      });
    }
  });

  // 애니 장르
  userAnimes?.forEach(item => {
    if (item.status !== 'COMPLETED' && item.status !== 'WATCHING') return;
    const animeData = Array.isArray(item.animes) ? item.animes[0] : item.animes;
    const genre = animeData?.genre;
    if (genre) {
      genre.split(',').forEach((g: string) => {
        const clean = g.trim();
        if (clean) genreCount[clean] = (genreCount[clean] || 0) + 1;
      });
    }
  });

  const radarData = Object.entries(genreCount)
    .map(([subject, count]) => ({ subject, A: count, fullMark: Math.max(10, count + 2) }))
    .sort((a, b) => b.A - a.A)
    .slice(0, 6);

  // 태그 더미 Weight 생성 (빈도수 대신 랜덤 부여 - 데모용)
  const tagCloudData = (tagsData || []).map(tag => ({
    name: tag.name,
    weight: Math.floor(Math.random() * 5) + 1
  }));

  // 대표 컬러 (최근 상호작용한 도서 기준)
  const recentBookWithColor = userBooks?.find(b => b.dominant_color);
  const dominantColor = recentBookWithColor?.dominant_color || '#e8375a';

  return (
    <DashboardShell user={user} profile={profile} folders={folders || []} hideSidebar={true}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* ROW 1: 프로필, 콘텐츠 취향, 지식 성단 */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1.5fr_1fr] gap-6 items-stretch">
            {/* 프로필 아이덴티티 */}
            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-overlay)', backdropFilter: 'blur(16px)' }}>
              <ProfileAvatar 
                avatarUrl={profile?.avatar_url}
                displayName={profile?.display_name}
                email={user.email}
                dominantColor={dominantColor}
                completedCount={completedCount}
              />
            </div>

            {/* 나의 콘텐츠 취향 (기존 진척도 위치) */}
            <div className="glass-card" style={{ padding: '24px', backgroundColor: 'var(--bg-overlay)', backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>나의 콘텐츠 취향</h2>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GenreRadarChart data={radarData} dominantColor={dominantColor} />
              </div>
            </div>

            {/* 지식 성단 (기존 계정 정보 위치) */}
            <div className="glass-card" style={{ padding: '24px', backgroundColor: 'var(--bg-overlay)', backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>지식 성단</h2>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TagStarCluster tags={tagCloudData} dominantColor={dominantColor} />
              </div>
            </div>
          </div>

          {/* ROW 2: 계정 정보, 진척도 */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
            {/* 계정 정보 (기존 나의 콘텐츠 취향 위치) */}
            <div className="glass-card" style={{ padding: '20px 24px', backgroundColor: 'var(--bg-overlay)', backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>계정 정보</h2>
              <ProfileForm user={user} profile={profile} />
            </div>

            {/* 올해의 진척도 (기존 지식 성단 위치) */}
            <div className="glass-card" style={{ padding: '20px 24px', backgroundColor: 'var(--bg-overlay)', backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>올해의 콘텐츠 탐험 진척도</h2>
              <ReadingProgress 
                completedCount={completedCount} 
                yearlyGoal={profile?.yearly_goal || 0} 
                dominantColor={dominantColor}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
