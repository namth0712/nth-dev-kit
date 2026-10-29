// Pure title rules for nth-session-title. See session-title.md.
// <label>_<folder>_<branch>_<model><effort>[_<task>]; a missing field is dropped with its `_`.

const LABEL = /^[A-Za-z0-9._-]{1,16}$/
const KEPT_BRANCHES = new Set(['main', 'master', 'develop'])
const EFFORTS: Record<string, string> = { low: 'L', medium: 'M', high: 'H', xhigh: 'xH', max: 'Max' }

/** The label as set, or '' when unset or not 1-16 of `A-Za-z0-9._-`. */
export function labelCode(label: string | undefined): string {
  return label && LABEL.test(label) ? label : ''
}

/** First letter or digit of each hyphen-separated part, lowercase: `nth-dev-kit` → `ndk`. */
function initials(name: string): string {
  return name
    .split('-')
    .map(part => part.match(/[\p{L}\p{N}]/u)?.[0] ?? '')
    .join('')
    .toLowerCase()
}

/** The working directory's basename, abbreviated. */
export function folderCode(cwd: string): string {
  const base = cwd.replace(/[\\/]+$/, '').split(/[\\/]/).pop() ?? ''
  return initials(base)
}

/** `main`, `master`, `develop` kept; otherwise each `/` component abbreviated: `feature/key-points` → `f/kp`. */
export function branchCode(branch: string): string {
  const name = branch.trim()
  if (KEPT_BRANCHES.has(name)) return name
  return name
    .split('/')
    .map(initials)
    .filter(Boolean)
    .join('/')
}

/** `O`, `S` or `H` by model family, '' for any other model. */
export function modelCode(model: string | undefined): string {
  const id = (model ?? '').toLowerCase()
  if (id.includes('opus')) return 'O'
  if (id.includes('sonnet')) return 'S'
  if (id.includes('haiku')) return 'H'
  return ''
}

/** `L`, `M`, `H`, `xH` or `Max`, '' for anything else (numbers included). */
export function effortCode(effort: unknown): string {
  return typeof effort === 'string' ? (EFFORTS[effort.toLowerCase()] ?? '') : ''
}

/** The task as typed, trimmed, with whitespace and control runs collapsed to one space. */
export function cleanTask(args: string): string {
  return args.replace(/[\s\p{Cc}]+/gu, ' ').trim()
}

export type TitleParts = {
  label?: string
  cwd: string
  branch?: string
  model?: string
  effort?: unknown
  task?: string
}

/** The title from its parts; effort is shown only beside a known model. '' when nothing is known. */
export function buildTitle(parts: TitleParts): string {
  const model = modelCode(parts.model)
  return [
    labelCode(parts.label),
    folderCode(parts.cwd),
    branchCode(parts.branch ?? ''),
    model && model + effortCode(parts.effort),
    cleanTask(parts.task ?? ''),
  ]
    .filter(Boolean)
    .join('_')
}
