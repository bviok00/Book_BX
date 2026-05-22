# 📘 Next.js & Supabase 통합 마스터 청사진 (Master Blueprint)

본 문서는 Health_BX 프로젝트를 성공적으로 완수하며 정립한 인프라 워크플로우, 아키텍처 패턴, 코어 컨셉, 그리고 실전 유지보수 가이드를 총망라한 단일 진실 공급원(Single Source of Truth)입니다. 향후 어떠한 종류의 데이터 추적(Data Tracking) 앱이나 AI 웹앱을 만들 때에도 완벽한 표준 템플릿이자 AI 에이전트의 기술 지침서로 기능합니다.

---

## 1. 🚀 인프라 초기화 및 배포 워크플로우 (DevOps)

프로젝트를 런칭하기 위한 4단계 표준 가도(Standard Way)입니다.

### 1-1. 인프라 4대장 초기화

1. **Next.js 프로젝트 생성**: 로컬 PC에 앱의 뼈대를 만듭니다.
    
2. **GitHub 리포지토리 연결**: 코드를 클라우드에 올리고 버전 관리를 시작합니다.
    
3. **Vercel 프로젝트 생성**: GitHub과 연결하여 코드가 push될 때마다 24시간 돌아가는 서버에 자동으로 웹사이트가 업데이트되도록 설정합니다.
    
4. **Supabase 프로젝트 생성**: 앱의 두뇌이자 창고가 될 데이터베이스와 로그인 보안 로직(인증 서버)을 확보합니다.
    

### 1-2. 구글 OAuth 2.0 인증 연결 체계

1. **Google Cloud Console 설정**: 'OAuth 동의 화면'을 구성하고, '웹 애플리케이션' 유형의 클라이언트 ID와 Secret을 발급받습니다.
    
2. **승인된 리디렉션 URI 매핑**: **(가장 중요)** 구글 콘솔의 리디렉션 URI에 Supabase의 Callback URL을 정확히 일치시켜야 로그인이 작동합니다.
    
3. **Supabase Auth 및 환경변수 설정**: 구글에서 받은 키를 Supabase에 등록하고, 프로젝트의 .env.local에 Supabase URL과 Anon Key를 연동합니다.
    

### 1-3. PWA 네이티브 최적화 및 최종 배포

1. **manifest.json 작성**: 앱의 이름, 테마 색상, 아이콘 경로를 설정하여 브라우저가 주소창 없는 '네이티브 앱'으로 인식하게 합니다.
    
2. **아이콘 세팅 및 배포 트러블슈팅**: public/icons/ 폴더에 규격화된 PNG 아이콘을 넣습니다. Vercel 배포 시 404 에러나 아이콘 미적용 문제가 발생하면 파일명 대소문자 및 layout.tsx의 link rel="apple-touch-icon" 태그를 점검합니다.
    
3. **스마트폰 설치**: Vercel 주소로 접속 후 '홈 화면에 추가'를 눌러 PWA 설치를 완료합니다.
    

---

## 2. 🏗️ 시스템 아키텍처 및 폴더 구조 (5대 ZONE & 3계층)

명확한 역할 분담을 위해 3개의 주요 계층(Layer)과 5개의 구역(ZONE)을 엄격히 분리합니다.

프로젝트_루트/ ├── directives/ (rules/) ← (Layer 1: 전략과 원칙 SOP - AI 지침 보관소) ├── supabase/migrations/ ← 🏗️ ZONE A: 지하실 (Layer 3: DB/데이터/보안 정책) ├── src/ │ ├── app/ ← 🔧 ZONE B: 엔진실 (Layer 2: 라우팅/서버 액션 로직) │ ├── components/ ← 🎨 ZONE C: 쇼룸 (Layer 1: UI/디자인/shadcn) │ ├── lib/ ← 🔌 ZONE D: 배관실 (Supabase DB 연결/공통 유틸) │ └── types/ ← 📋 ZONE E: 명부실 (TypeScript 타입 명세)

- **Layer 1 (전략)**: AI와 인간이 동일한 규칙(rules/)을 공유합니다.
    
- **Layer 2 (오케스트레이션/UI)**: Next.js App Router 기반으로 UI를 그리고, actions.ts가 서버 통신을 전담합니다.
    
- **Layer 3 (데이터/보안)**: DB 스키마와 RLS 보안을 담당하는 데이터 무결성의 최후 방어선입니다.
    

---

## 3. 🗄️ 데이터 설계 및 RLS 보안 패턴 (Layer 3)

### 3-1. 부모-자식 (1:N) 데이터 관계망

피트니스 앱의 운동(부모)-세트(자식) 구조처럼 모든 데이터 트래킹의 근간이 되는 패턴입니다.

