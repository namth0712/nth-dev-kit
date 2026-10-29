import type { Progress, Step, TPlanChange, TStepStatus } from '../types'

// Pure progress logic: no `$`, so every rule here is testable on its own.

const MAX_STEPS = 100
const MAX_TEXT = 200

export type TTurnEnd = 'answer' | 'aborted' | 'refusal' | 'error'

export type Summary = {
  completed: number
  total: number
  current: { text: string; isNext: boolean } | null
}

/** How the main loop is running, apart from how far the checklist is. */
export type TExecState = 'running' | 'approval' | 'completed' | 'interrupted' | 'failed' | 'paused' | 'idle'

/** Theme keys only: they follow the person's light or dark theme. */
export type TColor = 'claude' | 'permission' | 'success' | 'warning' | 'error' | 'inactive' | 'subtle' | 'text'

/** One run of text in a row; `isDim` is a muted label. */
export type Seg = { text: string; color?: TColor; isDim?: boolean; isBold?: boolean }

/** `hasButton`: a checklist exists and the row has room for the `Tasks` button. */
export type BandView = { segs: Seg[]; hasButton: boolean }

/**
 * The terminal band: a rounded panel (the head row, then the current task) where the height allows,
 * else one compact row. `row` is the head row (state, bar, counts; compact: the current task too).
 */
export type CliView = { isPanel: boolean; row: Seg[]; current: Seg[]; hasButton: boolean }

export type PaneRow = { key: string; glyph: string; text: string; color: TColor; isDim: boolean }

export type PaneView = { head: Seg[]; current: Seg[]; rows: PaneRow[] }

export type CreatedTask = { id: string; text: string; activeText: string }

export type UpdatedTask = {
  id: string
  status?: TStepStatus | 'deleted'
  text?: string
  activeText?: string
}

/** One native task file, `<config>/tasks/<list>/<id>.json`. */
export type TaskFile = {
  id: string
  text: string
  activeText: string
  status: TStepStatus | 'deleted'
}

export function emptyProgress(sessionId: string, now: number): Progress {
  return {
    v: 2,
    sessionId,
    phase: 'idle',
    source: null,
    steps: [],
    change: null,
    delta: 0,
    work: 0,
    settled: false,
    taskFloor: null,
    approval: null,
    updatedAt: now,
  }
}

function isComplete(p: { steps: Step[] }): boolean {
  return p.steps.length > 0 && p.steps.every(step => step.status === 'completed')
}

function hasStarted(p: Progress): boolean {
  return p.steps.some(step => step.status !== 'pending')
}

/** A stored or held record as the current shape, a version 1 record upgraded; anything else null. */
export function upgrade(value: unknown): Progress | null {
  if (typeof value !== 'object' || value === null) return null
  const p = value as Partial<Omit<Progress, 'v'>> & { v?: unknown }
  if (typeof p.sessionId !== 'string' || typeof p.phase !== 'string' || !Array.isArray(p.steps)) {
    return null
  }
  if (p.v !== 1 && p.v !== 2) return null
  const { ignored: _ignored, ...rest } = p as Progress & { ignored?: unknown }
  return {
    ...rest,
    v: 2,
    work: typeof p.work === 'number' && Number.isFinite(p.work) ? p.work : 0,
    settled: typeof p.settled === 'boolean' ? p.settled : isComplete(p as Progress),
    taskFloor: typeof p.taskFloor === 'number' ? p.taskFloor : null,
    approval: typeof p.approval === 'string' ? p.approval : null,
  }
}

/** Progress read back from storage: a turn it recorded as running did not end in this process. */
export function restore(p: Progress): Progress {
  const base = p.approval === null ? p : { ...p, approval: null }
  return base.phase === 'working' ? { ...base, phase: 'interrupted' } : base
}

/** A new turn keeps the checklist as it is, finished or not: only a new list replaces it. */
export function onTurnStart(p: Progress, now: number): Progress {
  return { ...p, phase: 'working', change: null, delta: 0, settled: isComplete(p), approval: null, updatedAt: now }
}

/** A permission dialog was raised for a main-loop tool call. */
export function onApprovalAsked(p: Progress, tool: string): Progress {
  return p.approval === tool ? p : { ...p, approval: tool }
}

