// lib/communityAnon.js
//
// Generates student-flavored anonymous nicknames ("열공하는책벌레6722") instead
// of a plain "익명" label. Nicknames are never stored — they're derived
// deterministically from (postId + userId) so the same anonymous user keeps
// the same nickname for every post/comment they make within one thread,
// without needing a DB column. A different thread (different postId) yields
// a different nickname for the same user, which is the intended anonymity
// boundary (same tradeoff Everytime/Goondori make).

const ADJECTIVES = [
  '성실한', '열공하는', '부지런한', '꾸준한', '침착한', '여유로운', '반짝이는',
  '단단한', '씩씩한', '상냥한', '똑똑한', '느긋한', '유쾌한', '진지한',
  '엉뚱한', '조용한', '활발한', '차분한', '배고픈', '잠못드는',
]

const NOUNS = [
  '수험생', '모범생', '장학생', '독서광', '책벌레', '필기왕', '올빼미',
  '다람쥐', '고양이', '판다', '너구리', '부엉이', '수달', '고슴도치',
  '펭귄', '여우', '토끼', '햄스터', '까치', '고래',
]

// Simple deterministic string hash (djb2) — good enough for picking indices,
// not for anything security-sensitive.
function hash(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i)
  }
  return h >>> 0
}

export function generateAnonNickname(postId, userId) {
  const seed = hash(`${postId}:${userId}`)
  const adjective = ADJECTIVES[seed % ADJECTIVES.length]
  const noun = NOUNS[Math.floor(seed / ADJECTIVES.length) % NOUNS.length]
  const number = seed % 1000000
  return `${adjective}${noun}${number}`
}

// Given a post's author user_id (and whether the post itself is anonymous)
// plus a flat list of comments (each with user_id, is_anonymous, post_id),
// returns the same comments annotated with `author_display_name` and with
// `user_id` stripped — safe to send to the client. `viewerId` (the logged-in
// user requesting the thread, or null) is used only to compute `is_mine` on
// each comment before user_id is dropped.
export function labelComments(post, comments, viewerId = null) {
  return comments.map(c => {
    const isOp = c.user_id != null && c.user_id === post.user_id
    const isMine = viewerId != null && c.user_id === viewerId
    let authorDisplayName

    if (c.is_anonymous) {
      authorDisplayName = generateAnonNickname(c.post_id, c.user_id)
      if (isOp) authorDisplayName += ' (글쓴이)'
    } else {
      authorDisplayName = c.username || '이름없는 회원'
      if (isOp) authorDisplayName += ' (글쓴이)'
    }

    const { user_id, username, ...rest } = c
    return { ...rest, author_display_name: authorDisplayName, is_op: isOp, is_mine: isMine }
  })
}

export function postAuthorDisplayName(post) {
  if (post.is_anonymous) return generateAnonNickname(post.id, post.user_id)
  return post.username || '이름없는 회원'
}
