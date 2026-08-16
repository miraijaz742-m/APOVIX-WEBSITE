// Firebase App Check — one place, used by both the public site and the panel.
//
// The problem it solves: the contact form writes to Firestore straight from
// the browser, so the project id is public. Anyone can read it out of the page
// and post enquiries with curl, never touching the website. firestore.rules
// validates the *shape* of what arrives; it cannot tell a real visitor from a
// script. App Check attaches a token proving the request came from this site
// on a real browser, and Firestore rejects anything without one.
//
// The site key below is PUBLIC — reCAPTCHA site keys are meant to be in the
// page. The matching secret key lives only in the Firebase console.

// ---------------------------------------------------------------------------
// PASTE THE reCAPTCHA SITE KEY HERE.
// Firebase console -> App Check -> Apps -> the web app -> reCAPTCHA v3.
// Leave it empty and App Check simply stays off; nothing else breaks.
// ---------------------------------------------------------------------------
export const RECAPTCHA_SITE_KEY = '';

/**
 * Attach App Check to a Firebase app.
 *
 * Must run before anything else touches Firestore or Auth, otherwise the first
 * few calls go out untokenised and get rejected once enforcement is on.
 *
 * Returns true when it was actually attached.
 */
export async function attachAppCheck(app) {
  if (!RECAPTCHA_SITE_KEY) return false;      // not configured yet

  try {
    const { initializeAppCheck, ReCaptchaV3Provider } =
      await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app-check.js');

    // Local development has no verifiable domain. Firebase prints a debug
    // token to the console on first run; register it under App Check ->
    // Manage debug tokens, and localhost keeps working while production
    // stays enforced.
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
    return true;
  } catch (err) {
    // Never let this break the page. Before enforcement is switched on a
    // failure here costs nothing; after it, requests fail loudly anyway.
    console.warn('App Check not attached:', err);
    return false;
  }
}
