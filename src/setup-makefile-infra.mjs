import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import { CATALYST_GENERATED_FILE_NOTICE } from '@liquid-labs/catalyst-defaults'

const defineMakefileContents = ({generatedFileNotice}) => 
`${generatedFileNotice}

.DELETE_ON_ERROR:

SHELL:=bash

ifneq ($(wildcard make/*.mk),)
include make/*.mk
endif
`

const defineFinalTargetsContents = ({generatedFileNotice, noDoc, noLint, noTest }) => {
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
    contents +=`
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

const setupMakefileInfra = async({ ignorePackage, noDoc, noLint, noTest } = {}) => {
  if (ignorePackage !== true && !existsSync('package.json')) {
    throw new Error("Did not find 'package.json'. This command must be run from the root of a package; bailing out.")
  } // else assume good to go

  const generatedFileNotice = 
    CATALYST_GENERATED_FILE_NOTICE({ builderNPMName: '@liquid-labs/catalyst-lib-makefiles', commentToken: '#' })

  const makefileContents = defineMakefileContents({ generatedFileNotice })

  const finalTargetsContents = defineFinalTargetsContents({ generatedFileNotice, noDoc, noLint, noTest })

  Promise.all([
    fs.mkdir('make'),
    fs.writeFile('Makefile', makefileContents),
  ])

  await fs.writeFile(fsPath.join('make', '95-final-targets.mk'), finalTargetsContents)
}

export { setupMakefileInfra }