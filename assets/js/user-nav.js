// Swaps the header's "Sign in" link for the signed-in visitor's avatar.
//
// Runs on every public page. Fails silently: if Firebase cannot load, the
// nav simply keeps saying "Sign in", which is still a working link.

import { auth, avatarFor } from './fb.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

const slots = document.querySelectorAll('[data-auth-nav]');
if (slots.length) {
  onAuthStateChanged(auth, (user) => {
    slots.forEach((slot) => {
      const isMobile = slot.hasAttribute('data-auth-nav-mobile');

      if (!user) {
        slot.innerHTML = isMobile
          ? '<a href="login.html" data-menu-link>Sign in</a>'
          : '<a href="login.html">Sign in</a>';
        return;
      }

      const first = (user.displayName || user.email || '').split(/[\s@]/)[0];

      const link = document.createElement('a');
      link.className = 'user-chip';
      link.href = 'account.html';
      if (isMobile) link.setAttribute('data-menu-link', '');
      link.setAttribute('aria-label', 'Your account, signed in as ' + (user.email || first));

      link.appendChild(avatarFor(user, isMobile ? 32 : 28));

      const name = document.createElement('span');
      name.className = 'user-chip__name';
      name.textContent = first || 'Account';
      link.appendChild(name);

      slot.replaceChildren(link);
    });
  });
}
