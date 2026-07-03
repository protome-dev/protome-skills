# Proto Plan Skill Artifact Addendum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `proto-plan` so generated agent files append a skill-specific execution contract when the requested deliverable is clearly a Codex skill, without changing the `proto-me` brief model.

**Architecture:** Keep `proto-me` brief synthesis unchanged. Add internal deliverable-target guidance to `skills/proto-plan/SKILL.md`, then extend the existing single agent template in `skills/proto-plan/references/write-plan.md` with a conditional `Skill Artifact Addendum`.

**Tech Stack:** Markdown skill instructions, Codex skill conventions, existing proto-me plugin repository.

---

## File Structure

- Modify: `skills/proto-plan/SKILL.md`
  - Responsibility: Tell `proto-plan` to run an internal Codex-skill target check before writing the agent file.
- Modify: `skills/proto-plan/references/write-plan.md`
  - Responsibility: Define the conditional addendum and clarify how verification/frontend guidance applies to skill deliverables.
- Reference only: `docs/plans/2026-07-03-proto-plan-skill-artifact-addendum-design.md`
  - Responsibility: Approved design source. Do not edit during implementation unless a design correction is explicitly requested.

## Task 1: Add Internal Skill Target Judgment To Proto Plan

**Files:**
- Modify: `skills/proto-plan/SKILL.md:41-45`

- [ ] **Step 1: Inspect the current Step 5 text**

Run:

```bash
nl -ba skills/proto-plan/SKILL.md | sed -n '35,55p'
```

Expected: output shows `### Step 5: Write the agent file`, the `See [references/write-plan.md]` line, and the progress-line instructions.

- [ ] **Step 2: Insert the internal judgment rule**

Use `apply_patch` to replace the Step 5 opening with this text:

```diff
*** Begin Patch
*** Update File: skills/proto-plan/SKILL.md
@@
 ### Step 5: Write the agent file
 
+Before writing, make an internal deliverable-target judgment from the original request, resolved brief, and engineering constraints. Do not ask the user to choose a type and do not add a `briefType` or similar field to the brief.
+
+If the target is clearly Codex skill creation or update, keep using the same agent template but include the conditional `Skill Artifact Addendum` from [references/write-plan.md](references/write-plan.md). Strong signals include requests for Codex skills, `SKILL.md`, `skill-creator`, `agents/openai.yaml`, skill trigger behavior, bundled skill resources, or reusable Codex capability workflows. Be conservative: user-domain uses of the word "skill" do not imply Codex skill development by themselves.
+
 See [references/write-plan.md](references/write-plan.md).
*** End Patch
```

- [ ] **Step 3: Verify the inserted wording**

Run:

```bash
sed -n '39,55p' skills/proto-plan/SKILL.md
```

Expected: output includes `internal deliverable-target judgment`, `do not add a briefType`, and `Skill Artifact Addendum`.

- [ ] **Step 4: Commit Task 1**

Run:

```bash
git add skills/proto-plan/SKILL.md
git commit -m "docs: add skill target judgment to proto-plan"
```

Expected: commit succeeds and only `skills/proto-plan/SKILL.md` is included.

## Task 2: Add Conditional Skill Artifact Addendum To Agent Template

**Files:**
- Modify: `skills/proto-plan/references/write-plan.md:7-118`

- [ ] **Step 1: Inspect the template body**

Run:

```bash
nl -ba skills/proto-plan/references/write-plan.md | sed -n '1,140p'
```

Expected: output shows the `Before writing:` bullets, the generated markdown structure, `How To Verify`, `Frontend Design`, and final rules.

- [ ] **Step 2: Add the pre-write skill judgment bullet**

Use `apply_patch` to insert this bullet after the existing "Do not copy domain content" bullet:

```diff
*** Begin Patch
*** Update File: skills/proto-plan/references/write-plan.md
@@
 - If the brief references a Design-stage visual or image set from `proto-image-gen` or `proto-image-edit`, use it as an optional style and UX reference. Preserve any mapping between visuals and feature, section, or menu nodes. Keep the product brief as the source of truth when an image and brief conflict. If there is no Design-stage visual, proceed without one.
 - Do not copy domain content from any reference agent. Reuse only the general execution structure.
+- Internally judge whether the deliverable is Codex skill creation or update. Do not expose this as a `briefType` or ask the user to classify it. If the target is clearly a Codex skill, append the conditional `Skill Artifact Addendum` section shown below.
*** End Patch
```

