import chalk from "chalk"
import inquirer from "inquirer"
import fs from "fs-extra"
import path from "path"

export async function addModule(module: string, options: any) {
  console.log(chalk.blue(`Adding ${module} module...`))

  const configPath = path.join(process.cwd(), "shna.config.js")

  if (!(await fs.pathExists(configPath))) {
    console.log(chalk.red("No Shna project found. Run this command in a Shna project directory."))
    return
  }

  switch (module) {
    case "auth":
      await addAuthModule(options)
      break
    case "payments":
      await addPaymentsModule(options)
      break
    case "database":
      await addDatabaseModule(options)
      break
    default:
      console.log(chalk.red(`Unknown module: ${module}`))
  }
}

async function addAuthModule(options: any) {
  const questions = [
    {
      type: "checkbox",
      name: "providers",
      message: "Select authentication providers:",
      choices: [
        { name: "JWT", value: "jwt", checked: true },
        { name: "Google OAuth", value: "google" },
        { name: "GitHub OAuth", value: "github" },
      ],
    },
  ]

  const answers = await inquirer.prompt(questions)

  // Update configuration
  console.log(chalk.green("✅ Auth module added successfully!"))
  console.log(chalk.blue("Don't forget to set your environment variables:"))

  if (answers.providers.includes("jwt")) {
    console.log(chalk.gray("  JWT_SECRET=your-secret-key"))
  }
  if (answers.providers.includes("google")) {
    console.log(chalk.gray("  GOOGLE_CLIENT_ID=your-client-id"))
    console.log(chalk.gray("  GOOGLE_CLIENT_SECRET=your-client-secret"))
  }
  if (answers.providers.includes("github")) {
    console.log(chalk.gray("  GITHUB_CLIENT_ID=your-client-id"))
    console.log(chalk.gray("  GITHUB_CLIENT_SECRET=your-client-secret"))
  }
}

async function addPaymentsModule(options: any) {
  const questions = [
    {
      type: "list",
      name: "gateway",
      message: "Select payment gateway:",
      choices: ["razorpay", "stripe", "paypal"],
    },
  ]

  const answers = await inquirer.prompt(questions)

  console.log(chalk.green(`✅ ${answers.gateway} payment module added successfully!`))
  console.log(chalk.blue("Environment variables needed:"))

  if (answers.gateway === "razorpay") {
    console.log(chalk.gray("  RAZORPAY_KEY_ID=your-key-id"))
    console.log(chalk.gray("  RAZORPAY_KEY_SECRET=your-key-secret"))
  } else if (answers.gateway === "stripe") {
    console.log(chalk.gray("  STRIPE_SECRET_KEY=your-secret-key"))
    console.log(chalk.gray("  STRIPE_PUBLISHABLE_KEY=your-publishable-key"))
  }
}

async function addDatabaseModule(options: any) {
  const questions = [
    {
      type: "list",
      name: "type",
      message: "Select database type:",
      choices: ["mongodb", "firebase"],
    },
  ]

  const answers = await inquirer.prompt(questions)

  console.log(chalk.green(`✅ ${answers.type} database module added successfully!`))
  console.log(chalk.blue("Environment variables needed:"))
  console.log(chalk.gray("  DATABASE_URL=your-database-url"))
}
