// 미들웨어 전용 Supabase 클라이언트 (엣지 런타임 호환)
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  // 응답 객체를 미리 생성하여 쿠키 조작 가능하게 준비
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 요청 쿠키에도 반영 (Server Component에서 읽을 수 있도록)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // 응답 쿠키에 반영 (브라우저에 전달)
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 만료된 토큰 자동 갱신 — 이 호출이 없으면 세션이 끊김
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 보호 라우트: 미인증 시 로그인 페이지로 리디렉션
  const protectedPaths = ['/dashboard', '/book', '/settings'];
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 이미 로그인된 유저가 /login 접근 시 대시보드로 리디렉션
  if (request.nextUrl.pathname === '/login' && user) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}
