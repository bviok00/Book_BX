'use server';
// 영화 전용 Server Actions (도서 actions.ts와 분리)
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResponse, MovieStatus } from '@/types';

// ── 영화 내 서재에 추가 ──
export async function addMovieToLibrary(
  tmdbId: number,
  movieData: {
    title: string;
    original_title: string | null;
    director: string | null;
    poster_url: string | null;
    backdrop_url: string | null;
    genre: string | null;
    release_date: string | null;
    runtime_min: number | null;
    overview: string | null;
    metadata: Record<string, unknown>;
  },
  folderId?: string
): Promise<ActionResponse<string>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '인증이 필요합니다.' };

    // 1. movies 테이블에 캐싱
    const { error: movieError } = await supabase.from('movies').upsert(
      {
        tmdb_id: tmdbId,
        title: movieData.title,
        original_title: movieData.original_title,
        director: movieData.director,
        poster_url: movieData.poster_url,
        backdrop_url: movieData.backdrop_url,
        genre: movieData.genre,
        release_date: movieData.release_date,
        runtime_min: movieData.runtime_min,
        overview: movieData.overview,
        metadata: movieData.metadata,
      },
      { onConflict: 'tmdb_id' }
    );

    if (movieError) {
      console.error('Movie upsert error:', movieError);
      return { success: false, message: `영화 마스터 정보 등록 실패: ${movieError.message}` };
    }

    // 2. user_movies에 추가
    const { data: newUserMovie, error } = await supabase.from('user_movies').insert({
      user_id: user.id,
      tmdb_id: tmdbId,
      folder_id: folderId || null,
      status: 'WANT_TO_WATCH',
    }).select('id').single();

    if (error) {
      if (error.code === '23505') {
        const { data: existing } = await supabase.from('user_movies').select('id').eq('user_id', user.id).eq('tmdb_id', tmdbId).single();
        if (existing) {
          return { success: true, message: '이미 영화관에 있는 영화입니다.', data: existing.id };
        }
        return { success: false, message: '이미 서재에 추가된 영화입니다.' };
      }
      return { success: false, message: `영화 추가 실패: ${error.message}` };
    }

    // 3. 자동 태그 추가
    if (newUserMovie) {
      const tagsToCreate: string[] = [];
      
      // 장르 파싱
      if (movieData.genre) {
        const genres = movieData.genre.split(',').map(g => g.trim()).filter(Boolean);
        tagsToCreate.push(...genres);
      }

      // TMDB 키워드 API 호출
      try {
        const apiKey = process.env.TMDB_API_KEY;
        if (apiKey) {
          const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/keywords?api_key=${apiKey}&language=ko-KR`);
          if (res.ok) {
            const data = await res.json();
            if (data.keywords && Array.isArray(data.keywords)) {
              // 최대 5개의 키워드만 가져와 태그로 추가
              const keywords = data.keywords.slice(0, 5).map((k: any) => k.name);
              tagsToCreate.push(...keywords);
            }
          }
        }
      } catch (e) {
        console.error('TMDB keyword fetch error:', e);
      }

      if (tagsToCreate.length > 0) {
        await addMovieTags(newUserMovie.id, Array.from(new Set(tagsToCreate)));
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/profile');
    return { success: true, message: '서재에 영화가 추가되었습니다.', data: newUserMovie?.id };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── 영화 상태 변경 ──
export async function updateMovieStatus(
  userMovieId: string,
  status: MovieStatus
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = { status };
    if (status === 'WATCHING') {
      updateData.started_at = new Date().toISOString();
    } else if (status === 'COMPLETED') {
      updateData.finished_at = new Date().toISOString();
      updateData.progress_pct = 100; // 완료 시 진행도 100% 강제
    }

    const { error } = await supabase
      .from('user_movies')
      .update(updateData)
      .eq('id', userMovieId);

    if (error) return { success: false, message: `상태 변경 실패: ${error.message}` };

    revalidatePath('/dashboard');
    return { success: true, message: '영화 시청 상태가 변경되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── 영화 진행도 업데이트 ──
export async function updateMovieProgress(
  userMovieId: string,
  progressPct: number
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    
    // 진행도가 100이면 상태도 COMPLETED로 바꿀 수 있지만, 여기서는 순수하게 진행도만 업데이트
    const updateData: Record<string, unknown> = { progress_pct: progressPct };
    if (progressPct === 100) {
      updateData.status = 'COMPLETED';
      updateData.finished_at = new Date().toISOString();
    } else if (progressPct > 0) {
      updateData.status = 'WATCHING';
    }

    const { error } = await supabase
      .from('user_movies')
      .update(updateData)
      .eq('id', userMovieId);

    if (error) return { success: false, message: `진행도 저장 실패: ${error.message}` };

    revalidatePath('/dashboard');
    return { success: true, message: '시청 진행도가 저장되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── 스마트 큐레이션을 위한 상위 태그 추출 ──
export async function getTopTags(limit = 3, filterType?: 'BOOK' | 'MOVIE'): Promise<ActionResponse<string[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '인증이 필요합니다.', data: [] };

    let query = supabase.from('tags').select('name').eq('user_id', user.id);

    if (filterType === 'BOOK') {
      const { data: btData } = await supabase.from('book_tags').select('tags(name)').eq('user_id', user.id).limit(20);
      if (btData && btData.length > 0) {
        const names = btData.map((b: any) => b.tags?.name).filter(Boolean);
        if (names.length > 0) {
          return { success: true, message: '태그 추출 완료', data: Array.from(new Set(names)).slice(0, limit) as string[] };
        }
      }
      // 수동 태그가 없으면 서재에 있는 도서들의 알라딘 카테고리(분류)에서 키워드 추출
      const { data: ubData } = await supabase.from('user_books').select('books(category)').eq('user_id', user.id).limit(10);
      if (ubData && ubData.length > 0) {
        const categories = ubData.map((ub: any) => ub.books?.category).filter(Boolean);
        const extractedTags = new Set<string>();
        categories.forEach(cat => {
          const parts = cat.split('>');
          // 마지막 분류와 그 앞 분류 정도를 태그로 활용
          if (parts.length > 0) extractedTags.add(parts[parts.length - 1].trim());
          if (parts.length > 1) extractedTags.add(parts[parts.length - 2].trim());
        });
        const finalTags = Array.from(extractedTags);
        if (finalTags.length > 0) {
          return { success: true, message: '카테고리 기반 태그 추출 완료', data: finalTags.slice(0, limit) };
        }
      }
      return { success: true, message: '기본 태그 반환', data: ['베스트셀러'].slice(0, limit) };
    } else if (filterType === 'MOVIE') {
      const { data: mtData } = await supabase.from('movie_tags').select('tags(name)').eq('user_id', user.id).limit(20);
      if (mtData && mtData.length > 0) {
        const names = mtData.map((m: any) => m.tags?.name).filter(Boolean);
        if (names.length > 0) {
          return { success: true, message: '태그 추출 완료', data: Array.from(new Set(names)).slice(0, limit) as string[] };
        }
      }
      
      // 수동 태그가 없으면 내 영화관에 있는 영화들의 장르를 키워드로 추출
      const { data: umData } = await supabase.from('user_movies').select('movies(genre)').eq('user_id', user.id).limit(10);
      if (umData && umData.length > 0) {
        const genres = umData.map((um: any) => um.movies?.genre).filter(Boolean);
        const extractedTags = new Set<string>();
        genres.forEach(genreStr => {
          const parts = genreStr.split(',');
          parts.forEach((p: string) => {
            if (p.trim()) extractedTags.add(p.trim());
          });
        });
        const finalTags = Array.from(extractedTags);
        if (finalTags.length > 0) {
          return { success: true, message: '장르 기반 태그 추출 완료', data: finalTags.slice(0, limit) };
        }
      }
      return { success: true, message: '기본 태그 반환', data: ['명작'].slice(0, limit) };
    }

    // 기본 로직 (전체 탭이거나 위에서 데이터가 없을 경우)
    const { data: tags, error } = await query.order('created_at', { ascending: false }).limit(limit);

    if (error) throw error;

    return { success: true, message: '태그 추출 완료', data: tags.map(t => t.name) };
  } catch (error: unknown) {
    return { success: false, message: '태그 추출 실패', data: [] };
  }
}

// ── 내 영화관에서 영화 삭제 (위시리스트 삭제) ──
export async function deleteUserMovie(userMovieId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '인증이 필요합니다.' };

    const { error } = await supabase
      .from('user_movies')
      .delete()
      .eq('id', userMovieId)
      .eq('user_id', user.id);

    if (error) return { success: false, message: `영화 삭제 실패: ${error.message}` };

    revalidatePath('/dashboard');
    revalidatePath('/profile');
    return { success: true, message: '영화관에서 삭제되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── 영화 평점 업데이트 ──
export async function updateMovieRating(
  userMovieId: string,
  rating: number | null
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('user_movies')
      .update({ rating })
      .eq('id', userMovieId);

    if (error) return { success: false, message: `평점 저장 실패: ${error.message}` };

    revalidatePath('/dashboard');
    revalidatePath('/profile');
    return { success: true, message: '평점이 저장되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── 영화 다이렉트 태그 추가 ──
export async function addMovieTags(
  userMovieId: string,
  tags: string[]
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '인증이 필요합니다.' };

    if (!tags || tags.length === 0) return { success: true, message: '추가할 태그가 없습니다.' };

    for (const tagName of tags) {
      const tName = tagName.trim();
      if (!tName) continue;
      
      let tagId;
      const { data: existingTag } = await supabase
        .from('tags')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', tName)
        .single();
        
      if (existingTag) {
        tagId = existingTag.id;
      } else {
        const { data: newTag, error: tagErr } = await supabase
          .from('tags')
          .insert({ user_id: user.id, name: tName })
          .select()
          .single();
        if (newTag) tagId = newTag.id;
        else if (tagErr && tagErr.code === '23505') {
          const { data: fallbackTag } = await supabase.from('tags').select('id').eq('user_id', user.id).eq('name', tName).single();
          if (fallbackTag) tagId = fallbackTag.id;
        }
      }
      
      if (tagId) {
        await supabase.from('movie_tags').insert({
          user_movie_id: userMovieId,
          tag_id: tagId,
        });
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/profile');
    return { success: true, message: '영화에 태그가 추가되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── 마이크로 메모 저장 (영화) ──
export async function createMovieNote(
  userMovieId: string,
  content: string,
  timeReference?: string,
  tags?: string[]
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '인증이 필요합니다.' };

    const { data: noteData, error } = await supabase.from('granular_notes').insert({
      user_movie_id: userMovieId,
      user_id: user.id,
      content,
      page_reference: timeReference || null,
    }).select().single();

    if (error) return { success: false, message: `메모 저장 실패: ${error.message}` };

    if (tags && tags.length > 0 && noteData) {
      for (const tagName of tags) {
        const tName = tagName.trim();
        if (!tName) continue;
        
        let tagId;
        const { data: existingTag } = await supabase.from('tags').select('id').eq('user_id', user.id).eq('name', tName).single();
          
        if (existingTag) {
          tagId = existingTag.id;
        } else {
          const { data: newTag, error: tagErr } = await supabase.from('tags').insert({ user_id: user.id, name: tName }).select().single();
          if (newTag) tagId = newTag.id;
          else if (tagErr && tagErr.code === '23505') {
            const { data: fallbackTag } = await supabase.from('tags').select('id').eq('user_id', user.id).eq('name', tName).single();
            if (fallbackTag) tagId = fallbackTag.id;
          }
        }
        
        if (tagId) {
          await supabase.from('note_tags').insert({ note_id: noteData.id, tag_id: tagId });
          await supabase.from('movie_tags').insert({ user_movie_id: userMovieId, tag_id: tagId });
        }
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/profile');
    return { success: true, message: '메모가 저장되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── 마이크로 메모 수정 (영화) ──
export async function updateMovieNote(
  noteId: string,
  content: string,
  tags?: string[]
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '인증이 필요합니다.' };

    const { error: noteError } = await supabase
      .from('granular_notes')
      .update({ content })
      .eq('id', noteId)
      .eq('user_id', user.id);

    if (noteError) return { success: false, message: `메모 수정 실패: ${noteError.message}` };

    if (tags !== undefined) {
      await supabase.from('note_tags').delete().eq('note_id', noteId);
      for (const tagName of tags) {
        const tName = tagName.trim();
        if (!tName) continue;
        
        let tagId;
        const { data: existingTag } = await supabase.from('tags').select('id').eq('user_id', user.id).eq('name', tName).single();
          
        if (existingTag) {
          tagId = existingTag.id;
        } else {
          const { data: newTag, error: tagErr } = await supabase.from('tags').insert({ user_id: user.id, name: tName }).select().single();
          if (newTag) tagId = newTag.id;
          else if (tagErr && tagErr.code === '23505') {
            const { data: fallbackTag } = await supabase.from('tags').select('id').eq('user_id', user.id).eq('name', tName).single();
            if (fallbackTag) tagId = fallbackTag.id;
          }
        }
        
        if (tagId) {
          await supabase.from('note_tags').insert({ note_id: noteId, tag_id: tagId });
        }
      }
    }

    revalidatePath('/dashboard');
    return { success: true, message: '메모가 수정되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── 마이크로 메모 삭제 (영화) ──
export async function deleteMovieNote(noteId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '인증이 필요합니다.' };

    const { error } = await supabase
      .from('granular_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id);

    if (error) return { success: false, message: `메모 삭제 실패: ${error.message}` };

    revalidatePath('/dashboard');
    return { success: true, message: '메모가 삭제되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}
