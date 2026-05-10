import type { DocumentExtract, DocKind, DesignConcept, AnalysisResult } from '@/types';
import { DOC_LABELS } from '@/types';

export const SYSTEM_BASE = `당신은 한국 건축설계사무소를 보조하는 전문 어시스턴트입니다. 현상설계 공모(설계 경기)의 공모지침서·공고문·과업지시서를 정밀하게 읽고 구조화된 데이터를 생성합니다.

원칙:
- 한국 건축 공모 실무 용어를 그대로 사용 (지침서·과업지시서·연면적·도입시설·동선분리·인접배치·심사일·심의·정량평가·정성평가 등)
- 모든 응답은 반드시 유효한 JSON으로만 출력 (마크다운 코드블록 금지)
- 문서에 명시된 사항은 source 필드를 해당 문서 종류로 표기 ("guideline" | "notice" | "task")
- AI가 일반 원칙으로 추가 제안한 사항은 source: "ai" 로 표기
- 추측 금지. 문서에 없는 수치·일정은 만들어내지 말고 source: "ai" + note에 "일반 원칙" 명시
- 모든 텍스트는 한국어`;

export function buildDocumentSection(docs: Record<DocKind, DocumentExtract | null>): string {
  const parts: string[] = [];
  (['guideline', 'notice', 'task'] as DocKind[]).forEach((kind) => {
    const d = docs[kind];
    if (!d) {
      parts.push(`\n=== [${DOC_LABELS[kind]}] === (제출되지 않음)\n`);
    } else {
      parts.push(
        `\n=== [${DOC_LABELS[kind]}] (파일명: ${d.fileName}, ${d.pageCount}페이지) ===\n${d.text}\n`
      );
    }
  });
  return parts.join('\n');
}

export const SUMMARY_PROMPT = `다음 공모 문서들을 읽고 핵심 요약을 카테고리별로 추출하세요. 3개 문서를 교차 참조하여 같은 항목의 값이 다르면 conflict 필드에 두 값을 모두 기록하세요.

응답 JSON 스키마:
{
  "summary": [
    {
      "category": "사업 개요" | "대지 정보" | "건축 규모" | "예산" | "발주처" | "핵심 설계 조건",
      "items": [
        {
          "label": "항목명 (예: 사업명, 대지 위치, 연면적, 최고 층수, 예산, 추정공사비, 건축물 용도 등)",
          "value": "값 (단위 포함, 예: 5,200㎡)",
          "source": "guideline" | "notice" | "task" | "ai",
          "conflict": null 또는 { "sources": ["notice", "task"], "values": ["5,000㎡", "5,200㎡"] },
          "note": "선택. 짧은 보충 설명"
        }
      ]
    }
  ]
}

지침:
- 6개 카테고리 모두 포함 (정보 없으면 빈 배열)
- 카테고리당 3~8개 항목
- 충돌이 있으면 conflict.values에 모든 값을, conflict.sources에 출처를 순서대로 기록
- 충돌이 없으면 conflict는 null`;

export const SCHEDULE_PROMPT = `다음 공모 문서들에서 모든 일정을 추출하세요. 추가로 사용자의 최종 제출 마감일(아래 명시)에서 역산한 사무소 내부 마일스톤을 함께 생성하세요.

응답 JSON 스키마:
{
  "schedule": [
    {
      "id": "고유 ID (영문 소문자 + 숫자)",
      "title": "일정명 (예: 공고일, 질의응답 마감, 현장설명회, 중간 제출, 최종 제출, 1차 심사, 결과 발표)",
      "date": "YYYY-MM-DD",
      "type": "official" | "internal",
      "category": "공고" | "질의응답" | "현장설명" | "중간제출" | "최종제출" | "심사" | "발표" | "내부 마일스톤",
      "source": "guideline" | "notice" | "task" | "ai",
      "note": "선택. 시간·장소·주의사항"
    }
  ]
}

내부 마일스톤(type: "internal", source: "ai") 6개 자동 생성:
- 컨셉 확정 (최종 제출 D-30)
- 매스/배치 확정 (D-21)
- 평면·도면 확정 (D-14)
- 모형 마감 (D-7)
- 패널 인쇄 데드라인 (D-3)
- 최종 점검 (D-1)
역산일이 과거이거나 발주처 일정과 겹치면 합리적으로 조정하되, note에 "역산: D-N" 표기.`;

