import { getLoungePosts } from '@/app/dashboard/lounge-actions';
import Link from 'next/link';

export default async function LoungePage() {
  const res = await getLoungePosts(50);
  const posts = res.data || [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            ☕ 라운지
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0 }}>
            긴 형태의 리뷰나 깊이 있는 생각을 공유하는 공간입니다.
          </p>
        </div>
        <Link 
          href="/dashboard/lounge/write"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: 'var(--accent)',
            color: '#fff',
            fontWeight: 700,
            borderRadius: 'var(--radius-full)',
            textDecoration: 'none',
            transition: 'opacity 0.2s, transform 0.2s'
          }}
          className="hover-scale"
        >
          <span>✍️</span> 글쓰기
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          아직 작성된 라운지 글이 없습니다. 첫 글을 남겨보세요!
        </div>
      ) : (
        <div style={{ 
          columns: 'auto 260px', 
          columnGap: '20px',
        }}>
          {posts.map(post => (
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
                  borderRadius: '16px',
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
                        fontSize: '13px',
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
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {post.content_title && (
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>
                      {post.content_title}
                    </div>
                  )}
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                    {post.title}
                  </h2>
                  
                  <p 
                    className="lounge-card-content"
                    style={{ 
                      fontSize: '14px', 
                      color: 'var(--text-secondary)', 
                      margin: 0, 
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.6,
                      transition: 'color 0.2s'
                    }}
                  >
                    {post.content.replace(/[#*`_~\[\]]/g, '')}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent)', 
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontSize: '12px', fontWeight: 600 
                      }}>
                        {post.profiles?.display_name?.charAt(0).toUpperCase() || post.profiles?.email?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                        {post.profiles?.display_name || post.profiles?.email?.split('@')[0] || '익명'}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {new Date(post.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>

                {/* Hover 오버레이 액션 버튼 */}
                <div 
                  className="lounge-card-overlay"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(2px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    zIndex: 10
                  }}
                >
                  <div style={{
                    padding: '12px 24px',
                    backgroundColor: 'var(--accent)',
                    color: '#fff',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-full)',
                    transform: 'translateY(10px)',
                    transition: 'transform 0.2s'
                  }} className="lounge-card-btn">
                    리뷰 전체 읽기
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
