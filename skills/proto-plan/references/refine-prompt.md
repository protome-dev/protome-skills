# Refine prompt

Synthesize the Q&A conversation into a short dual-layer product brief when `proto-me` did not already provide one.

Rules:
- Start with a short title that names the product, feature, or prototype.
- Use bullets, not long paragraphs.
- Include the original request as one concise bullet.
- Include a `Product Brief` section with the intended user, desired outcome, main screens or steps, must-have behavior, scope, and definition of done when known.
- If the product includes sections, columns, menus, tabs, navigation, or content categories, name them explicitly in the `Product Brief` section. Do not hide them inside generic feature prose.
- Include an `Engineering Constraints and Verification` section when any item is known or clearly implied. Keep it product-level and include:
  - Behavior: the visible user action and expected response.
  - Implementation scope: what the first version must cover and what can wait.
  - Verification/tests: what paths, states, or outcomes should be checked to prove it works.
  - Boundaries: what this version should not support or overbuild.
  - System impact: existing pages, flows, data, or habits that the prototype changes.
- Include confident decisions made by `proto-me` on the user's behalf in Fast mode.
- Include remaining unknowns only when they are important enough to affect the prototype.
- Use the user's language and plain product wording.
- Avoid file names, function names, and low-level implementation details unless the user explicitly asked for them.
- Do not use the engineering section as a hidden build plan. It should preserve decision quality for the agent file, not prescribe files, functions, classes, or code structure.
