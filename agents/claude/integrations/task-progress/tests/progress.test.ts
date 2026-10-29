import { describe, expect, test } from 'claude-code/testing'

import type { Progress } from '../types'
import {
  applyTaskCreate,
  applyTaskUpdate,
  applyTodoWrite,
  bandView,
  bar,
  checkpointText,
  cliView,
  countWork,
  emptyProgress,
  execState,
  onApprovalAsked,
  onToolSettled,
  onTurnComplete,
  onTurnStart,
  paneView,
  parseTaskCreate,
  parseTaskFile,
  parseTaskUpdate,
  reconcileTasks,
  restore,
  STATUS_PANEL_ROWS,
  summarize,
  TASK_PANEL_ROWS,
  upgrade,
} from '../hooks/progress'
import type { TaskFile } from '../hooks/progress'

const todo = (content: string, status: string, activeForm = `${content}ing`) => ({
  content,
  status,
  activeForm,
})
const write = (p: Progress, ...todos: ReturnType<typeof todo>[]) => applyTodoWrite(p, { todos }, 1)
/** The band's row as text, or null while it is hidden. */
const text = (p: Progress | null, columns = 40, isWorking?: boolean) =>
  bandView(p, isWorking, columns)?.segs.map(seg => seg.text).join('') ?? null
const paneHead = (p: Progress | null) => paneView(p).head.map(seg => seg.text).join('')
const start = () => onTurnStart(emptyProgress('S', 0), 0)

describe('TodoWrite', () => {
  test('a first list is a new plan with its current step', () => {
    const p = write(start(), todo('Read', 'completed'), todo('Edit', 'in_progress', 'Editing files'), todo('Test', 'pending'))
    expect(p.source).toBe('todo')
    expect(p.change).toBe('new')
    expect(summarize(p)).toEqual({ completed: 1, total: 3, current: { text: 'Editing files', isNext: false } })
  })

  test('an all-completed list is Completed once the turn ends', () => {
    const p = write(start(), todo('Read', 'completed'), todo('Edit', 'completed'))
    expect(summarize(p).current).toBe(null)
    expect(text(p)).toBe('● Running ━━━━━ 2/2')
    expect(text(onTurnComplete(p, 'answer', 2))).toBe('✓ Completed ━━━━━ 2/2')
  })

  test('status updates keep the plan and its change mark', () => {
    const first = write(start(), todo('A', 'in_progress'), todo('B', 'pending'))
    const second = write(first, todo('A', 'completed'), todo('B', 'in_progress'))
    expect(second.change).toBe('new')
    expect(summarize(second).completed).toBe(1)
  })

  test('added items after work began expand the plan', () => {
    const first = write(start(), todo('A', 'in_progress'), todo('B', 'pending'))
    const second = write(first, todo('A', 'completed'), todo('B', 'pending'), todo('C', 'pending'), todo('D', 'pending'))
    expect(second.change).toBe('expanded')
    expect(second.delta).toBe(2)
    expect(paneHead(second)).toContain('plan +2')
    expect(text(second)).toContain(' 1/4')
  })

  test('a list sharing no item replaces the plan', () => {
    const first = write(start(), todo('A', 'completed'), todo('B', 'pending'))
    const second = write(first, todo('X', 'pending'), todo('Y', 'pending'))
    expect(second.change).toBe('replaced')
    expect(summarize(second)).toEqual(expect.objectContaining({ completed: 0, total: 2 }))
  })

  test('a list dropping some items is a revised plan', () => {
    const first = write(start(), todo('A', 'in_progress'), todo('B', 'pending'), todo('C', 'pending'))
    const second = write(first, todo('A', 'in_progress'), todo('C', 'pending'), todo('Z', 'pending'))
    expect(second.change).toBe('revised')
  })

  test('input that is not a list changes nothing', () => {
    const p = start()
    expect(applyTodoWrite(p, { todos: 'nope' }, 1)).toBe(p)
  })
})

