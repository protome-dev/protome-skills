# Write agent

Write the agent description to `proto-agents/<slug>/agent-<slug>.md`.

Use the product brief as the primary input. The generated file is a durable execution protocol, not a running checklist.

Before writing:
- Explore the existing project enough to understand current product shape and constraints.
- Keep the content product-level unless the user explicitly asked for technical detail.
- Extract and preserve both layers from the brief:
  - Product layer: target users, main flow, expected result, must-have behavior, scope, and done criteria.
  - Engineering constraints and verification layer: behavior, implementation scope, verification/tests, boundaries, and system impact.
- If the engineering layer is incomplete, infer only low-risk constraints from the brief and project context. Keep unresolved high-value gaps visible instead of silently filling them.
- If the brief references a Design-stage visual from `proto-image-gen` or `proto-image-edit`, use it as an optional style and UX reference. Keep the product brief as the source of truth when the image and brief conflict. If there is no Design-stage visual, proceed without one.
- Do not copy domain content from any reference agent. Reuse only the general execution structure.

The generated file must use this structure:

```markdown
---
name: agent-<slug>
description: >
  [One or two plain-language sentences describing the prototype outcome.]
---

You are **[Product or Feature Name] Prototype Agent**.

Your job is to implement [short prototype outcome] from the product brief.

This file is the durable execution protocol. It is not a running checklist. Moving discovery,
open questions, active task status, and verification notes belong in `.plan/<slug>/`.

---

## Original Request

[Short summary of the user's original request and key clarifications.]

## Product Brief

- Target users: [Who this is for.]
- Main flow: [The primary user path or screen sequence.]
- Expected result: [What the user should get from the prototype.]
- Must-have behavior: [The behaviors that need to work in the first version.]
- Scope: [What is included in the first version.]
- Done criteria: [The user-visible standard for considering the prototype complete.]

## Engineering Constraints and Verification

- Behavior: [User actions and visible system responses.]
- Implementation scope: [Product-level boundaries for what the first version must cover and what can wait.]
- Verification/tests: [Core paths, states, or outcomes to verify. Keep this user-visible and product-level unless the user asked for technical detail.]
- Boundaries: [Features, flows, integrations, or polish that should not be built.]
- System impact: [Existing pages, flows, data, habits, or interactions that this prototype changes.]

## What To Build

[High-level product tasks in priority order. Include acceptance standards for each task. Do not list files, functions, classes, methods, or low-level implementation steps.]

## What Not To Build

- Do not build features, flows, integrations, or polish that the user did not ask for.
- If backend, payment, login, or similar support is needed, use the simplest local SQLite or LibSQL implementation.
- [Any user-specific exclusions or constraints.]

## How To Verify

[Default to browser or local preview validation. Use a non-browser method only if the prototype is not visual or web-based.]

## Brainstorming

Before implementation, use the `proto-brainstorming` skill for unresolved product or design choices that could change visible behavior or scope.

Prefer recommended decisions and proceed without asking the user unless the decision is high-risk, destructive, external, or blocked by tool/system rules.

## Frontend Design

When building any frontend interface, web page, UI component, or user-facing screen, use the `proto-frontend-design` skill before writing code:

- Choose a named aesthetic philosophy that fits the product context and commit to it.
- Apply the philosophy's typography, color, layout, spacing, motion, and detail treatment consistently.
- Follow Mobile-First responsive strategy and Dark Mode guidelines when applicable.
- Never produce generic AI aesthetics — every interface must feel distinctively designed for its context.

If a Design-stage visual from `proto-image-gen` exists, use its aesthetic direction as a reference; the `proto-frontend-design` skill ensures that direction is implemented with the same quality in code.

## Planning and Progress Tracking

Before implementation, use the `proto-planning-with-files` skill to create concrete task breakdown, file-level implementation details, findings, and progress notes.

Keep active notes under `.plan/<slug>/`. Do not treat this agent file as the active checklist.

## Commit and PR Discipline

Check whether `git` is installed on the machine.

If git is available:
- Use reasonable small commits for meaningful milestones when commits are requested or appropriate for the environment.
- Keep the working tree understandable, review diffs before final reporting, and follow PR discipline when a PR is requested or expected.
- Branch creation is not required unless the user or environment asks for it.

If git is not available:
- Continue tracking progress in `.plan/<slug>/`.
- Report that git actions were unavailable.

## Done Definition

[Clear user-visible completion standard, including validation expectations.]
```

Rules:
- Do not include an `Execute` section in the generated agent file.
- Do not write a file/function-level task list.
- Do not drop the dual-layer brief. The generated file must explicitly record both product decisions and engineering constraints/verification, even when some items are marked unknown or intentionally out of scope.
- Do not write implementation code during this phase.
- Use the user's language for prose unless the user asks otherwise.
- If the brief references a generated UI design image, treat it as a style and interaction reference unless the user explicitly approved its exact layout. Do not turn design-board scaffolding such as side annotation panels, component notes, responsive preview panels, or multiple device mockups into product requirements. If the design image conflicts with the product brief, the brief wins.
