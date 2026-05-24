'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from '@/types';

export async function createLoungePost(data: {
  title: string;
  content: string;
  mediaType?: 'BOOK' | 'MOVIE' | 'ANIME';
  mediaId?: string;
  posterUrl?: string;
  contentTitle?: string;
  rating?: number;
}): Promise<ActionResponse<string>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '인증이 필요합니다.' };

    const { data: post, error } = await supabase.from('lounge_posts').insert({
      user_id: user.id,
      title: data.title,
      content: data.content,
      media_type: data.mediaType || null,
      media_id: data.mediaId || null,
      poster_url: data.posterUrl || null,
      content_title: data.contentTitle || null,
      rating: data.rating !== undefined ? data.rating : null
    }).select('id').single();

    if (error) throw error;

    revalidatePath('/dashboard/lounge');
    return { success: true, message: '게시글이 등록되었습니다.', data: post.id };
  } catch (error: any) {
    return { success: false, message: error.message || '게시글 등록에 실패했습니다.' };
  }
}

export async function getLoungePosts(limit = 20): Promise<ActionResponse<any[]>> {
  try {
    const supabase = await createClient();
    
    const { data: posts, error } = await supabase
      .from('lounge_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    if (!posts || posts.length === 0) return { success: true, message: '조회 완료', data: [] };

    // Fetch profiles manually
    const userIds = Array.from(new Set(posts.map(p => p.user_id)));
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, email')
      .in('id', userIds);

    const profileMap = new Map();
    if (profiles) {
      profiles.forEach(p => profileMap.set(p.id, p));
    }

    const postsWithProfiles = posts.map(post => ({
      ...post,
      profiles: profileMap.get(post.user_id) || null
    }));

    return { success: true, message: '조회 완료', data: postsWithProfiles };
  } catch (error: any) {
    return { success: false, message: error.message || '게시글 조회에 실패했습니다.' };
  }
}

export async function getLoungePost(id: string): Promise<ActionResponse<any>> {
  try {
    console.log('[DEBUG] getLoungePost called with id:', id);
    const supabase = await createClient();
    
    const { data: post, error } = await supabase
      .from('lounge_posts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('getLoungePost error from supabase:', JSON.stringify(error));
      throw error;
    }

    if (!post) return { success: false, message: '게시글이 없습니다.' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, email')
      .eq('id', post.user_id)
      .single();

    post.profiles = profile || null;

    return { success: true, message: '조회 완료', data: post };
  } catch (error: any) {
    console.error('getLoungePost caught error:', error);
    return { success: false, message: error.message || '게시글 상세 조회에 실패했습니다.' };
  }
}

export async function getMyLibraryItems(): Promise<ActionResponse<any[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '인증이 필요합니다.' };

    const [bookRes, movieRes, animeRes] = await Promise.all([
      supabase.from('user_books').select('id, rating, books(title, cover_url)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('user_movies').select('id, rating, movies(title, poster_url)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('user_animes').select('id, rating, animes(title, poster_url)').eq('user_id', user.id).order('created_at', { ascending: false })
    ]);

    const items: any[] = [];
    
    if (bookRes.data) {
      bookRes.data.forEach(b => items.push({
        id: b.id,
        type: 'BOOK',
        title: b.books?.title || '제목 없음',
        posterUrl: b.books?.cover_url || '',
        rating: b.rating
      }));
    }
    if (movieRes.data) {
      movieRes.data.forEach(m => items.push({
        id: m.id,
        type: 'MOVIE',
        title: m.movies?.title || '제목 없음',
        posterUrl: m.movies?.poster_url || '',
        rating: m.rating
      }));
    }
    if (animeRes.data) {
      animeRes.data.forEach(a => items.push({
        id: a.id,
        type: 'ANIME',
        title: a.animes?.title || '제목 없음',
        posterUrl: a.animes?.poster_url || '',
        rating: a.rating
      }));
    }

    return { success: true, message: '조회 완료', data: items };
  } catch (error: any) {
    return { success: false, message: error.message || '라이브러리 조회에 실패했습니다.' };
  }
}

export async function deleteLoungePost(id: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '인증이 필요합니다.' };

    const { error } = await supabase
      .from('lounge_posts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath('/dashboard/lounge');
    return { success: true, message: '게시글이 삭제되었습니다.' };
  } catch (error: any) {
    return { success: false, message: error.message || '삭제에 실패했습니다.' };
  }
}

export async function updateLoungePost(
  id: string,
  data: {
    title: string;
    content: string;
    mediaType?: 'BOOK' | 'MOVIE' | 'ANIME';
    mediaId?: string;
    posterUrl?: string;
    contentTitle?: string;
    rating?: number;
  }
): Promise<ActionResponse<string>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '인증이 필요합니다.' };

    const { error } = await supabase
      .from('lounge_posts')
      .update({
        title: data.title,
        content: data.content,
        media_type: data.mediaType || null,
        media_id: data.mediaId || null,
        poster_url: data.posterUrl || null,
        content_title: data.contentTitle || null,
        rating: data.rating !== undefined ? data.rating : null
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath(`/dashboard/lounge/${id}`);
    revalidatePath('/dashboard/lounge');
    return { success: true, message: '게시글이 수정되었습니다.', data: id };
  } catch (error: any) {
    return { success: false, message: error.message || '수정에 실패했습니다.' };
  }
}
