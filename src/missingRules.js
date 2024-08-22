import { promises as fs } from 'node:fs'
import path from 'node:path'

const isValidSourceFile = (currentPath, file) => currentPath !== './src/rules' && file.endsWith('.ts') && !file.endsWith('.test.ts')

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath)
    return true
  }
  catch {
    return false
  }
}

const findRules = async (srcDir) => {
  const allRules = []

  async function traverseDirectory(currentPath) {
    const files = await fs.readdir(currentPath)

    for (const file of files) {
      const fullPath = path.join(currentPath, file)
      const stat = await fs.stat(fullPath)

      if (stat.isDirectory()) {
        await traverseDirectory(fullPath)
      }
      if (isValidSourceFile(currentPath, file)) {
        allRules.push(`${currentPath}/${file}`)
      }
    }
  }

  await traverseDirectory(srcDir)
  return allRules
}

const main = async () => {
  const srcDirectory = './src/rules'
  const rulesFile = './src/rules/rules.ts'
  const rulesCheckFile = './src/rulesCheck.ts'
  const rulesReportFile = './src/rulesReport.ts'

  let errors = 0

  try {
    const allRules = await findRules(srcDirectory)

    for (const rule of allRules) {
      // check if it has a test file
      const testFile = rule.replace('.ts', '.test.ts')
      const testFileExists = await fileExists(testFile)
      if (!testFileExists) {
        console.log(`❌ ${rule} is missing a test file`)
        errors++
      }

      const ruleName = rule.split('/').pop().replace('.ts', '')

      // check if the rule is added to src/rules/rules.ts
      const rulesFileContent = await fs.readFile(rulesFile, 'utf8')
      if (!rulesFileContent.includes(ruleName)) {
        console.log(`❌ ${ruleName} is missing from ${rulesFile}`)
        errors++
      }

      // check if the rule is added to src/rulesCheck.ts
      const rulesCheckFileContent = await fs.readFile(rulesCheckFile, 'utf8')
      if (!rulesCheckFileContent.includes(ruleName)) {
        console.log(`❌ ${ruleName} is missing from ${rulesCheckFile}`)
        errors++
      }

      // check if the rule is added to src/rulesReport.ts
      const rulesReportFileContent = await fs.readFile(rulesReportFile, 'utf8')
      if (!rulesReportFileContent.includes(ruleName)) {
        console.log(`❌ ${ruleName} is missing from ${rulesReportFile}`)
        errors++
      }
    }

    if (errors) {
      console.error(`\n${errors} errors were found during the check.\n`)
      // eslint-disable-next-line node/prefer-global/process
      process.exit(1) // Exit with error code
    }
    
    if (!errors) {
        console.log('All checks passed successfully.')
    }
}
catch (error) {
    console.error('🙀 An error occurred:', error)
    // eslint-disable-next-line node/prefer-global/process
    process.exit(1) // Exit with error code
  }
}

main()