export const CONCEPTS_PROMPT = `문서에서 추출한 키워드(용도·입지·발주처 성향·강조 키워드)를 바탕으로 디자인 컨셉 10개를 생성하세요. 유형이 겹치지 않도록 카테고리를 분산하세요.

카테고리 (10개 모두 다른 카테고리로):
1. 형태 (Form)
2. 기능 (Function/Program)
3. 지역성 (Place/Context)
4. 친환경 (Sustainability)
5. 사용자 경험 (UX/Behavior)
6. 기술 (Technology/Tectonics)
7. 서사 (Narrative/Symbol)
8. 재료 (Material)
9. 프로그램 (Program Mix)
10. 도시 (Urbanism)

응답 JSON 스키마:
{
  "concepts": [
    {
      "id": "concept-1 ~ concept-10",
      "category": "위 10개 중 하나",
      "nameKo": "한글 컨셉명 (3~7자)",
      "nameEn": "영문 컨셉명 (1~3 단어)",
      "oneLiner": "한 줄 핵심 메시지 (40자 이내)",
      "rationale": "발상 배경 — 어떤 문서 조건/키워드에서 도출됐는지 (60~120자)",
      "spatialStrategy": "공간/형태 전략 (80~150자, 구체적 건축 조작 포함)",
      "keywords": ["키워드 5~7개"],
      "strengths": ["예상 강점 2~3개"],
      "weaknesses": ["예상 약점 2~3개"],
      "source": "ai"
    }
  ]
}

10개 모두 컨셉 그 자체는 AI 발상이므로 source: "ai", 단 rationale에 어떤 [지침] 조건에서 출발했는지 명시.`;

export const SUBMITTABLES_PROMPT = `문서에서 제출물 요구사항을 추출하세요. 누락 시 실격에 해당하는 항목은 required: true로 표기.

응답 JSON 스키마:
{
  "submittables": [
    {
      "id": "sub-1, sub-2, ...",
      "name": "항목명 (예: 설계설명서, 패널, 축소 모형, 디지털 파일, 사업비 내역서)",
      "spec": "규격 (크기·매수·해상도, 예: A1 종방향 5매, 300dpi 이상)",
      "format": "형식 (예: PDF, JPG, HWP, 실물)",
      "copies": "제출 부수 (예: 원본 1부 + 사본 5부)",
      "method": "제출 방법 (예: 온라인 + 오프라인 동시)",
      "required": true | false,
      "source": "guideline" | "notice" | "task" | "ai",
      "note": "선택. 주의사항"
    }
  ]
}

문서에 명시된 항목은 해당 문서를 source로. AI가 일반 공모 관행상 추가로 권장하는 항목(예: 디지털 백업본)이 있으면 source: "ai", required: false로 1~2개 이내 추가 가능.`;

export const PROGRAMS_PROMPT = `과업지시서에서 도입 시설(프로그램)·면적 배분표를 추출하고, 프로그램 간 관계를 추론하세요.

응답 JSON 스키마:
{
  "programs": [
    {
      "id": "prog-1, prog-2, ...",
      "name": "시설명 (예: 다목적홀, 전시실, 카페, 사무실, 화장실)",
      "area": "면적 (예: 350㎡)",
      "count": "수량 (예: 1실, 4실, 또는 빈 문자열)",
      "notes": "비고 (예: 가변형, 외부 접근, 별도 출입)",
      "source": "task" | "guideline" | "ai"
    }
  ],
  "relations": [
    {
      "fromId": "prog-X",
      "toId": "prog-Y",
      "kind": "adjacent" | "separated" | "visual" | "secure",
      "source": "task" | "guideline" | "ai"
    }
  ]
}

관계 4종:
- adjacent: 직접 인접 필요 (예: 다목적홀 ↔ 무대후실)
- separated: 동선 분리 필요 (예: 직원 ↔ 방문객)
- visual: 시각적 연결 필요 (예: 카페 ↔ 전시 로비)
- secure: 보안 분리 필요 (예: VIP실 ↔ 일반)

문서에 명시된 관계는 해당 문서가 source. 명시되지 않았지만 일반 건축 원칙상 자연스러운 관계는 source: "ai" (전체 관계의 30% 이내). 관계는 8~20개 정도.`;

export interface CrossRefInput {
  docs: Record<DocKind, DocumentExtract | null>;
  finalDeadline: string;
  projectName: string;
  client: string;
}

export interface DevelopInput {
  concept: DesignConcept;
  projectName: string;
  client: string;
  summarySnapshot?: AnalysisResult['summary'];
  programsSnapshot?: AnalysisResult['programs'];
}

