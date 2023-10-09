import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import createError from 'http-errors'

import { CATALYST_GENERATED_FILE_NOTICE } from '@liquid-labs/catalyst-defaults'

const setupMakefileLocations = async({
  distPath = 'dist',
  docBuildPath = 'doc',
  docSrcPath = 'doc',
  myName = throw new Error("Missing required option 'myName'."),
  myVersion = throw new Error("Missing required option 'myVersion'."),
  noDoc,
  noTest,
  qaPath = 'qa',
  srcPath = 'src',
  testStagingPath = 'test-staging',
  workingPkgRoot = throw new Error("Missing required option 'workingPkgRoot'.")
}) => {
  const testSrcPath = fsPath.join(workingPkgRoot, srcPath)
  if (!existsSync(testSrcPath)) {
    throw createError.BadRequest(`Did not find source path '${srcPath}' in client working directory '${workingPkgRoot}'; set 'srcPath' parameter for custom src path.`)
  }

  const generatedFileNotice =
    CATALYST_GENERATED_FILE_NOTICE({ builderNPMName : myName, commentToken : '#' })

  let contents = `${generatedFileNotice}

SRC:=${srcPath}
DIST:=${distPath}
`
  if (noDoc !== true) {
    const fullDocSrcPath = fsPath.join(srcPath, docSrcPath)

    const testDocSrcPath = fsPath.join(workingPkgRoot, fullDocSrcPath)
    if (!existsSync(testDocSrcPath)) {
      throw createError.BadRequest(`Did not find expect document source path '${fullDocSrcPath}'; specify 'docSrcPath' or 'noDoc'.`)
    }

    contents += `DOC:=${docSrcPath}
DOC_SRC:=${fullDocSrcPath}
`
  }

  if (noTest !== true) {
    contents += `TEST_STAGING:=${testStagingPath}\n`
  }

  contents += `QA:=${qaPath}\n`

  const priority = 10
  const relLocationsScriptPath = fsPath.join('make', priority + '-locations.mk')
  const absLocationsScriptPath = fsPath.join(workingPkgRoot, relLocationsScriptPath)

  await fs.mkdir(fsPath.join(workingPkgRoot, 'make'), { recursive : true })
  await fs.writeFile(absLocationsScriptPath, contents)

  return {
    scripts :
      [
        {
          builder : myName,
          version : myVersion,
          priority,
          path    : relLocationsScriptPath,
          purpose : 'Defines the most basic locations, like the source directory.'
        }
      ]
  }
}

export { setupMakefileLocations }
