// Remembers where to send the user after login (e.g. a chat deep link from
// an email). Stored in sessionStorage so it survives the OAuth round trip in
// the same tab. Only same-site paths are accepted.

const KEY = 'postLoginRedirect';
// An abandoned login must not hijack a later, unrelated one.
const MAX_AGE_MS = 30 * 60 * 1000;

function isSafePath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') && !path.includes('\\');
}

export function rememberReturnPath(path) {
  if (!isSafePath(path)) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() }));
  } catch {
    // Storage blocked: the user just lands on the default page after login.
  }
}

// Returns the stored path once and clears it, or null.
export function takeReturnPath() {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return null;
    const { path, at } = JSON.parse(raw);
    if (!(Date.now() - at < MAX_AGE_MS)) return null;
    return isSafePath(path) ? path : null;
  } catch {
    return null;
  }
}
