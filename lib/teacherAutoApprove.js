// lib/teacherAutoApprove.js
// Rules for approving a new teacher profile without the owner. Pure
// function (no Supabase), used by app/api/teachers/auto-approve. A profile
// is auto-approved only when every rule passes; otherwise it stays pending
// for the owner to decide.
import { findDuplicates, plainText } from '@/lib/teacherDuplicates';

export const MIN_LONG_INTRO_LENGTH = 100;

// A teacher who skips the photo gets this default image (see app/apply).
const DEFAULT_PICTURE_SUFFIX = '/teachers/default.jpg';

function filled(value) {
  return plainText(value).length > 0;
}

function hasOwnPhoto(url) {
  return filled(url) && !String(url).trim().endsWith(DEFAULT_PICTURE_SUFFIX);
}

// Returns { approve: true } or { approve: false, reason } where reason is one
// of 'incomplete' | 'short_intro' | 'no_email' | 'duplicate'.
export function evaluateAutoApproval(teacher, others, loginEmail) {
  const complete =
    filled(teacher.name) &&
    filled(teacher.school) &&
    filled(teacher.shortintroduction) &&
    filled(teacher.longintroduction) &&
    filled(teacher.contact_information) &&
    hasOwnPhoto(teacher.profile_picture) &&
    Array.isArray(teacher.subjects) &&
    teacher.subjects.length > 0;
  if (!complete) return { approve: false, reason: 'incomplete' };

  if (plainText(teacher.longintroduction).length < MIN_LONG_INTRO_LENGTH) {
    return { approve: false, reason: 'short_intro' };
  }

  if (!loginEmail) return { approve: false, reason: 'no_email' };

  if (findDuplicates(teacher, others).length > 0) {
    return { approve: false, reason: 'duplicate' };
  }

  return { approve: true };
}
