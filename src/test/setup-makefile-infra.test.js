/* global afterAll beforeAll describe expect test */
import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'
import * as os from 'node:os'

import { setupMakefileInfra } from '../setup-makefile-infra'

describe('setupMakefileInfra', () => {
  let tmpDir

  beforeAll(async() => {
    tmpDir = fsPath.join(os.tmpdir(), 'sdlc-lib-makefiles-' + (Math.round(Math.random() * 10000000000000000)))
    await fs.mkdir(tmpDir, { recursive : true })
  })

  afterAll(async() => {
    await fs.rm(tmpDir, { recursive : true })
  })

  test('produces expected output files', async() => {
    const myName = '@acme/foo'
    const myVersion = '1.0.1'
    const packageContents = `{
  "name": "${myName}",
  "version": "${myVersion}"
}`
    const pkgPath = fsPath.join(tmpDir, 'package.json')
    await fs.writeFile(pkgPath, packageContents)

    await setupMakefileInfra({ myName, myVersion, workingPkgRoot : tmpDir })
    expect(existsSync(fsPath.join(tmpDir, 'Makefile'))).toBe(true)
    expect(existsSync(fsPath.join(tmpDir, 'make', '95-final-targets.mk'))).toBe(true)
  })
})
