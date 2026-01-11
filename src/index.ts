import { type Plugin, tool } from "@opencode-ai/plugin"
import * as fs from "node:fs"
import * as path from "node:path"
import { spawn } from "node:child_process"

interface RalphState {
  active: boolean
  prompt: string
  completionPromise?: string
  iterations: number
  maxIterations: number
  lastRun?: number
}

const STATE_FILE = ".opencode/ralph-state.json"

// Helper to manage state
function getState(projectDir: string): RalphState {
  try {
    const statePath = path.join(projectDir, STATE_FILE)
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, "utf-8"))
    }
  } catch (e) {
    // ignore error
  }
  return {
    active: false,
    prompt: "",
    iterations: 0,
    maxIterations: 0
  }
}

function saveState(projectDir: string, state: RalphState) {
  const dir = path.join(projectDir, ".opencode")
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(path.join(projectDir, STATE_FILE), JSON.stringify(state, null, 2))
}

export const RalphLoop: Plugin = async (ctx) => {
  const projectDir = ctx.worktree || process.cwd()
  let lastAssistantMessage = ""

  return {
    tool: {
      ralph_start: tool({
        description: `Start a Ralph Loop to iteratively improve code until a completion promise is met.
        
        This tool will:
        1. Save your prompt and completion criteria.
        2. If you exit without outputting the completion promise, the system will automatically restart you with the SAME prompt.
        3. This allows you to check your work (tests, linters), fail, and try again in the next iteration.`,
        args: {
          prompt: tool.schema.string().describe("The instruction to repeat (e.g., 'Run tests and fix all bugs')"),
          completion_promise: tool.schema.string().describe("The exact text string you will output ONLY when the task is fully complete (e.g., 'RALPH_DONE')").optional(),
          max_iterations: tool.schema.number().describe("Maximum number of iterations (default: 10)").default(10)
        },
        execute: async ({ prompt, completion_promise, max_iterations }) => {
          const state: RalphState = {
            active: true,
            prompt,
            completionPromise: completion_promise,
            iterations: 0,
            maxIterations: max_iterations,
            lastRun: Date.now()
          }
          saveState(projectDir, state)
          return `Ralph Loop STARTED.
          
          Prompt: "${prompt}"
          Max Iterations: ${max_iterations}
          Completion Promise: "${completion_promise || '(none)'}"
          
          I will now exit to start the loop. Or you can start working now.
          REMEMBER: Do not output "${completion_promise}" until you are actually done.`
        }
      }),
      
      ralph_cancel: tool({
        description: "Stop the active Ralph Loop immediately.",
        args: {},
        execute: async () => {
          const state = getState(projectDir)
          if (!state.active) return "No active Ralph Loop to cancel."
          
          state.active = false
          saveState(projectDir, state)
          return "Ralph Loop CANCELLED."
        }
      })
    },
    hooks: {
      "chat.message": async (message: any) => {
        if (message.role === "assistant" && message.content) {
          if (typeof message.content === "string") {
            lastAssistantMessage = message.content
          } else if (Array.isArray(message.content)) {
            // Handle array content (e.g. text + tool calls)
            lastAssistantMessage = message.content
              .filter((part: any) => part.type === "text")
              .map((part: any) => part.text)
              .join("\n")
          }
        }
      },
      
      event: async (payload: any) => {
        if (payload.event.type === "session.idle") {
          const state = getState(projectDir)
          
          if (!state.active) return
          
          // Check for completion promise
          if (state.completionPromise && lastAssistantMessage.includes(state.completionPromise)) {
            console.log("[Ralph Loop] Completion promise found. Stopping loop.")
            state.active = false
            saveState(projectDir, state)
            return
          }
          
          // Check iteration limit
          if (state.iterations >= state.maxIterations) {
            console.log(`[Ralph Loop] Max iterations (${state.maxIterations}) reached. Stopping loop.`)
            state.active = false
            saveState(projectDir, state)
            return
          }
          
          // Increment and continue
          state.iterations++
          saveState(projectDir, state)
          
          console.log(`[Ralph Loop] Iteration ${state.iterations}/${state.maxIterations}. Restarting...`)
          
          // Construct the command
          // We assume 'opencode' is in the PATH.
          const command = "opencode"
          const args = ["run", "--prompt", state.prompt]
          
          console.log(`[Ralph Loop] Spawning: ${command} ${args.join(" ")}`)

          try {
             const subprocess = spawn(command, args, {
               cwd: projectDir,
               detached: true,
               stdio: 'ignore' 
             })
             subprocess.unref()
          } catch (e) {
            console.error("[Ralph Loop] Failed to restart opencode:", e)
          }
        }
      }
    }
  }
}

export default RalphLoop
