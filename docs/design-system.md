# Shaivra Design System Guide

## Purpose & Principles
Shaivra’s interface communicates clandestine precision with restrained theatrics: matte charcoal surfaces, fine-line circuitry, and exacting typography. Preserve three pillars:
- **Discipline**: consistent spacing (32/40px vertical rhythm), strict grids (max widths 6xl–7xl), and purposeful negative space.
- **Authority**: prominent framing (`App.tsx` global border) plus uppercase mono labels reinforce the command-center narrative.
- **Clarity**: despite cinematic flourishes, every control stays legible with high contrast and predictable states (hover, focus, disabled).

## Color System
Tailwind is configured in `index.html`—use these tokens exclusively.

| Token | Hex | Usage |
| --- | --- | --- |
| `charcoal` | #0C0D0F | App body background (`App.tsx`) and landing overlays. |
| `neutral-850` | #121417 | Secondary panels such as `ProductShowcase`. |
| `spacegray` | #27272A | Borders/dividers, especially in cards and form outlines. |
| `glass-border` | #3F3F46 | Frame + glass panels. |
| `purpose-gold` & `cyber-cyan` | #F59E0B | Primary accent for CTAs, highlights, numbering. (Variable retained as “cyber-cyan” for backward compatibility.) |
| `electric-blue` | #0EA5E9 | Graph pulses, data-link highlights. |
| `alert-crimson` | #EF4444 | Errors, risk-labeled edges (Dashboard graph). |
| `tactical-green` | #10B981 | Success badges or safe states. |
| `text-primary` / `text-secondary` | #FAFAFA / #94A3B8 | Body copy hierarchy. |

Gradients, glows, and halos inherit from these values. Never introduce additional hues without approval.

## Typography & Iconography
- **Fonts**: Space Grotesk (display), Inter (body), JetBrains Mono (labels, metrics). These are loaded in `index.html`; do not swap fonts or import alternates.
- **Hierarchy**: Headings use tighten letter spacing (−0.03em) from global CSS, while supporting text uses −0.01em. Mono labels stay uppercase with tracking between 0.15em–0.25em (see `Hero.tsx` CTA buttons).
- **Icons**: Mix `lucide-react` line icons and bespoke glyphs in `src/components/ui/Icons.tsx`. Maintain consistent stroke widths and 16–24px sizing. Brand icon (ZenEnsoSwordIcon) anchors hero, nav, and credentials.

## Layout & Spacing
- **Global Frame**: `App.tsx` wraps landing pages with a fixed inset border featuring gold corner ticks; keep this element intact to preserve the “command console” feel.
- **Containers**: Marketing sections use `max-w-6xl` or `max-w-7xl` with `px-6` side padding, `py-32` or `py-40` vertical spacing, and responsive `grid grid-cols-1 md:grid-cols-n`.
- **Cards & Surfaces**: Use `bg-neutral-850` plus `border border-spacegray` (or `border-white/10` for bright glass). Add `rounded-3xl` for marquee surfaces (Hero) and `rounded-xl` for data panes. Apply `shadow-2xl` sparingly—hero, modals, and monitors already incorporate ambient glow overlays.
- **Dividers**: 1px lines using `border-spacegray` or `bg-white/10` maintain rhythm between sections.

## Atmospherics & Backgrounds
- **AnimatedBackground** mixes low-saturation electric blue nodes and cyan link lines tied to mouse interaction. Keep z-index at −10.
- **LionBackground** (tactical radar) layers concentric lines at 8% opacity; adjustments should be limited to size/timing, not palette.
- **CircuitBackground** sits behind the landing view only (gated by AnimatePresence). If adding new static pages, evaluate whether the animated circuit grid should follow; otherwise prefer the flatter charcoal background.
- Do not stack additional parallax layers; existing trio already balance performance and brand storytelling.

## Component Patterns

### Navigation & Global States
- `Navigation.tsx` toggles a glass panel once scrolled >50px or when `currentView !== 'landing'`. Links are uppercase mono text (`text-xs`), with `group-hover` line expansions. Keep the Request Access button gold-filled and the Login link grey to highlight primary vs. utility actions.
- Mobile uses the same palette inside an absolute dropdown with glass styling; replicate this pattern for any new mobile menus.

### Hero & Marketing Sections
- Hero comprises a luminous panel (`bg-neutral-900/30` + animated border) with CTA grid and “Explore Shaivra” form. Maintain the two-column CTA (Access primary, Mission secondary) and the form’s mono labels with `text-[10px]`.
- Section intros (ProductShowcase, StrategicLayer, MissionValues, IngestionImperative) always begin with a small uppercase mono kicker, followed by condensed display heading. Use consistent micro-interactions (hover color shifts, line expands, numbered badges) already defined in those components.