- [ ] **Step 3: Replace `How To Verify` placeholder text**

Use `apply_patch` to replace the existing one-line placeholder under `## How To Verify`:

```diff
*** Begin Patch
*** Update File: skills/proto-plan/references/write-plan.md
@@
 ## How To Verify
 
-[Default to browser or local preview validation. Use a non-browser method only if the prototype is not visual or web-based.]
+[Default to browser or local preview validation for visual web/product prototypes. If the deliverable is a non-visual Codex skill, verify the skill artifacts, trigger behavior, resource organization, and validation commands instead of forcing browser validation.]
*** End Patch
```

- [ ] **Step 4: Expand `Frontend Design` with conditional skill wording**

Use `apply_patch` to insert this paragraph after the Design-stage visual paragraph:

```diff
*** Begin Patch
*** Update File: skills/proto-plan/references/write-plan.md
@@
 If a Design-stage visual from `proto-image-gen` exists, use its aesthetic direction as a reference; the `proto-frontend-design` skill ensures that direction is implemented with the same quality in code.
+
+For Codex skill deliverables, use frontend, browser, or generate-ui workflows only when the skill itself needs a visible interaction surface such as visual configuration, form-style parameter collection, review or approval UI, selectors, previews, or chat-panel adjacent HITL controls. Do not invent a UI for pure `SKILL.md` and resource-folder work.
*** End Patch
```

- [ ] **Step 5: Append the conditional addendum inside the generated structure**

Use `apply_patch` to insert this section after `## Done Definition` inside the fenced generated-agent template:

```diff
*** Begin Patch
*** Update File: skills/proto-plan/references/write-plan.md
@@
 ## Done Definition
 
 [Clear user-visible completion standard, including validation expectations.]
+
+## Skill Artifact Addendum
+
+[Include this section only when the requested deliverable is clearly Codex skill creation or update. Omit it for ordinary web/product prototypes.]
+
+### Skill Deliverables
+
+[State the required skill artifacts: `SKILL.md`, `agents/openai.yaml` when appropriate, and only the `scripts/`, `references/`, or `assets/` resources that directly support the requested workflow. For existing skills, preserve working behavior and limit edits to the requested trigger, workflow, resource, or validation changes.]
+
+### Chat Panel Script
+
+[Specify the user-facing chat-panel text the skill should produce or instruct the agent to produce while running: startup text, questions, option wording, default explanations, progress messages, missing-information prompts, error prompts, and completion summary.]
+
+### HITL Interaction Spec
+
+[Specify the human-in-the-loop contract: confirmation moments, structured choices, free-text inputs, file path inputs, toggles, default values, whether the agent may proceed without an answer, high-risk decisions that must wait, and handling for invalid or contradictory input.]
+
+### Generate-UI / Frontend Use
+
+[State whether this skill needs a visible UI surface. Use `proto-frontend-design`, generate-ui, browser preview, or visual verification only for real interaction surfaces such as visual configuration, form-style parameter collection, review or approval UI, selectors, previews, or chat-panel adjacent HITL controls. Do not create UI for pure skill-file work.]
+
+### Skill Validation
+
+[Require validation against `skill-creator`: `SKILL.md` frontmatter contains only `name` and `description`; `description` covers what the skill does and when it triggers; body instructions are concise and progressively disclosed; resources are in the correct directories and are included only when useful; added or changed scripts are tested; `quick_validate.py` is run when available; one or two realistic trigger examples are checked.]
 ```
*** End Patch
```

- [ ] **Step 6: Add final rules for the addendum**

Use `apply_patch` to add these bullets to the `Rules:` list:

```diff
*** Begin Patch
*** Update File: skills/proto-plan/references/write-plan.md
@@
 - Use the user's language for prose unless the user asks otherwise.
 - If the brief references generated UI design images, treat them as style and interaction references unless the user explicitly approved their exact layouts. Do not turn design-board scaffolding such as side annotation panels, component notes, responsive preview panels, or multiple device mockups into product requirements. If a design image conflicts with the product brief, the brief wins.
