import { notFound } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function SharedProfilePage({ params }: { params: Promise<{ token: string }> }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { token } = await params;

  // 1. 프로필 검증 (공유 토큰으로 접근 허용된 프로필만)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, yearly_goal')
    .eq('share_token', token)
    .eq('is_public', true)
    .single();

  if (!profile) {
    notFound();
  }

  // 2. 해당 유저의 서재 도서 (RLS 때문에 바로 조회가 안 될 수 있음)
  // 참고: 현재 schema.sql 상 user_books는 본인만 조회 가능하므로,
  // 공유 페이지를 위해서는 백엔드에서 RPC 함수를 만들거나 Service Role Key를 사용해야 함.
  // 이 예제에서는 구조적 뼈대만 제공합니다.
  
  return (
    <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
      {/* 프로필 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
        <div 
          style={{ 
            width: '80px', height: '80px', borderRadius: '50%', 
            backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', fontSize: '32px', color: '#fff' 
          }}
        >
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="프로필" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            profile.display_name?.[0]?.toUpperCase() || 'U'
          )}
        </div>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {profile.display_name}님의 서재
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            ContentDB_BX로 지식을 구축하고 있습니다.
          </p>
        </div>
      </div>

      {/* RLS 우회 구조 필요 안내 (임시 표시) */}
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>🔒 보호된 서재</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          이 페이지는 {profile.display_name}님의 공개 공유 페이지입니다.<br/>
          실제 도서 목록을 불러오기 위해서는 Supabase RPC나 별도의 공유용 뷰(View)가 필요합니다.
        </p>
      </div>
    </div>
  );
}
