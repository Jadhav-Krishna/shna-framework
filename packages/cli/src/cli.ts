#!/usr/bin/env node

import { Command } from "commander"
import chalk from "chalk"
import { createApp } from "./commands/create-app"
import { addModule } from "./commands/add-module"
import { generateApi } from "./commands/generate-api"

const program = new Command()

program.name("shna").description("CLI for Shna framework").version("1.0.0")

program
  .command("create <name>")
  .description("Create a new Shna application")
  .option("-t, --template <template>", "Template to use", "basic")
  .action(createApp)

program
  .command("add <module>")
  .description("Add a module to your Shna app")
  .option("-p, --provider <provider>", "Provider to use")
  .action(addModule)

program
  .command("generate <type>")
  .description("Generate code scaffolding")
  .option("-r, --resource <resource>", "Resource name")
  .action(generateApi)

program
  .command("dev")
  .description("Start development server")
  .action(() => {
    console.log(chalk.blue("🚀 Starting Shna development server..."))
    // Development server logic
  })

program.parse()
