/* global afterAll beforeAll describe expect fail test */
import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'
import * as os from 'node:os'

import { setupMakefileLocations } from '../setup-makefile-locations'

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
      await setupMakefileLocations({ cwd : tmpDir })
      fail('setupMakefileInfra did not throw on missing package.json')
    }
    catch (e) {
      expect(e.message).toMatch(/^Did not find.*src/)
    }
  })

  test('produces expected output files', async() => {
    const srcDocPath = fsPath.join(tmpDir, 'src', 'doc')
    await fs.mkdir(srcDocPath, { recursive : true })

    await setupMakefileLocations({ cwd : tmpDir, ignorePackage : true })
    expect(existsSync(fsPath.join(tmpDir, 'make', '10-locations.mk'))).toBe(true)
  })
})
