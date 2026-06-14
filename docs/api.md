# API Documentation

## GET /api/health
Returns service health.

## GET /api/catalog
Returns roles, skills, certifications, technologies, and join-table mappings.

## GET /api/recommendations
Returns readiness score, skill gaps, and deterministic recommendations for the signed-in profile.

## POST /api/roadmap/generate
Generates and persists a roadmap using Groq when available, with deterministic fallback.

## POST /api/auth/signup
Creates a user with hashed password.
