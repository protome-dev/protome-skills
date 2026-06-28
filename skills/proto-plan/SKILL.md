---
name: proto-plan
description: End the proto-me Q&A phase, with optional Design if the user used it, then generate an executable prototype agent file. Use after proto-me has prepared a product brief; users may go directly from Plan to Agent, and any proto-image-gen visual design is only an optional reference.
---

## Proto Plan — Generate executable agent

Generate a durable agent description from the `proto-me` product brief and optional Design-stage visual reference. Preserve both layers of the brief: the user-facing product layer and the engineering constraints/verification layer.

Do not write implementation code. Do not generate a regular technical build plan.

### Step 1: Load the default workflow

Read [references/templates.json](references/templates.json), silently use the single `Default` entry, and do not ask the user to choose a template.

### Step 2: Resolve the product brief

Use the most recent product brief from the `proto-me` Q&A conversation. Prefer a dual-layer brief with:
- Product layer: target users, main flow, expected result, must-have behavior, scope, and done criteria.
- Engineering constraints and verification layer: behavior, implementation scope, verification/tests, boundaries, and system impact.

If a brief was not shown, generate one now using [references/refine-prompt.md](references/refine-prompt.md). If the product layer is clear but the engineering layer is incomplete, infer only low-risk constraints from the conversation and project context. Do not invent high-risk scope, behavior, or verification commitments; carry important gaps into the agent as unknowns or constraints.

If the user skipped the Design stage, proceed directly from Plan to Agent and do not imply that a visual design was required. If the user used `proto-image-gen` or `proto-image-edit` during the Design stage, treat the resulting image as a visual reference for style, hierarchy, UX intent, and interaction feel. Do not treat generated design-board scaffolding, side annotations, or accidental model artifacts as product requirements unless the user explicitly approved them.

### Step 3: Generate slug

Create a concise 2-5 word kebab-case slug from the product or feature name. Sanitize to lowercase letters, numbers, and hyphens only, with no leading or trailing hyphens and max 50 chars.

If the `proto-me` brief already includes or implies a stable `canvasSlug`, reuse that value as the agent slug unless the output path already exists.

The output path is `proto-agents/<slug>/agent-<slug>.md`. If that path already exists, append `-2`, `-3`, etc. to the slug.

### Step 4: Create agent directory

```bash
mkdir -p proto-agents/<slug>
```

### Step 5: Write the agent file

See [references/write-plan.md](references/write-plan.md).

Append a progress line at the end of every message during the Agent phase.

If the user skipped Design, use:

```
✓ Explore  ✓ Plan  ○ Design  ● Agent  ○ Refine  ○ Execute
```

If the user completed Design first, use:

```
✓ Explore  ✓ Plan  ✓ Design  ● Agent  ○ Refine  ○ Execute
```

Use labels translated into the user's language when the user is not writing in English. Keep the same phase meaning as `Explore / Plan / Design / Agent / Refine / Execute`.

### Step 6: Refine and optionally execute

See [references/refinement.md](references/refinement.md).
