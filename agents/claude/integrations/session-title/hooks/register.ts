import type { EngineInterface, Register } from 'claude-code'

import { buildTitle, cleanTask } from './title'

// nth-dev-kit optional session-title mod. See session-title.md.
// Titles new conversations once at startup and serves `/task <name>`. No model call.

const GIT_TIMEOUT_MS = 3000
// `/rename` cannot run from inside the command's own hook; it runs just after.
const RENAME_DELAY_MS = 300

/** The main loop's last request: the effort the engine actually sent for that model ('' when none). */
let lastStep: { model: string; effort: string } | null = null

async function branchOf($: EngineInterface, cwd: string): Promise<string> {
  try {
    const git = await $.process.run(['git', 'symbolic-ref', '--short', '-q', 'HEAD'], { cwd, timeoutMs: GIT_TIMEOUT_MS })
    return git.exitCode === 0 ? git.stdout.trim() : ''
  } catch {
    return ''
  }
}

/** The effort for `model`: what its last request sent, else the env override, else its settings. */
async function effortOf($: EngineInterface, model: string): Promise<unknown> {
  if (lastStep && lastStep.model === model) return lastStep.effort
  const fromEnv = await $.env.get('CLAUDE_CODE_EFFORT_LEVEL')
  if (fromEnv) return fromEnv
  const perModel = await $.settings.read({ key: 'modelSettings' })
  const models = perModel && typeof perModel === 'object' ? (perModel as Record<string, unknown>) : {}
  const entry = models[model] ?? models[model.replace(/\[1m\]$/i, '')]
  const own = entry && typeof entry === 'object' ? (entry as Record<string, unknown>).effortLevel : undefined
  return typeof own === 'string' ? own : $.settings.read({ key: 'effortLevel' })
}

async function titleOf($: EngineInterface, cwd: string, model: string | undefined, task = ''): Promise<string> {
  const current = model || (await $.session.model().catch(() => ''))
  return buildTitle({
    label: await $.env.get('NTH_SESSION_TITLE_LABEL'),
    cwd,
    branch: await branchOf($, cwd),
    model: current,
    effort: current ? await effortOf($, current) : undefined,
    task,
  })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'task',
      description: 'Set the task part of this session title (empty: remove it)',
      argumentHint: '[task]',
    })
    return next(e)
  })

  // Only a brand-new conversation with no title yet; resume, fork, clear and compact keep theirs.
  on('classic.SessionStart', async ($, e, next) => {
    const result = await next(e)
    if (e.source !== 'startup' || e.session_title || e.agent_type || result.sessionTitle) return result
    try {
      const title = await titleOf($, e.cwd, e.model)
      return title ? { ...result, sessionTitle: title } : result
    } catch {
      return result
    }
  })

  on('turn.step', async function* ($, e, next) {
    if (e.agentId === undefined) lastStep = { model: e.model, effort: typeof e.effort === 'string' ? e.effort : '' }
    return yield* next(e)
  })

  on('command.run', { command: 'task' }, async ($, e) => {
    const task = cleanTask(e.args)
    const title = await titleOf($, await $.session.cwd(), undefined, task)
    if (!title) return { text: 'Nothing to name this session with.' }
    $.clock.after(RENAME_DELAY_MS, () => {
      $.command.run({ command: 'rename', args: title }).catch(error => $.ui.toast(`Title not set: ${String(error)}`))
    })
    return { text: `Title: ${title}` }
  })
}
