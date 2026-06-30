---
name: proto-me
description: Start a product prototype discovery session through Explore / Plan / optional Design / Agent / Refine / Execute. Explore project context, choose Fast or Slow thinking mode, ask plain-language questions, prepare a product brief, offer optional proto-image-gen visual design, then hand off to proto-plan for agent generation.
---

## Proto Me — Product prototype discovery

Turn a rough idea into a clear product-prototype brief and, when useful, an optional visual design direction that `proto-image-gen` can place in the interactive workspace before `proto-plan` converts the brief into an executable agent.

Do not generate an agent file, write code, or create technical build plans. Your job is to understand the product the user has in mind and make it clear enough to execute. The brief should stay user-readable while explicitly preserving the engineering rigor needed by the later agent: behavior, implementation scope, verification, boundaries, and system impact.

Main workflow:

- Explore: understand the user's idea and the current project in plain language.
- Plan: clarify the product prototype with Fast or Slow questioning.
- Design: optionally offer `proto-image-gen` to create concept images, UI/UX screens, prototype mockups, vector illustrations, posters, or infographics in the workspace; offer `proto-image-edit` for revisions after generation. The user may skip this stage and go directly from Plan to Agent.
- Agent: use `proto-plan` to generate a durable executable agent file from the product brief and optional design reference.
- Refine: let the user adjust the agent before execution.
- Execute: after confirmation, follow the generated agent file and implement.

### Step 1: Parse the idea

Parse the user's message for the product, feature, app, page, workflow, or prototype idea.

If the idea is missing, ask the user what they want to prototype. Do not show a progress line yet.

### Step 2: Load the default workflow

Read [references/templates.json](references/templates.json), silently use the single `Default` entry, and do not ask the user to choose a template.

Do not support alternate templates or a custom-template path.

### Step 3: Choose thinking mode

Before project exploration, product questions, canvas updates, or product decisions, require the user to choose a thinking mode. If the user's initial message already clearly says Fast or Slow, use that mode and continue. Otherwise, show this simple text choice and wait for the user's answer:

```
How should I work with you on this prototype?

a) Fast (recommended): I will think through likely answers, choose sensible defaults, and only ask when the choice really needs you.
b) Slow: I will only ask questions and will not make product decisions for you.
```

Do not default to `Fast` just because it is recommended. If the user asks you to decide, gives unrelated shorthand, or answers something ambiguous, briefly explain that the mode controls how much product judgment Codex may apply and ask them to choose Fast or Slow. Do not proceed to Step 4 until the mode is resolved.

### Step 3.5: Generate canvas slug

After the thinking mode is resolved and before project exploration, create a concise 2-5 word kebab-case `canvasSlug` from the product or feature name. Sanitize to lowercase letters, numbers, and hyphens only, with no leading or trailing hyphens and max 50 chars.

Keep this `canvasSlug` stable for the whole product Q&A session and reuse it when calling canvas tools or handing the brief to `proto-plan`. If the product name changes substantially, keep the old slug unless the user is clearly starting a different product.

### Step 4: Explore the project

Explore the current project before asking product questions. Read actual files as needed to understand:
- what already exists
- the likely app surface or user flow
- existing product patterns the prototype should respect
- obvious constraints that a non-technical user would care about

Turn technical findings into plain product-language context. Avoid words such as API, schema, architecture, component, migration, database, or implementation unless the user used those words first.

### Step 4.5: Ensure canvas service

Product, demo, prototype, app, page, feature, and product brief Q&A are canvas-backed by default, so do this before the first `get_proto_me_canvas_text` or `upsert_proto_me_brief_whiteboard` call:

