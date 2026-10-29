import { describe, expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

const PLUGIN = 'nth-task-progress'
const PANE = 'task-progress'
const SURFACES = ['terminal', 'desktop', 'vscode'] as const

type TSurface = (typeof SURFACES)[number]
type Session = { id: string; surfaces: string[]; opened: string[] }

const session = (id = 'S1'): Session => ({ id, surfaces: ['terminal'], opened: [] })

/** The engine beneath the plugin: a session id the test switches, a clock, a store, tools and panes. */
function world(on: On, s: Session, entries?: Record<string, unknown>) {
  mock.clock(on, { now: 1000 })
  mock.store(on, entries)
  let nextTask = 0
  on('session.id', () => ({ value: s.id }))
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('session.end', ($, e) => ({ sessionId: e.sessionId }))
  on('session.attach', ($, e) => ({ clientId: e.clientId }))
  on('session.surfaces', () => ({ value: s.surfaces }) as never)
  on('command.register', ($, e) => ({ value: { command: e.name } }) as never)
  on('ui.open', ($, e) => {
    s.opened.push(e.id)
    return { value: { isPlaced: true } } as never
  })
  on('ui.panes', () => ({ value: s.opened.map(id => ({ id, title: 'Tasks' })) }) as never)
  on('settings.read', () => ({ value: { theme: 'dark' } }) as never)
  on('prompt.submit', ($, e) => ({ text: e.text }))
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('turn.complete', ($, e) => ({ text: e.answer }))
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => $.ui.resolve(e).Box({}))
  on('prompt.attachment', ($, e) => ({ text: e.text }))
  on('tool.call', ($, e) => {
    const input = e as unknown as Record<string, unknown>
    const tool = String(e.tool)
    if (tool === 'TaskCreate') {
      nextTask += 1
      const subject = String(input.subject)
      return {
        result: { task: { id: String(nextTask), subject } },
        text: `Task #${nextTask} created successfully: ${subject}`,
      } as never
    }
    if (tool === 'TaskUpdate') {
      return { result: { success: true, taskId: input.taskId, updatedFields: ['status'] }, text: 'Updated' } as never
    }
    return { result: { oldTodos: [], newTodos: input.todos }, text: 'Todos have been modified' } as never
  })
}

type BandOptions = { surface?: TSurface; columns?: number; isWorking?: boolean; rows?: number }

const bandProps = ({ columns = 40, isWorking = true, rows = 6 }: BandOptions) => ({
  hasSurvey: false,
  isWorking,
  maxRows: rows,
  bodyColumns: columns,
  scroll: { offset: 0, bodyRows: rows },
  view: {},
})

/** The band's row as text (the desktop's one-row band unless a surface is named); empty while it draws nothing of its own. */
async function band($: Engine, options: BandOptions = {}) {
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: options.surface ?? 'desktop', component: 'AbovePrompt', props: bandProps(options) })
  const texts = (await ui.findAll({ type: 'Text' })).map(found => found.text)
  await ui.unmount()
  return texts.join('').trimEnd()
}

async function bandButtons($: Engine) {
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: bandProps({}) })
  const keys = (await ui.findAll({ type: 'Button' })).map(found => found.key)
  await ui.unmount()
  return keys
}

const paneMount = ($: Engine, surface: TSurface) =>
  $.ui.mount({
    plugin: PLUGIN,
    surface,
    component: 'Pane',
    requestId: PANE,
    props: { title: 'Tasks', isFocused: true, bodyColumns: 60, placement: 'inline', scroll: { offset: 0, bodyRows: 20 }, view: {} },
  } as never)

/** The pane's text and Button labels; `press` presses one Button first, then it is drawn afresh. */
async function pane($: Engine, surface: TSurface = 'terminal', press?: string) {
  if (press) {
    const pressed = await paneMount($, surface)
    await pressed.press({ key: press })
    await pressed.unmount()
  }
  const ui = await paneMount($, surface)
  const text = (await ui.findAll({ type: 'Text' })).map(found => found.text).join('\n')
  const buttons = (await ui.findAll({ type: 'Button' })).map(found => found.text)
  await ui.unmount()
  return { text, buttons }
}

