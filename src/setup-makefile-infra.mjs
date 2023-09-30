import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import { CATALYST_GENERATED_FILE_NOTICE } from '@liquid-labs/catalyst-defaults'

import { getMyNameAndVersion } from './lib/get-my-name-and-version'

const defineMakefileContents = ({ generatedFileNotice, noDoc, noLint, noTest }) => {
  let contents = `${generatedFileNotice}

.DELETE_ON_ERROR:

SHELL:=bash

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

const setupMakefileInfra = async({ cwd = process.cwd, noDoc, noLint, noTest } = {}) => {
  // myVersion is used in the results and we don't want to do anything if there's a problem retrieving it.
  const { myName, myVersion } = await getMyNameAndVersion({ cwd })

  const generatedFileNotice =
    CATALYST_GENERATED_FILE_NOTICE({ builderNPMName : '@liquid-labs/catalyst-lib-makefiles', commentToken : '#' })

  const makefileContents = defineMakefileContents({ generatedFileNotice })

  const finalTargetsContents = defineFinalTargetsContents({ generatedFileNotice, noDoc, noLint, noTest })

  const relMakefile = 'Makefile'
  const absMakefile = fsPath.join(cwd, relMakefile)
  const relMakeDir = 'make'
  const absMakeDir = fsPath.join(cwd, relMakeDir)
  Promise.all([
    fs.mkdir(absMakeDir, { recursive : true }), // recursive has side effect of letting it be OK if dir exists
    fs.writeFile(absMakefile, makefileContents)
  ])

  let tries = 0
  // even with proper awatis, the dir can take a little bit to fully appear
  while (tries < 20 && !existsSync(absMakeDir)) {
    await new Promise(resolve => setTimeout(resolve, 10))
    tries += 1
  }

  // if the dir never appears, this fails
  const relFinalTargetsScriptPath = fsPath.join(relMakeDir, '95-final-targets.mk')
  const absFinalTargetsScriptPath = fsPath.join(cwd, relFinalTargetsScriptPath)

  await fs.writeFile(absFinalTargetsScriptPath, finalTargetsContents)

  return [ // any scripts we created
    {
      builder  : myName,
      version  : myVersion,
      priority : 0,
      path     : relMakefile,
      purpose  : "Setup some basic configurion (like setting `.DELETE_ON_ERROR`) and then include everything matching 'make/*.mk'. This is he first standard script which sets up the basic framework."
    },
    {
      builder  : myName,
      version  : myVersion,
      priority : 95,
      path     : relFinalTargetsScriptPath,
      purpose  : 'Defines standard all, build, doc, test, etc. based on the dependencies collected across the various scripts, e.g.: `build: $(BUILD_TARGETS)`, etc. This is the final standard script that ties everything together.'
    }
  ]
}

export { setupMakefileInfra }
