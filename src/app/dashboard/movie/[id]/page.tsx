import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MovieDetailHero from '@/components/library/MovieDetailHero';
import MovieTagsEditor from '@/components/library/MovieTagsEditor';
import MovieNotesFeed from '@/components/library/MovieNotesFeed';
import MovieMediaSection from '@/components/library/MovieMediaSection';

import SimilarRecommendationsClient from '@/components/library/SimilarRecommendationsClient';
import type { CurationItem } from '@/types';
import { TMDB_IMAGE_BASE, TMDB_POSTER_SIZE, TMDB_BACKDROP_SIZE } from '@/types/tmdb';

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const userMovieId = resolvedParams.id;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userMovieId);
  
  let userMovieQuery = supabase.from('user_movies').select(`
    *,
    movies (*),
    folders (id, name),
    movie_tags (tags (id, name)),
    granular_notes (*, note_tags (tags (id, name)))
  `).eq('user_id', user.id);

  if (isUuid) {
    userMovieQuery = userMovieQuery.eq('id', userMovieId);
  } else {
    userMovieQuery = userMovieQuery.eq('tmdb_id', parseInt(userMovieId, 10));
  }

  const [userMovieRes, foldersRes, profileRes] = await Promise.all([
    userMovieQuery.single(),
    supabase.from('folders').select('*').eq('user_id', user.id).order('sort_order'),
    supabase.from('profiles').select('*').eq('id', user.id).single()
  ]);

  let userMovie = userMovieRes.data;
  let movie = userMovie?.movies;
  let profile = profileRes.data;
  let isReadOnly = false;

  // 서재에 없는 경우 TMDB API에서 직접 가져오기 (읽기 전용 모드)
  if (!userMovie && !isUuid) {
    isReadOnly = true;
    const apiKey = process.env.TMDB_API_KEY;
    if (apiKey) {
      const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${userMovieId}?api_key=${apiKey}&language=ko-KR`);
      if (tmdbRes.ok) {
        const m = await tmdbRes.json();
        movie = {
          tmdb_id: m.id,
          title: m.title,
          original_title: m.original_title,
          director: null,
          poster_url: m.poster_path ? `${TMDB_IMAGE_BASE}/${TMDB_POSTER_SIZE}${m.poster_path}` : null,
          backdrop_url: m.backdrop_path ? `${TMDB_IMAGE_BASE}/${TMDB_BACKDROP_SIZE}${m.backdrop_path}` : null,
          genre: m.genres?.map((g: any) => g.name).join(', ') || null,
          release_date: m.release_date,
          runtime_min: m.runtime,
          overview: m.overview,
          metadata: { vote_average: m.vote_average }
        };
        userMovie = {
          id: 'readonly',
          user_id: user.id,
          tmdb_id: m.id,
          status: 'NONE',
          progress_pct: 0,
          rating: 0,
          granular_notes: [],
          movie_tags: []
        };
      }
    }
  }

  const folders = foldersRes.data || [];

  if (!userMovie || !movie) {
    return <div className="p-8 text-center text-[var(--text-secondary)]">영화를 찾을 수 없습니다.</div>;
  }

  const notes = userMovie.granular_notes || [];

  // TMDB 미디어(트레일러, 이미지) 데이터 가져오기
  let tmdbMedia = null;
  if (movie.tmdb_id) {
    try {
      const apiKey = process.env.TMDB_API_KEY;
      if (apiKey) {
        // include_image_language=ko,null 로 한국어 및 언어없는 이미지 가져오기
        const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.tmdb_id}?api_key=${apiKey}&append_to_response=videos,images&include_image_language=ko,null`);
        if (tmdbRes.ok) {
          tmdbMedia = await tmdbRes.json();
        }
      }
    } catch (e) {
      console.error('TMDB media fetch error:', e);
    }
  }

  // ── TMDB Recommendations 가져오기 ──
  let recommendedItems: CurationItem[] = [];
  if (movie.tmdb_id) {
    try {
      const apiKey = process.env.TMDB_API_KEY;
      if (apiKey) {
        const recRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.tmdb_id}/recommendations?api_key=${apiKey}&language=ko-KR&page=1`);
        if (recRes.ok) {
          const recJson = await recRes.json();
          if (recJson.results) {
            recommendedItems = recJson.results.slice(0, 15).map((m: any) => ({
              id: `MOVIE_${m.id}`,
              type: 'MOVIE',
              title: m.title,
              creator: m.original_title,
              posterUrl: m.poster_path ? `${TMDB_IMAGE_BASE}/${TMDB_POSTER_SIZE}${m.poster_path}` : '',
              originalData: m
            }));
          }
        }
      }
    } catch (e) {
      console.error('TMDB Recommendations Error:', e);
    }
  }

  const videos = tmdbMedia?.videos?.results || [];
  const images = tmdbMedia?.images?.backdrops || [];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* 왓챠 스타일 히어로 뷰 */}
      {isReadOnly && (
        <div style={{ backgroundColor: 'rgba(232, 197, 71, 0.1)', border: '1px solid var(--accent)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: '4px' }}>읽기 전용 모드</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>이 영화는 아직 위시리스트에 없습니다. 노트와 태그를 작성하려면 서재에 추가해주세요.</p>
          </div>
        </div>
      )}

      <MovieDetailHero userMovie={userMovie} movie={movie} folders={folders} isReadOnly={isReadOnly} />

      {/* 컨텐츠 영역: 개요 및 정보 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '32px', display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
        
        {/* 개요 정보 및 태그 */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column' }}>
          {/* 영화 태그 에디터 */}
          <MovieTagsEditor userMovieId={userMovie.id} initialTags={userMovie.movie_tags?.map((mt: any) => mt.tags) || []} isReadOnly={isReadOnly} />

          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
            개요
          </h2>
          <div className="glass-card" style={{ padding: '24px', maxHeight: '600px', overflowY: 'auto' }}>
            {movie.overview ? (
              <p style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {movie.overview}
              </p>
            ) : (
              <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', textAlign: 'center' }}>개요 정보가 제공되지 않는 영화입니다.</p>
            )}
          </div>
        </div>

        {/* 마이크로 메모 */}
        <div style={{ flex: '1 1 400px' }}>
          {!isReadOnly && <MovieNotesFeed userMovieId={userMovie.id} mediaId={movie.tmdb_id.toString()} notes={notes} user={user} profile={profile} />}
        </div>
      </div>

      {/* 영화 트레일러 및 미디어 섹션 (하단 Full Width) */}
      {tmdbMedia && <MovieMediaSection videos={tmdbMedia.videos?.results || []} images={tmdbMedia.images?.backdrops || []} />}

      {/* ── 비슷한 추천 작품 ── */}
      {recommendedItems.length > 0 && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 48px', paddingBottom: '48px' }}>
          <SimilarRecommendationsClient title="이 영화와 비슷한 작품" items={recommendedItems} />
        </div>
      )}
    </div>
  );
}
