// Shared plumbing for the sign-in / register / account flow.
//
// Every page was implementing its own error map, its own redirect logic and
// its own auth-state handling, and each copy drifted. This is the single
// version of each.

import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

/* -------------------------------------------------------------------------
   Error messages
   Firebase codes are not for end users. Anything unmapped still shows the
   raw code, because a silent failure is worse than an ugly one.
   ---------------------------------------------------------------------- */
const MESSAGES = {
  // sign-in / sign-up
  'auth/invalid-credential':      'That email and password do not match an account.',
  'auth/wrong-password':          'That password is not right.',
  'auth/user-not-found':          'No account exists for that email address.',
  'auth/invalid-email':           'That is not a valid email address.',
  'auth/email-already-in-use':    'An account with that email already exists — sign in instead.',
  'auth/weak-password':           'Please choose a longer password.',
  'auth/user-disabled':           'This account has been disabled. Please contact us.',
  'auth/too-many-requests':       'Too many attempts. Wait a few minutes and try again.',
  'auth/operation-not-allowed':   'That sign-in method is not switched on for this site yet.',
  'auth/requires-recent-login':   'For security, please sign in again before making that change.',
  'auth/user-token-expired':      'Your session expired. Please sign in again.',

  // popup / redirect
  'auth/popup-closed-by-user':    'The sign-in window closed before it finished.',
  'auth/cancelled-popup-request': 'Another sign-in window is already open.',
  'auth/popup-blocked':           'Your browser blocked the sign-in window.',
  'auth/unauthorized-domain':     'This address is not authorised for sign-in yet.',
  'auth/account-exists-with-different-credential':
    'You already have an account with that email, created a different way. ' +
    'Sign in the way you did the first time.',

  // network / firestore
  'auth/network-request-failed':  'No connection. Check your internet and try again.',
  'unavailable':                  'Cannot reach the server right now. Check your connection.',
  'deadline-exceeded':            'The server took too long to answer. Please try again.',
  'permission-denied':            'You do not have permission to do that.',
  'unauthenticated':              'Your session expired. Please sign in again.'
};

export function describeError(err) {
  if (!err) return 'Something went wrong.';
  if (!navigator.onLine) return 'You appear to be offline. Reconnect and try again.';
  const code = err.code || '';
  if (MESSAGES[code]) return MESSAGES[code];
  return (code ? code + ' — ' : '') + (err.message || 'Something went wrong.');
}

/* -------------------------------------------------------------------------
   Auth state
   onAuthStateChanged fires again on every token refresh, roughly hourly and
   on tab focus. Pages that reacted to each firing reloaded themselves and
   wiped whatever the visitor was typing. These give a page the first state
   once, and a separate signal for an actual sign-out.
   ---------------------------------------------------------------------- */

/** Resolves with the user (or null) the first time auth state is known. */
export function firstAuthState(auth) {
  return new Promise((resolve) => {
    const stop = onAuthStateChanged(
      auth,
      (user) => { stop(); resolve(user); },
      (err) => { stop(); console.error('auth state error:', err); resolve(null); }
    );
  });
}

/** Calls back only when the user signs out later — e.g. from another tab. */
export function onSignedOut(auth, handler) {
  let sawUser = false;
  onAuthStateChanged(auth, (user) => {
    if (user) { sawUser = true; return; }
    if (sawUser) handler();
  });
}

/* -------------------------------------------------------------------------
   Navigation
   Redirect sign-in resolves through two channels — getRedirectResult and the
   auth state listener — so both used to fire a redirect. The second call
   would sometimes land mid-navigation and produce a blank page.
   ---------------------------------------------------------------------- */
let navigating = false;

export function go(url) {
  if (navigating) return;
  navigating = true;
  window.location.replace(url);
}

export function isNavigating() { return navigating; }

/* -------------------------------------------------------------------------
   Misc
   ---------------------------------------------------------------------- */

/** 'google' or 'password', read from the account rather than guessed. */
export function providerOf(user) {
  const id = user && user.providerData && user.providerData[0]
    ? user.providerData[0].providerId : '';
  if (id === 'google.com') return 'google';
  if (id === 'password') return 'password';
  return id || 'unknown';
}

/** Show a message in a .notice element, or fall back to an alert. */
export function showNotice(el, message, kind) {
  if (!el) { window.alert(message); return; }
  el.textContent = message;
  el.className = 'notice notice--' + (kind || 'error');
  el.hidden = false;
}

export function hideNotice(el) { if (el) el.hidden = true; }

/** Wrap a promise so a hung network call cannot leave a button spinning. */
export function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(
      () => reject({ code: 'deadline-exceeded', message: (label || 'That') + ' took too long.' }),
      ms || 20000))
  ]);
}