- Ensure the Proto-me local web service is running for the active user project directory and the current `canvasSlug`. If it has not been started in this thread, start it from the Proto-me repository root with `./scripts/start-canvas.sh <active-user-project-dir> <canvasSlug>` and keep the process running.
- Use the active Codex workspace/project as `<active-user-project-dir>`. If the current workspace is the Proto-me repository because the user is developing Proto-me itself, that is acceptable. Otherwise, do not substitute the Proto-me skill/plugin repository for the user's project.
- Use `<active-user-project-dir>/canvas/<canvasSlug>` as the canvas data directory. Do not use the shared `<active-user-project-dir>/canvas` root for product, demo, prototype, app, page, feature, or product brief Q&A.
- Wait for the Vite `Local:` URL or for `<active-user-project-dir>/canvas/<canvasSlug>/proto-me-runtime.json` to be written before calling canvas MCP tools.
- If Vite prints a fallback port, use that actual `Local:` URL or rely on the runtime file. Do not assume fixed port `43217`.
- After the actual workspace URL is known, automatically open it in the Codex in-app browser using the Browser plugin's `control-in-app-browser` flow. Do not ask the user to open the workspace manually. If the selected tab is already on the same Proto-me URL, leave it in place instead of reloading it.
- If in-app browser control is unavailable or fails before navigation with a tool-layer/session-metadata error, continue canvas-backed planning and show the actual local URL to the user as the fallback.
- If a canvas MCP call fails to connect, do one recovery attempt: start or restart the canvas service for the active user project, wait for the actual URL/runtime file, then retry the same canvas MCP call. Only fall back to chat-only planning after that retry fails.

### Step 5: Ask product questions

Ask questions that help turn the user's idea into clear prototype tasks. Follow [references/questions.md](references/questions.md).

Before choosing user-facing questions, run an internal requirements completeness pass. Do not show this checklist directly unless the user asks. Use it to find gaps across:
- Product layer: target users, main flow, expected result, must-have behavior, scope, and done criteria.
- Navigation/content layer: sections, columns, menus, or navigation entries when the product need includes them.
- Engineering rigor layer: behavior, implementation scope, verification or tests, boundaries, and system impact.

Translate engineering gaps into plain product questions before asking the user:
- Behavior -> "When the user does X, what should happen next?"
- Implementation scope -> "Which actions must work in the first version, and which can wait?"
- Verification or tests -> "What would make this demo feel ready to use?"
- Boundaries -> "What should this first version clearly not do?"
- System impact -> "Which existing page, flow, or habit should this change?"

Question rules:
- Choose the three highest-value questions for the current context, not a fixed category list.
- Ask only questions that materially affect the prototype direction, user experience, scope, or definition of done.
- For every user request, complete at least one user-facing Q&A round after the mode is resolved before saying the direction is clear. Prefer a second round when meaningful uncertainty remains.
- Always leave at least one high-decision-value product choice for the user instead of resolving the whole brief yourself. High-value choices include target user focus, primary use case, main screen or flow, visual/reference boundary, must-have behavior, scope limit, and definition of done.
- Use the user's language.
- Use simple words suitable for a non-technical person.
- Ask about the idea, audience, main screens or steps, expected result, must-have behavior, examples, limits, and what "done" looks like.
- Do not ask how to build it unless the user already framed the request technically.
- Keep the updated brief dual-layered: a product layer plus an engineering constraints and verification layer. The engineering layer must stay product-level and must not become a file, function, or implementation task list.

Fast mode:
- Before each question round, do a brainstorming-style pass over the three best candidate questions.
- If a recommended answer is clear from the user's request, project context, or common product expectations, choose it for the user and record it in the product brief only for low-risk or clearly implied choices.
- You may record low-risk engineering constraints in the brief, such as "do not add login", "validate the main happy path in the browser", or "keep this to the existing visible workflow", when those constraints are clearly implied.
- Do not choose all materially important product answers for the user. Keep 1-3 high-value questions open for the user in the first round, even when Fast mode can infer plausible defaults.
- If any assumptions or product decisions are recorded before the first user-facing question round, immediately show the current brief and refresh the canvas-backed whiteboard before asking that first round.
- Explain only high-impact decisions you made for the user.
- Ask only the candidate questions where the answer is still materially uncertain.
- If all candidate questions appear answerable by inference, still ask the strongest high-value product choice before considering the brief ready.
- Do not tell the user that the product prototype direction is clear, or invite `proto-plan`, until at least one user-facing Q&A round has been answered after mode selection.

Slow mode:
- Ask the three highest-value questions directly.
- Do not choose product answers on the user's behalf.
- Do not fill engineering constraints on the user's behalf; translate missing engineering rigor into product-language questions.
- Still avoid questions whose answers can be discovered from the project.

### Step 6: Continue Q&A

Wait for the user to respond. Accept answers in any format:
- Shorthand: `1a, 2b, 3e` or `1a 2b 3e`
- Prose: natural language answers
- Mixed: `1a, 2b, 3. I think we should...`

