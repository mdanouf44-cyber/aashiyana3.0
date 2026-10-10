# Aashiyana — Registration Website

A sleek, poster-inspired registration site for **Aashiyana**, the Annual Celebration 2026.  
Built with **React + Vite**, styled with **TailwindCSS v3**, animated with **GSAP + ScrollTrigger + Lenis**.

---

## Quick Start

```bash
npm install
cp .env.example .env        # then fill in your Apps Script URL
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Editing Content

All event text, coordinator info, and event list live in one file:

```
src/data/event.js
```

Change the `event` object, `lineup` array, `contacts` array, and `social` object — the whole site updates automatically.

---

## Google Sheets Backend — Setup

### 1. Create a Google Sheet
- Add a sheet tab named **Registrations** (or change `SHEET_NAME` in `Code.gs`).
- Leave the first row blank — the script adds headers automatically.
- Copy the **Sheet ID** from the URL:  
  `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit`

### 2. Deploy the Apps Script
1. Go to [script.google.com](https://script.google.com) → **New project**.
2. Paste the contents of `apps-script/Code.gs`.
3. Replace `YOUR_GOOGLE_SHEET_ID_HERE` with your actual Sheet ID.
4. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy** and **Authorise** when prompted.
6. Copy the generated **Web App URL**.

### 3. Add the URL to your `.env`
```
VITE_SHEET_ENDPOINT=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

### 4. Redeploy after any code change
Apps Script does **not** update existing deployments automatically. After any change to `Code.gs`, go to **Deploy → Manage deployments → Edit (pencil icon)** and select **New version**.

---

## Features
- ✦ Poster-inspired Hero with live countdown
- ✦ 12-event Lineup grid — click any event to pre-fill the form
- ✦ USN format validation, duplicate-check on the server
- ✦ Conditional team fields (Group Dancing / Singing / Skit)
- ✦ Success ticket with **Save as Image** and **WhatsApp Share**
- ✦ Fullscreen mobile menu with numbered links
- ✦ Smooth scroll via Lenis, GSAP ScrollTrigger reveals
- ✦ Registration deadline cutoff (set `registrationDeadline` in `event.js`)
- ✦ Responsive — tested at 360px, 390px, 768px, 1280px

---

## Project Structure
```
src/
  App.jsx                — root, Lenis + GSAP setup
  index.css              — global styles, film grain, utilities
  data/
    event.js             — ALL editable content
  lib/
    submit.js            — Google Sheets POST helper
  components/
    Navbar.jsx
    Hero.jsx
    About.jsx
    Lineup.jsx
    Register.jsx
    Contact.jsx
    Footer.jsx
apps-script/
  Code.gs                — Google Apps Script backend
```

---

## Environment Variables
| Variable | Description |
|---|---|
| `VITE_SHEET_ENDPOINT` | Google Apps Script Web App URL |

---

## Deployment
```bash
npm run build            # outputs to dist/
```
Deploy the `dist/` folder to **Vercel**, **Netlify**, or any static host.  
Make sure to set `VITE_SHEET_ENDPOINT` in your host's environment variables dashboard.

---

*© 2026 Aashiyana*
