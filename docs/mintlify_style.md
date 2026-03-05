# Mintlify Documentation Style Guide

This project will adopt Mintlify as the canonical documentation system. Mintlify favours component-driven MDX with concise, goal-oriented sections. The guidelines below capture the conventions highlighted on [mintlify.com](https://mintlify.com) and translate them into actionable patterns for the Shaivra Intelligence Suite.

## Core Principles
- **Outcome-first**: Lead every page with the “why” before the “how”. Summaries should state the user goal in 2–3 sentences.
- **Modular navigation**: Each concept becomes its own page so Mintlify’s sidebar, search, and breadcrumb UX remain clean.
- **Consistent front matter**: Use YAML keys (`title`, `description`, `sidebarTitle`, `badge`, `hideTOC`) to keep pages indexed and surfaced by Mintlify search.
- **Multi-modal clarity**: Combine prose, callouts, tabs, and code blocks so different learning styles are served without overwhelming text.

## Page Structure
1. **Front Matter**: Always declare `title`, short `description`, and optional metadata (e.g., `badge: Beta`) so Mintlify can render headers and cards.
2. **Hero Summary**: The first paragraph should explain what the reader accomplishes; avoid burying the lede.
3. **Task Sections**: Break content into “Prerequisites → Steps → Validation → Troubleshooting” whenever we describe procedures.
4. **Reference Tables**: Use Markdown tables for API params or env vars; Mintlify formats them responsively.
5. **Callouts**: Employ Mintlify’s `:::info`, `:::warning`, `:::success`, `:::danger` blocks to highlight tips, cautions, and blockers.
6. **Component Blocks**: Leverage tabs (`<Tabs>`) for language/framework variants, timelines for roadmaps, and cards for feature overviews.

## Writing Guidelines
- Prefer active voice and short sentences; Mintlify readers skim.
- Keep paragraphs ≤4 lines; break longer explanations with headings or lists.
- Use second-person (“You can…”) for tutorials and third-person for conceptual docs as recommended in Mintlify examples.
- Provide copyable code snippets using fenced blocks with `bash`, `ts`, `json`, etc., so Mintlify’s “Copy” button knows the language.
- Inline links should describe the target (e.g., `[LangGraph integration guide](./langgraph.md)` instead of “click here”).

## Visual & Media Assets
- Store diagrams/screenshots under `public/mintlify/` and reference them with relative paths so Mintlify’s asset pipeline can optimize them.
- Include alt text describing intent (“Agent network flow diagram”) for accessibility.
- Prefer SVG for diagrams; Mintlify scales them cleanly across breakpoints.

## Navigation & Versioning
- Group pages into logical sidebar sections (`/docs/osint`, `/docs/platform`, `/docs/operations`).
- Use Mintlify’s `next`/`prev` metadata to create guided flows for onboarding.
- When documenting features behind flags, add a `badge: Beta` and a callout describing access requirements.

## Style-Driven Roadmap
1. **Information Architecture**: Map every existing README/doc into Mintlify sections (Overview, OSINT, Platform, Operations). Define sidebar order and cross-links.
2. **Foundational Pages**: Convert high‑traffic docs (Runbooks, OSINT playbook, API quickstart) into Mintlify MDX using the structure above.
3. **Component Adoption**: Replace long-form sections with Mintlify components—e.g., tabs for CLI vs. UI flows, callouts for env-var warnings.
4. **Living Reference**: Add an “Update Log” page that tracks documentation releases and ties into CI so we enforce style linting for every doc PR.

Following these standards ensures our Mintlify site feels cohesive, accessible, and aligned with the product voice showcased on mintlify.com.
