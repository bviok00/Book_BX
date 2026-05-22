'use client';
// ZONE 4: 우측 패널 — 지식 그래프 미니 + 태그 목록
import { useEffect, useState } from 'react';
import { getUserTags } from '@/app/dashboard/actions';

export default function RightPanel() {
  const [tags, setTags] = useState<any[]>([]);

  useEffect(() => {
    getUserTags().then(res => {
      if (res.success && res.data) {
        setTags(res.data);
      }
    });
  }, []);
  return (
    <aside
      style={{
        height: 'calc(100vh - var(--header-height))',
        overflowY: 'auto',
        borderLeft: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-card)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* 지식 그래프 미니 */}
      <section>
        <h3
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
            letterSpacing: '0.5px',
            marginBottom: '12px',
          }}
        >
          🧠 지식 성단
        </h3>
        <div
          style={{
            width: '100%',
            aspectRatio: '1',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
            fontSize: '13px',
          }}
        >
          {tags.length === 0 ? (
            '도서와 태그를 연결하면\n지식 그래프가 생성됩니다.'
          ) : (
            <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
              {tags.slice(0, 15).map((tag, i) => {
                const size = 30 + Math.random() * 30;
                const top = 10 + Math.random() * 70;
                const left = 10 + Math.random() * 70;
                return (
                  <div
                    key={tag.id}
                    title={tag.name}
                    onClick={() => window.location.href = `/dashboard/tags/${tag.id}`}
                    style={{
                      position: 'absolute',
                      top: `${top}%`,
                      left: `${left}%`,
                      width: `${size}px`,
                      height: `${size}px`,
                      backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                      borderRadius: '50%',
                      opacity: 0.8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: 700,
                      boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                      transform: 'translate(-50%, -50%)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      padding: '4px',
                      cursor: 'pointer'
                    }}
                    className="hover-scale"
                  >
                    {tag.name}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 개념 태그 목록 */}
      <section>
        <h3
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
            letterSpacing: '0.5px',
            marginBottom: '12px',
          }}
        >
          🏷️ 개념 태그
        </h3>
        <div
          style={{
            color: 'var(--text-tertiary)',
            fontSize: '13px',
            textAlign: 'center',
            padding: '16px',
          }}
        >
          {tags.length === 0 ? (
            '메모에 태그를 추가하면\n여기에 표시됩니다.'
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '16px 0', justifyContent: 'center' }}>
              {tags.map(tag => (
                <span
                  key={tag.id}
                  onClick={() => window.location.href = `/dashboard/tags/${tag.id}`}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '12px',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer'
                  }}
                  className="hover-bg"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}
