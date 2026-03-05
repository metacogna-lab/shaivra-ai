# Agent Rule: Design System Enforcement

All agents must anchor every UI or visual change to the canonical spec in `docs/design-system.md`. This rule exists to prevent drift from the approved cinematic console aesthetic that the landing experience and portal already implement.

## Reference Stack
- **Primary design spec:** `docs/design-system.md` (palette, typography, layout, backgrounds, component patterns, motion, accessibility, checklist).
- **Cross-file cues:** `App.tsx`, `Navigation.tsx`, `Hero.tsx`, `RequestAccessModal.tsx`, `PortalLayout.tsx`, `KnowledgeGraphExplorer.tsx`.
- **Decision log:** Document any intentional deviation in `tasks/bridge.md` before merging.

## Cardinal Rules
1. **Color Discipline:** Only use the Tailwind tokens defined in `index.html`/`docs/design-system.md`. Adding new hex values or gradients is prohibited without a design approval recorded in `tasks/bridge.md`.
2. **Typography & Labels:** Headings must stay in Space Grotesk, body copy in Inter, system labels/metrics in JetBrains Mono. Maintain spacing/letter tracking exactly as described in the design guide; never swap fonts.
3. **Background Stack Integrity:** `LionBackground`, `AnimatedBackground`, and `CircuitBackground` already establish the hero atmosphere. Do not introduce alternative parallax layers or replace these canvases unless the design doc is updated first.
4. **Component Reuse:** Extend or compose existing components (`src/components/ui/**`, established CTA/button styles, portal cards) instead of inventing new primitives. Any new molecule must inherit the same border, radius, and spacing rhythm documented in the guide.
5. **Focus & Accessibility:** Every new interactive element must honor the focus/contrast requirements in the spec (gold focus ring, 4.5:1 contrast). If you cannot achieve the effect with current tokens, pause and request a design decision.
6. **Documentation:** Before PRs, confirm the change set references `docs/design-system.md` in its summary or tests. When exceptions are unavoidable, add a note under “Design System” in `tasks/bridge.md` detailing rationale and rollback plan.

## Workflow Checklist for Agents
1. Read `docs/design-system.md` and the related components you plan to touch.
2. Plan the change using only approved tokens, spacing, and motion timings.
3. Build the feature; screenshot or record the result and compare against the guide sections (Navigation, Hero, Cards, Portal, Graphs).
4. Update `tasks/bridge.md` if a rule needed bending, specifying what changed and how reviewers should validate it.
5. Reference this rule file plus `docs/design-system.md` inside your PR/commit description.

Failure to follow these steps is grounds for rejecting the contribution until it aligns with the design canon.
