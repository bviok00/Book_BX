// 대시보드 보호 레이아웃 — 인증 필수 + 4-ZONE 쉘
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 프로필 및 폴더 데이터 페칭
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

  return (
    <DashboardShell user={user} profile={profile} folders={folders || []}>
      {children}
    </DashboardShell>
  );
}
