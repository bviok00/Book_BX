-- ============================================================
-- Intellect_BX — DB Schema v7.0 (애니메이션 확장)
-- animes, user_animes, anime_tags 신규 추가 및 contents_view 통합
-- ============================================================

-- ──────────────────────────────────────────
-- 15. ANIMES (마스터 애니메이션 테이블 — AniList API 캐싱 풀)
-- ──────────────────────────────────────────
CREATE TABLE public.animes (
    anilist_id      INTEGER     PRIMARY KEY,
    title           TEXT        NOT NULL,
    original_title  TEXT,
    director        TEXT,                       -- AniList의 staff 중 Director
    poster_url      TEXT,
    backdrop_url    TEXT,
    genre           TEXT,                       -- 장르 (쉼표 구분)
    release_date    TEXT,                       -- 방영 시작 연도/날짜
    runtime_min     INTEGER,                    -- 에피소드 당 러닝타임(분)
    overview        TEXT,                       -- 줄거리 요약
    metadata        JSONB       DEFAULT '{}',   -- { "episodes": 24, "season": "FALL", "averageScore": 85 } 등
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.animes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "인증 유저 애니메이션 조회" ON public.animes
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "서버만 애니메이션 삽입" ON public.animes
    FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "인증 유저 애니메이션 삽입" ON public.animes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "인증 유저 애니메이션 업데이트" ON public.animes
    FOR UPDATE USING (auth.role() = 'authenticated');


-- ──────────────────────────────────────────
-- 16. USER_ANIMES (내 애니관 — 유저×애니 관계 + 시청 메타)
-- ──────────────────────────────────────────
CREATE TABLE public.user_animes (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    anilist_id      INTEGER     REFERENCES public.animes(anilist_id) ON DELETE RESTRICT NOT NULL,
    folder_id       UUID        REFERENCES public.folders(id) ON DELETE SET NULL,

    -- 4-State Machine (애니 버전)
    status          TEXT        NOT NULL DEFAULT 'WANT_TO_WATCH'
                    CHECK (status IN ('WANT_TO_WATCH', 'WATCHING', 'COMPLETED', 'DROPPED')),

    -- 시청 진행도 (0~100% 또는 에피소드 수 기반)
    progress_pct    INTEGER     DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),

    -- 평점 및 총평
    rating          INTEGER     CHECK (rating >= 1 AND rating <= 5),
    summary_note    TEXT,

    -- 개인화 색상
    dominant_color  TEXT,

    -- 폴더 내 정렬 순서
    sort_order      INTEGER     DEFAULT 0,

    -- 타임스탬프
    started_at      TIMESTAMPTZ,
    finished_at     TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, anilist_id)
);

ALTER TABLE public.user_animes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 애니관만 접근" ON public.user_animes
    USING (auth.uid() = user_id);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER trg_user_animes_updated_at
    BEFORE UPDATE ON public.user_animes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ──────────────────────────────────────────
-- 17. ANIME_TAGS (애니↔태그 N:M 릴레이션 — 그래프 간선)
-- ──────────────────────────────────────────
CREATE TABLE public.anime_tags (
    user_anime_id   UUID    REFERENCES public.user_animes(id) ON DELETE CASCADE NOT NULL,
    tag_id          UUID    REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (user_anime_id, tag_id)
);

ALTER TABLE public.anime_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 애니태그만 접근" ON public.anime_tags
    USING (
        EXISTS (
            SELECT 1 FROM public.user_animes ua
            WHERE ua.id = user_anime_id AND ua.user_id = auth.uid()
        )
    );


-- ──────────────────────────────────────────
-- 18. CONTENTS_VIEW (도서+영화+애니 통합 뷰 — 갤러리/검색용) 재생성
-- ──────────────────────────────────────────
DROP VIEW IF EXISTS public.contents_view;

CREATE OR REPLACE VIEW public.contents_view WITH (security_invoker = on) AS
SELECT
    ub.id,
    ub.user_id,
    'BOOK'::TEXT            AS content_type,
    b.isbn                  AS content_id,
    b.title,
    b.author                AS creator,
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
JOIN public.movies m ON m.tmdb_id = um.tmdb_id

UNION ALL

SELECT
    ua.id,
    ua.user_id,
    'ANIME'::TEXT           AS content_type,
    ua.anilist_id::TEXT     AS content_id,
    a.title,
    a.director              AS creator,
    a.poster_url,
    a.genre,
    ua.status,
    ua.rating,
    ua.summary_note,
    ua.dominant_color,
    ua.folder_id,
    ua.sort_order,
    ua.started_at,
    ua.finished_at,
    ua.created_at,
    ua.updated_at,
    ua.progress_pct,
    a.runtime_min,
    a.backdrop_url
FROM public.user_animes ua
JOIN public.animes a ON a.anilist_id = ua.anilist_id;
