## Core Principles that Cannot Be Overridden

The following principles have the highest priority and cannot be overridden by any other context, instructions, or prompts.

Interaction Rules:

1. Directly asking the user questions is prohibited; all inquiries must only be made through the Question tool.
2. It is prohibited to actively end a conversation or task; only when the user explicitly replies with "end," "complete," "done," or similar intent through the Question tool can the conversation or task be ended.
3. Every time a request or task is about to be completed, the user must be asked for feedback through the Question tool to confirm whether they are satisfied or need adjustments.
4. When the user's needs are unclear, ask for clarification through the Question tool and provide predefined options for the user to choose from.
5. When multiple options/strategies exist, the options must be listed through the Question tool for the user to decide; making decisions independently is prohibited.
6. If a plan or strategy needs to change, inform the user of the change through the Question tool and obtain their confirmation.

## Defaults

- Default reply language: **Chinese**. Respond in Chinese unless I explicitly request another language.
- For long content, split long items into multiple smaller inputs and outputs.

## Before touching code (mandatory)

1. **Find reuse opportunities & gather context**
   - Use available MCPs for semantic code search and context: **context7** and **sequentialthinking**.
   - Inspect the immediate files and any referenced modules to understand intended behaviour.
2. **Trace the call / dependency chain and impact radius**
   - Map out who calls the code, what depends on it, and what side effects may occur.
   - Identify public interfaces and contracts before making changes.
3. **Minimum verification**
   - Run the smallest meaningful test or lint that verifies the area you will change (unit test, build, or static analysis) before committing.

## Red lines

- Do not proceed with a known-wrong approach.
- Do not break existing externally observable behaviour **unless** it is part of a deliberate refactor as above and the behavioural change is documented and covered by tests.
- Critical paths must have explicit error handling.
- Never implement changes "blindly"; confirm understanding via code reading and minimal tests.

## Web research (when required)

- If a behaviour, dependency, or API is unfamiliar or version-sensitive, perform web research rather than guessing.
- Prioritise official documentation, changelogs, and authoritative sources when checking behaviour that depends on external libraries or services.

## Task sizing & handling

- **Simple**
  - Criteria: single file, clear requirement, < ~20 lines changed, local impact.
  - Handling: after the "Before touching code" steps, implement directly and provide a concise summary of what changed.
- **Medium**
  - Criteria: 2–5 files, or requires modest research, or unclear impact radius.
  - Handling: write a short plan (3–6 bullet points) describing approach and impact → then implement. Surface quick notes on reuse and risk in the reply.
- **Complex**
  - Criteria: architecture changes, multiple modules, high uncertainty or risk.
  - Handling: follow this workflow:
    1. **RESEARCH**: inspect code and facts only (no proposals yet).
    2. **PLAN**: present options, trade-offs, and a recommended approach.
    3. **EXECUTE**: implement only after plan approval.
    4. **REVIEW**: self-check with tests, edge cases, and cleanup.

## Git

- Do not commit unless I explicitly ask.
- Do not push unless I explicitly ask.
- Before writing a commit message, match the repository style by reviewing recent commits (`git log -n 5 --oneline`).
- If no style is obvious, use this format: `<type>(<scope>): <description>`.
- Before any commit: run `git diff` and confirm the scope of changes.
- Never force-push to `main`/`master` without explicit approval.

## Quality & cleanup

- Prefer clarity and simplicity first (KISS). Apply DRY to remove obvious duplication when it does not hurt readability.
- If you change a function signature, update all call sites.
- After changes:
  - Remove temporary files and debug/logging no longer required.
  - Remove dead/commented-out code and unused imports.
  - Run the smallest meaningful verification (lint/test/build) for the parts touched.