# OpenCode Ralph Loop Plugin

A plugin for OpenCode that implements the **Ralph Loop** methodology: a continuous, self-correcting development loop inspired by the "Ralph Wiggum" technique.

## What is Ralph Loop?

"Ralph is a Bash loop" - Geoffrey Huntley.

This plugin is a port of the official [Claude Ralph Loop plugin](https://github.com/hasanabuzayed/claude-plugins-official/tree/main/plugins/ralph-loop), adapted for the OpenCode environment.

This plugin allows your OpenCode agent to enter a persistent iteration cycle. You give it a task and a completion promise (a specific string to output when done). If the agent exits *without* outputting that promise, the plugin automatically restarts it with the same prompt, allowing it to see its previous errors, fix them, and try again.

## Features

- **`ralph_start` Tool**: Initiates the loop with a prompt, completion promise, and iteration limit.
- **`ralph_cancel` Tool**: Manually stops the loop.
- **Auto-Restart**: Uses the `session.idle` hook to detect when the agent stops. If the task isn't done, it spawns a new `opencode run` process.
- **State Persistence**: Tracks progress in `.opencode/ralph-state.json`.

## Installation

Add the plugin to your `opencode.json` configuration:

```json
{
  "plugin": [
    "/path/to/opencode-ralph-loop"
  ],
  "instructions": [
    "/path/to/opencode-ralph-loop/RALPH_INSTRUCTIONS.md"
  ]
}
```

## Usage

You can use the loop naturally by asking the agent:

> "Start a Ralph Loop to fix the tests. Promise: 'ALL_TESTS_PASS'"

The agent will use the `ralph_start` tool.

### Manual Tool Usage

```javascript
ralph_start({
  prompt: "Run the tests and fix bugs.",
  completion_promise: "DONE",
  max_iterations: 10
})
```

### State File Example (`.opencode/ralph-state.json`)

The plugin maintains the loop state in a JSON file within your project's `.opencode` directory:

```json
{
  "active": true,
  "prompt": "Run the tests and fix bugs.",
  "completionPromise": "DONE",
  "iterations": 2,
  "maxIterations": 10
}
```

### Command Line Usage

While the plugin automates the loop, you can also manually trigger a run with a specific prompt using the OpenCode CLI:

```bash
opencode run "Start a Ralph Loop to fix the tests. Promise: 'ALL_TESTS_PASS'."
```

## Configuration

The plugin uses the `opencode` CLI command. Ensure `opencode` is in your system PATH.

## License

MIT
