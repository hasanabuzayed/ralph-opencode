# Ralph Loop Instructions

You have access to the **Ralph Loop** plugin, which allows you to perform iterative, self-correcting development cycles.

## What is Ralph Loop?
It is a "while true" loop for your thought process. It allows you to:
1.  Try to solve a problem.
2.  Run verification (tests, linters).
3.  If it fails, the loop restarts you with the *same prompt*.
4.  You see your previous files, logs, and errors, allowing you to fix them in the next iteration.

## How to Use

### 1. Start the Loop
When you face a complex task (e.g., "Make all tests pass", "Refactor this module"), call `ralph_start`:

```javascript
ralph_start({
  prompt: "Run the tests. If they fail, fix the code and run them again.",
  completion_promise: "TESTS_ARE_GREEN", // Choose a unique string
  max_iterations: 15
})
```

### 2. The Loop Process
Once started, **you will be restarted repeatedly**.
In each iteration:
-   Read the code and test output.
-   Make fixes.
-   Run the verification command (e.g., `npm test`).
-   **IF FAILURE**: Do NOT output the completion promise. Just exit (or let the session end). The loop will restart you.
-   **IF SUCCESS**: Output the completion promise (e.g., "TESTS_ARE_GREEN") to break the loop.

### 3. Completion Promise Rule
**CRITICAL**: You must **NEVER** output the `completion_promise` string unless the task is 100% complete and verified.
-   If tests fail, do NOT say "TESTS_ARE_GREEN".
-   If you are stuck, do NOT say "TESTS_ARE_GREEN".
-   The loop will only stop when it sees that exact string (or max iterations are reached).

## When to Use
-   **Fixing Test Suites**: "Keep fixing until all tests pass."
-   **Refactoring**: "Iteratively improve code quality until linter is happy."
-   **Exploration**: "Try different solutions until one works."

## Stopping Manually
If you need to abort, call `ralph_cancel`.
