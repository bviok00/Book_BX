'use client';
// html2canvas 기반 인스타그램 스타일 공유 카드 렌더링

import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import Button from '@/components/ui/Button';

interface ShareCardProps {
  bookTitle: string;
  author: string;
  coverUrl: string;
  quote: string; // 인상 깊은 문장 (메모 중 하나)
  dominantColor?: string;
}

export default function ShareCard({
  bookTitle,
  author,
  coverUrl,
  quote,
  dominantColor = '#1a1a2e',
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!cardRef.current) return;
    
    setIsExporting(true);
    try {
      // CORS 문제 방지를 위해 useCORS 옵션 활성화
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2, // 고해상도 추출
        backgroundColor: null,
      });
      
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `intellect_bx_${bookTitle.replace(/\s/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('이미지 추출 실패:', error);
      alert('이미지 생성 중 오류가 발생했습니다. (CORS 제한일 수 있습니다)');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
      {/* 캡처 대상 영역 (화면에는 작게 보이지만 해상도는 높게) */}
      <div 
        style={{
          padding: '24px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <div
          ref={cardRef}
          style={{
            width: '1080px', // 인스타그램 스토리/피드 추천 너비 비율
            height: '1080px',
            transform: 'scale(0.3)', // 브라우저에서는 30% 크기로 렌더링
            transformOrigin: 'top left',
            marginBottom: '-756px', // (1080 - 1080*0.3) 여백 보정
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '80px',
            background: `linear-gradient(135deg, ${dominantColor} 0%, #0a0a0a 100%)`,
            color: '#fff',
            fontFamily: "'Pretendard', sans-serif",
          }}
        >
          {/* 장식용 따옴표 */}
          <div style={{ fontSize: '120px', color: 'rgba(255,255,255,0.2)', position: 'absolute', top: '100px', left: '100px', lineHeight: 1 }}>
            "
          </div>
          
          <div style={{ zIndex: 1, textAlign: 'center', maxWidth: '80%' }}>
            <p style={{ fontSize: '48px', fontWeight: 500, lineHeight: 1.5, wordBreak: 'keep-all', marginBottom: '80px' }}>
              {quote}
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px' }}>
              <img 
                src={coverUrl} 
                alt="표지" 
                crossOrigin="anonymous"
                style={{ width: '160px', height: '240px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} 
              />
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '8px' }}>{bookTitle}</h2>
                <p style={{ fontSize: '24px', color: 'rgba(255,255,255,0.7)' }}>{author}</p>
                <div style={{ marginTop: '24px', padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '20px', display: 'inline-block', fontSize: '20px' }}>
                  Intellect BX
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button variant="primary" onClick={handleExport} isLoading={isExporting}>
        📸 이미지로 저장하기
      </Button>
    </div>
  );
}
