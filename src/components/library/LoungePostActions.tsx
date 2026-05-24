'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteLoungePost } from '@/app/dashboard/lounge-actions';

export default function LoungePostActions({ postId }: { postId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    
    setIsDeleting(true);
    const res = await deleteLoungePost(postId);
    if (res.success) {
      alert('삭제되었습니다.');
      router.push('/dashboard/lounge');
    } else {
      alert(res.message);
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      <button
        onClick={() => router.push(`/dashboard/lounge/${postId}/edit`)}
        style={{
          background: 'none',
          border: '1px solid var(--border-secondary)',
          color: 'var(--text-secondary)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        className="hover-bg"
      >
        수정
      </button>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        style={{
          background: 'none',
          border: '1px solid var(--border-secondary)',
          color: 'var(--text-secondary)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          fontSize: '13px',
          fontWeight: 600,
          cursor: isDeleting ? 'not-allowed' : 'pointer',
          opacity: isDeleting ? 0.5 : 1,
          transition: 'all 0.2s'
        }}
        className="hover-bg"
      >
        {isDeleting ? '삭제 중...' : '삭제'}
      </button>
    </div>
  );
}