/**
 * A main-loop call of that tool settled: approved and run, denied, or failed. Nothing marks the
 * moment the person answers, so an approved call keeps the mark while it runs.
 */
export function onToolSettled(p: Progress, tool: string): Progress {
  return p.approval === tool ? { ...p, approval: null } : p
}

/**
 * The end of a turn never completes anything: only the checklist itself does.
 * An answer after work the unfinished checklist never recorded is tracking left incomplete.
 */
export function onTurnComplete(p: Progress, reason: TTurnEnd, now: number): Progress {
  const isOpen = p.steps.length > 0 && !isComplete(p)
  const phase =
    reason === 'answer'
      ? isOpen && p.work > 0
        ? 'stale'
        : 'awaiting'
      : reason === 'aborted'
        ? 'interrupted'
        : 'error'
  return { ...p, phase, settled: isComplete(p), approval: null, updatedAt: now }
}

/** One main-loop tool call that did not touch the checklist. */
export function countWork(p: Progress): Progress {
  return { ...p, work: p.work + 1 }
}

function clean(value: unknown): string {
  const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
  return text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT - 1)}…` : text
}

function toStatus(value: unknown): TStepStatus | undefined {
  return value === 'pending' || value === 'in_progress' || value === 'completed'
    ? value
    : undefined
}

function toId(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
}

function field(value: unknown, name: string): unknown {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)[name]
    : undefined
}

function makeStep(key: string, text: string, status: TStepStatus, activeText?: string): Step {
  return activeText ? { key, text, status, activeText } : { key, text, status }
}

/** Adding steps: part of a plan still being written, or an expansion once work began. */
function grown(p: Progress, added: number): Pick<Progress, 'change' | 'delta'> {
  if (!hasStarted(p) && (p.change === 'new' || p.change === 'replaced')) {
    return { change: p.change, delta: 0 }
  }
  return { change: 'expanded', delta: (p.change === 'expanded' ? p.delta : 0) + added }
}

/** How a new set of steps relates to the plan held, by key. */
function relate(p: Progress, steps: Step[]): Pick<Progress, 'change' | 'delta'> {
  if (p.steps.length === 0) return { change: 'new', delta: 0 }
  const after = new Set(steps.map(step => step.key))
  const kept = p.steps.filter(step => after.has(step.key)).length
  if (kept === 0) return { change: p.settled ? 'new' : 'replaced', delta: 0 }
  if (kept === p.steps.length) {
    const added = after.size - kept
    return added === 0 ? { change: p.change, delta: p.delta } : grown(p, added)
  }
  return { change: 'revised', delta: 0 }
}

/** The fields every checklist change resets: the work since it, and the settled mark. */
const touched = { phase: 'working' as const, work: 0, settled: false }

/** TodoWrite's input is the whole list, also when every item is completed. */
export function parseTodos(input: unknown): Step[] | undefined {
  const todos = field(input, 'todos')
  if (!Array.isArray(todos)) return undefined
  const seen = new Map<string, number>()
  const steps: Step[] = []
  for (const todo of todos.slice(0, MAX_STEPS)) {
    const text = clean(field(todo, 'content'))
    const status = toStatus(field(todo, 'status'))
    if (!text || !status) continue
    const count = seen.get(text) ?? 0
    seen.set(text, count + 1)
    const key = count === 0 ? `todo:${text}` : `todo:${text}#${count}`
    steps.push(makeStep(key, text, status, clean(field(todo, 'activeForm'))))
  }
  return steps
}

/** An emptied list keeps the last checklist: clearing it is no progress either way. */
export function applyTodoWrite(p: Progress, input: unknown, now: number): Progress {
  const steps = parseTodos(input)
  if (!steps || steps.length === 0) return p
  const change = p.source === 'todo' || p.steps.length === 0 || p.settled
    ? relate(p, steps)
    : { change: 'replaced' as const, delta: 0 }
  return { ...p, ...change, ...touched, source: 'todo', steps, updatedAt: now }
}

/** TaskCreate answers `{ task: { id } }`, read as the model does (`Task #<id> created`) failing that. */
export function parseTaskCreate(input: unknown, result: unknown, text?: string): CreatedTask | undefined {
  const fromText = /Task #(\S+) created/.exec(text ?? '')?.[1]
  const id = toId(field(field(result, 'task'), 'id')) || toId(fromText)
  const subject = clean(field(input, 'subject'))
  if (!id || !subject) return undefined
  return { id, text: subject, activeText: clean(field(input, 'activeForm')) }
}

