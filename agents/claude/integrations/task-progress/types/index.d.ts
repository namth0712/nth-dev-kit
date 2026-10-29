export type TStepStatus = 'pending' | 'in_progress' | 'completed'

export type Step = {
  key: string
  text: string
  activeText?: string
  status: TStepStatus
}

export type TPhase = 'idle' | 'working' | 'awaiting' | 'stale' | 'interrupted' | 'error'

export type TPlanChange = 'new' | 'expanded' | 'revised' | 'replaced'

export type Progress = {
  v: 2
  sessionId: string
  phase: TPhase
  source: 'todo' | 'task' | null
  steps: Step[]
  change: TPlanChange | null
  delta: number
  /** Main-loop tool calls since the checklist last changed. */
  work: number
  /** The checklist was complete when the last turn started or ended. */
  settled: boolean
  /** The first native task id of the current task plan: lower ids in the task files are earlier plans'. */
  taskFloor: number | null
  /** The main-loop tool whose permission dialog was raised and whose call has not settled yet. */
  approval: string | null
  updatedAt: number
}

declare module 'claude-code' {
  interface PluginState {
    'nth-task-progress': { progress: Progress | null; isExpanded: boolean }
  }
}