const prompt = (text = 'do it') => ({ text, wait: false, origin: { kind: 'person' } }) as never
const turn = (text = 'do it') => ({ text, turnId: 't' }) as never
const agentTurn = (agentId: string) => ({ text: 'background', turnId: 'b', agentId }) as never
const ended = (reason: 'answer' | 'aborted', agentId?: string) =>
  ({ answer: '', durationMs: 1, isAborted: reason === 'aborted', turnId: 't', reason, ...(agentId ? { agentId } : {}) }) as never
const todos = (...items: [string, string][]) =>
  ({ tool: 'TodoWrite', todos: items.map(([content, status]) => ({ content, status, activeForm: `${content}ing` })) }) as never
const work = { tool: 'Bash', command: 'npm test', description: 'test' } as never
const reminder = (type: string, agentId?: string) =>
  ({ type, text: 'native reminder', origin: { kind: 'engine' }, ...(agentId ? { agentId } : {}) }) as never
const permission = (tool: string, agentId?: string) =>
  ({
    hook_event_name: 'PermissionRequest',
    session_id: 'S1',
    transcript_path: '',
    cwd: '.',
    tool_name: tool,
    tool_input: {},
    ...(agentId ? { agent_id: agentId } : {}),
  }) as never

/** Native task files at /cfg/tasks/<session>, as the CLI keeps them. */
function taskFiles(on: On, files: Record<string, object>) {
  mock.env(on, { CLAUDE_CONFIG_DIR: '/cfg' })
  on('fs.exists', ($, e) => ({ value: /cfg[\\/]tasks[\\/]/.test(e.path) }))
  on('fs.list', () => ({ value: Object.keys(files).map(name => ({ name, kind: 'file' as const, size: 1, mtimeMs: 0, isLink: false })) }))
  on('fs.read', ($, e) => ({ value: JSON.stringify(files[e.path.replace(/^.*[\\/]/, '')] ?? null) }))
}

describe('native task events', () => {
  test('TodoWrite drives the band on desktop and terminal', async ($, on) => {
    world(on, session())
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    await $.turn.start(turn())
    await $.tool.call(todos(['Read', 'completed'], ['Edit', 'in_progress'], ['Test', 'pending']))
    expect(await band($)).toBe('● Running ━──── 1/3 · Editing')
    expect(await band($, { columns: 80 })).toBe('● Running ━━━─────── 1/3 · Editing')
    expect(await band($, { surface: 'terminal' })).toBe('● Running ━━━━━ 1/3 · 33% · Editi…')
    expect(await bandButtons($)).toEqual(['tasks'])
  })

  test('TaskCreate and TaskUpdate drive the band, plan growth included', async ($, on) => {
    world(on, session())
    await $.turn.start(turn())
    await $.tool.call({ tool: 'TaskCreate', subject: 'A', description: 'a', activeForm: 'Doing A' } as never)
    await $.tool.call({ tool: 'TaskCreate', subject: 'B', description: 'b' } as never)
    await $.tool.call({ tool: 'TaskUpdate', taskId: '1', status: 'in_progress' } as never)
    expect(await band($)).toBe('● Running ───── 0/2 · Doing A')
    await $.tool.call({ tool: 'TaskCreate', subject: 'C', description: 'c' } as never)
    await $.tool.call({ tool: 'TaskUpdate', taskId: '1', status: 'completed' } as never)
    expect(await band($)).toBe('● Running ━──── 1/3 · next: B')
    expect((await pane($)).text).toContain('plan +1')
    await $.tool.call({ tool: 'TaskUpdate', taskId: '2', status: 'completed' } as never)
    await $.tool.call({ tool: 'TaskUpdate', taskId: '3', status: 'completed' } as never)
    expect(await band($)).toBe('● Running ━━━━━ 3/3')
    await $.turn.complete(ended('answer'))
    expect(await band($)).toBe('✓ Completed ━━━━━ 3/3')
  })

  test('a replaced plan is marked in the pane', async ($, on) => {
    world(on, session())
    await $.turn.start(turn())
    await $.tool.call(todos(['A', 'in_progress'], ['B', 'pending']))
    await $.tool.call(todos(['X', 'pending']))
    expect(await band($)).toBe('● Running ───── 0/1 · next: X')
    expect((await pane($)).text).toContain('plan replaced')
  })

  test("a subagent's task update counts at once for a task plan", async ($, on) => {
    world(on, session())
    const files: Record<string, object> = {}
    taskFiles(on, files)
    await $.turn.start(turn())
    files['1.json'] = { id: '1', subject: 'A', status: 'pending' }
    await $.tool.call({ tool: 'TaskCreate', subject: 'A', description: 'a' } as never)
    files['2.json'] = { id: '2', subject: 'B', status: 'pending' }
    await $.tool.call({ tool: 'TaskCreate', subject: 'B', description: 'b' } as never)
    files['1.json'] = { id: '1', subject: 'A', status: 'completed' }
    await $.tool.call({ tool: 'TaskUpdate', taskId: '1', status: 'completed', agentId: 'agent-1' } as never)
    expect(await band($)).toBe('● Running ━━─── 1/2 · next: B')
  })
})