export const DEVELOP_PROMPT = `다음 디자인 컨셉을 시드로, 한국 건축설계사무소의 실무자가 다음 단계 작업(매스 다이어그램·평면 스터디·입면 스터디)으로 곧장 진입할 수 있도록 더 깊게 발전시키세요.

응답은 다음 JSON 스키마를 정확히 따르세요:
{
  "diagram": {
    "summary": "다이어그램의 핵심 한 줄 (50자 이내, 예: '중앙 보이드를 둘러싸는 ㄷ자 매스')",
    "keywords": ["스케치 키워드 6~10개 (예: '중앙 코어', '캔틸레버', '계단형 셋백', '지붕 슬릿')"],
    "geometry": "기하학적 조작 설명 (120~180자, 매스 분절·축·층 구성·외부 공간 구성 포함)"
  },
  "spatial": {
    "summary": "핵심 공간 구성의 한 줄 (50자 이내)",
    "spaces": [
      { "name": "공간 이름 (예: 메인 보이드, 전이 공간, 옥상 정원)", "description": "역할·치수 감각·인접 관계 (60~100자)" }
    ],
    "circulation": "동선 전략 — 방문객·직원·서비스 분리, 수직 동선 위치, 진입 시퀀스 (120~180자)"
  },
  "facade": {
    "summary": "입면·재료의 한 줄 (50자 이내)",
    "materials": ["재료 조합 3~5개 (예: '노출콘크리트', '브론즈 알루미늄 패널', '저철분 유리')"],
    "facadeStrategy": "방위별 입면 전략 — 채광·일사·프라이버시·도시 맥락 대응 (120~180자)",
    "detailNotes": "디테일 포인트 — 처마·코니스·창호 분할·바닥 마감 전이 등 1~2개 (80~140자)"
  }
}

지침:
- spaces는 4~6개
- 모든 텍스트는 한국어
- 컨셉의 nameKo·oneLiner·rationale·spatialStrategy를 그대로 반복하지 말고, 한 단계 더 구체화한 건축 어휘로 작성
- 발주처 성향과 프로젝트 맥락(아래 명시)을 반영하되, 추측한 수치는 "약 N㎡" 같이 추정 표현 사용
- 마크다운 코드블록 금지, 순수 JSON만`;

export function buildDevelopPrompt(input: DevelopInput): string {
  const c = input.concept;
  const summary = input.summarySnapshot
    ? '\n=== 요약 스냅샷 ===\n' +
      input.summarySnapshot
        .map(
          (cat) =>
            `[${cat.category}] ` +
            cat.items
              .slice(0, 5)
              .map((it) => `${it.label}: ${it.value}`)
              .join(' / ')
        )
        .join('\n')
    : '';
  const programs = input.programsSnapshot && input.programsSnapshot.length > 0
    ? '\n=== 주요 도입 시설 ===\n' +
      input.programsSnapshot
        .slice(0, 12)
        .map((p) => `- ${p.name} (${p.area || '면적 미상'})`)
        .join('\n')
    : '';

  return `프로젝트명: ${input.projectName}
발주처: ${input.client || '미입력'}
${summary}${programs}

=== 시드 컨셉 ===
번호/카테고리: ${c.category}
이름: ${c.nameKo} (${c.nameEn})
한 줄 메시지: ${c.oneLiner}
발상 배경: ${c.rationale}
공간/형태 전략: ${c.spatialStrategy}
키워드: ${c.keywords.join(', ')}
강점: ${c.strengths.join(' · ')}
약점: ${c.weaknesses.join(' · ')}

=== 작업 ===
${DEVELOP_PROMPT}`;
}

export function buildPrompt(kind: 'summary' | 'schedule' | 'concepts' | 'submittables' | 'programs', input: CrossRefInput): string {
  const docSection = buildDocumentSection(input.docs);
  const meta = `프로젝트명: ${input.projectName}\n발주처: ${input.client}\n사용자가 입력한 최종 제출 마감일: ${input.finalDeadline || '미입력'}\n`;
  const promptMap = {
    summary: SUMMARY_PROMPT,
    schedule: SCHEDULE_PROMPT,
    concepts: CONCEPTS_PROMPT,
    submittables: SUBMITTABLES_PROMPT,
    programs: PROGRAMS_PROMPT,
  };
  return `${meta}\n${docSection}\n\n=== 작업 ===\n${promptMap[kind]}`;
}
