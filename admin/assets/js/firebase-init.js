// Shared Firebase bootstrap for the admin panel.
//
// The config below is the public web config — it is shipped to every browser
// by design and is not a credential. Access is controlled by the Firestore
// rules in /firestore.rules, which require an /admins/{uid} record.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';
// Shared with the public site so there is one site key, not two that drift.
import { attachAppCheck } from '../../../assets/js/appcheck.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBhAN3PcT-h2F_mNuwPC7wQhKmj9Bo0dGU',
  authDomain: 'apovix-website.firebaseapp.com',
  projectId: 'apovix-website',
  storageBucket: 'apovix-website.firebasestorage.app',
  messagingSenderId: '847136258714',
  appId: '1:847136258714:web:e32665bd9525f1c9ddbd23'
};

export const app = initializeApp(firebaseConfig);

// Before getAuth/getFirestore, so the panel's first request already carries a
// token. If the admin panel were left out, enforcing App Check would lock you
// out of your own control panel.
await attachAppCheck(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
