'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types';

export async function getCommunityMemos(
  mediaId: string, 
  mediaType: 'BOOK' | 'MOVIE' | 'ANIME'
): Promise<ActionResponse<any[]>> {
  try {
    const supabase = await createClient();

    // 1. 해당 mediaType의 마스터 ID를 기반으로 이 작품에 달린 모든 granular_notes 가져오기
    // 관계: granular_notes -> user_books / user_movies / user_animes -> profiles
    
    let query = supabase.from('granular_notes').select(`
      id,
      content,
      page_reference,
      created_at,
      user_id,
      profiles ( display_name, avatar_url, email ),
      note_tags ( tags ( id, name ) )
    `);

    // Supabase의 inner join을 통해 특정 미디어 필터링
    if (mediaType === 'MOVIE') {
      query = query.not('user_movie_id', 'is', null);
      // user_movies 테이블과 조인하여 tmdb_id가 같은 노트만 가져옴
      const { data: userMovies } = await supabase
        .from('user_movies')
        .select('id')
        .eq('tmdb_id', parseInt(mediaId, 10));
        
      if (!userMovies || userMovies.length === 0) return { success: true, message: '조회 완료', data: [] };
      const ids = userMovies.map(um => um.id);
      query = query.in('user_movie_id', ids);
      
    } else if (mediaType === 'ANIME') {
      query = query.not('user_anime_id', 'is', null);
      const { data: userAnimes } = await supabase
        .from('user_animes')
        .select('id')
        .eq('anilist_id', parseInt(mediaId, 10));
        
      if (!userAnimes || userAnimes.length === 0) return { success: true, message: '조회 완료', data: [] };
      const ids = userAnimes.map(ua => ua.id);
      query = query.in('user_anime_id', ids);
      
    } else if (mediaType === 'BOOK') {
      query = query.not('user_book_id', 'is', null);
      const { data: userBooks } = await supabase
        .from('user_books')
        .select('id')
        .eq('isbn', mediaId);
        
      if (!userBooks || userBooks.length === 0) return { success: true, message: '조회 완료', data: [] };
      const ids = userBooks.map(ub => ub.id);
      query = query.in('user_book_id', ids);
    }

    const { data: notes, error } = await query.order('created_at', { ascending: false }).limit(100);

    if (error) {
      console.error('Community memos fetch error:', error);
      return { success: false, message: `메모 조회 실패: ${error.message}` };
    }

    return { success: true, message: '조회 완료', data: notes || [] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}
