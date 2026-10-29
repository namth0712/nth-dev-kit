import { describe, expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

type World = {
  cwd: string
  env: Record<string, string>
  branch: string | null
  model: string
  settings: Record<string, unknown>
  /** What the settings hooks beneath the mod answer at SessionStart. */
  below: { sessionTitle?: string }
  renames: string[]
}

const CWD = '/work/nth-dev-kit'

function world(over: Partial<World> = {}): World {
  return {
    cwd: CWD,
    env: { NTH_SESSION_TITLE_LABEL: 'C2' },
    branch: 'main',
    model: 'claude-opus-5-5',
    settings: { modelSettings: { 'claude-opus-5-5': { effortLevel: 'high' } } },
    below: {},
    renames: [],
    ...over,
  }
}

/** The engine beneath the mod, answering from the world the test sets. */
function engine(on: On, w: World) {
  const clock = mock.clock(on, { now: 1000 })
  mock.env(on, w.env)
  on('session.cwd', () => ({ value: w.cwd }))
  on('session.model', () => ({ value: w.model }))
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('command.register', ($, e) => ({ value: { command: e.name } }) as never)
  on('process.run', () => ({
    value: {
      exitCode: w.branch === null ? 1 : 0,
      stdout: w.branch === null ? '' : `${w.branch}\n`,
      stderr: '',
      isStdoutTruncated: false,
      isStderrTruncated: false,
    },
  }) as never)
  on('settings.read', ($, e) => {
    const key = (e as { key?: string }).key
    return { value: key ? w.settings[key] : w.settings } as never
  })
  on('classic.SessionStart', () => w.below as never)
  on('command.run', { command: 'rename' }, ($, e) => {
    w.renames.push(e.args)
    return { text: 'renamed' }
  })
  return clock
}

const start = (fields: Record<string, unknown> = {}) =>
  ({ source: 'startup', cwd: CWD, model: 'claude-opus-5-5', ...fields }) as never

describe('automatic title', () => {
  test('a new conversation gets the short title', async ($, on) => {
    engine(on, world())
    expect((await $.classic.SessionStart(start())).sessionTitle).toBe('C2_ndk_main_OH')
  })

  test('effort falls back to effortLevel, and [1m] models use their base entry', async ($, on) => {
    engine(on, world({ settings: { effortLevel: 'medium' } }))
    expect((await $.classic.SessionStart(start())).sessionTitle).toBe('C2_ndk_main_OM')
  })

  test('per-model effort found for a [1m] model id', async ($, on) => {
    engine(on, world())
    expect((await $.classic.SessionStart(start({ model: 'claude-opus-5-5[1m]' }))).sessionTitle).toBe('C2_ndk_main_OH')
  })

  test('the effort env override wins over settings', async ($, on) => {
    engine(on, world({ env: { NTH_SESSION_TITLE_LABEL: 'C2', CLAUDE_CODE_EFFORT_LEVEL: 'xhigh' } }))
    expect((await $.classic.SessionStart(start())).sessionTitle).toBe('C2_ndk_main_OxH')
  })

  test('unknown effort and branch are dropped; model read from the session when absent', async ($, on) => {
    engine(on, world({ settings: {}, branch: null, model: 'claude-sonnet-5-5' }))
    expect((await $.classic.SessionStart(start({ model: undefined }))).sessionTitle).toBe('C2_ndk_S')
  })

  test('resume, fork, clear and compact are left alone', async ($, on) => {
    engine(on, world())
    for (const source of ['resume', 'fork', 'clear', 'compact']) {
      expect((await $.classic.SessionStart(start({ source }))).sessionTitle).toBeUndefined()
    }
  })

  test('an existing title, a subagent, or a title from a hook beneath is kept', async ($, on) => {
    const w = world()
    engine(on, w)
    expect((await $.classic.SessionStart(start({ session_title: 'mine' }))).sessionTitle).toBeUndefined()
    expect((await $.classic.SessionStart(start({ agent_type: 'reviewer' }))).sessionTitle).toBeUndefined()
    w.below = { sessionTitle: 'from below' }
    expect((await $.classic.SessionStart(start())).sessionTitle).toBe('from below')
  })
})

describe('/task', () => {
  test('sets, replaces and removes the task part through /rename, with no model call', async ($, on) => {
    const w = world()
    const clock = engine(on, w)
    await $.session.start({ cwd: CWD, surface: 'terminal', isInteractive: true })

    expect((await $.command.run({ command: 'task', args: 'mod' } as never)).text).toBe('Title: C2_ndk_main_OH_mod')
    await clock.advance(300)
    await $.command.run({ command: 'task', args: '  kid  pocket ' } as never)
    await clock.advance(300)
    await $.command.run({ command: 'task', args: '' } as never)
    await clock.advance(300)
    expect(w.renames).toEqual(['C2_ndk_main_OH_mod', 'C2_ndk_main_OH_kid pocket', 'C2_ndk_main_OH'])
  })

  test('uses the effort the last main-loop request sent, none included', async ($, on) => {
    const w = world()
    const clock = engine(on, w)
    on('turn.step', async function* ($, e) {
      return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: 'end_turn', usage: null } as never
    })
    const step = async (effort?: string, agentId?: string) => {
      const s = $.turn.step({ turnId: 't', index: 0, model: 'claude-opus-5-5', messageCount: 1, effort, agentId } as never)
      for await (const _ of s) void _
    }

    await step('low', 'a1')
    await $.command.run({ command: 'task', args: 'x' } as never)
    await step('xhigh')
    await $.command.run({ command: 'task', args: 'x' } as never)
    await step(undefined)
    await $.command.run({ command: 'task', args: 'x' } as never)
    await clock.advance(300)
    expect(w.renames).toEqual(['C2_ndk_main_OH_x', 'C2_ndk_main_OxH_x', 'C2_ndk_main_O_x'])
  })

  test('with nothing known it renames nothing', async ($, on) => {
    const w = world({ cwd: '/', env: {}, branch: null, model: '', settings: {} })
    const clock = engine(on, w)
    expect((await $.command.run({ command: 'task', args: '' } as never)).text).toBe('Nothing to name this session with.')
    await clock.advance(300)
    expect(w.renames).toEqual([])
  })
})
