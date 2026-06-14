# UX Improvement Plan

This document details the user experience guidelines and interface redesigns planned to elevate CareerGPT into a premium, interactive, and high-converting MVP.

## 1. Core UX Principles
* **Transparent Explainability**: Never recommend a career path or skill without justifying it. Every recommendation card must include a "Why this is recommended" sub-section.
* **Granular Visual Feedback**: Make progress tracking rewarding. Use glowing progress rings, transition animations, and clear checklists.
* **Information Density & Breathing Room**: Replace overwhelming paragraphs with cards, bullet points, tags, and expandable drawers.
* **Vibrant HSL Aesthetics**: Use modern glassmorphism (translucent dark panels with subtle white borders, backdrop-blur, and glowing neon cyan/blue accent drop-shadows).

---

## 2. Page-by-Page Redesign Plan

### A. Onboarding Wizard
* **Current State**: Single long page with standard HTML select dropdowns.
* **Proposed Redesign**: An interactive multi-step wizard:
  - **Step 1: Background**: Full name, Education level, Major.
  - **Step 2: Career Intent**: Interests, preferred roles.
  - **Step 3: Availability & Experience**: Experience level, learning style, weekly hours.
  - **Step 4: Target Role Selection**: Dynamic search and filtering of the 350+ roles.
  - **Step 5: Skill Assessment**: Multi-select and rating sliders (1-5 star levels) for pre-existing skills.
* **UI Indicators**: Top progress bar tracking wizard progression.

### B. Dashboard
* **Current State**: Static slate boxes with basic labels.
* **Proposed Redesign**:
  - **Main Hero**: Welcome message, target role, and a prominent **Readiness Score Circle Gauge** (animated SVG stroke).
  - **Top Missing Skill Callout**: A custom hero card showing the user's immediate roadblock skill and a call to action.
  - **Recommendation Grid**: Redesigned cards with tags showing difficulty (Hard/Medium/Easy), category, and a explicit "Why this is recommended" block.
  - **Feedback Buttons**: Built-in rating thumbs-up/down actions on every recommendation card.
  - **Role Comparison Drawer**: Allows comparing the target role against alternative matches predicted by the ML model.

### C. Roadmap Timeline
* **Current State**: A simple list of steps with a "Completed" button.
* **Proposed Redesign**:
  - **Timeline Navigation**: Toggle tabs between **30-Day**, **90-Day**, and **6-Month** milestones.
  - **Timeline Cards**: Vertically connected steps with a progress-dot line. Completed steps change line color from cyan to emerald.
  - **Interactive Details**: Expandable panels for steps to view prerequisite skills, recommended resource links, and concrete expected outcomes.
  - **Regenerate Prompt**: An inline prompt button allowing users to edit target role parameters and regenerate instantly.
