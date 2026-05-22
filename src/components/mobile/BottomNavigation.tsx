'use client';
// 모바일 하단 네비게이션 (768px 미만에서만 표시)

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const TABS = [
  { href: '/dashboard', label: '서재', icon: '🏠' },
  { href: '/dashboard/explore', label: '탐색', icon: '📚' },
  { href: '/dashboard/graph', label: '그래프', icon: '🧠' },
  { href: '/dashboard/profile', label: '프로필', icon: '👤' },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="mobile-bottom-nav"
      style={{
        display: 'none',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-card)',
        padding: '8px 0 env(safe-area-inset-bottom, 8px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '6px 12px',
                textDecoration: 'none',
                color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                fontSize: '10px',
                fontWeight: isActive ? 600 : 400,
                transition: 'color var(--transition-fast)',
              }}
            >
              <span style={{ fontSize: '20px' }}>{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* 모바일에서만 표시되도록 미디어 쿼리 */}
      <style>{`
        @media (max-width: 767px) {
          .mobile-bottom-nav { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
