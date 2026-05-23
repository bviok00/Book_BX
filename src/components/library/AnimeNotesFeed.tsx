'use client';

import { useState, useTransition } from 'react';
import { addAnimeNote, deleteAnimeNote } from '@/app/dashboard/anime-actions';


export default function AnimeNotesFeed({ userAnimeId, notes = [], user }: { userAnimeId: string, notes: any[], user: any }) {
  const [noteInput, setNoteInput] = useState('');
  const [isPending, startTransition] = useTransition();

  const getRelativeTime = (dateString: string) => {
    const rtf = new Intl.RelativeTimeFormat('ko', { numeric: 'auto' });
    const now = new Date().getTime();
    const then = new Date(dateString).getTime();
    const diffInSeconds = Math.round((then - now) / 1000);
    
    if (Math.abs(diffInSeconds) < 60) {
      return rtf.format(diffInSeconds, 'second');
    }
    const diffInMinutes = Math.round(diffInSeconds / 60);
    if (Math.abs(diffInMinutes) < 60) {
      return rtf.format(diffInMinutes, 'minute');
    }
    const diffInHours = Math.round(diffInMinutes / 60);
    if (Math.abs(diffInHours) < 24) {
      return rtf.format(diffInHours, 'hour');
    }
    const diffInDays = Math.round(diffInHours / 24);
    if (Math.abs(diffInDays) < 30) {
      return rtf.format(diffInDays, 'day');
    }
    const diffInMonths = Math.round(diffInDays / 30);
    if (Math.abs(diffInMonths) < 12) {
      return rtf.format(diffInMonths, 'month');
    }
    return rtf.format(Math.round(diffInDays / 365), 'year');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;

    startTransition(async () => {
      const res = await addAnimeNote(userAnimeId, noteInput);
      if (res.success) {
        setNoteInput('');
      } else {
        alert(res.message);
      }
    });
  };

  const handleDeleteNote = (noteId: string) => {
    if (!window.confirm('노트를 삭제하시겠습니까?')) return;
    startTransition(async () => {
      await deleteAnimeNote(noteId);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
        마이크로 메모
      </h2>
      
      {/* 메모 입력 */}
      <form onSubmit={handleAddNote} style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative' }}>
          <textarea
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            disabled={isPending}
            placeholder="이 애니메이션에 대한 생각, 인상 깊은 장면, 리뷰를 남겨보세요."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '16px',
              paddingBottom: '48px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              resize: 'vertical',
              fontSize: '14px',
              lineHeight: 1.6
            }}
          />
          <div style={{ position: 'absolute', bottom: '12px', right: '12px' }}>
            <button
              type="submit"
              disabled={isPending || !noteInput.trim()}
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent)',
                color: '#000',
                fontWeight: 600,
                border: 'none',
                cursor: (isPending || !noteInput.trim()) ? 'not-allowed' : 'pointer',
                opacity: (isPending || !noteInput.trim()) ? 0.5 : 1,
                fontSize: '13px'
              }}
            >
              {isPending ? '등록 중...' : '기록하기'}
            </button>
          </div>
        </div>
      </form>

      {/* 피드 리스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
        {notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>
            아직 기록된 메모가 없습니다.
          </div>
        ) : (
          notes.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(note => (
            <div key={note.id} className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: '12px' }}>
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{user?.email?.split('@')[0]}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {getRelativeTime(note.created_at)}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteNote(note.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '14px' }}
                  className="hover-scale"
                >
                  ✕
                </button>
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {note.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
