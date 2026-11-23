// Windows fix: VS Code terminals can start in "c:\..." (lowercase drive letter).
// Vite then loads vitest twice ("c:" vs "C:") and every test crashes with
// "Cannot read properties of undefined (reading 'config')".
// This launcher runs vitest with an uppercase drive letter. No-op on macOS/Linux.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const upperDrive = (p) => p.replace(/^[a-z]:/, (d) => d.toUpperCase());
const cwd = upperDrive(process.cwd());
const bin = upperDrive(join(dirname(require.resolve("vitest/package.json")), "vitest.mjs"));

const result = spawnSync(process.execPath, [bin, ...process.argv.slice(2)], {
  cwd,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
