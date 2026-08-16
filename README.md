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

Firestore and its rules are already deployed. Two things still need the Firebase
console, because both require server credentials a browser page cannot hold:

1. **Enable email sign-in** —
   [Authentication → Sign-in method](https://console.firebase.google.com/project/apovix-website/authentication/providers)
   → enable **Email/Password**.
2. **Create the first account** —
   [Authentication → Users](https://console.firebase.google.com/project/apovix-website/authentication/users)
   → Add user. Copy the **User UID**.
3. **Make it an owner** —
   [Firestore → Data](https://console.firebase.google.com/project/apovix-website/firestore/data)
   → start collection `admins` → document ID = that UID → fields:

   | Field | Type | Value |
   | --- | --- | --- |
   | `name` | string | your name |
   | `email` | string | the same email |
   | `role` | string | `owner` |
   | `createdAt` | timestamp | now |

Step 3 is manual only for the first account — after that, add people from the
Users page in the panel.
