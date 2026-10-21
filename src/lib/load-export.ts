import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicExportSchema } from './schemas';
import type { PublicExport } from './schemas';

/**
 * Resolve the public-export.json path. Works in both dev (running from src/)
 * and build (running from dist/chunks/) modes by walking up to find the project root.
 */
function resolveExportPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));

  // Try relative to this file (dev mode: src/lib/)
  const devPath = join(here, '..', 'data', 'public-export.json');
  if (existsSync(devPath)) return devPath;

  // Try walking up to find src/data (build mode: dist/chunks/)
  let dir = here;
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, 'src', 'data', 'public-export.json');
    if (existsSync(candidate)) return candidate;
    dir = dirname(dir);
  }

  // Fallback to dev path for the error message
  return devPath;
}

/**
 * Load the public export at build time for Astro pages.
 * Throws if the export hasn't been generated yet.
 */
export function loadPublicExport(): PublicExport {
  const exportPath = resolveExportPath();
  try {
    const raw = readFileSync(exportPath, 'utf-8');
    return publicExportSchema.parse(JSON.parse(raw));
  } catch {
    throw new Error(
      'Public export not found. Run "npm run build:data" before building the site.',
    );
  }
}