describe('TaskCreate and TaskUpdate', () => {
  test('the task id comes from the result, else from the text', () => {
    expect(parseTaskCreate({ subject: 'A' }, { task: { id: '7', subject: 'A' } })?.id).toBe('7')
    expect(parseTaskCreate({ subject: 'A' }, undefined, 'Task #9 created successfully: A')?.id).toBe('9')
    expect(parseTaskCreate({ subject: 'A' }, undefined, 'nothing')).toBe(undefined)
  })

  test('creates build a plan; one after work began expands it', () => {
    let p = start()
    p = applyTaskCreate(p, { id: '1', text: 'A', activeText: 'Doing A' }, 1)
    p = applyTaskCreate(p, { id: '2', text: 'B', activeText: '' }, 1)
    expect(p.change).toBe('new')
    p = applyTaskUpdate(p, { id: '1', status: 'in_progress' }, 2)
    expect(summarize(p).current).toEqual({ text: 'Doing A', isNext: false })
    p = applyTaskCreate(p, { id: '3', text: 'C', activeText: '' }, 3)
    expect(p.change).toBe('expanded')
    expect(p.delta).toBe(1)
    p = applyTaskUpdate(p, { id: '1', status: 'completed' }, 4)
    expect(summarize(p)).toEqual({ completed: 1, total: 3, current: { text: 'B', isNext: true } })
  })

  test('deleted removes a step; an unknown id adds a placeholder', () => {
    let p = applyTaskCreate(start(), { id: '1', text: 'A', activeText: '' }, 1)
    p = applyTaskCreate(p, { id: '2', text: 'B', activeText: '' }, 1)
    p = applyTaskUpdate(p, { id: '2', status: 'deleted' }, 2)
    expect(p.steps.map(step => step.text)).toEqual(['A'])
    expect(p.change).toBe('revised')
    p = applyTaskUpdate(p, { id: '5', status: 'completed' }, 3)
    expect(p.steps.map(step => step.text)).toEqual(['A', 'Task #5'])
    expect(summarize(p)).toEqual(expect.objectContaining({ completed: 1, total: 2 }))
  })

  test('a failed update and an id-less update are ignored', () => {
    expect(parseTaskUpdate({ taskId: '1', status: 'completed' }, { success: false })).toBe(undefined)
    expect(parseTaskUpdate({ status: 'completed' }, { success: true })).toBe(undefined)
    expect(parseTaskUpdate({ taskId: 3, status: 'deleted' }, { success: true })).toEqual({ id: '3', status: 'deleted' })
  })

  test('a renamed task marks the plan revised', () => {
    let p = applyTaskCreate(start(), { id: '1', text: 'A', activeText: '' }, 1)
    p = applyTaskUpdate(p, { id: '1', status: 'in_progress' }, 2)
    expect(p.change).toBe('new')
    p = applyTaskUpdate(p, { id: '1', text: 'A2' }, 3)
    expect(p.change).toBe('revised')
    expect(p.steps[0]?.text).toBe('A2')
  })

  test('an update for an unseen task leaves a TodoWrite checklist alone', () => {
    const todos = write(start(), todo('A', 'in_progress'))
    expect(applyTaskUpdate(todos, { id: '9', status: 'completed' }, 2)).toBe(todos)
  })

  test('tasks after a todo plan replace it', () => {
    const todos = write(start(), todo('A', 'in_progress'))
    const tasks = applyTaskCreate(todos, { id: '1', text: 'T', activeText: '' }, 2)
    expect(tasks.source).toBe('task')
    expect(tasks.change).toBe('replaced')
    expect(tasks.steps.length).toBe(1)
  })
})

