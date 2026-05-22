'use client';
// 4-ZONE 대시보드 쉘 — 헤더/사이드바/메인/우측패널 그리드 레이아웃

import { type ReactNode } from 'react';
import type { Profile } from '@/types';
import type { User } from '@supabase/supabase-js';
import Header from './Header';
import Sidebar from '@/components/sidebar/Sidebar';
import RightPanel from '@/components/graph/RightPanel';
import BottomNavigation from '@/components/mobile/BottomNavigation';

interface DashboardShellProps {
  children: ReactNode;
  user: User;
  profile: Profile | null;
}

export default function DashboardShell({
  children,
  user,
  profile,
}: DashboardShellProps) {
  return (
    <>
      <div className="dashboard-shell">
        {/* ZONE 1: 헤더 */}
        <div className="zone-header">
          <Header user={user} profile={profile} />
        </div>

        {/* ZONE 2: 좌측 사이드바 */}
        <div className="zone-sidebar">
          <Sidebar />
        </div>

        {/* ZONE 3: 중앙 메인 패널 */}
        <div
          className="zone-main"
          style={{
            overflowY: 'auto',
            height: 'calc(100vh - var(--header-height))',
            padding: '24px',
          }}
        >
          {children}
        </div>

        {/* ZONE 4: 우측 패널 */}
        <div className="zone-right">
          <RightPanel />
        </div>
      </div>

      {/* 모바일: 하단 내비게이션 */}
      <BottomNavigation />
    </>
  );
}
