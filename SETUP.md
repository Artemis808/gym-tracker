# Gym Tracker — Setup Guide

Your all-in-one gym + Garmin tracker, with **real-time sync across every device** —
exactly like the wedding tracker. Log a set on your phone at the gym, open the same URL
on your laptop, and it's already there. Share the URL with a training partner and you both
see the same data live.

Black / gold / silver theme · 619-exercise library with demo photos · PR tracking ·
templates · body-weight log · rest timers · daily-cycling quotes · Garmin stats tab.

You need ~15 minutes and three free accounts: **Google** (Firebase), **GitHub**, **Vercel**.

---

## Step 1 — Create the Firebase project

1. Go to **https://console.firebase.google.com**
2. **Create a project** → name it `gym-tracker` → disable Google Analytics → **Create**

## Step 2 — Create the Realtime Database

1. Left sidebar: **Build → Realtime Database** → **Create Database**
2. Location: nearest to you (India → `asia-southeast1`)
3. Start in **test mode** → **Enable**

## Step 3 — Get your config and paste it in

1. Click the **⚙ gear → Project settings**
2. Under **Your apps**, click the **`</>`** (web) icon → register app (any nickname) → **Register**
3. Copy the `firebaseConfig` values shown
4. Open **`src/firebase.js`** in this project and replace each `PASTE_YOUR_…` with your real
   values. Make sure `databaseURL` is filled — that's the one that turns sync on.

## Step 4 — Lock the database rules (do this before sharing the URL)

In **Realtime Database → Rules**, paste this and **Publish**:

```json
{
  "rules": {
    "gymx": { ".read": true, ".write": true }
  }
}
```

This keeps access scoped to the app's data. (Test mode otherwise expires after 30 days and
sync would silently stop — these rules prevent that.)

## Step 5 — Put the project on GitHub

1. **github.com/new** → name `gym-tracker` → **Create repository**
2. Use the **"uploading an existing file"** link → drag in **everything in this folder**
   (the `src` folder including your edited `firebase.js`, the `api` folder, `package.json`,
   `vite.config.js`, `index.html`, `requirements.txt`, this file) → **Commit changes**

## Step 6 — Deploy on Vercel

1. **vercel.com/new** → Import `gym-tracker` → **Deploy** (Vite auto-detected, change nothing)
2. ~1 minute later you get your URL, e.g. `gym-tracker-xxxx.vercel.app`

Open it. The header should show a **SYNCED** pill with a gold pulse — sync is live.
**This URL is the one you bookmark and share** with any other device or person.

## Step 7 — Connect Garmin (optional, for the Garmin tab)

1. Vercel → your project → **Settings → Environment Variables** (Environment: Production):
   - `GARMIN_EMAIL` = your Garmin Connect email
   - `GARMIN_PASSWORD` = your Garmin Connect password
2. **Deployments → ⋯ → Redeploy**
3. Open the app → **Garmin** tab → steps, resting HR, sleep, body battery, stress, calories.
   Use ‹ › to browse days, ↻ to refresh.

If your Garmin account uses MFA and login fails, drop the working `api/garmin-sync.js` from
your IF tracker repo into this `api/` folder (delete `garmin-sync.py` + `requirements.txt`).
The app displays whatever JSON the endpoint returns.

## Step 8 — Add to your phone

Open the URL in your phone browser → menu → **Add to Home Screen**. Opens full-screen.

---

## How sync behaves

- **SYNCED** (gold pulse) — connected, every change is shared live across devices.
- **OFFLINE** (silver) — no connection; the app still works and changes sync when you reconnect.
- **SYNC ERROR** (red) — usually a wrong `firebase.js` value or unpublished rules (Steps 3–4).
- No pill at all — you deployed without a Firebase config; the app runs single-device on that
  browser. Fill `firebase.js` and redeploy to turn sync on.

Conflict handling: each data section (history, templates, weights, settings, active workout)
syncs independently, last-write-wins. In practice you and a partner editing different things
never collide; simultaneous edits to the *same* item keep the most recent.

---

## Troubleshooting

- **Stuck "Loading…"** → `databaseURL` wrong/empty in `firebase.js`, or rules not published.
- **Pill says OFFLINE on a good connection** → recheck Steps 3 and 4; test in an incognito window.
- **Vercel build fails** → confirm `package.json` is in the repo root and all files were pushed.
- **Data missing on another device** → both must use the **exact same Vercel URL**.
- **Reset everything** → Firebase Console → Realtime Database → ⋯ at the top of the data → Delete.

## Backups

Settings → Export gives CSV (one row per set, ready for Excel) and full JSON. Firebase is your
live source of truth; export occasionally as an offline backup.
