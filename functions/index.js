/**
 * Apovix — Cloud Functions
 *
 * This file exists for one reason: work that needs a credential cannot run in
 * the browser. Anything in the website's JavaScript is readable by every
 * visitor, so an SMTP password or an API token has to live here, injected from
 * Google Secret Manager at runtime and never written into the repo.
 *
 * What is NOT secret and deliberately stays in the client: the Firebase web
 * config (apiKey, authDomain, appId...). Those are public identifiers that
 * every Firebase web app ships to the browser by design. Moving them here
 * would break the client SDK and protect nothing. Access is controlled by
 * firestore.rules, not by hiding that key.
 */

const { setGlobalOptions } = require('firebase-functions/v2');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineSecret, defineString } = require('firebase-functions/params');
const { logger } = require('firebase-functions');
const functionsV1 = require('firebase-functions/v1');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// asia-south1 (Mumbai) matches where Firestore lives — a trigger must sit in
// the same region as its database, and it is the closest region to Kashmir.
//
// maxInstances is a cost guard, not a performance setting. Blaze bills per
// invocation, so an unbounded function plus a runaway loop is an unbounded
// bill. Ten concurrent instances is far more than this site will ever need.
setGlobalOptions({
  region: 'asia-south1',
  maxInstances: 10,
  timeoutSeconds: 60,
  memory: '256MiB'
});

/* -------------------------------------------------------------------------
   Secrets and settings
   Secrets are set once with:
     firebase functions:secrets:set SMTP_USER
     firebase functions:secrets:set SMTP_PASS
   They are stored in Google Secret Manager, versioned, and never appear in
   this repository or in the deployed source.
   ---------------------------------------------------------------------- */
const SMTP_USER = defineSecret('SMTP_USER');   // the Gmail address that sends
const SMTP_PASS = defineSecret('SMTP_PASS');   // a Gmail App Password, not the login password

// Not a secret — just configuration, so it can live in plain text.
const NOTIFY_TO = defineString('NOTIFY_TO', {
  default: 'aijazm742@gmail.com',
  description: 'Where new-enquiry alerts are sent'
});

const SITE = 'https://apovix-website.web.app';

/* -------------------------------------------------------------------------
   1. Email an alert the moment an enquiry arrives
   Without this an enquiry sits in Firestore until somebody happens to open
   the admin panel.
   ---------------------------------------------------------------------- */
exports.notifyOnEnquiry = onDocumentCreated(
  { document: 'enquiries/{enquiryId}', secrets: [SMTP_USER, SMTP_PASS] },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const e = snap.data();
    const id = event.params.enquiryId;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: SMTP_USER.value(), pass: SMTP_PASS.value() }
    });

    const lines = [
      ['Name', e.name],
      ['Email', e.email],
      ['Company', e.company || '—'],
      ['Project type', e.projectType || '—'],
      ['Sent from', e.source || '—']
    ];

    const text =
      'New enquiry through the Apovix website.\n\n' +
      lines.map(([k, v]) => k + ': ' + v).join('\n') +
      '\n\nMessage:\n' + (e.message || '') +
      '\n\nOpen it: ' + SITE + '/admin/enquiries.html\n';

    try {
      await transporter.sendMail({
        from: '"Apovix website" <' + SMTP_USER.value() + '>',
        to: NOTIFY_TO.value(),
        // Replying goes straight to the person who wrote in.
        replyTo: e.email,
        subject: 'New enquiry — ' + (e.name || 'unknown') +
                 (e.projectType ? ' (' + e.projectType + ')' : ''),
        text: text
      });
      logger.info('enquiry alert sent', { enquiryId: id });
    } catch (err) {
      // Never rethrow: a retry would resend the same email, and the enquiry
      // itself is already safely stored either way.
      logger.error('enquiry alert failed', { enquiryId: id, error: err.message });
    }
  }
);

/* -------------------------------------------------------------------------
   2. Delete a person's record when their login is deleted
   The Privacy Policy promises erasure on request. Removing the Auth account
   in the console used to leave the users/{uid} document behind — their name,
   phone and business details staying in the database after the account they
   belonged to was gone.
   ---------------------------------------------------------------------- */
exports.cleanupUserOnDelete = functionsV1
  .region('asia-south1')
  .auth.user()
  .onDelete(async (user) => {
    try {
      await admin.firestore().collection('users').doc(user.uid).delete();
      logger.info('user record removed with account', { uid: user.uid });
    } catch (err) {
      logger.error('could not remove user record', { uid: user.uid, error: err.message });
    }
  });