describe('progress and current step', () => {
  test('the bar fills completed/total of its cells, full only when every step is done', () => {
    expect(bar(2, 3, 5)).toEqual({ filled: '━━━', empty: '──' })
    expect(bar(9, 10, 10)).toEqual({ filled: '━━━━━━━━━', empty: '─' })
    expect(bar(10, 10, 10)).toEqual({ filled: '━━━━━━━━━━', empty: '' })
    expect(bar(0, 0, 5)).toEqual({ filled: '', empty: '─────' })
  })

  test('the in-progress step wins over an earlier pending one', () => {
    const p = write(start(), todo('A', 'pending'), todo('B', 'in_progress', 'Building B'))
    expect(summarize(p).current).toEqual({ text: 'Building B', isNext: false })
  })

  test('with nothing in progress the first pending step is next', () => {
    const p = write(start(), todo('A', 'completed'), todo('B', 'pending'), todo('C', 'pending'))
    expect(summarize(p).current).toEqual({ text: 'B', isNext: true })
    expect(text(p)).toBe('● Running ━──── 1/3 · next: B')
  })

  test('one row: a wider bar where wide, the step cut to fit, dropped where too narrow', () => {
    const p = write(start(), todo('A', 'in_progress', 'Doing A'), todo('B', 'pending'))
    expect(text(p, 80)).toBe('● Running ────────── 0/2 · Doing A')
    expect(text(p, 40)).toBe('● Running ───── 0/2 · Doing A')
    expect(text(p, 25)).toBe('● Running ───── 0/2')
    const long = write(start(), todo('A', 'in_progress', 'Doing a very long step description'))
    expect(text(long, 40)).toBe('● Running ───── 0/1 · Doing a ver…')
  })

  test('the Tasks button only where a checklist exists and the row has room for it', () => {
    const p = write(start(), todo('A', 'in_progress', 'Doing A'))
    expect(bandView(p, true, 40)?.hasButton).toBe(true)
    expect(bandView(p, true, 25)?.hasButton).toBe(true)
    expect(bandView(p, true, 24)?.hasButton).toBe(false)
    expect(bandView(start(), true, 80)?.hasButton).toBe(false)
  })
})

describe('execution state', () => {
  test('precedence: approval, running, completed, interrupted, failed, paused, idle', () => {
    const open = write(start(), todo('A', 'completed'), todo('B', 'pending'))
    const done = write(start(), todo('A', 'completed'))
    expect(execState(onApprovalAsked(open, 'Bash'))).toBe('approval')
    expect(execState(onApprovalAsked(done, 'Bash'))).toBe('approval')
    expect(execState(open)).toBe('running')
    expect(execState(done)).toBe('running')
    expect(execState(onTurnComplete(done, 'aborted', 2))).toBe('completed')
    expect(execState(onTurnComplete(open, 'aborted', 2))).toBe('interrupted')
    expect(execState(onTurnComplete(open, 'error', 2))).toBe('failed')
    expect(execState(onTurnComplete(open, 'answer', 2))).toBe('paused')
    expect(execState(onTurnComplete(countWork(open), 'answer', 2))).toBe('paused')
    expect(execState(onTurnComplete(start(), 'answer', 2))).toBe('idle')
    expect(execState(null)).toBe('idle')
  })

  test('a working record is not running while the surface says no turn runs', () => {
    const open = write(start(), todo('A', 'in_progress'))
    expect(execState(open, true)).toBe('running')
    expect(execState(open, false)).toBe('paused')
    expect(execState(start(), false)).toBe('idle')
    expect(text(start(), 40, false)).toBe(null)
  })

  test('approval ends when that tool settles, at a turn boundary, and on restore', () => {
    const asked = onApprovalAsked(write(start(), todo('A', 'in_progress')), 'Bash')
    expect(text(asked)).toBe('◆ Waiting for approval ───── 0/1')
    expect(onToolSettled(asked, 'Read')).toBe(asked)
    expect(onToolSettled(asked, 'Bash').approval).toBe(null)
    expect(onTurnComplete(asked, 'aborted', 2).approval).toBe(null)
    expect(onTurnStart(asked, 2).approval).toBe(null)
    expect(restore(asked)).toEqual(expect.objectContaining({ phase: 'interrupted', approval: null }))
  })
})

