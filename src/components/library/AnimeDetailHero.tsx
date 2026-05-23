'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateAnimeStatus, updateAnimeProgress, removeAnimeFromLibrary, updateAnimeRating, addAnimeToLibrary, updateAnimeFolder } from '@/app/dashboard/anime-actions';
import type { AnimeStatus } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { TMDB_IMAGE_BASE, TMDB_BACKDROP_SIZE } from '@/types/tmdb';
import Button from '@/components/ui/Button';

export default function AnimeDetailHero({ userAnime, anime, folders = [], isReadOnly = false }: { userAnime: any, anime: any, folders?: any[], isReadOnly?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState<AnimeStatus>(userAnime?.status || 'WANT_TO_WATCH');
  const [optimisticProgress, setOptimisticProgress] = useState<number>(userAnime?.progress_pct || 0);
  const [optimisticRating, setOptimisticRating] = useState<number>(userAnime?.rating || 0);
  const [optimisticFolderId, setOptimisticFolderId] = useState<string | null>(userAnime?.folder_id || null);
  const [isAdding, setIsAdding] = useState(false);

  const handleStatusChange = (newStatus: AnimeStatus) => {
    if (optimisticStatus === newStatus) {
      if (window.confirm('현재 상태를 취소하고 애니관에서 완전히 삭제하시겠습니까?')) {
        startTransition(async () => {
          const res = await removeAnimeFromLibrary(userAnime.id);
          if (res.success) {
            router.push('/dashboard?tab=ANIME');
          } else {
            alert(res.message);
          }
        });
      }
      return;
    }

    setOptimisticStatus(newStatus);
    if (newStatus === 'COMPLETED') setOptimisticProgress(100);
    startTransition(async () => {
      await updateAnimeStatus(userAnime.id, newStatus);
    });
  };

  const handleRatingChange = (clickedRating: number) => {
    if (isReadOnly) return;
    const newRating = optimisticRating === clickedRating ? 0 : clickedRating;
    setOptimisticRating(newRating);
    startTransition(async () => {
      await updateAnimeRating(userAnime.id, newRating === 0 ? 0 : newRating);
    });
  };

  const handleProgressChange = (pct: number) => {
    setOptimisticProgress(pct);
    startTransition(async () => {
      await updateAnimeProgress(userAnime.id, pct);
    });
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isReadOnly) return;
    const val = e.target.value === 'none' ? null : e.target.value;
    setOptimisticFolderId(val);
    startTransition(async () => {
      await updateAnimeFolder(userAnime.id, val);
    });
  };

  const handleDelete = () => {
    if (window.confirm('위시리스트(애니관)에서 이 애니메이션을 완전히 삭제하시겠습니까?')) {
      startTransition(async () => {
        const res = await removeAnimeFromLibrary(userAnime.id);
        if (res.success) {
          router.push('/dashboard');
        } else {
          alert(res.message);
        }
      });
    }
  };

  const handleAddAnime = async () => {
    setIsAdding(true);
    try {
      const res = await addAnimeToLibrary(
        anime.anilist_id,
        {
          title: anime.title,
          original_title: anime.original_title,
          director: anime.director,
          poster_url: anime.poster_url,
          backdrop_url: anime.backdrop_url,
          genre: anime.genre,
          release_date: anime.release_date,
          runtime_min: anime.runtime_min,
          overview: anime.overview,
          metadata: anime.metadata,
        },
        folders.find(f => f.media_type === 'ANIME')?.id
      );
      if (res.success && res.data) {
        router.refresh();
      } else {
        alert(res.message);
      }
    } finally {
      setIsAdding(false);
    }
  };

  const backgroundUrl = anime.backdrop_url || anime.poster_url;

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '450px', display: 'flex', alignItems: 'center' }}>
      
      {/* 백그라운드 블러 효과 */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${backgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(30px) brightness(0.25)',
          transform: 'scale(1.1)',
          zIndex: 0,
        }}
      />
      
      {/* 그라데이션 오버레이 */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 50%, var(--bg-primary) 100%)',
          zIndex: 1,
        }}
      />

      {/* 뒤로가기 버튼 */}
      <button 
        onClick={() => router.push('/dashboard')}
        style={{ position: 'absolute', top: '32px', left: '32px', zIndex: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(10px)', fontSize: '20px' }}
        className="hover-scale"
      >
        ←
      </button>

      {/* 삭제 버튼 */}
      {!isReadOnly && (
        <button 
          onClick={handleDelete}
          disabled={isPending}
          style={{ position: 'absolute', top: '32px', right: '32px', zIndex: 10, background: 'rgba(255,50,50,0.2)', border: '1px solid rgba(255,50,50,0.4)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffaaaa', cursor: 'pointer', backdropFilter: 'blur(10px)', fontSize: '18px' }}
          className="hover-scale"
          title="애니관에서 삭제"
        >
          🗑️
        </button>
      )}

      {/* 컨텐츠 컨테이너 */}
      <div 
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '64px 32px',
          display: 'flex',
          gap: '48px',
          width: '100%',
          alignItems: 'flex-end',
          flexWrap: 'wrap'
        }}
      >
        {/* 포스터 (전경) */}
        <div style={{ flexShrink: 0 }}>
          <img 
            src={anime.poster_url || '/img/3.png'} 
            alt={anime.title}
            style={{
              width: '220px',
              height: 'auto',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          />
        </div>

        {/* 정보 */}
        <div style={{ flex: '1', minWidth: '300px', color: '#fff', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {!isReadOnly && <StatusBadge status={optimisticStatus} size="sm" type="MOVIE" />}
            {anime.release_date && (
              <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                {anime.release_date.split('-')[0]}
              </span>
            )}
            {anime.metadata?.averageScore && (
              <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                AniList 평점 {anime.metadata.averageScore}
              </span>
            )}
          </div>

          <h1 style={{ fontSize: '36px', fontWeight: 800, marginTop: '4px', marginBottom: '8px', lineHeight: 1.2 }}>
            {anime.title}
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginBottom: '32px' }}>
            {anime.original_title}
          </p>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '32px', 
            width: 'fit-content' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              
              {isReadOnly ? (
                <Button 
                  size="lg" 
                  onClick={handleAddAnime} 
                  isLoading={isAdding}
                  style={{ padding: '12px 32px', fontSize: '16px' }}
                >
                  + 서재에 추가
                </Button>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['WANT_TO_WATCH', 'WATCHING', 'COMPLETED', 'DROPPED'] as AnimeStatus[]).map((status) => (
                      <button
                        key={status}
                        disabled={isPending}
                        onClick={() => handleStatusChange(status)}
                        style={{
                          padding: '10px 18px',
                          borderRadius: 'var(--radius-md)',
                          border: optimisticStatus === status ? 'none' : '1px solid rgba(255,255,255,0.3)',
                          background: optimisticStatus === status ? 'var(--accent)' : 'transparent',
                          color: optimisticStatus === status ? '#fff' : 'rgba(255,255,255,0.8)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          backdropFilter: 'blur(5px)',
                          transition: 'all 0.2s',
                          outline: 'none',
                          opacity: isPending ? 0.7 : 1
                        }}
                        className="hover-scale"
                      >
                        {status === 'WANT_TO_WATCH' ? '💜 보고싶은'
                         : status === 'WATCHING' ? '🔥 보는중'
                         : status === 'COMPLETED' ? '✅ 시청완료'
                         : '⏹️ 중단'}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>폴더</span>
                    <select 
                      value={optimisticFolderId || 'none'}
                      onChange={handleFolderChange}
                      disabled={isPending}
                      style={{ background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '8px', borderRadius: '4px' }}
                    >
                      <option value="none" style={{ background: '#1a1a1a', color: '#fff' }}>📁 폴더 미지정</option>
                      {folders.filter(f => f.media_type === 'ANIME').map(f => (
                        <option key={f.id} value={f.id} style={{ background: '#1a1a1a', color: '#fff' }}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>내 평가</span>
                    <div style={{ display: 'flex', gap: '4px', fontSize: '24px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          onClick={() => handleRatingChange(star)}
                          style={{
                            cursor: 'pointer',
                            color: star <= optimisticRating ? '#FFD700' : 'rgba(255,255,255,0.2)',
                            transition: 'color 0.2s',
                            textShadow: star <= optimisticRating ? '0 0 10px rgba(255,215,0,0.5)' : 'none'
                          }}
                          className="hover-scale"
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                      진행도 ({optimisticProgress}%)
                    </span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={optimisticProgress}
                      onChange={(e) => setOptimisticProgress(parseInt(e.target.value))}
                      onMouseUp={() => handleProgressChange(optimisticProgress)}
                      onTouchEnd={() => handleProgressChange(optimisticProgress)}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
