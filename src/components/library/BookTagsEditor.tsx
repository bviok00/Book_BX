'use client';

import { useState, useTransition } from 'react';
import { addBookTags } from '@/app/dashboard/actions';

export default function BookTagsEditor({ userBookId, existingTags }: { userBookId: string, existingTags: any[] }) {
  const [tagsInput, setTagsInput] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleAddTags = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagsInput.trim()) return;

    startTransition(async () => {
      const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      if (tagsArray.length === 0) return;

      const res = await addBookTags(userBookId, tagsArray);
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
        도서 지식 성단 (태그)
      </h3>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {existingTags.length === 0 ? (
          <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>등록된 태그가 없습니다.</span>
        ) : (
          existingTags.map((bt: any, idx: number) => (
            <span key={idx} 
              onClick={() => window.location.href = `/dashboard/tags/${bt.tag_id}`}
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
              #{bt.tags?.name}
            </span>
          ))
        )}
      </div>

      <form onSubmit={handleAddTags} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="추가할 태그를 쉼표(,)로 구분해 입력하세요"
          disabled={isPending}
          style={{
            flex: 1,
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={isPending || !tagsInput.trim()}
          style={{
            backgroundColor: tagsInput.trim() ? 'var(--accent)' : 'var(--bg-secondary)',
            color: tagsInput.trim() ? '#fff' : 'var(--text-tertiary)',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: tagsInput.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s'
          }}
        >
          {isPending ? '추가 중...' : '추가'}
        </button>
      </form>
    </div>
  );
}