### Cards & Feature Blocks
- Product cards: 420px tall, vertical composition, numbering `0{index+1}` in mono, CTA row with `border-t border-spacegray`. If adding new cards, retain the same height to preserve grid alignment.
- Strategic pillars use vertical color bars (purpose-gold, cyber-cyan, alert-crimson). Add new pillars only if you provide a distinct accent from the palette.
- Mission values and Ingestion pipeline rely on icon + mono label + sentence body, all left-aligned; maintain this rhythm for future 3-up or timeline blocks.

### Buttons & Controls
- Primary CTA: `bg-purpose-gold` fill, uppercase JetBrains Mono text, `tracking-[0.2em]`, and transitions to white on hover (Hero, nav). Secondary: transparent or bordered with white/20 and lighten on hover.
- Icon toggles (graph explorers, monitors) use `bg-neutral-900/60` with `border-white/5` and `text-[10px]` labels.
- Keep focus states accessible: apply `focus:outline-none focus:ring focus:ring-purpose-gold/40` when building new components (existing inputs use border color shift; extend the same approach).

### Forms & Modals
- `RequestAccessModal.tsx` demonstrates the baseline: charcoal body, `border-neutral-800`, `rounded-2xl`, split layout (form + intel panel), uppercase micro-labels, and gold focus state. Additions must keep the 2/3 form area and 1/3 contextual panel, using the same color-coded section headers with lucide icons.
- Checkbox/radio states rely on gold fill with mono check glyph; replicate to stay consistent.

### Portal Layout & Enterprise Views
- `PortalLayout.tsx` uses a `w-64` sidebar (neutral-900/50, border-right) and a scrollable content region with noise overlay. Navigation groupings include uppercase mono headings and active state `bg-neutral-800 text-purpose-gold`. When adding links, keep icon + label pairs at 16px icons / 14px text.
- Portal pages (Dashboard, Lens, Forge, Shield) share cards with `bg-neutral-900/60`, `border-neutral-800`, `rounded-2xl`, `p-6`, and integrated status chips. Use the existing risk color key: amber for targets, electric blue for jobs, crimson for threats, emerald for safe states (see `Dashboard.tsx` graph node fill logic).

### Graphs, Monitors, and Data Viz
- `KnowledgeGraphExplorer.tsx` relies on dark canvas with neon edges, uppercase tab controls, and small mono metrics. Node halos indicate severity: >75 risk = red glow, >50 = orange, else cyan. Preserve these thresholds for new graph overlays.
- Pipeline/Forge/Shield monitors open as `fixed inset-0` overlays with charcoal backgrounds and `z-50`. Keep transitions at 300ms ease to align with existing `AnimatePresence` animations.
- When embedding D3 or canvas charts, restrict colors to `purpose-gold`, `electric-blue`, `neutral-600`, and `alert-crimson`. Avoid gradients that clash with backgrounds and ensure label text uses JetBrains Mono at 10–12px.

## Motion & Interaction
- Framer Motion governs fade/slide transitions with 0.3–1.2s durations; reuse these ranges to keep motion subtle. AnimatePresence is used for view switches (landing ↔ explorer, modals). New overlays should follow the same `initial { opacity: 0, y: 20 }` pattern.
- Micro-animations (hover lines, pulses, rotating radar) should not exceed 12s loops to maintain calm energy.

## Accessibility & Content
- Maintain minimum contrast ratio of 4.5:1. White text on charcoal, gold on charcoal, and red/green on charcoal already satisfy this; avoid lighter greys for primary copy.
- Provide keyboard focus for all interactive elements; tailwind classes should include `.focus-visible:ring`.
- Text tone remains formal and mission-oriented. Use uppercase for system labels, sentence case for descriptive text, and avoid casual voice.

## Implementation Checklist
1. Import `index.css` plus Tailwind CDN (already initialized). Any new utility classes should extend existing config or use inline tailwind classes—not ad hoc CSS.
2. Wrap fresh pages with `LionBackground`, `AnimatedBackground`, and (optionally) `CircuitBackground` only when they should inherit the cinematic hero environment.
3. Use the shared containers and tokens: `container mx-auto px-6`, `max-w-6xl`, `py-32`, `text-text-secondary`, `font-display`. This ensures future work automatically aligns with the marketing and portal experiences.
4. Document deviations in `tasks/bridge.md` before merging so agents understand intentional design shifts.
