'use client';
// 로그인 페이지 — Google OAuth 시네마틱 풀스크린

import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import { useState } from 'react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('로그인 오류:', error.message);
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 배경 장식 — 떠다니는 그라데이션 원 */}
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232, 55, 90, 0.15) 0%, transparent 70%)',
          top: '-100px',
          right: '-100px',
          animation: 'pulse-glow 4s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
          bottom: '-80px',
          left: '-80px',
          animation: 'pulse-glow 5s ease-in-out infinite',
        }}
      />

      {/* 로그인 카드 */}
      <div
        className="glass animate-fade-in"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px',
          padding: '48px 40px',
          borderRadius: 'var(--radius-xl)',
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* 로고 */}
        <div
          style={{
            fontSize: '48px',
            marginBottom: '-8px',
          }}
        >
          📚
        </div>

        <div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#f5f5f5',
              marginBottom: '8px',
              letterSpacing: '-0.5px',
            }}
          >
            Intellect BX
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: '#a0a0a0',
              lineHeight: 1.6,
            }}
          >
            당신의 지적 여정을 시각화하는
            <br />
            시네마틱 지식 관제탑
          </p>
        </div>

        {/* Google 로그인 버튼 */}
        <Button
          variant="secondary"
          size="lg"
          isLoading={isLoading}
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            color: '#f5f5f5',
            borderColor: '#333',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            gap: '12px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google로 시작하기
        </Button>

        {/* 하단 텍스트 */}
        <p
          style={{
            fontSize: '11px',
            color: '#6b6b6b',
            lineHeight: 1.5,
          }}
        >
          로그인 시 개인 서재와 독서 노트가 클라우드에 안전하게 저장됩니다.
        </p>
      </div>
    </div>
  );
}
