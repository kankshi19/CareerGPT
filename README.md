# CareerGPT

CareerGPT is a career guidance platform (Next.js + TypeScript + Prisma) that
ingests job-role and skill datasets, trains lightweight recommendation models,
and serves personalized career recommendations, roadmaps and resume tailoring
through a modern web UI and API.

Goals
- Help users discover target roles, required skills and certifications.
- Generate personalized learning roadmaps and recommendations.
- Provide developer-friendly pipeline for dataset ingestion, model training,
	and deployment.

Key components
- Frontend: Next.js app in `src/` (pages, client components, onboarding,
	dashboard, resume-studio).
- Backend/API: Next.js API routes under `src/app/api/` that expose
	recommendations, roles, skills, certifications and profile extraction.
- Database: Prisma schema and migrations in `prisma/` with seeding in
	`prisma/seed.ts`.
- Data: raw and processed datasets live under `data/` (see `data/raw/` and
	`data/processed/`).
- ML: model training and utilities in `ml/` and `scripts/` (model artifacts
	stored in `ml/models/`).

Project flow (high level)
1. Data collection: raw job/role/skill CSVs are placed in `data/raw/`.
2. Data processing: `scripts/process_datasets.py` and `scripts/ingest.ts`
	 transform raw data into normalized JSON in `data/processed/`.
3. Database seed: `prisma/seed.ts` consumes processed data and populates the
	 database with roles, skills, technologies and mappings.
4. Model training: training scripts (`scripts/train_recommendation_model.py`,
	 `scripts/recommend.ts`) build a simple recommenders and persist artifacts to
	 `ml/models/` (vectorizers, scalers, models).
5. API serving: Next.js API routes load model artifacts (from `ml/models/`)
	 and DB data to produce recommendations and generated roadmaps.
6. Frontend: onboarding and profile flows collect user inputs, call APIs and
	 present recommendations, roadmaps and resume suggestions.
7. Feedback loop: user feedback is stored (`POST /api/feedback`) and used to
	 evaluate and iterate on dataset and model improvements.

Directory map (important files)
- `src/` — application frontend, pages, and API route implementations.
- `prisma/` — schema.prisma, migrations and `seed.ts`.
- `data/raw/` — original CSVs (keep out of GitHub for size reasons).
- `data/processed/` — cleaned/normalized JSON used for seeding.
- `ml/models/` — trained model artifacts (ignored by default in `.gitignore`).
- `scripts/` — ingestion, processing, training and utility scripts.

Local development (quick)
1. Copy `.env.example` or create `.env` with the values below:

```env
AUTH_SECRET="your-long-random-secret"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/careergpt?schema=public"
GROQ_API_KEY="your-groq-api-key"
```

2. Install and prepare:

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Notes & GitHub
- A focused `.gitignore` is included to keep `data/raw/`, `data/processed/`,
	`ml/models/` and all `.env*` files out of the repository to avoid hitting
	GitHub storage limits; confirm any dataset you need is stored elsewhere.
- Keep secrets out of the repo; load them via `.env` locally and your
	provider's secret manager in production.

Where to look first
- App entry and routes: `src/app/` and `src/app/api/`.
- Data processing: `scripts/process_datasets.py` and `scripts/ingest.ts`.
- Model training: `scripts/train_recommendation_model.py` and `ml/`.
- DB and seeding: `prisma/schema.prisma` and `prisma/seed.ts`.


