/* global afterAll beforeAll describe expect fail test */
import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'
import * as os from 'node:os'

import { setupMakefileInfra } from '../setup-makefile-infra'

describe('setupMakefileInfra', () => {
  let tmpDir

  beforeAll(async() => {
    tmpDir = fsPath.join(os.tmpdir(), 'catalyst-lib-makefiles-' + (Math.round(Math.random() * 10000000000000000)))
    await fs.mkdir(tmpDir, { recursive : true })
  })

  afterAll(async() => {
    await fs.rm(tmpDir, { recursive : true })
  })

  test("raises an error of no 'package.json' found", async() => {
    try {
      await setupMakefileInfra({ cwd : tmpDir })
      fail('setupMakefileInfra did not throw on missing package.json')
    }
    catch (e) {
      expect(e.message).toMatch(/^ENOENT.*package.json/)
    }
  })

  test('produces expected output files', async() => {
    const packageContents = `{
  "name": "@acme/foo",
  "version": "1.0.1"
}`
    const pkgPath = fsPath.join(tmpDir, 'package.json')
    await fs.writeFile(pkgPath, packageContents)

    await setupMakefileInfra({ cwd : tmpDir })
    expect(existsSync(fsPath.join(tmpDir, 'Makefile'))).toBe(true)
    expect(existsSync(fsPath.join(tmpDir, 'make', '95-final-targets.mk'))).toBe(true)
  })
})
