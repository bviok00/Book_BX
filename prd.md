# 🎖️ [PRD v5.0] Intellect_BX — 시네마틱 하이브리드 지식 관제탑 (도서+영화 통합)

> **설계 철학:** "연구실(Notion Light)과 영화관(Watcha Dark)을 오가는 Two-Face 하이브리드 UI + AI 인텔리전스 레이어"

---

## 1. 프로젝트 개요 (Overview)

|항목|내용|
|---|---|
|**목적**|알라딘(도서) 및 TMDB(영화) API로 미디어 데이터를 수집하고, 계층형 노트를 기록하며, 이를 인터랙티브 지식 그래프로 시각화하는 클라우드 기반 Second Brain 구축|
|**배포**|Vercel (웹앱) + PWA (모바일/태블릿 독립 구동)|
|**인증**|Supabase Auth — Google OAuth 단일 진입점|
|**보안**|전 테이블 RLS(Row Level Security) 강제 적용|
|**디자인 철학**|Light = Notion 오프화이트 연구실 / Dark = Watcha 시네마틱 영화관 — 150ms 트랜지션으로 전환|

---

## 2. 기술 스택 (Tech Stack)

|레이어|기술|용도|
|---|---|---|
|**Frontend**|Next.js 15 (App Router), React 19, Tailwind CSS|전체 UI 프레임|
|**테마**|`next-themes`|Light/Dark 전역 스위칭|
|**Backend/DB**|Supabase (PostgreSQL + Auth + Storage)|DB, 인증, 이미지 스토리지|
|**네트워크 시각화**|`react-force-graph` or `d3-force`|지식 성단 마인드맵|
|**차트**|`recharts`|레이더 차트, 히트맵 연산|
|**이미지 처리**|`color-thief`|책/영화 표지 dominant color 추출|
|**공유 카드**|`html-to-canvas`|메모 인스타그래머블 카드 생성|
|**외부 API**|알라딘 Open API, TMDB API|도서 및 영화 검색, 표지, 메타데이터 수집|
|**AI**|Ollama / Claude API / Gemini|태그 추천, Summary 초안, 연결 도서/영화 추천|
|**익스포트**|`jszip` + `file-saver`|Obsidian 마크다운 번들 내보내기|

> **외부 API CORS 방어:** 브라우저 직접 호출 불가. Next.js Route Handler(`/api/aladin`, `/api/tmdb`)를 프록시로 반드시 구축.

---

## 3. UI/UX 테마 전략 — Two-Face 시스템

### 🌗 테마별 시각 매핑

|요소|다크 모드 (Watcha 시네마틱)|라이트 모드 (Notion 오프화이트)|
|---|---|---|
|**배경**|`#0a0a0a` (딥 블랙)|`#f7f7f5` (미색)|
|**카드**|고해상도 표지 포스터 강조, glow 테두리|`shadow-md` 종이 입체감|
|**타이포**|흰색 고대비|흑회색 `#1a1a1a`|
|**accent**|표지 dominant color 동적 추출|표지 dominant color 동적 추출|
|**전환**|`transition: all 150ms ease`|동일|
|**최적화**|야간 시네마틱 세션, 시각적 수집욕|주간 연구/분석 세션|

### 📱 모바일 PWA 붕괴 방지 (768px 미만)

- 데스크톱 4-ZONE → **하단 Bottom Navigation (4탭)** 구조로 리셋
- 탭 구성: `[🏠 서재]` `[📚 탐색]` `[🧠 그래프]` `[👤 프로필]`

---

## 4. 4-ZONE 대시보드 상세 기능 명세

### 📡 ZONE 1: 헤더 — 지적 전투력 검증

#### 4.1.1 지식 잔디 히트맵
- `reading_sessions` 테이블 기준으로 활동일 추적
- GitHub 잔디 스타일 1년치 캘린더 렌더링

#### 4.1.2 지식 레이더 차트 (Cognitive Radar)
- 완독 도서 및 시청 완료 영화의 카테고리/장르 실시간 집계

#### 4.1.3 연간 목표 게이지
- 연초 목표 권수 설정 및 게이지 표시

#### 4.1.4 통합 검색 모달 (Content Search)
- 도서(알라딘) + 영화(TMDB) 병렬 검색 지원 및 탭 분리 UI

