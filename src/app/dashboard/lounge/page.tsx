import { getLoungePosts } from '@/app/dashboard/lounge-actions';
import Link from 'next/link';
import LoungeClient from '@/components/lounge/LoungeClient';

export default async function LoungePage() {
  const res = await getLoungePosts(50);
  const posts = res.data || [];

  return (
    <div style={{ width: '100%', padding: '16px 48px 32px 48px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

      <LoungeClient initialPosts={posts} />
    </div>
  );
}
