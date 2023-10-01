import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import createError from 'http-errors'

import { CATALYST_GENERATED_FILE_NOTICE } from '@liquid-labs/catalyst-defaults'
import { getPackageNameAndVersion } from '@liquid-labs/catalyst-lib-build'

const setupMakefileLocations = async({
  cwd = process.cwd(),
  distPath = 'dist',
  docBuildPath = 'doc',
  docSrcPath = 'doc',
  noDoc,
  noTest,
  qaPath = 'qa',
  srcPath = 'src',
  testStagingPath = 'test-staging'
}) => {
  const testSrcPath = fsPath.join(cwd, srcPath)
  if (!existsSync(testSrcPath)) {
    throw createError.BadRequest(`Did not find source path '${srcPath}' in client working directory '${cwd}'; set 'srcPath' parameter for custom src path.`)
  }

  const generatedFileNotice =
    CATALYST_GENERATED_FILE_NOTICE({ builderNPMName : '@liquid-labs/catalyst-builder-node', commentToken : '#' })

  let contents = `${generatedFileNotice}

SRC:=${srcPath}
DIST:=${distPath}
`
  if (noDoc !== true) {
    const fullDocSrcPath = fsPath.join(srcPath, docSrcPath)

    const testDocSrcPath = fsPath.join(cwd, fullDocSrcPath)
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

  const [myName, myVersion] = await getPackageNameAndVersion({ pkgDir : cwd })

  const priority = 10
  const relLocationsScriptPath = fsPath.join('make', priority + '-locations.mk')
  const absLocationsScriptPath = fsPath.join(cwd, relLocationsScriptPath)

  await fs.mkdir(fsPath.join(cwd, 'make'), { recursive : true })
  await fs.writeFile(absLocationsScriptPath, contents)

  return [
    {
      builder : myName,
      version : myVersion,
      priority,
      path    : relLocationsScriptPath,
      purpose : 'Defines the most basic locations, like the source directory.'
    }
  ]
}

export { setupMakefileLocations }
