// schema.sql 기반 전체 DB 테이블 타입 정의 (ZONE E — 명부실)

// ── 독서 상태 4-State Machine ──
export type BookStatus = 'WANT_TO_READ' | 'READING' | 'COMPLETED' | 'DROPPED';

// ── 1. 유저 프로필 ──
export interface Profile {
  id: string;                    // UUID (auth.users FK)
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  yearly_goal: number;           // 연간 독서 목표 권수
  share_token: string | null;    // 공유 URL 해시 토큰
  is_public: boolean;
  created_at: string;
}

// ── 2. 컨텍스트 폴더 ──
export interface Folder {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  media_type: 'BOOK' | 'MOVIE' | 'ANIME';
  created_at: string;
}

// ── 3. 마스터 도서 (알라딘 API 캐싱 풀) ──
export interface AladinTocItem {
  depth: number;
  title: string;
  page?: number;
}

export interface Book {
  isbn: string;                  // PK
  title: string;
  author: string | null;
  publisher: string | null;
  cover_url: string;
  category: string | null;       // 레이더 차트 집계용
  aladin_toc: AladinTocItem[] | null;  // JSONB — 목차 구조
  created_at: string;
}

// ── 4. 내 서재 (유저×도서 관계) ──
export interface UserBook {
  id: string;
  user_id: string;
  isbn: string;
  folder_id: string | null;
  status: BookStatus;
  rating: number | null;         // 1~5
  summary_note: string | null;   // 단일 총평
  dominant_color: string | null; // 예: "#e8c547"
  sort_order: number;            // 폴더 내 정렬 순서
  started_at: string | null;
  finished_at: string | null;
  updated_at: string;
  created_at: string;
}

// ── 5. 독서 세션 로그 (히트맵 & 포커스 모드) ──
export interface ReadingSession {
  id: string;
  user_book_id: string;
  user_id: string;
  session_date: string;          // DATE 형식
  duration_min: number;
  created_at: string;
}

// ── 6. 챕터 (목차 구조) ──
export interface Chapter {
  id: string;
  user_book_id: string;
  title: string;
  sort_order: number;
  is_auto: boolean;              // 알라딘 TOC 자동 생성 여부
  created_at: string;
}

// ── 7. 마이크로 메모 ──
export interface GranularNote {
  id: string;
  user_book_id: string;
  user_id: string;               // ★ RLS 성능 최적화용
  chapter_id: string | null;
  content: string;
  page_reference: string | null; // 예: "p.142"
  created_at: string;
  updated_at: string;
}

// ── 8. 개념 태그 ──
export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

// ── 9. 책↔태그 관계 ──
export interface BookTag {
  user_book_id: string;
  tag_id: string;
}

// ── 10. 메모↔태그 관계 ──
export interface NoteTag {
  note_id: string;
  tag_id: string;
}

// ── 콘텐츠 유형 구분자 ──
export type ContentType = 'BOOK' | 'MOVIE' | 'ANIME';

// ── 영화 상태 4-State Machine ──
export type MovieStatus = 'WANT_TO_WATCH' | 'WATCHING' | 'COMPLETED' | 'DROPPED';

// ── 11. 마스터 영화 (TMDB API 캐싱 풀) ──
export interface Movie {
  tmdb_id: number;               // PK (TMDB 고유 ID)
  title: string;
  original_title: string | null;
  director: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  genre: string | null;          // 쉼표 구분 장르 문자열
  release_date: string | null;   // "2026-01-15" 형식
  runtime_min: number | null;    // 러닝타임 (분)
  overview: string | null;
  // 예시: { "cast": ["배우A","배우B"], "vote_average": 8.2 }
  metadata: Record<string, unknown>;
  created_at: string;
}

// ── 12. 내 영화관 (유저×영화 관계) ──
export interface UserMovie {
  id: string;
  user_id: string;
  tmdb_id: number;
  folder_id: string | null;
  status: MovieStatus;
  progress_pct: number;          // 시청 진행도 0~100
  rating: number | null;         // 1~5
  summary_note: string | null;
  dominant_color: string | null;
  sort_order: number;
  started_at: string | null;
  finished_at: string | null;
  updated_at: string;
  created_at: string;
}

// ── 13. 영화↔태그 관계 ──
export interface MovieTag {
  user_movie_id: string;
  tag_id: string;
}

// ── 애니 상태 4-State Machine ──
export type AnimeStatus = 'WANT_TO_WATCH' | 'WATCHING' | 'COMPLETED' | 'DROPPED';

// ── 14. 마스터 애니메이션 (AniList API 캐싱 풀) ──
export interface Anime {
  anilist_id: number;            // PK
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
  created_at: string;
}

// ── 15. 내 애니관 (유저×애니 관계) ──
export interface UserAnime {
  id: string;
  user_id: string;
  anilist_id: number;
  folder_id: string | null;
  status: AnimeStatus;
  progress_pct: number;
  rating: number | null;
  summary_note: string | null;
  dominant_color: string | null;
  sort_order: number;
  started_at: string | null;
  finished_at: string | null;
  updated_at: string;
  created_at: string;
}

// ── 16. 애니↔태그 관계 ──
export interface AnimeTag {
  user_anime_id: string;
  tag_id: string;
}
