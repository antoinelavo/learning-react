# Spec: Rewrite 5 low-CTR blog posts

## Goal
Raise Search Console CTR and clicks on five posts that rank well (positions 7–20) but get few clicks, by fully rewriting each from fresh research against `content/seo/guide.md`. Posts are done one at a time, with a review stop after each.

## Included
Order, by impressions at the time of the audit:
1. `content/blog/3-year-admission-program.mdx` (4,153 impressions, 1.28% CTR)
2. `content/blog/SAT-scores-by-university.mdx` (3,112, 2.31%)
3. `content/blog/IB-in-Korea.mdx` (3,207, 2.59%, position 19.7)
4. `content/blog/IB-scores.mdx` (1,696, 2.18%)
5. `content/blog/about-ib.mdx` (772, 0.65%, position 16.3)

For each post:
- Research on the web, using official sources only for facts that change (adiga.kr / 대교협, university admissions pages, 교육부, collegeboard.org, ibo.org).
- Rewrite title, description and body per `content/seo/guide.md`: keyword-first title, 120–160 character description, opening answer paragraph, 4–7 `##` sections, a table or checklist, `## 자주 묻는 질문`, closing line, at least 3 internal links (2+ to existing posts), 1,500–3,500 Korean characters of body (longer only if the topic needs it).
- Set `date` to the day of the rewrite (2026-11-28 for the first).
- One commit per post on branch `claude/confident-pascal-6lhgst`, pushed after the post is approved.

## Not included
- Changing slugs or URLs, or other posts.
- Changing `ctaLink`/`ctaLabel`/`ctaDescription`/`category`/`featured`, unless a rewrite makes the CTA clearly wrong (then ask).
- Site code, sitemap, new posts, opening a PR (only when asked).
- The Nov 13 traffic drop investigation (findings only, already reported).

## Rules
- Blog posts are an "ask before changing" area; the owner has asked for these five.
- Drop the year tag (`[2025년 최신]`, `- 2025년 최신 반영`) from every title. A year may still appear in the body or title only where the topic is tied to a year (e.g. the 특례 post's `2027학년도` admissions cycle), and only if verified.
- Never invent statistics, prices, school names, requirements or dates. If it can't be verified from an official source, leave it out. Keep existing content only where it still checks out.
- Korean 존댓말. Keep IB/SAT terms in English where readers search them. Graded-work examples in English with a Korean gloss.
- Internal links must point to slugs that exist in `content/blog/`, `/find`, `/hagwons` or `/sat-hagwons`. No h1 in the body, no footnotes; at most one inline official link where it helps.
- Sources and a short list of what changed go in my message after each post (and in a PR body if one is opened later).
- Stop after each post and wait for approval before starting the next.

## Done when
- [ ] All five titles have no year tag.
- [ ] Each post has frontmatter `date: "2026-11-28"` (or its rewrite day) and a 120–160 character description containing the keyword.
- [ ] Each post follows the guide's structure, has at least 3 valid internal links (2+ to existing blog posts), and an FAQ section.
- [ ] Every changed fact is backed by an official source I list in my message.
- [ ] Post N+1 starts only after you approve post N.
- [ ] `npm run build` passes after each post.
