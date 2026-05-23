// TMDB API 응답 타입 정의 (The Movie Database v3)

// ── TMDB 검색 API 응답 ──
// 예시: GET /search/movie?query=기생충&language=ko-KR
export interface TmdbSearchResponse {
  page: number;
  results: TmdbMovieItem[];
  total_pages: number;
  total_results: number;
}

// ── 개별 영화 아이템 (검색 결과) ──
// 예시: { id: 496243, title: "기생충", poster_path: "/xxx.jpg", ... }
export interface TmdbMovieItem {
  id: number;                    // TMDB 고유 ID (PK)
  title: string;                 // 한국어 제목
  original_title: string;        // 원제
  overview: string;              // 줄거리 요약
  poster_path: string | null;    // "/xxx.jpg" — 앞에 base URL 필요
  backdrop_path: string | null;  // 배경 이미지 경로
  release_date: string;          // "2019-05-30" 형식
  genre_ids: number[];           // 장르 ID 배열 (검색 결과에서는 ID만 제공)
  vote_average: number;          // 평균 평점 (0~10)
  vote_count: number;
  popularity: number;
  adult: boolean;
  original_language: string;
  video: boolean;
}

// ── 영화 상세 정보 (movie/{id} 응답) ──
export interface TmdbMovieDetail extends Omit<TmdbMovieItem, 'genre_ids'> {
  runtime: number | null;        // 러닝타임 (분)
  genres: TmdbGenre[];           // 장르 객체 배열 (상세 조회 시)
  production_companies: TmdbProductionCompany[];
  budget: number;
  revenue: number;
  status: string;                // "Released", "Post Production" 등
  tagline: string;
  homepage: string;
  imdb_id: string | null;
  // credits append_to_response로 감독 정보 포함
  credits?: TmdbCredits;
}

// ── 장르 ──
export interface TmdbGenre {
  id: number;
  name: string;                  // 예: "스릴러", "드라마"
}

// ── 제작사 ──
export interface TmdbProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

// ── 출연진/제작진 ──
export interface TmdbCredits {
  cast: TmdbCastMember[];
  crew: TmdbCrewMember[];
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;                   // "Director", "Producer" 등
  department: string;
  profile_path: string | null;
}

// ── TMDB 이미지 URL 빌더 상수 ──
// poster_path 앞에 이 base URL을 붙여야 완전한 이미지 경로가 된다
// 예시: "https://image.tmdb.org/t/p/w500/xxx.jpg"
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
export const TMDB_POSTER_SIZE = 'w500';
export const TMDB_BACKDROP_SIZE = 'w1280';