---

### 🔭 ZONE 2: 좌측 패널 — 폴더 트리 & 상태 관리

#### 4.2.1 물리적 폴더 트리 (Context)
- 콘텐츠가 소속되는 단일 프로젝트 단위 관리 (1:N 관계 엄수)

#### 4.2.2 상태 트래킹 (4-State Machine)
- 도서: `WANT_TO_READ` → `READING` → `COMPLETED` / `DROPPED`
- 영화: `WANT_TO_WATCH` → `WATCHING` → `COMPLETED` / `DROPPED`

---

### 🧠 ZONE 3: 중앙 메인 패널 — 시네마틱 지식 용광로 (핵심)

#### 4.3.1 세그먼트 컨트롤 및 큐레이션
- `[전체 | 도서 | 영화]` 필터링 세그먼트 컨트롤
- 🔭 **영감 발굴 (Discovery Section)**: 유저의 상위 태그를 기반으로 알라딘/TMDB에서 추천 콘텐츠를 불러와 가로 카루셀 제공

#### 4.3.2 Three-Track 뷰 스위치
|뷰|아이콘|스타일|용도|
|---|---|---|---|
|**그리드 뷰**|`☷`|Watcha 포스터 히어로 배너 + 카루셀 (영화는 진행도 표시)|탐색/수집|
|**리스트 뷰**|`☰`|고밀도 텍스트 테이블|분석/관리|
|**책등 뷰**|`📚`|실제 책장 스파인 나열|컬렉션 보상감|

#### 4.3.3 통합 콘텐츠 데이터 모델
- 도서(`books`/`user_books`)와 영화(`movies`/`user_movies`)를 `contents_view` 통합 뷰로 묶어 무파괴(Additive) 확장 적용.

---

### 🔗 ZONE 4: 우측 패널 — 지식 네트워크 터미널

#### 4.4.1 옵시디언 미니 지식 성단
- `react-force-graph` 기반 2D/3D 인터랙티브 그래프
- 노드 타입: `Book/Movie` (원형, 표지 썸네일) / `Tag` (육각형, 개념 키워드)
- 간선: `book_tags`, `movie_tags`, `note_tags` 연동

#### 4.4.2 개념 태그 시스템
- 폴더 트리(ZONE 2)와 분리. 콘텐츠 및 메모 레벨에서 다중 태그 연결.

---

## 5. AI 인텔리전스 레이어

|기능|트리거|출력|
|---|---|---|
|**메모 자동 태깅**|메모 저장 시|관련 태그 3개 추천|
|**Summary 초안 생성**|`[✨ AI 초안]` 버튼 클릭|총평 초안 텍스트 생성|

---

## 6. 개발 마일스톤

### Phase 1~4: 도서 기반 지식 관제탑 구축 (완료)
- [x] 알라딘 API 연동 및 Three-Track 뷰
- [x] 계층형 노트 아키텍처 및 폴더 트리
- [x] 지식 성단 (react-force-graph)

### Phase 5: 영화 미디어 확장 (완료)
- [x] 스키마 확장 (`movies`, `user_movies`, `movie_tags`, `contents_view`)
- [x] TMDB API 프록시 라우트 신설
- [x] 통합 검색 모달 및 탭 분리 UI
- [x] Dashboard 세그먼트 컨트롤 및 갤러리/리스트/스파인 뷰 통합 렌더링
- [x] 큐레이션 발굴(Discovery) 섹션 추가

### Phase 6: 애니메이션 미디어 확장 (완료)
- [x] 스키마 확장 (`animes`, `user_animes`, `anime_tags`)
- [x] AniList API GraphQL 연동 및 라우트 신설
- [x] 탭 기반 애니메이션 검색 및 UI 분리 통합
- [x] 홈 탭 추천 섹션 통합 (도서/영화/애니) 및 스티키 앵커 네비게이션 적용

### Phase 7: 인사이트 대시보드 (완료)
- [x] `recharts`를 활용한 차트 컴포넌트(`InsightDashboard.tsx`) 시각화 구현
- [x] 미디어별 비중(파이), 상태별 진행도(도넛), 평점 분포(막대) 차트 제공