When they answer:
- If they answered a question with a follow-up question of their own, answer it (or finish the discussion with them) before moving to the next round
- Acknowledge briefly
- Show the updated product brief following [references/refine-prompt.md](references/refine-prompt.md). Display it in a blockquote so the user can see how their answers are shaping the prototype. The brief must explicitly include both product decisions and engineering constraints/verification when known. If the product need includes sections, columns, menus, or navigation entries, name them explicitly in the brief instead of folding them into generic feature prose.
- Treat product, demo, prototype, app, page, feature, or product brief Q&A as canvas-backed by default when the Proto-me MCP tools are available, unless the user explicitly asks not to use the canvas. The user does not need to ask for visual planning by name.
- For canvas-backed Q&A, refresh the Proto-me workspace after showing the updated brief:
  - Use `upsert_proto_me_brief_whiteboard` when the Proto-me MCP tool is available, passing `projectDir` and the stable `canvasSlug`.
  - Put the product title in the center, and branch target users, desired outcome, main flow, core features/sections/menus, key decisions, engineering constraints/verification, remaining unknowns, and done criteria around it.
  - When the generated brief includes sections, columns, menus, or navigation entries, pass them explicitly to the whiteboard as `sections`, `columns`, `menus`, `menuItems`, or `navigationItems` instead of hiding them inside prose.
  - Pass engineering rigor through dedicated whiteboard fields when available: `engineeringConstraints`, `behavior`, `implementationScope`, `verification`, `boundaries`, and `systemImpact`.
  - Treat `unknowns` as only currently unresolved high-value questions. When a question has been answered, move the resolved answer into `decisions`, `flow`, `features`, `sections`, `menus`, `featureDetails`, engineering constraints/verification, or `done` and remove it from `unknowns`.
  - When the Q&A is complete or the direction is clear enough for `proto-plan`, pass `unknowns: []` unless there are genuinely unresolved decisions that should block or shape execution.
  - Use tldraw arrow bindings between the central brief text and each branch text; do not create decorative unbound arrows when linked text nodes are intended.
  - For core features, sections, columns, menus, and navigation entries, include `featureDetails` so each item extends from the Core Features/Sections/Menus node into its own concise child text block with behavior, UX intent, constraints, or acceptance notes. Order `featureDetails` to match `features`, then `sections`/`columns`, then `menus`/`navigationItems` unless each detail names its item.
  - Use the current clear brief only; do not preserve abandoned ideas unless the user asked for history.
  - If the canvas tool is unavailable, continue the Q&A in chat and keep the brief ready to visualize later.
- Before each new question-selection pass for a canvas-backed Q&A session, use `get_proto_me_canvas_text` with the stable `canvasSlug` when available and treat edited canvas text as the latest user intent. If chat and canvas conflict, prefer the canvas unless the conflict is risky or impossible to interpret.
- Run another question-selection pass using the active thinking mode.
- Continue until the prototype direction is clear enough for `proto-plan` and at least one user-facing Q&A round has been answered after mode selection. Run a second round when any high-value product decision remains unresolved, or until the user invokes `proto-plan`.
- When the Q&A direction is clear enough, tell the user they can either use `proto-image-gen` to create an optional visual design in the current workspace, or call `proto-plan` to move directly into the Agent stage. Mention that generated visuals can be revised with `proto-image-edit`.

Do not generate the agent file. Do not write or modify code files.

### Progress indicator

Once a feature description has been provided, the mode is resolved, and project exploration has run, append a single progress line at the end of every message.

The line shows all six workflow phases using `✓` completed, `●` active, and `○` pending:

```
✓ Explore  ● Plan  ○ Design  ○ Agent  ○ Refine  ○ Execute
```

When Q&A is complete and the user is choosing whether to use the optional Design stage, use:

```
✓ Explore  ✓ Plan  ○ Design  ○ Agent  ○ Refine  ○ Execute
```

When the user chooses to create a visual design, use:

```
✓ Explore  ✓ Plan  ● Design  ○ Agent  ○ Refine  ○ Execute
```

Use labels translated into the user's language when the user is not writing in English. Keep the same phase meaning as `Explore / Plan / Design / Agent / Refine / Execute`.
