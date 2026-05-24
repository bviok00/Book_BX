'use client';

import { useState } from 'react';
import { toggleLoungeLike } from '@/app/dashboard/lounge-actions';
import { useToast } from '@/components/ui/Toast';

export default function LoungeDetailLikeBtn({ postId, initialLiked, initialCount }: { postId: string, initialLiked: boolean, initialCount: number }) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isToggling, setIsToggling] = useState(false);
  const { showToast } = useToast();

  const handleToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);
    
    // Optimistic update
    const prevLiked = isLiked;
    const prevCount = count;
    
    setIsLiked(!prevLiked);
    setCount(prevCount + (prevLiked ? -1 : 1));

    try {
      const result = await toggleLoungeLike(postId);
      if (!result.success) {
        setIsLiked(prevLiked);
        setCount(prevCount);
        showToast(result.message, 'error');
      }
    } catch (error) {
      setIsLiked(prevLiked);
      setCount(prevCount);
      showToast('좋아요 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <button 
      onClick={handleToggle}
      disabled={isToggling}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px 24px',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border-subtle)',
        background: isLiked ? 'rgba(255, 64, 129, 0.1)' : 'var(--bg-secondary)',
        cursor: isToggling ? 'wait' : 'pointer',
        transition: 'all 0.2s',
        margin: '0 auto'
      }}
      className="hover-scale"
    >
      <span style={{ fontSize: '24px', color: isLiked ? 'var(--accent)' : 'var(--text-tertiary)', transition: 'color 0.2s' }}>
        {isLiked ? '❤️' : '🤍'}
      </span>
      <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
        {count}
      </span>
    </button>
  );
}
