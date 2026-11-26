# Mental Math V1.0

Mental Math is a browser-based mental arithmetic trainer for adults. It uses HTML, CSS, and JavaScript ES modules, runs on a static web server, and stores data locally. The English interface supports dark mode, keyboard input, and small screens.

## Run locally

Run this command from the `Mental Math` folder containing `index.html`.

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

On Windows, you can also use `py -m http.server 8000 --bind 127.0.0.1` if Python is available through the launcher. Open [the local app](http://localhost:8000/). Press Ctrl+C in the terminal to stop the server.

In VS Code, open the `Mental Math` folder, install the Live Server extension if needed, and select **Open with Live Server** on `index.html`. Open the address provided by the extension. Serve the app over loopback HTTP for local use or HTTPS when deployed to support ES modules and the service worker.

## Practice

| Level | Topics and settings |
| --- | --- |
| 1 · Basic Arithmetic | Addition, subtraction, multiplication, and integer division. Choose the operations and maximum operand, and decide whether subtraction can yield negative answers. |
| 1.1 · Mixed Arithmetic | Whole-number expressions that follow the order of operations. Choose the maximum operand, number of operands, and whether to allow negative answers. |
| 2 · Percentages & Decimals | Calculate a percentage of a number, find a percentage, apply a percentage change, or practice the four decimal operations. Choose question types, a maximum operand, the maximum decimal places for inputs, and a difficulty. |
| 3 · Squares & Square Roots | Calculate squares and find the square roots of perfect squares. Choose a question type and the maximum base or root. |
| 3.1 · Comprehensive Arithmetic | Choose your topics and difficulty. **Random Questions** draws individual questions from earlier levels. **Mixed Expressions** combines selected topics in one expression. |

1. Choose a level and adjust its settings. You can set a timer for each question, add a time limit for the whole session, and change the feedback duration.
2. Select **Start**. Enter your answer and press Enter or select **Check**. Both decimal points and decimal commas are accepted. Use **±** to enter a negative number if your phone keyboard lacks a minus key.
3. Use **Skip**, **Pause**, **Resume**, or **Finish** as needed. The next question appears automatically after feedback. After finishing, review the summary or select **Restart**.
4. Open **History** to review settings, results, and individual questions or filter for incorrect answers. Open **Statistics** to see your metrics and four charts. Use the level selector to narrow the results.

Accuracy is the share of completed questions you answered correctly, including skipped and timed-out questions in the denominator. Average, fastest, and slowest answer times use only questions with submitted answers. The historical average is calculated across individual submitted answers. The best streak is the longest recorded within a single session.

The question timer and session timer have separate deadlines. Pausing hides the question and freezes both timers. Feedback counts toward session time. The next question's timer starts when the question appears. A submission at or after the deadline records a single timeout. If you finish manually before the current question expires, that question is omitted from the summary.

## History and offline use

History keeps the 30 most recent completed sessions with at least one recorded result. Your last valid settings and saved history persist across reloads. Select **Finish** before leaving to save your session. An active session lives in page memory and can be lost if the page reloads or the browser closes unexpectedly. The app asks for confirmation before leaving when the browser supports it. If a save fails, the app keeps the unsaved session in memory so you can retry from **History** before closing the page. If stored history is damaged or uses an unsupported version, the app reports the problem and keeps the original data until you clear it. Percentage questions saved in Vietnamese by earlier versions display in English.

Once the service worker has installed and activated, you can reopen the app and practice offline in the same browser. History belongs to the browser and origin. Changing your device, address, or port, or clearing site data, can make earlier history unavailable. The app does not transmit answers or statistics to a server.

On iPhone, open the HTTPS app URL in Safari. Open the **Share** menu, select **Add to Home Screen**, turn on **Open as Web App** if Safari shows it, and select **Add**. Open the app from its Home Screen icon while online to load the cache, then reopen it in airplane mode to verify offline access.

## Deploy to GitHub Pages

1. Create an empty GitHub repository named `MentalMath`. On GitHub Free, choose a public repository to use Pages.
2. In the `Mental Math` folder, run the following commands with your GitHub username and repository name.

```powershell
git init -b main
git add .
git commit -m "Release Mental Math V1.0"
git remote add origin https://github.com/USERNAME/MentalMath.git
git push -u origin main
```

3. Open the repository and go to **Settings → Pages**. Select **Deploy from a branch**, choose **main** and **/(root)**, then select **Save**.
4. Once the Pages workflow succeeds, open the URL shown in **Settings → Pages**, such as `https://USERNAME.github.io/MentalMath/`. The `.nojekyll` file lets Pages serve the static files directly. Assets use relative paths.

When app code or assets change, update the precache list and bump the cache version in `sw.js`. Run the tests, commit, and push to the selected branch. Reopen the app after Pages publishes the update and the new service worker activates. The worker removes older Mental Math caches in its scope. [GitHub Pages configuration guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Architecture and files

| Location | Files and responsibilities |
| --- | --- |
| Root | `index.html` defines the three tabs. `manifest.json`, `sw.js`, and `.nojekyll` support PWA installation, offline use, and GitHub Pages. `README.md` documents usage and `AGENTS.md` records maintenance guidelines. |
| `css/` | `style.css` defines the layout, colors, and typography. `components.css` styles components and `responsive.css` sets breakpoints. |
| `js/` | `app.js` connects modules and browser events. `config.js` defines limits, defaults, and constants. |
| `js/core/` | `practice-engine.js` coordinates session states and deadlines. `question-engine.js` generates, deduplicates, and grades questions. `session-manager.js` records results. `timer.js` measures active time. `level-registry.js` registers levels. `expression-evaluator.js` evaluates expressions. `answer-validator.js` normalizes and compares answers. |
| `js/levels/` | `index.js` registers levels. `level-helpers.js` defines the common interface and normalizes questions. Generators live in `level-1.js`, `level-1-1.js`, `level-2.js`, `level-3.js`, and `level-3-1.js`. |
| `js/services/` | `storage-service.js` reads and writes versioned JSON. `statistics-service.js` computes session and historical statistics. |
| `js/ui/` | `settings-ui.js` renders settings. `practice-ui.js` displays the practice session. `history-ui.js` shows saved sessions and questions. `statistics-ui.js` filters statistics. `chart-ui.js` draws SVG charts. `metrics-ui.js` renders metrics. `dom.js` contains DOM helpers. |
| `js/utils/` | `math-utils.js` handles BigInt fractions and decimals. `random-utils.js` provides random numbers and IDs. `format-utils.js` formats English dates, numbers, and prompts. `validation-utils.js` validates settings. |
| `assets/icons/` | `icon.svg`, `icon-192.png`, `icon-512.png`, and `apple-touch-icon.png`. |
| `tests/` | `test-runner.html`, `browser-runner.js`, `run.mjs`, `suite.js`, and `harness.js` run the test suite. Test cases live in `expression-evaluator.test.js`, `question-generator.test.js`, `answer-validator.test.js`, `timer.test.js`, `session-manager.test.js`, and `storage-service.test.js`. `browser-smoke.mjs` runs end-to-end checks in Chromium. |

The UI reads the settings schema and sends the configuration to the Practice Engine. The engine asks the Question Engine to generate a question using the registered level and starts a fresh timer. A submission, skip, or timeout records one result in the Session Manager and updates the metrics. At the end of the session, the Storage Service saves the results. History and Statistics read from the same storage source.

The evaluator uses separate stacks for values and operators. Operators of equal precedence reduce from left to right, and parentheses delimit their own scope. BigInt fractions preserve exact values and keep display notation separate from calculation, so Comprehensive Arithmetic can reuse tokens from other levels.

## Add a level

1. Create `js/levels/level-N.js`. Export an object with `id`, `name`, `description`, `getDefaultSettings()`, `getSettingsSchema()`, `validateSettings(settings)`, and `generateQuestion(settings, rng)`. You can use `defineLevel` to build that interface from a schema and default settings.
2. Use the supported field types `select`, `multi`, `checkbox`, `integer`, and `range`. Set defaults that pass validation and use the supplied RNG for reproducible tests.
3. Return `{ expression, correctAnswer, answerType, metadata }`. The Question Engine adds `id` and `levelId`. Use a string for `correctAnswer` and JSON-serializable `metadata`. If the level needs custom grading, implement `validateAnswer(input, question, settings)` and return `{ valid, correct, input }` or `{ valid: false, message }`.
4. Import and register the level in `js/levels/index.js`. Add its file to the precache list in `sw.js`, bump the cache version, and add tests. The registry automatically adds the level to Practice, History, and the Statistics filter.

## Run tests

- With the local server running, open [the browser test runner](http://localhost:8000/tests/test-runner.html) to see passing tests and failures.
- Run `node tests/run.mjs` with Node.js 24 or later to execute the same unit tests from the terminal.
- Run `node tests/browser-smoke.mjs` with Node.js 24 or later and a Chromium browser to test the full app. The script uses a temporary browser profile and an available loopback port. Set `MENTAL_MATH_BROWSER` to the path to Chrome, Edge, or Chromium if the script cannot find your installation.

## V1.0 limits

- The maximum operand, base, or root can be set from 1 to 99,999. Level 1.1 accepts 3–10 operands. Intermediate values in integer levels must remain within JavaScript's safe-integer range. The evaluator supports up to 128 tokens, 16 layers of parentheses, and fractions with up to 256 bits per component.
- Level 2 accepts up to four decimal places in question inputs, depending on difficulty and settings. An exact result can have more places than the inputs. The V1.0 levels generate finite decimal answers. If a new level asks for rounding, use `metadata.rounding` to display the required number of places.
- A question timer can run for 1–3,600 seconds, a session timer for up to 86,400 seconds, and feedback for 0–5,000 ms. Answers can be up to 64 characters long. The generator tries at most 80 times to find a valid expression and 20 times to avoid a repeat. Small question pools may still produce repeats.
- Local storage and cache limits depend on the browser. Very long sessions can exhaust storage before reaching 30 saved sessions. The browser and operating system determine whether focusing the answer field automatically opens the on-screen keyboard.

Possible future work includes fraction and exponent levels, recovery of unfinished sessions, history import and export, and testing on a physical iPhone.
