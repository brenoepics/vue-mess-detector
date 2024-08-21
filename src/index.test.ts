import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { execa } from 'execa'
import fs from 'node:fs/promises'
import path from 'node:path'
import { BG_INFO, BG_RESET } from './rules/asceeCodes'

describe('yarn analyze command with default configuration', () => {
  it('should execute without any flags and path', async () => {
    const { stdout } = await execa('yarn', ['analyze',])
    expect(stdout).toContain('Analyzing Vue, TS and JS files in ')
  })
  
  it('should execute without any flags with path', async () => {
    const { stdout } = await execa('yarn', ['analyze','./'])
    expect(stdout).toContain('Analyzing Vue, TS and JS files in ')
  })
  
  it('should report error when both apply and ignore is used', async () => {
    try {
      await execa('yarn', ['analyze', '--ignore=vue-strong', '--apply=rrd'])
    } catch (error) {
      expect((error as any).stderr).toContain('Cannot use both --ignore and --apply options together.')
      expect((error as any).exitCode).toBe(1)
    }
  })
  
  it('should report error for invalid ignore rulesets and exit with code 1', async () => {
    try {
      await execa('yarn', ['analyze', '--ignore=gauranga,vue-strong'])
    } catch (error) {
      expect((error as any).stderr).toContain('Invalid ignore values: gauranga')
      expect((error as any).exitCode).toBe(1)
    }
  })

  it('should execute with valid ignore rulesets', async () => {
    const { stdout, stderr } = await execa('yarn', ['analyze', '--ignore=vue-strong,rrd'])
    expect(stderr).not.toContain('Invalid ignore values')
    expect(stdout).toContain('Analyzing Vue, TS and JS files in ')
  })
  
  it('should report error for invalid apply rulesets and exit with code 1', async () => {
    try {
      await execa('yarn', ['analyze', '--apply=gauranga,vue-strong'])
    } catch (error) {
      expect((error as any).stderr).toContain('Invalid apply values: gauranga')
      expect((error as any).exitCode).toBe(1)
    }
  })

  it('should execute with valid apply rulesets', async () => {
    const { stdout, stderr } = await execa('yarn', ['analyze', '--apply=vue-strong,rrd'])
    expect(stderr).not.toContain('Invalid ignore values')
    expect(stdout).toContain('Analyzing Vue, TS and JS files in ')
  })
  
  it('should output json', async () => {
    const { stdout } = await execa('yarn', ['analyze', '--output=json'])
    expect(stdout).toContain('"info": "👉 Analyzing Vue, TS and JS files in ')
  })
})

describe('yarn analyze command with configuration file', () => {
  const projectRoot = path.resolve(__dirname, '..')
  const configPath = path.join(projectRoot, 'vue-mess-detector.json')
  const config = JSON.stringify({
    apply: 'vue-strong,vue-recommended',
    level: 'error',
  }, null, 2)

  beforeAll(async () => {
    await fs.writeFile(configPath, config)
  })

  afterAll(async () => {
    await fs.unlink(configPath)
  })

  it('should execute without any flags and path', async () => {
    const { stdout } = await execa('yarn', ['analyze'])
    expect(stdout).toContain(`👉 Using configuration from ${configPath}`)
    expect(stdout).toContain('Analyzing Vue, TS and JS files in ')
    expect(stdout).toContain(`Applying ${BG_INFO}2${BG_RESET} rulesets ${BG_INFO}vue-strong,vue-recommended${BG_RESET}`)
  })
})