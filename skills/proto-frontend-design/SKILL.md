---
name: proto-frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Before You Code

When working within an existing project, scan the codebase first:

- **Components**: Check `components/`, `ui/`, `shared/` directories. If existing components match or partially match what you need, extend or compose them. Do not create duplicates.
- **Design tokens**: Look for `tokens.css`, `variables.css`, `theme.css`, or `:root` with custom properties. Reuse existing values.
- **Framework themes**: Check for Tailwind config `theme.extend`, MUI `createTheme`, Chakra `extendTheme`, shadcn `globals.css`.
- **Fonts & layout**: Identify loaded fonts, grid systems, breakpoints, and spacing patterns already in use.
- **UI dependencies**: Check `package.json` for tailwindcss, @mui/material, @radix-ui, framer-motion, lucide-react, etc.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:

- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Aesthetic Philosophies

When the user names a philosophy or describes a vibe, use these as concrete implementation guides. Each defines typography, color, layout, spacing, motion, and detail treatment. If the user does not name one, choose the philosophy that best fits the context and state your choice.

### Dieter Rams (Functionalist)
Less but better. Every element earns its place.
- **Typography**: Clean sans-serif (Helvetica Neue, Suisse Intl, Akkurat). Tight letterspacing on headings. Generous line height on body. One size scale, used strictly.
- **Color**: Monochromatic with a single functional accent. White or light grey backgrounds. Color is information, not decoration.
- **Layout**: Strict grid. Clear functional hierarchy. Consistent mathematical spacing (4px/8px base).
- **Motion**: Minimal. Purposeful transitions only (state changes, reveals). No decorative animation.
- **Details**: Subtle borders and dividers over shadows. Precise alignment. Rounded corners used sparingly and consistently.

### Swiss / International Typographic
Objectivity through structure. The grid is sacred.
- **Typography**: Strong sans-serifs (Neue Haas Grotesk, Univers, Aktiv Grotesk). Dramatic scale contrast between headings and body. All-caps subheadings with generous letterspacing.
- **Color**: High contrast. Black, white, and one primary color. Bold color blocks as compositional elements.
- **Layout**: Rigid multi-column grid. Asymmetric balance. Alignment across elements is non-negotiable.
- **Motion**: Page transitions and scroll-triggered reveals that respect the grid. No playful bounce.
- **Details**: Rules (horizontal lines) as structural elements. No gradients. No shadows. Flatness is the point.

### Japanese Minimalism (Ma)
Negative space is content. Restraint communicates sophistication.
- **Typography**: Thin-weight sans-serifs or elegant serifs (Noto Sans, Cormorant). Generous line height (1.8–2.0). Small body size with large whitespace margins.
- **Color**: Muted naturals (warm greys, stone, sage, washi). Subtle tonal shifts over hard contrasts. Near-monochrome.
- **Layout**: Asymmetric but balanced. Off-center content. Large empty areas are intentional. Extreme whitespace — padding 2–3× what feels "normal."
- **Motion**: Slow, gentle fades (400–600ms). No bounce, no overshoot. Opacity transitions over position shifts.
- **Details**: Hairline borders. Subtle texture (paper grain, linen). No sharp shadows. Soft, diffused effects.

### Brutalist / Raw
Structure is visible. No polish. Anti-aesthetic is the aesthetic.
- **Typography**: System fonts, monospace (JetBrains Mono, IBM Plex Mono), or aggressive display faces. Mixed sizes. Text as texture.
- **Color**: Black and white primary. If color, raw and clashing (construction yellow, hazard orange, terminal green). No gradients.
- **Layout**: Visible borders. Box model exposed. Stacked blocks. Deliberate roughness. Tight or intentionally uneven spacing.
- **Motion**: None, or jarring (instant state changes, hard cuts). No easing.
- **Details**: Visible outlines. Default browser form elements can be intentional. Text-only interfaces.

### Scandinavian
Warmth plus restraint. Functional beauty. Accessible by default.
- **Typography**: Rounded, friendly sans-serifs (Nunito, Poppins, Circular, Cera Pro). Medium weights. Comfortable reading sizes.
- **Color**: Natural palette. Warm whites, soft blues, muted greens, clay. Pastel accents. No pure black — use charcoal.
- **Layout**: Clean and open. Card-based. Rounded corners (8–12px). Generous but not extreme spacing.
- **Motion**: Gentle, natural easing. Subtle hover lifts. Content that settles into place.
- **Details**: Soft shadows (large blur, low opacity). Warm undertones in greys. Illustration-friendly.