/** Native task ids count up per list: a new plan's first id bounds the earlier plans' files. */
function floorOf(id: string): number | null {
  const n = Number(id)
  return Number.isFinite(n) ? n : null
}

export function applyTaskCreate(p: Progress, task: CreatedTask, now: number): Progress {
  const key = `task:${task.id}`
  const step = makeStep(key, task.text, 'pending', task.activeText)
  if (p.source !== 'task' || p.steps.length === 0 || p.settled) {
    const change = p.steps.length > 0 && !p.settled ? 'replaced' : 'new'
    return {
      ...p,
      ...touched,
      source: 'task',
      steps: [step],
      change,
      delta: 0,
      taskFloor: floorOf(task.id),
      updatedAt: now,
    }
  }
  if (p.steps.some(one => one.key === key)) return p
  if (p.steps.length >= MAX_STEPS) return p
  return { ...p, ...grown(p, 1), ...touched, steps: [...p.steps, step], updatedAt: now }
}

/** TaskUpdate's input names the change; a failed update (`success: false`) changed nothing. */
export function parseTaskUpdate(input: unknown, result: unknown): UpdatedTask | undefined {
  if (field(result, 'success') === false) return undefined
  const id = toId(field(input, 'taskId'))
  if (!id) return undefined
  const raw = field(input, 'status')
  const update: UpdatedTask = { id }
  const status = raw === 'deleted' ? 'deleted' : toStatus(raw)
  if (status) update.status = status
  const text = clean(field(input, 'subject'))
  if (text) update.text = text
  const activeText = clean(field(input, 'activeForm'))
  if (activeText) update.activeText = activeText
  return update
}

export function applyTaskUpdate(p: Progress, task: UpdatedTask, now: number): Progress {
  // An update to a task never seen created does not override a TodoWrite checklist.
  if (p.source === 'todo' && p.steps.length > 0) return p
  const key = `task:${task.id}`
  const base: Progress =
    p.source === 'task'
      ? p
      : { ...p, source: 'task', steps: [], change: p.steps.length > 0 ? 'replaced' : null, delta: 0 }
  const index = base.steps.findIndex(step => step.key === key)
  const status = task.status
  if (status === 'deleted') {
    if (index < 0) return p
    const steps = base.steps.filter((_, at) => at !== index)
    const change: TPlanChange | null = steps.length > 0 ? 'revised' : null
    return { ...base, ...touched, steps, change, delta: 0, updatedAt: now }
  }
  if (index < 0) {
    if (base.steps.length >= MAX_STEPS) return p
    // A task this record never saw created (made before a reload or a /clear).
    const step = makeStep(key, task.text ?? `Task #${task.id}`, status ?? 'pending', task.activeText)
    const change = base.steps.length > 0 ? grown(base, 1) : { change: base.change ?? 'new', delta: 0 }
    return { ...base, ...change, ...touched, steps: [...base.steps, step], updatedAt: now }
  }
  const held = base.steps[index]
  const isRenamed = task.text !== undefined && task.text !== held?.text
  const isSame =
    !isRenamed && (status ?? held?.status) === held?.status &&
    (task.activeText ?? held?.activeText) === held?.activeText
  // Re-stating a task as it is (an idempotent update) is no change: a settled plan stays settled.
  if (isSame) return p
  const steps = base.steps.map((step, at) => {
    if (at !== index) return step
    const activeText = task.activeText ?? step.activeText
    return makeStep(key, task.text ?? step.text, status ?? step.status, activeText)
  })
  const change = isRenamed ? { change: 'revised' as const, delta: 0 } : {}
  return { ...base, ...change, ...touched, steps, updatedAt: now }
}

/** One native task file's JSON, or undefined when it is not one. */
export function parseTaskFile(text: string): TaskFile | undefined {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return undefined
  }
  const id = toId(field(value, 'id'))
  const subject = clean(field(value, 'subject'))
  const raw = field(value, 'status')
  const status = raw === 'deleted' ? 'deleted' : toStatus(raw)
  if (!id || !subject || !status) return undefined
  return { id, text: subject, activeText: clean(field(value, 'activeForm')), status }
}

