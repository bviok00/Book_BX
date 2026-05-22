'use server';
// 대시보드 Server Actions — 폴더 CRUD, 도서 CRUD, 독서 세션 기록
// 표준 응답 패턴: { success, message, data? }
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResponse, BookStatus } from '@/types';

// ── 폴더 CRUD ──
export async function createFolder(name: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '인증이 필요합니다.' };

    const { error } = await supabase.from('folders').insert({
      user_id: user.id,
      name,
    });

    if (error) return { success: false, message: `폴더 생성 실패: ${error.message}` };

    revalidatePath('/dashboard');
    revalidatePath('/profile');
    return { success: true, message: '폴더가 생성되었습니다.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message: msg };
  }
}

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
  rating: number
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
  pageReference?: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: '인증이 필요합니다.' };

    const { error } = await supabase.from('granular_notes').insert({
      user_book_id: userBookId,
      user_id: user.id,
      chapter_id: chapterId || null,
      content,
      page_reference: pageReference || null,
    });

    if (error) return { success: false, message: `메모 저장 실패: ${error.message}` };

    revalidatePath('/dashboard');
    revalidatePath('/profile');
    return { success: true, message: '메모가 저장되었습니다.' };
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
