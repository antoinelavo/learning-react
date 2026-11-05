# Spec: Teacher profile picture upload/re-upload

## Goal
Teachers can add or replace their profile photo after submitting their profile, from the dashboard. Today the photo can only be set in `/apply`.

## Included
- 내 정보 tab on `/dashboard`: the current photo (or the default image) at the top of the form, with a 사진 변경 button that opens a file picker.
- Choosing a file shows a local preview right away. Nothing is uploaded yet.
- On 저장하기, if a new file was chosen: upload it to `/api/upload-profile-picture`, then include `profile_picture` in the same `teachers` update as the other fields.
- `/api/upload-profile-picture` requires a logged-in user (`getUserFromRequest`, 401 without a valid token).
- `/apply` and the dashboard call the upload route with `authFetch`.

## Not included
- Removing a photo / resetting it to the default.
- Deleting old photos from R2.
- Cropping or resizing in the browser.
- Any database, RLS or migration change.
- Admin-side photo tools.

## Rules
- A photo change follows the existing edit flow: saving sets `status = 'pending'`, so the profile goes back to admin review (same as other edits).
- Allowed: JPEG, PNG, WEBP, GIF, max 10MB (same as the server). Check this in the browser before showing the preview; if it fails, show an error and keep the current photo.
- If the upload fails on save, nothing is saved: show `프로필 사진 업로드가 실패하였습니다. 파일 크기가 10MB 이하인지 확인해주세요.` and keep the form as it is.
- If no new file was chosen, `profile_picture` is not sent in the update (the current photo stays).
- After a successful save, the dashboard shows the new photo.
- Site text is Korean: button `사진 변경`, hint `JPG, PNG, WEBP, GIF · 최대 10MB`.
- Use the `components/ui` kit (`Button`, etc.).
- The upload route keeps its current type/size checks and response shape (`{ url }`).

## Done when
- [ ] A logged-in teacher with no custom photo can upload one from 내 정보, save, and see it on the dashboard; the profile is `pending`.
- [ ] A teacher with a photo can replace it the same way.
- [ ] Saving without choosing a file leaves `profile_picture` unchanged.
- [ ] A wrong file type or a file over 10MB is rejected in the browser with an error, and the current photo stays.
- [ ] `POST /api/upload-profile-picture` without a token returns 401; with a valid token it uploads as before.
- [ ] `/apply` photo upload still works (sends the token).
- [ ] `npm run build` passes.
