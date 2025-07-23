import fs from "fs-extra"
import path from "path"
import chalk from "chalk"
import ora from "ora"

export async function createApp(name: string, options: any) {
  const spinner = ora("Creating Shna application...").start()

  try {
    const projectPath = path.join(process.cwd(), name)

    // Check if directory exists
    if (await fs.pathExists(projectPath)) {
      spinner.fail(`Directory ${name} already exists`)
      return
    }

    // Create project directory
    await fs.ensureDir(projectPath)

    // Copy template files
    const templatePath = path.join(__dirname, "../../templates", options.template || "basic")
    await fs.copy(templatePath, projectPath)

    // Update package.json
    const packageJsonPath = path.join(projectPath, "package.json")
    const packageJson = await fs.readJson(packageJsonPath)
    packageJson.name = name
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 })

    spinner.succeed(`Created ${name} successfully!`)

    console.log(chalk.green("\n✨ Project created successfully!"))
    console.log(chalk.blue("\nNext steps:"))
    console.log(chalk.gray(`  cd ${name}`))
    console.log(chalk.gray("  npm install"))
    console.log(chalk.gray("  npm run dev"))
  } catch (error) {
    spinner.fail("Failed to create application")
    console.error(error)
  }
}
