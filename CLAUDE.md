# Competition Analyzer

현상설계 공모지침서·공고문·과업지시서(100~300p PDF 3종)를 자동 분석·시각화해, 공모 초기 사전 독해 작업 1주를 반나절로 압축하는 건축설계사무소 보조 도구.

> **Powered by 유앤미스튜디오 · 제작: 최인영 · younme.ai.kr**
> 이 앱은 유앤미스튜디오의 AI 교육 프로그램에서 제작되었습니다.

---

## 결정사항 (Architecture Decisions)

### 스택
- Next.js 14 App Router + TypeScript (정적 export 가능한 client-heavy SPA)
- Tailwind 3 + shadcn 스타일 컴포넌트(직접 작성, 커스터마이즈)
- Pretendard Variable (`@fontsource-variable/pretendard`)
- 아이콘 lucide-react / 토스트 sonner / 마크다운 react-markdown
- Gemini: `@google/generative-ai` 클라이언트 직접 호출, 모델 `gemini-2.5-pro` (long context + 정확도 우선)
- PDF 추출: `pdfjs-dist@4.0.379` (worker는 unpkg CDN — 사내망 차단 시 `/public`로 복사 후 workerSrc 교체)
- 보고서 출력: `jspdf` + `html2canvas` (A4 portrait, 표지 + 본문 페이지 분할)
- 다이어그램·간트차트: 외부 라이브러리 없이 SVG 직접 렌더링

### BYOK (절대 어기지 말 것)
- 사용자가 헤더 ⚙️ 모달에서 키 입력 → `localStorage('gemini_api_key')`
- 서버로 전송하지 않음. API Route 중계 금지.
- 키 없을 때 분석 시도하면 모달 자동 오픈
- `lib/api-key-storage.ts` + `lib/gemini-client.ts` + `components/settings/api-key-modal.tsx`

### 폴더 구조
```
app/
  layout.tsx              루트 레이아웃 + Header + Footer + Welcome 모달 + Toaster
  page.tsx                프로젝트 목록 + 생성/삭제 모달
  projects/[id]/page.tsx  좌측 사이드바 + 6개 섹션 + 분석 러너 + 보고서 export
  globals.css             Pretendard, 컬러 토큰, [지침]/[추천] 시맨틱 클래스
  not-found.tsx
components/
  branding/   brand-constants.ts · footer-credit.tsx · creator-info-modal.tsx · welcome-modal.tsx
  settings/   api-key-modal.tsx · api-key-context.tsx
  ui/         button · dialog · input · label
  upload/     document-uploader.tsx
  analysis/   analysis-runner-ui.tsx
  sections/   summary · schedule · concepts · checklist · program · memo
  common/     source-badge.tsx
  report/     report-shell.tsx
  app-header.tsx
lib/
  api-key-storage.ts · gemini-client.ts · pdf-extractor.ts · prompts.ts
  analysis-runner.ts · storage.ts · pdf-export.ts · utils.ts
types/index.ts
```

### 데이터 모델 (`types/index.ts`)
- `ProjectState` = `ProjectMeta` + `documents`(3종 DocKind) + `analysis` + `memo` + `starredConceptIds` + `checkedSubmittableIds`
- `AnalysisResult` = summary[] + schedule[] + concepts[] + submittables[] + programs[] + relations[]
- 모든 항목에 `source: "guideline" | "notice" | "task" | "ai"` 포함 → [지침] vs [추천] 시각 구분

### localStorage 스키마
- `welcome_shown` — 첫 방문 모달 노출 플래그
- `gemini_api_key` — 사용자 BYOK 키
- `projects:index` — `ProjectMeta[]` (목록·정렬용)
- `project:<id>` — `ProjectState` 전체 (원본 PDF 미저장, 추출 텍스트만)

### Gemini 호출 전략
- 100~300페이지 PDF: 클라이언트에서 pdfjs-dist로 페이지별 텍스트 추출 → 합쳐서 약 320K자까지 모델로 전송 (gemini-2.5-pro 1M token context). 초과 시 head 70% + tail 30% 잘라 보냄.
- 분석은 5단계 순차 호출 (요약 → 일정 → 컨셉 → 제출물 → 프로그램+관계). 각 호출 `responseMimeType: application/json`.
- 시스템 프롬프트는 한국어 + 건축 실무 용어 강제. 출력 JSON에 source 필드 강제.

### Bubble Diagram 알고리즘
1. 인접/시각 관계 degree 기준 정렬
2. degree 최상위 노드는 중앙, 나머지는 동심원(반경 110, 220 …) 위 6분할 배치
3. 60회 충돌 완화 + 약한 중앙 인력으로 안정화
4. 최종적으로 viewport 안쪽으로 clamp

### 색상 시맨틱
- **[지침]** = blue-600 (`bg-spec`, `text-spec`, `left-rail-spec`)
- **[추천]** = emerald-700 (`bg-ai`, `text-ai`, `left-rail-ai`)
- **불일치/실격** = red-600 계열 (`text-warn`, `bg-warn-soft`, `left-rail-warn`)
- 베이스: zinc, primary 액션: zinc-900 (절제된 차콜)

### 보고서 출력
- PDF: 표지(딥네이비 헤더, 프로젝트명, 발주처, 생성일) + 본문(html2canvas로 6섹션 캡처 → A4 분할). 페이지 푸터에 브랜드 + 페이지 번호.
- HTML: 페이지 CSS 그대로 inline + cover block 추가.

---

## 빌드/배포

```
npm install
npm run dev
npm run build
```

배포: Vercel. 환경변수 등록 불필요 (BYOK).
