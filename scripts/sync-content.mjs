import { cp, mkdir, readdir, rm, stat } from "node:fs/promises"
import path from "node:path"

const repoRoot = process.cwd()
const defaultSource = path.join(
  process.env.HOME,
  "Library/CloudStorage/GoogleDrive-shawnyday.ch@gmail.com/내 드라이브/MyNote/70. Blogging/Github",
)

const source = path.resolve(process.env.BLOG_SOURCE ?? defaultSource)
const target = path.join(repoRoot, "content")

const ignoredNames = new Set([".DS_Store", ".obsidian", ".trash"])

async function assertDirectory(directory, label) {
  try {
    const info = await stat(directory)
    if (!info.isDirectory()) {
      throw new Error(`${label} is not a directory: ${directory}`)
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`${label} does not exist: ${directory}`)
    }
    throw error
  }
}

async function copyFiltered(from, to) {
  await mkdir(to, { recursive: true })
  const entries = await readdir(from, { withFileTypes: true })

  for (const entry of entries) {
    if (ignoredNames.has(entry.name)) continue

    const sourcePath = path.join(from, entry.name)
    const targetPath = path.join(to, entry.name)

    if (entry.isDirectory()) {
      await copyFiltered(sourcePath, targetPath)
    } else if (entry.isFile()) {
      await cp(sourcePath, targetPath)
    }
  }
}

await assertDirectory(source, "Blog source")

const indexPath = path.join(source, "index.md")
try {
  await stat(indexPath)
} catch {
  throw new Error(`Blog source needs an index.md file: ${indexPath}`)
}

await rm(target, { recursive: true, force: true })
await copyFiltered(source, target)

console.log(`Synced blog content`)
console.log(`  from: ${source}`)
console.log(`  to:   ${target}`)