function byId(a: TaskFile, b: TaskFile): number {
  const x = Number(a.id)
  const y = Number(b.id)
  return Number.isFinite(x) && Number.isFinite(y) ? x - y : a.id.localeCompare(b.id)
}

function sameSteps(a: Step[], b: Step[]): boolean {
  return a.length === b.length && a.every((step, at) => {
    const other = b[at]
    return other !== undefined && step.key === other.key && step.text === other.text &&
      step.status === other.status && step.activeText === other.activeText
  })
}

/**
 * The native task files are the authority for a task plan: statuses any loop set are taken from
 * them. No files, or none left once deleted and earlier plans' tasks are dropped, keeps the plan.
 */
export function reconcileTasks(p: Progress, files: TaskFile[] | null, now: number): Progress {
  if (!files || (p.source === 'todo' && p.steps.length > 0)) return p
  const floor = p.taskFloor
  const live = files
    .filter(task => task.status !== 'deleted')
    .filter(task => floor === null || !(Number(task.id) < floor))
    .sort(byId)
    .slice(0, MAX_STEPS)
  if (live.length === 0) return p
  const steps = live.map(task =>
    makeStep(`task:${task.id}`, task.text, task.status as TStepStatus, task.activeText),
  )
  if (p.source === 'task' && sameSteps(p.steps, steps)) return p
  const isStatusChange =
    p.source !== 'task' ||
    steps.some(step => p.steps.find(one => one.key === step.key)?.status !== step.status)
  const base: Progress = p.source === 'task' ? p : { ...p, steps: [], change: null, delta: 0 }
  const change = relate({ ...base, settled: false }, steps)
  return {
    ...p,
    ...change,
    source: 'task',
    steps,
    ...(isStatusChange ? { work: 0, settled: false } : {}),
    updatedAt: now,
  }
}

/** The compact text standing in for the native "task list not used recently" reminder. */
export function checkpointText(p: Progress | null): string | null {
  if (!p || p.steps.length === 0 || isComplete(p)) return null
  const s = summarize(p)
  const current = s.current && !s.current.isNext ? `, current: "${s.current.text}"` : ''
  const tool = p.source === 'todo' ? 'TodoWrite' : 'TaskUpdate'
  return (
    `Checklist checkpoint: ${s.completed}/${s.total} done${current}. ` +
    `If statuses changed, update them with ${tool} now; do not add steps or work because of this note.`
  )
}

export function summarize(p: Progress | null): Summary {
  const steps = p?.steps ?? []
  const total = steps.length
  const completed = steps.filter(step => step.status === 'completed').length
  const active = steps.find(step => step.status === 'in_progress')
  const next = steps.find(step => step.status === 'pending')
  const current = active
    ? { text: active.activeText || active.text, isNext: false }
    : next
      ? { text: next.text, isNext: true }
      : null
  return { completed, total, current }
}

function describeChange(p: Progress): string | null {
  if (p.change === 'expanded') return p.delta > 0 ? `plan +${p.delta}` : 'plan expanded'
  if (p.change === 'revised') return 'plan revised'
  if (p.change === 'replaced') return 'plan replaced'
  return null
}

/**
 * Running is the main loop's turn only (subagent and background turns are not recorded), and only
 * while the surface says a turn runs (`isWorking`, where it is known): a record left `working` by a
 * turn that never ended is not shown as running. A finished checklist is Completed once the turn ends.
 */
export function execState(p: Progress | null, isWorking?: boolean): TExecState {
  const phase = p?.phase ?? 'idle'
  if (phase === 'working' && isWorking !== false) return p?.approval ? 'approval' : 'running'
  if (p && isComplete(p)) return 'completed'
  if (phase === 'interrupted') return 'interrupted'
  if (phase === 'error') return 'failed'
  return p && p.steps.length > 0 ? 'paused' : 'idle'
}

const LOOKS: Record<TExecState, { glyph: string; label: string; color: TColor }> = {
  running: { glyph: '●', label: 'Running', color: 'claude' },
  approval: { glyph: '◆', label: 'Waiting for approval', color: 'permission' },
  completed: { glyph: '✓', label: 'Completed', color: 'success' },
  interrupted: { glyph: '✕', label: 'Interrupted', color: 'warning' },
  failed: { glyph: '!', label: 'Turn failed', color: 'error' },
  paused: { glyph: '◌', label: 'Paused', color: 'inactive' },
  idle: { glyph: '○', label: 'Idle', color: 'inactive' },
}

