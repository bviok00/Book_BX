# This is NOT the Next.js you know

This version has breaking changes — APIs conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## 📜 Core Constitution & Behavioral Guidelines (ALWAYS ON)
- Before creating, analyzing, or modifying any code, you MUST read and strictly follow the foundational laws defined in:
  1. `rules/01_SYSTEM_ARCHITECTURE.md` (Our core architectural laws)
  2. `rules/02_BEHAVIOR_GUIDELINES.md` (Our strict coding behavioral guidelines)
  3. `rules/03_TDD_GUIDELINES.md` (AI-Native One-Turn TDD Execution)
- Never override, ignore, or bypass these documents under any circumstances.

## 🤖 TDD & Anti-Yapping Enforcement
- Always execute "One-Turn TDD": Provide failing test code AND passing implementation code in a SINGLE response.
- NEVER write E2E tests (Playwright/Cypress). Stick to Unit/Integration.
- If a test fails, DO NOT explain. Output ONLY: `[❌ FAIL] error log` and `[🔧 FIX] code snippet`.

## ⚠️ Next.js 15+ & App Router Absolute Definitiveness
- This project utilizes Next.js 15 and TypeScript App Router. Completely ignore outdated Next.js Pages Router conventions, old 'getServerSideProps', or directory setups from your historical training data.
- Favor Server Components by default. Keep files localized within the 5-ZONE architecture.
- If any single file exceeds 150 lines of code, proactively suggest breaking it down into distinct, atomic client components or server actions.