### Art Deco / Geometric
Bold symmetry. Decorative precision. Statement and luxury.
- **Typography**: Geometric display faces (Futura, Poiret One, Josefin Sans). All-caps headlines with extreme letterspacing. Serif body for contrast.
- **Color**: Rich and deep. Gold/champagne, emerald, navy, burgundy, black. Metallic accents (gold gradients, shimmer effects).
- **Layout**: Symmetrical and centered. Strong vertical axis. Decorative frames and borders. Layered depth.
- **Motion**: Elegant reveals. Staggered entrance animations. Parallax depth.
- **Details**: Geometric patterns (chevrons, sunbursts, fan shapes). Ornamental borders. Texture (marble, brushed metal).

### Neo-Memphis
Playful chaos. Anti-corporate. Shapes as characters.
- **Typography**: Mix of weights and styles. Clashing fonts is intentional. Oversized headlines. Text at angles.
- **Color**: Bold primaries and neons. Clashing combinations (pink + yellow, blue + orange). No muted tones. Flat color, no gradients.
- **Layout**: Broken grid. Overlapping elements. Shapes (circles, triangles, squiggles) as compositional elements. Dense in some areas, empty in others.
- **Motion**: Bouncy, playful. Exaggerated hover effects. Elements that wiggle, rotate, or pop.
- **Details**: Thick borders. Geometric shapes as decoration. Patterns (dots, dashes, zigzags). Drop shadows with hard edges and bright colors.

### Editorial / Magazine
Content-led design. Typography does the heavy lifting. Every page is a spread.
- **Typography**: Display serif for headlines (Playfair Display, Fraunces, Instrument Serif). Clean sans for body (DM Sans, Source Sans). Dramatic scale. Pull quotes. Drop caps.
- **Color**: Minimal. Black and white with one accent. Color used editorially — to highlight, not decorate.
- **Layout**: Strong column grid (3–5 columns). Full-bleed images. Text wrapping. Mixed column widths. Vertical rhythm.
- **Motion**: Scroll-triggered reveals. Parallax on images. Smooth page transitions.
- **Details**: Thin rules as dividers. Caption typography. Print-inspired details (folio numbers, running headers).

## Frontend Aesthetics Guidelines

Focus on:

- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font. Typography should feel intentional, not oversized by default.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise. Include a `prefers-reduced-motion` media query — disable or simplify all animations within it.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

## Typography Size Discipline

Bold design does not mean huge text. Do not generate oversized headings unless the user explicitly asks for poster-like, editorial, or billboard typography.

Use a clear type hierarchy with context-specific limits:

- Hero/display `h1`: usually `clamp(2.5rem, ..., 4.5rem)` at most; mobile max around `2.75rem`.
- Standard page `h1`: usually `clamp(2rem, ..., 3rem)` at most.
- Section headings: usually `clamp(1.5rem, ..., 2.25rem)` at most.
- Card, panel, sidebar, table, or tool-surface titles: usually `1rem`-`1.5rem`.
- Body copy: usually `1rem`-`1.125rem`, with readable line height.

Do not reuse hero/display heading styles for ordinary pages, sections, cards, CMS content titles, dashboards, or compact UI panels. Match display text to its container and workflow: operational interfaces, restaurant pages, content pages, and product surfaces need scannable hierarchy more than spectacle.

Avoid viewport-driven text growth. Do not set `font-size` directly with `vw`/`vh`; if responsive scaling is needed, use `clamp()` with conservative `rem` min/max bounds. Any heading above `5rem` or `80px` requires explicit user intent and must not appear in ordinary websites or apps.

Before delivery, check that headings wrap cleanly on mobile and desktop, do not overlap neighboring content, do not dominate non-hero pages, and do not force horizontal scrolling. Letter spacing should normally be `0`; avoid negative letter spacing unless explicitly needed for a specific display face and verified not to harm readability.

## Mobile-First

Build mobile layout first, then scale up. This is non-negotiable.

- Start with a single-column layout at 375px width.
- Add complexity at each breakpoint using `min-width` media queries (not `max-width`).
- Touch targets must be at least 44×44px on mobile.
- Body text must be at least 16px on mobile (prevents iOS zoom on input focus).
- Navigation must have a mobile-specific pattern (hamburger, bottom tabs, or drawer). Do not rely on horizontal nav bars that overflow.
- Line lengths should stay comfortable (45–75 characters) at every breakpoint.

## Dark Mode

When dark mode is needed, implement it systematically — not as an afterthought.

- Use CSS custom properties so switching themes means changing variable values, not rewriting components.
- Support both `prefers-color-scheme` media query (system preference) and a `[data-theme="dark"]` attribute (manual toggle).
- Do not simply invert colors. Dark backgrounds should be warm or cool to match the chosen aesthetic philosophy (warm charcoal for Scandinavian, cool slate for Swiss, near-black for Brutalist).
- Reduce pure white text to off-white (e.g., `#E5E5E5` or `rgba(255,255,255,0.87)`) to reduce eye strain.
- Shadows in dark mode should be darker and more transparent, not the same values as light mode.
- Accent colors may need lightness adjustments to maintain WCAG contrast ratios against dark backgrounds.

## Anti-Patterns

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
