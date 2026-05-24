'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toggleLoungeLike } from '@/app/dashboard/lounge-actions';
import { useToast } from '@/components/ui/Toast';

export default function LoungeClient({ initialPosts }: { initialPosts: any[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [sortBy, setSortBy] = useState<'LIKES' | 'LATEST'>('LIKES');
  const [togglingMap, setTogglingMap] = useState<Record<string, boolean>>({});
  const { showToast } = useToast();

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === 'LIKES') {
      if (b.likesCount !== a.likesCount) {
        return b.likesCount - a.likesCount;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const handleToggleLike = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault(); // Prevent navigating to detail page
    e.stopPropagation();

    if (togglingMap[postId]) return;

    setTogglingMap(prev => ({ ...prev, [postId]: true }));
    
    // Optimistic update
    const prevPosts = [...posts];
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isLikedByMe: !p.isLikedByMe,
          likesCount: p.isLikedByMe ? p.likesCount - 1 : p.likesCount + 1
        };
      }
      return p;
    }));

    try {
      const result = await toggleLoungeLike(postId);
      if (!result.success) {
        setPosts(prevPosts); // Revert on failure
        showToast(result.message, 'error');
      }
    } catch (error) {
      setPosts(prevPosts); // Revert on error
      showToast('좋아요 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setTogglingMap(prev => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Sort Options */}
      {posts.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={() => setSortBy('LIKES')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              fontWeight: sortBy === 'LIKES' ? 700 : 500,
              color: sortBy === 'LIKES' ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}
          >
            좋아요순
          </button>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <button
            onClick={() => setSortBy('LATEST')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              fontWeight: sortBy === 'LATEST' ? 700 : 500,
              color: sortBy === 'LATEST' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}
          >
            최신순
          </button>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          아직 작성된 라운지 글이 없습니다. 첫 글을 남겨보세요!
        </div>
      ) : (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '16px',
        }}>
          {sortedPosts.map(post => (
            <Link 
              key={post.id} 
              href={`/dashboard/lounge/${post.id}`}
              style={{ 
                textDecoration: 'none',
                display: 'block',
                marginBottom: '20px',
                breakInside: 'avoid'
              }}
              className="lounge-card-group"
            >
              <div 
                className="glass-card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
                  position: 'relative'
                }}
              >
                {/* 포스터 및 별점 영역 */}
                {post.poster_url ? (
                  <div style={{ position: 'relative', width: '100%', paddingTop: '130%', backgroundColor: 'var(--bg-secondary)' }}>
                    <img 
                      src={post.poster_url} 
                      alt={post.content_title || post.title} 
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.8) 100%)',
                      zIndex: 1
                    }} />
                    {/* 별점 오버레이 */}
                    {post.rating !== null && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-full)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '12px',
                        zIndex: 2,
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }}>
                        ⭐️ {post.rating.toFixed(1)}
                      </div>
                    )}
                    {/* 미디어 타입 뱃지 */}
                    {post.media_type && (
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        zIndex: 2,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        color: 'var(--text-secondary)',
                        fontSize: '11px',
                        fontWeight: 600,
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}>
                        {post.media_type === 'MOVIE' ? '🎬 영화' : post.media_type === 'BOOK' ? '📚 도서' : '🌸 애니'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '20px 20px 0 20px' }}>
                    {post.media_type && (
                      <span style={{ 
                        display: 'inline-block',
                        fontSize: '11px', 
                        fontWeight: 600, 
                        padding: '4px 10px', 
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        marginBottom: '12px'
                      }}>
                        {post.media_type === 'MOVIE' ? '🎬 영화' : post.media_type === 'BOOK' ? '📚 도서' : '🌸 애니'}
                      </span>
                    )}
                  </div>
                )}
                
                {/* 텍스트 컨텐츠 영역 */}
                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  {post.content_title && (
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {post.content_title}
                    </div>
                  )}
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.title}
                  </h2>
                  
                  <p 
                    className="lounge-card-content"
                    style={{ 
                      fontSize: '13px', 
                      color: 'var(--text-secondary)', 
                      margin: 0, 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.5,
                      transition: 'color 0.2s'
                    }}
                  >
                    {post.content.replace(/[#*`_~\[\]]/g, '')}
                  </p>

                  {/* 좋아요 및 작성자 정보 영역 (항상 하단 고정) */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                    
                    <button 
                      onClick={(e) => handleToggleLike(e, post.id)}
                      disabled={togglingMap[post.id]}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        cursor: togglingMap[post.id] ? 'wait' : 'pointer',
                        padding: '4px',
                        marginLeft: '-4px',
                        borderRadius: 'var(--radius-md)',
                        transition: 'background-color 0.2s'
                      }}
                      className="hover-bg"
                    >
                      <span style={{ fontSize: '15px', color: post.isLikedByMe ? 'var(--accent)' : 'var(--text-tertiary)', transition: 'color 0.2s' }}>
                        {post.isLikedByMe ? '❤️' : '🤍'}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {post.likesCount || 0}
                      </span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ 
                        width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--accent)', 
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontSize: '10px', fontWeight: 600 
                      }}>
                        {post.profiles?.display_name?.charAt(0).toUpperCase() || post.profiles?.email?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {post.profiles?.display_name || post.profiles?.email?.split('@')[0] || '익명'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
