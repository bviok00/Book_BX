// 도메인 타입 re-export 및 UI 전용 파생 타입 (ZONE E 중앙 허브)

// ── DB 타입 re-export ──
export type {
  BookStatus,
  Profile,
  Folder,
  Book,
  AladinTocItem,
  UserBook,
  ReadingSession,
  Chapter,
  GranularNote,
  Tag,
  BookTag,
  NoteTag,
  // ★ 영화 확장 타입
  ContentType,
  MovieStatus,
  Movie,
  UserMovie,
  MovieTag,
} from './database';

// ── 알라딘 타입 re-export ──
export type {
  AladinSearchResponse,
  AladinBookItem,
  AladinSubInfo,
  ParsedTocItem,
} from './aladin';

// ── TMDB 타입 re-export ──
export type {
  TmdbSearchResponse,
  TmdbMovieItem,
  TmdbMovieDetail,
  TmdbGenre,
  TmdbCredits,
  TmdbCastMember,
  TmdbCrewMember,
} from './tmdb';
export { TMDB_IMAGE_BASE, TMDB_POSTER_SIZE, TMDB_BACKDROP_SIZE } from './tmdb';

// ── UI 파생 타입: 서재 도서 + 조인된 상세정보 ──
// 예시: { id: "abc", isbn: "978...", book: { title: "사피엔스", ... }, folder: { name: "2026 독서" } }
export interface UserBookWithDetails {
  id: string;
  user_id: string;
  isbn: string;
  folder_id: string | null;
  status: import('./database').BookStatus;
  rating: number | null;
  summary_note: string | null;
  dominant_color: string | null;
  sort_order: number;
  started_at: string | null;
  finished_at: string | null;
  updated_at: string;
  created_at: string;
  // JOIN된 필드
  book: import('./database').Book;
  folder?: import('./database').Folder | null;
  note_count?: number;
  tag_names?: string[];
}

// ── UI 파생 타입: 큐레이션 아이템 ──
export interface CurationItem {
  id: string;
  type: 'BOOK' | 'MOVIE';
  title: string;
  creator: string;
  posterUrl: string;
  originalData: any;
}

// ── UI 파생 타입: 챕터 + 소속 메모 목록 ──
export interface ChapterWithNotes {
  id: string;
  user_book_id: string;
  title: string;
  sort_order: number;
  is_auto: boolean;
  notes: import('./database').GranularNote[];
}

// ── 콘텐츠 통합 아이템 (갤러리/카드 렌더링용) ──
// 도서와 영화를 하나의 타입으로 표현하여 DashboardClient에서 통합 렌더링
// 예시 BOOK: { type: 'BOOK', id: 'uuid', contentId: '978...', title: '사피엔스', creator: '유발 하라리', posterUrl: '...', status: 'READING' }
// 예시 MOVIE: { type: 'MOVIE', id: 'uuid', contentId: '496243', title: '기생충', creator: '봉준호', posterUrl: '...', status: 'COMPLETED', progressPct: 100, runtimeMin: 132 }
export interface ContentItem {
  type: import('./database').ContentType;
  id: string;                    // user_books.id 또는 user_movies.id
  contentId: string;             // isbn 또는 tmdb_id (문자열 통일)
  title: string;
  creator: string | null;        // 저자 또는 감독
  posterUrl: string;
  genre: string | null;
  status: string;
  rating: number | null;
  dominantColor: string | null;
  folderId: string | null;
  sortOrder: number;
  createdAt: string;
  // 영화 전용 필드
  progressPct?: number;
  runtimeMin?: number;
  backdropUrl?: string;
  // 도서 전용 필드
  author?: string | null;
  publisher?: string | null;
}

// ── 지식 그래프 노드 ──
export type GraphNodeType = 'book' | 'tag' | 'movie';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  // book/movie 노드 전용
  coverUrl?: string;
  dominantColor?: string;
  // tag 노드 전용
  count?: number;
}

// ── 지식 그래프 간선 ──
export interface GraphEdge {
  source: string;
  target: string;
}

// ── 히트맵 데이터 ──
// 예시: { date: "2026-01-15", totalMin: 45, sessionCount: 2 }
export interface HeatmapDay {
  date: string;
  totalMin: number;
  sessionCount: number;
}

// ── 레이더 차트 데이터 ──
// 예시: { category: "철학", count: 8 }
export interface RadarCategory {
  category: string;
  count: number;
}

// ── Server Action 표준 응답 ──
export interface ActionResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
}

// ── AI 프로바이더 타입 ──
export type AIProvider = 'ollama' | 'claude' | 'gemini';

export interface AIConfig {
  provider: AIProvider;
  baseUrl?: string;
  model: string;
  apiKey?: string;
}
