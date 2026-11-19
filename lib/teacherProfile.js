// lib/teacherProfile.js
// Builds teacher profile URLs. Pure (no Supabase or Node imports), so client
// components, server routes and pages can all use it.
//
// A profile lives at /profile/<name>. A name that can't be a URL segment
// ("." and ".." resolve to another path, e.g. /profile/. → /profile) falls back
// to /profile/<id>. pages/profile/[name].js resolves both forms.

export function isRoutableTeacherName(name) {
  const trimmed = (name || '').trim();
  return trimmed !== '' && trimmed !== '.' && trimmed !== '..';
}

// The [name] route segment for a teacher ({ name, id }), unencoded.
// Returns null when the name isn't routable and there is no id.
export function teacherProfileSegment(teacher) {
  if (!teacher) return null;
  if (isRoutableTeacherName(teacher.name)) return teacher.name;
  if (teacher.id != null && teacher.id !== '') return String(teacher.id);
  return null;
}

// "/profile/<segment>", or null when no working URL can be built.
export function teacherProfilePath(teacher) {
  const segment = teacherProfileSegment(teacher);
  return segment === null ? null : `/profile/${encodeURIComponent(segment)}`;
}
