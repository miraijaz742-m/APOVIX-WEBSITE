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

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBhAN3PcT-h2F_mNuwPC7wQhKmj9Bo0dGU',
  authDomain: 'apovix-website.firebaseapp.com',
  projectId: 'apovix-website',
  storageBucket: 'apovix-website.firebasestorage.app',
  messagingSenderId: '847136258714',
  appId: '1:847136258714:web:e32665bd9525f1c9ddbd23'
};

const db = getFirestore(initializeApp(firebaseConfig));

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
