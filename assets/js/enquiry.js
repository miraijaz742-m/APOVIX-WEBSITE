// Public contact form -> Firestore.
//
// Loaded as a module so it never blocks the page. main.js validates the form
// and then calls window.apovixSubmitEnquiry; if this file fails to load for
// any reason, main.js falls back to logging rather than losing the enquiry.
//
// The config here is the public web config, shipped to every browser by
// design. Write access is constrained by /firestore.rules: an anonymous
// visitor may create an enquiry that passes validation and nothing else.
// They cannot read anyone else's.

import { db } from './fb.js';
import { collection, addDoc, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

window.apovixSubmitEnquiry = function (payload) {
  return addDoc(collection(db, 'enquiries'), {
    name:        payload.name,
    email:       payload.email,
    company:     payload.company || '',
    projectType: payload.projectType || '',
    message:     payload.message,
    // Server clock, not the visitor's — the rules require this exact value.
    createdAt:   serverTimestamp(),
    status:      'new',
    source:      window.location.pathname
  });
};
