import { getLoungePost } from '@/app/dashboard/lounge-actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LoungePostActions from '@/components/library/LoungePostActions';
import LoungeDetailLikeBtn from '@/components/lounge/LoungeDetailLikeBtn';
import { createClient } from '@/lib/supabase/server';

export default async function LoungeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getLoungePost(id);
  const post = res.data;

  if (!post) {
    return notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthor = user?.id === post.user_id;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link 
          href="/dashboard/lounge"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-tertiary)',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500
          }}
          className="hover-color"
        >
          ← 라운지 목록으로
        </Link>
        {isAuthor && <LoungePostActions postId={post.id} />}
      </div>

      <div className="glass-card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '24px' }}>
          {post.media_type && (
            <span style={{ 
              display: 'inline-block',
              fontSize: '12px', 
              fontWeight: 600, 
              padding: '6px 12px', 
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              marginBottom: '16px'
            }}>
              {post.media_type === 'MOVIE' ? '🎬 영화 리뷰' : post.media_type === 'BOOK' ? '📚 도서 리뷰' : '🌸 애니 리뷰'}
            </span>
          )}

          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
            {post.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent)', 
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: '14px', fontWeight: 700 
              }}>
                {post.profiles?.display_name?.charAt(0).toUpperCase() || post.profiles?.email?.charAt(0).toUpperCase() || '?'}
              </div>
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {post.profiles?.display_name || post.profiles?.email?.split('@')[0] || '익명'}
              </span>
            </div>
            <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
              {new Date(post.created_at).toLocaleString('ko-KR')}
            </span>
          </div>
        </div>

        <div className="markdown-body" style={{ color: 'var(--text-primary)', lineHeight: 1.8, fontSize: '16px' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>

        {/* 하단 좋아요 버튼 */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
          <LoungeDetailLikeBtn 
            postId={post.id} 
            initialLiked={post.isLikedByMe || false} 
            initialCount={post.likesCount || 0} 
          />
        </div>
      </div>
    </div>
  );
}
