# CareerGPT

CareerGPT is a Next.js + Prisma MVP for student career guidance.

## Completed
- Prisma schema repaired with explicit join tables and opposite relations
- Local PostgreSQL setup documented and wired for Prisma
- Prisma seed command fixed for TypeScript execution
- Auth.js secret wiring fixed
- Sign up and sign in UI added
- Onboarding, dashboard, explore, recommendations, and roadmap flows wired to the current schema
- App build passes

## Stack
- Next.js 15
- TypeScript
- PostgreSQL
- Prisma
- NextAuth / Auth.js
- Groq

## Local env
Create `.env` with:

```env
AUTH_SECRET="your-long-random-secret"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/careergpt?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/careergpt?schema=public"
GROQ_API_KEY="your-groq-api-key"
```

## Run locally
1. Install dependencies: `npm install`
2. Generate Prisma client: `npx prisma generate`
3. Create/apply schema changes: `npx prisma migrate dev`
4. Seed data: `npm run db:seed`
5. Start app: `npm run dev`

## Main routes
- `/auth/signup`
- `/auth/signin`
- `/onboarding`
- `/dashboard`
- `/explore`
- `/roadmap`
- `/admin/upload`

## API routes
- `GET /api/health`
- `GET /api/catalog`
- `GET /api/recommendations`
- `POST /api/roadmap/generate`
- `GET /api/roles`
- `GET /api/skills`
- `GET /api/certifications`
- `GET /api/technologies`
- `GET /api/profile`
- `POST /api/feedback`
- `POST /api/auth/signup`
