# Spec: Unified UI components

## Goal
Make buttons, inputs, badges, cards and tabs look the same across the site, using the teacher dashboard (`app/dashboard/page.jsx`) as the visual reference.

## Included
- Shared components in `components/ui/`:
  - `Button`: variants `primary` (solid `blue-600`, hover `blue-700`), `secondary` (white, `border-gray-300`), `danger` (red text and border, not solid), `ghost` (text only). Sizes `sm`/`md`/`lg`. Always `rounded-xl`. Supports `disabled`, `type`, `fullWidth`, and rendering as a link.
  - `Input`, `Select`, `Textarea`: `rounded-xl`, `border-gray-300`, `p-3`, blue focus ring. Optional `label` and error text.
  - `Badge`: `rounded-full` pill with soft colors (`blue`, `gray`, `green`, `yellow`, `red`), e.g. `blue-50` background with blue text.
  - `Card`: white, `rounded-2xl`, `border-gray-200`, `shadow`, standard padding.
  - `Tabs`: segmented control. Gray `rounded-full` track, white shadowed active pill with blue text.
  - `Notice`: soft tinted status box (`yellow`, `blue`, `red`, `green`), `rounded-xl`.
- Replace the inline-styled versions of these elements with the shared components on every page in `app/` and `pages/`, including admin pages, dashboards, auth, chat, community, and the teacher profile page.
- Shared components in `components/` that use these elements (cards, popups, nav, `BlogCTAButton`, `TierUpgradeOffer`, `PremiumListingOffer`, chat components).

## Not included
- Page layouts, spacing, typography, and the global `h1`/`h2`/`p` styles in `styles/`.
- Blog post content in `content/blog/`.
- Legal pages (terms, privacy, refund policy) and the footer's business info.
- Brand color or font changes. Primary stays the existing `blue` palette and Noto Sans KR.
- The Quill rich-text editor's internal styling.

## Rules
- No behavior changes: same handlers, `href`s, form field `name`s, `required`/validation, and Korean text.
- Payment components (`TierUpgradeOffer`, `PremiumListingOffer`, and any Toss checkout buttons): styling only. Do not touch Toss calls, prices, `lib/toss.js`, activation code, or API routes.
- No database or migration changes.
- Components are plain JS/JSX with Tailwind classes and accept `className` for small per-use tweaks.
- Destructive actions (탈퇴하기, delete, cancel) use the `danger` variant.
- Must look right on mobile (no overflow, tap targets at least ~40px tall).

## Done when
- [x] `components/ui/` contains `Button`, `Input`, `Select`, `Textarea`, `Badge`, `Card`, `Tabs`, `Notice`.
- [ ] No `<button>` in `app/`, `pages/`, or `components/` (outside `components/ui/`) has its own background-color/radius/padding styling. Icon-only buttons and tab triggers inside `Tabs` are the only exceptions.
- [x] Text inputs, selects and textareas in forms use the shared components.
- [x] Dashboard 로그아웃 is `secondary` and 탈퇴하기 is `danger`. They no longer use `blue-500`/`blue-900`.
- [x] Payment components still call the same handlers with the same props (diff shows only markup/class changes).
- [ ] Key pages checked at mobile and desktop widths: home, find, students, hagwon-requests, dashboard, login/signup, teacher profile, admin.
- [x] `npm run build` passes.
