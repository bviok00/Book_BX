'use client';

import { useState, useTransition } from 'react';
import { addAnimeTags } from '@/app/dashboard/anime-actions';

export default function AnimeTagsEditor({ userAnimeId, initialTags = [], isReadOnly = false }: { userAnimeId: string, initialTags: any[], isReadOnly?: boolean }) {
  const [tagsInput, setTagsInput] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleAddTags = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagsInput.trim()) return;

    if (isReadOnly) return;

    startTransition(async () => {
      const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      if (tagsArray.length === 0) return;

      const res = await addAnimeTags(userAnimeId, tagsArray);
      if (res.success) {
        setTagsInput('');
      } else {
        alert(res.message);
      }
    });
  };

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
        애니 지식 성단 (태그)
      </h3>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {initialTags.length === 0 ? (
          <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>등록된 태그가 없습니다.</span>
        ) : (
          initialTags.map((mt: any, idx: number) => (
            <span key={idx} 
              onClick={() => window.location.href = `/dashboard/tags/${mt.tag_id}`}
              style={{
              fontSize: '12px',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 500,
              cursor: 'pointer'
            }}>
              #{mt.tags?.name}
            </span>
          ))
        )}
      </div>

      {!isReadOnly && (
        <form onSubmit={handleAddTags} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            disabled={isPending}
            placeholder="태그 입력 (쉼표로 구분)"
            style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13px' }}
          />
          <button
            type="submit"
            disabled={isPending || !tagsInput.trim()}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent)',
              color: '#000',
              fontWeight: 600,
              border: 'none',
              cursor: isPending ? 'wait' : 'pointer',
              fontSize: '13px'
            }}
          >
            {isPending ? '추가 중...' : '추가'}
          </button>
        </form>
      )}
    </div>
  );
}
