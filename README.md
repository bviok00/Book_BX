# ContentDB_BX — 시네마틱 하이브리드 지식 관제탑

ContentDB_BX는 단순한 독서 기록 앱을 넘어, 도서와 영화 미디어를 아우르며 사용자의 지식을 시각화하고 확장하는 **Second Brain(두 번째 뇌)** 플랫폼입니다. 왓챠(Watcha) 스타일의 아름다운 UI와 Notion의 계층형 노트, Obsidian의 지식 그래프 개념을 융합했습니다.

## 🚀 주요 기능

- **하이브리드 미디어 갤러리**: 도서(알라딘), 영화(TMDB), 애니메이션(AniList)을 통합 렌더링. 홈(추천) 탭에서 태그 기반 개인화 큐레이션 제공
- **4-ZONE 대시보드**: 헤더, 사이드바, 메인 패널, 우측 그래프 패널의 4분할 레이아웃
- **Three-Track 뷰**: 그리드 뷰(히어로 포스터), 리스트 뷰(고밀도 테이블), 스파인 뷰(책/영화등)
- **Granular Notes**: 영화 트레일러/스틸컷 미디어 지원 및 타임라인 연동 마이크로 메모
- **영감 발굴 (Discovery)**: 사용자의 관심 태그(도서 카테고리, 영화/애니 장르)를 기반으로 알라딘/TMDB/AniList에서 추천 콘텐츠 큐레이션
- **인사이트 대시보드 (Insight)**: 시각화된 차트(Pie, Bar, Donut)를 통해 나의 콘텐츠 선호도, 미디어 비중, 평점 분포 등을 한눈에 파악
- **AI 큐레이터**: Ollama(로컬 LLM) / Claude / Gemini를 활용한 태그 추천, 연관 도서/영화/애니 추천
- **지식 그래프**: 도서, 영화, 애니, 메모에 사용된 태그들이 우주처럼 얽힌 인터랙티브 3D/2D 그래프

## 🛠 기술 스택

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript
- **Styling**: Vanilla CSS (TailwindCSS 지양, CSS Variables 활용 Two-Face 테마)
- **Database / Auth**: Supabase (PostgreSQL, Row Level Security)
- **External API**: 
  - 알라딘 TTB API (도서 데이터)
  - TMDB API (영화 데이터)
  - AniList GraphQL API (애니메이션 데이터)
- **Data Visualization**: Recharts (인사이트 대시보드 차트)
- **AI Integration**: Custom AI Provider Abstraction (Ollama base, 확장 가능)

## 📖 설치 및 실행 방법

### 1. 환경 변수 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 값을 입력하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="당신의_SUPABASE_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="당신의_SUPABASE_ANON_KEY"

# 외부 API (도서 / 영화)
ALADIN_TTB_KEY="당신의_알라딘_TTB_KEY"
TMDB_API_KEY="당신의_TMDB_API_KEY"

# AI Provider 설정 (ollama, claude, gemini 중 택 1)
AI_PROVIDER="ollama"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="gemma4:e4b"
```

### 2. 패키지 설치 및 실행
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

## 💡 주요 워크플로우 명세

1. **콘텐츠 탐색 및 서재 추가**: 상단의 검색창에서 알라딘(도서)/TMDB(영화)를 병렬 검색하고 탭으로 결과를 확인하여 내 컬렉션에 등록합니다.
2. **영감 발굴 큐레이션**: 첫 화면에서 자주 사용하는 태그를 바탕으로 새로운 책과 영화를 추천받습니다.
3. **독서/시청 상태 변경**: 디테일 모달에서 상태(시청 전, 시청 중, 완료)와 평점, 그리고 시청 진행도(progress bar)를 업데이트할 수 있습니다.
4. **포커스 모드**: '읽는 중'인 도서에서 포커스 모드를 실행하여 독서 타이머를 가동하고 종료 시 기록을 남깁니다.
5. **독서/시청 노트 작성**: 콘텐츠 디테일의 '독서 노트' 탭에서 인상 깊은 대사나 생각들을 기록합니다.
6. **테스트 데이터 초기화 (Seed)**: 로그인 후 브라우저에서 `/api/seed` 로 접속하면 임의의 도서 데이터가 삽입됩니다.

## 🚀 DB 마이그레이션 안내
기존 도서 전용 플랫폼에서 영화 지원(v5.0)으로 확장하기 위해 추가(Additive) 스키마 마이그레이션이 완료되었습니다.
- `migration_v5_movies.sql` 파일을 실행하여 `movies`, `user_movies` 및 통합 뷰 `contents_view` 기능이 안정적으로 제공됩니다.

---

*본 프로젝트는 Next.js 15의 Server Actions, App Router 병렬 데이터 페칭, 그리고 Supabase의 RLS 아키텍처를 철저히 준수하여 구축되었습니다.*
