# Smart Dividend Portfolio

미국 ETF/배당주 포트폴리오 관리 웹앱 (Next.js 기반, PWA 지원)

---

## 프로젝트 개요

- **목표:** 미국 ETF/배당주 포트폴리오의 투자, 배당, 세후수익을 쉽고 체계적으로 관리/분석하는 PWA 기반 웹앱 제공
- **주요 특징:**
  - 반응형 UI/UX, 다크모드, PWA(설치/오프라인 지원)
  - 실시간 데이터 입력/분석/시각화(차트)
  - 데이터 보존(IndexedDB), 파일 저장/불러오기
  - 보안/협업/문서화/운영 표준 준수

---

## 주요 기능

- **자료입력:** 투자예산, 환율, 티커별 정보 입력/자동계산/검증/모바일 최적화
- **자료현황:** 테이블/차트(투자비중, 세후월배당), 포트폴리오 저장/불러오기, 모바일 세로 분리
- **자료관리:** 데이터 초기화, 확장 가능
- **PWA:** manifest, 서비스워커, 오프라인/설치 지원, 아이콘/OG 메타

---

## 기술스택 및 구조

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Chart:** react-chartjs-2, chart.js
- **Storage:** idb-keyval(IndexedDB), localStorage
- **PWA:** manifest.json, sw.js
- **기타:** ESLint, Prettier, GitHub Actions, Open Graph

### 폴더 구조(예시)
```
src/app/
  ├── layout.tsx         # 전체 레이아웃, PWA/메타/네비/푸터
  ├── page.tsx           # 홈(소개/가이드/차트/CTA)
  ├── globals.css        # 글로벌 스타일, Tailwind
  ├── components/        # 재사용 컴포넌트(차트 등)
  ├── input/page.tsx     # 자료입력(투자/티커/자동계산/검증/모바일)
  ├── status/page.tsx    # 자료현황(테이블/차트/저장/불러오기)
  └── manage/page.tsx    # 자료관리(초기화/설정)
public/
  ├── manifest.json      # PWA 메타
  ├── sw.js              # 서비스워커
  ├── *.ico, *.png       # 아이콘/OG 이미지
docs/
  ├── PWA구현절차.md     # PWA 실전 가이드
  ├── cursorrules.txt    # 커밋/브랜치/문서화 등 규칙
  └── ETF_포트폴리오_개발계획서.md # (상세 개발계획서)
```

---

## 실행 방법

```bash
npm install
npm run dev
# 또는 yarn dev / pnpm dev
```
- 브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

## 배포/운영

- GitHub Actions 등 CI/CD 권장
- PWA 설치/오프라인/메타태그/SEO 최적화
- 데이터 백업/복구/이관(파일 저장/불러오기)

---

## 개발/운영/협업 규칙

- **커밋:** 한글+영어, prefix(feat/fix/docs/refactor 등)
- **브랜치:** main(배포), develop(통합), feature/bugfix(세부)
- **코드스타일:** Prettier, ESLint, camelCase, kebab-case
- **PR/이슈/문서화/보안:** [docs/cursorrules.txt](./docs/cursorrules.txt) 참고

---

## 문서/가이드

- [docs/ETF_포트폴리오_개발계획서.md](./docs/ETF_포트폴리오_개발계획서.md) (상세 개발계획서)
- [docs/PWA구현절차.md](./docs/PWA구현절차.md) (PWA 실전 가이드)
- [docs/cursorrules.txt](./docs/cursorrules.txt) (협업/운영 규칙)

---

## 확장/참고

- 추가 기능(알림, 외부 API 연동, 사용자 인증 등) 확장 가능
- 모든 기록/문서는 협업자 누구나 이해할 수 있도록 작성

---

**이 문서만으로 신규 개발자도 바로 개발/운영/확장 가능한 세계 최고 수준의 프로젝트입니다.**
