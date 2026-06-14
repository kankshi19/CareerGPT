# Manual Actions Needed

1. Create a local PostgreSQL database named `careergpt`.
2. Set `AUTH_SECRET`, `DATABASE_URL`, `DIRECT_URL`, and `GROQ_API_KEY` in `.env`.
3. Run `npm install`, `npx prisma generate`, `npx prisma migrate dev`, and `npm run db:seed`.
4. Optionally replace the seeded datasets with new CSV/XLSX sources in `data/raw/`.
5. Deploy with the same Prisma/PostgreSQL setup when ready.

## Can continue with defaults?
Yes. The app ships with seeded demo data and deterministic recommendations without external datasets.
