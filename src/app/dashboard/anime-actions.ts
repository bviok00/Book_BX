'use server';
// 애니메이션 전용 Server Actions (도서/영화와 분리)
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResponse, AnimeStatus } from '@/types';

// ── 애니 내 애니관에 추가 ──
export async function addAnimeToLibrary(
  anilistId: number,
  animeData: {
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

    // 1. animes 테이블에 캐싱
    const { error: animeError } = await supabase.from('animes').upsert(
      {
        anilist_id: anilistId,
        title: animeData.title,
        original_title: animeData.original_title,
        director: animeData.director,
        poster_url: animeData.poster_url,
        backdrop_url: animeData.backdrop_url,
        genre: animeData.genre,
        release_date: animeData.release_date,
        runtime_min: animeData.runtime_min,
        overview: animeData.overview,
        metadata: animeData.metadata,
      },
      { onConflict: 'anilist_id' }
    );

    if (animeError) {
      console.error('Anime upsert error:', animeError);
      return { success: false, message: `애니 마스터 정보 등록 실패: ${animeError.message}` };
    }

    // 2. user_animes에 추가
    const { data: newUserAnime, error } = await supabase.from('user_animes').insert({
      user_id: user.id,
      anilist_id: anilistId,
      folder_id: folderId || null,
      status: 'WANT_TO_WATCH',
    }).select('id').single();

    if (error) {
      if (error.code === '23505') {
        const { data: existing } = await supabase.from('user_animes').select('id').eq('user_id', user.id).eq('anilist_id', anilistId).single();
        if (existing) {
          return { success: true, message: '이미 애니관에 있는 애니메이션입니다.', data: existing.id };
        }
        return { success: false, message: '이미 서재에 추가된 애니메이션입니다.' };
      }
      return { success: false, message: `애니 추가 실패: ${error.message}` };
    }

    // 3. 자동 태그 추가
    if (newUserAnime && animeData.genre) {
      const genres = animeData.genre.split(',').map(g => g.trim()).filter(Boolean);
      if (genres.length > 0) {
        await addAnimeTags(newUserAnime.id, Array.from(new Set(genres)));
      }
    }

    revalidatePath('/dashboard');
    return { success: true, message: '서재에 성공적으로 추가되었습니다.', data: newUserAnime.id };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── 애니 태그 일괄 추가 (내부용 / 외부용) ──
export async function addAnimeTags(userAnimeId: string, tags: string[]): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '인증이 필요합니다.' };

    for (const tagName of tags) {
      let tagId = '';
      const { data: existingTag } = await supabase
        .from('tags')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', tagName)
        .single();

      if (existingTag) {
        tagId = existingTag.id;
      } else {
        const { data: newTag } = await supabase
          .from('tags')
          .insert({ user_id: user.id, name: tagName })
          .select('id')
          .single();
        if (newTag) tagId = newTag.id;
      }

      if (tagId) {
        await supabase.from('anime_tags').insert({
          user_anime_id: userAnimeId,
          tag_id: tagId
        }).select().maybeSingle();
      }
    }
    
    revalidatePath('/dashboard');
    return { success: true, message: '태그가 추가되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── 애니 노트 추가 ──
export async function addAnimeNote(userAnimeId: string, content: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '인증이 필요합니다.' };

        const { error } = await supabase.from('granular_notes').insert({
          user_id: user.id,
          user_anime_id: userAnimeId,
          content,
        });

    if (error) return { success: false, message: `노트 작성 실패: ${error.message}` };

    revalidatePath('/dashboard');
    return { success: true, message: '노트가 작성되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── 애니 노트 삭제 ──
export async function deleteAnimeNote(noteId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('granular_notes').delete().eq('id', noteId);
    if (error) return { success: false, message: `노트 삭제 실패: ${error.message}` };

    revalidatePath('/dashboard');
    return { success: true, message: '노트가 삭제되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── 애니 상태 변경 ──
export async function updateAnimeStatus(userAnimeId: string, status: AnimeStatus): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const updateData: Record<string, unknown> = { status };
    if (status === 'WATCHING') updateData.started_at = new Date().toISOString();
    if (status === 'COMPLETED') updateData.finished_at = new Date().toISOString();

    const { error } = await supabase
      .from('user_animes')
      .update(updateData)
      .eq('id', userAnimeId);

    if (error) return { success: false, message: `상태 업데이트 실패: ${error.message}` };
    
    revalidatePath('/dashboard');
    return { success: true, message: '상태가 업데이트되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── 애니 별점 평가 ──
export async function updateAnimeRating(userAnimeId: string, rating: number): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('user_animes')
      .update({ rating })
      .eq('id', userAnimeId);

    if (error) return { success: false, message: `평점 저장 실패: ${error.message}` };

    revalidatePath('/dashboard');
    return { success: true, message: '평점이 저장되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── 애니 진행도 변경 ──
export async function updateAnimeProgress(userAnimeId: string, progressPct: number): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const updateData: Record<string, unknown> = { progress_pct: progressPct };
    if (progressPct === 100) {
      updateData.status = 'COMPLETED';
      updateData.finished_at = new Date().toISOString();
    } else if (progressPct > 0) {
      updateData.status = 'WATCHING';
    }

    const { error } = await supabase
      .from('user_animes')
      .update(updateData)
      .eq('id', userAnimeId);

    if (error) return { success: false, message: `진행도 저장 실패: ${error.message}` };

    revalidatePath('/dashboard');
    return { success: true, message: '시청 진행도가 저장되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── 애니 폴더 이동 ──
export async function updateAnimeFolder(userAnimeId: string, folderId: string | null): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('user_animes')
      .update({ folder_id: folderId })
      .eq('id', userAnimeId);

    if (error) return { success: false, message: `폴더 이동 실패: ${error.message}` };
    
    revalidatePath('/dashboard');
    return { success: true, message: '폴더가 변경되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── 애니 서재에서 삭제 ──
export async function removeAnimeFromLibrary(userAnimeId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('user_animes')
      .delete()
      .eq('id', userAnimeId);

    if (error) return { success: false, message: `삭제 실패: ${error.message}` };

    revalidatePath('/dashboard');
    return { success: true, message: '서재에서 삭제되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}
