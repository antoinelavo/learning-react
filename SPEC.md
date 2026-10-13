# Spec: KakaoTalk open chat insights

## Goal
Analyze chat logs from IB/SAT KakaoTalk open chat rooms to learn what students and parents need. Turn that into insights, feature ideas, content ideas, and a record of who mentions IBMaster and its competitors.

## Included
- Read every chat log file the user sends (several messages, up to 5 files each). Start only after the user says the last batch has been sent.
- Write these files in `content/research/kakao/`:
  - `insights.md`: top questions and topics, pain points, how people find tutors and hagwons, prices and fees people mention, and differences between rooms (IB, SAT, others). Each point comes with representative quotes.
  - `feature-ideas.md`: ranked ideas for changes to IBMaster. Each one gives the evidence from the chats, the affected pages or routes, and a rough size (S/M/L).
  - `content-ideas.md`: blog and community post topics, with Korean target keywords and how often each topic comes up.
  - `ibmaster-mentions.md`: every mention of IBMaster, 아이비마스터 and ibmaster.net (including close spellings), with date, room, nickname, quote, context (recommendation, question or complaint) and sentiment. Ends with a short summary.
  - `competitors.md`: the tutor platforms, hagwons and consultants people mention, with how often and what people say about them.
- Start each file with a short header listing the source rooms, the date range and the message counts.

## Not included
- No changes to site code, the database, or `content/seo/keywords.md`.
- Raw chat logs are not committed.
- No blog posts are written.

## Rules
- Chat nicknames may appear in quotes. If any contact info turns up (phone numbers, KakaoTalk IDs, emails), redact it.
- Quotes stay in the original Korean. The analysis is written in Korean, with English section headings.
- Every claim is backed by quotes or counts from the logs, never by guesses.
- If a feature idea touches an "Ask before changing" area (payments, prices, database, legal pages), it says so.
- Work on branch `claude/init-8bfa4u` and open a PR.

## Done when
- [x] All five files exist in `content/research/kakao/` and each covers every room the user sent.
- [x] `ibmaster-mentions.md` lists every match from a case-insensitive search of the logs for `ibmaster|아이비마스터|아이비 마스터|ib master`, or says there were none.
- [x] No raw log files are in the commit.
- [x] `npm run build` passes (no code changes, so this is a sanity check).
