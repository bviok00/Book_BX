// 대시보드 메인 페이지 — 서버 컴포넌트: 데이터 병렬 페칭
import { createClient } from '@/lib/supabase/server';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Promise.all 병렬 페칭 — 서재 도서 + 폴더 + 독서 세션 한 번에 로드
  const [
    { data: userBooks },
    { data: folders },
    { data: readingSessions },
  ] = await Promise.all([
    supabase
      .from('user_books')
      .select('*, books(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('reading_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('session_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('session_date', { ascending: true }),
  ]);

  return (
    <DashboardClient
      userBooks={userBooks || []}
      folders={folders || []}
      readingSessions={readingSessions || []}
    />
  );
}