- **데이터 무결성 방어**: 부모 데이터가 지워지면 자식 데이터도 함께 지워지도록 SQL 스키마 작성 시 ON DELETE CASCADE 제약 조건을 반드시 설정하여 고아 데이터를 원천 차단합니다.
    

### 3-2. RLS (Row Level Security) 철통 보안 체계

- **보안의 핵심**: 서버 API가 뚫려도 DB 자체가 방어하도록, 모든 테이블에 using (auth.uid() = user_id) 보안 정책을 강제합니다. 이를 통해 로그인한 사용자 본인의 데이터만 조회하고 수정할 수 있습니다.
    

### 3-3. Auth Flow (세션 관리)

- 클라이언트 쿠키를 활용하여 세션을 관리하며, proxy.ts 엣지 함수에서 만료된 토큰을 자동 갱신하여 무한 로그인을 유지합니다. 렌더링 전 로그인 페이지로 강제 리디렉션 시키는 로직도 여기서 통제합니다.
    

---

## 4. 🎨 UI/UX 고도화: shadcn-ui 개발 전략

shadcn-ui는 npm 모듈로 숨겨지는 것이 아니라 코드가 ZONE C로 직접 복사되어 완벽한 소유형(Ownership) 통제권을 제공합니다.

1. **접근성 및 스타일 일관성**: Radix UI를 기반으로 모달의 포커스 트랩 등을 백그라운드에서 자동 처리하며, globals.css의 CSS 변수를 통해 다크/라이트 테마를 통제합니다.
    
2. **개발 워크플로우**:
    
    - 터미널에서 npx shadcn-ui@latest add [컴포넌트명]으로 설치.
        
    - 생성된 UI를 블록 조립하듯 배치.
        
    - shadcn의 Form 컴포넌트와 React Hook Form + Zod를 결합하여 입력값 검증과 서버 액션(actions.ts) 호출을 매끄럽게 연결합니다.
        

---

## 5. 🧠 코어 로직 딥다이브 & 핵심 기술 원리

### 5-1. 튜토리얼형 파일 독해 순서 (Top 5)

새로운 프로젝트 구조를 파악하거나 AI가 컨텍스트를 파악할 때 다음 순서를 따릅니다.

1. supabase/migrations/001_initial_schema.sql (데이터 관계 및 RLS)
    
2. src/proxy.ts (라우트 보호 및 세션 갱신)
    
3. src/lib/supabase/server.ts (App Router용 쿠키 기반 DB 통신 클라이언트)
    
4. src/app/.../actions.ts (API 없이 클라이언트 폼에서 직접 호출하는 Server Actions)
    
5. src/app/dashboard/page.tsx (Promise.all을 활용한 다중 테이블 병렬 페칭)
    

### 5-2. 체감 속도 최적화: useOptimistic

사용자가 폼을 제출할 때 DB 응답을 기다리지 않고, 화면에 가짜 임시 데이터를 먼저 그린 뒤 백그라운드에서 DB 통신을 처리하여 네이티브 앱 수준의 속도를 구현합니다.

---

### 5-3. Server vs Client 컴포넌트 분리 원칙 (The Boundary)

Next.js App Router 환경에서 AI와 개발자가 가장 엄격하게 지켜야 할 '경계선' 통제 규칙입니다.

1. **서버 컴포넌트 (Server Components - 기본값)**
    

- **위치 및 역할**: src/app/ 하위의 page.tsx와 layout.tsx는 원칙적으로 서버 컴포넌트로 유지합니다.
    
- **규칙**: 최상단에 'use client'를 적지 않습니다. async/await를 사용하여 DB(Supabase)에서 데이터를 직접 Fetching 할 수 있습니다. 단, 브라우저 API(window)나 상태 관리 훅(useState, useEffect, onClick)은 절대 사용할 수 없습니다.
    

2. **클라이언트 컴포넌트 (Client Components)**
    

- **위치 및 역할**: 사용자와 상호작용이 필요한 버튼, 폼(Form), 팝업 모달 등은 src/components/ 구역(ZONE C)으로 완전히 격리합니다.
    
- **규칙**: 파일 최상단에 반드시 'use client' 지시어를 명시해야 합니다. 여기서 상태(State)와 이벤트(onClick, onChange)를 관리하며, 서버 데이터가 필요할 때는 actions.ts(서버 액션)를 호출하여 통신합니다.
    

3. **shadcn-ui 컴포넌트 조립 패턴 (Interleaving)**
    

- shadcn으로 설치한 상호작용 컴포넌트(Dialog, Form, Toast 등)는 이미 내부에 'use client'를 포함하고 있습니다.
    
- **절대 규칙**: 부모인 page.tsx(서버)에서 데이터를 불러온 뒤, 자식인 shadcn 컴포넌트(클라이언트)에게 프롭스(Props)로 데이터를 내려주며 조립하는 방식을 취하십시오. 클라이언트 컴포넌트가 서버 컴포넌트를 무분별하게 감싸서 서버 렌더링의 이점을 파괴하지 않도록 주의해야 합니다.

