# TODO

## Community Board

- Run the Supabase SQL migration to activate post creation
  - File: supabase/migrations/20260605_create_posts.sql
  - Run in Supabase dashboard → SQL Editor

- Add 커뮤니티 to the navigation menu when ready to launch
  - Link is already built and commented out in DesktopNav.client.jsx and MobileMenuToggle.client.jsx
  - Just uncomment the relevant blocks to make it visible

- Implement post engagement features
  - View count tracking (increment on each post visit)
  - Likes / upvotes on posts
  - Comments and replies on posts

- Post moderation
  - Admin queue to review and approve/reject user-submitted posts before they go live

## Teacher Profiles

- Allow teachers to write community posts
- On each teacher's profile page, show a list of posts they have written
  - Link from profile → post, and from post → teacher profile

## General

- Update find page view count
- Add SEO sitemap entries for /community posts
- Notifications (e.g. notify user when someone replies to their post)
- Update the footer
- Fix formatting issues on the /aboutus page

## Email / Mailing Lists

- Add unsubscribe feature for the hagwon-requests mailing list
- Add unsubscribe feature for the students mailing list subscription
