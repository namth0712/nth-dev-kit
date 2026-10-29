import { describe, expect, test } from 'claude-code/testing'

import { branchCode, buildTitle, cleanTask, effortCode, folderCode, labelCode, modelCode } from '../hooks/title'

describe('fields', () => {
  test('folder: first letter of each hyphen part', () => {
    expect(folderCode('C:\\path\\to\\sandbox')).toBe('s')
    expect(folderCode('/work/sample-mod')).toBe('sm')
    expect(folderCode('/work/nth-dev-kit/')).toBe('ndk')
    expect(folderCode('/work/-a--b-')).toBe('ab')
    expect(folderCode('/home/.claude')).toBe('c')
    expect(folderCode('/work/Élan-Vital')).toBe('év')
    expect(folderCode('/')).toBe('')
  })

  test('branch: common names kept, others abbreviated per component', () => {
    expect(branchCode('main')).toBe('main')
    expect(branchCode('master')).toBe('master')
    expect(branchCode('develop')).toBe('develop')
    expect(branchCode('feature/key-points')).toBe('f/kp')
    expect(branchCode('Feature/X')).toBe('f/x')
    expect(branchCode('fix//a"b')).toBe('f/a')
    expect(branchCode('')).toBe('')
  })

  test('model and effort codes', () => {
    expect(modelCode('claude-opus-5-5[1m]')).toBe('O')
    expect(modelCode('claude-sonnet-5-5')).toBe('S')
    expect(modelCode('claude-haiku-5-5')).toBe('H')
    expect(modelCode('claude-fable-5-1')).toBe('')
    expect(modelCode(undefined)).toBe('')
    expect(['low', 'medium', 'high', 'xhigh', 'max'].map(effortCode)).toEqual(['L', 'M', 'H', 'xH', 'Max'])
    expect(effortCode(3)).toBe('')
    expect(effortCode('turbo')).toBe('')
  })

  test('label must be 1-16 of A-Za-z0-9._-', () => {
    expect(labelCode('C2')).toBe('C2')
    expect(labelCode(undefined)).toBe('')
    expect(labelCode('has space')).toBe('')
    expect(labelCode('x'.repeat(17))).toBe('')
  })

  test('task: trimmed, whitespace collapsed', () => {
    expect(cleanTask('  kid   pocket\t\n ')).toBe('kid pocket')
  })
})

describe('buildTitle', () => {
  const base = { label: 'C2', cwd: '/w/nth-dev-kit', branch: 'main', model: 'claude-opus-5-5', effort: 'high' }

  test('full title, then with a task', () => {
    expect(buildTitle(base)).toBe('C2_ndk_main_OH')
    expect(buildTitle({ ...base, task: 'mod' })).toBe('C2_ndk_main_OH_mod')
    expect(buildTitle({ ...base, label: 'C1', cwd: '/w/sample-mod', branch: 'feature/key-points', task: 'rewards' })).toBe(
      'C1_sm_f/kp_OH_rewards',
    )
    expect(buildTitle({ ...base, cwd: '/w/acme-web-frontend', effort: 'xhigh', task: 'map' })).toBe('C2_awf_main_OxH_map')
  })

  test('missing fields are dropped, never replaced by placeholders', () => {
    expect(buildTitle({ ...base, effort: undefined })).toBe('C2_ndk_main_O')
    expect(buildTitle({ ...base, model: undefined })).toBe('C2_ndk_main')
    expect(buildTitle({ ...base, branch: '' })).toBe('C2_ndk_OH')
    expect(buildTitle({ ...base, label: 'bad label' })).toBe('ndk_main_OH')
    expect(buildTitle({ cwd: '/' })).toBe('')
    expect(buildTitle({ cwd: '/', task: 'only' })).toBe('only')
  })
})
