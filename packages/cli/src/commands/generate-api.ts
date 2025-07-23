import chalk from "chalk"
import fs from "fs-extra"
import path from "path"

export async function generateApi(type: string, options: any) {
  if (type !== "api") {
    console.log(chalk.red(`Unknown generation type: ${type}`))
    return
  }

  const resource = options.resource
  if (!resource) {
    console.log(chalk.red("Resource name is required. Use --resource flag."))
    return
  }

  console.log(chalk.blue(`Generating API for ${resource}...`))

  const apiTemplate = `
import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// Validation schemas
const Create${resource}Schema = z.object({
  // Add your fields here
  name: z.string().min(1)
});

const Update${resource}Schema = z.object({
  // Add your fields here
  name: z.string().min(1).optional()
});

// GET /${resource.toLowerCase()}s
router.get('/', async (req, res) => {
  try {
    // Implement your logic here
    res.json({ message: 'Get all ${resource.toLowerCase()}s' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /${resource.toLowerCase()}s/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Implement your logic here
    res.json({ message: \`Get ${resource.toLowerCase()} \${id}\` });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /${resource.toLowerCase()}s
router.post('/', async (req, res) => {
  try {
    const data = Create${resource}Schema.parse(req.body);
    // Implement your logic here
    res.status(201).json({ message: 'Create ${resource.toLowerCase()}', data });
  } catch (error) {
    res.status(400).json({ error: 'Invalid data' });
  }
});

// PUT /${resource.toLowerCase()}s/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = Update${resource}Schema.parse(req.body);
    // Implement your logic here
    res.json({ message: \`Update ${resource.toLowerCase()} \${id}\`, data });
  } catch (error) {
    res.status(400).json({ error: 'Invalid data' });
  }
});

// DELETE /${resource.toLowerCase()}s/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Implement your logic here
    res.json({ message: \`Delete ${resource.toLowerCase()} \${id}\` });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
`

  // Create routes directory if it doesn't exist
  const routesDir = path.join(process.cwd(), "src", "routes")
  await fs.ensureDir(routesDir)

  // Write the API file
  const apiPath = path.join(routesDir, `${resource.toLowerCase()}.ts`)
  await fs.writeFile(apiPath, apiTemplate)

  console.log(chalk.green(`✅ API for ${resource} generated successfully!`))
  console.log(chalk.blue(`File created: ${apiPath}`))
  console.log(chalk.gray("Don't forget to register the route in your main app file."))
}
