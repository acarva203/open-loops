# ⭕ OpenLoops — Multi-Engagement Outliner & Timeblocking Engine

> **A fluid, Workflowy-inspired executive outliner and visual day planner built for high-output individuals juggling multiple simultaneous roles, research labs, internships, and leadership commitments.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.x-646cff.svg?logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg?logo=tailwindcss)
![Google Calendar](https://img.shields.io/badge/Google_Calendar-API-4285F4.svg?logo=googlecalendar)
![Vercel](https://img.shields.io/badge/Vercel-Cron_Ready-000000.svg?logo=vercel)

---

## 🎯 The Core Problem Solved

When juggling multiple high-stakes engagements (e.g. Club Presidencies, Research Labs, Industry Internships, Coursework), traditional productivity tools fail in two major ways:
1. **Blind Workload & Dropped Balls**: You lose visibility over your aggregate cognitive inventory across all domains.
2. **Context-Switching Anxiety**: Focusing on one project is disrupted by lingering anxiety about open loops in another.

**OpenLoops** solves this through a **Dual-Mode System**:
- **Executive Command Center (Bird's-Eye View)**: Real-time inventory of all active roles with live loop counters, a segmented workload spectrum, and instant brain-dump capture.
- **Workflowy Deep Focus Outliner (Distraction-Free)**: Zoom into any specific engagement to eliminate all noise, breaking deliverables down into infinite nested sub-bullets and actionable checklists.

---

## ✨ Key Features

### 1. ⚡ Executive Command Center
- **Cognitive KPIs**: Instant tally of **Total Open Loops**, **Closed Loops**, and **Timeblocked Focus Hours Today**.
- **Segmented Workload Distribution Spectrum**: Multi-color proportion bar showing the percentage breakdown of active loops across all your roles.
- **Interactive Quick-Capture Omnibar**: Capture thoughts into any role in under 2 seconds without leaving the home screen. Includes role selector and `#urgent`, `#next`, `#waiting` quick tag toggles.
- **Smart Filter & Sort**: Filter by `Needs Attention` (`#urgent`/`#next`) or `Waiting On` (`#waiting`), sort by `Most Open Loops`, or search across all loops.

### 2. 🌲 Workflowy-Grade Infinite Outliner
- **Infinite Recursive Hierarchy**: Nest deliverables, sub-tasks, and dependencies to unlimited depth.
- **Move / Reorder Mode (Toggle Feature)**: Click **Move Bullets** in the toolbar to reveal quick shift arrows (`▲ / ▼`) and drag handles (`⋮⋮`) for intuitive HTML5 drag-and-drop tree reordering.
- **Keyboard Tree Shifting (`Alt + ↑ / ↓`)**: Effortlessly move any bullet up or down among its siblings without lifting your fingers from the keyboard.
- **Breadcrumb Zoom Navigation**: Click any bullet dot to focus entirely on that sub-branch as its own clean root.
- **Micro-Subnotes (`Shift + Enter`)**: Add context, specs, and links underneath any bullet.
- **Instant Gratification Closure (`Cmd + Enter`)**: Checks off loops, triggers celebratory micro-confetti, strikes through text, logs completion timestamps, and decrements counters in real-time.
- **Clickable Tag & Mention Pills**: Detects `#urgent`, `#waiting`, `#next`, `#tax`, and `@mentions` with 1-click filtering.

### 3. 📅 Timeblocking & Google Calendar Sync
- **"Today's Schedule" Sidecar (`Cmd + /`)**: Slide-out 8:00 AM – 10:00 PM visual timeline with current time indicator.
- **Two-Way Busy Slot Detection**: Visualizes fixed commitments (classes, meetings, lectures) alongside open focus gaps.
- **1-Click Loop Scheduling**: Hover over any bullet in the outliner and click the **Clock** icon to drop it into today's timeline.
- **Actionable Checklist Sync**: Scheduling a parent block automatically extracts its sub-bullets into a formatted checklist in the Google Calendar event description.
- **Two-Way Deletion Sync**: Deleting a block from the app automatically removes the event from Google Calendar via the API.
- **Dedicated Calendar Partitioning**: Syncs to an isolated secondary calendar (`"Open Loops Focus"`) so your primary calendar remains clean.

### 4. 🔄 Zero-Prompt Automated Cloud Cron
- **Vercel Cron (`0 8 * * *`)**: Built-in serverless daily morning cron runner (100% free on Vercel Hobby plan).
- **Persistent Offline OAuth**: Authenticate once with Google; the serverless `/api/cron` endpoint silently exchanges the `refresh_token` for fresh access credentials in the cloud (~100ms) with **zero browser popups or prompts**.
- **1-Click .ICS Export**: Download standard iCalendar files for offline import into Apple Calendar or Google Calendar.

---

## ⌨️ Keyboard Power Shortcuts

Press **`?`** anywhere in the app to open the keyboard cheatsheet modal:

| Shortcut | Action |
| :--- | :--- |
| **`Enter`** | Create a new sibling bullet below current line |
| **`Tab`** | Indent bullet (nest as child of preceding sibling) |
| **`Shift + Tab`** | Outdent bullet (move up one level) |
| **`Alt + ↑ / ↓`** *(Option on Mac)* | Move / reorder bullet up or down among siblings |
| **`Cmd / Ctrl + Enter`** | Mark loop complete / closed (or re-open) |
| **`Shift + Enter`** | Add or edit a detailed sub-note / context description |
| **`Backspace`** *(on empty)* | Delete empty bullet and return focus to previous item |
| **`↑ / ↓`** | Navigate cursor focus smoothly across visible outline nodes |
| **Click Bullet Dot** | Zoom into any bullet as its own focused root |
| **Click Breadcrumb** | Zoom back out to any parent level or All Engagements |
| **`Cmd / Ctrl + /`** | Open / close Today's Timeblock Schedule drawer |
| **`Esc`** | Exit zoomed view, close modals, or dismiss drawers |

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti
- **Serverless API**: Node.js runtime (`api/auth/`, `api/cron.ts`, `api/sync.ts`)
- **Integration**: Google Identity Services (GIS), Google Calendar REST API v3, iCalendar standard
- **Hosting & Cron**: Vercel Serverless Functions + Vercel Cron (`vercel.json`)
- **Persistence**: Hybrid Dual-Layer Storage (Client-side IndexedDB for instant offline persistence + Cloud PostgreSQL sync via Neon/Supabase serverless API `/api/data`)

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install
```bash
git clone https://github.com/acarva203/open-loops.git
cd open-loops
npm install
```

### 2. Start Dev Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build & Typecheck
```bash
npm run build
```

---

## ☁️ 100% Free Deployment (Vercel)

OpenLoops is architected to run **100% free forever** on standard developer free tiers:

| Component | Provider & Tier | Monthly Cost |
| :--- | :--- | :--- |
| **Hosting & SSL** | Vercel (Hobby Tier) | **$0.00 / mo** |
| **Automated Background Cron** | Vercel Cron (`0 8 * * *` daily) | **$0.00 / mo** |
| **Google Calendar API** | Google Cloud Console (1M req/day) | **$0.00 / mo** |

### Deploy Steps:
1. Push your code to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Configure Environment Variables in Vercel settings (see [`.env.example`](.env.example)):
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` (e.g. `https://your-app.vercel.app/api/auth/callback`)
   - `CRON_SECRET`
4. Click **Deploy**. Vercel will host the app and activate the daily morning background cron job automatically!

---

## 📄 License

MIT © [acarva203](https://github.com/acarva203)
