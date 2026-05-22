// OAuth 콜백 핸들러 — Supabase Auth 코드 교환 + 프로필 자동 생성
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();

    // Authorization Code → Session 교환
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 프로필 자동 생성 (최초 로그인 시)
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!existingProfile) {
          await supabase.from('profiles').insert({
            id: user.id,
            email: user.email || '',
            display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            avatar_url: user.user_metadata?.avatar_url || null,
            yearly_goal: 24,
            is_public: false,
          });
        }
      }

      // ForwardedHost가 있으면 그걸 사용 (리버스 프록시 환경)
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // 인증 실패 시 에러 페이지로
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