/** The terminal band: its rounded panels, its texts in order, and its Buttons. */
async function cli($: Engine, columns = 60, rows = 12) {
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: bandProps({ columns, rows }) })
  const panels = (await ui.findAll({ type: 'Box' })).filter(found => found.props.borderStyle === 'round')
  const texts = (await ui.findAll({ type: 'Text' })).map(found => found.text)
  const buttons = (await ui.findAll({ type: 'Button' })).map(found => found.text)
  await ui.unmount()
  return { panels, texts, buttons }
}

const fourTasks = async ($: Engine) => {
  for (const subject of ['Locate integration entry points', 'Draft the panel', 'Wire the height rule', 'Verify'])
    await $.tool.call({ tool: 'TaskCreate', subject, description: subject } as never)
  await $.tool.call({ tool: 'TaskUpdate', taskId: '1', status: 'completed' } as never)
  await $.tool.call({ tool: 'TaskUpdate', taskId: '2', status: 'in_progress', activeForm: 'Drafting the panel' } as never)
}

describe('terminal band', () => {
  test('a rounded panel: state, a bar filling the row, counts with the percentage, Tasks; the current task under it', async ($, on) => {
    world(on, session())
    await $.turn.start(turn())
    await fourTasks($)
    const view = await cli($)
    expect(view.panels.length).toBe(1)
    expect(view.panels[0]?.props.borderColor).toBe('subtle')
    expect(view.panels[0]?.props.backgroundColor).toBe('#22252b')
    // 60 columns less the border and padding: 56 = '● Running' + ' ' + 24 bar cells + ' 1/4 · 25%' + ' [ Tasks ▾ ]'.
    expect(view.texts.slice(0, 7)).toEqual(['● Running', ' ', '━'.repeat(6), '━'.repeat(18), ' 1/4', ' · ', '25%'])
    expect(view.texts).toContain('Drafting the panel')
    expect(view.buttons).toEqual(['Tasks ▾'])
  })

  test('the states read apart: approval, paused with the list not updated, completed', async ($, on) => {
    world(on, session())
    on('classic.PermissionRequest', () => ({}))
    await $.turn.start(turn())
    await fourTasks($)
    await $.classic.PermissionRequest(permission('Bash'))
    expect((await cli($)).texts[0]).toBe('◆ Waiting for approval')
    await $.tool.call(work)
    await $.turn.complete(ended('answer'))
    const paused = await cli($)
    expect(paused.texts[0]).toBe('◌ Paused')
    expect(paused.texts).toContain('List not updated · Drafting the panel')
    await $.turn.start(turn())
    for (const id of ['2', '3', '4']) await $.tool.call({ tool: 'TaskUpdate', taskId: id, status: 'completed' } as never)
    await $.turn.complete(ended('answer'))
    const done = await cli($)
    expect(done.texts.slice(0, 6)).toEqual(['✓ Completed', ' ', '━'.repeat(21), ' 4/4', ' · ', '100%'])
    expect(done.texts).toContain('All 4 tasks completed')
  })

  test('without a checklist: Running · No plan in the panel, no bar and no button', async ($, on) => {
    world(on, session())
    await $.turn.start(turn())
    const view = await cli($)
    expect(view.panels.length).toBe(1)
    expect(view.texts.slice(0, 2)).toEqual(['● Running', ' · No plan'])
    expect(view.buttons).toEqual([])
  })

  test('one compact row without a border where the height leaves nth-status too little, or the row is narrow', async ($, on) => {
    world(on, session())
    await $.turn.start(turn())
    await fourTasks($)
    for (const [columns, rows] of [[60, 9], [24, 12]]) {
      const view = await cli($, columns, rows)
      expect(view.panels.length).toBe(0)
    }
    const short = await cli($, 60, 9)
    expect(short.texts.join('')).toBe('● Running ━━━━━━━━ 1/4 · 25% · Drafting the panel ')
    expect(short.buttons).toEqual(['Tasks'])
  })
})

