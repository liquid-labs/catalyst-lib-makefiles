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
    console.log('tmpDir:', tmpDir) // DEBUG
    await fs.mkdir(tmpDir, { recursive: true })
    process.chdir(tmpDir)
  })

  // afterAll(async() => { await fs.rm(tmpDir, { recursive: true }) })

  test("raises an error of no 'package.json' found", async () => {
    try {
      await setupMakefileInfra()
      fail('setupMakefileInfra did not throw on missing package.json')
    }
    catch (e) {}
  })

  test("produces expected output files", async () => {
    await setupMakefileInfra({ ignorePackage : true })
    expect(existsSync('Makefile')).toBe(true)
    expect(existsSync(fsPath.join('make', '95-final-targets.mk'))).toBe(true)
  })
})