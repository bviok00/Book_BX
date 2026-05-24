'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { createMovieNote, updateMovieNote, deleteMovieNote } from '@/app/dashboard/movie-actions';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MovieNotesFeed({ userMovieId, notes, user, profile }: { userMovieId: string, notes: any[], user: any, profile?: any }) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [page, setPage] = useState(''); // Here page acts as timeReference, e.g. "01:23:45"
  const [tagsInput, setTagsInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Edit state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

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
      const timeRefStr = page.trim() ? page.trim() : undefined;
      const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const res = await createMovieNote(userMovieId, content, timeRefStr, tagsArray.length > 0 ? tagsArray : undefined);
      if (res.success) {
        setContent('');
        setPage('');
        setTagsInput('');
      } else {
        alert(res.message);
      }
    });
  };

  const handleDelete = (noteId: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    startTransition(async () => {
      const res = await deleteMovieNote(noteId);
      if (!res.success) alert(res.message);
    });
  };

  const startEdit = (note: any) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = (noteId: string) => {
    if (!editContent.trim()) return;
    startTransition(async () => {
      const res = await updateMovieNote(noteId, editContent);
      if (res.success) {
        setEditingNoteId(null);
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
            placeholder="이 영화에 대한 생각이나 기억에 남는 장면을 남겨보세요..."
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
              <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>⏱️</span>
              <input
                type="text"
                placeholder="타임라인 (예: 1:23)"
                value={page}
                onChange={(e) => setPage(e.target.value)}
                style={{
                  width: '100px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                  padding: '2px 4px'
                }}
              />
              <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600, marginLeft: '12px' }}>#</span>
              <input
                type="text"
                placeholder="태그 (쉼표로 구분)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                style={{
                  width: '140px',
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
                  {profile?.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {profile?.display_name || user.email?.split('@')[0]}
                </span>
                {note.page_reference && (
                  <span style={{ fontSize: '11px', color: 'var(--accent)', background: 'var(--accent-light)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    {note.page_reference}
                  </span>
                )}
                {note.note_tags?.map((nt: any, idx: number) => (
                  <span 
                    key={idx} 
                    style={{ fontSize: '11px', color: 'var(--accent)', border: '1px solid var(--accent)', padding: '2px 6px', borderRadius: '12px', fontWeight: 500, cursor: 'pointer' }}
                    onClick={() => router.push(`/dashboard/tags/${nt.tag_id}`)}
                  >
                    #{nt.tags?.name}
                  </span>
                ))}
                <span suppressHydrationWarning style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: 'auto', letterSpacing: '0.5px' }}>
                  {new Date(note.created_at).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/. /g, '.').replace(':', ':')}
                </span>
              </div>
              
              {editingNoteId === note.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '15px',
                      padding: '8px',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setEditingNoteId(null)} style={{ padding: '4px 12px', fontSize: '12px', background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}>취소</button>
                    <button onClick={() => handleSaveEdit(note.id)} disabled={isPending} style={{ padding: '4px 12px', fontSize: '12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>저장</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="markdown-body" style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.6, flex: 1, margin: 0 }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {note.content}
                    </ReactMarkdown>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '12px', opacity: 0.5 }}>
                    <button onClick={() => startEdit(note)} title="수정" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>✏️</button>
                    <button onClick={() => handleDelete(note.id)} title="삭제" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>🗑️</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
