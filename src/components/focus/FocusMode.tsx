'use client';
// 풀스크린 포커스 모드 — 뽀모도로 타이머 + 실시간 독서 세션 기록

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { recordReadingSession } from '@/app/dashboard/actions';

interface FocusModeProps {
  userBookId: string;
  bookTitle: string;
  coverUrl: string;
  onClose: () => void;
}

export default function FocusMode({ userBookId, bookTitle, coverUrl, onClose }: FocusModeProps) {
  const [isActive, setIsActive] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  // 타이머 로직
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else if (!isActive && interval) {
      clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  // 세션 종료 및 기록
  const handleFinish = async () => {
    setIsActive(false);
    
    const durationMin = Math.floor(secondsElapsed / 60);
    
    // 1분 미만은 기록하지 않음
    if (durationMin < 1) {
      showToast('1분 미만의 세션은 기록되지 않습니다.', 'info');
      onClose();
      return;
    }
    
    setIsSaving(true);
    const result = await recordReadingSession(userBookId, durationMin);
    setIsSaving(false);
    
    if (result.success) {
      showToast(result.message, 'success');
      onClose();
    } else {
      showToast(result.message, 'error');
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 300ms ease-out',
      }}
    >
      {/* 배경 블러 표지 */}
      <div
        style={{
          position: 'absolute',
          inset: '-5%',
          backgroundImage: `url(${coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(40px) brightness(0.2)',
          zIndex: -1,
        }}
      />
      
      <div style={{ textAlign: 'center', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
        <img
          src={coverUrl}
          alt={bookTitle}
          style={{ width: '200px', height: 'auto', borderRadius: '8px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
        />
        
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
            {bookTitle}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>포커스 모드</p>
        </div>
        
        <div style={{ fontSize: '72px', fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums', letterSpacing: '-2px' }}>
          {formatTime(secondsElapsed)}
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <Button
            size="lg"
            variant="primary"
            onClick={() => setIsActive(!isActive)}
            style={{ width: '120px', backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--accent)', color: '#fff' }}
          >
            {isActive ? '일시정지' : '시작'}
          </Button>
          
          <Button
            size="lg"
            variant="ghost"
            onClick={handleFinish}
            isLoading={isSaving}
            style={{ width: '120px', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            종료 및 기록
          </Button>
        </div>
        
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={isSaving || secondsElapsed > 0}
          style={{ position: 'absolute', top: '24px', right: '24px', color: 'rgba(255,255,255,0.5)' }}
        >
          ✕ 닫기
        </Button>
      </div>
    </div>
  );
}
