import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const distRoot = path.join(projectRoot, 'dist');
const angularOutputRoot = path.join(distRoot, 'TiquiApp');
const browserOutput = path.join(angularOutputRoot, 'browser');

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await pathExists(browserOutput))) {
    throw new Error(`Expected Angular browser output at ${browserOutput}`);
  }

  const entries = await readdir(distRoot, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === 'TiquiApp') {
      continue;
    }

    await rm(path.join(distRoot, entry.name), { recursive: true, force: true });
  }

  await mkdir(distRoot, { recursive: true });
  await cp(browserOutput, distRoot, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});