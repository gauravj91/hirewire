# HireWire

**A free, local-first job feed aggregator and application tracker that runs in your browser.**
Live at **[hirewire.fyi](https://hirewire.fyi/)** · [90-second demo video](https://hirewire.fyi/guide.html#see-it-in-action) · [Guide & FAQ](https://hirewire.fyi/guide.html) · [Deutsch](https://hirewire.fyi/de/)

HireWire pulls 55 public job feeds into one list, ranks every posting with a match score you can read, and tracks your applications from saved to offer. There's no account, and your profile, CV text and pipeline stay in your browser. It also has a free ATS CV builder, and optional AI features (a fit score, **Reach out** drafts to the hiring manager, and AI writing) sold as one-time passes from €9.

> Not to be confused with other products called HireWire (hirewire.com, hirewire.io and others). This is hirewire.fyi, made by Gaurav Jindal in Berlin.

## Features

- **One wire, 55 feeds.** Public job boards plus companies' own career boards, fetched by your browser and refreshed hourly while the app is open. Optional bring-your-own-key sources: Adzuna (13 countries) and Jooble.
- **Transparent match score.** The formula is published: base 32, +13 per skill of yours in the title, +7 in tags or description, +12 if pay meets your floor (−18 below, −3 if unstated), up to +9 for freshness (−8 if stale), +4 remote, −28 per blocked word. Nobody can pay to rank higher.
- **Pipeline tracker.** Saved → applied → screen → interview → offer, with notes, contacts, next dates, follow-up reminders with email drafts, calendar (.ics) export, insights and offer comparison.
- **Ghost-job risk.** Every posting gets a Low/Medium/High heuristic flag with reasons (age, reposts, talent-pool wording, no pay…), plus "Hide ghosts". It's a risk signal, not proof.
- **Free ATS CV builder** ([cv-builder.html](https://hirewire.fyi/cv-builder.html), German: [Lebenslauf-Vorlage](https://hirewire.fyi/de/lebenslauf-vorlage.html)). Three single-column, ATS-friendly templates plus a German tabular Lebenslauf, PDF with real text via the browser's print dialog, no sign-up, no watermark. The CV is saved only in your browser; one click hands it to the app for job matching.
- **Reach out (AI outreach drafts).** On any posting, drafts a short email to the hiring manager or the contact named in the posting (under 120 words), a LinkedIn note (under 300 characters) and a day-5 follow-up, in English or German, from your CV and the posting only. It opens in your own mail app; HireWire never sends email, and the contact's address stays in your browser. The job is marked "Reached out" and the follow-up reminder comes due on day 5. 1 free draft, then included in every pass. [Cold email template](https://hirewire.fyi/cold-email-hiring-manager.html) · [Initiativbewerbung (DE)](https://hirewire.fyi/de/initiativbewerbung-anschreiben.html)
- **Salary reality check.** Median and P25–P75 pay from the postings in your own feeds, in your currency.
- **Agent briefs.** Export your profile and scored shortlist as Markdown, JSON or CSV for Claude Code, Cursor or Codex CLI.
- **Installable (PWA)**, works offline once loaded; local notifications only (no push server).
- **Optional AI (paid or own key).** 3 free AI fit scores and 1 free Reach out draft, then a one-time pass: €9 for 7 days or €19 for 30 days (AI fit scores + Reach out drafts), or €29 Pass Plus for 30 days (adds cover letters, interview prep, a tailored CV draft and a negotiation script). No subscription. Or use your own Anthropic API key for free from HireWire.
- **Free tools:** [ATS CV builder](https://hirewire.fyi/cv-builder.html), [ghost job checker](https://hirewire.fyi/ghost-job-checker.html), [salary checker](https://hirewire.fyi/salary-checker.html), [resume privacy check](https://hirewire.fyi/resume-privacy-check.html).

Limits, honestly: only postings from the feeds can be saved (no manual job entry and no import from other trackers yet), the app's interface is in English, and the feeds lean towards remote and tech roles.

## Privacy model

- **No account, no user database.** Everything you enter is stored in your browser: `localStorage`, mirrored to IndexedDB (`hirewire-kv`). A backup is one JSON file you keep.
- **Job feeds** are fetched directly by your browser from the public APIs. They see your IP address, not your profile.
- **Your CV leaves the browser only when you ask for an AI feature**, for that one request: to HireWire's small serverless function and on to Google's Gemini API (paid tier), or straight to Anthropic if you use your own key. HireWire doesn't store it.
- **Optional encrypted sync** (included with any pass) uploads only ciphertext, encrypted on your device (AES-256-GCM) with a recovery code only you hold.
- **Analytics** on the app page are opt-in only (PostHog, cookieless, named feature events only, never job titles, searches, skills, CV, notes or salary). Do Not Track / Global Privacy Control count as no. The guide, tool and German pages load no analytics. No ad trackers.

Full details: [privacy policy](https://hirewire.fyi/privacy.html).

## Job feeds (summary)

55 feeds, all verified to allow browser (CORS) access in October 2026:

- **6 job boards:** Remotive, Arbeitnow, Jobicy, RemoteOK, We Work Remotely, Hacker News "Who is hiring?"
- **49 company career boards:** Greenhouse (25), Ashby (13), Lever (3), SmartRecruiters (3), Personio (3), Workable (1), Recruitee (1), including German and EU employers such as N26, Celonis, HelloFresh, Trade Republic, Delivery Hero, SIXT and Bosch.

## Run it locally

The app is a single static `index.html` with no build step and no dependencies to install. Serve the folder over HTTP (the service worker and some browser APIs don't work from `file://`):

```sh
git clone https://github.com/gauravj91/hirewire.git
cd hirewire
python3 -m http.server 8000
# open http://localhost:8000/
```

Job feeds load straight from their public APIs. The optional AI features call HireWire's hosted API, which accepts `http://localhost` origins. Your data in a local copy lives in that origin's browser storage, separate from hirewire.fyi.

## What's in this repo

The static site served on GitHub Pages at hirewire.fyi: the app (`index.html`, `sw.js`, `manifest.webmanifest`), the guide, comparison, tool and German pages, `assets/` (fonts, scripts, demo videos), `sitemap.xml`, `robots.txt`, `llms.txt` and `llms-full.txt`. The serverless API behind the optional AI features is not in this repository. Each deploy pings [IndexNow](https://www.indexnow.org/) with the sitemap URLs.

## Contact

Gaurav Jindal · [hey@hirewire.fyi](mailto:hey@hirewire.fyi) · [Imprint](https://hirewire.fyi/imprint.html)

## License

**TBD.** No license has been chosen yet, so for now all rights are reserved. A license will be added to this repository once it's decided.