/** A thin bar of `width` cells: completed/total of them filled, full only when every step is done. */
export function bar(completed: number, total: number, width: number): { filled: string; empty: string } {
  const filled = total > 0 ? Math.min(width, Math.floor((completed * width) / total)) : 0
  return { filled: '━'.repeat(filled), empty: '─'.repeat(width - filled) }
}

const BAR_WIDTH = 10
const NARROW_BAR_WIDTH = 5
/** The band's `Tasks` button as the terminal draws it plain, with the space before it. */
const BUTTON_COLUMNS = 6
const MIN_CURRENT = 8

function cut(text: string, room: number): string {
  return text.length > room ? `${text.slice(0, Math.max(0, room - 1))}…` : text
}

/** State, then (with a checklist) the bar and the counts; without one, a neutral `No plan`, never 0%. */
function head(p: Progress | null, state: TExecState, s: Summary, barWidth: number): Seg[] {
  const look = LOOKS[state]
  const segs: Seg[] = [{ text: `${look.glyph} ${look.label}`, color: look.color }]
  if (s.total === 0) return [...segs, { text: ' · No plan', isDim: true }]
  const { filled, empty } = bar(s.completed, s.total, barWidth)
  segs.push({ text: ' ' }, { text: filled, color: look.color }, { text: empty, color: 'subtle' })
  segs.push({ text: ` ${s.completed}/${s.total}`, color: 'text' })
  // The main loop answered after work the open checklist never recorded: its counts may lag.
  if (state === 'paused' && p?.phase === 'stale') segs.push({ text: ' · list not updated', isDim: true })
  return segs
}

/** The step in progress (its active form), else the next pending one; nothing once every step is done. */
function current(s: Summary, room: number): Seg[] {
  if (!s.current || room < MIN_CURRENT) return []
  if (!s.current.isNext) return [{ text: ' · ', isDim: true }, { text: cut(s.current.text, room - 3) }]
  return [{ text: ' · next: ', isDim: true }, { text: cut(s.current.text, room - 9) }]
}

function width(segs: Seg[]): number {
  return segs.reduce((sum, seg) => sum + seg.text.length, 0)
}

/**
 * The band's one row; null (hidden) while idle with no checklist. Where it is too narrow the
 * current step, then the `Tasks` button, are left out, so it never wraps onto a second row.
 */
export function bandView(p: Progress | null, isWorking: boolean | undefined, columns: number): BandView | null {
  const state = execState(p, isWorking)
  const s = summarize(p)
  if (state === 'idle' && s.total === 0) return null
  const segs = head(p, state, s, columns >= 60 ? BAR_WIDTH : NARROW_BAR_WIDTH)
  if (s.total === 0) return { segs, hasButton: false }
  const hasButton = width(segs) + BUTTON_COLUMNS <= columns
  return { segs: [...segs, ...current(s, columns - width(segs) - BUTTON_COLUMNS)], hasButton }
}

/**
 * The terminal's height contract with nth-status, which draws its own rounded panel under this band
 * and cannot measure it: this panel takes `TASK_PANEL_ROWS` only where `STATUS_PANEL_ROWS` stay
 * for nth-status's panel too, else this band is one row. nth-status reserves the same.
 */
export const TASK_PANEL_ROWS = 4
export const STATUS_PANEL_ROWS = 6
/** The panel's border and one cell of padding, each side. */
const PANEL_INSET = 4
/** `[ Tasks ▾ ]` as the terminal draws a Button, and the space before it. */
const PANEL_BUTTON_COLUMNS = 12
const MIN_PANEL_BAR = 6
const COMPACT_BAR_WIDTH = 8
const NARROW_COMPACT_BAR_WIDTH = 5

/** The bar of the terminal band: one heavy glyph throughout, the track in the theme's `subtle`. */
function heavyBar(s: Summary, look: { color: TColor }, cells: number): Seg[] {
  const { filled } = bar(s.completed, s.total, cells)
  const segs: Seg[] = [{ text: filled, color: look.color }, { text: '━'.repeat(cells - filled.length), color: 'subtle' }]
  return segs.filter(seg => seg.text.length > 0)
}