describe('turns', () => {
  test('a request without a checklist shows no plan, never a count or a percentage', async ($, on) => {
    world(on, session())
    expect(await band($)).toBe('')
    await $.turn.start(turn('a small question'))
    expect(await band($)).toBe('● Running · No plan')
    expect(await bandButtons($)).toEqual([])
    await $.turn.complete(ended('answer'))
    expect(await band($)).toBe('')
  })

  test('a submitted prompt that starts no turn changes nothing', async ($, on) => {
    world(on, session())
    await $.prompt.submit(prompt('/context'))
    expect(await band($)).toBe('')
  })

  test('an interrupted turn shows as interrupted; a subagent turn is ignored', async ($, on) => {
    world(on, session())
    await $.turn.start(turn())
    await $.tool.call(todos(['A', 'completed'], ['B', 'in_progress']))
    await $.turn.complete(ended('answer', 'agent-1'))
    expect(await band($)).toBe('● Running ━━─── 1/2 · Bing')
    await $.turn.complete(ended('aborted'))
    expect(await band($)).toBe('✕ Interrupted ━━─── 1/2 · Bing')
  })

  test("a background agent's turns after the main turn ended never show Running", async ($, on) => {
    world(on, session())
    await $.turn.start(turn())
    await $.tool.call(todos(['A', 'completed'], ['B', 'pending']))
    await $.turn.complete(ended('answer'))
    await $.turn.start(agentTurn('bg-1'))
    expect(await band($)).toBe('◌ Paused ━━─── 1/2 · next: B')
    await $.turn.complete(ended('answer', 'bg-1'))
    expect(await band($)).toBe('◌ Paused ━━─── 1/2 · next: B')
  })

  test('a turn recorded running is not shown running while the surface says none runs', async ($, on) => {
    world(on, session())
    await $.turn.start(turn())
    expect(await band($, { isWorking: false })).toBe('')
    await $.tool.call(todos(['A', 'in_progress']))
    expect(await band($, { isWorking: false })).toBe('◌ Paused ───── 0/1 · Aing')
  })
})

