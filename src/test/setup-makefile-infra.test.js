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
    await fs.writeFile(fsPath.join(tmpDir, 'package.json'), '{ "version": "1.0.0-test.0" }')
  })

  afterAll(async() => {
    process.chdir(process.env.HOME) // doesn't really matter but we get an error if we delete the dir we're in
//    await fs.rm(tmpDir, { recursive : true })
  })

  test("raises an error of no 'package.json' found", async() => {
    try {
      await setupMakefileInfra({ cwd : __dirname })
      fail('setupMakefileInfra did not throw on missing package.json')
    }
    catch (e) {}
  })

  test('produces expected output files (when ignoring package)', async() => {
    await setupMakefileInfra({ cwd : tmpDir })
    expect(existsSync(fsPath.join(tmpDir, 'Makefile'))).toBe(true)
    expect(existsSync(fsPath.join(tmpDir, 'make', '95-final-targets.mk'))).toBe(true)
  })
})
