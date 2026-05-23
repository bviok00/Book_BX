'use client';

import React from 'react';

interface MovieMediaSectionProps {
  videos: any[];
  images: any[];
}

export default function MovieMediaSection({ videos, images }: MovieMediaSectionProps) {
  // 트레일러 필터링 (YouTube 영상 중 Trailer, Teaser 등)
  const trailers = videos.filter(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')).slice(0, 2);
  // 백드롭 이미지 필터링
  const backdrops = images.slice(0, 6);

  if (trailers.length === 0 && backdrops.length === 0) {
    return null;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 32px 64px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', color: 'var(--text-primary)' }}>
        트레일러 & 미디어
      </h2>
      
      {/* 트레일러 영역 */}
      {trailers.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          {trailers.map(trailer => (
            <div key={trailer.id} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: '#000' }}>
                <iframe
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=0`}
                  title={trailer.name}
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
              <p className="line-clamp-1" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>{trailer.name}</p>
            </div>
          ))}
        </div>
      )}

      {/* 스틸컷 영역 */}
      {backdrops.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          {backdrops.map((img, idx) => (
            <div key={idx} className="card-glow" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '16/9', backgroundColor: 'var(--bg-card)' }}>
              <img 
                src={img.file_path?.startsWith('http') ? img.file_path : `https://image.tmdb.org/t/p/w500${img.file_path}`} 
                alt={`스틸컷 ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