describe('approval', () => {
  test('a main-loop permission dialog shows until that call settles or the turn ends', async ($, on) => {
    world(on, session())
    on('classic.PermissionRequest', () => ({}))
    await $.turn.start(turn())
    await $.tool.call(todos(['A', 'in_progress']))
    await $.classic.PermissionRequest(permission('Bash'))
    expect(await band($)).toBe('◆ Waiting for approval ───── 0/1')
    await $.tool.call({ tool: 'Read', file_path: 'x' } as never)
    expect(await band($)).toBe('◆ Waiting for approval ───── 0/1')
    await $.tool.call(work)
    expect(await band($)).toBe('● Running ───── 0/1 · Aing')
    await $.classic.PermissionRequest(permission('Bash'))
    await $.turn.complete(ended('aborted'))
    expect(await band($)).toBe('✕ Interrupted ───── 0/1 · Aing')
  })

  test("a request a settings hook answered, or a subagent's, is not shown", async ($, on) => {
    world(on, session())
    let decision: object | undefined
    on('classic.PermissionRequest', () => (decision ? { decision } : {}) as never)
    await $.turn.start(turn())
    await $.tool.call(todos(['A', 'in_progress']))
    await $.classic.PermissionRequest(permission('Bash', 'agent-1'))
    expect(await band($)).toBe('● Running ───── 0/1 · Aing')
    decision = { behavior: 'allow' }
    await $.classic.PermissionRequest(permission('Bash'))
    expect(await band($)).toBe('● Running ───── 0/1 · Aing')
  })
})

describe('detail pane', () => {
  test("the band's Tasks button opens the pane listing every step", async ($, on) => {
    const s = session()
    world(on, s)
    await $.turn.start(turn())
    await $.tool.call(todos(['A', 'completed'], ['B', 'in_progress'], ['C', 'pending']))
    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: bandProps({}) })
    await ui.press({ key: 'tasks' })
    await ui.unmount()
    expect(s.opened).toEqual([PANE])
    const view = await pane($)
    expect(view.text).toContain('● Running')
    expect(view.text).toContain('1/3')
    expect(view.text).toContain('Now: Bing')
    expect(view.text).toContain('✓ A')
    expect(view.text).toContain('● B')
    expect(view.text).toContain('○ C')
    expect(view.buttons).toEqual(['Hide tasks ▴'])
  })

  test('the pane draws on every surface; its button expands and collapses the list', async ($, on) => {
    world(on, session())
    await $.turn.start(turn())
    await $.tool.call(todos(['A', 'completed'], ['B', 'pending']))
    for (const surface of SURFACES) {
      const collapsed = await pane($, surface)
      expect(collapsed.buttons).toEqual(['Show 2 tasks ▾'])
      expect(collapsed.text).toContain('Next: B')
      expect(collapsed.text).not.toContain('○ B')
      const expanded = await pane($, surface, 'toggle')
      expect(expanded.text).toContain('✓ A')
      expect(expanded.text).toContain('○ B')
      expect((await pane($, surface, 'toggle')).buttons).toEqual(['Show 2 tasks ▾'])
    }
  })

  test('without a checklist the pane says so', async ($, on) => {
    world(on, session())
    const view = await pane($)
    expect(view.text).toContain('○ Idle\n · No plan')
    expect(view.text).toContain('No native task list in this session.')
    expect(view.buttons).toEqual([])
  })

  test('/task-progress opens the pane; with no surface it says so', async ($, on) => {
    const s = session()
    world(on, s)
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    expect(await $.command.run({ command: 'task-progress', args: '' } as never)).toEqual({ text: 'Task progress opened.' })
    expect(s.opened).toEqual([PANE])
    s.surfaces = []
    expect(await $.command.run({ command: 'task-progress', args: '' } as never)).toEqual({
      text: 'No surface here draws the task-progress pane.',
    })
  })
})

