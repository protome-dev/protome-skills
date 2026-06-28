# Questions

Output a numbered question list in the conversation. These questions are for the user, not for the generated agent file.

```
> Answer with shorthand like `1a, 2b, 3c` or write freely.

---

**Q1. [Question text]**

_Why this matters: [1 short sentence in plain language]_

a) Option A
b) Option B
c) Option C
d) Other (describe)


**Q2. [Question text]** (select all that apply)

_Why this matters: [1 short sentence in plain language]_

a) Option A
b) Option B
c) Other (describe)


**Q3. [Open-ended question text]**

_Why this matters: [1 short sentence in plain language]_
```

Leave two blank lines between questions. Leave a blank line between the question text, "Why this matters" line, and options.

Use simple product language:
- Prefer "Who will use this?", "What should they be able to do?", "What should happen next?", and "What would make this feel done?"
- Avoid technical words such as API, schema, architecture, component, migration, database, backend, or implementation unless the user already used those words.
- Use the internal completeness checklist to find missing product and engineering-rigor information, but translate those gaps into plain product decisions before asking.
- Cover both product clarity and execution clarity over the full Q&A: target users, main flow, expected result, must-have behavior, scope, done criteria, behavior, implementation scope, verification/tests, boundaries, and system impact.
- Turn engineering-rigor gaps into user-friendly questions, for example "What should happen next?", "Which actions must work first?", "What should this version not do?", "What would prove this works?", or "What existing experience should this change?"
- For questions with clear options, provide lettered choices and always include a final `Other (describe)` option.
- If a question is better answered with free text, omit choices.
- Focus on decisions that meaningfully affect the prototype, not trivial preferences or details already clear from the project.
