// Gate every admin page except the login screen.
//
// Two checks, both required:
//   1. Signed in with Firebase Auth.
//   2. Has a record in /admins/{uid}.
//
// The second is the one that matters. Signing in proves who you are; the
// admins record proves you are allowed. The Firestore rules enforce the same
// pair server-side, so a tampered client cannot read anything either way —
// this file only decides what to show.

import { auth, db } from './firebase-init.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

export let currentAdmin = null;

/**
 * Resolves with { user, admin } once both checks pass.
 * Redirects to the login page if either fails.
 */
export function requireAdmin() {
  return new Promise((resolve) => {
    let settled = false;

    onAuthStateChanged(auth, async (user) => {
      // Fires again on every token refresh — roughly hourly, and on tab focus.
      // Re-running the whole check each time costs a Firestore read and can
      // repaint the page under the person using it.
      if (settled) {
        // ...except a genuine sign-out, including from another tab.
        if (!user) window.location.replace('index.html');
        return;
      }

      if (!user) {
        settled = true;
        window.location.replace('index.html');
        return;
      }

      let snap;
      try {
        snap = await getDoc(doc(db, 'admins', user.uid));
      } catch (err) {
        settled = true;
        // Rules rejected the read, or Firestore is not reachable.
        showFatal(
          'Could not verify your account',
          err.code === 'permission-denied'
            ? 'This account is signed in but is not on the admin list.'
            : esc(err.message)
        );
        return;
      }

      if (!snap.exists()) {
        settled = true;
        showFatal(
          'Not an admin account',
          'You are signed in as ' + esc(user.email) + ', but there is no admin record ' +
          'for this account. Its user ID is ' + esc(user.uid) + '.'
        );
        return;
      }

      settled = true;
      currentAdmin = { uid: user.uid, email: user.email, ...snap.data() };
      document.body.removeAttribute('data-loading');
      paintIdentity();
      resolve({ user, admin: currentAdmin });
    });
  });
}

function paintIdentity() {
  const nameEl = document.querySelector('[data-admin-name]');
  const roleEl = document.querySelector('[data-admin-role]');
  if (nameEl) nameEl.textContent = currentAdmin.name || currentAdmin.email;
  if (roleEl) roleEl.textContent = currentAdmin.role || 'admin';

  // Owner-only controls stay hidden for ordinary admins.
  if (currentAdmin.role !== 'owner') {
    document.querySelectorAll('[data-owner-only]').forEach((el) => el.remove());
  }
}

function showFatal(title, detail) {
  document.body.removeAttribute('data-loading');
  // title and detail are composed here from escaped values only.
  document.body.innerHTML =
    '<div class="fatal">' +
      '<h1>' + title + '</h1>' +
      '<p>' + detail + '</p>' +
      '<button type="button" class="btn btn--primary" id="fatal-signout">Sign out</button>' +
    '</div>';
  document.getElementById('fatal-signout').addEventListener('click', async () => {
    await signOut(auth);
    window.location.replace('index.html');
  });
}

/** Wire up any [data-signout] button on the page. */
export function wireSignOut() {
  document.querySelectorAll('[data-signout]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await signOut(auth);
      window.location.replace('index.html');
    });
  });
}

/** Mark the current page in the sidebar. */
export function markActiveNav() {
  const here = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.admin-nav a').forEach((a) => {
    if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
  });
}

/** Escape text before it goes anywhere near innerHTML. */
export function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** "16 Aug 2026, 2:04 pm" from a Firestore Timestamp. */
export function formatDate(ts) {
  if (!ts || typeof ts.toDate !== 'function') return '—';
  return ts.toDate().toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}