describe('VS Code', () => {
  test('no band; the pane opens when the extension attaches, once', async ($, on) => {
    const s = session()
    s.surfaces = []
    world(on, s)
    await $.session.start({ cwd: '.', surface: null, isInteractive: true } as never)
    expect(s.opened).toEqual([])
    await $.turn.start(turn())
    await $.tool.call(todos(['A', 'in_progress']))
    expect(await band($, { surface: 'vscode' })).toBe('')
    s.surfaces = ['vscode']
    await $.session.attach({ surface: 'vscode', clientId: 'ext' } as never)
    expect(s.opened).toEqual([PANE])
    await $.session.attach({ surface: 'vscode', clientId: 'ext' } as never)
    expect(s.opened).toEqual([PANE])
  })

  test('the pane reopens collapsed after the person had expanded and closed it', async ($, on) => {
    const s = session()
    s.surfaces = ['vscode']
    world(on, s)
    await $.turn.start(turn())
    await $.tool.call(todos(['A', 'in_progress']))
    await $.command.run({ command: 'task-progress', args: '' } as never)
    expect((await pane($, 'vscode')).buttons).toEqual(['Hide tasks ▴'])
    s.opened = []
    await $.session.attach({ surface: 'vscode', clientId: 'ext' } as never)
    expect(s.opened).toEqual([PANE])
    expect((await pane($, 'vscode')).buttons).toEqual(['Show 1 task ▾'])
  })

  test('a session starting with VS Code attached opens the pane', async ($, on) => {
    const s = session()
    s.surfaces = ['vscode']
    world(on, s)
    await $.session.start({ cwd: '.', surface: null, isInteractive: true } as never)
    expect(s.opened).toEqual([PANE])
  })

  test('a terminal session opens no pane unasked', async ($, on) => {
    const s = session()
    world(on, s)
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    expect(s.opened).toEqual([])
  })
})

describe('sessions', () => {
  test('each session sees only its own progress', async ($, on) => {
    const s = session()
    world(on, s)
    await $.turn.start(turn())
    await $.tool.call(todos(['A', 'completed'], ['B', 'pending']))
    await $.turn.complete(ended('answer'))
    s.id = 'S2'
    expect(await band($)).toBe('')
    await $.turn.start(turn())
    expect(await band($)).toBe('● Running · No plan')
    s.id = 'S1'
    expect(await band($)).toBe('◌ Paused ━━─── 1/2 · next: B')
  })

  test('/clear starts the next session empty', async ($, on) => {
    const s = session()
    world(on, s)
    await $.turn.start(turn())
    await $.tool.call(todos(['A', 'pending']))
    await $.session.end({ reason: 'clear', sessionId: 'S1' } as never)
    s.id = 'S3'
    expect(await band($)).toBe('')
  })

  test('a stored session is restored, a running turn as interrupted', async ($, on) => {
    const stored = {
      v: 1,
      sessionId: 'S9',
      phase: 'working',
      source: 'todo',
      steps: [
        { key: 'todo:A', text: 'A', status: 'completed' },
        { key: 'todo:B', text: 'B', status: 'pending' },
      ],
      change: 'new',
      delta: 0,
      updatedAt: 1,
    }
    world(on, session('S9'), { 'progress:S9': stored, sessions: ['S9'] })
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    expect(await band($)).toBe('✕ Interrupted ━━─── 1/2 · next: B')
    await $.turn.start(turn('continue'))
    expect(await band($)).toBe('● Running ━━─── 1/2 · next: B')
  })
})

/** The observed failure, step for step: ten todos, one TodoWrite, much work, the final answer. */
const tenTodos = () =>
  ({
    tool: 'TodoWrite',
    todos: [
      { content: 'Backend schema', status: 'in_progress', activeForm: 'Doing backend schema' },
      ...Array.from({ length: 9 }, (_, n) => ({ content: `Step ${n + 2}`, status: 'pending', activeForm: `Doing step ${n + 2}` })),
    ],
  }) as never

