# APOVIX-WEBSITE

Marketing site for **Apovix Technologies** — a two-person software studio in Kashmir
building custom software, websites and AI tools for businesses.

Static HTML, CSS and vanilla JavaScript. No build step, no dependencies — open
`index.html` in a browser, or serve the folder with any static host.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Homepage — hero, services, work, process, about, contact |
| `about.html` | About the studio, founders, company details |
| `privacy-policy.html` | Privacy Policy (DPDP Act 2023 / IT Act 2000) |
| `terms.html` | Terms & Conditions |
| `refund-policy.html` | Refund & Cancellation Policy |

## Admin panel

`/admin/` is a private control panel for the site, at
`https://apovix-website.web.app/admin/`. It is not linked from the public site
and is excluded from search engines via `robots.txt` and an `X-Robots-Tag`
header.

| Page | Does |
| --- | --- |
| `admin/index.html` | Sign in (Firebase Auth, email + password) |
| `admin/dashboard.html` | Enquiry counts and the latest arrivals |
| `admin/enquiries.html` | Read, filter, status and delete contact form submissions |
| `admin/content.html` | Edit the contact details, hero copy and announcement bar |
| `admin/users.html` | Grant and revoke admin access |

### Access model

Signing in is not enough. Every page and every Firestore rule requires a
document at `/admins/{uid}` matching the signed-in user's Firebase Auth UID.
Two roles: `owner` (can manage users) and `admin` (everything else).

### Data

| Collection | Read | Write |
| --- | --- | --- |
| `enquiries` | admins only | anyone may create a valid one; admins update/delete |
| `siteContent` | public | admins only |
| `admins` | admins only | owners only |

Rules live in `firestore.rules`. The public contact form writes an enquiry
directly from the browser — `firestore.rules` validates every field, forces
`status: 'new'` and requires the server clock for `createdAt`, so a crafted
request cannot backdate or pre-approve itself.

## Structure

```
assets/
  css/styles.css      all styles, mobile-first, one file
  js/main.js          menu, scroll reveal, form validation, hero canvas
  js/enquiry.js       sends the contact form to Firestore
  img/                logo mark and favicon
  project_images/     work screenshots
admin/
  *.html              panel pages, each with its own inline module script
  assets/css/         panel styles
  assets/js/          Firebase init and the auth guard
firestore.rules       who can read and write what
```

## Before this goes live

The three legal pages and the About page contain **46 highlighted
`[TO BE FILLED]` placeholders** — company registration details, retention
periods, payment terms, IP ownership and the Grievance Officer. They render with
a yellow background so they cannot be missed. Every one must be filled or
removed before the site is published.

## First-time admin setup

Firestore and its rules are already deployed, and the panel supports **Google
sign-in** and email/password — whichever providers are enabled in the console.

The first admin has to be created by hand. Nobody can grant access from inside
the panel until one owner exists, because the rules require an existing owner.

1. **Sign in** at `/admin/` with **Continue with Google**. You will be rejected —
   that is expected. The page then shows your **Firebase User UID** with a copy
   button.
2. **Create the owner record** —
   [Firestore → Data](https://console.firebase.google.com/project/apovix-website/firestore/data)
   → start collection `admins` → document ID = the UID you copied → fields:

   | Field | Type | Value |
   | --- | --- | --- |
   | `name` | string | your name |
   | `email` | string | the Google account's email |
   | `role` | string | `owner` |
   | `createdAt` | timestamp | now |

3. **Sign in again.** The panel opens.

After that, add people from the Users page — for a Google account they must sign
in once first so their UID exists.