### 5-4. Next.js 캐시 무효화 (Cache Invalidation) 원칙

Next.js App Router는 기본적으로 데이터를 매우 공격적으로 캐싱합니다. DB에 데이터를 새로 저장(Insert/Update/Delete)한 뒤, 화면이 갱신되지 않는 버그를 막기 위한 절대 규칙입니다.

- **절대 규칙**: ZONE B(actions.ts)에서 DB 데이터를 변경하는 작업이 성공적으로 끝났다면, 함수 마지막에 반드시 `revalidatePath('/해당_경로')`를 호출해야 합니다.
    
- **금지 사항**: 화면을 새로고침하기 위해 클라이언트 컴포넌트에서 `window.location.reload()`나 `router.refresh()`를 남발하지 마십시오. 데이터 갱신 트리거는 오직 서버 액션 내부의 `revalidatePath`가 통제해야 합니다.
    

### 5-5. 서버 액션(Server Actions) 에러 핸들링 및 표준 응답 패턴

서버 액션에서 에러가 났을 때 앱이 하얗게 질리며(Crash) 죽어버리는 것을 막기 위한 통신 규약입니다.

- **표준 리턴 규약**: actions.ts의 모든 함수는 `throw new Error()`로 날것의 에러를 던지지 마십시오. 대신 무조건 `{ success: boolean, data?: any, error?: string }` 형태의 규격화된 객체를 반환해야 합니다.
    
- **UI 연동**: ZONE C(클라이언트 컴포넌트)에서는 이 서버 액션의 리턴값을 받아, `success`가 false일 경우 shadcn의 `Toast` 컴포넌트를 띄워 사용자에게 우아하게 에러 메시지를 보여주어야 합니다.

## 6. 🛠️ 실전 유지보수 및 새 프로젝트 런칭 가이드

### 6-1. 마스터의 3계명

1. **A ↔ E 동기화**: ZONE A에서 데이터베이스 컬럼을 건드리면 ZONE E의 database.ts 타입 명세도 반드시 같이 업데이트해야 합니다.
    
2. **TypeScript 에러 신뢰**: 코드의 빨간 줄은 적이 아니라 다음으로 고쳐야 할 목적지를 알려주는 완벽한 네비게이션입니다.
    
3. **관심사 분리**: 화면(Design)은 ZONE C에, DB 조작(Logic)은 ZONE B(actions.ts)에 철저히 분리하십시오.
    

### 6-2. 상황별 대처 시나리오

- **UI 디자인 변경 (색상, 여백)**: ZONE C (src/components/ui) 컴포넌트의 Tailwind className 수정.
    
- **신규 로직/기능 추가**: ZONE B (actions.ts)에 서버 함수 작성 후, ZONE C 버튼의 action에 연결.
    
- **DB 컬럼 추가 파이프라인**: [1] SQL 추가 → [2] 타입스크립트 타입 변경 → [3] actions.ts 쿼리 수정 → [4] 입력창 UI 추가.
    

### 6-3. 차기작 '스타터 템플릿' 활용법 (1시간 착공 체크리스트)

새 프로젝트를 런칭할 때 다음 단계를 거칩니다.

1. [ ] **프로젝트 복제**: 기존 템플릿 폴더 복사 후 불필요한 라우트 도메인 삭제.
    
2. [ ] **환경 변수 교체**: 새 Supabase 프로젝트 생성 후 .env.local 값 갱신.
    
3. [ ] **DB 초기화**: 기존 migrations 삭제 후 새 도메인(예: 가계부, 쇼핑 챗봇)에 맞는 001_new_schema.sql 재작성 및 db push.
    
4. [ ] **보안 세팅**: proxy.ts에서 보호할 라우트 목록 경로 교체.
    
5. [ ] **PWA 브랜딩**: manifest.json의 이름, 색상 교체 및 새 아이콘 삽입.

### 6-4. ZONE A ↔ E 타입 동기화 자동화 (Supabase CLI)

DB 컬럼을 수정했을 때, 사람이 손으로 TypeScript 타입(database.ts)을 고치다 보면 휴먼 에러가 발생합니다.

- **명령어 족보**: Supabase 대시보드에서 스키마를 변경했다면, 터미널에서 다음 명령어를 실행하여 ZONE E의 타입을 1초 만에 자동 동기화하십시오. (명령어: `npx supabase gen types typescript --project-id "내프로젝트ID" --schema public > src/types/database.ts`)
    
- AI 개발자는 타입 에러가 발생할 경우, 기존 타입을 임의로 수정(any 남발 등)하지 말고 이 명령어를 통해 최신 DB 스키마를 먼저 가져오는 것을 최우선으로 해야 합니다.