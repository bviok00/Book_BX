-- ============================================================
-- Intellect_BX — DB Schema v4.0
-- Supabase PostgreSQL + RLS
-- ============================================================

-- ──────────────────────────────────────────
-- 1. PROFILES (유저 프로필 — Supabase Auth 연동)
-- ──────────────────────────────────────────
CREATE TABLE public.profiles (
    id              UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email           TEXT        NOT NULL,
    display_name    TEXT,
    avatar_url      TEXT,
    -- 연간 독서 목표
    yearly_goal     INTEGER     DEFAULT 0,
    -- Obsidian 공유 토큰 (전체 서재 공개 URL용)
    share_token     TEXT        UNIQUE,
    is_public       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 프로필만 접근" ON public.profiles
    USING (auth.uid() = id);
-- 공유 URL: share_token으로 공개 프로필 읽기 허용
CREATE POLICY "공유 토큰으로 공개 프로필 조회" ON public.profiles
    FOR SELECT USING (is_public = TRUE AND share_token IS NOT NULL);


-- ──────────────────────────────────────────
-- 2. FOLDERS (컨텍스트 폴더 트리 — 프로젝트 단위)
-- ──────────────────────────────────────────
CREATE TABLE public.folders (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name        TEXT        NOT NULL,
    sort_order  INTEGER     DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 폴더만 접근" ON public.folders
    USING (auth.uid() = user_id);


-- ──────────────────────────────────────────
-- 3. BOOKS (마스터 도서 테이블 — 알라딘 API 캐싱 풀, 전역 공유)
-- ──────────────────────────────────────────
CREATE TABLE public.books (
    isbn        TEXT        PRIMARY KEY,
    title       TEXT        NOT NULL,
    author      TEXT,
    publisher   TEXT,
    cover_url   TEXT        NOT NULL,
    category    TEXT,                       -- 알라딘 카테고리 (레이더 차트 집계용)
    -- ★ TEXT → JSONB 교체: depth/title/page 구조화 파싱 지원
    aladin_toc  JSONB,                      -- [{"depth":1,"title":"1장","page":12}, ...]
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
-- books 테이블은 전역 캐시 풀 — 인증된 유저 전원 읽기 허용
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "인증 유저 도서 조회" ON public.books
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "서버만 도서 삽입" ON public.books
    FOR INSERT WITH CHECK (auth.role() = 'service_role');


-- ──────────────────────────────────────────
-- 4. USER_BOOKS (내 서재 — 유저×도서 관계 + 독서 메타)
-- ──────────────────────────────────────────
CREATE TABLE public.user_books (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    isbn        TEXT        REFERENCES public.books(isbn) ON DELETE RESTRICT NOT NULL,
    folder_id   UUID        REFERENCES public.folders(id) ON DELETE SET NULL,

    -- 4-State Machine
    status      TEXT        NOT NULL DEFAULT 'WANT_TO_READ'
                CHECK (status IN ('WANT_TO_READ', 'READING', 'COMPLETED', 'DROPPED')),

    -- 평점 및 총평
    rating          INTEGER     CHECK (rating >= 1 AND rating <= 5),
    summary_note    TEXT,                   -- 단일 총평 (Summary 1개)

    -- 개인화 색상 (color-thief dominant color 캐싱)
    dominant_color  TEXT,                   -- 예: "#e8c547"

    -- 폴더 내 정렬 순서 (드래그 재정렬 지원)
    sort_order      INTEGER     DEFAULT 0,

    -- 타임스탬프
    started_at      TIMESTAMPTZ,
    finished_at     TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, isbn)
);

ALTER TABLE public.user_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 서재만 접근" ON public.user_books
    USING (auth.uid() = user_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_books_updated_at
    BEFORE UPDATE ON public.user_books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ──────────────────────────────────────────
-- 5. READING_SESSIONS (독서 세션 로그 — 히트맵 & 포커스 모드 기반)
-- ──────────────────────────────────────────
-- ★ updated_at 기반 히트맵의 데이터 오염 방지용 전용 테이블
CREATE TABLE public.reading_sessions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_book_id    UUID        REFERENCES public.user_books(id) ON DELETE CASCADE NOT NULL,
    user_id         UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    session_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
    duration_min    INTEGER     DEFAULT 0,  -- 포커스 모드 세션 시간(분)
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 세션만 접근" ON public.reading_sessions
    USING (auth.uid() = user_id);

-- 히트맵 쿼리 최적화 인덱스
CREATE INDEX idx_reading_sessions_user_date
    ON public.reading_sessions(user_id, session_date);


-- ──────────────────────────────────────────
-- 6. CHAPTERS (목차 구조 — 알라딘 TOC 파싱 or 수동 입력 폴백)
-- ──────────────────────────────────────────
CREATE TABLE public.chapters (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_book_id    UUID        REFERENCES public.user_books(id) ON DELETE CASCADE NOT NULL,
    title           TEXT        NOT NULL,
    sort_order      INTEGER     DEFAULT 0,
    -- 알라딘 TOC에서 자동 생성된 챕터인지 식별
    is_auto         BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 챕터만 접근" ON public.chapters
    USING (
        EXISTS (
            SELECT 1 FROM public.user_books ub
            WHERE ub.id = user_book_id AND ub.user_id = auth.uid()
        )
    );


-- ──────────────────────────────────────────
-- 7. GRANULAR_NOTES (마이크로 메모 — 챕터/페이지별 지식 조각)
-- ──────────────────────────────────────────
CREATE TABLE public.granular_notes (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_book_id    UUID        REFERENCES public.user_books(id) ON DELETE CASCADE NOT NULL,
    -- ★ RLS 성능 최적화: JOIN 없이 직접 유저 식별
    user_id         UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    chapter_id      UUID        REFERENCES public.chapters(id) ON DELETE SET NULL,  -- 선택적 바인딩
    content         TEXT        NOT NULL,
    page_reference  TEXT,                   -- 예: "p.142" 수동 입력
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.granular_notes ENABLE ROW LEVEL SECURITY;
-- ★ user_id 직접 참조로 JOIN 제거 → RLS 성능 향상
CREATE POLICY "본인 메모만 접근" ON public.granular_notes
    USING (auth.uid() = user_id);

CREATE TRIGGER trg_granular_notes_updated_at
    BEFORE UPDATE ON public.granular_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ──────────────────────────────────────────
-- 8. TAGS (개념 지식 태그 — 옵시디언 그래프 노드)
-- ──────────────────────────────────────────
-- 폴더(컨텍스트)와 완전 분리: 태그 = 지식 원소 개념
CREATE TABLE public.tags (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name        TEXT        NOT NULL,       -- 예: "행동경제학", "도파민", "리스크관리"
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 태그만 접근" ON public.tags
    USING (auth.uid() = user_id);


-- ──────────────────────────────────────────
-- 9. BOOK_TAGS (책↔태그 N:M 릴레이션 — 그래프 간선)
-- ──────────────────────────────────────────
-- ★ 누락 보완: 메모 없는 책도 그래프 노드 연결 가능하도록
CREATE TABLE public.book_tags (
    user_book_id    UUID    REFERENCES public.user_books(id) ON DELETE CASCADE NOT NULL,
    tag_id          UUID    REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (user_book_id, tag_id)
);

ALTER TABLE public.book_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 책태그만 접근" ON public.book_tags
    USING (
        EXISTS (
            SELECT 1 FROM public.user_books ub
            WHERE ub.id = user_book_id AND ub.user_id = auth.uid()
        )
    );


-- ──────────────────────────────────────────
-- 10. NOTE_TAGS (메모↔태그 N:M 릴레이션 — 그래프 간선)
-- ──────────────────────────────────────────
CREATE TABLE public.note_tags (
    note_id UUID    REFERENCES public.granular_notes(id) ON DELETE CASCADE NOT NULL,
    tag_id  UUID    REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (note_id, tag_id)
);

ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 메모태그만 접근" ON public.note_tags
    USING (
        EXISTS (
            SELECT 1 FROM public.granular_notes gn
            JOIN public.user_books ub ON ub.id = gn.user_book_id
            WHERE gn.id = note_id AND ub.user_id = auth.uid()
        )
    );


-- ============================================================
-- 📊 주요 쿼리 레퍼런스
-- ============================================================

-- [히트맵] 유저의 연간 독서 활동 집계
-- SELECT session_date, SUM(duration_min) as total_min, COUNT(*) as session_count
-- FROM public.reading_sessions
-- WHERE user_id = $1 AND session_date >= NOW() - INTERVAL '1 year'
-- GROUP BY session_date ORDER BY session_date;

-- [레이더 차트] 완독 도서 카테고리 비중
-- SELECT b.category, COUNT(*) as count
-- FROM public.user_books ub
-- JOIN public.books b ON b.isbn = ub.isbn
-- WHERE ub.user_id = $1 AND ub.status = 'COMPLETED'
-- GROUP BY b.category;

-- [그래프] 태그별 연결 도서 목록 (노드 클릭 필터링)
-- SELECT ub.id, b.title, b.cover_url
-- FROM public.book_tags bt
-- JOIN public.user_books ub ON ub.id = bt.user_book_id
-- JOIN public.books b ON b.isbn = ub.isbn
-- WHERE bt.tag_id = $1 AND ub.user_id = $2;

-- [Spaced Repetition] 오늘의 지식 회상 메모 1개 추출
-- SELECT gn.*, b.title, b.cover_url
-- FROM public.granular_notes gn
-- JOIN public.user_books ub ON ub.id = gn.user_book_id
-- JOIN public.books b ON b.isbn = ub.isbn
-- WHERE ub.user_id = $1
--   AND gn.updated_at < NOW() - INTERVAL '30 days'
-- ORDER BY RANDOM() LIMIT 1;