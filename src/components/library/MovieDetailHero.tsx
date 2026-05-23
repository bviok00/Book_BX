'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateMovieStatus, updateMovieProgress, deleteUserMovie, updateMovieRating, updateMovieFolder } from '@/app/dashboard/movie-actions';
import type { MovieStatus } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { TMDB_IMAGE_BASE, TMDB_BACKDROP_SIZE } from '@/types/tmdb';

export default function MovieDetailHero({ userMovie, movie, folders = [], isReadOnly = false }: { userMovie: any, movie: any, folders?: any[], isReadOnly?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState<MovieStatus>(userMovie.status);
  const [optimisticProgress, setOptimisticProgress] = useState<number>(userMovie.progress_pct || 0);
  const [optimisticRating, setOptimisticRating] = useState<number>(userMovie.rating || 0);
  const [optimisticFolderId, setOptimisticFolderId] = useState<string | null>(userMovie.folder_id || null);

  const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isReadOnly) return;
    const newFolderId = e.target.value === 'none' ? null : e.target.value;
    setOptimisticFolderId(newFolderId);
    startTransition(async () => {
      await updateMovieFolder(userMovie.id, newFolderId);
    });
  };

  const handleStatusChange = (newStatus: MovieStatus) => {
    if (optimisticStatus === newStatus) {
      if (window.confirm('현재 상태를 취소하고 영화관에서 완전히 삭제하시겠습니까?')) {
        startTransition(async () => {
          const res = await deleteUserMovie(userMovie.id);
          if (res.success) {
            router.push('/dashboard?tab=MOVIE');
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
      await updateMovieStatus(userMovie.id, newStatus);
    });
  };

  const handleRatingChange = (clickedRating: number) => {
    if (isReadOnly) return;
    const newRating = optimisticRating === clickedRating ? 0 : clickedRating;
    setOptimisticRating(newRating);
    startTransition(async () => {
      await updateMovieRating(userMovie.id, newRating === 0 ? null : newRating);
    });
  };

  const handleProgressChange = (pct: number) => {
    setOptimisticProgress(pct);
    startTransition(async () => {
      await updateMovieProgress(userMovie.id, pct);
    });
  };

  const handleDelete = () => {
    if (window.confirm('위시리스트(영화관)에서 이 영화를 완전히 삭제하시겠습니까?')) {
      startTransition(async () => {
        const res = await deleteUserMovie(userMovie.id);
        if (res.success) {
          router.push('/dashboard');
        } else {
          alert(res.message);
        }
      });
    }
  };

  const backgroundUrl = movie.backdrop_url 
    ? `${TMDB_IMAGE_BASE}/${TMDB_BACKDROP_SIZE}${movie.backdrop_url}`
    : movie.poster_url;

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '450px', display: 'flex', alignItems: 'center' }}>
      
      {/* 백그라운드 블러 효과 (왓챠 스타일) */}
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
      <button 
        onClick={handleDelete}
        disabled={isPending}
        style={{ position: 'absolute', top: '32px', right: '32px', zIndex: 10, background: 'rgba(255,50,50,0.2)', border: '1px solid rgba(255,50,50,0.4)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffaaaa', cursor: 'pointer', backdropFilter: 'blur(10px)', fontSize: '18px' }}
        className="hover-scale"
        title="영화관에서 삭제"
      >
        🗑️
      </button>

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
            src={movie.poster_url || ''} 
            alt={movie.title}
            style={{
              width: '220px',
              height: 'auto',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          />
        </div>

        {/* 영화 정보 */}
        <div style={{ flex: '1', minWidth: '300px', color: '#fff', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <StatusBadge status={optimisticStatus} size="sm" type="MOVIE" />
            {movie.release_date && (
              <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                {movie.release_date.split('-')[0]}
              </span>
            )}
            {movie.metadata?.vote_average && (
              <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                TMDB 평점 {movie.metadata.vote_average.toFixed(1)}
              </span>
            )}
          </div>

          <h1 style={{ fontSize: '36px', fontWeight: 800, marginTop: '4px', marginBottom: '8px', lineHeight: 1.2 }}>
            {movie.title}
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginBottom: '32px' }}>
            {movie.original_title}
          </p>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '32px', 
            width: 'fit-content' 
          }}>
            {/* 유저 상호작용 영역 (상태, 별점, 기타 옵션) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              
              {isReadOnly ? (
                <button 
                  onClick={() => {
                    startTransition(async () => {
                      const { addMovieToLibrary } = await import('@/app/dashboard/movie-actions');
                      const res = await addMovieToLibrary(movie.tmdb_id, {
                        title: movie.title,
                        original_title: movie.original_title,
                        director: null,
                        poster_url: movie.poster_url,
                        backdrop_url: movie.backdrop_url,
                        genre: movie.genre,
                        release_date: movie.release_date,
                        runtime_min: movie.runtime_min,
                        overview: movie.overview,
                        metadata: movie.metadata
                      });
                      if (res.success && res.data) {
                        router.refresh();
                      } else {
                        alert(res.message);
                      }
                    });
                  }}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    backgroundColor: 'var(--accent)',
                    color: '#000',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: isPending ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isPending ? 0.7 : 1,
                    transition: 'transform 0.2s, opacity 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {isPending ? '추가 중...' : '+ 위시리스트 추가'}
                </button>
              ) : (
                <>
                  {/* 상태 버튼들 */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {(['WANT_TO_WATCH', 'WATCHING', 'COMPLETED', 'DROPPED'] as MovieStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        disabled={isPending}
                        style={{
                          padding: '10px 20px',
                          borderRadius: 'var(--radius-full)',
                          border: optimisticStatus === status ? 'none' : '1px solid rgba(255,255,255,0.2)',
                          backgroundColor: optimisticStatus === status ? 'var(--accent)' : 'rgba(0,0,0,0.4)',
                          color: optimisticStatus === status ? '#000' : '#fff',
                          fontWeight: 700,
                          fontSize: '14px',
                          cursor: 'pointer',
                          opacity: isPending ? 0.7 : 1,
                          transition: 'all 0.2s',
                        }}
                        className="hover-bg"
                      >
                        {status === 'WANT_TO_WATCH' ? '💜 보고싶은'
                         : status === 'WATCHING' ? '🔥 보는중'
                         : status === 'COMPLETED' ? '✅ 시청완료'
                         : '⏹️ 중단'}
                      </button>
                    ))}
                  </div>
                  
                  {/* 시청 진행도 평가 */}
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

                  {/* 폴더 선택 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>폴더</span>
                    <select 
                      value={optimisticFolderId || 'none'}
                      onChange={handleFolderChange}
                      disabled={isPending}
                      style={{ background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '8px', borderRadius: '4px' }}
                    >
                      <option value="none" style={{ background: '#1a1a1a', color: '#fff' }}>📁 폴더 미지정</option>
                      {folders.filter(f => f.media_type === 'MOVIE').map(f => (
                        <option key={f.id} value={f.id} style={{ background: '#1a1a1a', color: '#fff' }}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* 별점 평가 */}
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
