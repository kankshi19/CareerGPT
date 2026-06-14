# Roadmap Engine Design

This document details the architecture and generation flow for the personalized roadmap engine in CareerGPT.

## 1. Requirement & Architecture
To move beyond generic placeholders, the roadmap engine generates a structured, multi-phase curriculum tailored to the user's specific skill gap and learning capacity:
* **Timeline Phases**:
  1. **30-Day Phase**: Focuses on core missing skills, immediate foundation building, and low-barrier tools.
  2. **90-Day Phase**: Covers secondary skill requirements, certifications, and initial portfolio development.
  3. **6-Month Phase**: Dedicated to complex technologies, advanced certifications, and capstone project proof-of-work.
* **Deterministic Baseline Generation (Layer A)**:
  - Finds the user's exact missing skills from the `RoleSkillRequirement` join table.
  - Groups skills by phase depending on importance score (Core high-importance skills first, secondary skills later).
  - Selects certifications from `RoleCertification` sorted by relevance.
  - Gathers relevant hot technologies from `RoleTechnology` sorted by O*NET priority.
* **LLM Enhancement & Narrative Polishing (Layer C)**:
  - Passes the deterministic roadmap structure to Groq.
  - Groq populates phase-specific project details, weekly learning hour allocations, and action-oriented descriptions.
  - Groq applies the selected coaching tone (e.g. motivating, direct) and references the user's major and interests.
  - If Groq is unavailable, the system yields a structured deterministic template using database seed metadata.

---

## 2. Roadmap Step Structure
Each generated milestone/step in the roadmap includes:
* `title`: Sprint name (e.g., "SQL and Data Warehousing Basics").
* `whyItMatters`: Context on how this step supports the target role.
* `durationEstimate`: Target duration (e.g. "2 weeks").
* `prerequisites`: Required prior steps/skills.
* `recommendedResources`: Curated documentation, free tutorial links, or courses.
* `expectedOutcome`: Concrete evidence of completion (e.g. "Build a normalized Postgres schema").
* `status`: Tracking flag (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`).
* `priority`: Step importance (`HIGH`, `MEDIUM`, `LOW`).

---

## 3. Database Schema Mapping & State Tracking
The schema uses the `Roadmap` and `RoadmapStep` models:
* When a user requests a roadmap, any previous active roadmap is marked `isActive = false` and `status = "archived"`.
* A new `Roadmap` is created with `isActive = true`.
* Roadmap steps are created as individual relational rows in `RoadmapStep` with a `sortOrder` index.
* **State Updates**: Users toggle a step's completed state via a secure form or API endpoint, which updates `RoadmapStep.completed` and calculates the overall percentage progress.
* **Versioning**: Re-generations create new Roadmap rows, allowing history retrieval via the `Roadmap.createdAt` field.