describe('regressions from the failed session', () => {
  test('work then the final answer without status updates shows the list not updated', async ($, on) => {
    const s = session()
    world(on, s)
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    await $.turn.start(turn())
    await $.tool.call(tenTodos())
    for (let n = 0; n < 30; n += 1) await $.tool.call(work)
    await $.turn.complete(ended('answer'))
    const expected = '◌ Paused ────────── 0/10 · list not updated · Doing backend schema'
    expect(await band($, { surface: 'desktop', columns: 80 })).toBe(expected)
    // A reload: the session's own state gone, the store's kept.
    s.id = 'OTHER'
    await $.turn.start(turn())
    s.id = 'S1'
    expect(await band($, { columns: 80 })).toBe(expected)
    // Resumed work that updates the checklist.
    await $.turn.start(turn('continue'))
    await $.tool.call(todos(['Backend schema', 'completed'], ['Step 2', 'in_progress']))
    expect(await band($)).toBe('● Running ━━─── 1/2 · Step 2ing')
  })

  test('a finished plan survives the final answer and a later notification turn', async ($, on) => {
    world(on, session())
    await $.turn.start(turn())
    await $.tool.call(todos(['A', 'in_progress'], ['B', 'pending']))
    await $.tool.call(work)
    await $.tool.call(todos(['A', 'completed'], ['B', 'completed']))
    await $.turn.complete(ended('answer'))
    expect(await band($)).toBe('✓ Completed ━━━━━ 2/2')
    await $.turn.start(turn('<task-notification>'))
    await $.tool.call(work)
    await $.turn.complete(ended('answer'))
    expect(await band($)).toBe('✓ Completed ━━━━━ 2/2')
  })

  test('a cleared native list keeps the last checklist', async ($, on) => {
    world(on, session())
    await $.turn.start(turn())
    await $.tool.call(todos(['A', 'completed'], ['B', 'pending']))
    await $.tool.call({ tool: 'TodoWrite', todos: [] } as never)
    await $.turn.complete(ended('answer'))
    expect(await band($)).toBe('◌ Paused ━━─── 1/2 · next: B')
  })

  test('task statuses are reconciled from the native task files', async ($, on) => {
    world(on, session())
    const files: Record<string, object> = {}
    taskFiles(on, files)
    await $.turn.start(turn())
    files['1.json'] = { id: '1', subject: 'A', status: 'pending' }
    await $.tool.call({ tool: 'TaskCreate', subject: 'A', description: 'a' } as never)
    files['2.json'] = { id: '2', subject: 'B', status: 'pending' }
    await $.tool.call({ tool: 'TaskCreate', subject: 'B', description: 'b' } as never)
    for (let n = 0; n < 3; n += 1) await $.tool.call(work)
    // A subagent finished A and started B: no main-loop event saw it.
    files['1.json'] = { id: '1', subject: 'A', status: 'completed' }
    files['2.json'] = { id: '2', subject: 'B', status: 'in_progress', activeForm: 'Doing B' }
    await $.turn.complete(ended('answer'))
    expect(await band($)).toBe('◌ Paused ━━─── 1/2 · Doing B')
  })
})

describe('checkpoint reminder', () => {
  test('the native reminder is dropped without an open checklist', async ($, on) => {
    world(on, session())
    await $.turn.start(turn())
    expect(await $.prompt.attachment(reminder('todo_reminder'))).toEqual({ text: null })
    await $.tool.call(todos(['A', 'completed']))
    expect(await $.prompt.attachment(reminder('todo_reminder'))).toEqual({ text: null })
  })

  test('an open checklist turns it into the short checkpoint, on the main loop only', async ($, on) => {
    world(on, session())
    await $.turn.start(turn())
    await $.tool.call(tenTodos())
    expect(await $.prompt.attachment(reminder('todo_reminder'))).toEqual({
      text:
        'Checklist checkpoint: 0/10 done, current: "Doing backend schema". ' +
        'If statuses changed, update them with TodoWrite now; do not add steps or work because of this note.',
    })
    expect(await $.prompt.attachment(reminder('task_reminder', 'agent-1'))).toEqual({ text: null })
  })
})
