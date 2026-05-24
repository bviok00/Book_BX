-- 보안 경고(Security Definer View) 해결을 위한 뷰 재생성 스크립트
-- 뷰를 조회하는 사용자의 RLS 권한을 따르도록 security_invoker 옵션을 켭니다.
-- 이전 스크립트에서 일부 컬럼(summary_note 등)이 누락되어 발생한 오류를 수정했습니다.

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
