'use client';
// ZONE 1: 헤더 — 로고 + 검색바 + 연간 목표 게이지 + 테마 토글 + 프로필

import type { Profile } from '@/types';
import type { User } from '@supabase/supabase-js';
import { SearchInput } from '@/components/ui/Input';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import ContentSearch from '@/components/library/ContentSearch';

interface HeaderProps {
  user: User;
  profile: Profile | null;
}

type TabMode = 'HOME' | 'BOOK' | 'MOVIE' | 'ANIME' | 'INSIGHT';

function HeaderContent({ user, profile }: HeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = (searchParams.get('tab') as TabMode) || 'HOME';
  const yearlyGoal = profile?.yearly_goal || 0;
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleTabChange = (tab: TabMode) => {
    router.push(`/dashboard?tab=${tab}`);
  };

  return (
    <>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: 'var(--header-height)',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-card)',
          gap: '16px',
        }}
      >
        {/* 좌측: 로고 및 탭 네비게이션 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexShrink: 0,
              cursor: 'pointer'
            }}
            onClick={() => router.push('/dashboard')}
          >
            <span style={{ fontSize: '24px' }}>📚</span>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.5px',
              }}
            >
              ContentDB_BX
            </span>
          </div>

          <div style={{ display: 'flex', gap: '24px' }}>
            {[
              { key: 'HOME', label: '✨ 추천' },
              { key: 'BOOK', label: '📚 도서' },
              { key: 'MOVIE', label: '🎬 영화' },
              { key: 'ANIME', label: '🌸 애니' },
              { key: 'INSIGHT', label: '💡 인사이트' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key as TabMode)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: currentTab === tab.key ? 800 : 500,
                  color: currentTab === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  position: 'relative',
                  padding: '4px 0',
                  transition: 'color var(--transition-fast)',
                }}
                className="focus-ring"
              >
                {tab.label}
                {currentTab === tab.key && (
                  <div style={{ position: 'absolute', bottom: '-15px', left: 0, right: 0, height: '3px', backgroundColor: 'var(--accent)', borderRadius: '3px 3px 0 0' }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 중앙: 검색바 */}
        <div style={{ flex: 1, maxWidth: '400px', margin: '0 auto' }} onClick={() => setIsSearchOpen(true)}>
          <SearchInput
            placeholder="도서, 영화, 애니 통합 검색..."
            style={{ width: '100%', cursor: 'pointer' }}
            readOnly
          />
        </div>

        {/* 우측: 연간 목표 + 테마 + 프로필 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexShrink: 0,
          }}
        >
          {/* 연간 목표 게이지 (간략 표시) */}
          {yearlyGoal > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}
            >
              <span>🎯</span>
              <span>0/{yearlyGoal}권</span>
            </div>
          )}

          <ThemeToggle />

          {/* 프로필 아바타 (클릭 시 프로필 화면 이동) */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => window.location.href = '/profile'}
              className="focus-ring"
              title="프로필 설정"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid var(--border-primary)',
                cursor: 'pointer',
                backgroundColor: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="프로필"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                (profile?.display_name?.[0] || user.email?.[0] || '?').toUpperCase()
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 도서 검색 모달 */}
      <ContentSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

export default function Header(props: HeaderProps) {
  return (
    <Suspense fallback={<div style={{ height: 'var(--header-height)' }}></div>}>
      <HeaderContent {...props} />
    </Suspense>
  );
}
