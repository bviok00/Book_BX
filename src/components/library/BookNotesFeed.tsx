'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { createNote } from '@/app/dashboard/actions';

export default function BookNotesFeed({ userBookId, notes, user }: { userBookId: string, notes: any[], user: any }) {
  const [content, setContent] = useState('');
  const [page, setPage] = useState('');
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '80px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.max(80, scrollHeight) + 'px';
    }
  }, [content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    startTransition(async () => {
      const pageRefStr = page.trim() ? `p.${page.trim()}` : undefined;
      const res = await createNote(userBookId, content, undefined, pageRefStr);
      if (res.success) {
        setContent('');
        setPage('');
      } else {
        alert(res.message);
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
        마이크로 메모
        <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginLeft: '8px', fontWeight: 400 }}>
          {notes.length}개
        </span>
      </h2>

      {/* 코멘트 작성 폼 */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
        <div 
          className="glass-card" 
          style={{ 
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="이 책에 대한 생각이나 기억에 남는 문구를 남겨보세요..."
            disabled={isPending}
            style={{
              width: '100%',
              minHeight: '80px',
              backgroundColor: 'transparent',
              border: 'none',
              resize: 'none',
              color: 'var(--text-primary)',
              fontSize: '15px',
              outline: 'none',
              lineHeight: 1.6
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>P.</span>
              <input
                type="number"
                placeholder="페이지"
                value={page}
                onChange={(e) => setPage(e.target.value)}
                style={{
                  width: '60px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                  padding: '2px 4px'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isPending || !content.trim()}
              style={{
                backgroundColor: content.trim() ? 'var(--accent)' : 'var(--bg-secondary)',
                color: content.trim() ? '#fff' : 'var(--text-tertiary)',
                border: 'none',
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: content.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              {isPending ? '저장 중...' : '남기기'}
            </button>
          </div>
        </div>
      </form>

      {/* 코멘트 피드 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '500px', paddingRight: '8px' }}>
        {notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: '14px' }}>
            아직 작성된 메모가 없습니다.
          </div>
        ) : (
          notes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(note => (
            <div key={note.id} className="glass-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 }}>
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {user.email?.split('@')[0]}
                </span>
                {note.page_reference && (
                  <span style={{ fontSize: '11px', color: 'var(--accent)', background: 'var(--accent-light)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    {note.page_reference}
                  </span>
                )}
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: 'auto', letterSpacing: '0.5px' }}>
                  {new Date(note.created_at).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/. /g, '.').replace(':', ':')}
                </span>
              </div>
              <p style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {note.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
