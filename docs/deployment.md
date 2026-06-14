# Deployment

## Vercel
1. Push the repo to GitHub.
2. Import into Vercel.
3. Set `AUTH_SECRET`, `DATABASE_URL`, `DIRECT_URL`, and `GROQ_API_KEY`.
4. Run Prisma migrations during deploy.

## Database
- Use PostgreSQL. Local PostgreSQL is the fastest stable development option; Supabase or Railway also work if you want hosted Postgres later.

## Notes
- The AI layer falls back gracefully if Groq is unavailable.
- The app is usable with seed data even before custom datasets are ingested.
