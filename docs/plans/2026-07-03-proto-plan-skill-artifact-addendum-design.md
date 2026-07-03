# Proto Plan Skill Artifact Addendum Design

## Context

`proto-me` currently prepares a user-readable product brief, and `proto-plan` turns that brief into a durable prototype agent file. The existing agent template is optimized for web and product prototypes: it preserves product decisions, includes frontend design guidance, and defaults verification toward browser or local preview validation.

The new need is to support Codex skill development as an output target without changing the `proto-me` brief model. A skill request should still move through the same Explore / Plan / optional Design / Agent flow, but the generated agent must make the skill-specific deliverables explicit.

## Goals

- Keep the current `proto-me` brief structure unchanged.
- Do not introduce a user-visible `briefType` or ask the user to classify the brief.
- Let `proto-plan` internally judge whether the requested deliverable is Codex skill work.
- When the deliverable is a skill, append a skill-specific execution contract to the existing agent output.
- Preserve existing frontend, browser, and generate-ui guidance for cases where the skill workflow genuinely needs UI or visual interaction.
- Require skill outputs to include chat-panel text and human-in-the-loop interaction specifications.

## Non-Goals

- Do not modify the canvas whiteboard schema or MCP tools.
- Do not alter `proto-me` Q&A fields or product brief synthesis.
- Do not replace the existing web/product prototype agent template.
- Do not force pure text/file skills through browser validation.
- Do not implement generate-ui itself as part of this change.

## Recommended Approach

Use a single-template addendum approach.

`proto-plan` continues to generate the current agent structure from `references/write-plan.md`. Before writing the agent file, it performs an internal deliverable-target pass. If the request or brief clearly points to Codex skill development, the generated agent includes an additional `## Skill Artifact Addendum` section.

The target judgment is internal to `proto-plan`. It should not be represented as a new `briefType`, persisted into the brief, or exposed as a user choice. The generated agent should simply contain the extra skill contract when the deliverable calls for it.

## Skill Target Signals

Treat the deliverable as Codex skill development when the original request, brief, or constraints mention signals such as:

- creating or updating a Codex skill
- `skill`, `SKILL.md`, or skill trigger behavior
- `skill-creator`
- `agents/openai.yaml`
- skill resources such as `scripts/`, `references/`, or `assets/`
- Codex capability extension, reusable workflow instructions, or bundled skill resources

The judgment should be conservative. If the request is only about a web product that happens to use the word "skill" in the user-facing domain, do not add the skill artifact section unless the Codex-skill intent is clear.

## Agent Output Changes

For ordinary web or product prototypes, the generated agent remains structurally the same.

For Codex skill targets, append this section after the existing agent sections:

```markdown
## Skill Artifact Addendum

### Skill Deliverables

[Specify the skill artifacts required for this request.]

### Chat Panel Script

[Specify the user-facing chat-panel text the skill should produce while running.]

### HITL Interaction Spec

[Specify human confirmation points, inputs, defaults, and fallback behavior.]

### Generate-UI / Frontend Use

[Specify when UI, generate-ui, frontend design, browser preview, or visual verification is required.]

### Skill Validation

[Specify skill-creator validation, quick validation, and realistic trigger checks.]
```

### Skill Deliverables

This subsection must describe the concrete skill artifacts to create or update:

- `SKILL.md` with valid frontmatter and concise operational instructions.
- `agents/openai.yaml` when appropriate, kept aligned with the skill body.
- Optional `scripts/`, `references/`, and `assets/` directories only when they directly support the workflow.
- Any reusable examples or validation artifacts needed by the requested skill.

For updates to an existing skill, the agent must preserve working behavior and restrict edits to the requested trigger, workflow, resource, or validation changes.

### Chat Panel Script

This subsection defines the text contract for the skill execution experience in the chat panel. It should cover:

- startup or orientation text
- user questions and option wording
- explanation of defaults or inferred choices
- progress messages
- missing information or error prompts
- completion summary and verification report

The script is not UI code. It is the expected conversational surface that the implemented skill should produce or instruct the agent to produce.

### HITL Interaction Spec

This subsection defines the human-in-the-loop interaction contract. It should include:

- which moments require user confirmation
- which inputs are structured choices, free text, file paths, toggles, or confirmations
- default values and whether the agent may proceed if the user does not answer
- which decisions are high-risk and must block until the user responds
- how invalid, missing, or contradictory input should be handled

The addendum should not require generate-ui by default. It should define the interaction model first.

### Generate-UI / Frontend Use

Keep the existing frontend and browser guidance available, but make its use conditional for skill work.

Use `proto-frontend-design`, generate-ui, browser preview, or visual verification only when the skill deliverable genuinely needs a visible interaction surface, such as:

- visual configuration
- form-style parameter collection
- review or approval UI
- selector or picker controls
- preview of generated artifacts
- chat-panel adjacent HITL controls

Pure `SKILL.md` and resource-folder work should not invent a UI surface just to satisfy the web-oriented parts of the original template.

### Skill Validation

This subsection must require validation against the `skill-creator` rules:

- `SKILL.md` frontmatter contains only `name` and `description`.
- `description` states both what the skill does and when it should trigger.
- body instructions are concise and use progressive disclosure.
- resources live in the correct directories and are included only when useful.
- scripts are tested when added or materially changed.
- `quick_validate.py` is run against the skill folder when available.
- at least one or two realistic trigger examples are checked to confirm the skill would be used correctly.

## Existing Template Adjustments

The existing `Frontend Design` and `How To Verify` sections should remain in the template. Their wording should clarify that browser or frontend validation is the default for visual web prototypes, while non-visual skill work should verify the skill artifacts directly.

The `Planning and Progress Tracking` section should remain unchanged in spirit: execution still uses `proto-planning-with-files` for concrete file-level planning and progress notes.

## Verification Plan

Validate the design by inspecting `proto-plan` documentation after implementation:

- Confirm no `briefType` field or brief schema change is introduced.
- Confirm `proto-plan` performs an internal skill-target judgment before writing the agent.
- Confirm skill targets append `Skill Artifact Addendum`.
- Confirm ordinary web prototype targets do not receive skill-specific requirements.
- Confirm generate-ui and frontend/browser validation remain available for skill workflows that genuinely need UI.
- Confirm pure skill-file workflows are directed toward skill artifact validation instead of browser validation.

Use two manual dry runs:

1. Skill request: "Create a Codex skill for PDF annotation review." The generated agent should include `Skill Artifact Addendum`, chat-panel script requirements, HITL interaction spec, and skill validation.
2. Web prototype request: "Build a dashboard for tracking weekly revenue." The generated agent should keep the normal web/product prototype contract and omit the skill addendum.

## Approval

The approved direction is closest to the single-template addendum approach:

- keep one main agent template
- do not replace web/frontend/browser sections
- add skill-specific obligations only when the output is clearly a Codex skill
- preserve generate-ui use when the skill workflow actually requires interactive UI
