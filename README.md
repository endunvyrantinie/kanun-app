# Kanun (Next.js app)

Malaysian HR & Employment Law, played in 60 seconds.
Production app — successor to the static demo at `../index.html`.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Firebase Auth + Firestore *(planned)*
- Stripe *(planned)*

## Deployment

Push to GitHub, import to Vercel. Vercel auto-detects Next.js, runs `npm run build`, and serves the result on a global CDN.

## Status

Early scaffold. Not yet wired to auth, database, or payments. The static demo at `kana-jade-seven.vercel.app` remains the public-facing version until this catches up.
