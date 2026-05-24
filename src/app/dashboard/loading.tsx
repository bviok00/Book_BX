'use client';

import { SkeletonCard } from '@/components/ui/SkeletonCard';

export default function DashboardLoading() {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ padding: '32px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
        <div className="animate-pulse" style={{ width: '150px', height: '24px', backgroundColor: 'var(--bg-card)', borderRadius: '4px', marginBottom: '16px' }} />
        <div className="animate-pulse" style={{ width: '100%', height: '80px', backgroundColor: 'var(--bg-card)', borderRadius: '8px' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {[1, 2, 3].map((sectionIdx) => (
          <section key={`loading-section-${sectionIdx}`}>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
              <div className="animate-pulse" style={{ width: '200px', height: '24px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'hidden' }}>
              {[1, 2, 3, 4, 5, 6].map((cardIdx) => (
                <div key={`loading-card-${cardIdx}`} style={{ minWidth: '140px', maxWidth: '140px' }}>
                  <SkeletonCard />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
