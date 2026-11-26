# Mental Math Development Guide

## Goal

Maintain a static mental arithmetic trainer for adults. Keep the interface in English and preserve dark mode, keyboard input, responsive layouts, offline PWA support, and direct deployment to a GitHub Pages subdirectory.

## Architecture and conventions

- Use HTML, CSS, and JavaScript ES modules with relative paths. Prefer `const`, use `let` for reassignment, and use English for identifiers and user-facing messages.
- Keep practice state, grading, timers, and the registry in `js/core/`. Put arithmetic in the evaluator, levels, and math utilities. Use tokens and exact fractions for decimal arithmetic. Never execute expressions as JavaScript code.
- Put storage and statistics logic in `js/services/`. Use `js/ui/` for interaction, schema-driven fields, and rendering. Wire the components and browser lifecycle events in `js/app.js`.
- Give each question one ID and record at most one result. Every submit and skip path must check deadlines before recording a result. Pause freezes both timers and hides the question. Feedback is excluded from the next question's answer time.
- Preserve existing behavior when extending the project. Change the core architecture only when there is a clear technical reason, and document the impact.

## Add a level

- Create a module in `js/levels/` with level metadata, defaults, a settings schema, validation, and a question generator. Use the supplied RNG and reuse the evaluator and existing utilities.
- Return `expression`, `correctAnswer`, `answerType`, and JSON-serializable `metadata`. For custom grading, provide `validateAnswer` as described in the README.
- Register the level in `js/levels/index.js`. Practice, History, and Statistics use the registry. Add any new runtime files to `sw.js` and test limits, difficulties, and supported operations.

## Storage and release

- Store settings and up to 30 sessions using the Storage Service's versioned JSON keys. Keep level IDs and session records compatible with saved data.
- When changing the schema, add a tested migration for old, invalid, and unsupported data. Write only after validation and conversion succeed. Report storage failures and retain unsaved sessions in memory so the user can retry.
- When runtime files change, update the precache list and bump the version in `sw.js`. Delete only old caches belonging to the current scope. Keep URLs relative and update the displayed version, documentation, and release notes as needed.

## Testing

- After each change, run `node tests/run.mjs` or open `tests/test-runner.html` from a static server. For UI, storage, or PWA changes, also run `node tests/browser-smoke.mjs`.
- Verify calculations, boundary values, Enter submission, actions near the deadline, pause and resume, persistence after reload, and offline use from a subdirectory. Record the test environment, results, and any unverified behavior when handing off the work.
