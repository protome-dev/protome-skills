# Agent refinement

Inform the user:
- The agent is ready.
- They can chat to refine the agent freely.
- Ask, in the user's language, whether the agent is ready to enter execution.
- Do not show the agent file path as the primary next action.
- Do not modify files outside the generated agent file during refinement.

Then continue for as many rounds as the user wants. Each round, the user may:
- Ask for free-form changes to the agent file
- Confirm they want to enter Execute

When the user asks for changes:
- Only modify the generated agent file
- Preserve the agent's overall structure
- Make targeted edits that address user feedback

When the user confirms execution:
- If running in Codex and the goal tool is available, create a goal with this exact objective:

```text
/goal follow proto-agents/<slug>/agent-<slug>.md and implement. Always choose recommended decisions/options for me and do not ask, you can proceed to whatever you deem highest priority.
```

- After creating the goal, stop the `proto-plan` flow and let the goal perform execution.
- During Execute, the goal should choose recommended options automatically unless system or tool rules require confirmation for permissions, destructive actions, or external side effects.
- If not running in Codex or no goal tool is available, output this fallback prompt for the user to run:

```text
Follow proto-agents/<slug>/agent-<slug>.md and implement. Always choose recommended decisions/options for me and do not ask, you can proceed to whatever you deem highest priority.
```

### Progress indicator

Append a progress line at the end of every message during refinement.

If the user skipped Design, use:

```
✓ Explore  ✓ Plan  ○ Design  ✓ Agent  ● Refine  ○ Execute
```

If the user completed Design first, use:

```
✓ Explore  ✓ Plan  ✓ Design  ✓ Agent  ● Refine  ○ Execute
```

During Execute handoff, if the user skipped Design, use:

```
✓ Explore  ✓ Plan  ○ Design  ✓ Agent  ✓ Refine  ● Execute
```

If the user completed Design first, use:

```
✓ Explore  ✓ Plan  ✓ Design  ✓ Agent  ✓ Refine  ● Execute
```

Use labels translated into the user's language when the user is not writing in English. Keep the same phase meaning as `Explore / Plan / Design / Agent / Refine / Execute`.
