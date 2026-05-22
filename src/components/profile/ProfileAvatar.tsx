'use client';

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  email?: string;
  dominantColor?: string | null;
  completedCount: number;
}

export default function ProfileAvatar({
  avatarUrl,
  displayName,
  email,
  dominantColor,
  completedCount,
}: ProfileAvatarProps) {
  // 등급 계산
  let tierName = '탐험가 (Explorer)';
  let tierIcon = '🧭';
  if (completedCount >= 50) {
    tierName = '학자 (Scholar)';
    tierIcon = '🎓';
  } else if (completedCount >= 10) {
    tierName = '사서 (Librarian)';
    tierIcon = '📚';
  }

  const nameToDisplay = displayName || email?.split('@')[0] || '사령관';
  const initial = nameToDisplay.charAt(0).toUpperCase();

  const neonColor = dominantColor || 'var(--accent)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
      
      {/* 아바타와 네온 링 */}
      <div 
        style={{
          position: 'relative',
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          padding: '4px',
          background: `linear-gradient(135deg, ${neonColor}, transparent, ${neonColor})`,
          animation: 'spin-slow 8s linear infinite',
          boxShadow: `0 0 20px ${neonColor}66`
        }}
      >
        <div 
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            border: '4px solid var(--bg-card)', // 이너 보더
            animation: 'spin-slow 8s linear reverse infinite', // 이미지가 같이 돌지 않도록 역회전
          }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={nameToDisplay} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '48px', fontWeight: 800, color: 'var(--text-secondary)' }}>
              {initial}
            </span>
          )}
        </div>
        
        {/* 등급 아이콘 뱃지 */}
        <div 
          title={tierName}
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-card)',
            border: `2px solid ${neonColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            boxShadow: 'var(--shadow-md)',
            animation: 'spin-slow 8s linear reverse infinite',
          }}
        >
          {tierIcon}
        </div>
      </div>

      {/* 닉네임 */}
      <div>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '4px' }}>
          {nameToDisplay}
        </h2>
        <p style={{ fontSize: '14px', color: neonColor, fontWeight: 600, opacity: 0.9 }}>
          {tierName} · {completedCount}권 완독
        </p>
      </div>

    </div>
  );
}
