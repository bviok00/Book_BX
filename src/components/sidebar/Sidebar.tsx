'use client';
// ZONE 2: 사이드바 — 폴더 트리 + 독서 상태 필터

import { useRouter, useSearchParams } from 'next/navigation';
import type { BookStatus } from '@/types';

const STATUS_TABS: { key: BookStatus | 'ALL'; label: string; icon: string }[] = [
  { key: 'ALL', label: '전체', icon: '📖' },
  { key: 'READING', label: '읽는 중', icon: '📘' },
  { key: 'WANT_TO_READ', label: '읽고 싶은', icon: '💜' },
  { key: 'COMPLETED', label: '완독', icon: '✅' },
  { key: 'DROPPED', label: '중단', icon: '⏸️' },
];

export default function Sidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeStatus = searchParams.get('status') || 'ALL';

  const handleStatusClick = (status: string) => {
    if (status === 'ALL') {
      router.push('/dashboard');
    } else {
      router.push(`/dashboard?status=${status}`);
    }
  };

  return (
    <aside
      style={{
        height: 'calc(100vh - var(--header-height))',
        overflowY: 'auto',
        borderRight: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-card)',
        padding: '16px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* 독서 상태 필터 */}
      <section style={{ padding: '0 16px' }}>
        <h3
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
            letterSpacing: '0.5px',
            marginBottom: '8px',
          }}
        >
          독서 상태
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleStatusClick(tab.key)}
              className="focus-ring"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeStatus === tab.key ? 600 : 400,
                color: activeStatus === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: activeStatus === tab.key ? 'var(--accent-light)' : 'transparent',
                transition: 'all var(--transition-fast)',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <span style={{ fontSize: '15px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* 폴더 트리 */}
      <section style={{ padding: '0 16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <h3
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
              letterSpacing: '0.5px',
            }}
          >
            프로젝트 폴더
          </h3>
          <button
            className="focus-ring"
            title="폴더 추가"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-tertiary)',
              fontSize: '16px',
              padding: '2px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            +
          </button>
        </div>
        <div
          style={{
            color: 'var(--text-tertiary)',
            fontSize: '13px',
            padding: '12px',
            textAlign: 'center',
          }}
        >
          폴더를 추가하여
          <br />
          도서를 분류하세요.
        </div>
      </section>
    </aside>
  );
}
