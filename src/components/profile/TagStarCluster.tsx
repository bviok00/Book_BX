'use client';

interface TagStarClusterProps {
  tags: { name: string; weight: number }[];
  dominantColor?: string | null;
}

export default function TagStarCluster({ tags, dominantColor }: TagStarClusterProps) {
  const accent = dominantColor || 'var(--accent)';

  if (!tags || tags.length === 0) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
        아직 수집된 지식 태그가 없습니다.
      </div>
    );
  }

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '12px', 
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px 10px',
        minHeight: '200px'
      }}
    >
      {tags.map((tag, i) => {
        // weight에 따라 폰트 크기, 투명도 변화 (더미 로직 포함)
        const sizeMultiplier = Math.min(1.8, 1 + (tag.weight * 0.1));
        const opacity = Math.min(1, 0.6 + (tag.weight * 0.08));
        
        // 애니메이션 딜레이 약간 무작위로 주어 반짝이는 별처럼 보이게 함
        const delay = (i % 5) * 0.5;

        return (
          <span 
            key={tag.name}
            className="animate-pulse-glow"
            style={{
              fontSize: `${11 * sizeMultiplier}px`,
              fontWeight: tag.weight > 3 ? 700 : 500,
              padding: `${3 * sizeMultiplier}px ${8 * sizeMultiplier}px`,
              borderRadius: 'var(--radius-full)',
              backgroundColor: `var(--bg-card-hover)`,
              border: `1px solid ${accent}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
              color: 'var(--text-primary)',
              opacity: opacity,
              backdropFilter: 'blur(4px)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              animationDelay: `${delay}s`,
              boxShadow: `0 2px ${4 * sizeMultiplier}px rgba(0,0,0,0.05)`
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.backgroundColor = `${accent}1A`;
              e.currentTarget.style.boxShadow = `0 4px ${8 * sizeMultiplier}px ${accent}33`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = `var(--bg-card-hover)`;
              e.currentTarget.style.boxShadow = `0 2px ${4 * sizeMultiplier}px rgba(0,0,0,0.05)`;
            }}
          >
            #{tag.name}
          </span>
        );
      })}
    </div>
  );
}
