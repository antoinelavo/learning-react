// lib/communityAnon.js
//
// Anonymous comment authors are labeled with a sequential number scoped to
// one post's thread ("익명1", "익명2", ...), assigned in order of first
// appearance — Everytime/Naver-Cafe style. Numbers are never stored; they're
// recomputed on each comment-list request in created_at order, so two people
// loading the same thread at the same time see identical numbering, but a
// comment posted mid-request by someone else can shift numbers between two
// page loads — an accepted, expected tradeoff (same one Everytime makes).
//
// The post's own (anonymous) author is never assigned a number: shown as
// plain "익명" on the post itself, and as "익명 (글쓴이)" if they comment in
// their own thread — recognizable as the author without revealing which
// numbered anonymous commenter (if any) they might also be.
//
// Non-anonymous authors who are an approved teacher show their teacher
// profile name + photo (and link to their teacher profile) instead of their
// plain username — see is_teacher/author_profile_picture/author_profile_link
// on the returned objects.

export function labelComments(post, comments, viewerId = null) {
  const anonNumberByUserId = new Map()
  let nextAnonNumber = 1

  return comments.map(c => {
    const isOp = c.user_id != null && c.user_id === post.user_id
    const isMine = viewerId != null && c.user_id === viewerId
    let authorDisplayName
    let isTeacher = false
    let authorProfilePicture = null
    let authorProfileLink = null

    if (c.is_anonymous) {
      if (isOp) {
        authorDisplayName = '익명 (글쓴이)'
      } else {
        if (!anonNumberByUserId.has(c.user_id)) {
          anonNumberByUserId.set(c.user_id, nextAnonNumber++)
        }
        authorDisplayName = `익명${anonNumberByUserId.get(c.user_id)}`
      }
    } else {
      isTeacher = !!c.teacher
      authorDisplayName = c.teacher?.name || c.username || '이름없는 회원'
      if (isTeacher) {
        authorProfilePicture = c.teacher.profile_picture || null
        authorProfileLink = `/profile/${encodeURIComponent(c.teacher.name)}`
      }
      if (isOp) authorDisplayName += ' (글쓴이)'
    }

    const { user_id, username, teacher, ...rest } = c
    return {
      ...rest,
      author_display_name: authorDisplayName,
      is_op: isOp,
      is_mine: isMine,
      is_teacher: isTeacher,
      author_profile_picture: authorProfilePicture,
      author_profile_link: authorProfileLink,
    }
  })
}
