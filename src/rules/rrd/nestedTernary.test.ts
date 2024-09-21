import type { SFCScriptBlock } from '@vue/compiler-sfc'
import { beforeEach, describe, expect, it } from 'vitest'
import { checkNestedTernary, reportNestedTernary, resetResults } from './nestedTernary'

describe('checkNestedTernary', () => {
  beforeEach(() => {
    resetResults()
  })

  it('should not report files with simle ternary', () => {
    const script = {
      content: `const today = new Date()
      const isMonday = today.getDay() == 1 ? true : false`,
    } as SFCScriptBlock
    const fileName = 'nestedTernary.vue'
    checkNestedTernary(script, fileName)
    const result = reportNestedTernary()
    expect(result.length).toBe(0)
    expect(result).toStrictEqual([])
  })

  it('should report files with nested ternary', () => {
    const script = {
      content: `const pass = 'Gauranga%)'
        const isStrong = pass.length > 12 ? pass.includes('%') ? pass.includes('$') : false : false`,
    } as SFCScriptBlock
    const fileName = 'nestedTernary-problem.vue'
    checkNestedTernary(script, fileName)
    const result = reportNestedTernary()
    expect(result.length).toBe(1)
    expect(result).toStrictEqual([{
      file: fileName,
      rule: `<text_info>rrd ~ nested Ternary</text_info>`,
      description: `👉 <text_warn>Break the nested ternary into standalone ternaries, if statements, && operators, or a dedicated function.</text_warn> See: https://vue-mess-detector.webmania.cc/rules/rrd/nested-ternary.html`,
      message: `line #2 has <bg_warn>nested ternary</bg_warn> 🚨`,
    }])
  })

  it('should not report files when optional chaning is used along with a ternary', () => {
    const script = {
      content: `const countDatasets = this.structure?.volume ? this.structure.volume.length : 0;`,
    } as SFCScriptBlock
    const fileName = 'nestedTernary-problem.vue'
    checkNestedTernary(script, fileName)
    const result = reportNestedTernary()
    expect(result.length).toBe(0)
    expect(result).toStrictEqual([])
  })

  it('should not report files with simple ternary and optional chaining', () => {
    const script = {
      content: `
        const result = obj?.property ? obj.property : defaultValue;
        const anotherResult = condition ? value1 : value2;
      `,
    } as SFCScriptBlock
    const fileName = 'simple-ternary-and-optional-chaining.vue'
    checkNestedTernary(script, fileName)
    const result = reportNestedTernary()
    expect(result.length).toBe(0)
    expect(result).toStrictEqual([])
  })

  it('should report files with nested ternary, even when optional chaining is present', () => {
    const script = {
      content: `
        const result = obj?.property ? (condition ? value1 : value2) : defaultValue;
      `,
    } as SFCScriptBlock
    const fileName = 'nested-ternary-with-optional-chaining.vue'
    checkNestedTernary(script, fileName)
    const result = reportNestedTernary()
    expect(result.length).toBe(1)
    expect(result).toStrictEqual([{
      file: fileName,
      rule: `<text_info>rrd ~ nested Ternary</text_info>`,
      description: `👉 <text_warn>Break the nested ternary into standalone ternaries, if statements, && operators, or a dedicated function.</text_warn> See: https://vue-mess-detector.webmania.cc/rules/rrd/nested-ternary.html`,
      message: `line #1 has <bg_warn>nested ternary</bg_warn> 🚨`,
    }])
  })
})
