'use client';

import { useState, useTransition, useEffect } from 'react';
import { addAnimeNote, deleteAnimeNote } from '@/app/dashboard/anime-actions';
import { getCommunityMemos } from '@/app/dashboard/community-actions';

export default function AnimeNotesFeed({ userAnimeId, mediaId, notes = [], user, profile }: { userAnimeId: string, mediaId?: string, notes: any[], user: any, profile?: any }) {
  const [activeTab, setActiveTab] = useState<'MY' | 'COMMUNITY'>('MY');
  const [communityMemos, setCommunityMemos] = useState<any[]>([]);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);

  const [noteInput, setNoteInput] = useState('');
  const [page, setPage] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPending, startTransition] = useTransition();

  // Fetch community memos when tab changes
  useEffect(() => {
    if (activeTab === 'COMMUNITY' && mediaId && communityMemos.length === 0) {
      setIsLoadingCommunity(true);
      getCommunityMemos(mediaId, 'ANIME').then(res => {
        if (res.success && res.data) {
          setCommunityMemos(res.data);
        }
        setIsLoadingCommunity(false);
      });
    }
  }, [activeTab, mediaId]);

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
      const timeRefStr = page.trim() ? page.trim() : undefined;
      const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const res = await addAnimeNote(userAnimeId, noteInput, timeRefStr, tagsArray.length > 0 ? tagsArray : undefined);
      if (res.success) {
        setNoteInput('');
        setPage('');
        setTagsInput('');
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('MY')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: '18px',
            fontWeight: activeTab === 'MY' ? 700 : 500,
            color: activeTab === 'MY' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            cursor: 'pointer',
            transition: 'color 0.2s'
          }}
        >
          나의 메모
          <span style={{ fontSize: '13px', marginLeft: '8px', fontWeight: 400 }}>
            {notes.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('COMMUNITY')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: '18px',
            fontWeight: activeTab === 'COMMUNITY' ? 700 : 500,
            color: activeTab === 'COMMUNITY' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            cursor: 'pointer',
            transition: 'color 0.2s'
          }}
        >
          모두의 메모
        </button>
      </div>

      {activeTab === 'MY' ? (
        <>
          {/* 메모 입력 */}
          <form onSubmit={handleAddNote} style={{ marginBottom: '24px' }}>
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
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                disabled={isPending}
                placeholder="이 애니메이션에 대한 생각이나 기억에 남는 장면을 남겨보세요..."
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
                  disabled={isPending || !noteInput.trim()}
                  style={{
                    backgroundColor: noteInput.trim() ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: noteInput.trim() ? '#fff' : 'var(--text-tertiary)',
                    border: 'none',
                    padding: '6px 16px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: noteInput.trim() ? 'pointer' : 'not-allowed',
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
              notes.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(note => (
                <div key={note.id} className="glass-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 }}>
                      {profile?.display_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {profile?.display_name || user?.email?.split('@')[0]}
                    </span>
                    {note.page_reference && (
                      <span style={{ fontSize: '11px', color: 'var(--accent)', background: 'var(--accent-light)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        {note.page_reference}
                      </span>
                    )}
                    {note.note_tags?.map((nt: any, idx: number) => (
                      <span 
                        key={idx} 
                        style={{ fontSize: '11px', color: 'var(--accent)', border: '1px solid var(--accent)', padding: '2px 6px', borderRadius: '12px', fontWeight: 500 }}
                      >
                        #{nt.tags?.name}
                      </span>
                    ))}
                    <span suppressHydrationWarning style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: 'auto', letterSpacing: '0.5px' }}>
                      {new Date(note.created_at).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/. /g, '.').replace(':', ':')}
                    </span>
                    <button 
                      onClick={() => handleDeleteNote(note.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '12px', marginLeft: '8px' }}
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
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
          {isLoadingCommunity ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>
              모두의 메모를 불러오는 중...
            </div>
          ) : communityMemos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>
              아직 작성된 메모가 없습니다. 첫 메모를 남겨보세요!
            </div>
          ) : (
            communityMemos.map(note => (
              <div key={note.id} className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: '12px' }}>
                      {note.profiles?.display_name?.charAt(0).toUpperCase() || note.profiles?.email?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {note.profiles?.display_name || note.profiles?.email?.split('@')[0] || '익명'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {getRelativeTime(note.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                  {note.content}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
