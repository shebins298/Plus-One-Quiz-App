# How the Plus One Quiz App Was Built

A reference for building similar apps: what we used, why, and the actual sequence of steps — including the parts that didn't go smoothly.

---

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Database + Auth** | [Supabase](https://supabase.com) (Postgres) | Free tier covers this scale easily (500MB DB, 50K monthly active users). Built-in Google OAuth. Row-Level Security (RLS) means the database itself enforces who can see what — not just app code, which can have bugs. |
| **Frontend** | React + TypeScript + Vite | Vite gives fast builds and a simple dev server. TypeScript catches bugs before they ship (e.g. mismatched field names between frontend and database). |
| **Styling** | Tailwind CSS v4 | Fast to write, and CSS variables (`@theme`) make it easy to define a consistent design system (colors, fonts) once and reuse everywhere. |
| **Hosting** | Vercel | Free tier, auto-deploys from GitHub on every push, handles the build step. |
| **Routing** | React Router | Standard for single-page apps with multiple screens (login, quiz, admin, etc). |
| **Charts** | Recharts | For the admin analytics dashboard. |

**Why Supabase over building a custom backend:** a custom Node/Express + database setup would need us to hand-write authentication, authorization checks, and hosting for a server — all things Supabase provides out of the box, for free, at this scale. The trade-off is less flexibility for very custom backend logic, but Postgres functions (see below) cover that gap.

**Why Vercel over other hosts:** free tier, zero-config deploys for Vite projects, and it auto-redeploys whenever you push to GitHub — no manual re-upload needed after the first setup.

---

## 2. Architecture

### Auth flow
1. Student clicks "Continue with Google" → Supabase handles the OAuth redirect
2. On first login, a Postgres trigger (`handle_new_user`) automatically creates a row in `profiles` for them
3. If their email matches the admin list in `app_settings`, they're marked `role = 'admin'` automatically — everyone else is `role = 'student'`
4. The frontend checks `profile.role` and shows either the student view or the admin dashboard

### Database tables
```
profiles       — one row per user (name, school, role, active/banned status)
chapters       — one row per chapter (title, published or draft, attempt limit)
questions      — MCQs belonging to a chapter (options stored as JSON, correct answer, explanation)
quiz_attempts  — one row per attempt a student makes at a chapter's quiz
quiz_answers   — one row per question answered within an attempt
app_settings   — single-row config table (default attempt limit, admin email list)
```

### The key security idea: Row-Level Security (RLS)
Every table has RLS turned on. This means Postgres itself — not the app's JavaScript — decides what each user can see or change. For example:
- A student can only `SELECT` their own `profiles` row and their own `quiz_attempts`
- Only an admin can `DELETE` a student or edit `questions`
- Students have **no direct read access** to the `questions` table's `correct_option_id` or `explanation` columns at all — even if someone inspected the app's network traffic, the correct answers aren't there until they submit

### Business logic lives in the database, not just the frontend
Instead of trusting the React app to enforce "you've used all your attempts" or "here's whether that answer was right," those rules are Postgres functions (`start_quiz_attempt`, `submit_answer`, `complete_quiz_attempt`, etc.) that run securely on the server. A student could tamper with the app in their browser and it wouldn't matter — the database still enforces the real rules. This is the difference between "the app looks secure" and "the app **is** secure."

---

## 3. Build Sequence (what we actually did, in order)

1. **Scoped requirements first** — number of students, one subject vs. many, review-before-publish workflow for questions, timed vs untimed quizzes, instant vs end-of-quiz feedback. Getting this clear up front avoided rework later.
2. **Created the Supabase project** and designed the schema — tables, then RLS policies, then the Postgres functions for quiz logic. Ran the security advisor (`get_advisors`) after each change to catch missing RLS or overly-permissive functions.
3. **Set up Google OAuth** — this was the fiddliest manual part (see Gotchas below). Google's console UI has changed significantly and doesn't match most tutorials anymore.
4. **Scaffolded the frontend** — Vite + React + TypeScript, Tailwind v4, a small design-token system (see below), then built screens in order: login → onboarding → student chapter list → quiz-taking → admin dashboard.
5. **Deployed to Vercel** — this had to be done manually (see Gotchas), by uploading the code to GitHub and importing it into Vercel's dashboard.
6. **Built the content pipeline** — the actual quiz questions come from feeding a chapter PDF and having them drafted, inserted into the database as unpublished, then reviewed/edited/published from the admin panel.
7. **Iterated based on real use** — added "review your mistakes" and "practice weak questions" once the core app was working, rather than trying to design every feature upfront.

---

## 4. Design System Approach

Rather than default styling, we defined a small token system once in `src/index.css` using Tailwind v4's `@theme`:

```css
@theme {
  --font-display: 'Fraunces', serif;   /* headings — has personality */
  --font-body: 'Manrope', sans-serif;  /* everything else — clean and readable */
  --font-mono: 'IBM Plex Mono', monospace; /* scores and numbers — feels precise */

  --color-ink: #1E2749;      /* primary dark color */
  --color-marigold: #F0A83B; /* primary accent / call-to-action */
  --color-leaf: #1F9D6F;     /* correct / positive */
  --color-coral: #E85C4A;    /* incorrect / destructive */
}
```

A single **signature visual motif** (the radial "score dial") is reused everywhere progress is shown — the student's chapter list, the quiz results screen, and the admin's per-student and class-wide analytics. Repeating one distinctive element consistently makes the whole app feel designed on purpose, rather than assembled from generic components.

---

## 5. Gotchas Worth Knowing About

- **Google's OAuth console changed.** It's no longer under a menu called "OAuth consent screen" — it's now "Google Auth Platform," presented as a setup wizard. Tutorials online may be outdated.
- **The unverified-app warning is avoidable.** If your app only requests basic scopes (`email`, `profile`, `openid` — the standard "sign in with Google" info), Google exempts you from the "this app isn't verified" warning entirely, even without going through their verification process. Extra scopes (Drive, Calendar, etc.) are what trigger it.
- **Personal Gmail accounts don't get an "Internal" audience option** — that's Workspace-only. If you're on a personal account, "External" is automatic; there's nothing to toggle.
- **MCP tool access can be read-only even when a service is "connected."** Our Vercel connector could list projects and deployments but couldn't create one — deployment still had to happen via the Vercel CLI or dashboard. Worth checking what a connector can actually *do* versus just *see* before assuming it can complete a task end-to-end.
- **Tailwind v4 uses a different setup than v3** — CSS-first config via `@theme` in your CSS file, plus the `@tailwindcss/postcss` plugin, rather than a `tailwind.config.js`-driven setup.

---

## 6. Cost

Everything here runs on free tiers:
- **Supabase free tier**: 500MB database, 50K monthly active users — comfortably covers a class-sized app
- **Vercel free tier**: generous bandwidth/build limits for a low-traffic app like this
- **Google OAuth**: free, no usage limits for basic sign-in scopes

This setup would only start costing money at a much larger scale (thousands of active users, heavy database usage) than a single school subject needs.

---

## 7. Reusable Checklist for a Similar App

1. Define the roles (who's an admin vs. a regular user) and exactly what each should and shouldn't be able to see
2. Design the database schema and write RLS policies *before* writing any frontend code
3. Put anything security-sensitive (scoring, limits, permissions) into database functions, not frontend logic
4. Run the security advisor after every schema change
5. Set up auth (Google OAuth via Supabase) early, since it tends to have the most manual, non-automatable steps
6. Build one small design-token system before writing UI screens, so the whole app stays visually consistent
7. Deploy early and often — get a live URL working before building every feature, so you're never debugging a large pile of untested code at once
