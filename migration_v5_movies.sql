-- ============================================================
-- Intellect_BX — DB Schema v5.0 (영화 확장)
-- 기존 books/user_books 무변경 + movies/user_movies 신규 추가
-- ============================================================

-- ──────────────────────────────────────────
-- 11. MOVIES (마스터 영화 테이블 — TMDB API 캐싱 풀, 전역 공유)
-- ──────────────────────────────────────────
CREATE TABLE public.movies (
    tmdb_id         INTEGER     PRIMARY KEY,
    title           TEXT        NOT NULL,
    original_title  TEXT,
    director        TEXT,
    poster_url      TEXT,
    backdrop_url    TEXT,
    genre           TEXT,                       -- 장르 (레이더 차트 집계용, 쉼표 구분)
    release_date    TEXT,                       -- "2026-01-15" 형식
    runtime_min     INTEGER,                    -- 러닝타임 (분)
    overview        TEXT,                       -- 줄거리 요약
    -- 미디어별 특수 데이터를 유연하게 담는 JSONB 컬럼
    -- 예시: { "cast": ["배우A","배우B"], "production_company": "A24", "vote_average": 8.2 }
    metadata        JSONB       DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- movies 테이블도 전역 캐시 풀 — 인증된 유저 전원 읽기 허용
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "인증 유저 영화 조회" ON public.movies
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "서버만 영화 삽입" ON public.movies
    FOR INSERT WITH CHECK (auth.role() = 'service_role');
-- ★ 일반 유저도 영화 추가 가능하도록 정책 추가 (addMovieToLibrary에서 필요)
CREATE POLICY "인증 유저 영화 삽입" ON public.movies
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "인증 유저 영화 업데이트" ON public.movies
    FOR UPDATE USING (auth.role() = 'authenticated');


-- ──────────────────────────────────────────
-- 12. USER_MOVIES (내 영화관 — 유저×영화 관계 + 시청 메타)
-- ──────────────────────────────────────────
CREATE TABLE public.user_movies (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    tmdb_id         INTEGER     REFERENCES public.movies(tmdb_id) ON DELETE RESTRICT NOT NULL,
    folder_id       UUID        REFERENCES public.folders(id) ON DELETE SET NULL,

    -- 4-State Machine (영화 버전)
    status          TEXT        NOT NULL DEFAULT 'WANT_TO_WATCH'
                    CHECK (status IN ('WANT_TO_WATCH', 'WATCHING', 'COMPLETED', 'DROPPED')),

    -- 시청 진행도 (0~100%)
    progress_pct    INTEGER     DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),

    -- 평점 및 총평
    rating          INTEGER     CHECK (rating >= 1 AND rating <= 5),
    summary_note    TEXT,

    -- 개인화 색상 (포스터 dominant color 캐싱)
    dominant_color  TEXT,

    -- 폴더 내 정렬 순서
    sort_order      INTEGER     DEFAULT 0,

    -- 타임스탬프
    started_at      TIMESTAMPTZ,
    finished_at     TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, tmdb_id)
);

ALTER TABLE public.user_movies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 영화관만 접근" ON public.user_movies
    USING (auth.uid() = user_id);

-- updated_at 자동 갱신 트리거 (기존 함수 재사용)
CREATE TRIGGER trg_user_movies_updated_at
    BEFORE UPDATE ON public.user_movies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ──────────────────────────────────────────
-- 13. MOVIE_TAGS (영화↔태그 N:M 릴레이션 — 그래프 간선)
-- ──────────────────────────────────────────
CREATE TABLE public.movie_tags (
    user_movie_id   UUID    REFERENCES public.user_movies(id) ON DELETE CASCADE NOT NULL,
    tag_id          UUID    REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (user_movie_id, tag_id)
);

ALTER TABLE public.movie_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 영화태그만 접근" ON public.movie_tags
    USING (
        EXISTS (
            SELECT 1 FROM public.user_movies um
            WHERE um.id = user_movie_id AND um.user_id = auth.uid()
        )
    );


-- ──────────────────────────────────────────
-- 14. CONTENTS_VIEW (도서+영화 통합 뷰 — 갤러리/검색용)
-- ──────────────────────────────────────────
-- ★ 이 뷰는 DashboardClient가 타입별 필터링을 할 때 사용하는 읽기 전용 뷰
CREATE OR REPLACE VIEW public.contents_view WITH (security_invoker = on) AS
SELECT
    ub.id,
    ub.user_id,
    'BOOK'::TEXT            AS content_type,
    b.isbn                  AS content_id,      -- 도서: isbn, 영화: tmdb_id (TEXT 통일)
    b.title,
    b.author                AS creator,          -- 도서: author, 영화: director
    b.cover_url             AS poster_url,
    b.category              AS genre,
    ub.status,
    ub.rating,
    ub.summary_note,
    ub.dominant_color,
    ub.folder_id,
    ub.sort_order,
    ub.started_at,
    ub.finished_at,
    ub.created_at,
    ub.updated_at,
    NULL::INTEGER           AS progress_pct,
    NULL::INTEGER           AS runtime_min,
    NULL::TEXT              AS backdrop_url
FROM public.user_books ub
JOIN public.books b ON b.isbn = ub.isbn

UNION ALL

SELECT
    um.id,
    um.user_id,
    'MOVIE'::TEXT           AS content_type,
    um.tmdb_id::TEXT        AS content_id,
    m.title,
    m.director              AS creator,
    m.poster_url,
    m.genre,
    um.status,
    um.rating,
    um.summary_note,
    um.dominant_color,
    um.folder_id,
    um.sort_order,
    um.started_at,
    um.finished_at,
    um.created_at,
    um.updated_at,
    um.progress_pct,
    m.runtime_min,
    m.backdrop_url
FROM public.user_movies um
JOIN public.movies m ON m.tmdb_id = um.tmdb_id;
