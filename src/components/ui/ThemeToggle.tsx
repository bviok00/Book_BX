'use client';
// 테마 토글 스위치 — next-themes 기반 Light/Dark 전환

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 하이드레이션 불일치 방지 — 클라이언트 마운트 후에만 렌더링
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div style={{ width: '36px', height: '36px' }} />;
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      className="focus-ring"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border-primary)',
        backgroundColor: 'var(--bg-card)',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
        fontSize: '18px',
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
