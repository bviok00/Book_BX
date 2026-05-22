'use client';
// ZONE 4: 우측 패널 — 지식 그래프 미니 + 태그 목록

export default function RightPanel() {
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
          도서와 태그를 연결하면
          <br />
          지식 그래프가 생성됩니다.
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
          메모에 태그를 추가하면
          <br />
          여기에 표시됩니다.
        </div>
      </section>
    </aside>
  );
}