describe('requests without a checklist', () => {
  test('an idle session hides the band', () => {
    expect(text(null)).toBe(null)
    expect(text(emptyProgress('S', 0))).toBe(null)
  })

  test('a request shows running with no plan, never a count or a percentage', () => {
    expect(text(start())).toBe('● Running · No plan')
    expect(text(start())).not.toMatch(/%|0\//)
  })

  test('the end of a turn is not completion', () => {
    const p = onTurnComplete(start(), 'answer', 1)
    expect(p.phase).toBe('awaiting')
    expect(text(p)).toBe(null)
  })

  test('the end of a turn leaves an unfinished plan paused', () => {
    const p = onTurnComplete(write(start(), todo('A', 'completed'), todo('B', 'pending')), 'answer', 1)
    expect(text(p)).toBe('◌ Paused ━━─── 1/2 · next: B')
  })

  test('a new turn keeps the checklist, finished or not', () => {
    const open = onTurnComplete(write(start(), todo('A', 'pending')), 'answer', 1)
    expect(onTurnStart(open, 2).steps.length).toBe(1)
    const done = onTurnComplete(write(start(), todo('A', 'completed')), 'answer', 1)
    expect(text(onTurnStart(done, 2))).toBe('● Running ━━━━━ 1/1')
    expect(text(onTurnComplete(onTurnStart(done, 2), 'answer', 3))).toBe('✓ Completed ━━━━━ 1/1')
  })
})

/** The observed failure: one TodoWrite of ten steps, then work, then the final answer. */
const failedSession = () => {
  const steps = [todo('Backend schema', 'in_progress', 'Doing backend schema')]
  for (let n = 2; n <= 10; n += 1) steps.push(todo(`Step ${n}`, 'pending'))
  let p = write(start(), ...steps)
  for (let n = 0; n < 30; n += 1) p = countWork(p)
  return p
}

describe('tracking left incomplete', () => {
  test('an answer after unrecorded work is paused with the list marked not updated', () => {
    const p = onTurnComplete(failedSession(), 'answer', 2)
    expect(p.phase).toBe('stale')
    expect(text(p, 80)).toBe('◌ Paused ────────── 0/10 · list not updated · Doing backend schema')
    expect(text(p, 40)).toBe('◌ Paused ───── 0/10 · list not updated')
  })

  test('an answer right after a checklist update is a pause', () => {
    const p = onTurnComplete(write(start(), todo('A', 'completed'), todo('B', 'pending')), 'answer', 1)
    expect(p.phase).toBe('awaiting')
    expect(text(p)).not.toContain('list not updated')
  })

  test('a checklist update resets the unrecorded work', () => {
    const p = write(failedSession(), todo('Backend schema', 'completed'), todo('Step 2', 'in_progress'))
    expect(p.work).toBe(0)
  })

  test('the bar fills only for completed steps', () => {
    const p = onTurnComplete(failedSession(), 'answer', 2)
    expect(summarize(p).completed).toBe(0)
    expect(text(p)).not.toContain('━')
  })
})

describe('snapshots', () => {
  test('an emptied list keeps the last checklist, finished or not', () => {
    const open = write(start(), todo('A', 'completed'), todo('B', 'pending'))
    expect(applyTodoWrite(open, { todos: [] }, 2)).toBe(open)
    const done = write(start(), todo('A', 'completed'))
    expect(text(applyTodoWrite(done, { todos: [] }, 2), 40, false)).toBe('✓ Completed ━━━━━ 1/1')
  })

  test('a new list after a settled plan is a new plan, not a replaced one', () => {
    const done = onTurnStart(onTurnComplete(write(start(), todo('A', 'completed')), 'answer', 1), 2)
    const next = write(done, todo('X', 'in_progress'), todo('Y', 'pending'))
    expect(next.change).toBe('new')
    expect(text(next)).toBe('● Running ───── 0/2 · Xing')
  })

  test('a version 1 record upgrades', () => {
    const v1 = { v: 1, sessionId: 'S', phase: 'awaiting', source: 'todo', change: null, delta: 0, updatedAt: 1,
      steps: [{ key: 'todo:A', text: 'A', status: 'completed' }] }
    expect(upgrade(v1)).toEqual(expect.objectContaining({ v: 2, work: 0, settled: true, taskFloor: null, approval: null }))
    expect(upgrade({ v: 3 })).toBe(null)
    const partial = { ...v1, v: 2, ignored: [] }
    expect(upgrade(partial)).toEqual(expect.objectContaining({ work: 0, settled: true, taskFloor: null }))
    expect(upgrade(partial)).not.toHaveProperty('ignored')
  })
})

const file = (id: string, subject: string, status: string): TaskFile =>
  parseTaskFile(JSON.stringify({ id, subject, status, blocks: [], blockedBy: [] })) as TaskFile

describe('native task files', () => {
  const twoTasks = () => {
    let p = applyTaskCreate(start(), { id: '1', text: 'A', activeText: '' }, 1)
    return applyTaskCreate(p, { id: '2', text: 'B', activeText: '' }, 1)
  }

  test('statuses come from the files; deleted tasks drop out', () => {
    const p = reconcileTasks(twoTasks(), [file('1', 'A', 'completed'), file('2', 'B', 'deleted'), file('3', 'C', 'in_progress')], 2)
    expect(p.steps.map(step => [step.text, step.status])).toEqual([['A', 'completed'], ['C', 'in_progress']])
  })

  test('a status a subagent set resets the unrecorded work', () => {
    let p = twoTasks()
    for (let n = 0; n < 5; n += 1) p = countWork(p)
    expect(reconcileTasks(p, [file('1', 'A', 'completed'), file('2', 'B', 'pending')], 2).work).toBe(0)
  })

  test('no files, no tasks, or a bad file keep the plan', () => {
    const p = twoTasks()
    expect(reconcileTasks(p, null, 2)).toBe(p)
    expect(reconcileTasks(p, [], 2)).toBe(p)
    expect(parseTaskFile('{not json')).toBe(undefined)
  })

  test('a TodoWrite checklist is never overridden by task files', () => {
    const p = write(start(), todo('A', 'pending'))
    expect(reconcileTasks(p, [file('1', 'X', 'completed')], 2)).toBe(p)
  })

  test('a settled task plan is left out of the next plan', () => {
    let p = applyTaskUpdate(twoTasks(), { id: '1', status: 'completed' }, 2)
    p = applyTaskUpdate(p, { id: '2', status: 'completed' }, 2)
    p = onTurnStart(onTurnComplete(p, 'answer', 3), 4)
    p = applyTaskCreate(p, { id: '3', text: 'Next', activeText: '' }, 5)
    p = reconcileTasks(p, [file('1', 'A', 'completed'), file('2', 'B', 'completed'), file('3', 'Next', 'pending')], 5)
    expect(p.change).toBe('new')
    expect(text(p)).toBe('● Running ───── 0/1 · next: Next')
  })
})

describe('task plans across plan families', () => {
  test('an earlier task plan stays out of a new one after a TodoWrite plan in between', () => {
    let p = applyTaskCreate(start(), { id: '1', text: 'A', activeText: '' }, 1)
    p = applyTaskUpdate(p, { id: '1', status: 'completed' }, 1)
    p = onTurnStart(onTurnComplete(p, 'answer', 2), 3)
    p = write(p, todo('T', 'completed'))
    p = onTurnStart(onTurnComplete(p, 'answer', 4), 5)
    p = applyTaskCreate(p, { id: '2', text: 'B', activeText: '' }, 6)
    p = reconcileTasks(p, [file('1', 'A', 'completed'), file('2', 'B', 'pending')], 6)
    expect(text(p)).toBe('● Running ───── 0/1 · next: B')
  })

  test('re-stating a finished task as it is keeps the plan settled', () => {
    let p = applyTaskCreate(start(), { id: '1', text: 'A', activeText: '' }, 1)
    p = applyTaskUpdate(p, { id: '1', status: 'completed' }, 1)
    p = onTurnStart(onTurnComplete(p, 'answer', 2), 3)
    expect(applyTaskUpdate(p, { id: '1', status: 'completed' }, 4)).toBe(p)
    expect(applyTaskCreate(p, { id: '2', text: 'B', activeText: '' }, 5).change).toBe('new')
  })
})

describe('checkpoint note', () => {
  test('only for an open checklist', () => {
    expect(checkpointText(null)).toBe(null)
    expect(checkpointText(start())).toBe(null)
    expect(checkpointText(write(start(), todo('A', 'completed')))).toBe(null)
  })

  test('names the counts, the current step and the tool to update with', () => {
    expect(checkpointText(failedSession())).toBe(
      'Checklist checkpoint: 0/10 done, current: "Doing backend schema". ' +
        'If statuses changed, update them with TodoWrite now; do not add steps or work because of this note.',
    )
    const tasks = applyTaskCreate(start(), { id: '1', text: 'A', activeText: '' }, 1)
    expect(checkpointText(tasks)).toContain('update them with TaskUpdate now')
  })
})

describe('interrupted turns', () => {
  test('an aborted turn is interrupted, with or without a plan', () => {
    expect(text(onTurnComplete(start(), 'aborted', 1))).toBe('✕ Interrupted · No plan')
    const p = write(start(), todo('A', 'completed'), todo('B', 'in_progress', 'Doing B'))
    expect(text(onTurnComplete(p, 'aborted', 1))).toBe('✕ Interrupted ━━─── 1/2 · Doing B')
  })

  test('an error ends as failed', () => {
    expect(text(onTurnComplete(start(), 'error', 1))).toBe('! Turn failed · No plan')
  })

  test('a working record restored from storage is interrupted', () => {
    expect(restore(start()).phase).toBe('interrupted')
    const idle = emptyProgress('S', 0)
    expect(restore(idle)).toBe(idle)
  })
})

describe('terminal band', () => {
  const rowText = (p: Progress | null, columns: number, rows: number, isWorking?: boolean) =>
    cliView(p, isWorking, columns, rows)?.row.map(seg => seg.text).join('') ?? null

  test('a panel only where nth-status keeps room for its own and the head row fits', () => {
    const p = write(start(), todo('A', 'completed'), todo('B', 'in_progress', 'Doing B'), todo('C', 'pending'), todo('D', 'pending'))
    expect(TASK_PANEL_ROWS + STATUS_PANEL_ROWS).toBe(10)
    expect(cliView(p, true, 60, 10)?.isPanel).toBe(true)
    expect(cliView(p, true, 60, 9)?.isPanel).toBe(false)
    expect(cliView(p, true, 24, 12)?.isPanel).toBe(false)
    expect(cliView(p, true, 60, 10)?.current).toEqual([{ text: 'Doing B', isDim: true }])
  })

  test('counts with the floored percentage; no checklist shows none; idle with none is hidden', () => {
    const p = write(start(), todo('A', 'completed'), todo('B', 'completed'), todo('C', 'pending'))
    expect(rowText(p, 60, 12)).toMatch(/━+ 2\/3 · 66%$/)
    expect(rowText(start(), 60, 12)).toBe('● Running · No plan')
    expect(rowText(onTurnComplete(start(), 'answer', 1), 60, 12, false)).toBe(null)
  })

  test('the bar fills the panel row; the Tasks button gives way before the bar does', () => {
    const p = write(start(), todo('A', 'in_progress'), todo('B', 'pending'))
    const wide = cliView(p, true, 80, 12)
    expect(wide?.hasButton).toBe(true)
    // 80 less 4 for border and padding, less the head, the counts and the button: 76 - 19 - 12.
    expect(wide?.row.filter(seg => seg.text.startsWith('━')).map(seg => seg.text.length)).toEqual([45])
    const narrow = cliView(p, true, 30, 12)
    expect(narrow?.isPanel).toBe(true)
    expect(narrow?.hasButton).toBe(false)
  })
})

describe('detail pane', () => {
  test('the head, the current step, the plan change and every step with its status', () => {
    let p = write(start(), todo('A', 'in_progress'), todo('B', 'pending'))
    p = write(p, todo('A', 'completed'), todo('B', 'in_progress', 'Building B'), todo('C', 'pending'))
    const view = paneView(p)
    expect(paneHead(p)).toBe('● Running ━━━─────── 1/3 · plan +1')
    expect(view.current.map(seg => seg.text).join('')).toBe('Now: Building B')
    expect(view.rows.map(row => `${row.glyph} ${row.text}`)).toEqual(['✓ A', '● B', '○ C'])
    expect(view.rows.map(row => row.color)).toEqual(['success', 'claude', 'inactive'])
  })

  test('without a checklist: a neutral head and no rows', () => {
    expect(paneHead(null)).toBe('○ Idle · No plan')
    expect(paneView(null).rows).toEqual([])
    expect(paneView(null).current).toEqual([])
  })
})
