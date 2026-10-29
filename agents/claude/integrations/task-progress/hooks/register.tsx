import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Progress } from '../types'
import {
  applyTaskCreate,
  applyTaskUpdate,
  applyTodoWrite,
  bandView,
  checkpointText,
  cliView,
  countWork,
  emptyProgress,
  onApprovalAsked,
  onToolSettled,
  onTurnComplete,
  onTurnStart,
  paneView,
  panelFill,
  parseTaskCreate,
  parseTaskFile,
  parseTaskUpdate,
  reconcileTasks,
  restore,
  upgrade,
} from './progress'
import type { Seg, TaskFile } from './progress'

// Records what the native task tools did; it never denies, rewrites a tool call, calls a model or
// adds a tool. Its effects on the model: the native stale-checklist reminder is shortened to a
// checkpoint note while a checklist is open, and dropped otherwise; `/task-progress` answers with
// one line when the person runs it.

const progress = atom({ plugin: 'nth-task-progress', key: 'progress' } as const, null)
// Whether the pane lists every step; the session's alone, never stored.
const isExpanded = atom({ plugin: 'nth-task-progress', key: 'isExpanded' } as const, false)
const PANE = 'task-progress'
const COMMAND = 'task-progress'
const TRACKED = /^(TodoWrite|TaskCreate|TaskUpdate)$/
const NOT_WORK =
  /^(TodoWrite|TaskCreate|TaskUpdate|TaskList|TaskGet|TaskOutput|TaskStop|ToolSearch|AskUserQuestion|Skill|ExitPlanMode)$/
const SESSIONS = 'sessions'
const KEPT_SESSIONS = 20
const MAX_TASK_FILES = 100

const storeKey = (sessionId: string) => `progress:${sessionId}`

async function stored($: EngineInterface, sessionId: string): Promise<Progress | null> {
  const value = upgrade(await $.store.get(storeKey(sessionId)))
  return value?.sessionId === sessionId ? restore(value) : null
}

/** This session's progress as held (kept across reloads) or stored, without creating one. */
async function shown($: EngineInterface): Promise<Progress | null> {
  const sessionId = await $.session.id()
  const held = upgrade(await read($, progress))
  return held?.sessionId === sessionId ? held : stored($, sessionId)
}

async function load($: EngineInterface): Promise<Progress> {
  return (await shown($)) ?? emptyProgress(await $.session.id(), await $.clock.now())
}

async function persist($: EngineInterface, value: Progress): Promise<void> {
  await $.store.set(storeKey(value.sessionId), value)
  const listed = await $.store.get(SESSIONS)
  const ids = Array.isArray(listed) ? listed.filter((id): id is string => typeof id === 'string') : []
  if (ids[0] === value.sessionId) return
  const kept = [value.sessionId, ...ids.filter(id => id !== value.sessionId)]
  for (const id of kept.slice(KEPT_SESSIONS)) await $.store.delete(storeKey(id))
  await $.store.set(SESSIONS, kept.slice(0, KEPT_SESSIONS))
}

async function applyChange($: EngineInterface, apply: (p: Progress, now: number) => Progress): Promise<void> {
  const base = await load($)
  const now = await $.clock.now()
  let next = base
  await update($, progress, held => {
    const current = upgrade(held)
    next = apply(current?.sessionId === base.sessionId ? current : base, now)
    return next
  })
  await persist($, next)
}

// Changes run one at a time, so the store receives each state in order.
let queue: Promise<void> = Promise.resolve()

function change($: EngineInterface, apply: (p: Progress, now: number) => Progress): Promise<void> {
  const run = queue.then(() => applyChange($, apply))
  queue = run.catch(() => undefined)
  return run
}

/** A change to the session's held progress only, stored with the next change (a restore resets it). */
async function adjust($: EngineInterface, apply: (p: Progress) => Progress): Promise<void> {
  const sessionId = await $.session.id()
  await update($, progress, held => {
    const current = upgrade(held)
    return current?.sessionId === sessionId ? apply(current) : held
  })
}

/**
 * The person asked: the pane opens listing every step, placed at any width. The open is called
 * before any await: a Button's press counts as asked only while its handler runs, and an open
 * after it settled is unasked, left unplaced below 144 columns.
 */
async function openPane($: EngineInterface): Promise<void> {
  const opened = $.ui.open({ id: PANE, title: 'Tasks', focus: true, closeOnEscape: true })
  await update($, isExpanded, () => true)
  await opened
}

/** VS Code draws no band: its compact summary is the pane, opened unasked and collapsed once per attach. */
async function showOnVsCode($: EngineInterface): Promise<void> {
  if ((await $.ui.panes()).some(pane => pane.id === PANE)) return
  await update($, isExpanded, () => false)
  await $.ui.open({ id: PANE, title: 'Tasks' })
}

function parent(path: string): string {
  return path.replace(/[\\/]+$/, '').replace(/[\\/][^\\/]*$/, '')
}

