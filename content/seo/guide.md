# Blog post guide

Rules for every new post in `content/blog/`. Based on the strongest existing posts: `how-to-find-ib-tutor`, `about-ib`, `3-year-admission-program-parents`, `SAT-hagwons-gangnam`, `korean-IB-schools`.

## Reader and purpose

- Readers are Korean students (middle/high school) and, more often, their parents, researching IB, SAT, or 특례입학.
- Every post answers the search query fully and concretely: numbers, dates, requirements, costs, checklists. No filler intros, no generic advice that fits any subject.
- Every post leads naturally to something on IBMaster: finding a tutor (`/find`), comparing hagwons (`/hagwons`, `/sat-hagwons`), or a hagwon request (`/hagwon-requests/new`).

## Language and tone

- Korean, 존댓말 (`~합니다`, `~하세요`). Friendly, direct, expert.
- Keep standard English terms as-is where Korean readers search them: IB, SAT, IA, EE, TOK, HL/SL, Math AA/AI, Diploma, AP.
- Short paragraphs (2–4 sentences). Use **bold** for the key fact in a section.
- Never invent statistics, quotes, prices, school names, or dates. If it can't be verified, leave it out.

## Frontmatter

```yaml
---
title: "<keyword near the front> ... [2026년 최신]"
date: "YYYY-MM-DD"
description: "<120–160 Korean characters, contains the keyword, says what the reader gets>"
ctaDescription: "<one-line question, e.g. 검증된 IB 과외 선생님을 찾고 있다면?>"
ctaLabel: "<short button text, e.g. 과외 선생님 찾기>"
ctaLink: "<one of the CTA links below>"
category: "IB" | "SAT" | "특례입학"
---
```

- **title**: the exact target keyword (or a very close form) in the first half, under ~40 characters where possible. Add `[YYYY년 최신]` only for time-sensitive topics (dates, costs, admissions rules). Use a number when the post is a list (`5가지`, `10곳`).
- **date**: the day the post is written.
- Don't set `featured`.

## CTA links

| Topic | ctaLink | ctaLabel example |
|---|---|---|
| IB tutoring, subjects, IA/EE/TOK help | `/find` | 과외 선생님 찾기 |
| IB hagwons, IB general | `/hagwons` | 추천 학원 보기 |
| SAT anything | `/sat-hagwons` | SAT 학원 보기 |
| 특례입학 | `/hagwons` | 추천 학원 보기 |

For a mid-post CTA, you may use the MDX component once, after the first main section:

```mdx
<BlogCTABlock description="..." label="..." href="/find" />
```

No other JSX or components. Plain Markdown (GFM tables are fine).

## Structure

1. **Opening paragraph (no heading)**: 2–3 sentences that answer the query directly and say what the post covers. The keyword appears in the first sentence.
2. **`##` sections**: 4–7 of them, each a question or topic the searcher has. Put the keyword or a close variant in at least 2 `##` headings. Use `###` for sub-items (steps, list entries).
3. **A summary element**: one of a table (comparisons, costs, dates), a numbered checklist, or a short `핵심 요약` list.
4. **`## 자주 묻는 질문`**: 3–5 real follow-up questions as `###` headings with short answers.
5. **Closing paragraph**: one or two sentences that lead into the CTA.

Never use a `#` (h1) heading in the body. The page renders the title as h1.

## Length

- 1,500–3,500 Korean characters of body text (about 4–8KB of MDX). Longer only if the topic truly needs it (full lists, directories).

## Internal links

- At least 3 internal links, written as Markdown links with descriptive Korean anchor text (not "여기").
- At least 2 must go to existing blog posts (`/blog/<slug>`, using slugs that exist in `content/blog/`). The rest can go to `/find`, `/hagwons`, `/sat-hagwons`.
- Link the first time a related topic comes up, not in a block at the end.

## External sources

- Facts that change (exam dates, fees, admission rules, score policies, school lists) must come from an official or primary source: ibo.org, collegeboard.org, adiga.kr / 대교협, university admissions pages, 교육청 / 교육부, school websites.
- Don't put footnotes in the post. Sources go in the PR body. You may link to one official source inline when it helps the reader (for example, the official IB exam schedule).

## Slug

- Lowercase English, kebab-case, short and keyword-based: `ib-math-aa-vs-ai`, `sat-test-dates-korea`.
- Must not match an existing file in `content/blog/` (case-insensitive).

## Categories

- `IB`: IB curriculum, subjects, scores, tutoring, hagwons, IB schools.
- `SAT`: SAT, AP, US admissions prep.
- `특례입학`: 재외국민특별전형 (3년/12년 특례) and related admissions.
