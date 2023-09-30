import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

let myVersion, myName

const getMyNameAndVersion = async ({ cwd }) => {
  if (myVersion === undefined || myPackage === undefined) {
    const packagePath = fsPath.join(cwd, 'package.json') // we can trust we're in the root 
    const packageContents = await fs.readFile(packagePath, { encoding: 'utf8' })
    const packageJSON = JSON.parse(packageContents)
    myName = packageJSON.name
    myVersion = packageJSON.version
  }

  return { myName, myVersion }
}

export { getMyNameAndVersion }