function basename(path: string): string {
  return path.replace(/[\\/]+$/, '').replace(/^.*[\\/]/, '')
}

/** The native task list's folder: `<config>/tasks/<list id>`, the list id the session's unless set. */
async function taskDir($: EngineInterface): Promise<string | null> {
  const folder = parent($.plugin.root)
  const config =
    (await $.env.get('CLAUDE_CONFIG_DIR')) ?? (basename(folder) === 'skills' ? parent(folder) : null)
  if (!config) return null
  const listId = (await $.env.get('CLAUDE_CODE_TASK_LIST_ID')) ?? (await $.session.id())
  return `${config}/tasks/${listId.replace(/[^a-zA-Z0-9_-]/g, '-')}`
}

/** The native task files, or null when they cannot be read (then events alone stand). */
async function readTaskFiles($: EngineInterface): Promise<TaskFile[] | null> {
  try {
    const dir = await taskDir($)
    if (!dir || !(await $.fs.exists(dir))) return null
    const names = (await $.fs.list(dir))
      .filter(entry => entry.kind === 'file' && entry.name.endsWith('.json') && !entry.name.startsWith('.'))
      .slice(0, MAX_TASK_FILES)
    const files: TaskFile[] = []
    for (const entry of names) {
      try {
        const task = parseTaskFile(await $.fs.read(`${dir}/${entry.name}`))
        if (task) files.push(task)
      } catch {
        // A file removed or rewritten meanwhile: the rest still count.
      }
    }
    return files
  } catch {
    return null
  }
}

