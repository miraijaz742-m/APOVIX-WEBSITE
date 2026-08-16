// Header auth state, plus the nag that gets Google sign-ins to finish.
//
// Google's OAuth profile gives us a name, an email and a photo — never a
// phone number. So a Google sign-in is only half a registration: the account
// exists in Firebase Auth, but until they complete the form there is no
// users/{uid} record and they show up nowhere in the admin panel.
//
// This runs on every public page. If it finds a signed-in visitor with no
// record, the header says "Finish signup" and a banner sits under the header
// until they do.
//
// Fails open: any error here leaves a plain "Sign in" link and no banner.
// Nagging someone because Firestore hiccuped would be worse than staying quiet.

import { auth, db, avatarFor } from './fb.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';
import { onProfileComplete } from './auth-flow.js';

const slots = document.querySelectorAll('[data-auth-nav]');

// The register page is where they finish, so it does not nag; the account
// page redirects there by itself.
const page = window.location.pathname.split('/').pop() || 'index.html';
const SILENT = page === 'register.html' || page === 'account.html';

// One lookup per uid per page load, not one per auth-state firing.
const checked = new Map();

async function hasProfile(uid) {
  if (checked.has(uid)) return checked.get(uid);
  let result;
  try {
    result = (await getDoc(doc(db, 'users', uid))).exists();
  } catch (err) {
    console.warn('profile check failed, assuming complete:', err);
    result = true;              // fail open — never nag on an error
  }
  checked.set(uid, result);
  return result;
}

function signedOutMarkup(isMobile) {
  return isMobile
    ? '<a href="login.html" data-menu-link>Sign in</a>'
    : '<a href="login.html">Sign in</a>';
}

function chipFor(user, complete, isMobile) {
  const link = document.createElement('a');
  link.className = 'user-chip' + (complete ? '' : ' user-chip--incomplete');
  link.href = complete ? 'account.html' : 'register.html';
  if (isMobile) link.setAttribute('data-menu-link', '');

  const first = (user.displayName || user.email || '').split(/[\s@]/)[0];
  link.setAttribute('aria-label', complete
    ? 'Your account, signed in as ' + (user.email || first)
    : 'Finish creating your account');

  link.appendChild(avatarFor(user, isMobile ? 32 : 28));

  const name = document.createElement('span');
  name.className = 'user-chip__name';
  name.textContent = complete ? (first || 'Account') : 'Finish signup';
  link.appendChild(name);

  return link;
}

function showBanner(user) {
  if (SILENT || document.getElementById('profile-banner')) return;

  const bar = document.createElement('div');
  bar.className = 'profile-banner';
  bar.id = 'profile-banner';
  bar.setAttribute('role', 'status');
  bar.innerHTML =
    '<div class="container profile-banner__inner">' +
      '<p class="profile-banner__text">' +
        '<strong>One step left.</strong> ' +
        'We still need a phone number before we can get back to you about a project.' +
      '</p>' +
      '<a class="btn btn--primary btn--sm" href="register.html">Finish signup</a>' +
    '</div>';

  const header = document.querySelector('.site-header');
  if (header && header.parentNode) header.insertAdjacentElement('afterend', bar);
  else document.body.prepend(bar);
}

function removeBanner() {
  const bar = document.getElementById('profile-banner');
  if (bar) bar.remove();
}

async function render(user) {
  if (!user) {
    slots.forEach((slot) => {
      slot.innerHTML = signedOutMarkup(slot.hasAttribute('data-auth-nav-mobile'));
    });
    removeBanner();
    return;
  }

  const complete = await hasProfile(user.uid);

  slots.forEach((slot) => {
    slot.replaceChildren(
      chipFor(user, complete, slot.hasAttribute('data-auth-nav-mobile'))
    );
  });

  if (complete) removeBanner();
  else showBanner(user);
}

if (slots.length) {
  onAuthStateChanged(auth, render);

  // Another tab finished the form. Drop the cached "incomplete" answer and
  // re-check, so the banner here closes too.
  onProfileComplete(() => {
    checked.clear();
    render(auth.currentUser);
  });

  // Back/forward navigation can restore this page from the bfcache with its
  // DOM intact and no scripts re-run — which is how a completed signup could
  // still be showing the banner. persisted tells us that happened.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    checked.clear();
    render(auth.currentUser);
  });
}
