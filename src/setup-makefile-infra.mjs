import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import { CATALYST_GENERATED_FILE_NOTICE } from '@liquid-labs/catalyst-defaults'

const defineMakefileContents = ({ generatedFileNotice, noDoc, noLint, noTest }) => {
  let contents = `${generatedFileNotice}

.DELETE_ON_ERROR:

SHELL:=bash

default: all

PHONY_TARGETS:=all default

BUILD_TARGETS:=
`

  if (noDoc !== true) {
    contents += `
DOC_TARGETS:=
`
  }

  if (noLint !== true) {
    contents += `
LINT_TARGETS:=
`
  }

  if (noTest !== true) {
    contents += `
TEST_TARGETS:=
`
  }

  contents += `
ifneq ($(wildcard make/*.mk),)
include make/*.mk
endif
`
  return contents
}

const defineFinalTargetsContents = ({ generatedFileNotice, noDoc, noLint, noTest }) => {
  let contents = `${generatedFileNotice}

.PRECIOUS: $(PRECIOUS_TARGETS)

build: $(BUILD_TARGETS)

PHONY_TARGETS+=build
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
.PHONY: $(PHONY_TARGETS)\n`

  return contents
}

const setupMakefileInfra = async({
  myName = throw new Error("Missing required option 'myName'."),
  myVersion = throw new Error("Missing required option 'myVersion'."),
  noDoc, noLint, noTest,
  workingPkgRoot = throw new Error("Missing required option 'workingPkgRoot'.")
} = {}) => {
  const generatedFileNotice =
    CATALYST_GENERATED_FILE_NOTICE({ builderNPMName : myName, commentToken : '#' })

  const makefileContents = defineMakefileContents({ generatedFileNotice })

  const finalTargetsContents = defineFinalTargetsContents({ generatedFileNotice, noDoc, noLint, noTest })

  const makefilePriority = 0
  const relMakefilePath = 'Makefile'
  const absMakefilePath = fsPath.join(workingPkgRoot, relMakefilePath)

  await fs.mkdir(fsPath.join(workingPkgRoot, 'make'), { recursive : true })
  await fs.writeFile(absMakefilePath, makefileContents)

  const finalTargetsPriority = 95
  const relFinalTargetsPath = fsPath.join('make', finalTargetsPriority + '-final-targets.mk')
  const absFinalTargetsPath = fsPath.join(workingPkgRoot, relFinalTargetsPath)
  await fs.writeFile(absFinalTargetsPath, finalTargetsContents)

  return {
    artifacts :
    [
      {
        builder  : myName,
        version  : myVersion,
        priority : makefilePriority,
        path     : relMakefilePath,
        purpose  : "Sets up standard target vars (like 'BUILD_TARGETS') and runs scripts from 'make'."
      },
      {
        builder  : myName,
        version  : myVersion,
        priority : finalTargetsPriority,
        path     : relFinalTargetsPath,
        purpose  : "Sets up the final basic targets (like 'build') based on the target vars (like 'BUILD_TARGETS')."
      }
    ]
  }
}

export { setupMakefileInfra }
