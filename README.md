# Plus One Quiz App

Chapter-wise quiz app with Google sign-in, student progress tracking, and an admin dashboard.

## What's already done
- Supabase backend (database, auth, security rules, quiz logic) — fully live
- This React app — connects to that backend and is ready to deploy

## Deploy to Vercel — Option A: CLI (fastest, ~5 min)

1. Install [Node.js](https://nodejs.org) if you don't already have it (just click the big green "LTS" download button and run the installer).
2. Open a terminal in this folder and run:
   ```
   npm install
   npx vercel login
   ```
   (This opens your browser — log in with the same account you connected to Claude.)
3. Deploy:
   ```
   npx vercel --prod
   ```
   Answer the prompts: link to existing team "T1", project name `plus-one-quiz-app` (or whatever you like).
4. When it asks about environment variables, or in the Vercel dashboard afterwards (Project → Settings → Environment Variables), add:
   - `VITE_SUPABASE_URL` = `https://uralmsvmigrngbcnwntx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_f23oEVggNR7VPL-Awz9yUQ_qloAiXvw`
5. Redeploy once (`npx vercel --prod` again) so the build picks up those variables.
6. Copy the live URL Vercel gives you (e.g. `https://plus-one-quiz-app.vercel.app`) — send it back to Claude to finish the last Google OAuth step (adding this URL as an authorized origin).

## Deploy to Vercel — Option B: No terminal, GitHub import

1. Create a new repo on [github.com](https://github.com/new) (any name, e.g. `plus-one-quiz`).
2. On the new repo page, click "uploading an existing file" and drag in everything from this folder **except** `node_modules` and `.env`.
3. In Vercel, go to **Add New → Project → Import Git Repository**, pick that repo.
4. Add the same two environment variables listed above.
5. Deploy, then send the live URL back to Claude.

## Local development
```
npm install
npm run dev
```