+- Do not introduce a `briefType`, target-type field, or user-facing template choice for skill work. The skill-target judgment is internal to `proto-plan`.
+- For Codex skill deliverables, include `Skill Artifact Addendum` and make chat-panel text, HITL interaction points, and skill validation explicit.
+- Keep frontend, browser, and generate-ui guidance available for skill workflows that genuinely need visible interaction UI. Do not force those workflows onto pure text/file skill deliverables.
*** End Patch
```

- [ ] **Step 7: Verify the template includes the new contract**

Run:

```bash
rg -n "Skill Artifact Addendum|Chat Panel Script|HITL Interaction Spec|Generate-UI / Frontend Use|briefType|quick_validate.py" skills/proto-plan
```

Expected: output includes matches in `skills/proto-plan/SKILL.md` and `skills/proto-plan/references/write-plan.md`; `briefType` only appears in instructions saying not to introduce it.

- [ ] **Step 8: Commit Task 2**

Run:

```bash
git add skills/proto-plan/references/write-plan.md
git commit -m "docs: add skill artifact addendum to proto-plan template"
```

Expected: commit succeeds and only `skills/proto-plan/references/write-plan.md` is included.

## Task 3: Run Documentation-Level Verification

**Files:**
- Inspect: `skills/proto-plan/SKILL.md`
- Inspect: `skills/proto-plan/references/write-plan.md`
- Inspect: `docs/plans/2026-07-03-proto-plan-skill-artifact-addendum-design.md`

- [ ] **Step 1: Confirm no proto-me brief or canvas files changed**

Run:

```bash
git diff --name-only HEAD~2..HEAD
```

Expected output:

```text
skills/proto-plan/SKILL.md
skills/proto-plan/references/write-plan.md
```

If the design doc commit is also in the comparison window, use this command instead:

```bash
git diff --name-only 7e50299..HEAD
```

Expected output:

```text
skills/proto-plan/SKILL.md
skills/proto-plan/references/write-plan.md
```

- [ ] **Step 2: Confirm skill target logic is internal**

Run:

```bash
rg -n "briefType|target-type|user-facing template choice|internal deliverable-target|internal to `proto-plan`" skills/proto-plan/SKILL.md skills/proto-plan/references/write-plan.md
```

Expected: output shows instructions not to introduce `briefType` and to keep the judgment internal. There should be no instruction asking the user to choose a target type.

- [ ] **Step 3: Confirm skill addendum requirements are complete**

Run:

```bash
rg -n "Skill Deliverables|Chat Panel Script|HITL Interaction Spec|Generate-UI / Frontend Use|Skill Validation|agents/openai.yaml|quick_validate.py" skills/proto-plan/references/write-plan.md
```

Expected: every listed heading or artifact appears at least once.

- [ ] **Step 4: Confirm frontend/browser/generate-ui remains conditional**

Run:

```bash
rg -n "generate-ui|browser|frontend|visible interaction surface|pure `SKILL.md`" skills/proto-plan/references/write-plan.md
```

Expected: output shows guidance that frontend/browser/generate-ui remains available for real UI needs and should not be invented for pure skill-file work.

- [ ] **Step 5: Manual dry run for a skill request**

Read `skills/proto-plan/references/write-plan.md` and simulate this brief:

```text
Original request: Create a Codex skill for PDF annotation review.
Must-have behavior: The skill should guide the agent through reading a PDF, asking which annotation categories matter, producing a review summary, and validating the skill with quick_validate.py.
```

Expected conclusion: generated agent should include `Skill Artifact Addendum`, `Chat Panel Script`, `HITL Interaction Spec`, and `Skill Validation`.

- [ ] **Step 6: Manual dry run for a web prototype request**

Read `skills/proto-plan/references/write-plan.md` and simulate this brief:

```text
Original request: Build a dashboard for tracking weekly revenue.
Must-have behavior: The dashboard should show trend, segment breakdown, and a drill-down table.
```

Expected conclusion: generated agent should use the normal web/product prototype structure and omit `Skill Artifact Addendum`.

- [ ] **Step 7: Final status check**

Run:

```bash
git status --short
```

Expected: no tracked files are modified. Untracked `.idea/` may remain because it existed before this work and is unrelated.

## Self-Review Checklist

- [ ] The implementation keeps `proto-me` brief structure unchanged.
- [ ] The implementation does not add a `briefType` or user-visible target picker.
- [ ] Skill-target judgment happens only inside `proto-plan`.
- [ ] Skill outputs include chat-panel text requirements.
- [ ] Skill outputs include HITL interaction spec requirements.
- [ ] Skill outputs include `skill-creator` validation expectations.
- [ ] Existing frontend/browser/generate-ui guidance remains available when a skill workflow genuinely needs UI.
- [ ] Pure skill-file workflows are not forced through browser validation.