function counts(s: Summary): Seg[] {
  const percent = Math.floor((s.completed * 100) / s.total)
  return [{ text: ` ${s.completed}/${s.total}`, color: 'text' }, { text: ' · ', isDim: true }, { text: `${percent}%`, color: 'text' }]
}

/** The current task, muted: the one in progress, else the next; once all are done, a count. */
function currentTask(p: Progress | null, s: Summary): string {
  const note = p?.phase === 'stale' ? 'List not updated · ' : ''
  if (!s.current) return `${note}All ${s.total} tasks completed`
  return `${note}${s.current.isNext ? 'Next: ' : ''}${s.current.text}`
}

/**
 * The terminal band; null (hidden) while idle with no checklist. A panel where `maxRows` leaves
 * nth-status its own and the head row fits; else one row, the current task and then the button
 * dropped where there is no room.
 */
export function cliView(p: Progress | null, isWorking: boolean | undefined, columns: number, maxRows: number): CliView | null {
  const state = execState(p, isWorking)
  const s = summarize(p)
  if (state === 'idle' && s.total === 0) return null
  const look = LOOKS[state]
  const head: Seg[] = [{ text: `${look.glyph} ${look.label}`, color: look.color, isBold: true }]
  const isTall = maxRows >= TASK_PANEL_ROWS + STATUS_PANEL_ROWS
  if (s.total === 0) {
    return { isPanel: isTall, row: [...head, { text: ' · No plan', isDim: true }], current: [], hasButton: false }
  }
  const inner = columns - PANEL_INSET
  const fixed = width(head) + 1 + width(counts(s))
  if (isTall && inner - fixed >= MIN_PANEL_BAR) {
    const hasButton = inner - fixed - PANEL_BUTTON_COLUMNS >= MIN_PANEL_BAR
    const cells = inner - fixed - (hasButton ? PANEL_BUTTON_COLUMNS : 0)
    const row = [...head, { text: ' ' }, ...heavyBar(s, look, cells), ...counts(s)]
    return { isPanel: true, row, current: [{ text: cut(currentTask(p, s), inner), isDim: true }], hasButton }
  }
  const segs = [...head, { text: ' ' }, ...heavyBar(s, look, columns >= 60 ? COMPACT_BAR_WIDTH : NARROW_COMPACT_BAR_WIDTH), ...counts(s)]
  const room = columns - width(segs) - BUTTON_COLUMNS
  const task = s.current && room >= MIN_CURRENT ? [{ text: ' · ', isDim: true }, { text: cut(currentTask(p, s), room - 3), isDim: true }] : []
  return { isPanel: false, row: [...segs, ...task], current: [], hasButton: width(segs) + BUTTON_COLUMNS <= columns }
}

/** A raw fill per theme family: no theme key names a background. The same as nth-status's panel. */
export function panelFill(theme: unknown): string | undefined {
  if (theme === 'dark' || theme === 'dark-daltonized') return '#22252b'
  if (theme === 'light' || theme === 'light-daltonized') return '#f2f3f5'
  return undefined
}

const STEP_LOOKS: Record<TStepStatus, { glyph: string; color: TColor; isDim: boolean }> = {
  completed: { glyph: '✓', color: 'success', isDim: true },
  in_progress: { glyph: '●', color: 'claude', isDim: false },
  pending: { glyph: '○', color: 'inactive', isDim: false },
}

/** The detail pane: the band's head with the plan change, the current step (wrapped), and every step. */
export function paneView(p: Progress | null): PaneView {
  const s = summarize(p)
  const change = p && s.total > 0 ? describeChange(p) : null
  const segs = head(p, execState(p), s, BAR_WIDTH)
  const rows = (p?.steps ?? []).map(step => ({ key: step.key, text: step.text, ...STEP_LOOKS[step.status] }))
  const now: Seg[] = s.current
    ? [{ text: s.current.isNext ? 'Next: ' : 'Now: ', isDim: true }, { text: s.current.text }]
    : []
  return { head: change ? [...segs, { text: ` · ${change}`, isDim: true }] : segs, current: now, rows }
}
