# ContentDB_BX — 시네마틱 지식 관제탑

ContentDB_BX는 단순한 독서 기록 앱을 넘어, 사용자의 독서 경험과 지식을 시각화하고 확장하는 **Second Brain(두 번째 뇌)** 플랫폼입니다. 왓챠(Watcha) 스타일의 아름다운 UI와 Notion의 계층형 노트, Obsidian의 지식 그래프 개념을 융합했습니다.

## 🚀 주요 기능

- **4-ZONE 대시보드**: 헤더, 사이드바, 메인 패널, 우측 그래프 패널의 4분할 레이아웃
- **Three-Track 뷰**: 그리드 뷰(포스터), 리스트 뷰(고밀도 테이블), 스파인 뷰(책등)
- **Granular Notes**: 책의 챕터/페이지 단위로 작성하는 마이크로 노트 및 자동 태깅
- **Focus Mode**: 독서에 몰입할 수 있는 뽀모도로 스타일 타이머 및 세션 자동 기록
- **AI 큐레이터 & 서기**: Ollama(로컬 LLM) / Claude / Gemini를 활용한 태그 추천, 총평 초안 작성, 연관 도서 추천
- **내보내기 & 공유**: Obsidian 호환 Markdown 내보내기, Instagram 스타일 이미지 공유 카드

## 🛠 기술 스택

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript
- **Styling**: Vanilla CSS (TailwindCSS 지양, CSS Variables 활용 Two-Face 테마)
- **Database / Auth**: Supabase (PostgreSQL, Row Level Security)
- **External API**: 알라딘 TTB API (도서 검색 및 메타데이터)
- **AI Integration**: Custom AI Provider Abstraction (Ollama base, 확장 가능)

## 📖 설치 및 실행 방법

### 1. 환경 변수 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 값을 입력하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="당신의_SUPABASE_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="당신의_SUPABASE_ANON_KEY"

# 알라딘 API (도서 검색)
ALADIN_TTB_KEY="당신의_알라딘_TTB_KEY"

# AI Provider 설정 (ollama, claude, gemini 중 택 1)
AI_PROVIDER="ollama"

# [선택] Claude API Key
ANTHROPIC_API_KEY=""

# [선택] Gemini API Key
GOOGLE_GEMINI_API_KEY=""

# [선택] 로컬 Ollama Endpoint (디폴트: http://localhost:11434/api/generate)
OLLAMA_ENDPOINT="http://localhost:11434/api/generate"
# Ollama 모델 (예: gemma4:e4b, llama3)
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

1. **로그인 및 프로필 생성**: Google OAuth를 통해 로그인하면 자동으로 `profiles` 테이블에 계정이 생성됩니다.
2. **프로필 및 서재 갤러리**: 프로필 화면(`/profile`)에서 닉네임을 설정하고 핀터레스트(Masonry) 스타일로 정렬된 내 도서 갤러리를 감상할 수 있습니다.
3. **도서 검색 및 서재 추가**: 상단의 검색창에서 알라딘 API를 통해 책을 검색하고 '+ 내 서재에 추가' 버튼으로 라이브러리에 등록합니다.
4. **독서 상태 변경**: 도서 디테일 모달에서 책의 상태(읽고 싶은, 읽는 중, 완독, 중단)와 평점을 업데이트할 수 있습니다.
5. **포커스 모드**: '읽는 중'인 도서에서 포커스 모드를 실행하여 독서 타이머를 가동하고 종료 시 `reading_sessions`에 기록을 남깁니다.
6. **독서 노트 작성**: 도서 디테일의 '독서 노트' 탭에서 페이지 참조와 함께 인상 깊은 구절이나 생각을 기록합니다.
7. **테스트 데이터 초기화 (Seed)**: 로그인 후 브라우저에서 `/api/seed` 로 접속하면 15권의 임의 도서와 히트맵 시뮬레이션용 데이터가 자동으로 삽입됩니다.

## 🚀 Vercel 배포 방법

본 프로젝트는 Vercel 배포에 최적화된 Next.js 16 (App Router) 구조로 작성되었습니다.

1. **GitHub Repository 푸시**:
   현재 작성된 코드를 본인의 GitHub 저장소에 푸시합니다.
2. **Vercel 연동**:
   - Vercel 대시보드에서 `Add New... -> Project`를 클릭합니다.
   - GitHub 저장소를 임포트합니다.
3. **환경 변수 세팅 (Environment Variables)**:
   배포 설정 단계에서 `.env.local` 파일에 작성했던 환경 변수들을 모두 입력합니다.
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ALADIN_TTB_KEY`
   - `AI_PROVIDER`, 등
4. **Deploy 클릭**: 
   빌드 명령어는 자동으로 `npm run build`로 인식되며 배포가 완료됩니다.

---

*본 프로젝트는 Next.js 16(Turbopack)의 Server Actions, App Router 데이터 병렬 페칭, 그리고 Supabase의 RLS(Row Level Security) 아키텍처를 철저히 준수하여 구축되었습니다.*