/** The main loop's checkpoint note for an open checklist; null for a subagent or no open checklist. */
async function checkpoint($: EngineInterface, agentId: string | undefined): Promise<string | null> {
  return agentId === undefined ? checkpointText(await shown($)) : null
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.command.register({ name: COMMAND, description: 'Show the native task list and its progress' })
    const files = await readTaskFiles($)
    await change($, (p, now) => reconcileTasks(p, files, now))
    if ((await $.session.surfaces()).includes('vscode')) await showOnVsCode($).catch(() => undefined)
    return started
  })

  on('session.attach', { surface: 'vscode' }, async ($, e, next) => {
    const attached = await next(e)
    await showOnVsCode($).catch(() => undefined)
    return attached
  })

  on('session.end', async ($, e, next) => {
    const ended = await next(e)
    if (e.reason === 'clear') {
      await update($, progress, () => null)
      await update($, isExpanded, () => false)
    }
    return ended
  })

  // Recorded before the turn runs, so its own turn.complete always lands after. A subagent's or
  // background agent's turn is not the main turn: it never sets Running.
  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) await change($, onTurnStart)
    return next(e)
  })

  on('tool.call', { tool: TRACKED }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny !== undefined || ran.isError === true) return ran
    const tool = String(e.tool)
    if (e.agentId !== undefined) {
      // A subagent's task change lands in the shared task files: counted at once for a task plan.
      if (tool !== 'TodoWrite' && (await shown($))?.source === 'task') {
        const files = await readTaskFiles($)
        await change($, (p, now) => (p.source === 'task' && p.steps.length > 0 ? reconcileTasks(p, files, now) : p))
      }
      return ran
    }
    if (tool === 'TodoWrite') {
      await change($, (p, now) => applyTodoWrite(p, e, now))
    } else if (tool === 'TaskCreate') {
      const created = parseTaskCreate(e, ran.result, ran.text)
      const files = await readTaskFiles($)
      if (created) await change($, (p, now) => reconcileTasks(applyTaskCreate(p, created, now), files, now))
    } else if (tool === 'TaskUpdate') {
      const updated = parseTaskUpdate(e, ran.result)
      const files = await readTaskFiles($)
      if (updated) await change($, (p, now) => reconcileTasks(applyTaskUpdate(p, updated, now), files, now))
    }
    return ran
  }).catch(($, e, next) => next(e))

  // Work the checklist has not recorded, counted as the call starts: a checklist update finishing
  // later in the same batch still clears it. Kept in the session's state, stored at the next change.
  // A main-loop call settling also ends the approval its permission dialog raised.
  on('tool.call', async ($, e, next) => {
    const tool = String(e.tool)
    if (e.agentId === undefined && !NOT_WORK.test(tool)) await adjust($, countWork)
    const ran = await next(e)
    if (e.agentId === undefined) await adjust($, p => onToolSettled(p, tool))
    return ran
  }).catch(($, e, next) => next(e))

  // The engine draws the permission dialog itself; this is the one sign it is up. A dialog a settings
  // hook answered never showed, and a subagent's approval is not the main turn's.
  on('classic.PermissionRequest', async ($, e, next) => {
    const asked = await next(e)
    if (e.agent_id === undefined && asked.decision === undefined && asked.block === undefined) {
      await adjust($, p => onApprovalAsked(p, e.tool_name))
    }
    return asked
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const completed = await next(e)
    if (e.agentId === undefined) {
      const files = (await shown($))?.source === 'task' ? await readTaskFiles($) : null
      const reason = e.isAborted ? 'aborted' : e.reason
      await change($, (p, now) => onTurnComplete(reconcileTasks(p, files, now), reason, now))
    }
    return completed
  })

  // The native stale-checklist reminder: a short checkpoint while a checklist is open, else nothing.
  on('prompt.attachment', { type: 'todo_reminder' }, async ($, e, next) => {
    const text = await checkpoint($, e.agentId)
    return text === null ? { text: null } : next({ ...e, text })
  })
  on('prompt.attachment', { type: 'task_reminder' }, async ($, e, next) => {
    const text = await checkpoint($, e.agentId)
    return text === null ? { text: null } : next({ ...e, text })
  })

  on('command.run', { command: COMMAND }, async $ => {
    if ((await $.session.surfaces()).length === 0) return { text: 'No surface here draws the task-progress pane.' }
    await openPane($)
    return { text: 'Task progress opened.' }
  })

  // The terminal: a rounded panel (state, bar, counts, `Tasks`; then the current task) where the
  // height leaves nth-status its panel too, else one row. The desktop: one row: state, bar, counts,
  // the current step cut to fit, and `Tasks`, which opens the pane. VS Code shows the pane instead.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || e.surface === 'vscode') return next(e)
    if (e.surface === 'terminal') {
      const cli = cliView(await shown($), e.props.isWorking, e.props.bodyColumns, e.props.maxRows)
      const below = await next(e)
      if (!cli) return below
      const fill = cli.isPanel ? panelFill(await $.settings.read({ key: 'theme' })) : undefined
      const { Box, Text, Button } = $.ui.resolve(e)
      const draw = (seg: Seg) => (
        <Text color={seg.color} dimColor={seg.isDim} bold={seg.isBold} wrap="truncate-end">
          {seg.text}
        </Text>
      )
      const row = (
        <Box flexDirection="row">
          {cli.row.map(draw)}
          {cli.hasButton && <Text> </Text>}
          {cli.hasButton &&
            (cli.isPanel ? (
              <Button key="tasks" variant="secondary" onPress={() => void openPane($)}>
                Tasks ▾
              </Button>
            ) : (
              <Button key="tasks" plain dimColor onPress={() => void openPane($)}>
                Tasks
              </Button>
            ))}
        </Box>
      )
      return (
        <Box flexDirection="column">
          {cli.isPanel ? (
            <Box
              flexDirection="column"
              borderStyle="round"
              borderColor="subtle"
              paddingX={1}
              {...(fill ? { backgroundColor: fill } : {})}
            >
              {row}
              {cli.current.length > 0 && <Text wrap="truncate-end">{cli.current.map(draw)}</Text>}
            </Box>
          ) : (
            row
          )}
          {below}
        </Box>
      )
    }
    const view = bandView(await shown($), e.props.isWorking, e.props.bodyColumns)
    const below = await next(e)
    if (!view) return below
    const { Box, Text, Button } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Box flexDirection="row">
          {view.segs.map(seg => (
            <Text color={seg.color} dimColor={seg.isDim} wrap="truncate-end">
              {seg.text}
            </Text>
          ))}
          {view.hasButton && <Text> </Text>}
          {view.hasButton && (
            <Button key="tasks" plain dimColor onPress={() => void openPane($)}>
              Tasks
            </Button>
          )}
        </Box>
        {below}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const view = paneView(await shown($))
    const isOpen = await read($, isExpanded)
    const { Box, Text, Button } = $.ui.resolve(e)
    const hasPlan = view.rows.length > 0
    return (
      <Box flexDirection="column">
        <Box flexDirection="row">
          {view.head.map(seg => (
            <Text color={seg.color} dimColor={seg.isDim} wrap="truncate-end">
              {seg.text}
            </Text>
          ))}
        </Box>
        {view.current.length > 0 && (
          <Text>
            {view.current.map(seg => (
              <Text color={seg.color} dimColor={seg.isDim}>
                {seg.text}
              </Text>
            ))}
          </Text>
        )}
        {!hasPlan && <Text dimColor>No native task list in this session.</Text>}
        {hasPlan && (
          <Button key="toggle" plain onPress={() => void update($, isExpanded, open => !open)}>
            {isOpen ? 'Hide tasks ▴' : `Show ${view.rows.length} task${view.rows.length === 1 ? '' : 's'} ▾`}
          </Button>
        )}
        {hasPlan &&
          isOpen &&
          view.rows.map(row => (
            <Text>
              <Text color={row.color}>{`${row.glyph} `}</Text>
              <Text dimColor={row.isDim}>{row.text}</Text>
            </Text>
          ))}
      </Box>
    )
  })
}
