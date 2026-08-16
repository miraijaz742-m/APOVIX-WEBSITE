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

## Structure

```
assets/
  css/styles.css      all styles, mobile-first, one file
  js/main.js          menu, scroll reveal, form validation, hero canvas
  img/                logo mark and favicon
  project_images/     work screenshots
```

## Before this goes live

The three legal pages and the About page contain **46 highlighted
`[TO BE FILLED]` placeholders** — company registration details, retention
periods, payment terms, IP ownership and the Grievance Officer. They render with
a yellow background so they cannot be missed. Every one must be filled or
removed before the site is published.

The contact form on the homepage validates input but has **no backend** — it
logs to the console. It needs wiring to a form handler or an email service.
