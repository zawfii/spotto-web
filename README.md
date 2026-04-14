# Spotto Web — Shared Lists

A Next.js web interface for viewing Spotto shared food lists.

## Setup

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Development

```bash
npm run dev
```

Open http://localhost:3000

## Build & Deploy

```bash
npm run build
npm start
```

Deploy to Vercel:

1. Push repo to GitHub
2. Go to vercel.com
3. Import the repo
4. Set environment variables in project settings
5. Deploy

## Routes

- `/` — Home page with info
- `/list/[slug]` — View shared Spotto list by slug
