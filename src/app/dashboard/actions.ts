'use server';
// 대시보드 Server Actions — 폴더 CRUD, 도서 CRUD, 독서 세션 기록
// 표준 응답 패턴: { success, message, data? }
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResponse, BookStatus } from '@/types';

// ── 폴더 CRUD ──

export async function deleteFolder(folderId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('folders').delete().eq('id', folderId);
    if (error) return { success: false, message: `폴더 삭제 실패: ${error.message}` };

    revalidatePath('/dashboard');
    revalidatePath('/profile');
    return { success: true, message: '폴더가 삭제되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

export async function updateFolder(folderId: string, name: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '인증이 필요합니다.' };

    const { error } = await supabase
      .from('folders')
      .update({ name })
      .eq('id', folderId)
      .eq('user_id', user.id);

    if (error) return { success: false, message: `폴더 수정 실패: ${error.message}` };

    revalidatePath('/dashboard');
    return { success: true, message: '폴더 이름이 변경되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── 도서 상태 변경 ──
export async function updateBookStatus(
  userBookId: string,
  status: BookStatus
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = { status };

    // 상태 변경 시 타임스탬프 자동 관리
    if (status === 'READING') {
      updateData.started_at = new Date().toISOString();
    } else if (status === 'COMPLETED') {
      updateData.finished_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('user_books')
      .update(updateData)
      .eq('id', userBookId);

    if (error) return { success: false, message: `상태 변경 실패: ${error.message}` };

    revalidatePath('/dashboard');
    revalidatePath('/profile');
    return { success: true, message: '독서 상태가 변경되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── 도서 평점 업데이트 ──
export async function updateBookRating(
  userBookId: string,
  rating: number | null
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('user_books')
      .update({ rating })
      .eq('id', userBookId);

    if (error) return { success: false, message: `평점 저장 실패: ${error.message}` };

    revalidatePath('/dashboard');
    revalidatePath('/profile');
    return { success: true, message: '평점이 저장되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── 도서 서재에 추가 (알라딘 검색 결과 → user_books INSERT) ──
export async function addBookToLibrary(
  isbn: string,
  bookData: {
    title: string;
    author: string;
    publisher: string;
    cover_url: string;
    category: string;
    aladin_toc?: unknown;
  },
  folderId?: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '인증이 필요합니다.' };

    // 1. books 마스터 테이블에 캐싱 (이미 존재하면 무시)
    const { error: bookError } = await supabase.from('books').upsert(
      {
        isbn,
        title: bookData.title,
        author: bookData.author,
        publisher: bookData.publisher,
        cover_url: bookData.cover_url,
        category: bookData.category,
        aladin_toc: bookData.aladin_toc || null,
      },
      { onConflict: 'isbn' }
    );

    if (bookError) {
      console.error('Book upsert error:', bookError);
      return { success: false, message: `도서 마스터 정보 등록 실패: ${bookError.message}. Supabase RLS 정책을 확인해주세요.` };
    }

    // 2. user_books에 추가
    const { error } = await supabase.from('user_books').insert({
      user_id: user.id,
      isbn,
      folder_id: folderId || null,
      status: 'WANT_TO_READ',
    });

    if (error) {
      if (error.code === '23505') {
        return { success: false, message: '이미 서재에 추가된 도서입니다.' };
      }
      return { success: false, message: `도서 추가 실패: ${error.message}` };
    }

    revalidatePath('/dashboard');
    revalidatePath('/profile');
    return { success: true, message: '서재에 추가되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── 독서 세션 기록 (포커스 모드 종료 시) ──
export async function recordReadingSession(
  userBookId: string,
  durationMin: number
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '인증이 필요합니다.' };

    const { error } = await supabase.from('reading_sessions').insert({
      user_book_id: userBookId,
      user_id: user.id,
      duration_min: durationMin,
    });

    if (error) return { success: false, message: `세션 기록 실패: ${error.message}` };

    revalidatePath('/dashboard');
    revalidatePath('/profile');
    return { success: true, message: `${durationMin}분 독서 기록이 저장되었습니다.` };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── 마이크로 메모 저장 ──
export async function createNote(
  userBookId: string,
  content: string,
  chapterId?: string,
  pageReference?: string,
  tags?: string[]
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '인증이 필요합니다.' };

    const { data: noteData, error } = await supabase.from('granular_notes').insert({
      user_book_id: userBookId,
      user_id: user.id,
      chapter_id: chapterId || null,
      content,
      page_reference: pageReference || null,
    }).select().single();

    if (error) return { success: false, message: `메모 저장 실패: ${error.message}` };

    if (tags && tags.length > 0 && noteData) {
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
            // Unique violation fallback
            const { data: fallbackTag } = await supabase.from('tags').select('id').eq('user_id', user.id).eq('name', tName).single();
            if (fallbackTag) tagId = fallbackTag.id;
          }
        }
        
        if (tagId) {
          await supabase.from('note_tags').insert({
            note_id: noteData.id,
            tag_id: tagId,
          }); // ignore duplicates
          
          await supabase.from('book_tags').insert({
            user_book_id: userBookId,
            tag_id: tagId,
          }); // ignore duplicates
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

// ── 마이크로 메모 수정 ──
export async function updateNote(
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

    // 태그 업데이트 로직은 복잡도를 줄이기 위해 생략하거나 기존 태그를 지우고 새로 추가할 수 있습니다.
    // 여기서는 간단히 메모 내용(content) 수정에 집중하고 태그는 기존 유지 또는 삭제+재생성을 합니다.
    if (tags !== undefined) {
      // 기존 태그 연결 삭제
      await supabase.from('note_tags').delete().eq('note_id', noteId);
      
      // 새 태그 연결
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

// ── 마이크로 메모 삭제 ──
export async function deleteNote(noteId: string): Promise<ActionResponse> {
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

// ── 도서 다이렉트 태그 추가 ──
export async function addBookTags(
  userBookId: string,
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
          // Unique violation fallback
          const { data: fallbackTag } = await supabase.from('tags').select('id').eq('user_id', user.id).eq('name', tName).single();
          if (fallbackTag) tagId = fallbackTag.id;
        }
      }
      
      if (tagId) {
        await supabase.from('book_tags').insert({
          user_book_id: userBookId,
          tag_id: tagId,
        }); // ignore duplicates
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/profile');
    return { success: true, message: '도서에 태그가 추가되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── Summary Note 저장 ──
export async function updateSummaryNote(
  userBookId: string,
  summaryNote: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('user_books')
      .update({ summary_note: summaryNote })
      .eq('id', userBookId);

    if (error) return { success: false, message: `총평 저장 실패: ${error.message}` };

    revalidatePath('/dashboard');
    revalidatePath('/profile');
    return { success: true, message: '총평이 저장되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

// ── 유저 태그 목록 가져오기 ──
export async function getUserTags() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: [] };

    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return { success: true, data: tags };
  } catch (error) {
    console.error('Error fetching tags:', error);
    return { success: false, data: [] };
  }
}

// ── 폴더 관련 액션 ──
export async function createFolder(name: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '인증이 필요합니다.' };

    const { data: maxFolder } = await supabase
      .from('folders')
      .select('sort_order')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();
      
    const nextOrder = maxFolder ? (maxFolder.sort_order || 0) + 1 : 1;

    const { error } = await supabase.from('folders').insert({
      user_id: user.id,
      name,
      sort_order: nextOrder,
    });

    if (error) return { success: false, message: `폴더 생성 실패: ${error.message}` };

    revalidatePath('/dashboard');
    return { success: true, message: '폴더가 생성되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

export async function updateBookFolder(userBookId: string, folderId: string | null): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '인증이 필요합니다.' };

    const { error } = await supabase.from('user_books').update({ folder_id: folderId }).eq('id', userBookId).eq('user_id', user.id);
    if (error) return { success: false, message: `폴더 이동 실패: ${error.message}` };

    revalidatePath('/dashboard');
    return { success: true, message: '폴더를 이동했습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

export async function updateFolderOrder(updates: { id: string, sort_order: number }[]): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '인증이 필요합니다.' };

    // Supabase JS SDK doesn't natively support bulk updates easily except with upsert
    // But since these belong to the user, we can do multiple updates or upsert
    for (const update of updates) {
      await supabase.from('folders').update({ sort_order: update.sort_order }).eq('id', update.id).eq('user_id', user.id);
    }

    revalidatePath('/dashboard');
    return { success: true, message: '폴더 순서가 저장되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}
