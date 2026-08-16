// One Firebase app for the whole public site.
//
// Several modules need Firebase on the same page — the enquiry form, the
// account pages, the header avatar. Each calling initializeApp itself would
// throw app/duplicate-app, so they all import from here instead.
//
// The config is the public web config: shipped to every browser by design,
// and not a credential. What may actually be read or written is decided by
// /firestore.rules.

import { initializeApp, getApps, getApp }
  from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBhAN3PcT-h2F_mNuwPC7wQhKmj9Bo0dGU',
  authDomain: 'apovix-website.firebaseapp.com',
  projectId: 'apovix-website',
  storageBucket: 'apovix-website.firebasestorage.app',
  messagingSenderId: '847136258714',
  appId: '1:847136258714:web:e32665bd9525f1c9ddbd23'
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/** First letters of a name, or of the email if there is no name. */
export function initialsFor(nameOrEmail) {
  const s = String(nameOrEmail || '').trim();
  if (!s) return '?';
  if (s.includes('@')) return s[0].toUpperCase();
  const parts = s.split(/\s+/).filter(Boolean);
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : ''))
    .toUpperCase();
}

/**
 * Build an avatar element for a Firebase user.
 * Google supplies photoURL; email/password accounts have none, so those fall
 * back to initials on a brand-coloured disc.
 *
 * referrerpolicy="no-referrer" matters: without it Google's image CDN
 * intermittently answers 403 and the avatar silently breaks.
 */
export function avatarFor(user, size) {
  const label = user.displayName || user.email || '';

  if (user.photoURL) {
    const img = document.createElement('img');
    img.className = 'avatar';
    img.src = user.photoURL;
    img.alt = '';
    img.width = size || 32;
    img.height = size || 32;
    img.referrerPolicy = 'no-referrer';
    img.loading = 'lazy';
    // If Google's CDN refuses, swap in the initials disc rather than a
    // broken-image icon.
    img.addEventListener('error', () => {
      img.replaceWith(fallbackAvatar(label, size));
    });
    if (size) { img.style.width = size + 'px'; img.style.height = size + 'px'; }
    return img;
  }

  return fallbackAvatar(label, size);
}

function fallbackAvatar(label, size) {
  const span = document.createElement('span');
  span.className = 'avatar avatar--initials';
  span.setAttribute('aria-hidden', 'true');
  span.textContent = initialsFor(label);
  if (size) {
    span.style.width = size + 'px';
    span.style.height = size + 'px';
    span.style.fontSize = Math.round(size * 0.4) + 'px';
  }
  return span;
}
