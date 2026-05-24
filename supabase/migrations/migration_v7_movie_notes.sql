-- ============================================================
-- Intellect_BX — DB Schema v7.0 (영화 마이크로 메모 지원)
-- ============================================================

-- granular_notes 테이블 수정
ALTER TABLE public.granular_notes
ALTER COLUMN user_book_id DROP NOT NULL;

ALTER TABLE public.granular_notes
ADD COLUMN user_movie_id UUID REFERENCES public.user_movies(id) ON DELETE CASCADE;

-- 도서 ID와 영화 ID 중 하나만 존재해야 한다는 제약조건
ALTER TABLE public.granular_notes
ADD CONSTRAINT chk_granular_notes_media 
CHECK (
  (user_book_id IS NOT NULL AND user_movie_id IS NULL) OR
  (user_book_id IS NULL AND user_movie_id IS NOT NULL)
);

-- RLS 정책 검토: 기존 정책은 "USING (auth.uid() = user_id);" 로 유저 식별 기반이므로 영화에도 그대로 적용됩니다.
