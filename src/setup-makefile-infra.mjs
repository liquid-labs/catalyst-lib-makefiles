import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import { CATALYST_GENERATED_FILE_NOTICE } from '@liquid-labs/catalyst-defaults'
import { getPackageNameAndVersion } from '@liquid-labs/catalyst-lib-build'

const defineMakefileContents = ({ generatedFileNotice }) =>
  `${generatedFileNotice}

.DELETE_ON_ERROR:

SHELL:=bash

ifneq ($(wildcard make/*.mk),)
include make/*.mk
endif
`

const defineFinalTargetsContents = ({ generatedFileNotice, noDoc, noLint, noTest }) => {
  let contents = `${generatedFileNotice}

.PRECIOUS: $(PRECIOUS_TARGETS)

build: $(BUILD_TARGETS)

default: build

PHONY_TARGETS+=build default
`
  if (noDoc !== true) {
    contents += `
doc: $(DOC_TARGETS)

all: build doc

PHONY_TARGETS+=doc
`
  }
  else {
    contents += `
all: build
`
  }

  if (noLint !== true) {
    contents += `
lint: $(LINT_TARGETS)

lint-fix: $(LINT_FIX_TARGETS)

PHONY_TARGETS+=lint lint-fix
`
  }

  if (noTest !== true) {
    contents += `
test: $(TEST_TARGETS)

PHONY_TARGETS+= test
`
  }

  if (noTest !== true || noLint !== true) {
    contents += `
qa: ${noTest === true ? '' : 'test'} ${noLint === true ? '' : 'lint'}

PHONY_TARGETS+=qa
`
  }

  contents += `
.PHONY: $(PHONY_TARGETS)`

  return contents
}

const setupMakefileInfra = async({ cwd = process.cwd(), ignorePackage, noDoc, noLint, noTest } = {}) => {
  if (ignorePackage !== true && !existsSync('package.json')) {
    throw new Error("Did not find 'package.json'. This command must be run from the root of a package; bailing out.")
  } // else assume good to go

  const [ myName, myVersion ] = await getPackageNameAndVersion({ pkgDir: cwd })

  const generatedFileNotice =
    CATALYST_GENERATED_FILE_NOTICE({ builderNPMName : '@liquid-labs/catalyst-lib-makefiles', commentToken : '#' })

  const makefileContents = defineMakefileContents({ generatedFileNotice })

  const finalTargetsContents = defineFinalTargetsContents({ generatedFileNotice, noDoc, noLint, noTest })

  const makefilePriority = 0
  const relMakefilePath = 'Makefile'
  const absMakefilePath = fsPath.join(cwd, relMakefilePath)

  Promise.all([
    fs.mkdir(fsPath.join(cwd, 'make')),
    fs.writeFile(absMakefilePath, makefileContents)
  ])

  const finalTargetsPriority = 95
  const relFinalTargetsPath = fsPath.join('make', finalTargetsPriority + '-final-targets.mk')
  const absFinalTargetsPath = fsPath.join(cwd, relFinalTargetsPath)
  await fs.writeFile(absFinalTargetsPath, finalTargetsContents)

  return [
    {
      builder : myName,
      version : myVersion,
      priority: makefilePriority,
      path    : relMakefilePath,
      purpose : "Sets up standardtarget vars (like 'BUILD_TARGETS') and runs scripts from 'make'."
    },
    {
      builder : myName,
      version : myVersion,
      priority: finalTargetsPriority,
      path    : relFinalTargetsPath,
      purpose : "Sets up the final basic targets (like 'build') based on the target vars (like 'BUILD_TARGETS')."
    }
  ]
}

export { setupMakefileInfra }
