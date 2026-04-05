import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export const projectRoot = path.resolve(dirname, '..');

export function projectPath(...segments) {
  return path.join(projectRoot, ...segments);
}
